import time
import pytest
import httpx
from fastapi.testclient import TestClient
from ovops.main import app
from ovops.adapters.base_adapter import DeviceMeasurement
from ovops.adapters.data_mapper import DataMapper
from ovops.adapters.cache import TelemetryCache
from ovops.adapters.health_checker import HealthChecker
from ovops.adapters.enterprise_api_client import EnterpriseApiClient
from ovops.adapters.router import DataSourceRouter

client = TestClient(app)

def test_data_mapper_standard_schema():
    """测试标准企业规约格式解析"""
    raw_data = {
        "device_id": "P-201",
        "timestamp": "2026-09-07T10:00:00Z",
        "measurements": {
            "inlet_pressure": 128.5,
            "outlet_pressure": 652.0,
            "vibration_rms": 1.75,
            "flow_rate": 119.5,
            "bearing_temperature": 52.8
        },
        "unit_mapping": {
            "inlet_pressure": "kPa",
            "outlet_pressure": "kPa",
            "vibration_rms": "mm/s",
            "flow_rate": "m³/h",
            "bearing_temperature": "℃"
        }
    }
    m = DataMapper.map_to_measurement(raw_data)
    assert m.equipment_id == "P-201"
    assert m.inlet_pressure_kpa == 128.5
    assert m.outlet_pressure_kpa == 652.0
    assert m.vibration_rms_mms == 1.75
    assert m.flow_rate_m3h == 119.5
    assert m.bearing_temp_c == 52.8
    assert m.status == "HEALTHY"

def test_data_mapper_non_standard_and_unit_conversion():
    """测试非标命名与压力单位 (bar -> kPa) 自动换算"""
    raw_data = {
        "deviceId": "P-201",
        "Pin": 1.35,  # bar
        "Pout": 6.80, # bar
        "vib": 7.8,   # 超标振动
        "unit_mapping": {
            "Pin": "bar",
            "Pout": "bar"
        }
    }
    m = DataMapper.map_to_measurement(raw_data)
    assert m.equipment_id == "P-201"
    assert m.inlet_pressure_kpa == 135.0  # 1.35 bar = 135 kPa
    assert m.outlet_pressure_kpa == 680.0
    assert m.vibration_rms_mms == 7.8
    assert m.status == "CRITICAL_CAVITATION"

def test_telemetry_cache_ttl():
    """测试滑动窗口 TTL 缓存过期与命中率统计"""
    cache = TelemetryCache(default_ttl=0.2)
    cache.set("test_key", {"val": 123})
    
    assert cache.get("test_key") == {"val": 123}
    time.sleep(0.25)
    assert cache.get("test_key") is None
    
    stats = cache.get_stats()
    assert stats["hits"] >= 1
    assert stats["misses"] >= 1

def test_health_checker_circuit_breaker():
    """测试连续失败熔断与探活恢复逻辑"""
    checker = HealthChecker(failure_threshold=3, probe_interval_seconds=0.3)
    assert checker.is_healthy() is True
    
    checker.record_failure("Err 1")
    checker.record_failure("Err 2")
    assert checker.is_healthy() is True
    
    checker.record_failure("Err 3")
    assert checker.is_healthy() is False
    assert checker.state == "DEGRADED"
    
    # 探活时间窗
    assert checker.should_probe() is False
    time.sleep(0.35)
    assert checker.should_probe() is True
    
    # 成功后自动解除熔断
    checker.record_success(latency_ms=15.0)
    assert checker.is_healthy() is True
    assert checker.state == "HEALTHY"

