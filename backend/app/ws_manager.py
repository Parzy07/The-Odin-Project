import asyncio
import json
from typing import Any

from fastapi import WebSocket


class WebSocketManager:
    def __init__(self) -> None:
        self._clients: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._clients.add(websocket)

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._clients.discard(websocket)

    async def broadcast(self, payload: dict[str, Any]) -> None:
        if not self._clients:
            return

        message = json.dumps(payload, default=str)
        dead: list[WebSocket] = []

        async with self._lock:
            clients = list(self._clients)

        for client in clients:
            try:
                await client.send_text(message)
            except Exception:
                dead.append(client)

        if dead:
            async with self._lock:
                for client in dead:
                    self._clients.discard(client)

    @property
    def client_count(self) -> int:
        return len(self._clients)


ws_manager = WebSocketManager()
