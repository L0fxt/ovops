from typing import TypedDict, List, Dict, Any, Optional

class OvOpsState(TypedDict):
    """瓯阀智枢 LangGraph 全生命周期状态容器"""
    equipment_id: str
    anomaly_event: Dict[str, Any]
    telemetry_snapshot: Dict[str, Any]
    thought_logs: List[Dict[str, Any]] # [{"timestamp": "...", "node": "...", "thought": "..."}]
    tool_executions: List[Dict[str, Any]] # [{"tool": "...", "args": {...}, "result": {...}}]
    physics_diagnosis: Dict[str, Any]
    sop_steps: List[str]
    erp_ledger: Dict[str, Any]
    available_spare_parts: List[Dict[str, Any]]
    work_order: Dict[str, Any]
    channel_notifications: List[Dict[str, Any]]
    approval_status: str # "PENDING" | "APPROVED" | "REJECTED"
    final_resolution: str
