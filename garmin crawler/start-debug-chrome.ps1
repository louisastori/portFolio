param(
  [int]$Port = 9222,
  [string]$AutomationDir = "",
  [switch]$UseDefaultProfile,
  [switch]$NewProfile
)

$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"

if (-not (Test-Path $chromePath)) {
  throw "Chrome introuvable: $chromePath"
}

$debugUrl = "http://127.0.0.1:$Port/json/version"

if (-not $AutomationDir) {
  $AutomationDir = Join-Path $env:LOCALAPPDATA "Google\Chrome\User Data GarminCrawler"
}

try {
  $existing = Invoke-WebRequest -UseBasicParsing -Uri $debugUrl -TimeoutSec 2
  Write-Host "Chrome DevTools est deja disponible sur le port $Port."
  Write-Host $existing.Content
  exit 0
} catch {
}

if ($UseDefaultProfile) {
  Write-Host "Chrome 136+ ignore --remote-debugging-port sur le profil par defaut."
  Write-Host "Source officielle: https://developer.chrome.com/blog/remote-debugging-port"
  Write-Host "Utilise le profil dedie lance par `npm run chrome:debug`."
  exit 1
}

$arguments = @(
  "--remote-debugging-port=$Port",
  "--remote-allow-origins=*",
  "--user-data-dir=$AutomationDir"
)

New-Item -ItemType Directory -Path $AutomationDir -Force | Out-Null

$arguments += "https://connect.garmin.com/modern/"

Start-Process -FilePath $chromePath -ArgumentList $arguments

for ($attempt = 0; $attempt -lt 15; $attempt += 1) {
  Start-Sleep -Seconds 1

  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $debugUrl -TimeoutSec 2
    Write-Host "Chrome DevTools pret sur le port $Port."
    Write-Host $response.Content

    Write-Host "Le profil Chrome dedie a l'automatisation est: $AutomationDir"
    Write-Host "Connecte-toi a Garmin dans cette fenetre si necessaire. Ce profil sera reutilise aux prochains lancements."

    exit 0
  } catch {
  }
}

throw "Chrome s'est lance, mais le port DevTools $Port n'a pas repondu a temps."
