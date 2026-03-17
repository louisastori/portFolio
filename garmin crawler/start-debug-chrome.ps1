param(
  [string]$NpmCommand = "npm.cmd"
)

$ErrorActionPreference = "Stop"

Write-Host "Chrome remote debugging is no longer used by the Garmin crawler."
Write-Host "Opening the persistent Playwright browser profile instead..."

Push-Location $PSScriptRoot
try {
  & $NpmCommand run login
  if ($LASTEXITCODE -ne 0) {
    throw "Login helper failed with exit code $LASTEXITCODE."
  }
} finally {
  Pop-Location
}
