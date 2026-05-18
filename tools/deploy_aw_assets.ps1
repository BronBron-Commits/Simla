param(
  [Parameter(Mandatory = $true)]
  [string]$User,

  [string]$Server = "78.138.31.143",
  [string]$RemoteDir = "/var/www/html/aw/"
)

$ErrorActionPreference = "Stop"

$localDir = Join-Path $PSScriptRoot "..\aw"
$localDir = [System.IO.Path]::GetFullPath($localDir)

if (-not (Test-Path $localDir)) {
  throw "Local aw folder not found: $localDir"
}

# Build a staging folder with the correct AW 6.2 layout:
#   models/  <- ZIP files, each containing the .rwx
#   textures/ <- JPG/PNG files directly
$staging = Join-Path $env:TEMP "aw_deploy_staging"
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path "$staging\models" | Out-Null
New-Item -ItemType Directory -Path "$staging\textures" | Out-Null

# Zip each .rwx into models/<name>.zip
foreach ($rwx in Get-ChildItem "$localDir\*.rwx") {
  $zipPath = "$staging\models\$($rwx.BaseName).zip"
  Compress-Archive -Path $rwx.FullName -DestinationPath $zipPath -Force
  Write-Host "  Packed $($rwx.Name) -> models/$($rwx.BaseName).zip"
}

# Copy textures
foreach ($tex in Get-ChildItem "$localDir\textures\*" -File -ErrorAction SilentlyContinue) {
  Copy-Item $tex.FullName "$staging\textures\$($tex.Name)"
  Write-Host "  Copied textures/$($tex.Name)"
}

Write-Host "Uploading to ${User}@${Server}:${RemoteDir}"
scp -r "$staging\*" "${User}@${Server}:${RemoteDir}"
if ($LASTEXITCODE -ne 0) {
  throw "SCP upload failed with exit code $LASTEXITCODE"
}

# Ensure nginx can traverse directories and read uploaded files.
$remoteBase = $RemoteDir.TrimEnd("/")
$permCmd = @(
  "chmod 755 '$remoteBase' '$remoteBase/models' '$remoteBase/textures'",
  "chmod 644 '$remoteBase/models'/*.zip '$remoteBase/textures'/* '$remoteBase'/*.rwx '$remoteBase'/*.glb 2>/dev/null || true"
) -join "; "

ssh "${User}@${Server}" $permCmd
if ($LASTEXITCODE -ne 0) {
  throw "Remote permission fix failed with exit code $LASTEXITCODE"
}

Remove-Item $staging -Recurse -Force

Write-Host "Upload complete."
Write-Host "Verify: http://$Server/aw/models/aw_beacon.zip"
Write-Host "Object Path: http://$Server/aw/"
