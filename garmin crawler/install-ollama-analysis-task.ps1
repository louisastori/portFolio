param(
  [string]$TaskName = "GarminCrawlerOllama0015",
  [datetime]$RunAt = (Get-Date "00:15")
)

$ErrorActionPreference = "Stop"

$runnerPath = Join-Path $PSScriptRoot "run-nightly-ollama-analysis.ps1"
if (-not (Test-Path $runnerPath)) {
  throw "Runner script not found: $runnerPath"
}

$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$runnerPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At $RunAt
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal = New-ScheduledTaskPrincipal -UserId $currentUser -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null

Write-Host "Scheduled task '$TaskName' registered for $(Get-Date $RunAt -Format 'HH:mm') under $currentUser."
Write-Host "This task runs only while the user session is logged in, which matches the local Ollama + Garmin setup."
