from fastapi import FastAPI, Request
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

import sqlite3
def load_saved_configs():
    """服务启动时从 SQLite 数据库热恢复系统动态配置"""
    try:
        conn = sqlite3.connect(settings.ERP_DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT key, value FROM system_configs")
        for row in c.fetchall():
            k, v = row["key"], row["value"]
            if k == "llm_base_url" and v:
                settings.OPENAI_BASE_URL = v
            elif k == "llm_api_key" and v:
                settings.OPENAI_API_KEY = v
            elif k == "llm_model" and v:
                settings.LLM_MODEL = v
            elif k == "dingtalk_webhook" and v:
                settings.DINGTALK_WEBHOOK = v
            elif k == "feishu_webhook" and v:
                settings.FEISHU_WEBHOOK = v
            elif k == "public_url" and v:
                settings.PUBLIC_URL = v
            elif k == "enterprise_api_base_url":
                settings.ENTERPRISE_API_BASE_URL = v
            elif k == "enterprise_api_token":
                settings.ENTERPRISE_API_TOKEN = v
            elif k == "enterprise_api_auth_type" and v:
                settings.ENTERPRISE_API_AUTH_TYPE = v
            elif k == "data_source_mode" and v:
                settings.DATA_SOURCE_MODE = v
            elif k == "enterprise_api_timeout" and v:
                try:
                    settings.ENTERPRISE_API_TIMEOUT = float(v)
                except Exception:
                    pass
        conn.close()
        
        from ovops.adapters import data_source_router
        data_source_router.reload_config()
    except Exception:
        pass

load_saved_configs()

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

@app.post("/api/channels/feishu/callback")
async def feishu_callback_entry(request: Request):
    from ovops.api.routes_agent import feishu_card_callback
    return await feishu_card_callback(request)

# 2. 挂载前端静态页面（必须在所有 API 之后挂载）
web_dist = settings.BASE_DIR / "web" / "dist"
if web_dist.exists():
    app.mount("/", StaticFiles(directory=str(web_dist), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ovops.main:app", host=settings.HOST, port=settings.PORT, reload=True)
