#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/backend/fastapi"
python3 -m venv .venv || true
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
# load .env if present
if [ -f .env ]; then export $(grep -v '^#' .env | xargs); fi
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
