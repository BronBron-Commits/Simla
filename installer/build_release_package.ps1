param(
  [string]$Configuration = "Release",
  [string]$ReleaseVersion = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-NormalizedReleaseVersion {
  param(
    [Parameter(Mandatory = $true)]
    [string]$VersionText
  )

  $trimmed = $VersionText.Trim()
  if ([string]::IsNullOrWhiteSpace($trimmed)) {
    throw "ReleaseVersion cannot be empty."
  }

  if ($trimmed.StartsWith("v", [System.StringComparison]::OrdinalIgnoreCase)) {
    $trimmed = $trimmed.Substring(1)
  }

  return $trimmed
}

function New-ReleaseReadme {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ReleaseTag,
    [Parameter(Mandatory = $true)]
    [string]$MsiName
  )

  @"
Simla Windows Release Package
=============================

Release: $ReleaseTag

Contents:
- $MsiName
- release-manifest.json

Install:
1. Install Node.js first: https://nodejs.org/
2. Run the MSI.
3. Use the installed Simla Launcher from the Start Menu or desktop shortcut if selected.

Notes:
- This package contains the Windows x64 MSI build for Simla.
- The installer includes the native Simla Launcher and demo entrypoints.
"@
}

$installerRoot = $PSScriptRoot
$repoRoot = Split-Path -Parent $installerRoot
$package = Get-Content (Join-Path $repoRoot "package.json") | ConvertFrom-Json
$resolvedReleaseVersion = if ([string]::IsNullOrWhiteSpace($ReleaseVersion)) { [string]$package.version } else { $ReleaseVersion }
$normalizedVersion = Get-NormalizedReleaseVersion -VersionText $resolvedReleaseVersion
$releaseTag = "v$normalizedVersion"

& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $installerRoot "build_msi.ps1") -Configuration $Configuration
if ($LASTEXITCODE -ne 0) {
  throw "Failed to build the MSI before packaging the release assets."
}

$msi = Get-ChildItem -Path (Join-Path $installerRoot "out") -Filter *.msi -Recurse |
  Sort-Object LastWriteTimeUtc -Descending |
  Select-Object -First 1
if (-not $msi) {
  throw "No MSI was found under installer/out after the build completed."
}

$releaseRoot = Join-Path $installerRoot "out\release"
$artifactBase = "Simla-windows-x64-$releaseTag"
$stagingRoot = Join-Path $releaseRoot $artifactBase
$packagedMsiName = "$artifactBase.msi"
$packagedMsiPath = Join-Path $releaseRoot $packagedMsiName
$zipPath = Join-Path $releaseRoot "$artifactBase.zip"
$checksumPath = Join-Path $releaseRoot "$artifactBase-SHA256SUMS.txt"
$manifestPath = Join-Path $stagingRoot "release-manifest.json"
$readmePath = Join-Path $stagingRoot "README.txt"

New-Item -ItemType Directory -Force -Path $releaseRoot | Out-Null
if (Test-Path $stagingRoot) {
  Remove-Item -Path $stagingRoot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $stagingRoot | Out-Null

Copy-Item -Path $msi.FullName -Destination $packagedMsiPath -Force
Copy-Item -Path $msi.FullName -Destination (Join-Path $stagingRoot $packagedMsiName) -Force

$manifest = [ordered]@{
  name = "Simla"
  releaseTag = $releaseTag
  releaseVersion = $normalizedVersion
  generatedAtUtc = [DateTime]::UtcNow.ToString("o")
  platform = "windows-x64"
  installer = $packagedMsiName
  prerequisites = @(
    "Node.js installed"
  )
  uploadFiles = @(
    $packagedMsiName,
    (Split-Path -Leaf $zipPath),
    (Split-Path -Leaf $checksumPath)
  )
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content -Path $manifestPath -Encoding Ascii

Set-Content -Path $readmePath -Value (New-ReleaseReadme -ReleaseTag $releaseTag -MsiName $packagedMsiName) -Encoding Ascii

if (Test-Path $zipPath) {
  Remove-Item -Path $zipPath -Force
}
Compress-Archive -Path (Join-Path $stagingRoot "*") -DestinationPath $zipPath -CompressionLevel Optimal -Force

$msiHash = Get-FileHash -Path $packagedMsiPath -Algorithm SHA256
$zipHash = Get-FileHash -Path $zipPath -Algorithm SHA256
$checksumLines = @(
  "$($msiHash.Hash) *$($packagedMsiName)",
  "$($zipHash.Hash) *$(Split-Path -Leaf $zipPath)"
)
Set-Content -Path $checksumPath -Value $checksumLines -Encoding Ascii

Write-Host "GitHub release package ready:" -ForegroundColor Green
Write-Host "  MSI: $packagedMsiPath"
Write-Host "  ZIP: $zipPath"
Write-Host "  SHA256: $checksumPath"