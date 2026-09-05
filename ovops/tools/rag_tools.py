from typing import Dict, Any, List
from ovops.agent.registry import tool

# 永嘉泵阀龙头专家维保规程与排障标准库
EXPERT_KNOWLEDGE_BASE = [
    {
        "id": "KB-XD-001",
        "category": "离心泵",
        "equipment_pattern": "P-201",
        "title": "宣达高硅耐酸离心泵气蚀与吸入水力异常排查 SOP (Q/XD-02)",
        "source": "宣达实业集团特种泵技术中心",
        "keywords": ["气蚀", "吸入压力", "NPSH", "叶轮", "高频振动", "压头不足"],
        "troubleshooting_steps": [
            "【Step 1 应急工况调整】立即通知中控工艺员提升前端吸入储罐液位或调大吸入管进口阀开度，恢复有效汽蚀余量 NPSHa。",
            "【Step 2 振动与温升监测】在线观测高频振动加速度是否由 >3g 回落至正常区间 (<0.5g)，避免轴承与机封持续受交变冲击载荷。",
            "【Step 3 计划性停机内窥探伤】若气蚀持续超过 4 小时，必须预约窗口期拆卸吸入法兰，使用工业内窥镜探查叶轮前缘吸入面有无蜂窝麻点冲蚀。",
            "【Step 4 备品备件更换】如麻点穿透深度超过 1.5mm，调拨永嘉原厂 XD-IMP-100-A 高硅耐酸叶轮组件与机械密封成套更换。"
        ]
    },
    {
        "id": "KB-BTL-002",
        "category": "控制阀",
        "equipment_pattern": "V-102",
        "title": "浙江伯特利高压套筒调节阀阀杆卡阻与迟滞超标消除规程 (BTL-OM-24)",
        "source": "浙江伯特利科技数字化工厂运维部",
        "keywords": ["卡阻", "回差", "迟滞", "填料", "定位器", "死区"],
        "troubleshooting_steps": [
            "【Step 1 气源与定位器校验】首先检查仪表气源过滤减压阀输出是否恒定在 5.5 bar，排除气源欠压导致的执行机构推力不足。",
            "【Step 2 填料压盖预紧力微调】轻微松开填料压盖螺母 1/6 圈，注入专用高温润滑脂，消除因填料过度压实产生的超额静摩擦力。",
            "【Step 3 自动全行程自整定】利用定位器 HART 手操器或数字控制台启动 Auto-Calibration，重置零点与量程。",
            "【Step 4 阀芯导向套检修】若阶跃卡滞依旧存在，在装置小修期间解体检查套筒与阀芯表面司太立合金涂层是否有介质结焦或划伤。"
        ]
    }
]

@tool
def search_maintenance_sop(query: str, equipment_category: str = "离心泵") -> List[Dict[str, Any]]:
    """检索永嘉泵阀专家规程库：根据故障表象与设备类型匹配超达/宣达/伯特利等原厂权威维保处置 SOP。
    Args:
        query: 检索关键词，如 '气蚀' 或 '阀杆卡阻'
        equipment_category: 设备品类 ('离心泵' 或 '控制阀')
    """
    matches = []
    for kb in EXPERT_KNOWLEDGE_BASE:
        if equipment_category and kb["category"] != equipment_category:
            continue
        score = sum(1 for kw in kb["keywords"] if kw in query)
        if score > 0 or query in kb["title"]:
            matches.append({
                "sop_id": kb["id"],
                "title": kb["title"],
                "source": kb["source"],
                "steps": kb["troubleshooting_steps"]
            })
            
    # 如果没有完全匹配，返回该类别的默认通用 SOP
    if not matches and EXPERT_KNOWLEDGE_BASE:
        default_kb = EXPERT_KNOWLEDGE_BASE[0] if equipment_category == "离心泵" else EXPERT_KNOWLEDGE_BASE[1]
        matches.append({
            "sop_id": default_kb["id"],
            "title": default_kb["title"],
            "source": default_kb["source"],
            "steps": default_kb["troubleshooting_steps"]
        })
        
    return matches
