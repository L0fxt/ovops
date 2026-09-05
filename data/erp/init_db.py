import sqlite3
import json
import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent / "ovops_erp.db"

def init_erp_database():
    if DB_PATH.exists():
        DB_PATH.unlink() # 重新生成干净的数据库
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. 设备台账表 (ERP Equipments Ledger)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS equipments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        model TEXT NOT NULL,
        manufacturer TEXT NOT NULL,
        installation_area TEXT NOT NULL,
        status TEXT NOT NULL,
        health_score REAL NOT NULL,
        rated_params TEXT NOT NULL,
        commission_date TEXT NOT NULL
    )
    """)
    
    # 2. 备品备件库存表 (ERP Spare Parts Inventory)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS spare_parts (
        part_code TEXT PRIMARY KEY,
        equipment_id TEXT NOT NULL,
        name TEXT NOT NULL,
        spec TEXT NOT NULL,
        stock_qty INTEGER NOT NULL,
        min_safety_stock INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        lead_time_days INTEGER NOT NULL,
        supplier TEXT NOT NULL,
        FOREIGN KEY (equipment_id) REFERENCES equipments(id)
    )
    """)
    
    # 3. 运维工单表 (ERP Maintenance Work Orders)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS work_orders (
        order_no TEXT PRIMARY KEY,
        equipment_id TEXT NOT NULL,
        fault_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        status TEXT NOT NULL,
        decomposed_steps TEXT NOT NULL,
        required_parts TEXT NOT NULL,
        assigned_tech TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        resolution_note TEXT,
        FOREIGN KEY (equipment_id) REFERENCES equipments(id)
    )
    """)

    # 4. 系统动态配置表 (System Dynamic Configurations)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_configs (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    # 5. 维保记录与现场技师实操留痕闭环表 (Maintenance Logs)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS maintenance_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_no TEXT NOT NULL,
        equipment_id TEXT NOT NULL,
        tech_name TEXT NOT NULL,
        loto_confirmed INTEGER NOT NULL,
        completed_steps TEXT NOT NULL,
        photo_evidence TEXT,
        tech_notes TEXT NOT NULL,
        closed_at TEXT NOT NULL,
        FOREIGN KEY (order_no) REFERENCES work_orders(order_no)
    )
    """)

    # 插入设备种子数据
    equipments_data = [
        (
            "P-201",
            "特种高硅耐酸工业离心泵",
            "离心泵",
            "YJ-SZB-100-80",
            "永嘉特种合金泵业制造一厂",
            "精细化工区·98%浓硫酸循环工段",
            "RUNNING",
            96.5,
            json.dumps({
                "flow_rate_m3h": 120.0,
                "head_m": 52.0,
                "rpm": 2900,
                "npsh_r": 3.2,
                "impeller_material": "超高硅耐酸特种合金",
                "motor_power_kw": 37.0
            }, ensure_ascii=False),
            "2023-04-15"
        ),
        (
            "V-102",
            "高压套筒气动调节阀",
            "控制阀",
            "YJ-HV-CV-DN100",
            "永嘉智能流程控制装备制造厂",
            "加氢裂化反应塔·进料流量微调回路",
            "RUNNING",
            94.0,
            json.dumps({
                "nominal_dn": 100,
                "pn_rating": "PN160",
                "stroke_mm": 50.0,
                "positioner_model": "SIPART-PS2 智能定位器",
                "deadband_tolerance_pct": 0.8,
                "hysteresis_tolerance_pct": 1.2
            }, ensure_ascii=False),
            "2023-08-20"
        ),
        (
            "P-202",
            "大流量中开双吸离心泵",
            "离心泵",
            "YJ-OW-200-500",
            "永嘉流体重型装备制造基地",
            "动力厂·主装置循环冷却水系统",
            "RUNNING",
            98.0,
            json.dumps({
                "flow_rate_m3h": 450.0,
                "head_m": 68.0,
                "rpm": 1480,
                "npsh_r": 3.8,
                "impeller_material": "316L不锈钢"
            }, ensure_ascii=False),
            "2024-01-10"
        ),
        (
            "V-103",
            "金属硬密封高温高压球阀",
            "控制阀",
            "YJ-MD-Q41Y-Class600",
            "永嘉特种硬密封阀门制造基地",
            "重整装置·原料油高温紧急切断系统",
            "RUNNING",
            99.0,
            json.dumps({
                "nominal_dn": 150,
                "pn_rating": "Class 600",
                "leakage_class": "ANSI Class VI (零泄漏)",
                "actuator": "气动双作用活塞"
            }, ensure_ascii=False),
            "2024-03-05"
        )
    ]
    cursor.executemany("INSERT INTO equipments VALUES (?,?,?,?,?,?,?,?,?,?)", equipments_data)
    
    # 插入备品备件库存数据
    spare_parts_data = [
        ("SP-P201-IMP", "P-201", "超耐酸闭式高硅叶轮组件", "YJ-IMP-100-A", 8, 3, 6800.0, 1, "永嘉特种流体备件分发中心"),
        ("SP-P201-SEAL", "P-201", "集装式耐浓酸碳化硅动静环机械密封", "YJ-MECM-80SiC", 15, 5, 3200.0, 1, "永嘉县流体密封精工备件库"),
        ("SP-P201-BRG", "P-201", "角接触球轴承组", "SKF-7312-BECBM", 20, 6, 850.0, 2, "温州轴承特约供销中心"),
        ("SP-V102-PACK", "V-102", "抗挤出低泄漏柔性石墨填料组合环", "YJ-PACK-DN100-HT", 24, 8, 420.0, 1, "永嘉流程控制阀备品保障仓"),
        ("SP-V102-SEAT", "V-102", "司太立合金堆焊阀芯与套筒阀座对磨组", "YJ-TRIM-Stellite6", 5, 2, 5600.0, 2, "永嘉控制阀精密数控精工制造厂"),
        ("SP-V102-POS", "V-102", "数字式气动智能阀门定位器", "YJ-SmartPos-02", 6, 2, 4800.0, 1, "永嘉工业控制执行机构储备库")
    ]
    cursor.executemany("INSERT INTO spare_parts VALUES (?,?,?,?,?,?,?,?,?)", spare_parts_data)
    
    # 插入系统动态配置默认值
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    configs_data = [
        ("llm_base_url", "https://api.deepseek.com", "LLM", "大语言模型 API Base URL (OpenAI兼容协议)", now_str),
        ("llm_api_key", "", "LLM", "大语言模型 API 认证密钥 (留空则启用内置高保真机理引擎)", now_str),
        ("llm_model", "deepseek-v4-pro", "LLM", "选定推理模型 (DeepSeek-V4-Pro / Flash 等)", now_str),
        ("dingtalk_webhook", "", "CHANNEL", "钉钉自定义机器人 Webhook URL", now_str),
        ("feishu_webhook", "", "CHANNEL", "飞书自定义机器人 Webhook URL", now_str),
        ("cavitation_tolerance", "0.5", "THRESHOLD", "离心泵气蚀安全裕度阈值 (米)", now_str),
        ("valve_deadband_limit", "1.0", "THRESHOLD", "控制阀回差死区允许上限 (%)", now_str)
    ]
    cursor.executemany("INSERT INTO system_configs VALUES (?,?,?,?,?)", configs_data)
    
    conn.commit()
    conn.close()
    print(f"✅ ERP SQLite database successfully seeded at: {DB_PATH}")

if __name__ == "__main__":
    init_erp_database()
