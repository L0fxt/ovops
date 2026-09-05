import React from 'react';
import { ShieldAlert, Cpu, CheckCircle2, AlertOctagon, RefreshCw, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  faultMode: string;
  onSwitchMode: (mode: string) => void;
  wsConnected: boolean;
  isInvestigating: boolean;
  onTriggerAgent: (eqId: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  faultMode,
  onSwitchMode,
  wsConnected,
  isInvestigating,
  onTriggerAgent,
  theme,
  onToggleTheme
}) => {
  return (
    <header className="w-full border-b border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#09090B]/90 backdrop-blur-md sticky top-0 z-50 px-4 lg:px-6 py-3 transition-colors">
      <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* 左侧：品牌与定位 */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-300 dark:border-white/15 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Cpu className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                瓯阀智枢 (OuValve-Ops)
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-medium rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap flex-shrink-0">
                永嘉泵阀产业标杆
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap overflow-hidden text-ellipsis hidden md:block">
              跨系统数据穿透与智能运维 Agent · 打通 ERP 与现场工况孤岛
            </p>
          </div>
        </div>

        {/* 中间：工况场景模拟切换 (注入器) */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200 dark:border-white/10 overflow-x-auto max-w-full flex-shrink-0">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 px-2 font-medium whitespace-nowrap flex-shrink-0 hidden lg:inline">
            工况模拟:
          </span>
          <button
            onClick={() => onSwitchMode("NORMAL")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 ${
              faultMode === "NORMAL"
                ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            额定正常工况
          </button>
          
          <button
            onClick={() => {
              onSwitchMode("PUMP_CAVITATION");
              onTriggerAgent("P-201");
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 ${
              faultMode === "PUMP_CAVITATION"
                ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-500 dark:text-red-400" strokeWidth={1.5} />
            特种离心泵气蚀 (P-201)
          </button>

          <button
            onClick={() => {
              onSwitchMode("VALVE_JAMMING");
              onTriggerAgent("V-102");
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 ${
              faultMode === "VALVE_JAMMING"
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" strokeWidth={1.5} />
            高压调节阀卡阻 (V-102)
          </button>
        </div>

        {/* 右侧：推流状态、日夜切换与触发按钮 */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          
          {/* 日夜模式切换按钮 */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? "切换为明亮日间模式" : "切换为工业暗黑模式"}
            className="p-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 transition-colors flex items-center justify-center flex-shrink-0"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
            ) : (
              <Moon className="w-4 h-4 text-blue-600" strokeWidth={1.5} />
            )}
          </button>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs whitespace-nowrap flex-shrink-0">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
            <span className="text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">
              {wsConnected ? 'SCADA 1Hz 实时流' : '离线回放'}
            </span>
          </div>

          <button
            disabled={isInvestigating}
            onClick={() => onTriggerAgent(faultMode === "VALVE_JAMMING" ? "V-102" : "P-201")}
            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-white border border-blue-400/30 flex items-center gap-1.5 shadow-sm whitespace-nowrap flex-shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isInvestigating ? 'animate-spin' : ''}`} strokeWidth={1.5} />
            {isInvestigating ? 'Agent 研判中...' : '手动触发全链路研判'}
          </button>
        </div>

      </div>
    </header>
  );
};
