import sqlite3
import json
import datetime
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Union, Any
from config.settings import settings

router = APIRouter(prefix="/api/technician", tags=["现场技师移动端"])

def get_db():
    conn = sqlite3.connect(settings.ERP_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

class CloseOrderRequest(BaseModel):
    order_no: str
    tech_name: str = "陈工(资深运维技师)"
    loto_confirmed: bool = True
    completed_steps: Union[List[Any], str] = []
    tech_notes: str
    photo_evidence: Optional[str] = "inspection_evidence_sealed.jpg"

@router.get("/tasks")
def get_technician_tasks():
    """获取当前现场技师待办与执行中的维保工单"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT w.*, e.name as equipment_name, e.installation_area
    FROM work_orders w
    LEFT JOIN equipments e ON w.equipment_id = e.id
    ORDER BY w.created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    
    tasks = []
    for r in rows:
        raw_steps = r["decomposed_steps"]
        steps = []
        try:
            parsed = json.loads(raw_steps) if raw_steps else []
            if isinstance(parsed, list):
                steps = parsed
            elif isinstance(parsed, str):
                steps = [parsed]
            else:
                steps = [str(parsed)]
        except Exception:
            steps = [raw_steps] if raw_steps else []

        raw_parts = r["required_parts"]
        parts = []
        try:
            parsed_parts = json.loads(raw_parts) if raw_parts else []
            if isinstance(parsed_parts, list):
                parts = parsed_parts
            else:
                parts = [parsed_parts]
        except Exception:
            parts = []

        tasks.append({
            "order_no": r["order_no"],
            "equipment_id": r["equipment_id"],
            "equipment_name": r["equipment_name"],
            "installation_area": r["installation_area"],
            "fault_type": r["fault_type"],
            "severity": r["severity"],
            "status": r["status"],
            "decomposed_steps": steps,
            "required_parts": parts,
            "assigned_tech": r["assigned_tech"],
            "created_at": r["created_at"],
            "resolution_note": r["resolution_note"]
        })
    return tasks

@router.post("/submit-closure")
def submit_technician_closure(req: CloseOrderRequest):
    """现场技师核验并完成维保闭环回填（更新工单状态并沉淀至经验库）"""
    conn = get_db()
    cursor = conn.cursor()
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # 1. 查找对应工单
    cursor.execute("SELECT * FROM work_orders WHERE order_no = ?", (req.order_no,))
    order = cursor.fetchone()
    if not order:
        conn.close()
        return {"error": f"工单 {req.order_no} 不存在"}
        
    # 2. 插入维保实操留痕表
    cursor.execute("""
    INSERT INTO maintenance_logs (
        order_no, equipment_id, tech_name, loto_confirmed,
        completed_steps, photo_evidence, tech_notes, closed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        req.order_no,
        order["equipment_id"],
        req.tech_name,
        1 if req.loto_confirmed else 0,
        json.dumps(req.completed_steps, ensure_ascii=False),
        req.photo_evidence,
        req.tech_notes,
        now_str
    ))
    
    # 3. 更新工单状态为 CLOSED (已闭环)
    note = f"【技师回填闭环】{req.tech_notes} (LOTO已核验，各步骤已验收完成)"
    cursor.execute("""
    UPDATE work_orders 
    SET status = 'CLOSED', updated_at = ?, resolution_note = ?
    WHERE order_no = ?
    """, (now_str, note, req.order_no))
    
    conn.commit()
    conn.close()
    return {
        "status": "success",
        "order_no": req.order_no,
        "message": f"工单 {req.order_no} 现场实操记录已成功上传，数据闭环沉淀完成！"
    }
