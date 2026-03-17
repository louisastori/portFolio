param(
  [string]$NpmCommand = "npm.cmd",
  [string]$PhpCommand = "php"
)

$ErrorActionPreference = "Stop"

$crawlerDir = $PSScriptRoot
$projectRoot = (Resolve-Path (Join-Path $crawlerDir "..")).Path
$portfolioDir = Join-Path $projectRoot "portfolio\portFolio"
$logDir = Join-Path $crawlerDir "logs"
$logPath = Join-Path $logDir ("nightly-" + (Get-Date -Format "yyyy-MM-dd") + ".log")

New-Item -ItemType Directory -Path $logDir -Force | Out-Null
Start-Transcript -Path $logPath -Append | Out-Null

try {
  Write-Host "Nightly crawler start: $(Get-Date -Format s)"

  $env:GARMIN_CRAWLER_EXPORTS_PATH = Join-Path $crawlerDir "exports"

  Push-Location $crawlerDir
  try {
    Write-Host "Running Garmin crawler..."
    & $NpmCommand run crawl -- --activity-limit 50
    if ($LASTEXITCODE -ne 0) {
      throw "Crawler command failed with exit code $LASTEXITCODE."
    }
  } finally {
    Pop-Location
  }

  Push-Location $portfolioDir
  try {
    Write-Host "Exporting portfolio performance snapshot..."
    & $PhpCommand artisan performance:export-snapshot --live
    if ($LASTEXITCODE -ne 0) {
      throw "Snapshot export failed with exit code $LASTEXITCODE."
    }
  } finally {
    Pop-Location
  }

  Write-Host "Nightly crawler completed: $(Get-Date -Format s)"
} finally {
  Stop-Transcript | Out-Null
}
