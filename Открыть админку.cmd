@echo off
start "" http://localhost:8124/admin/
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
