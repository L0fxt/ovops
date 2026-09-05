from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import json
import sqlite3
from ovops.agent.planner import planner
from ovops.agent.graph import ovops_graph
from ovops.simulator.fault_generator import telemetry_sim
from ovops.tools.erp_tools import approve_work_order, get_all_work_orders, query_equipment_ledger, query_spare_parts_inventory
from ovops.channels.base import channel_mgr
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

@router.get("/approve-web", response_class=HTMLResponse)
def approve_web_view(order_no: str, note: Optional[str] = "现场技师已在移动协同端一键核准维保排程并预扣备件"):
    """
    供飞书/钉钉卡片按钮点击跳转的移动端审批闭环页面。
    用户在飞书/钉钉中点击按钮即可在此完成真实工单核准，并展示高保真核准凭据。
    """
    res = approve_work_order(order_no=order_no, resolution_note=note)
    is_success = "error" not in res
    
    order_info = None
    try:
        conn = sqlite3.connect(settings.ERP_DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT * FROM work_orders WHERE order_no = ?", (order_no,))
        row = c.fetchone()
        if row:
            order_info = dict(row)
        conn.close()
    except Exception:
        pass
        
    eq_id = order_info.get("equipment_id", "未知设备") if order_info else "流体装备"
    fault = order_info.get("fault_type", "机理预警异常") if order_info else "工况异常"
    tech = order_info.get("assigned_tech", "陈工(资深运维技师)") if order_info else "责任技师"
    
    parts_list = []
    if order_info and order_info.get("required_parts"):
        try:
            parts_list = json.loads(order_info["required_parts"])
        except Exception:
            pass

    parts_html = "".join([
        f"<li style='margin-bottom:8px; color:#38bdf8;'>📦 <strong>{p.get('name', '备件')}</strong> ({p.get('part_code', '')}) × {p.get('quantity', 1)} 套 — <span style='color:#34d399;'>已自动出库锁定</span></li>"
        for p in parts_list
    ]) or "<li style='color:#94a3b8;'>无需额外领料出库</li>"

    html_content = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>瓯阀智枢 · 移动协同工单审批</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #09090b;
            color: #f4f4f5;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
        }}
        .card {{
            background: #18181b;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            width: 100%;
            max-width: 440px;
            padding: 24px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        }}
        .status-badge {{
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.3);
            margin-bottom: 16px;
        }}
        .title {{
            font-size: 18px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 4px;
        }}
        .subtitle {{
            font-size: 12px;
            color: #a1a1aa;
            margin-bottom: 20px;
        }}
        .info-box {{
            background: #27272a;
            border-radius: 8px;
            padding: 12px 14px;
            margin-bottom: 16px;
            font-size: 13px;
            line-height: 1.6;
        }}
        .info-row {{
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid rgba(255,255,255,0.06);
        }}
        .info-row:last-child {{ border-bottom: none; }}
        .label {{ color: #71717a; }}
        .value {{ font-family: ui-monospace, monospace; color: #e4e4e7; font-weight: 500; }}
        .parts-title {{
            font-size: 12px;
            color: #a1a1aa;
            margin-bottom: 8px;
            font-weight: 600;
        }}
        .parts-list {{
            list-style: none;
            font-size: 12px;
            background: rgba(0,0,0,0.25);
            padding: 12px 14px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid rgba(255,255,255,0.05);
        }}
        .btn {{
            display: block;
            width: 100%;
            text-align: center;
            padding: 12px 0;
            border-radius: 8px;
            background: #2563eb;
            color: #ffffff;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            transition: background 0.2s;
        }}
        .btn:hover {{ background: #1d4ed8; }}
    </style>
</head>
<body>
    <div class="card">
        <div class="status-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span>{ "工单核准成功 · 备件已预扣出库" if is_success else "工单已处理或已关闭" }</span>
        </div>
        <h1 class="title">瓯阀智枢 · 人机协同审批闭环</h1>
        <p class="subtitle">永嘉特色流体装备预测性维护与跨系统数据穿透平台</p>
        
        <div class="info-box">
            <div class="info-row">
                <span class="label">ERP 维保工单</span>
                <span class="value">{order_no}</span>
            </div>
            <div class="info-row">
                <span class="label">监控设备位号</span>
                <span class="value">{eq_id}</span>
            </div>
            <div class="info-row">
                <span class="label">研判故障机理</span>
                <span class="value" style="color:#f87171;">{fault}</span>
            </div>
            <div class="info-row">
                <span class="label">责任运维技师</span>
                <span class="value">{tech}</span>
            </div>
        </div>

        <div class="parts-title">ERP 供应链备件自动调拨清单：</div>
        <ul class="parts-list">
            {parts_html}
        </ul>

        <a href="/" class="btn">进入瓯阀智枢数字孪生大屏</a>
    </div>
</body>
</html>
"""
    return HTMLResponse(content=html_content)

@router.post("/channels/feishu/callback")
async def feishu_card_callback(request: Request):
    """
    接收飞书开放平台卡片回传交互事件 (card.action.trigger) 或 URL 验证 Challenge
    """
    try:
        body = await request.json()
    except Exception:
        body = {}

    # 1. 响应飞书开放平台 URL 校验 Challenge 握手
    if "challenge" in body:
        return {"challenge": body["challenge"]}

    # 2. 响应卡片回传交互
    action = body.get("action", {})
    val = action.get("value", {})
    order_no = val.get("order_no")
    act_type = val.get("action")

    if act_type == "approve" and order_no:
        approve_work_order(order_no=order_no, resolution_note="飞书卡片回传交互一键核准")
        return {
            "toast": {
                "type": "success",
                "content": f"✅ 工单 {order_no} 已成功核准，ERP 备件预扣完成！"
            }
        }

    return {"toast": {"type": "info", "content": "已收到卡片响应"}}

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
