# Run this script as Administrator

dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
wsl --install --no-distribution
wsl --set-default-version 2

Write-Host "WSL prerequisites configured. Please reboot Windows, then start Docker Desktop." -ForegroundColor Green
