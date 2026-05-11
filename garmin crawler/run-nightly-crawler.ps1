param(
  [string]$NpmCommand = "npm.cmd",
  [string]$NodeCommand = "node",
  [string]$PhpCommand = "php"
)

$ErrorActionPreference = "Stop"

$crawlerDir = $PSScriptRoot
$projectRoot = (Resolve-Path (Join-Path $crawlerDir "..")).Path
$portfolioSummaryScript = Join-Path $projectRoot "portfolio\scripts\build-garmin-summary.js"
$legacyPortfolioDir = Join-Path $projectRoot "portfolio\portFolio"
$logDir = Join-Path $crawlerDir "logs"
$logPath = Join-Path $logDir ("nightly-" + (Get-Date -Format "yyyy-MM-dd") + ".log")

New-Item -ItemType Directory -Path $logDir -Force | Out-Null
Start-Transcript -Path $logPath -Append | Out-Null

function Write-AutomationAlert {
  param([string]$Message)

  Write-Warning $Message
  try {
    & msg.exe $env:USERNAME "Garmin nightly automation: $Message" 2>$null
  } catch {
    Write-Host "Desktop notification unavailable: $($_.Exception.Message)"
  }
}

function Invoke-CommandChecked {
  param(
    [string]$Command,
    [string[]]$Arguments,
    [string]$FailureMessage
  )

  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$FailureMessage Exit code: $LASTEXITCODE."
  }
}

try {
  try {
    Write-Host "Nightly crawler start: $(Get-Date -Format s)"

    $env:GARMIN_CRAWLER_EXPORTS_PATH = Join-Path $crawlerDir "exports"

    Push-Location $crawlerDir
    try {
      Write-Host "Running Garmin crawler..."
      Invoke-CommandChecked -Command $NpmCommand -Arguments @("run", "crawl", "--", "--activity-limit", "50") -FailureMessage "Crawler command failed."
    } finally {
      Pop-Location
    }

    Write-Host "Exporting portfolio performance snapshot..."
    if (Test-Path $portfolioSummaryScript) {
      Invoke-CommandChecked -Command $NodeCommand -Arguments @($portfolioSummaryScript) -FailureMessage "Portfolio Garmin summary build failed."
    } elseif (Test-Path $legacyPortfolioDir) {
      Push-Location $legacyPortfolioDir
      try {
        Invoke-CommandChecked -Command $PhpCommand -Arguments @("artisan", "performance:export-snapshot", "--live") -FailureMessage "Legacy snapshot export failed."
      } finally {
        Pop-Location
      }
    } else {
      throw "No portfolio export path found. Missing $portfolioSummaryScript and $legacyPortfolioDir."
    }

    Push-Location $crawlerDir
    try {
      Invoke-CommandChecked -Command $NpmCommand -Arguments @("run", "validate:nightly") -FailureMessage "Nightly output validation failed."
    } finally {
      Pop-Location
    }

    Write-Host "Nightly crawler completed: $(Get-Date -Format s)"
  } catch {
    Write-AutomationAlert $_.Exception.Message
    throw
  }
} finally {
  Stop-Transcript | Out-Null
}
