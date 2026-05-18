@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0open_demo.ps1" rwx_viewer.html "RWX Viewer"
