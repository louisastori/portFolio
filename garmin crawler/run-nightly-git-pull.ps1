param(
  [string]$GitCommand = "git",
  [switch]$NoStash
)

$ErrorActionPreference = "Stop"

$crawlerDir = $PSScriptRoot
$projectRoot = (Resolve-Path (Join-Path $crawlerDir "..")).Path
$logDir = Join-Path $crawlerDir "logs"
$logPath = Join-Path $logDir ("git-pull-" + (Get-Date -Format "yyyy-MM-dd") + ".log")

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

function Invoke-Git {
  param([string[]]$Arguments)

  & $GitCommand @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "git $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
  }
}

try {
  Write-Host "Nightly git pull start: $(Get-Date -Format s)"

  Push-Location $projectRoot
  try {
    $stashCreated = $false
    $statusOutput = & $GitCommand status --porcelain
    if ($statusOutput -and -not $NoStash) {
      $stashMessage = "nightly pre-pull autosave $(Get-Date -Format s)"
      Write-Host "Workspace is dirty, saving local changes before pull: $stashMessage"
      Invoke-Git @("stash", "push", "--include-untracked", "-m", $stashMessage)
      $stashCreated = $true
    } elseif ($statusOutput) {
      Write-AutomationAlert "Workspace is dirty and -NoStash was used; pull may fail."
    }

    try {
      Invoke-Git @("pull", "--ff-only")
    } catch {
      Write-AutomationAlert $_.Exception.Message
      throw
    }

    if ($stashCreated) {
      try {
        Invoke-Git @("stash", "pop")
      } catch {
        Write-AutomationAlert "Pull succeeded but restoring the pre-pull stash needs attention: $($_.Exception.Message)"
        throw
      }
    }
  } finally {
    Pop-Location
  }

  Write-Host "Nightly git pull completed: $(Get-Date -Format s)"
} finally {
  Stop-Transcript | Out-Null
}
