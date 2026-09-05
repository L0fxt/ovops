from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any
from ovops.agent.graph import ovops_graph
from ovops.simulator.fault_generator import telemetry_sim
from ovops.tools.erp_tools import approve_work_order, get_all_work_orders, query_equipment_ledger, query_spare_parts_inventory
from ovops.channels.base import channel_mgr
import sqlite3
from config.settings import settings

router = APIRouter(prefix="/api/agent", tags=["智能运维Agent"])

class TriggerRequest(BaseModel):
    equipment_id: str = "P-201"

class ApproveRequest(BaseModel):
    order_no: str
    note: Optional[str] = "现场技师已在协同端一键核准维保排程并预扣备件"

@router.post("/trigger")
def trigger_agent_investigation(req: TriggerRequest):
    """触发 LangGraph 智能体全链路研判（异动捕获 -> 机理核算 -> 规程匹配 -> ERP穿透 -> 任务拆解 -> 钉飞卡片）"""
    tick = telemetry_sim.sample_tick()
    snapshot = tick["p201"] if req.equipment_id == "P-201" else tick["v102"]
    
    init_state = {
        "equipment_id": req.equipment_id,
        "telemetry_snapshot": snapshot,
        "thought_logs": [],
        "tool_executions": [],
        "channel_notifications": []
    }
    
    # 驱动 LangGraph 状态图
    result_state = ovops_graph.invoke(init_state)
    return {
        "status": "success",
        "equipment_id": req.equipment_id,
        "thought_logs": result_state.get("thought_logs", []),
        "tool_executions": result_state.get("tool_executions", []),
        "physics_diagnosis": result_state.get("physics_diagnosis", {}),
        "sop_steps": result_state.get("sop_steps", []),
        "erp_ledger": result_state.get("erp_ledger", {}),
        "available_spare_parts": result_state.get("available_spare_parts", []),
        "work_order": result_state.get("work_order", {}),
        "channel_notifications": result_state.get("channel_notifications", []),
        "approval_status": result_state.get("approval_status", "PENDING")
    }

@router.post("/approve")
def approve_ticket(req: ApproveRequest):
    """人机协同闭环：核准工单并自动出库 ERP 备件"""
    res = approve_work_order(order_no=req.order_no, resolution_note=req.note)
    return res

@router.get("/erp/work-orders")
def list_work_orders():
    """获取 ERP 维保工单全量列表"""
    return get_all_work_orders()

@router.get("/erp/equipments")
def list_equipments():
    """获取 ERP 设备台账"""
    conn = sqlite3.connect(settings.ERP_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM equipments")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/erp/spare-parts")
def list_all_spare_parts():
    """获取 ERP 备品备件库"""
    conn = sqlite3.connect(settings.ERP_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM spare_parts")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/channels/messages")
def get_channel_messages():
    """获取钉钉/飞书协同卡片历史（供前端模拟舱展示）"""
    return channel_mgr.message_history
