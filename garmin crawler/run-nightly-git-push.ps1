param(
  [string]$GitCommand = "git",
  [string]$CommitMessage = ("chore: nightly crawler export " + (Get-Date -Format "yyyy-MM-dd")),
  [string[]]$IncludePaths = @(
    "garmin crawler/exports",
    "garmin crawler/logs",
    "portfolio/assets/data"
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

try {
  Write-Host "Nightly git push start: $(Get-Date -Format s)"

  Push-Location $projectRoot
  try {
    if ($AddAll) {
      & $GitCommand add -A
    } else {
      foreach ($path in $IncludePaths) {
        if (Test-Path $path) {
          & $GitCommand add -- $path
        } else {
          Write-Host "Skipping missing path: $path"
        }
      }
    }

    if ($LASTEXITCODE -ne 0) {
      throw "Git add failed with exit code $LASTEXITCODE."
    }

    & $GitCommand diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
      Write-Host "No generated changes to commit."
      return
    }

    & $GitCommand commit -m $CommitMessage
    if ($LASTEXITCODE -ne 0) {
      throw "Git commit failed with exit code $LASTEXITCODE."
    }

    & $GitCommand push
    if ($LASTEXITCODE -ne 0) {
      throw "Git push failed with exit code $LASTEXITCODE."
    }
  } finally {
    Pop-Location
  }

  Write-Host "Nightly git push completed: $(Get-Date -Format s)"
} finally {
  Stop-Transcript | Out-Null
}
