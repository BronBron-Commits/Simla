param(
  [string]$Configuration = "Release"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-MsiProductVersion {
  param(
    [Parameter(Mandatory = $true)]
    [string]$BaseVersion
  )

  $parsedVersion = [Version]$BaseVersion
  $installerMajor = [Math]::Min($parsedVersion.Major, 255)
  $utcNow = [DateTime]::UtcNow
  $installerMinor = $utcNow.Year - 2000
  $installerBuild = (($utcNow.DayOfYear - 1) * 144) + [int][Math]::Floor($utcNow.TimeOfDay.TotalMinutes / 10)

  if ($installerMinor -gt 255) {
    throw "Computed installer minor version $installerMinor exceeds MSI limits."
  }

  if ($installerBuild -gt 65535) {
    throw "Computed installer build version $installerBuild exceeds MSI limits."
  }

  return "$installerMajor.$installerMinor.$installerBuild"
}

$installerRoot = $PSScriptRoot
$repoRoot = Split-Path -Parent $installerRoot
$launcherProject = Join-Path $repoRoot "launcher\SimlaLauncher\SimlaLauncher.csproj"
$launcherOutput = Join-Path $installerRoot "generated\launcher"
$brandingScript = Join-Path $installerRoot "generate_branding_assets.ps1"
$generatedFragment = Join-Path $installerRoot "generated\RepoFiles.wxs"
$outputRoot = Join-Path $installerRoot "out"

if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
  throw "dotnet SDK is required to build the MSI. Install .NET SDK 8+ and rerun npm run build:msi."
}

$package = Get-Content (Join-Path $repoRoot "package.json") | ConvertFrom-Json
$productVersion = Get-MsiProductVersion -BaseVersion ([string]$package.version)
New-Item -ItemType Directory -Force -Path $launcherOutput | Out-Null

& dotnet publish $launcherProject -c Release -r win-x64 "-p:PublishSingleFile=true" "-p:SelfContained=true" "-p:EnableCompressionInSingleFile=true" "-p:DebugType=None" "-p:DebugSymbols=false" -o $launcherOutput
if ($LASTEXITCODE -ne 0) {
  throw "Failed to publish the native Simla launcher app."
}

$launcherExe = Join-Path $launcherOutput "SimlaLauncher.exe"
if (-not (Test-Path $launcherExe)) {
  throw "Native launcher publish completed but SimlaLauncher.exe was not found."
}

& powershell -NoProfile -ExecutionPolicy Bypass -File $brandingScript
if ($LASTEXITCODE -ne 0) {
  throw "Failed to generate the installer branding assets."
}

& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $installerRoot "generate_msi_fragment.ps1") -OutputPath $generatedFragment
if ($LASTEXITCODE -ne 0) {
  throw "Failed to generate the MSI file manifest."
}

New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null

& dotnet build (Join-Path $installerRoot "SimlaInstaller.wixproj") -c $Configuration "-p:RepoRoot=$repoRoot" "-p:ProductVersion=$productVersion" "-p:OutputPath=$outputRoot\"
if ($LASTEXITCODE -ne 0) {
  throw "MSI build failed."
}

Write-Host "Installer version: $productVersion" -ForegroundColor Cyan

$msi = Get-ChildItem -Path $outputRoot -Filter *.msi -Recurse | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
if (-not $msi) {
  throw "Build completed but no MSI was produced under $outputRoot."
}

Write-Host "MSI ready: $($msi.FullName)" -ForegroundColor Green