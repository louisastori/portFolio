param(
  [string]$NpmCommand = "npm.cmd",
  [string]$OllamaCommand = "ollama.exe"
)

$ErrorActionPreference = "Stop"

function Wait-OllamaReady {
  param(
    [int]$TimeoutSeconds = 60
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 5
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
        return $true
      }
    } catch {
      Start-Sleep -Seconds 2
    }
  }

  return $false
}

$crawlerDir = $PSScriptRoot
$logDir = Join-Path $crawlerDir "logs"
$logPath = Join-Path $logDir ("ollama-analysis-" + (Get-Date -Format "yyyy-MM-dd") + ".log")

New-Item -ItemType Directory -Path $logDir -Force | Out-Null
Start-Transcript -Path $logPath -Append | Out-Null

try {
  Write-Host "Nightly Ollama analysis start: $(Get-Date -Format s)"

  if (-not (Wait-OllamaReady -TimeoutSeconds 5)) {
    Write-Host "Ollama API not ready, starting local server..."
    Start-Process -FilePath $OllamaCommand -ArgumentList "serve" -WindowStyle Hidden | Out-Null

    if (-not (Wait-OllamaReady -TimeoutSeconds 60)) {
      throw "Ollama API did not become ready on http://127.0.0.1:11434 within 60 seconds."
    }
  }

  Push-Location $crawlerDir
  try {
    & $NpmCommand run analyze
    if ($LASTEXITCODE -ne 0) {
      throw "Ollama analysis failed with exit code $LASTEXITCODE."
    }
  } finally {
    Pop-Location
  }

  Write-Host "Nightly Ollama analysis completed: $(Get-Date -Format s)"
} finally {
  Stop-Transcript | Out-Null
}
