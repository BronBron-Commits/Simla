@echo off
setlocal
cd /d "%~dp0"
node tools\run_js_vm.js %*
