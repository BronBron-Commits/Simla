param(
  [Parameter(Mandatory = $true)]
  [string]$Page,
  [string]$Title = "Simla Demo"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$uri = "http://localhost:8080/$Page"
$serveCommand = 'cd /d "' + $repoRoot + '" && node serve.js'

function Test-SimlaServer {
  try {
    Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 2 | Out-Null
    return $true
  }
  catch {
    return $false
  }
}

if (-not (Test-SimlaServer)) {
  Start-Process -FilePath "cmd.exe" -ArgumentList "/k", $serveCommand -WindowStyle Normal -WorkingDirectory $repoRoot | Out-Null
  for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 500
    if (Test-SimlaServer) {
      break
    }
  }
}

if (-not (Test-SimlaServer)) {
  throw "Simla server did not become ready in time. Start simla-serve.cmd manually and then open $uri"
}

Write-Host "Opening $Title at $uri"
Start-Process $uri | Out-Null