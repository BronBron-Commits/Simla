# Simla MSI Builder

This folder contains a WiX-based MSI packaging path for Simla.

## Goal

Build a classic Windows Setup wizard that installs Simla into `Program Files`, adds Start Menu shortcuts, and lays down the repo files needed to run the local server, REPL, and sample programs.

## Prerequisites

* Node.js installed
* .NET SDK 8 or newer

The build uses `WixToolset.Sdk` through `dotnet build`.

## Build

From the repo root:

```powershell
npm run build:msi
```

To build a GitHub-release-ready package instead:

```powershell
npm run build:release
```

Or directly:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\installer\build_msi.ps1
```

## Output

The generated MSI is written under `installer/out/`.

The GitHub release package path writes a versioned MSI, zip bundle, and SHA256 checksums under `installer/out/release/`.

## Notes

* The MSI expects Node.js to already be installed.
* The UI uses the standard WiX install directory wizard for an intentionally classic Windows installer feel.
* The file payload is harvested from tracked repo files plus the generated Windows launcher scripts.
* The release package is intended for upload as GitHub Release assets.