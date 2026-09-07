import React, { useState } from 'react';
import { ShieldAlert, Cpu, CheckCircle2, AlertOctagon, RefreshCw, Sun, Moon, Server, Menu, X } from 'lucide-react';
import { RoleSwitcher, UserRole } from './RoleSwitcher';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenSettings: () => void;
  faultMode: string;
  onSwitchMode: (mode: string) => void;
  wsConnected: boolean;
  isInvestigating: boolean;
  onTriggerAgent: (eqId: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  dataSource?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  onOpenSettings,
  faultMode,
  onSwitchMode,
  wsConnected,
  isInvestigating,
  onTriggerAgent,
  theme,
  onToggleTheme,
  dataSource = "SIMULATOR"
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full border-b border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#09090B]/90 backdrop-blur-md sticky top-0 z-50 p-3 lg:p-5 transition-colors">
      <div className="max-w-[1720px] mx-auto flex flex-col w-full">
        
        {/* =========================================
            MOBILE LAYOUT (< md)
        ========================================= */}
        <div className="flex md:hidden items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-300 dark:border-white/15 flex items-center justify-center flex-shrink-0 shadow-inner">
              <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
            </div>
            <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap truncate">
              瓯阀智枢
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 transition-colors flex items-center justify-center flex-shrink-0"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
              ) : (
                <Moon className="w-4 h-4 text-blue-600" strokeWidth={1.5} />
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 transition-colors flex items-center justify-center flex-shrink-0"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" strokeWidth={1.5} /> : <Menu className="w-4 h-4" strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU DROPDOWN */}
        {mobileMenuOpen && (
          <div className="flex md:hidden flex-col gap-4 mt-4 pt-4 border-t border-zinc-200 dark:border-white/10 animate-in slide-in-from-top-2">
            
            <RoleSwitcher
              currentRole={currentRole}
              onRoleChange={onRoleChange}
              onOpenSettings={onOpenSettings}
            />

            <div className="flex flex-col gap-2 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-white/5">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                工况模拟:
              </span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => onSwitchMode("NORMAL")}
                  className={`px-3 py-2 text-xs font-medium rounded transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                    faultMode === "NORMAL"
                      ? "bg-zinc-200 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/5"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  正常工况
                </button>
                <button
                  onClick={() => {
                    onSwitchMode("PUMP_CAVITATION");
                    onTriggerAgent("P-201");
                  }}
                  className={`px-3 py-2 text-xs font-medium rounded transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                    faultMode === "PUMP_CAVITATION"
                      ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                      : "bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/5"
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" strokeWidth={1.5} />
                  离心泵气蚀 (P-201)
                </button>
                <button
                  onClick={() => {
                    onSwitchMode("VALVE_JAMMING");
                    onTriggerAgent("V-102");
                  }}
                  className={`px-3 py-2 text-xs font-medium rounded transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                    faultMode === "VALVE_JAMMING"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      : "bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/5"
                  }`}
                >
                  <AlertOctagon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  调节阀卡阻 (V-102)
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono border whitespace-nowrap flex-shrink-0 ${
                dataSource === 'ENTERPRISE_API'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : dataSource === 'SIMULATOR_FALLBACK'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
              }`}>
                <Server className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>
                  {dataSource === 'ENTERPRISE_API' ? '企业API' : dataSource === 'SIMULATOR_FALLBACK' ? 'API降级' : '机理仿真流'}
                </span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs whitespace-nowrap flex-shrink-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                <span className="text-zinc-700 dark:text-zinc-300 font-mono">
                  {wsConnected ? 'SCADA 1Hz' : '离线回放'}
                </span>
              </div>
            </div>

            <button
              disabled={isInvestigating}
              onClick={() => onTriggerAgent(faultMode === "VALVE_JAMMING" ? "V-102" : "P-201")}
              className="w-full px-4 py-2.5 text-sm font-semibold rounded-md bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-white border border-blue-400/30 flex items-center justify-center gap-2 shadow-sm whitespace-nowrap flex-shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isInvestigating ? 'animate-spin' : ''}`} strokeWidth={1.5} />
              {isInvestigating ? 'Agent 研判中...' : '手动触发全链路研判'}
            </button>
          </div>
        )}

        {/* =========================================
            TABLET / DESKTOP LAYOUT (md+)
        ========================================= */}
        <div className="hidden md:flex flex-col gap-3 w-full">
          
          {/* Top Row: Brand, Role, Badges */}
          <div className="flex items-center justify-between gap-4">
            
            {/* Brand */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-300 dark:border-white/15 flex items-center justify-center flex-shrink-0 shadow-inner">
                <Cpu className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm lg:text-base tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap truncate">
                    瓯阀智枢 (OuValve-Ops)
                  </span>
                  <span className="hidden lg:inline-block px-2 py-0.5 text-[11px] font-medium rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap flex-shrink-0">
                    永嘉泵阀产业标杆
                  </span>
                </div>
                <p className="text-[10px] lg:text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap truncate max-w-[200px] lg:max-w-md">
                  跨系统数据穿透与智能运维 Agent · 打通 ERP 与现场工况孤岛
                </p>
              </div>
            </div>

            {/* Role Switcher */}
            <div className="flex-shrink-0">
              <RoleSwitcher
                currentRole={currentRole}
                onRoleChange={onRoleChange}
                onOpenSettings={onOpenSettings}
              />
            </div>

            {/* Right side status / Theme */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border whitespace-nowrap flex-shrink-0 ${
                dataSource === 'ENTERPRISE_API'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : dataSource === 'SIMULATOR_FALLBACK'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
              }`}>
                <Server className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>
                  {dataSource === 'ENTERPRISE_API' ? '企业真实API' : dataSource === 'SIMULATOR_FALLBACK' ? 'API降级' : '机理仿真流'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-[11px] whitespace-nowrap flex-shrink-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                <span className="text-zinc-700 dark:text-zinc-300 font-mono">
                  {wsConnected ? 'SCADA 1Hz' : '离线回放'}
                </span>
              </div>

              <button
                onClick={onToggleTheme}
                title={theme === 'dark' ? "切换为明亮日间模式" : "切换为工业暗黑模式"}
                className="p-1.5 ml-1 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 transition-colors flex items-center justify-center flex-shrink-0"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
                ) : (
                  <Moon className="w-4 h-4 text-blue-600" strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>

          {/* Bottom Row: Fault Simulation & Trigger */}
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-zinc-200 dark:border-white/10">
            
            {/* Fault simulation */}
            <div className="flex items-center gap-1.5 lg:gap-2">
              <span className="text-[11px] lg:text-xs text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap flex-shrink-0">
                工况模拟:
              </span>
              <button
                onClick={() => onSwitchMode("NORMAL")}
                className={`px-2 lg:px-2.5 py-1 text-[11px] lg:text-xs font-medium rounded transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1 ${
                  faultMode === "NORMAL"
                    ? "bg-zinc-200 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-zinc-50 dark:bg-zinc-900/40 text-zinc-500 dark:text-zinc-400 border border-zinc-200/50 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                }`}
              >
                <CheckCircle2 className="w-3 h-3 lg:w-3.5 lg:h-3.5" strokeWidth={1.5} />
                额定正常
              </button>
              
              <button
                onClick={() => {
                  onSwitchMode("PUMP_CAVITATION");
                  onTriggerAgent("P-201");
                }}
                className={`px-2 lg:px-2.5 py-1 text-[11px] lg:text-xs font-medium rounded transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1 ${
                  faultMode === "PUMP_CAVITATION"
                    ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                    : "bg-zinc-50 dark:bg-zinc-900/40 text-zinc-500 dark:text-zinc-400 border border-zinc-200/50 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                }`}
              >
                <ShieldAlert className="w-3 h-3 lg:w-3.5 lg:h-3.5" strokeWidth={1.5} />
                离心泵气蚀 (P-201)
              </button>

              <button
                onClick={() => {
                  onSwitchMode("VALVE_JAMMING");
                  onTriggerAgent("V-102");
                }}
                className={`px-2 lg:px-2.5 py-1 text-[11px] lg:text-xs font-medium rounded transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1 ${
                  faultMode === "VALVE_JAMMING"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    : "bg-zinc-50 dark:bg-zinc-900/40 text-zinc-500 dark:text-zinc-400 border border-zinc-200/50 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                }`}
              >
                <AlertOctagon className="w-3 h-3 lg:w-3.5 lg:h-3.5" strokeWidth={1.5} />
                调节阀卡阻 (V-102)
              </button>
            </div>

            {/* Trigger Agent */}
            <button
              disabled={isInvestigating}
              onClick={() => onTriggerAgent(faultMode === "VALVE_JAMMING" ? "V-102" : "P-201")}
              className="px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-semibold rounded-md bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-white border border-blue-400/30 flex items-center gap-1.5 shadow-sm whitespace-nowrap flex-shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 lg:w-4 lg:h-4 ${isInvestigating ? 'animate-spin' : ''}`} strokeWidth={1.5} />
              {isInvestigating ? 'Agent 研判中...' : '手动触发全链路研判'}
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
