param(
  [string]$NpmCommand = "npm.cmd",
  [string]$OllamaCommand = "ollama.exe",
  [string]$OllamaModel = $env:OLLAMA_MODEL,
  [string[]]$FallbackModels = @("gemma3:4b", "phi3:mini", "llama3.2:3b")
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

function Write-AutomationAlert {
  param([string]$Message)

  Write-Warning $Message
  try {
    & msg.exe $env:USERNAME "Garmin nightly automation: $Message" 2>$null
  } catch {
    Write-Host "Desktop notification unavailable: $($_.Exception.Message)"
  }
}

function Get-OllamaModels {
  try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 10
    return @($response.models | ForEach-Object { $_.name } | Where-Object { $_ })
  } catch {
    return @()
  }
}

function Ensure-OllamaModel {
  $availableModels = @(Get-OllamaModels)
  if ($OllamaModel -and ($availableModels -contains $OllamaModel)) {
    return $OllamaModel
  }

  foreach ($model in $FallbackModels) {
    if ($availableModels -contains $model) {
      return $model
    }
  }

  $modelToPull = if ($OllamaModel) { $OllamaModel } else { $FallbackModels[0] }
  if (-not $modelToPull) {
    throw "No Ollama model configured and no fallback models are available."
  }

  Write-Host "No suitable Ollama model found locally, pulling $modelToPull..."
  & $OllamaCommand pull $modelToPull
  if ($LASTEXITCODE -ne 0) {
    throw "Ollama model pull failed with exit code $LASTEXITCODE."
  }

  return $modelToPull
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
      $message = "Ollama API did not become ready on http://127.0.0.1:11434 within 60 seconds."
      Write-AutomationAlert $message
      throw $message
    }
  }

  $resolvedModel = Ensure-OllamaModel
  $env:OLLAMA_MODEL = $resolvedModel
  Write-Host "Using Ollama model: $resolvedModel"

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
