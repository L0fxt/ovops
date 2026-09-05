import datetime
import httpx
from typing import Dict, Any, List

class ChannelManager:
    """多端协同调度中枢：统一管理钉钉/飞书卡片生成、Webhook 派发及前端现场模拟"""
    def __init__(self):
        self.message_history: List[Dict[str, Any]] = []

    def log_message(self, channel: str, title: str, card_payload: Dict[str, Any], raw_markdown: str):
        record = {
            "id": f"msg-{len(self.message_history) + 1}",
            "channel": channel,
            "title": title,
            "card_payload": card_payload,
            "raw_markdown": raw_markdown,
            "created_at": datetime.datetime.now().strftime("%H:%M:%S")
        }
        self.message_history.append(record)
        if len(self.message_history) > 30:
            self.message_history.pop(0)
        return record

    async def send_webhook(self, url: str, payload: Dict[str, Any]) -> bool:
        if not url:
            return False
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.post(url, json=payload)
                return res.status_code == 200
        except Exception as e:
            print(f"[Channel] Webhook 发送失败: {e}")
            return False

channel_mgr = ChannelManager()
