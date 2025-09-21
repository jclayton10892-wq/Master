#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/mobile/field-ready-app"
if command -v node >/dev/null 2>&1; then
  echo "Node found: $(node -v)"
else
  echo "Node.js is required. Install LTS from https://nodejs.org/"
  exit 1
fi
npm install
npm run start
