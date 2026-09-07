import React from 'react';
import { Activity, ArrowRight, ArrowDown, Wind, Database } from 'lucide-react';

interface DigitalTwinFlowProps {
  p201: any;
  v102: any;
  faultMode: string;
}

export const DigitalTwinFlow: React.FC<DigitalTwinFlowProps> = ({ p201, v102, faultMode }) => {
  const isPumpFault = faultMode === "PUMP_CAVITATION";
  const isValveFault = faultMode === "VALVE_JAMMING";

  return (
    <div className="w-full rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 p-3 lg:p-4 relative overflow-hidden shadow-sm transition-colors">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
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

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 w-full">
        {/* T-101 Desktop Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/10 flex-shrink-0 text-[11px] shadow-sm">
          <Database className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">T-101 储罐</span>
          <span className="text-zinc-300 dark:text-zinc-600">|</span>
          <span className="font-mono text-zinc-600 dark:text-zinc-400">液位 68.4%</span>
        </div>

        <div className="hidden md:flex text-zinc-300 dark:text-zinc-700 flex-shrink-0">
          <ArrowRight size={14} strokeWidth={2} />
        </div>

        {/* Main Cards */}
        <div className="flex-1 flex flex-col md:flex-row gap-3 md:gap-4 min-w-0">
          
          {/* P-201 Column */}
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            {/* T-101 Mobile Badge */}
            <div className="md:hidden flex items-center self-start gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-[10px]">
              <Database className="w-3 h-3 text-zinc-500" strokeWidth={1.5} />
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">T-101 储罐</span>
              <span className="text-zinc-400">·</span>
              <span className="font-mono text-zinc-600 dark:text-zinc-400">液位 68.4%</span>
              <ArrowDown size={12} className="ml-0.5 text-zinc-400" strokeWidth={2} />
            </div>

            {/* P-201 Card */}
            <div className={`rounded-xl p-3 flex flex-col h-full transition-all duration-300 ${
              isPumpFault
                ? "bg-red-50 dark:bg-red-950/20 border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                : "bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/10"
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate flex-shrink-0">
                  P-201 特种耐酸离心泵
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${
                  isPumpFault 
                    ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 animate-pulse border border-red-200 dark:border-red-500/30" 
                    : "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                }`}>
                  {isPumpFault ? "气蚀高危报警" : "正常运转"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 mb-2">
                <div className="p-1.5 rounded bg-white dark:bg-zinc-900/60 border border-zinc-100 dark:border-white/5 flex flex-col">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5 whitespace-nowrap">入口压力</span>
                  <span className={`font-mono text-sm leading-none ${isPumpFault ? 'text-red-600 dark:text-red-400 font-bold' : 'text-zinc-800 dark:text-zinc-200 font-semibold'}`}>
                    {p201?.inlet_pressure_kpa ?? 125.0} <span className="text-[9px] font-normal text-zinc-400">kPa</span>
                  </span>
                </div>
                <div className="p-1.5 rounded bg-white dark:bg-zinc-900/60 border border-zinc-100 dark:border-white/5 flex flex-col">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5 whitespace-nowrap">振动 RMS</span>
                  <span className={`font-mono text-sm leading-none ${isPumpFault ? 'text-red-600 dark:text-red-400 font-bold' : 'text-zinc-800 dark:text-zinc-200 font-semibold'}`}>
                    {p201?.vibration_rms_mms ?? 1.6} <span className="text-[9px] font-normal text-zinc-400">mm/s</span>
                  </span>
                </div>
                <div className="p-1.5 rounded bg-white dark:bg-zinc-900/60 border border-zinc-100 dark:border-white/5 flex flex-col">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5 whitespace-nowrap">排量 (Q)</span>
                  <span className="font-mono text-xs leading-none text-zinc-800 dark:text-zinc-200 font-medium">
                    {p201?.flow_rate_m3h ?? 120.0} <span className="text-[9px] text-zinc-400">m³/h</span>
                  </span>
                </div>
                <div className="p-1.5 rounded bg-white dark:bg-zinc-900/60 border border-zinc-100 dark:border-white/5 flex flex-col">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5 whitespace-nowrap">轴承温度</span>
                  <span className="font-mono text-xs leading-none text-zinc-800 dark:text-zinc-200 font-medium">
                    {p201?.bearing_temp_c ?? 52.0} <span className="text-[9px] text-zinc-400">℃</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 mt-auto pt-1 border-t border-zinc-200 dark:border-white/5">
                <span className="truncate pr-2">永嘉特种泵业 YJ-SZB-100</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap flex-shrink-0">H: 52m</span>
              </div>
            </div>
          </div>

          {/* Desktop Arrow between Cards */}
          <div className="hidden md:flex flex-col justify-center items-center px-1">
            <div className={`flex items-center gap-1 ${isPumpFault ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
              <div className="w-4 h-[2px] bg-current rounded-full" />
              <ArrowRight size={14} strokeWidth={2.5} />
            </div>
          </div>

          {/* V-102 Column */}
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            {/* V-102 Card */}
            <div className={`rounded-xl p-3 flex flex-col h-full transition-all duration-300 ${
              isValveFault
                ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                : "bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/10"
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate flex-shrink-0">
                  V-102 高压套筒调节阀
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${
                  isValveFault 
                    ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 animate-pulse border border-amber-200 dark:border-amber-500/30" 
                    : "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                }`}>
                  {isValveFault ? "阀杆卡阻迟滞" : "正常微调"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 mb-2">
                <div className="p-1.5 rounded bg-white dark:bg-zinc-900/60 border border-zinc-100 dark:border-white/5 flex flex-col">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5 whitespace-nowrap">开度设定 (SP)</span>
                  <span className="font-mono text-sm leading-none text-zinc-800 dark:text-zinc-200 font-semibold">
                    {v102?.sp_percent ?? 50.0} <span className="text-[9px] font-normal text-zinc-400">%</span>
                  </span>
                </div>
                <div className="p-1.5 rounded bg-white dark:bg-zinc-900/60 border border-zinc-100 dark:border-white/5 flex flex-col">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5 whitespace-nowrap">开度反馈 (PV)</span>
                  <span className={`font-mono text-sm leading-none ${isValveFault ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-zinc-800 dark:text-zinc-200 font-semibold'}`}>
                    {v102?.pv_percent ?? 50.2} <span className="text-[9px] font-normal text-zinc-400">%</span>
                  </span>
                </div>
                <div className="p-1.5 rounded bg-white dark:bg-zinc-900/60 border border-zinc-100 dark:border-white/5 flex flex-col">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5 whitespace-nowrap">回差 (Deadband)</span>
                  <span className={`font-mono text-xs leading-none font-medium ${isValveFault ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                    {v102?.deadband_pct ?? 0.5} <span className="text-[9px] text-zinc-400">%</span>
                  </span>
                </div>
                <div className="p-1.5 rounded bg-white dark:bg-zinc-900/60 border border-zinc-100 dark:border-white/5 flex flex-col">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5 whitespace-nowrap">内漏超声</span>
                  <span className="font-mono text-xs leading-none text-zinc-800 dark:text-zinc-200 font-medium">
                    {v102?.ultrasonic_leak_db ?? 18.0} <span className="text-[9px] text-zinc-400">dB</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 mt-auto pt-1 border-t border-zinc-200 dark:border-white/5">
                <span className="truncate pr-2">永嘉控制装备 YJ-DN100</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap flex-shrink-0">PN160</span>
              </div>
            </div>

            {/* R-201 Mobile Badge */}
            <div className="md:hidden flex items-center self-end gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-[10px]">
              <ArrowDown size={12} className="mr-0.5 text-zinc-400" strokeWidth={2} />
              <Wind className="w-3 h-3 text-blue-500" strokeWidth={1.5} />
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">R-201 精馏塔</span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex text-zinc-300 dark:text-zinc-700 flex-shrink-0">
          <ArrowRight size={14} strokeWidth={2} />
        </div>

        {/* R-201 Desktop Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/10 flex-shrink-0 text-[11px] shadow-sm">
          <Wind className="w-3.5 h-3.5 text-blue-500" strokeWidth={1.5} />
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">R-201 精馏塔</span>
          <span className="text-zinc-300 dark:text-zinc-600">|</span>
          <span className="font-mono text-zinc-600 dark:text-zinc-400">下游受料</span>
        </div>
      </div>
    </div>
  );
};
