"""WebSocket routes."""
import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.ws.manager import ws_manager

router = APIRouter()


@router.websocket("/ws/{company_id}")
async def company_ws(company_id: str, ws: WebSocket):
    """WebSocket for real-time company events.
    
    Events sent to client:
    - {"type": "trade", "data": {...}}
    - {"type": "message", "data": {"from": "strategist", "to": "risk_officer", ...}}
    - {"type": "equity_update", "data": {"equity": 100000, "pnl": 0}}
    - {"type": "skill_status", "data": {"role": "strategist", "status": "active", ...}}
    - {"type": "log", "data": {"role": "strategist", "level": "info", "message": "..."}}
    """
    await ws_manager.connect(company_id, ws)
    try:
        # Send initial connection event
        await ws.send_json({"type": "connected", "data": {"company_id": company_id}})

        # Keep connection alive + handle pings
        while True:
            data = await asyncio.wait_for(ws.receive_text(), timeout=30)
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await ws.send_json({"type": "pong"})
            except json.JSONDecodeError:
                pass

    except asyncio.TimeoutError:
        # Send heartbeat on timeout
        try:
            await ws.send_json({"type": "heartbeat"})
        except Exception:
            ws_manager.disconnect(company_id, ws)

    except WebSocketDisconnect:
        ws_manager.disconnect(company_id, ws)
