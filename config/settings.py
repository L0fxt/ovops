import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings(BaseModel):
    PROJECT_NAME: str = "瓯阀智枢 (OuValve-Ops)"
    PROJECT_SUBTITLE: str = "跨系统数据穿透与智能运维 Agent"
    VERSION: str = "1.0.0"
    
    # 路径配置
    BASE_DIR: Path = BASE_DIR
    DATA_DIR: Path = BASE_DIR / "data"
    ERP_DB_PATH: Path = BASE_DIR / "data" / "erp" / "ovops_erp.db"
    
    # 大模型服务配置（支持 DeepSeek, 通义千问, Gemini 或本地 Mock 模式）
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.deepseek.com")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "deepseek-v4-pro")
    USE_MOCK_LLM_IF_NO_KEY: bool = True
    
    # 多端协同 Webhook (钉钉 / 飞书)
    DINGTALK_WEBHOOK: str = os.getenv("DINGTALK_WEBHOOK", "")
    FEISHU_WEBHOOK: str = os.getenv("FEISHU_WEBHOOK", "")
    
    # 服务网络配置
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    PUBLIC_URL: str = os.getenv("PUBLIC_URL", "http://localhost:8000")

settings = Settings()
