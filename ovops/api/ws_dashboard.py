import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ovops.simulator.fault_generator import telemetry_sim

router = APIRouter(tags=["WebSocket实时大屏"])

@router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """WebSocket 全双工推流：每秒向前端广播工业时序数据"""
    await websocket.accept()
    try:
        while True:
            tick = telemetry_sim.sample_tick()
            await websocket.send_text(json.dumps(tick, ensure_ascii=False))
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[WS] 连接断开: {e}")
