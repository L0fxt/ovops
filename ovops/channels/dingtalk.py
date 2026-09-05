from typing import Dict, Any
from .base import channel_mgr
from config.settings import settings

def build_dingtalk_action_card(equipment_id: str, fault_type: str, severity: str, order_no: str, sop_summary: str, parts_summary: str) -> Dict[str, Any]:
    """生成符合钉钉标准的 ActionCard 交互卡片"""
    title = f"🚨【瓯阀智枢】{equipment_id} 工况异常预警工单"
    markdown = f"""### 🚨 瓯阀智枢 · 智能运维告警
**设备位号**：{equipment_id}  
**研判故障**：<font color="#FF4D4F">{fault_type}</font>  
**告警级别**：`{severity}`  
**ERP工单号**：`{order_no}`  

---
#### 🛠️ 自主拆解维保处置规程 (SOP)
{sop_summary}

#### 📦 建议调拨永嘉本地备件
{parts_summary}

*请负责技师核对工况后点击下方按钮完成审批闭环。*
"""
    base_url = (getattr(settings, "PUBLIC_URL", None) or "http://localhost:8000").rstrip("/")
    approve_url = f"{base_url}/api/agent/approve-web?order_no={order_no}"

    payload = {
        "msgtype": "actionCard",
        "actionCard": {
            "title": title,
            "text": markdown,
            "singleTitle": f"确认核准工单 ({order_no})",
            "singleURL": approve_url
        }
    }
    
    # 记录到中枢，用于前端大屏交互模拟
    channel_mgr.log_message("DINGTALK", title, payload, markdown)
    return payload
