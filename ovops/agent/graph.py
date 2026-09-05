import datetime
from typing import Dict, Any
from langgraph.graph import StateGraph, START, END
from ovops.agent.state import OvOpsState
from ovops.tools.physics_tools import calculate_pump_cavitation, analyze_vibration_fft, calculate_valve_hysteresis
from ovops.tools.erp_tools import query_equipment_ledger, query_spare_parts_inventory, create_maintenance_work_order
from ovops.tools.rag_tools import search_maintenance_sop
from ovops.channels.dingtalk import build_dingtalk_action_card
from ovops.channels.feishu import build_feishu_interactive_card
from ovops.channels.base import channel_mgr
from config.settings import settings

def _now():
    return datetime.datetime.now().strftime("%H:%M:%S")

def node_anomaly_detection(state: OvOpsState) -> Dict[str, Any]:
    """节点 1：工况异动感知与告警捕获"""
    eq_id = state.get("equipment_id", "P-201")
    telemetry = state.get("telemetry_snapshot", {})
    thoughts = list(state.get("thought_logs", []))
    
    if "P-201" in eq_id:
        inlet_p = telemetry.get("inlet_pressure_kpa", 22.0)
        vib_rms = telemetry.get("vibration_rms_mms", 7.4)
        msg = f"【工况异动感知】捕获离心泵 {eq_id} 入口压力异常跌至 {inlet_p} kPa，振动 RMS 骤增至 {vib_rms} mm/s，初步推断水力吸入侧存在气蚀或严重闪蒸！"
    else:
        deadband = telemetry.get("deadband_pct", 5.8)
        msg = f"【工况异动感知】捕获控制阀 {eq_id} 回差达到 {deadband}%，远超 1.0% 国标允许上限，初步推断阀杆卡涩或执行机构推力受阻！"
        
    thoughts.append({"timestamp": _now(), "node": "感知节点 (AnomalyDetect)", "thought": msg})
    return {"thought_logs": thoughts}

def node_physics_diagnosis(state: OvOpsState) -> Dict[str, Any]:
    """节点 2：工业物理机理严格核算与 FFT 频域诊断"""
    eq_id = state.get("equipment_id", "P-201")
    telemetry = state.get("telemetry_snapshot", {})
    thoughts = list(state.get("thought_logs", []))
    tools_log = list(state.get("tool_executions", []))
    
    if "P-201" in eq_id:
        # 执行离心泵气蚀与 FFT 振动
        cavit_res = calculate_pump_cavitation(
            equipment_id=eq_id,
            inlet_pressure_kpa=telemetry.get("inlet_pressure_kpa", 22.0),
            fluid_temp_c=telemetry.get("bearing_temp_c", 55.0),
            flow_rate_m3h=telemetry.get("flow_rate_m3h", 88.0)
        )
        tools_log.append({"tool": "calculate_pump_cavitation", "result": cavit_res})
        
        fft_res = analyze_vibration_fft(equipment_id=eq_id)
        tools_log.append({"tool": "analyze_vibration_fft", "result": fft_res})
        
        diag = {
            "fault_type": "离心泵严重气蚀与水力高频冲击",
            "severity": "CRITICAL",
            "cavitation": cavit_res,
            "fft": fft_res
        }
        msg = f"【机理模型核算】水力模型算出 NPSHa={cavit_res['npsha_m']}m < 必需余量 NPSHr(3.2m)；FFT 频谱锁定 2000-4500Hz 能量占比达 {fft_res['cavitation_band_ratio_pct']}%，确认为严重叶轮气蚀！"
    else:
        # 执行控制阀回差拟合
        hyst_res = calculate_valve_hysteresis(equipment_id=eq_id)
        tools_log.append({"tool": "calculate_valve_hysteresis", "result": hyst_res})
        
        diag = {
            "fault_type": "控制阀阀杆干摩擦卡阻与填料硬化",
            "severity": "HIGH",
            "hysteresis": hyst_res
        }
        msg = f"【机理模型核算】拟合出阀门回差达 {hyst_res.get('mean_deadband_pct', 5.8)}%，判定为机械干摩擦与阀杆卡阻，响应严重滞后！"
        
    thoughts.append({"timestamp": _now(), "node": "机理诊断节点 (PhysicsDiagnose)", "thought": msg})
    return {
        "thought_logs": thoughts,
        "tool_executions": tools_log,
        "physics_diagnosis": diag
    }

def node_knowledge_retrieval(state: OvOpsState) -> Dict[str, Any]:
    """节点 3：永嘉泵阀原厂权威排障 SOP 语义匹配"""
    eq_id = state.get("equipment_id", "P-201")
    diag = state.get("physics_diagnosis", {})
    thoughts = list(state.get("thought_logs", []))
    tools_log = list(state.get("tool_executions", []))
    
    category = "离心泵" if "P-201" in eq_id else "控制阀"
    keyword = "气蚀" if category == "离心泵" else "卡阻"
    
    sop_res = search_maintenance_sop(query=keyword, equipment_category=category)
    tools_log.append({"tool": "search_maintenance_sop", "result": sop_res})
    
    sop_steps = sop_res[0]["steps"] if sop_res else []
    sop_title = sop_res[0]["title"] if sop_res else "通用排障规程"
    
    msg = f"【专家知识库 RAG】匹配永嘉龙头权威手册：《{sop_title}》，提取 4 级标准排查 SOP！"
    thoughts.append({"timestamp": _now(), "node": "规程检索节点 (KnowledgeRAG)", "thought": msg})
    
    return {
        "thought_logs": thoughts,
        "tool_executions": tools_log,
        "sop_steps": sop_steps
    }

