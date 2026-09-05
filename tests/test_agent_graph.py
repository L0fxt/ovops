import pytest
from ovops.agent.graph import ovops_graph

def test_graph_flow_p201():
    init_state = {
        "equipment_id": "P-201",
        "telemetry_snapshot": {"inlet_pressure_kpa": 18.0, "vibration_rms_mms": 8.0},
        "thought_logs": [],
        "tool_executions": [],
        "channel_notifications": []
    }
    res = ovops_graph.invoke(init_state)
    assert len(res["thought_logs"]) >= 6
    assert len(res["tool_executions"]) >= 5
    assert "work_order" in res
    assert len(res["channel_notifications"]) == 2
