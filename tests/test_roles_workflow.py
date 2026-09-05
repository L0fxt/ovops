import pytest
from fastapi.testclient import TestClient
from ovops.main import app

client = TestClient(app)

def test_technician_tasks_flow():
    # 1. 查询技师待办列表
    res = client.get("/api/technician/tasks")
    assert res.status_code == 200
    tasks = res.json()
    assert isinstance(tasks, list)
    assert len(tasks) > 0
    first_task = tasks[0]
    assert "order_no" in first_task
    assert "equipment_id" in first_task
    assert "decomposed_steps" in first_task

    # 2. 模拟技师完成核验并提交闭环工单
    closure_payload = {
        "order_no": first_task["order_no"],
        "tech_name": "王工(资深检修技师)",
        "loto_confirmed": True,
        "completed_steps": first_task["decomposed_steps"],
        "tech_notes": "现场已执行双阀切断与盲板隔离，完成密封圈与轴承紧固，复测振动值恢复至 1.8mm/s。",
        "photo_evidence": "inspection_evidence_completed.jpg"
    }
    close_res = client.post("/api/technician/submit-closure", json=closure_payload)
    assert close_res.status_code == 200
    close_data = close_res.json()
    assert close_data["status"] == "success"
    assert close_data["order_no"] == first_task["order_no"]

    # 3. 再次查询确认状态已更新为 CLOSED
    verify_res = client.get("/api/technician/tasks")
    updated_tasks = verify_res.json()
    matched = next((t for t in updated_tasks if t["order_no"] == first_task["order_no"]), None)
    assert matched is not None
    assert matched["status"] == "CLOSED"

def test_supervisor_overview():
    res = client.get("/api/supervisor/overview")
    assert res.status_code == 200
    data = res.json()
    assert "kpis" in data
    kpis = data["kpis"]
    assert kpis["total_assets"] >= 4
    assert kpis["avg_health_score"] > 0
    assert kpis["avoided_downtime_hours"] >= 0
    assert kpis["estimated_saved_cny"] >= 0
    assert "health_ranking" in data

def test_supervisor_supply_chain_map():
    res = client.get("/api/supervisor/supply-chain-map")
    assert res.status_code == 200
    data = res.json()
    assert data["region"] == "浙江省温州市永嘉县"
    assert "hubs" in data
    hubs = data["hubs"]
    assert len(hubs) >= 3
    # 确保均为永嘉通用工业枢纽，不包含特定商业排他品牌
    for hub in hubs:
        assert "永嘉" in hub["name"] or "温州" in hub["name"] or "分发中心" in hub["name"]
        assert hub["distance_km"] > 0
        assert hub["eta_minutes"] > 0