def node_erp_penetration(state: OvOpsState) -> Dict[str, Any]:
    """节点 4：穿透 ERP 设备台账、BOM 清单与本地备品备件库"""
    eq_id = state.get("equipment_id", "P-201")
    thoughts = list(state.get("thought_logs", []))
    tools_log = list(state.get("tool_executions", []))
    
    # 穿透 ERP 查询设备资产
    ledger = query_equipment_ledger(equipment_id=eq_id)
    tools_log.append({"tool": "query_equipment_ledger", "result": ledger})
    
    # 穿透 ERP 供应链查询备件
    parts = query_spare_parts_inventory(equipment_id=eq_id)
    tools_log.append({"tool": "query_spare_parts_inventory", "result": parts})
    
    part_names = "、".join([p["name"] for p in parts[:2]])
    msg = f"【ERP 数据孤岛穿透】打通台账，确认原厂为【{ledger.get('manufacturer')}】；匹配永嘉本地供应链备件（{part_names}等），库存充足！"
    thoughts.append({"timestamp": _now(), "node": "ERP穿透节点 (ERPPenetration)", "thought": msg})
    
    return {
        "thought_logs": thoughts,
        "tool_executions": tools_log,
        "erp_ledger": ledger,
        "available_spare_parts": parts
    }

def node_task_decomposition(state: OvOpsState) -> Dict[str, Any]:
    """节点 5：运维任务自主拆解与 ERP 维保工单建单"""
    eq_id = state.get("equipment_id", "P-201")
    diag = state.get("physics_diagnosis", {})
    sop = state.get("sop_steps", [])
    parts = state.get("available_spare_parts", [])
    thoughts = list(state.get("thought_logs", []))
    tools_log = list(state.get("tool_executions", []))
    
    # 确定维修所需备件
    required_parts = []
    if "P-201" in eq_id:
        required_parts = [
            {"part_code": "SP-P201-IMP", "name": "超耐酸闭式高硅叶轮组件", "quantity": 1},
            {"part_code": "SP-P201-SEAL", "name": "集装式耐浓酸碳化硅动静环机械密封", "quantity": 1}
        ]
    else:
        required_parts = [
            {"part_code": "SP-V102-PACK", "name": "抗挤出低泄漏柔性石墨填料组合环", "quantity": 1}
        ]
        
    order_res = create_maintenance_work_order(
        equipment_id=eq_id,
        fault_type=diag.get("fault_type", "流体装备故障"),
        severity=diag.get("severity", "HIGH"),
        decomposed_steps=sop,
        required_parts=required_parts,
        assigned_tech="陈工(资深运维技师)"
    )
    tools_log.append({"tool": "create_maintenance_work_order", "result": order_res})
    
    msg = f"【任务自主拆解】成功生成工单 {order_res['order_no']}，拆解四阶段维修任务与备件调度申请，状态锁定为 PENDING_APPROVAL。"
    thoughts.append({"timestamp": _now(), "node": "任务拆解节点 (TaskDecompose)", "thought": msg})
    
    return {
        "thought_logs": thoughts,
        "tool_executions": tools_log,
        "work_order": order_res
    }

def node_channel_dispatch(state: OvOpsState) -> Dict[str, Any]:
    """节点 6：多端主动触达（向钉钉与飞书群下发交互式审批卡片）"""
    eq_id = state.get("equipment_id", "P-201")
    diag = state.get("physics_diagnosis", {})
    sop = state.get("sop_steps", [])
    order = state.get("work_order", {})
    thoughts = list(state.get("thought_logs", []))
    
    order_no = order.get("order_no", "WO-TEMP")
    fault_type = diag.get("fault_type", "设备异常")
    severity = diag.get("severity", "CRITICAL")
    
    sop_str = "\n".join([f"- {s}" for s in sop[:3]])
    parts_str = "1. 原厂高硅叶轮 (1套) | 2. 碳化硅机封 (1套)" if "P-201" in eq_id else "1. 柔性石墨填料环 (1组)"
    
    # 构造并分发钉钉与飞书卡片
    dt_card = build_dingtalk_action_card(eq_id, fault_type, severity, order_no, sop_str, parts_str)
    fs_card = build_feishu_interactive_card(eq_id, fault_type, severity, order_no, sop_str, parts_str)
    
    notifications = [
        {"channel": "DINGTALK", "title": "钉钉工作台卡片", "payload": dt_card},
        {"channel": "FEISHU", "title": "飞书交互卡片", "payload": fs_card}
    ]
    
    msg = f"【多端主动触达】已向移动端（钉钉/飞书）推送富文本协同卡片，挂起等待现场工程师一键审批确认。"
    thoughts.append({"timestamp": _now(), "node": "通知触达节点 (ChannelNotify)", "thought": msg})
    
    return {
        "thought_logs": thoughts,
        "channel_notifications": notifications,
        "approval_status": "PENDING"
    }

def build_ovops_workflow() -> StateGraph:
    """编排 LangGraph 状态图"""
    workflow = StateGraph(OvOpsState)
    
    workflow.add_node("detect", node_anomaly_detection)
    workflow.add_node("diagnose", node_physics_diagnosis)
    workflow.add_node("rag", node_knowledge_retrieval)
    workflow.add_node("penetrate_erp", node_erp_penetration)
    workflow.add_node("decompose", node_task_decomposition)
    workflow.add_node("notify", node_channel_dispatch)
    
    workflow.add_edge(START, "detect")
    workflow.add_edge("detect", "diagnose")
    workflow.add_edge("diagnose", "rag")
    workflow.add_edge("rag", "penetrate_erp")
    workflow.add_edge("penetrate_erp", "decompose")
    workflow.add_edge("decompose", "notify")
    workflow.add_edge("notify", END)
    
    return workflow.compile()

# 编译全局工作流实例
ovops_graph = build_ovops_workflow()