def test_enterprise_api_client_mock():
    """使用 MockTransport 验证企业 API 客户端各接口与状态码处理"""
    def mock_handler(request: httpx.Request):
        url = str(request.url)
        if url.endswith("/devices"):
            return httpx.Response(200, json={"devices": [{"id": "P-201", "name": "特种高硅耐酸工业离心泵"}]})
        elif "/history" in url:
            return httpx.Response(200, json=[
                {"timestamp": time.time() - 2, "inlet_pressure_kpa": 125.0},
                {"timestamp": time.time(), "inlet_pressure_kpa": 126.0}
            ])
        elif "/devices/P-201/realtime-data" in url or "/devices/P-201" in url:
            return httpx.Response(200, json={
                "device_id": "P-201",
                "inlet_pressure_kpa": 126.0,
                "vibration_rms_mms": 1.65,
                "flow_rate_m3h": 120.0
            })
        return httpx.Response(404)

    mock_transport = httpx.MockTransport(mock_handler)
    api_client = EnterpriseApiClient(
        base_url="http://mock-enterprise.local/api",
        token="test_mock_token",
        auth_type="bearer",
        transport=mock_transport
    )
    
    # 1. 测试 ping
    ping_res = api_client.ping()
    assert ping_res["status"] == "success"
    assert ping_res["devices_detected"] == 1
    
    # 2. 测试实时遥测获取
    m = api_client.get_realtime_data("P-201")
    assert m is not None
    assert m.equipment_id == "P-201"
    assert m.inlet_pressure_kpa == 126.0
    
    # 3. 测试历史数据
    hist = api_client.get_history_data("P-201", count=10)
    assert len(hist) == 2

def test_data_source_router_flow():
    """测试双模数据源路由器在真实与降级下的行为"""
    router = DataSourceRouter()
    
    # 未配置时走仿真器
    router.reload_config(base_url="", mode="SIMULATOR_ONLY")
    data = router.get_latest_telemetry()
    assert "_source" in data
    assert "p201" in data
    assert "v102" in data

    # 切换 API_FIRST 并注入 mock 客户端
    def healthy_handler(request: httpx.Request):
        return httpx.Response(200, json={
            "device_id": "P-201",
            "inlet_pressure_kpa": 122.5,
            "vibration_rms_mms": 1.55,
            "bearing_temp_c": 51.0
        })

    mock_client = EnterpriseApiClient(
        base_url="http://enterprise-online.test",
        transport=httpx.MockTransport(healthy_handler)
    )
    router.client = mock_client
    router.mode = "API_FIRST"
    router.cache.clear()
    
    res = router.get_latest_telemetry()
    assert res["_source"] == "ENTERPRISE_API"
    assert res["p201"]["inlet_pressure_kpa"] == 122.5

def test_telemetry_routes_and_source_status():
    """测试 /api/telemetry/source-status 及接口输出结构"""
    res = client.get("/api/telemetry/source-status")
    assert res.status_code == 200
    status_data = res.json()
    assert "data_source_mode" in status_data
    assert "active_source" in status_data
    assert "health" in status_data
    assert "cache" in status_data

    # 测试 /api/telemetry/latest
    latest_res = client.get("/api/telemetry/latest")
    assert latest_res.status_code == 200
    latest_data = latest_res.json()
    assert "_source" in latest_data
    assert "p201" in latest_data
    assert "v102" in latest_data

def test_system_enterprise_api_test_endpoint():
    """测试 /api/system/test-enterprise-api 诊断接口与配置更新"""
    # 1. 未配置地址时的错误提示
    test_req = {
        "base_url": "",
        "token": "",
        "auth_type": "bearer"
    }
    res = client.post("/api/system/test-enterprise-api", json=test_req)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "error"
    assert "未配置" in data["message"]

    # 2. 更新配置热生效
    update_req = {
        "configs": {
            "enterprise_api_base_url": "http://192.168.10.50:8080/api",
            "data_source_mode": "API_FIRST",
            "enterprise_api_auth_type": "api_key"
        }
    }
    put_res = client.post("/api/system/config", json=update_req)
    assert put_res.status_code == 200
    
    cfg_check = client.get("/api/system/config").json()
    assert cfg_check["enterprise_api_base_url"]["value"] == "http://192.168.10.50:8080/api"
    assert cfg_check["data_source_mode"]["value"] == "API_FIRST"
