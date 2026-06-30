# IBKR Real-Time Portfolio Tracker

A full-stack portfolio tracker that connects to **Interactive Brokers** via the TWS API and streams live positions, account summary, and P&amp;L to a modern web dashboard.

![Stack](https://img.shields.io/badge/Python-FastAPI-009688) ![Stack](https://img.shields.io/badge/React-Vite-61DAFB) ![IBKR](https://img.shields.io/badge/IBKR-ib__async-1e40af)

## Features

- **Real-time updates** — WebSocket stream pushes portfolio changes as they happen
- **Live IBKR integration** — Uses [`ib_async`](https://github.com/ib-api-reloaded/ib_async) (maintained successor to ib_insync)
- **Account summary** — Net liquidation, cash, buying power, realized/unrealized/daily P&amp;L
- **Positions table** — Symbol, quantity, avg cost, market price, market value, P&amp;L
- **Multi-account support** — Switch between managed accounts
- **Demo mode** — Simulated portfolio for development without a live IBKR connection

## Architecture

```
┌─────────────┐     WebSocket      ┌──────────────┐     TWS API     ┌─────────────┐
│   React UI  │ ◄──────────────► │  FastAPI     │ ◄─────────────► │ TWS/Gateway │
│  (Vite)     │     REST           │  + ib_async  │   socket        │   (IBKR)    │
└─────────────┘                    └──────────────┘                 └─────────────┘
```

## Prerequisites

1. **Python 3.10+** and **Node.js 18+**
2. **IB Gateway** or **Trader Workstation (TWS)** with API enabled:
   - Configure → API → Settings → Enable ActiveX and Socket Clients
   - Add `127.0.0.1` to Trusted IPs
   - Check "Download open orders on connection"
   - Default ports: **7497** (TWS paper), **7496** (TWS live), **4001** (Gateway)

## Quick Start

### 1. Clone and configure

```bash
cp .env.example .env
# Edit .env — set DEMO_MODE=false when connecting to real IBKR
```

### 2. Start the app (recommended — single port)

```bash
cd frontend && npm install && npm run build
cd ../backend
pip install -r requirements.txt
DEMO_MODE=true python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Open **http://localhost:8000** — the UI, API, and WebSocket all run on one port.

### Alternative: separate dev servers

```bash
# Terminal 1 — Backend
cd backend && DEMO_MODE=true python3 -m uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend (proxies /api and /ws to backend)
cd frontend && npm run dev
```

Open **http://localhost:5173** in your browser.

### Connect to live IBKR

1. Start IB Gateway or TWS and log in
2. Set `DEMO_MODE=false` in `.env` (or pass env var)
3. Restart the backend
4. In the dashboard, click **Connect to IBKR** and enter your host/port/client ID

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `IB_HOST` | `127.0.0.1` | TWS/Gateway host |
| `IB_PORT` | `7497` | API socket port |
| `IB_CLIENT_ID` | `1` | Unique client ID per connection |
| `IB_READONLY` | `true` | Read-only API mode |
| `DEMO_MODE` | `false` | Use simulated portfolio data |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed frontend origins |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/status` | Connection status |
| `POST` | `/api/connect` | Connect to IBKR |
| `POST` | `/api/disconnect` | Disconnect |
| `POST` | `/api/account/{account}` | Switch active account |
| `GET` | `/api/portfolio` | Current portfolio snapshot |
| `WS` | `/ws/portfolio` | Real-time portfolio stream |

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app & routes
│   │   ├── ibkr_service.py   # IBKR connection & event handling
│   │   ├── models.py         # Pydantic schemas
│   │   ├── ws_manager.py     # WebSocket broadcast manager
│   │   └── config.py         # Settings
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/       # UI components
│   │   └── hooks/            # usePortfolio WebSocket hook
│   └── package.json
└── .env.example
```

## Disclaimer

This project is not affiliated with Interactive Brokers. Use at your own risk. Always test with a paper trading account first.
