import pytest
from ovops.tools.physics_tools import calculate_pump_cavitation, analyze_vibration_fft, calculate_valve_hysteresis

def test_pump_cavitation_critical():
    # 模拟低入口压力 20 kPa
    res = calculate_pump_cavitation(equipment_id="P-201", inlet_pressure_kpa=20.0, fluid_temp_c=50.0)
    assert res["is_cavitation_risk"] is True
    assert res["safety_margin_m"] < 0
    assert "气蚀" in res["conclusion"]

def test_pump_cavitation_healthy():
    # 模拟正常入口压力 130 kPa
    res = calculate_pump_cavitation(equipment_id="P-201", inlet_pressure_kpa=130.0, fluid_temp_c=40.0)
    assert res["is_cavitation_risk"] is False
    assert res["safety_margin_m"] > 0

def test_vibration_fft():
    res = analyze_vibration_fft(equipment_id="P-201")
    assert "dominant_frequency_hz" in res
    assert "cavitation_band_ratio_pct" in res

def test_valve_hysteresis():
    res = calculate_valve_hysteresis(equipment_id="V-102")
    assert "mean_deadband_pct" in res
