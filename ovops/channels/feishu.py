from typing import Dict, Any
from .base import channel_mgr
from config.settings import settings

def build_feishu_interactive_card(equipment_id: str, fault_type: str, severity: str, order_no: str, sop_summary: str, parts_summary: str) -> Dict[str, Any]:
    """生成符合飞书标准的 Interactive Card 交互卡片"""
    title = f"🚨 瓯阀智枢 · {equipment_id} 智能预警"
    markdown = f"""**设备位号**：{equipment_id}  |  **严重度**：{severity}  
**机理诊断**：**{fault_type}**  
**ERP工单编号**：`{order_no}`  

**【自主拆解 SOP】**  
{sop_summary}  

**【本地备件调度】**  
{parts_summary}
"""
    base_url = (getattr(settings, "PUBLIC_URL", None) or "http://localhost:8000").rstrip("/")
    approve_url = f"{base_url}/api/agent/approve-web?order_no={order_no}"
    twin_url = f"{base_url}/?equipment_id={equipment_id}"

    card = {
        "config": {"wide_screen_mode": True},
        "header": {
            "title": {"tag": "plain_text", "content": title},
            "template": "red" if severity == "CRITICAL" else "orange"
        },
        "elements": [
            {
                "tag": "div",
                "text": {"tag": "lark_md", "content": markdown}
            },
            {"tag": "hr"},
            {
                "tag": "action",
                "actions": [
                    {
                        "tag": "button",
                        "text": {"tag": "plain_text", "content": "一键核准并调拨备件"},
                        "type": "primary",
                        "multi_url": {
                            "url": approve_url,
                            "pc_url": approve_url,
                            "android_url": approve_url,
                            "ios_url": approve_url
                        },
                        "value": {"order_no": order_no, "action": "approve"}
                    },
                    {
                        "tag": "button",
                        "text": {"tag": "plain_text", "content": "查看设备数字孪生"},
                        "type": "default",
                        "multi_url": {
                            "url": twin_url,
                            "pc_url": twin_url,
                            "android_url": twin_url,
                            "ios_url": twin_url
                        },
                        "value": {"equipment_id": equipment_id, "action": "view_twin"}
                    }
                ]
            }
        ]
    }
    
    payload = {"msg_type": "interactive", "card": card}
    channel_mgr.log_message("FEISHU", title, payload, markdown)
    return payload
