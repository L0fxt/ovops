import sqlite3
import datetime
import math
from typing import Dict, Any, List, Optional
from fastapi import APIRouter
from config.settings import settings
from ovops.adapters.router import data_source_router

router = APIRouter(prefix="/api/supervisor", tags=["维保主管与决策看板"])

def get_db():
    conn = sqlite3.connect(settings.ERP_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# 永嘉县本地 2 小时应急备件供应链物流默认保障仓 (兜底拓扑)
DEFAULT_SUPPLY_HUBS = [
    {
        "id": "HUB-01",
        "name": "永嘉特种流体备件分发中心",
        "location": "永嘉县瓯北街道东瓯工业区",
        "distance_km": 4.2,
        "eta_minutes": 25,
        "inventory_types": ["超耐酸闭式高硅叶轮", "耐浓酸碳化硅机械密封"],
        "status": "STOCK_ABUNDANT"
    },
    {
        "id": "HUB-02",
        "name": "永嘉流程控制阀备品保障仓",
        "location": "中国泵阀城·三桥工业园园区",
        "distance_km": 6.8,
        "eta_minutes": 35,
        "inventory_types": ["柔性石墨填料环", "司太立阀芯套筒组"],
        "status": "STOCK_ABUNDANT"
    },
    {
        "id": "HUB-03",
        "name": "永嘉县流体密封精工备件库",
        "location": "永嘉县瓯北街道沿江流体装备街",
        "distance_km": 5.1,
        "eta_minutes": 30,
        "inventory_types": ["特种氟橡胶O型圈", "石墨缠绕垫片"],
        "status": "STOCK_ADEQUATE"
    },
    {
        "id": "HUB-04",
        "name": "永嘉工业控制执行机构储备库",
        "location": "永嘉县三江街道高新技术装备园区",
        "distance_km": 9.4,
        "eta_minutes": 45,
        "inventory_types": ["数字式气动智能定位器", "气动双作用活塞执行机构"],
        "status": "READY_TO_DISPATCH"
    }
]

def _parse_time(ts_str: str) -> Optional[datetime.datetime]:
    if not ts_str:
        return None
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.datetime.strptime(ts_str[:19], fmt)
        except Exception:
            pass
    return None

@router.get("/overview")
def get_supervisor_kpis():
    """
    获取主管与厂长维保决策指标大盘 (Phase 11 真实化升级)
    - MTBF: 基于各设备自投运起累计运行时长与故障工单次数动态统计
    - MTTR: 基于工单创建到技师闭环归档的真实生命周期均值
    - 停机损失: 动态融合各设备停机挽回产值
    - 健康度综合加权评分: 动态结合在线遥测健康衰减、未闭环缺陷等级与台账基础分
    """
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM equipments")
    equips = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("SELECT * FROM work_orders")
    orders = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("SELECT * FROM maintenance_logs")
    logs = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    total_equips = len(equips)
    now = datetime.datetime.now()

    # 1. 动态计算各设备自投运以来的运行天数与故障频次，得出全厂真实 MTBF
    total_running_hours = 0.0
    equipment_fault_counts: Dict[str, int] = {}
    for eq in equips:
        eq_id = eq["id"]
        comm_date = _parse_time(eq.get("commission_date", "")) or (now - datetime.timedelta(days=365))
        operating_days = max(1.0, (now - comm_date).total_seconds() / 86400.0)
        # 工业装备通常按 24h 连续运转计算开工率 92%
        operating_hours = operating_days * 24.0 * 0.92
        total_running_hours += operating_hours
        equipment_fault_counts[eq_id] = 0

    for od in orders:
        eid = od.get("equipment_id")
        if eid in equipment_fault_counts:
            equipment_fault_counts[eid] += 1

    total_failures = sum(equipment_fault_counts.values())
    if total_failures > 0:
        mtbf_hours = round(total_running_hours / total_failures, 1)
    else:
        mtbf_hours = round(total_running_hours / max(1, total_equips), 1)

    # 2. 动态统计已闭环工单的真实修复时长 (MTTR)
    repair_durations: List[float] = []
    # 建立 order_no 到 closed_at 映射
    closed_log_map = {l["order_no"]: l["closed_at"] for l in logs if l.get("closed_at")}

    for od in orders:
        if od["status"] == "CLOSED":
            t_created = _parse_time(od.get("created_at", ""))
            # 优先从 maintenance_logs 读取 closed_at，其次从 updated_at 读取
            t_closed_str = closed_log_map.get(od["order_no"]) or od.get("updated_at")
            t_closed = _parse_time(t_closed_str)
            if t_created and t_closed and t_closed >= t_created:
                duration_hours = (t_closed - t_created).total_seconds() / 3600.0
                repair_durations.append(max(0.1, duration_hours))
            else:
                repair_durations.append(1.5) # 标准基准工时

    if repair_durations:
        mttr_hours = round(sum(repair_durations) / len(repair_durations), 1)
    else:
        mttr_hours = 1.6

    # 3. 动态经济效益与停机挽回损失统计 (各装备产线单小时产值差异化)
    # 离心泵 P-201 属于浓硫酸主循环工段: 15,000 元/小时
    # 调节阀 V-102 属于加氢裂化反应塔进料回路: 20,000 元/小时
    # 其他通用流体机组基准: 12,000 元/小时
    avoided_downtime_hours = 0.0
    estimated_saved_cost = 0

    for od in orders:
        eid = od.get("equipment_id", "")
        sev = od.get("severity", "MEDIUM")
        # 严重度对应潜在非计划停机时长
        base_downtime = 10.0 if sev == "CRITICAL" else (6.0 if sev == "HIGH" else 3.5)
        avoided_downtime_hours += base_downtime
        
        hourly_rate = 15000 if "P-201" in eid else (20000 if "V-102" in eid else 12000)
        estimated_saved_cost += int(base_downtime * hourly_rate)

    avoided_downtime_hours = round(avoided_downtime_hours, 1)

    # 4. 设备多维健康度动态评估 (结合遥测异常、工单缺陷与基础台账)
    # 检查当前路由器测点状态
    try:
        latest_tele = data_source_router.get_latest_measurements()
    except Exception:
        latest_tele = {}

    ranked_equips = []
    for eq in equips:
        eq_id = eq["id"]
        base_score = float(eq.get("health_score", 95.0))
        penalty = 0.0

        # 惩罚未闭环缺陷工单
        unclosed_for_eq = [o for o in orders if o.get("equipment_id") == eq_id and o["status"] != "CLOSED"]
        for un_o in unclosed_for_eq:
            if un_o["severity"] == "CRITICAL":
                penalty += 12.0
            elif un_o["severity"] == "HIGH":
                penalty += 7.0
            else:
                penalty += 3.0

        # 结合实时遥测惩罚
        if eq_id == "P-201":
            p201_m = latest_tele.get("p201", {})
            if p201_m.get("status") == "CRITICAL_CAVITATION" or p201_m.get("cavitation_margin_m", 1.0) < 0.3:
                penalty = max(penalty, 18.0)
        elif eq_id == "V-102":
            v102_m = latest_tele.get("v102", {})
            if v102_m.get("status") == "CRITICAL_JAMMED" or v102_m.get("deadband_pct", 0.5) > 1.2:
                penalty = max(penalty, 15.0)

        dynamic_score = round(max(30.0, min(100.0, base_score - penalty)), 1)
        eq_copy = dict(eq)
        eq_copy["health_score"] = dynamic_score
        ranked_equips.append(eq_copy)

    avg_health = round(sum(e["health_score"] for e in ranked_equips) / max(1, total_equips), 1)

    return {
        "kpis": {
            "total_assets": total_equips,
            "avg_health_score": avg_health,
            "mtbf_hours": mtbf_hours,
            "mttr_hours": mttr_hours,
            "avoided_downtime_hours": avoided_downtime_hours,
            "estimated_saved_cny": estimated_saved_cost,
            "active_orders_count": len([o for o in orders if o["status"] != "CLOSED"])
        },
        "health_ranking": sorted(ranked_equips, key=lambda x: x["health_score"])
    }

@router.get("/supply-chain-map")
def get_supply_chain_map():
    """获取永嘉县本地 2 小时应急备件供应链物流拓扑网 (优先对接企业供应链接口)"""
    client = data_source_router.client
    if client.is_configured():
        try:
            enterprise_hubs = client.get_supply_chain_hubs()
            if enterprise_hubs and len(enterprise_hubs) > 0:
                return {
                    "region": "浙江省温州市永嘉县",
                    "source": "ENTERPRISE_API",
                    "hubs": enterprise_hubs
                }
        except Exception:
            pass

    return {
        "region": "浙江省温州市永嘉县",
        "source": "LOCAL_TOPOLOGY",
        "hubs": DEFAULT_SUPPLY_HUBS
    }

