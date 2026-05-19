#!/usr/bin/env pwsh
# Upload everythingtextureddragon3.rwx to VPS

param(
  [Parameter(Mandatory = $false)]
  [string]$User = "root",
  [string]$Server = "78.138.31.143",
  [string]$RemoteDir = "/var/www/html/aw/"
)

$ErrorActionPreference = "Stop"

$rwxFile = "c:\Projects\Simla\aw\everythingtextureddragon3.rwx"

if (-not (Test-Path $rwxFile)) {
  throw "RWX file not found: $rwxFile"
}

$fileSize = [math]::Round((Get-Item $rwxFile).Length / 1MB, 1)
Write-Host ([string]::Format("Uploading everythingtextureddragon3.rwx ({0} MB) to {1}@{2}:{3}", $fileSize, $User, $Server, $RemoteDir))

# Upload RWX file directly
scp "$rwxFile" "${User}@${Server}:${RemoteDir}everythingtextureddragon3.rwx"

if ($LASTEXITCODE -eq 0) {
  Write-Host "Upload successful!"
  Write-Host "URL: http://${Server}/aw/everythingtextureddragon3.rwx"
} else {
  throw "SCP upload failed with exit code $LASTEXITCODE"
}
