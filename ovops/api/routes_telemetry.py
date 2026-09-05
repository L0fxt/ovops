from fastapi import APIRouter
from pydantic import BaseModel
from ovops.simulator.fault_generator import telemetry_sim

router = APIRouter(prefix="/api/telemetry", tags=["工况时序"])

class FaultModeRequest(BaseModel):
    mode: str # NORMAL | PUMP_CAVITATION | VALVE_JAMMING

@router.get("/latest")
def get_latest_telemetry():
    """获取秒级最新传感器测点"""
    return telemetry_sim.sample_tick()

@router.get("/history")
def get_telemetry_history():
    """获取离心泵与控制阀历史时序窗口数据 (供 ECharts 渲染)"""
    return {
        "p201": telemetry_sim.history_p201,
        "v102": telemetry_sim.history_v102,
        "fault_mode": telemetry_sim.fault_mode
    }

@router.post("/fault-mode")
def switch_fault_mode(req: FaultModeRequest):
    """手动注入/恢复工业典型故障"""
    success = telemetry_sim.set_fault_mode(req.mode)
    return {"success": success, "current_mode": telemetry_sim.fault_mode}
