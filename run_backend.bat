@echo off
cd /d "%~dp0backend\fastapi"
python -m venv .venv
call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
if exist .env for /f "usebackq tokens=1,2 delims==" %%a in (`findstr /v "^#" .env`) do set %%a=%%b
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
