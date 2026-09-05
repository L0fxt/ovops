import pytest
from fastapi.testclient import TestClient
from ovops.main import app

client = TestClient(app)

def test_plan_and_execute_pump_goal():
    goal = "针对P-201特种耐酸离心泵入口压力骤降异动，自主核算气蚀余量，穿透ERP备件库并下发抢修工单"
    payload = {"goal": goal, "equipment_id": "P-201"}
    
    res = client.post("/api/agent/plan-and-execute", json=payload)
    assert res.status_code == 200
    data = res.json()
    
    assert data["status"] == "success"
    assert data["equipment_id"] == "P-201"
    assert "task_tree" in data
    assert len(data["task_tree"]) >= 5
    
    # 验证跨平台工具调用覆盖：机理计算、知识检索、ERP数据库、第三方协同
    categories = [step["category"] for step in data["task_tree"]]
    assert "PLANNER" in categories
    assert "PHYSICS_SOLVER" in categories
    assert "KNOWLEDGE_RAG" in categories
    assert "DATABASE_ERP" in categories
    assert "THIRD_PARTY_TOOL" in categories
    
    # 验证生成的闭环工单实体
    assert "work_order" in data
    assert data["work_order"]["order_no"].startswith("WO-")
    assert data["work_order"]["status"] == "PENDING_APPROVAL"
    
    # 验证下发的钉钉与飞书协同通知
    assert len(data["channel_notifications"]) == 2

def test_plan_and_execute_valve_goal():
    goal = "检测到V-102套筒调节阀行程指令与反馈存在回差卡涩，请自主求解回差死区并生成检修步骤"
    payload = {"goal": goal}
    
    res = client.post("/api/agent/plan-and-execute", json=payload)
    assert res.status_code == 200
    data = res.json()
    
    assert data["status"] == "success"
    assert data["equipment_id"] == "V-102"
    assert "work_order" in data
    assert "卡阻" in data["physics_diagnosis"]["fault_type"]
