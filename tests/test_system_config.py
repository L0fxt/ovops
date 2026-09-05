import pytest
from fastapi.testclient import TestClient
from ovops.main import app

client = TestClient(app)

def test_get_system_config():
    response = client.get("/api/system/config")
    assert response.status_code == 200
    data = response.json()
    assert "llm_base_url" in data
    assert "llm_model" in data
    assert "cavitation_tolerance" in data
    assert "valve_deadband_limit" in data

def test_update_system_config():
    update_payload = {
        "configs": {
            "cavitation_tolerance": "0.45",
            "valve_deadband_limit": "1.2"
        }
    }
    response = client.post("/api/system/config", json=update_payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "success"

    # 验证获取到的新值
    check_res = client.get("/api/system/config")
    check_data = check_res.json()
    assert check_data["cavitation_tolerance"]["value"] == "0.45"
    assert check_data["valve_deadband_limit"]["value"] == "1.2"

def test_llm_ping_mock():
    # 测试在无效/测试 key 时的优雅处理或响应格式
    test_payload = {
        "base_url": "https://api.deepseek.com/v1",
        "api_key": "test_invalid_key",
        "model": "deepseek-chat"
    }
    response = client.post("/api/system/test-llm", json=test_payload)
    assert response.status_code == 200
    data = response.json()
    # 无论远程是否连通，接口都应返回结构化测试诊断
    assert "status" in data
    assert "message" in data

def test_channel_ping_simulated():
    # 测试未配置 webhook 时自动启用模拟通道
    test_payload = {
        "channel": "DINGTALK",
        "webhook": ""
    }
    response = client.post("/api/system/test-channel", json=test_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["mode"] == "SIMULATED_CHANNEL"

def test_channel_ping_invalid_webhook():
    # 测试提供无效地址时的错误返回
    test_payload = {
        "channel": "FEISHU",
        "webhook": "http://127.0.0.1:54321/invalid_webhook_hook"
    }
    response = client.post("/api/system/test-channel", json=test_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "error"
