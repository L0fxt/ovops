import time
import math
import random
import numpy as np
from typing import Dict, Any, List

class IndustrialTelemetrySimulator:
    """工业泵阀时序仿真器：支持正常工况与典型故障注入"""
    def __init__(self):
        self.fault_mode = "NORMAL" # NORMAL | PUMP_CAVITATION | VALVE_JAMMING
        self.step = 0
        self.history_p201: List[Dict[str, Any]] = []
        self.history_v102: List[Dict[str, Any]] = []
        self._init_history()

    def set_fault_mode(self, mode: str):
        if mode in ["NORMAL", "PUMP_CAVITATION", "VALVE_JAMMING"]:
            self.fault_mode = mode
            return True
        return False

    def _init_history(self, count=40):
        # 预热生成 40 个历史数据点，方便前端图表初始化
        now = time.time()
        for i in range(count):
            t = now - (count - i) * 2
            self.history_p201.append(self._generate_p201(t, is_init=True))
            self.history_v102.append(self._generate_v102(t, is_init=True))

    def _generate_p201(self, timestamp: float, is_init: bool = False) -> Dict[str, Any]:
        """离心泵 P-201 测点：进出口压力、高频振动、流量、轴承温度"""
        is_fault = (self.fault_mode == "PUMP_CAVITATION") and not is_init
        noise = lambda scale: random.gauss(0, scale)

        if not is_fault:
            inlet_p = 125.0 + 3.0 * math.sin(timestamp / 8.0) + noise(1.0)
            outlet_p = 645.0 + 5.0 * math.cos(timestamp / 8.0) + noise(2.0)
            vib_rms = 1.6 + noise(0.1)
            vib_hf_g = 0.28 + noise(0.04) # 高频加速度
            flow = 120.0 + noise(1.5)
            bearing_t = 53.0 + noise(0.3)
            status = "HEALTHY"
        else:
            # 气蚀发作：入口压力跌破饱和蒸汽压临界、高频振动爆表、流量骤降波动
            inlet_p = 22.0 + 4.0 * math.sin(timestamp / 2.0) + noise(2.5) # 暴跌
            outlet_p = 530.0 + 15.0 * math.sin(timestamp / 3.0) + noise(8.0)
            vib_rms = 7.4 + noise(0.4) # 振动超标 (ISO 标准 > 4.5 为高危)
            vib_hf_g = 3.6 + noise(0.5) # 气泡溃灭高频冲击
            flow = 88.0 + 10.0 * math.sin(timestamp / 4.0) + noise(4.0)
            bearing_t = 76.5 + noise(0.8)
            status = "CRITICAL_CAVITATION"

        return {
            "timestamp": round(timestamp, 2),
            "equipment_id": "P-201",
            "inlet_pressure_kpa": round(inlet_p, 2),
            "outlet_pressure_kpa": round(outlet_p, 2),
            "vibration_rms_mms": round(vib_rms, 2),
            "vibration_hf_g": round(vib_hf_g, 2),
            "flow_rate_m3h": round(flow, 2),
            "bearing_temp_c": round(bearing_t, 2),
            "status": status
        }

    def _generate_v102(self, timestamp: float, is_init: bool = False) -> Dict[str, Any]:
        """控制阀 V-102 测点：设定开度(SP)、实际开度(PV)、阀后压力、内漏超声"""
        is_fault = (self.fault_mode == "VALVE_JAMMING") and not is_init
        noise = lambda scale: random.gauss(0, scale)

        # 构造周期性变化的开度设定值 SP (20% ~ 80%)
        cycle = (timestamp % 40) / 40.0
        if cycle < 0.5:
            sp = 20.0 + (cycle / 0.5) * 60.0
        else:
            sp = 80.0 - ((cycle - 0.5) / 0.5) * 60.0

        if not is_fault:
            # 正常跟踪：微小滞后与回差
            pv = sp + noise(0.3)
            deadband = 0.5 + noise(0.05)
            leak_db = 18.0 + noise(1.2)
            status = "HEALTHY"
        else:
            # 阀杆卡阻与填料硬化：阶跃跳变，回差与迟滞严重超标
            pv = math.floor(sp / 15.0) * 15.0 + noise(1.5) # 阶梯状卡顿
            deadband = 5.8 + noise(0.4)
            leak_db = 42.0 + noise(3.0)
            status = "CRITICAL_JAMMED"

        return {
            "timestamp": round(timestamp, 2),
            "equipment_id": "V-102",
            "sp_percent": round(sp, 2),
            "pv_percent": round(pv, 2),
            "deadband_pct": round(deadband, 2),
            "ultrasonic_leak_db": round(leak_db, 2),
            "air_supply_bar": round(5.5 + noise(0.08), 2),
            "status": status
        }

    def sample_tick(self) -> Dict[str, Any]:
        """秒级采样推进一次"""
        now = time.time()
        p201_sample = self._generate_p201(now)
        v102_sample = self._generate_v102(now)

        self.history_p201.append(p201_sample)
        self.history_v102.append(v102_sample)

        # 保持 60 个历史窗口
        if len(self.history_p201) > 60:
            self.history_p201.pop(0)
        if len(self.history_v102) > 60:
            self.history_v102.pop(0)

        return {
            "p201": p201_sample,
            "v102": v102_sample,
            "fault_mode": self.fault_mode
        }

    def generate_vibration_waveform(self, sample_rate: int = 10000, duration: float = 0.1) -> np.ndarray:
        """为 FFT 分析提供高采样率原始振动时域波形"""
        t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
        # 基频 (2900 RPM ~ 48.3 Hz)
        f0 = 48.3
        waveform = 0.5 * np.sin(2 * np.pi * f0 * t)

        if self.fault_mode == "PUMP_CAVITATION":
            # 气蚀叠加 2000Hz ~ 4500Hz 剧烈宽带高频噪声与冲击
            high_freq_noise = np.random.normal(0, 1.8, len(t))
            impulse = np.sin(2 * np.pi * 3200 * t) * 2.5
            waveform = waveform + high_freq_noise + impulse
        else:
            # 正常微弱白噪声
            waveform += np.random.normal(0, 0.1, len(t))

        return waveform

# 全局单例
telemetry_sim = IndustrialTelemetrySimulator()
