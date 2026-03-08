# Launch from non-admin shell. A UAC prompt will ask for elevation.
$scriptPath = (Resolve-Path ".\scripts\enable-docker-prereqs.ps1").Path
$argList = "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
Start-Process -FilePath "powershell.exe" -Verb RunAs -ArgumentList $argList
