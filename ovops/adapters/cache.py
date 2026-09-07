import time
import threading
from typing import Dict, Any, Optional, Tuple

class TelemetryCache:
    """
    高频工业遥测数据 TTL 滑动窗口内存缓存
    防止大屏 WebSocket (1Hz)、看板轮询及多 Agent 诊断并发调用压垮企业接口
    """

    def __init__(self, default_ttl: float = 1.5):
        self.default_ttl = float(default_ttl)
        self._lock = threading.Lock()
        self._store: Dict[str, Tuple[Any, float]] = {}
        self._hits = 0
        self._misses = 0

    def get(self, key: str) -> Optional[Any]:
        """获取缓存值，若过期或不存在返回 None"""
        now = time.time()
        with self._lock:
            if key in self._store:
                val, expire_at = self._store[key]
                if now < expire_at:
                    self._hits += 1
                    return val
                else:
                    del self._store[key]
            self._misses += 1
            return None

    def set(self, key: str, value: Any, ttl_seconds: Optional[float] = None):
        """设置缓存值及过期时间"""
        ttl = self.default_ttl if ttl_seconds is None else float(ttl_seconds)
        expire_at = time.time() + ttl
        with self._lock:
            self._store[key] = (value, expire_at)

    def clear(self):
        """清空缓存"""
        with self._lock:
            self._store.clear()
            self._hits = 0
            self._misses = 0

    def get_stats(self) -> Dict[str, Any]:
        """获取缓存监控统计"""
        with self._lock:
            total = self._hits + self._misses
            hit_ratio = round((self._hits / total) * 100.0, 1) if total > 0 else 0.0
            return {
                "hits": self._hits,
                "misses": self._misses,
                "total_requests": total,
                "hit_ratio_pct": hit_ratio,
                "cached_items_count": len(self._store)
            }
