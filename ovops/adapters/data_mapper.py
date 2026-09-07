import time
import datetime
from typing import Dict, Any, Optional
from ovops.adapters.base_adapter import DeviceMeasurement

FIELD_ALIASES = {
    "inlet_pressure_kpa": ["inlet_pressure_kpa", "inlet_pressure", "inlet_p", "pin", "p_in", "p_inlet", "suction_pressure"],
    "outlet_pressure_kpa": ["outlet_pressure_kpa", "outlet_pressure", "outlet_p", "pout", "p_out", "p_outlet", "discharge_pressure"],
    "vibration_rms_mms": ["vibration_rms_mms", "vibration_rms", "vib_rms", "vibration_value", "vib", "vibration"],
    "vibration_hf_g": ["vibration_hf_g", "vibration_hf_accel", "vib_hf_g", "hf_accel", "hf_vibration"],
    "flow_rate_m3h": ["flow_rate_m3h", "flow_rate", "flow", "q"],
    "bearing_temp_c": ["bearing_temp_c", "bearing_temperature", "bearing_t", "temperature", "temp", "temp_bearing"],
    "sp_percent": ["sp_percent", "sp", "setpoint", "sp_pct"],
    "pv_percent": ["pv_percent", "pv", "actual_position", "valve_pos", "pv_pct"],
    "deadband_pct": ["deadband_pct", "deadband", "hysteresis", "deadband_percent"],
    "ultrasonic_leak_db": ["ultrasonic_leak_db", "ultrasonic_leak", "leak_db", "leakage_db"],
    "air_supply_bar": ["air_supply_bar", "air_supply", "supply_pressure", "air_bar"]
}

class DataMapper:
    """企业设备遥测数据字段映射与异构归一化解析器"""

    @staticmethod
    def parse_timestamp(ts_raw: Any) -> float:
        """解析多样化时间戳（Unix时间戳、毫秒戳、ISO-8601字符串）"""
        if ts_raw is None:
            return time.time()
        if isinstance(ts_raw, (int, float)):
            # 处理毫秒时间戳
            if ts_raw > 1e11:
                return float(ts_raw) / 1000.0
            return float(ts_raw)
        if isinstance(ts_raw, str):
            try:
                # 尝试解析 ISO 格式
                dt = datetime.datetime.fromisoformat(ts_raw.replace("Z", "+00:00"))
                return dt.timestamp()
            except Exception:
                try:
                    return float(ts_raw)
                except Exception:
                    pass
        return time.time()

    @classmethod
    def map_to_measurement(cls, raw: Dict[str, Any], default_equipment_id: str = "UNKNOWN") -> DeviceMeasurement:
        """
        将企业接口返回的任意结构化字典转换为系统标准的 DeviceMeasurement 模型。
        支持 ROADMAP 规约中的 measurements 嵌套字典，也支持扁平化 JSON 格式。
        """
        # 提取设备编号
        eq_id = (
            raw.get("equipment_id")
            or raw.get("device_id")
            or raw.get("deviceId")
            or raw.get("id")
            or default_equipment_id
        )

        # 提取时间戳
        ts_raw = raw.get("timestamp") or raw.get("time") or raw.get("ts")
        timestamp = cls.parse_timestamp(ts_raw)

        # 寻找测点载荷字典（可能是 raw 本身，也可能是 raw["measurements"] 或 raw["data"]）
        payload = raw
        if "measurements" in raw and isinstance(raw["measurements"], dict):
            payload = {**raw, **raw["measurements"]}
        elif "data" in raw and isinstance(raw["data"], dict):
            payload = {**raw, **raw["data"]}

        # 检查单位字典
        units = raw.get("unit_mapping", {})

        # 构建全小写映射以支持大小写混写（如 Pin, Pout, vib 等）
        lower_payload = {str(k).lower(): (k, v) for k, v in payload.items()}
        lower_units = {str(k).lower(): v for k, v in units.items()} if isinstance(units, dict) else {}

        result: Dict[str, Any] = {
            "equipment_id": str(eq_id),
            "timestamp": round(timestamp, 2),
            "raw_data": raw
        }

        # 遍历标准字段映射
        for std_field, aliases in FIELD_ALIASES.items():
            val = None
            found_alias = None
            for alias in aliases:
                alias_lower = alias.lower()
                if alias_lower in lower_payload:
                    orig_k, val = lower_payload[alias_lower]
                    found_alias = str(orig_k)
                    break

            if val is not None:
                try:
                    num_val = float(val)
                    # 单位转换处理（若标记为 bar 且字段为压力，转为 kPa）
                    unit_str = str(lower_units.get(found_alias.lower(), "")).lower() if found_alias else ""
                    if "bar" in unit_str and "kpa" in std_field:
                        num_val = num_val * 100.0
                    elif "mpa" in unit_str and "kpa" in std_field:
                        num_val = num_val * 1000.0
                    result[std_field] = round(num_val, 2)
                except (ValueError, TypeError):
                    pass

        # 研判状态标记
        status = raw.get("status")
        if not status:
            # 根据关键测点推断初始状态
            if (result.get("inlet_pressure_kpa") is not None and result["inlet_pressure_kpa"] < 35.0) or \
               (result.get("vibration_rms_mms") is not None and result["vibration_rms_mms"] > 4.5):
                status = "CRITICAL_CAVITATION"
            elif (result.get("deadband_pct") is not None and result["deadband_pct"] > 2.0):
                status = "CRITICAL_JAMMED"
            else:
                status = "HEALTHY"
        result["status"] = str(status)

        return DeviceMeasurement(**result)
