from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from config.settings import settings
from ovops.api import (
    telemetry_router,
    agent_router,
    ws_router,
    system_router,
    technician_router,
    supervisor_router
)
from data.erp.init_db import init_erp_database

# 检查并自动初始化 ERP SQLite
if not settings.ERP_DB_PATH.exists():
    init_erp_database()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_SUBTITLE,
    version=settings.VERSION
)

# 配置跨域中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# 1. 注册 API 路由
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "subtitle": settings.PROJECT_SUBTITLE,
        "version": settings.VERSION
    }

app.include_router(telemetry_router)
app.include_router(agent_router)
app.include_router(ws_router)
app.include_router(system_router)
app.include_router(technician_router)
app.include_router(supervisor_router)

# 2. 挂载前端静态页面（必须在所有 API 之后挂载）
web_dist = settings.BASE_DIR / "web" / "dist"
if web_dist.exists():
    app.mount("/", StaticFiles(directory=str(web_dist), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ovops.main:app", host=settings.HOST, port=settings.PORT, reload=True)
