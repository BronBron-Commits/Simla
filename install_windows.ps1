param(
  [switch]$SkipNpmInstall,
  [switch]$NoLaunchers
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Require-Command {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [Parameter(Mandatory = $true)]
    [string]$InstallHint
  )

  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $command) {
    throw "Missing required command '$Name'. $InstallHint"
  }
  return $command
}

function Write-Launcher {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [Parameter(Mandatory = $true)]
    [string]$Content
  )

  Set-Content -Path $Path -Value $Content -Encoding Ascii
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Push-Location $repoRoot
try {
  Write-Host "Simla Windows installer" -ForegroundColor Cyan
  Write-Host "Repo root: $repoRoot"

  Require-Command -Name "node" -InstallHint "Install Node.js from https://nodejs.org/"
  Require-Command -Name "npm" -InstallHint "Install Node.js from https://nodejs.org/"

  $nodeVersion = (& node --version).Trim()
  $npmVersion = (& npm --version).Trim()
  Write-Host "Detected Node.js $nodeVersion"
  Write-Host "Detected npm $npmVersion"

  if (-not $SkipNpmInstall) {
    Write-Host "Running npm install..."
    & npm install
    if ($LASTEXITCODE -ne 0) {
      throw "npm install failed with exit code $LASTEXITCODE"
    }
  } else {
    Write-Host "Skipping npm install"
  }

  New-Item -ItemType Directory -Force -Path ".tmp" | Out-Null

  if (-not $NoLaunchers) {
    Write-Host "Writing Windows launchers..."

    Write-Launcher -Path (Join-Path $repoRoot "simla-run.cmd") -Content @"
@echo off
setlocal
cd /d "%~dp0"
node tools\run_js_vm.js %*
"@

    Write-Launcher -Path (Join-Path $repoRoot "simla-serve.cmd") -Content @"
@echo off
setlocal
cd /d "%~dp0"
node serve.js
"@

    Write-Launcher -Path (Join-Path $repoRoot "simla-repl.cmd") -Content @"
@echo off
setlocal
cd /d "%~dp0"
node simla.js
"@

    Write-Launcher -Path (Join-Path $repoRoot "simla-docs.cmd") -Content @"
@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0open_demo.ps1" docs.html "Simla Docs"
"@

    Write-Launcher -Path (Join-Path $repoRoot "simla-demo-voxel_world.cmd") -Content @"
@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0open_demo.ps1" voxel_world.html "Voxel World"
"@

    Write-Launcher -Path (Join-Path $repoRoot "simla-demo-sim3d.cmd") -Content @"
@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0open_demo.ps1" sim3d.html "Sim3D"
"@

    Write-Launcher -Path (Join-Path $repoRoot "simla-demo-rwx_viewer.cmd") -Content @"
@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0open_demo.ps1" rwx_viewer.html "RWX Viewer"
"@

    Write-Launcher -Path (Join-Path $repoRoot "simla-demo-first_person.cmd") -Content @"
@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0open_demo.ps1" simla3d_first_person.html "First Person Viewer"
"@
  }

  Write-Host ""
  Write-Host "Install complete." -ForegroundColor Green
  Write-Host "Next steps:"
  Write-Host "  .\simla-run.cmd examples\hello.sim"
  Write-Host "  .\simla-serve.cmd"
  Write-Host "  npm test   (best from Git Bash or WSL for the shell-based checks)"
}
finally {
  Pop-Location
}