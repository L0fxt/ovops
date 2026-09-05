import pytest
from ovops.tools.erp_tools import query_equipment_ledger, query_spare_parts_inventory, create_maintenance_work_order, approve_work_order

def test_query_ledger():
    ledger = query_equipment_ledger("P-201")
    assert ledger["name"] == "宣达高硅耐酸工业离心泵"
    assert "宣达实业" in ledger["manufacturer"]

def test_query_spare_parts():
    parts = query_spare_parts_inventory("P-201")
    assert len(parts) >= 2
    assert any("叶轮" in p["name"] for p in parts)

def test_work_order_lifecycle():
    order = create_maintenance_work_order(
        equipment_id="P-201",
        fault_type="测试气蚀故障",
        severity="CRITICAL",
        decomposed_steps=["检查吸入", "更换叶轮"],
        required_parts=[{"part_code": "SP-P201-IMP", "name": "叶轮", "quantity": 1}]
    )
    assert order["status"] == "PENDING_APPROVAL"
    order_no = order["order_no"]
    
    # 审批闭环
    appr = approve_work_order(order_no, "测试审批通过")
    assert appr["status"] == "APPROVED"
