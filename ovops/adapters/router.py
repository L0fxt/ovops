import time
import logging
from typing import Dict, Any, List, Optional
from config.settings import settings
from ovops.simulator.fault_generator import telemetry_sim
from ovops.adapters.enterprise_api_client import EnterpriseApiClient
from ovops.adapters.cache import TelemetryCache
from ovops.adapters.health_checker import HealthChecker

logger = logging.getLogger("ovops.adapters.router")

class DataSourceRouter:
    """
    工业设备遥测双模数据源路由器
    支持：
    1. API_FIRST (默认): 优先通过企业 API 查询真实测点，超时或熔断自动平滑降级至仿真器；
    2. API_ONLY: 纯生产模式，严格要求真实接口，不可用时不提供虚构数据；
    3. SIMULATOR_ONLY: 离线演练/展演模式，强制使用内置高保真数学机理仿真器。
    """

    def __init__(self):
        self.cache = TelemetryCache(default_ttl=1.5)
        self.health_checker = HealthChecker(failure_threshold=3, probe_interval_seconds=15.0)
        self.client = EnterpriseApiClient(
            base_url=getattr(settings, "ENTERPRISE_API_BASE_URL", ""),
            token=getattr(settings, "ENTERPRISE_API_TOKEN", ""),
            auth_type=getattr(settings, "ENTERPRISE_API_AUTH_TYPE", "bearer"),
            timeout=getattr(settings, "ENTERPRISE_API_TIMEOUT", 3.0)
        )
        self.mode = getattr(settings, "DATA_SOURCE_MODE", "API_FIRST").upper()

    def reload_config(
        self,
        base_url: Optional[str] = None,
        token: Optional[str] = None,
        auth_type: Optional[str] = None,
        mode: Optional[str] = None,
        timeout: Optional[float] = None
    ):
        """系统设置更新时热重载数据源路由与客户端连接"""
        if base_url is not None:
            setattr(settings, "ENTERPRISE_API_BASE_URL", base_url)
        if token is not None:
            setattr(settings, "ENTERPRISE_API_TOKEN", token)
        if auth_type is not None:
            setattr(settings, "ENTERPRISE_API_AUTH_TYPE", auth_type)
        if mode is not None:
            setattr(settings, "DATA_SOURCE_MODE", mode.upper())
            self.mode = mode.upper()
        if timeout is not None:
            setattr(settings, "ENTERPRISE_API_TIMEOUT", float(timeout))

        self.client = EnterpriseApiClient(
            base_url=getattr(settings, "ENTERPRISE_API_BASE_URL", ""),
            token=getattr(settings, "ENTERPRISE_API_TOKEN", ""),
            auth_type=getattr(settings, "ENTERPRISE_API_AUTH_TYPE", "bearer"),
            timeout=getattr(settings, "ENTERPRISE_API_TIMEOUT", 3.0)
        )
        self.cache.clear()
        logger.info(f"[DataSourceRouter] 配置已热重载: mode={self.mode}, url={self.client.base_url}")

    def get_latest_telemetry(self) -> Dict[str, Any]:
        """
        获取最新秒级多设备遥测数据包
        输出格式对标原接口并新增 _source 标识:
        { "p201": {...}, "v102": {...}, "fault_mode": "...", "_source": "ENTERPRISE_API" | "SIMULATOR" }
        """
        # 1. 命中高速缓存
        cached = self.cache.get("latest_telemetry")
        if cached:
            return cached

        # 2. 检查模式是否强制离线仿真
        if self.mode == "SIMULATOR_ONLY" or not self.client.is_configured():
            sim_data = telemetry_sim.sample_tick()
            sim_data["_source"] = "SIMULATOR"
            self.cache.set("latest_telemetry", sim_data, ttl_seconds=1.0)
            return sim_data

        # 3. 检查熔断状态是否允许调用真实 API
        should_call_api = self.health_checker.is_healthy() or self.health_checker.should_probe()

        if should_call_api:
            t0 = time.time()
            try:
                # 分别拉取 P-201 与 V-102 测点
                p201_m = self.client.get_realtime_data("P-201")
                v102_m = self.client.get_realtime_data("V-102")

                if p201_m or v102_m:
                    dur_ms = max(1, (time.time() - t0) * 1000)
                    self.health_checker.record_success(dur_ms)

                    # 若只查到单台，另一台用仿真器兼容兜底填充
                    sim_fallback = telemetry_sim.sample_tick()
                    res_p201 = p201_m.to_dict() if p201_m else sim_fallback["p201"]
                    res_v102 = v102_m.to_dict() if v102_m else sim_fallback["v102"]

                    # 识别工况模式
                    fault_mode = "NORMAL"
                    if (p201_m and p201_m.status == "CRITICAL_CAVITATION") or (res_p201.get("status") == "CRITICAL_CAVITATION"):
                        fault_mode = "PUMP_CAVITATION"
                    elif (v102_m and v102_m.status == "CRITICAL_JAMMED") or (res_v102.get("status") == "CRITICAL_JAMMED"):
                        fault_mode = "VALVE_JAMMING"

                    result = {
                        "p201": res_p201,
                        "v102": res_v102,
                        "fault_mode": fault_mode,
                        "_source": "ENTERPRISE_API"
                    }
                    self.cache.set("latest_telemetry", result, ttl_seconds=1.5)
                    return result
                else:
                    self.health_checker.record_failure("企业 API 返回空数据或 HTTP 状态非 200")
            except Exception as e:
                self.health_checker.record_failure(f"调用企业 API 异常: {str(e)}")

        # 4. 若为 API_ONLY 则不降级，直接返回错误信息
        if self.mode == "API_ONLY":
            return {
                "error": "企业 API 当前不可用，系统处于 API_ONLY 严格模式",
                "_source": "OFFLINE",
                "health": self.health_checker.get_status()
            }

        # 5. API_FIRST 模式下自动平滑降级至高保真仿真器
        sim_data = telemetry_sim.sample_tick()
        sim_data["_source"] = "SIMULATOR_FALLBACK"
        self.cache.set("latest_telemetry", sim_data, ttl_seconds=1.0)
        return sim_data

    def get_telemetry_history(self) -> Dict[str, Any]:
        """获取供 ECharts 渲染的历史时序窗口数据"""
        cached = self.cache.get("telemetry_history")
        if cached:
            return cached

        if self.mode != "SIMULATOR_ONLY" and self.client.is_configured() and self.health_checker.is_healthy():
            try:
                hist_p201 = self.client.get_history_data("P-201", count=60)
                hist_v102 = self.client.get_history_data("V-102", count=60)
                if hist_p201 and hist_v102:
                    result = {
                        "p201": hist_p201,
                        "v102": hist_v102,
                        "fault_mode": "NORMAL",
                        "_source": "ENTERPRISE_API"
                    }
                    self.cache.set("telemetry_history", result, ttl_seconds=2.0)
                    return result
            except Exception:
                pass

        # 降级或仿真器历史
        result = {
            "p201": telemetry_sim.history_p201,
            "v102": telemetry_sim.history_v102,
            "fault_mode": telemetry_sim.fault_mode,
            "_source": "SIMULATOR"
        }
        self.cache.set("telemetry_history", result, ttl_seconds=1.0)
        return result

    def get_equipment_telemetry(self, equipment_id: str) -> Dict[str, Any]:
        """提取指定设备的最新单点遥测快照（供 Agent 和物理工具求解使用）"""
        latest = self.get_latest_telemetry()
        if "P-201" in equipment_id or "201" in equipment_id:
            return latest.get("p201", {})
        elif "V-102" in equipment_id or "102" in equipment_id:
            return latest.get("v102", {})

        # 其他动态设备，直接查 API 或返回通用数据
        if self.client.is_configured():
            m = self.client.get_realtime_data(equipment_id)
            if m:
                return m.to_dict()

        return latest.get("p201", {})

    def switch_fault_mode(self, mode: str) -> bool:
        """在仿真器模式或降级模式下手动注入/恢复工业典型故障"""
        return telemetry_sim.set_fault_mode(mode)

    def get_router_status(self) -> Dict[str, Any]:
        """获取数据源路由健康状态、当前生效数据源与探活指标"""
        configured = self.client.is_configured()
        active_source = "SIMULATOR"
        if configured:
            if self.mode == "SIMULATOR_ONLY":
                active_source = "SIMULATOR (FORCED)"
            elif self.health_checker.is_healthy():
                active_source = "ENTERPRISE_API"
            else:
                active_source = "SIMULATOR_FALLBACK"

        return {
            "data_source_mode": self.mode,
            "is_configured": configured,
            "base_url": self.client.base_url,
            "auth_type": self.client.auth_type,
            "timeout_seconds": self.client.timeout,
            "active_source": active_source,
            "health": self.health_checker.get_status(),
            "cache": self.cache.get_stats()
        }

# 全局单例
data_source_router = DataSourceRouter()
