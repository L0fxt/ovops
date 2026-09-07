import time
import json
import sqlite3
import datetime
import logging
from typing import Dict, Any, List, Optional
from config.settings import settings
from ovops.adapters.router import data_source_router

logger = logging.getLogger("ovops.adapters.sync_service")

class AssetSyncService:
    """
    企业设备资产主数据与备品备件动态同步服务 (Phase 8)
    定期或手动从企业 API /devices 拉取设备清单，增量 UPSERT 至本地 ERP 数据库，
    打通设备铭牌、水动力学/电气额定参数与本地台账。
    """

    def __init__(self):
        self.last_sync_time: Optional[str] = None
        self.last_sync_status: str = "IDLE"
        self.last_sync_count: int = 0
        self.last_duration_ms: int = 0
        self.last_error: Optional[str] = None

    def _get_db(self):
        conn = sqlite3.connect(settings.ERP_DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    def sync_equipments(self, force: bool = False) -> Dict[str, Any]:
        """
        从企业 API 同步设备台账主数据与备件清单
        采用幂等 UPSERT (INSERT OR REPLACE) 机制，保留历史维保记录
        """
        start = time.time()
        client = data_source_router.client

        if not client.is_configured():
            return {
                "status": "skipped",
                "message": "企业 API 根地址未配置，保持现有本地设备台账数据不变",
                "synced_count": 0,
                "duration_ms": 0
            }

        try:
            devices = client.get_device_list()
            if not devices:
                return {
                    "status": "warning",
                    "message": "企业端点响应成功，但返回设备清单为空列表",
                    "synced_count": 0,
                    "duration_ms": int((time.time() - start) * 1000)
                }

            conn = self._get_db()
            cursor = conn.cursor()
            synced_count = 0
            parts_synced_count = 0
            now_iso = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            for dev in devices:
                eq_id = dev.get("id") or dev.get("device_id") or dev.get("deviceId")
                if not eq_id:
                    continue

                name = dev.get("name") or dev.get("device_name") or f"工业装备 ({eq_id})"
                category = dev.get("category") or ("离心泵" if ("泵" in name or "pump" in str(dev).lower()) else "控制阀")
                model = dev.get("model") or dev.get("model_no") or "YJ-STD-2026"
                manufacturer = dev.get("manufacturer") or dev.get("vendor") or "永嘉特种流体装备制造厂"
                installation_area = dev.get("installation_area") or dev.get("area") or "精细化工主力生产工段"
                status = dev.get("status") or "RUNNING"
                health_score = float(dev.get("health_score", 95.0))

                # 额定参数标准化为 JSON
                rated = dev.get("rated_params", {})
                if isinstance(rated, str):
                    try:
                        rated_dict = json.loads(rated)
                    except Exception:
                        rated_dict = {}
                else:
                    rated_dict = rated if isinstance(rated, dict) else {}

                # 补全关键物理计算缺省参数
                if category == "离心泵":
                    rated_dict.setdefault("flow_rate_m3h", float(dev.get("flow", 120.0)))
                    rated_dict.setdefault("head_m", float(dev.get("head", 52.0)))
                    rated_dict.setdefault("rpm", int(dev.get("rpm", 2900)))
                    rated_dict.setdefault("npsh_r", float(dev.get("npsh_r", 3.2)))
                    rated_dict.setdefault("pipe_dn_mm", int(dev.get("pipe_dn_mm", 100)))
                    rated_dict.setdefault("medium_density_kgm3", float(dev.get("medium_density_kgm3", 1800.0 if "P-201" in eq_id else 1000.0)))
                else:
                    rated_dict.setdefault("nominal_dn", int(dev.get("nominal_dn", 100)))
                    rated_dict.setdefault("pn_rating", str(dev.get("pn_rating", "PN160")))
                    rated_dict.setdefault("stroke_mm", float(dev.get("stroke_mm", 50.0)))
                    rated_dict.setdefault("deadband_tolerance_pct", float(dev.get("deadband_tolerance_pct", 1.0)))

                rated_json = json.dumps(rated_dict, ensure_ascii=False)
                commission_date = dev.get("commission_date") or dev.get("installed_at") or "2024-01-01"

                # UPSERT 入库
                cursor.execute("""
                INSERT OR REPLACE INTO equipments (
                    id, name, category, model, manufacturer, installation_area, status, health_score, rated_params, commission_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (eq_id, name, category, model, manufacturer, installation_area, status, health_score, rated_json, commission_date))
                synced_count += 1

                # 同步该设备绑定的备品备件（若有）
                raw_parts = dev.get("spare_parts") or dev.get("parts") or []
                if isinstance(raw_parts, list):
                    for p in raw_parts:
                        p_code = p.get("part_code") or p.get("code") or f"SP-{eq_id}-{p.get('name', 'PART')[:4]}"
                        p_name = p.get("name") or "原厂配套检修备件"
                        p_spec = p.get("spec") or "STD-SPEC"
                        p_qty = int(p.get("stock_qty", 10))
                        p_min = int(p.get("min_safety_stock", 3))
                        p_price = float(p.get("unit_price", 1500.0))
                        p_lead = int(p.get("lead_time_days", 1))
                        p_supp = p.get("supplier") or "永嘉本地流体装备供应库"

                        cursor.execute("""
                        INSERT OR REPLACE INTO spare_parts (
                            part_code, equipment_id, name, spec, stock_qty, min_safety_stock, unit_price, lead_time_days, supplier
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (p_code, eq_id, p_name, p_spec, p_qty, p_min, p_price, p_lead, p_supp))
                        parts_synced_count += 1

            conn.commit()
            conn.close()

            dur_ms = max(1, int((time.time() - start) * 1000))
            self.last_sync_time = now_iso
            self.last_sync_status = "SUCCESS"
            self.last_sync_count = synced_count
            self.last_duration_ms = dur_ms
            self.last_error = None

            return {
                "status": "success",
                "message": f"成功从企业 API 同步 {synced_count} 台工业设备台账及 {parts_synced_count} 条备件记录！",
                "synced_count": synced_count,
                "parts_synced_count": parts_synced_count,
                "duration_ms": dur_ms,
                "sync_time": now_iso
            }

        except Exception as e:
            dur_ms = max(1, int((time.time() - start) * 1000))
            err_msg = str(e)
            self.last_sync_status = "ERROR"
            self.last_error = err_msg
            self.last_duration_ms = dur_ms
            logger.error(f"[AssetSyncService] 同步企业设备台账异常: {err_msg}")
            return {
                "status": "error",
                "message": f"同步企业设备台账失败: {err_msg}",
                "synced_count": 0,
                "duration_ms": dur_ms
            }

    def get_sync_status(self) -> Dict[str, Any]:
        """获取当前资产台账同步状态与历史审计快照"""
        return {
            "last_sync_time": self.last_sync_time,
            "last_sync_status": self.last_sync_status,
            "last_sync_count": self.last_sync_count,
            "last_duration_ms": self.last_duration_ms,
            "last_error": self.last_error,
            "is_configured": data_source_router.client.is_configured()
        }

# 全局单例
asset_sync_service = AssetSyncService()
