from .routes_telemetry import router as telemetry_router
from .routes_agent import router as agent_router
from .ws_dashboard import router as ws_router
from .routes_system import router as system_router
from .routes_technician import router as technician_router
from .routes_supervisor import router as supervisor_router

__all__ = [
    "telemetry_router",
    "agent_router",
    "ws_router",
    "system_router",
    "technician_router",
    "supervisor_router"
]
