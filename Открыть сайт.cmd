@echo off
start "" http://localhost:8124/
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
