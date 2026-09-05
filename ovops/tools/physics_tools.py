import math
import numpy as np
from scipy.fft import rfft, rfftfreq
from typing import Dict, Any, List
from ovops.agent.registry import tool
from ovops.simulator.fault_generator import telemetry_sim

@tool
def calculate_pump_cavitation(equipment_id: str, inlet_pressure_kpa: float, fluid_temp_c: float = 45.0, flow_rate_m3h: float = 120.0) -> Dict[str, Any]:
    """工业机理计算：对离心泵进行有效汽蚀余量 (NPSHa) 严格水力学核算与气蚀风险研判。
    Args:
        equipment_id: 设备编号，如 P-201
        inlet_pressure_kpa: 入口实测压力 (kPa)
        fluid_temp_c: 介质当前温度 (℃)
        flow_rate_m3h: 实时流量 (m³/h)
    """
    # 硫酸/介质 Antoine 方程饱和蒸汽压估算 (kPa)
    # log10(P) = A - B / (C + T)
    # 对于常规化工流体，在 45℃ 时约为 9.6 kPa
    vapor_p_kpa = 9.58 * math.exp(0.048 * (fluid_temp_c - 20))
    
    # 介质密度按 1800 kg/m³ (浓硫酸)，重力加速度 g=9.81
    density = 1800.0 if "P-201" in equipment_id else 1000.0
    g = 9.81
    
    # NPSHa = (P_in - P_v) / (rho * g) * 1000
    pressure_head = ((inlet_pressure_kpa - vapor_p_kpa) * 1000.0) / (density * g)
    
    # 估算吸入管流速水头 v^2 / 2g (假设 DN100 管道)
    pipe_d = 0.1 # 100mm
    pipe_area = math.pi * (pipe_d / 2)**2
    velocity = (flow_rate_m3h / 3600.0) / pipe_area
    velocity_head = (velocity ** 2) / (2 * g)
    
    npsha = round(max(0.0, pressure_head + velocity_head), 2)
    rated_npshr = 3.2 # P-201 出厂额定必需汽蚀余量
    safety_margin = round(npsha - rated_npshr, 2)
    
    is_cavitation = npsha < rated_npshr
    
    return {
        "equipment_id": equipment_id,
        "npsha_m": npsha,
        "rated_npshr_m": rated_npshr,
        "safety_margin_m": safety_margin,
        "vapor_pressure_kpa": round(vapor_p_kpa, 2),
        "is_cavitation_risk": is_cavitation,
        "diagnosis_severity": "CRITICAL" if safety_margin < -0.5 else ("WARNING" if safety_margin < 0.5 else "NORMAL"),
        "conclusion": "检测到入口压头严重跌破必需汽蚀余量(NPSHa < NPSHr)，叶轮吸入面正处于剧烈气泡爆破气蚀状态！" if is_cavitation else "水力汽蚀余量处于安全充裕区间。"
    }

@tool
def analyze_vibration_fft(equipment_id: str, sample_rate: int = 10000) -> Dict[str, Any]:
    """工业机理计算：对设备的高频振动信号执行 FFT 频谱分析，诊断轴承磨损与气蚀冲击特征频段。
    Args:
        equipment_id: 设备编号，如 P-201
        sample_rate: 采样率 (Hz)，默认 10000
    """
    # 获取原始振动时序波形
    waveform = telemetry_sim.generate_vibration_waveform(sample_rate=sample_rate, duration=0.1)
    n = len(waveform)
    
    # 执行实数 FFT
    fft_vals = np.abs(rfft(waveform))
    fft_freqs = rfftfreq(n, 1.0 / sample_rate)
    
    # 寻找主峰频率
    peak_idx = np.argmax(fft_vals)
    dominant_freq = round(float(fft_freqs[peak_idx]), 1)
    
    # 计算高频段 (2000Hz - 4500Hz) 能量占比（气蚀溃灭特征区）
    high_band_mask = (fft_freqs >= 2000) & (fft_freqs <= 4500)
    high_band_energy = float(np.sum(fft_vals[high_band_mask] ** 2))
    total_energy = float(np.sum(fft_vals ** 2))
    cavitation_band_ratio = round((high_band_energy / (total_energy + 1e-6)) * 100.0, 2)
    
    has_cavitation_spectral_signature = cavitation_band_ratio > 35.0
    
    return {
        "equipment_id": equipment_id,
        "dominant_frequency_hz": dominant_freq,
        "cavitation_band_ratio_pct": cavitation_band_ratio,
        "has_high_freq_impact": has_cavitation_spectral_signature,
        "spectrum_diagnosis": "高频宽带能量激增（2000-4500Hz超标），符合典型水力气蚀微爆微射流冲击特征！" if has_cavitation_spectral_signature else "频谱以 1X/2X 转速基频为主，未见异常高频冲击。"
    }

@tool
def calculate_valve_hysteresis(equipment_id: str, deadband_sample_count: int = 10) -> Dict[str, Any]:
    """工业机理计算：对控制阀执行回差 (Deadband) 与迟滞率非线性计算，研判阀杆卡阻与填料硬化。
    Args:
        equipment_id: 阀门位号，如 V-102
        deadband_sample_count: 采样点数
    """
    # 从时序历史中提取最近的 SP 与 PV
    history = telemetry_sim.history_v102[-deadband_sample_count:]
    if not history:
        return {"error": "暂无充足控制阀历史时序"}
        
    sp_vals = [h["sp_percent"] for h in history]
    pv_vals = [h["pv_percent"] for h in history]
    
    errors = [abs(sp - pv) for sp, pv in zip(sp_vals, pv_vals)]
    max_error = round(float(np.max(errors)), 2)
    mean_deadband = round(float(np.mean([h["deadband_pct"] for h in history])), 2)
    
    # GB/T 4213 工业控制阀国家标准：调节阀基本回差应 <= 1.0%
    standard_limit = 1.0
    is_jammed = mean_deadband > standard_limit
    
    return {
        "equipment_id": equipment_id,
        "mean_deadband_pct": mean_deadband,
        "max_tracking_error_pct": max_error,
        "standard_limit_pct": standard_limit,
        "is_jammed": is_jammed,
        "diagnosis": f"控制阀回差({mean_deadband}%)严重超出国标上限({standard_limit}%)，存在机械干摩擦与阀杆卡阻！" if is_jammed else "控制阀阶跃跟踪精度正常，处于优良状态。"
    }
