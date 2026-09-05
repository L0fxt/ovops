import React from 'react';
import { Activity, Wind } from 'lucide-react';

interface DigitalTwinFlowProps {
  p201: any;
  v102: any;
  faultMode: string;
}

export const DigitalTwinFlow: React.FC<DigitalTwinFlowProps> = ({ p201, v102, faultMode }) => {
  const isPumpFault = faultMode === "PUMP_CAVITATION";
  const isValveFault = faultMode === "VALVE_JAMMING";

  return (
    <div className="w-full rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 p-4 lg:p-5 relative overflow-hidden shadow-sm transition-colors">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap flex-shrink-0">
            永嘉核心泵阀工艺拓扑与数字孪生实时流
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 whitespace-nowrap flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            工艺介质: 98%工业浓硫酸
          </span>
          <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 whitespace-nowrap flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            工段: 反应进料回路
          </span>
        </div>
      </div>

      {/* 流程管道与装备拓扑 SVG + 嵌入卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center relative">
        
        {/* 节点 1: 吸入储槽 */}
        <div className="md:col-span-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-white/10 p-3.5 flex flex-col justify-between h-full min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-300 whitespace-nowrap">原料吸入储罐 T-101</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 whitespace-nowrap flex-shrink-0">
              液位: 68.4%
            </span>
          </div>
          <div className="my-2 space-y-1 text-xs">
            <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
              <span className="whitespace-nowrap flex-shrink-0">静压水头:</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-200">12.4 kPa</span>
            </div>
            <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
              <span className="whitespace-nowrap flex-shrink-0">介质温度:</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-200">45.2 ℃</span>
            </div>
          </div>
          <div className="text-[11px] text-zinc-500 truncate" title="永嘉瓯北精细化工园区管网">
            源头: 永嘉精细化工储运区
          </div>
        </div>

        {/* 管道连接线 1 */}
        <div className="hidden md:flex md:col-span-1 items-center justify-center">
          <svg className="w-full h-8" viewBox="0 0 100 20">
            <line x1="0" y1="10" x2="100" y2="10" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="3" />
            <line
              x1="0" y1="10" x2="100" y2="10"
              stroke="#3B82F6"
              strokeWidth="3"
              strokeDasharray="6 6"
              className="animate-pulse"
            />
          </svg>
        </div>

        {/* 节点 2: 特种离心泵 P-201 */}
        <div className={`md:col-span-3 rounded-lg p-3.5 transition-all duration-300 flex flex-col justify-between h-full min-h-[140px] ${
          isPumpFault
            ? "bg-red-50 dark:bg-red-950/20 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
            : "bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-white/10"
        }`}>
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 whitespace-nowrap flex-shrink-0">P-201 特种耐酸离心泵</span>
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${
              isPumpFault ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 animate-pulse border border-red-300 dark:border-red-500/40" : "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            }`}>
              {isPumpFault ? "气蚀高危报警" : "正常运转"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 my-2 text-xs">
            <div className="p-1.5 rounded bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/5">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block whitespace-nowrap">入口压力 (Pin)</span>
              <span className={`font-mono font-semibold text-sm ${isPumpFault ? 'text-red-600 dark:text-red-400 font-bold' : 'text-zinc-800 dark:text-zinc-200'}`}>
                {p201?.inlet_pressure_kpa ?? 125.0} <span className="text-[10px] font-normal text-zinc-500">kPa</span>
              </span>
            </div>
            <div className="p-1.5 rounded bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/5">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block whitespace-nowrap">振动 RMS</span>
              <span className={`font-mono font-semibold text-sm ${isPumpFault ? 'text-red-600 dark:text-red-400 font-bold' : 'text-zinc-800 dark:text-zinc-200'}`}>
                {p201?.vibration_rms_mms ?? 1.6} <span className="text-[10px] font-normal text-zinc-500">mm/s</span>
              </span>
            </div>
            <div className="p-1.5 rounded bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/5">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block whitespace-nowrap">排量 (Q)</span>
              <span className="font-mono text-zinc-800 dark:text-zinc-200 text-xs">
                {p201?.flow_rate_m3h ?? 120.0} <span className="text-[10px] text-zinc-500">m³/h</span>
              </span>
            </div>
            <div className="p-1.5 rounded bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/5">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block whitespace-nowrap">轴承温度</span>
              <span className="font-mono text-zinc-800 dark:text-zinc-200 text-xs">
                {p201?.bearing_temp_c ?? 52.0} <span className="text-[10px] text-zinc-500">℃</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-white/5 pt-1.5">
            <span className="truncate whitespace-nowrap">制造: 永嘉特种泵业 (YJ-SZB-100)</span>
            <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 whitespace-nowrap flex-shrink-0">扬程: 52m</span>
          </div>
        </div>

        {/* 管道连接线 2 */}
        <div className="hidden md:flex md:col-span-1 items-center justify-center">
          <svg className="w-full h-8" viewBox="0 0 100 20">
            <line x1="0" y1="10" x2="100" y2="10" className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="3" />
            <line
              x1="0" y1="10" x2="100" y2="10"
              stroke={isPumpFault ? "#EF4444" : "#10B981"}
              strokeWidth="3"
              strokeDasharray="6 6"
              className="animate-pulse"
            />
          </svg>
        </div>

        {/* 节点 3: 高压调节阀 V-102 */}
        <div className={`md:col-span-3 rounded-lg p-3.5 transition-all duration-300 flex flex-col justify-between h-full min-h-[140px] ${
          isValveFault
            ? "bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
            : "bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-white/10"
        }`}>
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 whitespace-nowrap flex-shrink-0">V-102 高压套筒调节阀</span>
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${
              isValveFault ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 animate-pulse border border-amber-300 dark:border-amber-500/40" : "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            }`}>
              {isValveFault ? "阀杆卡阻迟滞" : "正常微调"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 my-2 text-xs">
            <div className="p-1.5 rounded bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/5">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block whitespace-nowrap">开度设定 (SP)</span>
              <span className="font-mono font-semibold text-sm text-zinc-800 dark:text-zinc-200">
                {v102?.sp_percent ?? 50.0} <span className="text-[10px] font-normal text-zinc-500">%</span>
              </span>
            </div>
            <div className="p-1.5 rounded bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/5">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block whitespace-nowrap">开度反馈 (PV)</span>
              <span className={`font-mono font-semibold text-sm ${isValveFault ? 'text-amber-700 dark:text-amber-400 font-bold' : 'text-zinc-800 dark:text-zinc-200'}`}>
                {v102?.pv_percent ?? 50.2} <span className="text-[10px] font-normal text-zinc-500">%</span>
              </span>
            </div>
            <div className="p-1.5 rounded bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/5">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block whitespace-nowrap">回差 (Deadband)</span>
              <span className={`font-mono text-xs ${isValveFault ? 'text-amber-700 dark:text-amber-400 font-bold' : 'text-zinc-800 dark:text-zinc-200'}`}>
                {v102?.deadband_pct ?? 0.5} <span className="text-[10px] text-zinc-500">%</span>
              </span>
            </div>
            <div className="p-1.5 rounded bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/5">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block whitespace-nowrap">内漏超声</span>
              <span className="font-mono text-zinc-800 dark:text-zinc-200 text-xs">
                {v102?.ultrasonic_leak_db ?? 18.0} <span className="text-[10px] text-zinc-500">dB</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-white/5 pt-1.5">
            <span className="truncate whitespace-nowrap">制造: 永嘉控制装备 (YJ-DN100)</span>
            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 whitespace-nowrap flex-shrink-0">公称: PN160</span>
          </div>
        </div>

        {/* 节点 4: 出口反应塔 */}
        <div className="md:col-span-1 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-white/10 p-3 flex flex-col justify-center items-center h-full min-h-[140px] text-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center mb-1.5">
            <Wind className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
          </div>
          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">精馏塔 R-201</span>
          <span className="text-[10px] text-zinc-500 font-mono mt-1">下游受料</span>
        </div>

      </div>
    </div>
  );
};
