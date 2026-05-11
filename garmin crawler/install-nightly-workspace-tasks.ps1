param(
  [datetime]$PullAt = (Get-Date "00:00"),
  [datetime]$CrawlerAt = (Get-Date "00:15"),
  [datetime]$OllamaAt = (Get-Date "00:25"),
  [datetime]$PushAt = (Get-Date "00:30"),
  [switch]$SkipOllama
)

$ErrorActionPreference = "Stop"

function Register-InteractiveDailyTask {
  param(
    [string]$TaskName,
    [string]$RunnerPath,
    [datetime]$RunAt,
    [string]$Description
  )

  if (-not (Test-Path $RunnerPath)) {
    throw "Runner script not found: $RunnerPath"
  }

  $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
  $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$RunnerPath`""
  $trigger = New-ScheduledTaskTrigger -Daily -At $RunAt
  $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
  $principal = New-ScheduledTaskPrincipal -UserId $currentUser -LogonType Interactive -RunLevel Limited

  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description $Description -Force | Out-Null

  Write-Host "Scheduled task '$TaskName' registered for $(Get-Date $RunAt -Format 'HH:mm') under $currentUser."
}

$pullRunner = Join-Path $PSScriptRoot "run-nightly-git-pull.ps1"
$crawlerRunner = Join-Path $PSScriptRoot "run-nightly-crawler.ps1"
$ollamaRunner = Join-Path $PSScriptRoot "run-nightly-ollama-analysis.ps1"
$pushRunner = Join-Path $PSScriptRoot "run-nightly-git-push.ps1"

Register-InteractiveDailyTask -TaskName "WorkspaceGitPull0000" -RunnerPath $pullRunner -RunAt $PullAt -Description "Pull the workspace before the nightly Garmin crawler."
Register-InteractiveDailyTask -TaskName "GarminCrawler0015" -RunnerPath $crawlerRunner -RunAt $CrawlerAt -Description "Run the nightly Garmin crawler."

if (-not $SkipOllama) {
  Register-InteractiveDailyTask -TaskName "GarminCrawlerOllama0025" -RunnerPath $ollamaRunner -RunAt $OllamaAt -Description "Run Ollama analysis after the Garmin crawl."
}

Register-InteractiveDailyTask -TaskName "WorkspaceGitPush0030" -RunnerPath $pushRunner -RunAt $PushAt -Description "Commit and push generated nightly crawler outputs."

Write-Host "Nightly workspace sequence registered: pull 00:00, crawler 00:15, push 00:30."
if (-not $SkipOllama) {
  Write-Host "Ollama analysis is registered at $(Get-Date $OllamaAt -Format 'HH:mm') between crawler and push."
}
