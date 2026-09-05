import sqlite3
import json
import datetime
import uuid
from pathlib import Path
from typing import Dict, Any, List, Optional
from ovops.agent.registry import tool
from config.settings import settings

def get_db_connection():
    conn = sqlite3.connect(settings.ERP_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@tool
def query_equipment_ledger(equipment_id: str) -> Dict[str, Any]:
    """穿透企业 ERP 核心资产库：根据位号查询设备台账、出厂型号、永嘉制造原厂信息及额定参数。
    Args:
        equipment_id: 设备位号，如 P-201 或 V-102
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM equipments WHERE id = ?", (equipment_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return {"error": f"ERP 台账中未查询到位号为 {equipment_id} 的设备"}
        
    return {
        "equipment_id": row["id"],
        "name": row["name"],
        "category": row["category"],
        "model": row["model"],
        "manufacturer": row["manufacturer"],
        "installation_area": row["installation_area"],
        "status": row["status"],
        "health_score": row["health_score"],
        "rated_params": json.loads(row["rated_params"]),
        "commission_date": row["commission_date"]
    }

@tool
def query_spare_parts_inventory(equipment_id: str) -> List[Dict[str, Any]]:
    """穿透企业 ERP 供应链库存：查询匹配指定设备的所有关键备件规格、实时在库量及永嘉本地供应链服务商。
    Args:
        equipment_id: 设备位号，如 P-201 或 V-102
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM spare_parts WHERE equipment_id = ?", (equipment_id,))
    rows = cursor.fetchall()
    conn.close()
    
    parts = []
    for r in rows:
        parts.append({
            "part_code": r["part_code"],
            "name": r["name"],
            "spec": r["spec"],
            "stock_qty": r["stock_qty"],
            "min_safety_stock": r["min_safety_stock"],
            "unit_price_cny": r["unit_price"],
            "lead_time_days": r["lead_time_days"],
            "supplier": r["supplier"],
            "is_stock_sufficient": r["stock_qty"] > r["min_safety_stock"]
        })
    return parts

@tool
def create_maintenance_work_order(
    equipment_id: str,
    fault_type: str,
    severity: str,
    decomposed_steps: List[str],
    required_parts: List[Dict[str, Any]],
    assigned_tech: str = "陈工(资深运维技师)"
) -> Dict[str, Any]:
    """穿透企业 ERP 维保中心：写入智能体自主拆解生成的标准维保工单与备件调度申请。
    Args:
        equipment_id: 设备位号，如 P-201
        fault_type: 研判出的故障机理类型
        severity: 告警严重级别 (CRITICAL / HIGH / MEDIUM)
        decomposed_steps: 智能体自主拆解的标准处置步骤清单
        required_parts: 维修所需调拨的备品备件及数量清单
        assigned_tech: 建议派发的技术责任人
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    suffix = uuid.uuid4().hex[:4].upper()
    now_str = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    order_no = f"WO-{now_str[-6:]}-{suffix}"
    created_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    cursor.execute("""
    INSERT INTO work_orders (
        order_no, equipment_id, fault_type, severity, status,
        decomposed_steps, required_parts, assigned_tech,
        created_at, updated_at, resolution_note
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        order_no,
        equipment_id,
        fault_type,
        severity,
        "PENDING_APPROVAL",
        json.dumps(decomposed_steps, ensure_ascii=False),
        json.dumps(required_parts, ensure_ascii=False),
        assigned_tech,
        created_at,
        created_at,
        ""
    ))
    conn.commit()
    conn.close()
    
    return {
        "order_no": order_no,
        "equipment_id": equipment_id,
        "status": "PENDING_APPROVAL",
        "message": f"维保工单 {order_no} 已成功在 ERP 系统建单，正挂起等待钉钉/飞书审批确认。"
    }

def approve_work_order(order_no: str, resolution_note: str = "技师已在移动端确认排程与备件调拨") -> Dict[str, Any]:
    """人机协同闭环：钉钉/飞书端审批通过后，更新工单状态并自动预扣 ERP 备品备件库存"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM work_orders WHERE order_no = ?", (order_no,))
    order = cursor.fetchone()
    if not order:
        conn.close()
        return {"error": f"工单 {order_no} 不存在"}
        
    # 扣减对应备件库存
    required_parts = json.loads(order["required_parts"])
    for part in required_parts:
        part_code = part.get("part_code")
        qty = part.get("quantity", 1)
        if part_code:
            cursor.execute("UPDATE spare_parts SET stock_qty = MAX(0, stock_qty - ?) WHERE part_code = ?", (qty, part_code))
            
    updated_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
    UPDATE work_orders 
    SET status = 'APPROVED', updated_at = ?, resolution_note = ?
    WHERE order_no = ?
    """, (updated_at, resolution_note, order_no))
    
    conn.commit()
    conn.close()
    return {"order_no": order_no, "status": "APPROVED", "message": "工单已核准，备件已自动完成 ERP 出库锁定"}

def get_all_work_orders() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM work_orders ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    
    orders = []
    for r in rows:
        orders.append({
            "order_no": r["order_no"],
            "equipment_id": r["equipment_id"],
            "fault_type": r["fault_type"],
            "severity": r["severity"],
            "status": r["status"],
            "decomposed_steps": json.loads(r["decomposed_steps"]),
            "required_parts": json.loads(r["required_parts"]),
            "assigned_tech": r["assigned_tech"],
            "created_at": r["created_at"],
            "updated_at": r["updated_at"],
            "resolution_note": r["resolution_note"]
        })
    return orders
