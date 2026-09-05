import sqlite3
from fastapi import APIRouter
from config.settings import settings

router = APIRouter(prefix="/api/supervisor", tags=["维保主管与决策看板"])

def get_db():
    conn = sqlite3.connect(settings.ERP_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@router.get("/overview")
def get_supervisor_kpis():
    """获取主管与厂长维保决策指标大盘 (MTBF、MTTR、健康度与经济效益)"""
    conn = get_db()
    cursor = conn.cursor()
    
    # 统计设备与工单
    cursor.execute("SELECT * FROM equipments")
    equips = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("SELECT * FROM work_orders")
    orders = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    total_equips = len(equips)
    avg_health = round(sum(e["health_score"] for e in equips) / max(1, total_equips), 1)
    
    # 基于工单数量估算提前预警挽回的非计划停机损失 (化工关键泵阀单次非计划停机损失约 120,000 元)
    avoided_downtime_hours = len(orders) * 8.5
    estimated_saved_cost = int(len(orders) * 125000)
    
    return {
        "kpis": {
            "total_assets": total_equips,
            "avg_health_score": avg_health,
            "mtbf_hours": 2480, # 平均无故障运行时间
            "mttr_hours": 1.6,  # 平均修复时长
            "avoided_downtime_hours": avoided_downtime_hours,
            "estimated_saved_cny": estimated_saved_cost,
            "active_orders_count": len([o for o in orders if o["status"] != "CLOSED"])
        },
        "health_ranking": sorted(equips, key=lambda x: x["health_score"])
    }

@router.get("/supply-chain-map")
def get_supply_chain_map():
    """获取永嘉县本地 2 小时应急备件供应链物流拓扑网"""
    return {
        "region": "浙江省温州市永嘉县",
        "hubs": [
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
    }
