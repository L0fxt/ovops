from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any
from ovops.agent.planner import planner
from ovops.agent.graph import ovops_graph
from ovops.simulator.fault_generator import telemetry_sim
from ovops.tools.erp_tools import approve_work_order, get_all_work_orders, query_equipment_ledger, query_spare_parts_inventory
from ovops.channels.base import channel_mgr
import sqlite3
from config.settings import settings

router = APIRouter(prefix="/api/agent", tags=["智能运维Agent"])

class TriggerRequest(BaseModel):
    equipment_id: str = "P-201"

class PlanExecuteRequest(BaseModel):
    goal: str
    equipment_id: Optional[str] = None

class ApproveRequest(BaseModel):
    order_no: str
    note: Optional[str] = "现场技师已在协同端一键核准维保排程并预扣备件"

@router.post("/plan-and-execute")
def plan_and_execute_goal(req: PlanExecuteRequest):
    """
    智能体自主目标规划与求解执行入口：
    接收自然语言复杂业务目标，自主拆解多步骤业务任务树，跨平台调用工具并形成闭环工单。
    """
    return planner.execute(goal=req.goal, equipment_id=req.equipment_id)

@router.post("/trigger")
def trigger_agent_investigation(req: TriggerRequest):
    """触发 LangGraph 智能体自主研判与闭环工序拆解"""
    default_goal = (
        f"针对流体装备 {req.equipment_id} 实时工况异常特征，自主核算工业机理，穿透 ERP 数据库调拨本地备件并生成闭环工单"
    )
    return planner.execute(goal=default_goal, equipment_id=req.equipment_id)

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
