import time
import threading
from typing import Dict, Any, Optional

class HealthChecker:
    """
    企业 API 接口可用性探活与自动熔断降级监控器
    当企业端点连续异常或超时达到阈值时，自动触发熔断降级；
    并在静默周期后自动探活，实现企业 API 恢复时的平滑自动回切。
    """

    def __init__(self, failure_threshold: int = 3, probe_interval_seconds: float = 15.0):
        self.failure_threshold = failure_threshold
        self.probe_interval_seconds = probe_interval_seconds

        self._lock = threading.Lock()
        self.state = "HEALTHY" # "HEALTHY" | "DEGRADED" | "OFFLINE"
        self.consecutive_failures = 0
        self.last_success_time: Optional[float] = None
        self.last_failure_time: Optional[float] = None
        self.last_error: Optional[str] = None
        self.total_success_count = 0
        self.total_failure_count = 0
        self.avg_latency_ms = 0.0

    def record_success(self, latency_ms: float = 0.0):
        """记录一次成功请求"""
        now = time.time()
        with self._lock:
            self.consecutive_failures = 0
            self.state = "HEALTHY"
            self.last_success_time = now
            self.total_success_count += 1
            if latency_ms > 0:
                if self.avg_latency_ms == 0.0:
                    self.avg_latency_ms = round(latency_ms, 1)
                else:
                    self.avg_latency_ms = round(self.avg_latency_ms * 0.8 + latency_ms * 0.2, 1)

    def record_failure(self, error: str):
        """记录一次请求失败，达阈值触发降级"""
        now = time.time()
        with self._lock:
            self.consecutive_failures += 1
            self.total_failure_count += 1
            self.last_failure_time = now
            self.last_error = error
            if self.consecutive_failures >= self.failure_threshold:
                self.state = "DEGRADED"

    def is_healthy(self) -> bool:
        """当前是否处于健康可用状态"""
        with self._lock:
            return self.state == "HEALTHY"

    def should_probe(self) -> bool:
        """在降级状态下，是否已到达探活间隔允许发起一次探测请求"""
        now = time.time()
        with self._lock:
            if self.state != "DEGRADED":
                return False
            if not self.last_failure_time:
                return True
            return (now - self.last_failure_time) >= self.probe_interval_seconds

    def get_status(self) -> Dict[str, Any]:
        """获取当前健康状态与统计诊断"""
        with self._lock:
            total = self.total_success_count + self.total_failure_count
            availability_pct = round((self.total_success_count / total) * 100.0, 1) if total > 0 else 100.0
            return {
                "state": self.state,
                "is_healthy": self.state == "HEALTHY",
                "consecutive_failures": self.consecutive_failures,
                "avg_latency_ms": self.avg_latency_ms,
                "total_success_count": self.total_success_count,
                "total_failure_count": self.total_failure_count,
                "availability_pct": availability_pct,
                "last_success_time": self.last_success_time,
                "last_failure_time": self.last_failure_time,
                "last_error": self.last_error
            }
