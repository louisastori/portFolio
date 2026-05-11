param(
  [string]$GitCommand = "git",
  [string]$NpmCommand = "npm.cmd",
  [string]$CommitMessage = ("chore: nightly crawler export " + (Get-Date -Format "yyyy-MM-dd")),
  [string[]]$IncludePaths = @(
    "garmin crawler/exports",
    "garmin crawler/logs",
    "portfolio/assets/data",
    "projetHome/data",
    "projetHome/runtime"
  ),
  [switch]$AddAll
)

$ErrorActionPreference = "Stop"

$crawlerDir = $PSScriptRoot
$projectRoot = (Resolve-Path (Join-Path $crawlerDir "..")).Path
$logDir = Join-Path $crawlerDir "logs"
$logPath = Join-Path $logDir ("git-push-" + (Get-Date -Format "yyyy-MM-dd") + ".log")

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

function Invoke-Git {
  param([string[]]$Arguments)

  Invoke-CommandChecked -Command $GitCommand -Arguments $Arguments -FailureMessage "git $($Arguments -join ' ') failed."
}

function Test-HasStagedChanges {
  & $GitCommand diff --cached --quiet
  if ($LASTEXITCODE -eq 0) {
    return $false
  }

  if ($LASTEXITCODE -eq 1) {
    return $true
  }

  throw "git diff --cached --quiet failed with exit code $LASTEXITCODE."
}

try {
  Write-Host "Nightly git push start: $(Get-Date -Format s)"

  Push-Location $projectRoot
  try {
    Push-Location $crawlerDir
    try {
      Invoke-CommandChecked -Command $NpmCommand -Arguments @("run", "test") -FailureMessage "Crawler syntax checks failed."
      Invoke-CommandChecked -Command $NpmCommand -Arguments @("run", "validate:nightly") -FailureMessage "Nightly output validation failed."
    } finally {
      Pop-Location
    }

    try {
      Invoke-Git @("pull", "--rebase", "--autostash")
    } catch {
      Write-AutomationAlert "Pre-push pull/rebase failed: $($_.Exception.Message)"
      throw
    }

    if ($AddAll) {
      Invoke-Git @("add", "-A")
    } else {
      foreach ($path in $IncludePaths) {
        if (Test-Path $path) {
          Invoke-Git @("add", "--", $path)
        } else {
          Write-Host "Skipping missing path: $path"
        }
      }
    }

    if (-not (Test-HasStagedChanges)) {
      Write-Host "No generated changes to commit."
      return
    }

    Invoke-Git @("commit", "-m", $CommitMessage)

    try {
      Invoke-Git @("push")
    } catch {
      Write-AutomationAlert "Initial push failed, retrying after pull --rebase --autostash."
      Invoke-Git @("pull", "--rebase", "--autostash")
      Invoke-Git @("push")
    }
  } finally {
    Pop-Location
  }

  Write-Host "Nightly git push completed: $(Get-Date -Format s)"
} finally {
  Stop-Transcript | Out-Null
}
