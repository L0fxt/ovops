import json
import sqlite3
import pytest
import httpx
from fastapi.testclient import TestClient
from config.settings import settings
from ovops.main import app
from ovops.adapters.enterprise_api_client import EnterpriseApiClient
from ovops.adapters.sync_service import AssetSyncService
from ovops.adapters.router import data_source_router
from ovops.tools.physics_tools import calculate_pump_cavitation, analyze_vibration_fft, calculate_valve_hysteresis

client = TestClient(app)

def test_sync_service_skipped_when_unconfigured():
    """未配置企业 API 地址时，同步服务跳过并保持现有本地数据"""
    sync_service = AssetSyncService()
    # 模拟未配置客户端
    data_source_router.client = EnterpriseApiClient(base_url="")
    res = sync_service.sync_equipments()
    assert res["status"] == "skipped"
    assert res["synced_count"] == 0

def test_asset_sync_service_with_mock_devices():
    """使用 MockTransport 验证从企业 API 获取设备台账并持久化到 SQLite"""
    mock_devices = [
        {
            "id": "P-901",
            "name": "特种高扬程多级离心泵",
            "category": "离心泵",
            "model": "YJ-DY-150-100",
            "manufacturer": "永嘉县泵业骨干重工集团",
            "installation_area": "加氢裂化循环工段",
            "status": "RUNNING",
            "health_score": 97.5,
            "rated_params": {
                "flow_rate_m3h": 160.0,
                "head_m": 85.0,
                "rpm": 1480, # 低转速电机 ~ 24.7 Hz
                "npsh_r": 4.1, # 铭牌必需汽蚀余量
                "pipe_dn_mm": 150, # DN150 管径
                "medium_density_kgm3": 1200.0
            },
            "spare_parts": [
                {
                    "part_code": "SP-P901-IMP",
                    "name": "闭式多级特种叶轮",
                    "spec": "DN150-SS316L",
                    "stock_qty": 6,
                    "min_safety_stock": 2,
                    "unit_price": 9800.0,
                    "supplier": "永嘉特种流体备件保障库"
                }
            ]
        },
        {
            "id": "V-902",
            "name": "金属硬密封高温高压蝶阀",
            "category": "控制阀",
            "model": "YJ-BV-DN150",
            "manufacturer": "永嘉智能流体控制装备厂",
            "installation_area": "裂解反应气相管网",
            "status": "RUNNING",
            "health_score": 96.0,
            "rated_params": {
                "nominal_dn": 150,
                "pn_rating": "PN250",
                "deadband_tolerance_pct": 0.6 # 严苛出厂回差容限 0.6%
            }
        }
    ]

    def mock_devices_handler(request: httpx.Request):
        url = str(request.url)
        if "/devices" in url:
            return httpx.Response(200, json={"devices": mock_devices})
        return httpx.Response(404)

    mock_client = EnterpriseApiClient(
        base_url="http://enterprise-asset-center.local/api",
        token="test_sync_token",
        transport=httpx.MockTransport(mock_devices_handler)
    )
    data_source_router.client = mock_client

    sync_service = AssetSyncService()
    res = sync_service.sync_equipments(force=True)

    assert res["status"] == "success"
    assert res["synced_count"] == 2
    assert res["parts_synced_count"] >= 1

    # 查验 SQLite 是否已成功落库
    conn = sqlite3.connect(settings.ERP_DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM equipments WHERE id = 'P-901'")
    p901 = c.fetchone()
    assert p901 is not None
    assert p901["name"] == "特种高扬程多级离心泵"
    rated = json.loads(p901["rated_params"])
    assert rated["npsh_r"] == 4.1
    assert rated["rpm"] == 1480
    assert rated["pipe_dn_mm"] == 150

    c.execute("SELECT * FROM spare_parts WHERE part_code = 'SP-P901-IMP'")
    sp = c.fetchone()
    assert sp is not None
    assert sp["stock_qty"] == 6

    conn.close()

def test_physics_tools_dynamic_parameterization():
    """测试物理机理工具根据动态设备铭牌参数计算，杜绝硬编码常数"""
    # 针对已同步的 P-901（NPSHr=4.1m, DN150, 密度=1200, 转速=1480RPM）
    res_pump = calculate_pump_cavitation(
        equipment_id="P-901",
        inlet_pressure_kpa=125.0,
        fluid_temp_c=45.0,
        flow_rate_m3h=160.0
    )
    # 动态铭牌参数断言
    assert res_pump["rated_npshr_m"] == 4.1
    assert res_pump["pipe_dn_mm"] == 150.0
    assert res_pump["medium_density_kgm3"] == 1200.0

    # 针对 P-901 的 FFT 频域分析
    res_fft = analyze_vibration_fft(equipment_id="P-901")
    assert res_fft["rated_rpm"] == 1480.0
    assert res_fft["rated_base_frequency_hz"] == 24.7  # 1480 / 60 = 24.667 -> 24.7 Hz

    # 针对 V-902 的回差分析
    res_valve = calculate_valve_hysteresis(equipment_id="V-902")
    assert res_valve["standard_limit_pct"] == 0.6  # 动态读取出厂容限 0.6%

def test_system_sync_endpoints():
    """测试 /api/system/sync-assets 与 /api/system/sync-status 端点"""
    res_status = client.get("/api/system/sync-status")
    assert res_status.status_code == 200
    st_data = res_status.json()
    assert "last_sync_status" in st_data
    assert "last_sync_count" in st_data

    res_sync = client.post("/api/system/sync-assets")
    assert res_sync.status_code == 200
    sync_data = res_sync.json()
    assert "status" in sync_data
