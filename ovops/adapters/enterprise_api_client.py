import time
import httpx
from typing import Dict, Any, List, Optional
from ovops.adapters.base_adapter import BaseDeviceAdapter, DeviceMeasurement
from ovops.adapters.data_mapper import DataMapper

class EnterpriseApiClient(BaseDeviceAdapter):
    """
    企业设备数据统一 HTTP 查询客户端
    按规范接入企业侧设备查询 API，提供真实工况测点拉取
    """

    def __init__(
        self,
        base_url: str,
        token: Optional[str] = None,
        auth_type: str = "bearer",
        timeout: float = 3.0,
        transport: Optional[httpx.BaseTransport] = None
    ):
        self.base_url = (base_url or "").rstrip("/")
        self.token = (token or "").strip()
        self.auth_type = (auth_type or "bearer").lower()
        self.timeout = max(0.5, float(timeout))
        self.transport = transport

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Accept": "application/json",
            "User-Agent": "OuValve-Ops-Adapter/1.0"
        }
        if self.token:
            if self.auth_type == "bearer":
                headers["Authorization"] = f"Bearer {self.token}"
            elif self.auth_type == "api_key":
                headers["X-API-Key"] = self.token
                headers["Authorization"] = f"ApiKey {self.token}"
        return headers

    def _create_client(self) -> httpx.Client:
        kwargs: Dict[str, Any] = {
            "timeout": self.timeout,
            "headers": self._get_headers()
        }
        if self.transport is not None:
            kwargs["transport"] = self.transport
        return httpx.Client(**kwargs)

    def is_configured(self) -> bool:
        """是否已配置有效的企业接口地址"""
        return bool(self.base_url and self.base_url.startswith("http"))

    def get_realtime_data(self, equipment_id: str) -> Optional[DeviceMeasurement]:
        """获取企业指定设备的最新秒级实时测点数据"""
        if not self.is_configured():
            return None

        url = f"{self.base_url}/devices/{equipment_id}/realtime-data"
        try:
            with self._create_client() as client:
                res = client.get(url)
                if res.status_code == 404:
                    # 尝试备用端点：/devices/{id}
                    alt_url = f"{self.base_url}/devices/{equipment_id}"
                    res = client.get(alt_url)

                if res.status_code == 200:
                    data = res.json()
                    return DataMapper.map_to_measurement(data, default_equipment_id=equipment_id)
                return None
        except Exception:
            return None

    def get_history_data(self, equipment_id: str, count: int = 60) -> List[Dict[str, Any]]:
        """获取指定设备的历史时序数据列表"""
        if not self.is_configured():
            return []

        url = f"{self.base_url}/devices/{equipment_id}/history?count={count}"
        try:
            with self._create_client() as client:
                res = client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    # 兼容 list 形式或 { "data_points": [...] } 形式
                    points = data if isinstance(data, list) else (data.get("data_points") or data.get("history") or [])
                    result = []
                    for pt in points:
                        m = DataMapper.map_to_measurement(pt, default_equipment_id=equipment_id)
                        result.append(m.to_dict())
                    return result
                return []
        except Exception:
            return []

    def get_device_list(self) -> List[Dict[str, Any]]:
        """获取企业系统中的在线设备台账列表"""
        if not self.is_configured():
            return []

        url = f"{self.base_url}/devices"
        try:
            with self._create_client() as client:
                res = client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    devices = data if isinstance(data, list) else (data.get("devices") or data.get("list") or [])
                    return devices
                return []
        except Exception:
            return []

    def get_supply_chain_hubs(self) -> List[Dict[str, Any]]:
        """从企业供应链/ERP系统获取本地应急备品保障仓物流与库存数据 (Phase 11)"""
        if not self.is_configured():
            return []

        url = f"{self.base_url}/supply-chain/hubs"
        try:
            with self._create_client() as client:
                res = client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    hubs = data if isinstance(data, list) else (data.get("hubs") or data.get("list") or [])
                    return hubs
                return []
        except Exception:
            return []

    def ping(self) -> Dict[str, Any]:
        """测试与企业数据接口的连通性、网络延迟与数据包自校验"""
        if not self.is_configured():
            return {
                "status": "error",
                "message": "企业 API Base URL 未配置，请先填写企业接口地址（如 http://192.168.x.x:5000/api）"
            }

        start = time.time()
        url = f"{self.base_url}/devices"
        try:
            with self._create_client() as client:
                res = client.get(url)
                latency_ms = max(1, int((time.time() - start) * 1000))
                if res.status_code == 200:
                    try:
                        data = res.json()
                        devs = data if isinstance(data, list) else (data.get("devices") or [])
                        dev_count = len(devs)
                        sample_names = [d.get("device_name") or d.get("name") or d.get("device_id") or d.get("id") for d in devs[:3]]
                        return {
                            "status": "success",
                            "status_code": res.status_code,
                            "latency_ms": latency_ms,
                            "devices_detected": dev_count,
                            "sample_devices": [s for s in sample_names if s],
                            "message": f"企业接口连通成功！延迟 {latency_ms}ms，成功读取 {dev_count} 台工业设备数据。"
                        }
                    except Exception:
                        return {
                            "status": "success",
                            "status_code": res.status_code,
                            "latency_ms": latency_ms,
                            "message": f"企业端点响应 HTTP 200 (延迟 {latency_ms}ms)，但响应非标准 JSON 格式。"
                        }
                elif res.status_code in (401, 403):
                    return {
                        "status": "error",
                        "status_code": res.status_code,
                        "latency_ms": latency_ms,
                        "message": f"企业接口鉴权失败 (HTTP {res.status_code})，请检查企业 API Token 或鉴权方式是否正确。"
                    }
                else:
                    return {
                        "status": "error",
                        "status_code": res.status_code,
                        "latency_ms": latency_ms,
                        "message": f"企业接口返回异常状态码 HTTP {res.status_code}: {res.text[:150]}"
                    }
        except httpx.ConnectTimeout:
            return {
                "status": "error",
                "message": f"连接企业接口超时 ({self.timeout}s)，请检查网络连通性或防火墙放行规则。"
            }
        except httpx.ConnectError as e:
            return {
                "status": "error",
                "message": f"无法建立与企业接口的网络连接 ({self.base_url})，错误详情: {str(e)}"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"请求企业接口出现未知异常: {str(e)}"
            }
