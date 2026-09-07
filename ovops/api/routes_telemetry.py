from fastapi import APIRouter
from pydantic import BaseModel
from ovops.adapters import data_source_router

router = APIRouter(prefix="/api/telemetry", tags=["工况时序"])

class FaultModeRequest(BaseModel):
    mode: str # NORMAL | PUMP_CAVITATION | VALVE_JAMMING

@router.get("/latest")
def get_latest_telemetry():
    """获取秒级最新工业测点数据（经数据源路由器分发：真实企业API优先或仿真器兜底）"""
    return data_source_router.get_latest_telemetry()

@router.get("/history")
def get_telemetry_history():
    """获取离心泵与控制阀历史时序窗口数据 (供 ECharts 渲染)"""
    return data_source_router.get_telemetry_history()

@router.get("/source-status")
def get_data_source_status():
    """获取当前遥测数据源运行模式、企业 API 连接健康度与探活指标"""
    return data_source_router.get_router_status()

@router.post("/fault-mode")
def switch_fault_mode(req: FaultModeRequest):
    """手动注入/恢复工业典型故障（仿真器模式下生效）"""
    success = data_source_router.switch_fault_mode(req.mode)
    status = data_source_router.get_latest_telemetry().get("fault_mode", "NORMAL")
    return {"success": success, "current_mode": status}
