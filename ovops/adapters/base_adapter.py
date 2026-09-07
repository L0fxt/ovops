from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class DeviceMeasurement(BaseModel):
    """标准内部工业装备遥测数据结构"""
    equipment_id: str
    timestamp: float
    # 泵相关核心测点
    inlet_pressure_kpa: Optional[float] = None
    outlet_pressure_kpa: Optional[float] = None
    vibration_rms_mms: Optional[float] = None
    vibration_hf_g: Optional[float] = None
    flow_rate_m3h: Optional[float] = None
    bearing_temp_c: Optional[float] = None
    # 阀门相关核心测点
    sp_percent: Optional[float] = None
    pv_percent: Optional[float] = None
    deadband_pct: Optional[float] = None
    ultrasonic_leak_db: Optional[float] = None
    air_supply_bar: Optional[float] = None
    # 诊断状态标记
    status: str = "HEALTHY"
    # 原始保留字段
    raw_data: Dict[str, Any] = Field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        d = self.model_dump(exclude={"raw_data"})
        # 移除 None 值以兼容旧接口
        return {k: v for k, v in d.items() if v is not None}

class BaseDeviceAdapter(ABC):
    """工业设备数据查询适配器抽象基类"""

    @abstractmethod
    def get_realtime_data(self, equipment_id: str) -> Optional[DeviceMeasurement]:
        """获取指定设备的最新秒级实时测点数据"""
        pass

    @abstractmethod
    def get_history_data(self, equipment_id: str, count: int = 60) -> List[Dict[str, Any]]:
        """获取指定设备的历史时序数据列表"""
        pass

    @abstractmethod
    def get_device_list(self) -> List[Dict[str, Any]]:
        """获取企业系统中的在线设备台账列表"""
        pass

    @abstractmethod
    def ping(self) -> Dict[str, Any]:
        """测试与企业数据接口的连通性与健康状态"""
        pass
