"""WebSocket connection manager for real-time events."""
import asyncio
import json
from fastapi import WebSocket


class ConnectionManager:
    """Manages WebSocket connections per company."""

    def __init__(self):
        # company_id → set of websockets
        self._connections: dict[str, set[WebSocket]] = {}

    async def connect(self, company_id: str, ws: WebSocket):
        await ws.accept()
        if company_id not in self._connections:
            self._connections[company_id] = set()
        self._connections[company_id].add(ws)

    def disconnect(self, company_id: str, ws: WebSocket):
        if company_id in self._connections:
            self._connections[company_id].discard(ws)

    async def broadcast(self, company_id: str, event: dict):
        """Broadcast an event to all connections for a company."""
        if company_id not in self._connections:
            return
        dead = set()
        for ws in self._connections[company_id]:
            try:
                await ws.send_json(event)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self._connections[company_id].discard(ws)

    async def broadcast_all(self, event: dict):
        """Broadcast to ALL connected clients."""
        for company_id in list(self._connections.keys()):
            await self.broadcast(company_id, event)


# Singleton
ws_manager = ConnectionManager()
