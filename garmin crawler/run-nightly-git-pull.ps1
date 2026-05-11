param(
  [string]$GitCommand = "git"
)

$ErrorActionPreference = "Stop"

$crawlerDir = $PSScriptRoot
$projectRoot = (Resolve-Path (Join-Path $crawlerDir "..")).Path
$logDir = Join-Path $crawlerDir "logs"
$logPath = Join-Path $logDir ("git-pull-" + (Get-Date -Format "yyyy-MM-dd") + ".log")

New-Item -ItemType Directory -Path $logDir -Force | Out-Null
Start-Transcript -Path $logPath -Append | Out-Null

try {
  Write-Host "Nightly git pull start: $(Get-Date -Format s)"

  Push-Location $projectRoot
  try {
    & $GitCommand pull --ff-only
    if ($LASTEXITCODE -ne 0) {
      throw "Git pull failed with exit code $LASTEXITCODE."
    }
  } finally {
    Pop-Location
  }

  Write-Host "Nightly git pull completed: $(Get-Date -Format s)"
} finally {
  Stop-Transcript | Out-Null
}
