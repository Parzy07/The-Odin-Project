#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
  echo "==> Loaded config from .env"
fi

command -v node >/dev/null || { echo "Error: Node.js required. Install from https://nodejs.org"; exit 1; }
command -v python3 >/dev/null || { echo "Error: Python 3 required."; exit 1; }

echo "==> Building frontend..."
cd "$ROOT/frontend"
npm install
npm run build

echo "==> Installing backend deps..."
cd "$ROOT/backend"
python3 -m pip install -r requirements.txt -q

export DEMO_MODE="${DEMO_MODE:-true}"
export BIND_HOST="${BIND_HOST:-0.0.0.0}"
export BIND_PORT="${BIND_PORT:-8000}"
export IB_HOST="${IB_HOST:-127.0.0.1}"

echo ""
echo "=========================================="
echo "  IBKR Portfolio Tracker (local)"
echo "=========================================="
echo "  Open in browser:  http://localhost:${BIND_PORT}"
echo "  Demo mode:        ${DEMO_MODE}"
echo "  IBKR host:        ${IB_HOST}:${IB_PORT:-7497}"
echo "  Press Ctrl+C to stop"
echo "=========================================="
echo ""

cd "$ROOT/backend"
python3 -m uvicorn app.main:app --host "$BIND_HOST" --port "$BIND_PORT"
