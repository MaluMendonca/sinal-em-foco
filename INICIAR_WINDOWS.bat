@echo off
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 goto python
py -3 iniciar.py
goto fim
:python
python iniciar.py
:fim
if errorlevel 1 echo Instale o Python 3 e tente novamente.
pause
