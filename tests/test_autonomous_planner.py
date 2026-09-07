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

def test_planner_generalization_arbitrary_equipment():
    """验证 Phase 12 规划器泛化：支持任意设备位号、任意故障意图推断与备件推荐"""
    from ovops.agent.planner import planner

    # 1. 任意设备推断测试
    assert planner._resolve_equipment("双吸离心泵冷却水工段出现水力异常") == "P-202"
    assert planner._resolve_equipment("金属硬密封球阀密封面出现介质啸叫内漏") == "V-103"
    assert planner._resolve_equipment("浓硫酸循环回路酸泵发生吸入压力剧降") == "P-201"
    assert planner._resolve_equipment("加氢进料调节阀出现回差偏大") == "V-102"

    # 2. 泛化机理与故障匹配测试
    ledger_p202 = {"id": "P-202", "name": "大流量双吸离心泵", "category": "离心泵"}
    fault_vib = planner._determine_fault_and_physics(
        equipment_id="P-202",
        ledger=ledger_p202,
        telemetry={},
        goal="现场测得高频振动超标，需排查轴承磨损"
    )
    assert "振动" in fault_vib["fault_type"]
    assert fault_vib["keyword"] == "高频振动"

    ledger_v103 = {"id": "V-103", "name": "金属硬密封球阀", "category": "控制阀"}
    fault_leak = planner._determine_fault_and_physics(
        equipment_id="V-103",
        ledger=ledger_v103,
        telemetry={},
        goal="切断系统超声波检测到严重内漏"
    )
    assert "泄漏" in fault_leak["fault_type"] or "内漏" in fault_leak["fault_type"]
    assert fault_leak["keyword"] == "内漏"

    # 3. 动态备件与责任技师分配测试
    parts, tech = planner._recommend_parts_and_tech("P-202", [], fault_vib)
    assert len(parts) > 0
    assert "技师" in tech or "专家" in tech
