import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.ibkr_service import ibkr_service
from app.models import ConnectionConfig
from app.ws_manager import ws_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.demo_mode:
        await ibkr_service.connect()
    yield
    if ibkr_service.connected:
        await ibkr_service.disconnect()


app = FastAPI(
    title="IBKR Portfolio Tracker",
    description="Real-time portfolio tracking via Interactive Brokers API",
    version="1.0.0",
    lifespan=lifespan,
)

origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/status")
async def get_status():
    return ibkr_service.get_status()


@app.post("/api/connect")
async def connect(config: ConnectionConfig | None = None):
    return await ibkr_service.connect(config)


@app.post("/api/disconnect")
async def disconnect():
    return await ibkr_service.disconnect()


@app.post("/api/account/{account}")
async def set_account(account: str):
    return await ibkr_service.set_active_account(account)


@app.get("/api/portfolio")
async def get_portfolio():
    return await ibkr_service.get_snapshot()


@app.websocket("/ws/portfolio")
async def portfolio_websocket(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        snapshot = await ibkr_service.get_snapshot()
        await websocket.send_json(snapshot.model_dump())
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await ws_manager.disconnect(websocket)
