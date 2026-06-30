#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "==> Building frontend..."
cd "$ROOT/frontend"
npm install --silent
npm run build

echo "==> Installing backend deps..."
cd "$ROOT/backend"
pip install -r requirements.txt -q

echo "==> Starting server on http://localhost:8000"
echo "    Open in your laptop browser: http://localhost:8000"
echo "    Press Ctrl+C to stop"
echo ""

export DEMO_MODE="${DEMO_MODE:-true}"
export BIND_HOST="${BIND_HOST:-0.0.0.0}"
export BIND_PORT="${BIND_PORT:-8000}"
export IB_HOST="${IB_HOST:-127.0.0.1}"

python3 -m uvicorn app.main:app --host "$BIND_HOST" --port "$BIND_PORT"
