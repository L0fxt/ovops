import React from 'react';
import { Terminal, Cpu, Database, Wrench, Send, ChevronRight, AlertCircle, FileText } from 'lucide-react';

interface AgentInvestigationPanelProps {
  investigation: any;
  isInvestigating: boolean;
}

export const AgentInvestigationPanel: React.FC<AgentInvestigationPanelProps> = ({ investigation, isInvestigating }) => {
  const thoughts = investigation?.thought_logs ?? [];
  const sopSteps = investigation?.sop_steps ?? [];
  const parts = investigation?.available_spare_parts ?? [];

  const nodes = [
    { id: "detect", label: "1. 异常感知", icon: AlertCircle },
    { id: "diagnose", label: "2. 机理计算", icon: Cpu },
    { id: "rag", label: "3. 规程匹配", icon: FileText },
    { id: "erp", label: "4. ERP穿透", icon: Database },
    { id: "decompose", label: "5. 任务拆解", icon: Wrench },
    { id: "notify", label: "6. 钉飞触达", icon: Send }
  ];

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 p-4 lg:p-5 shadow-sm flex flex-col gap-4 transition-colors">
      {/* 顶部标题与 LangGraph 状态机流转横幅 */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-zinc-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
            LangGraph 智能体状态机执行引擎与推理链路
          </h3>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap flex-shrink-0">
          目标设备: {investigation?.equipment_id ?? 'P-201'} | 状态: {isInvestigating ? '自主规划中...' : '闭环就绪'}
        </span>
      </div>

      {/* LangGraph 节点步进可视化 (Bento 流水线) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {nodes.map((node, index) => {
          const Icon = node.icon;
          const isDone = thoughts.length > index;
          const isCurrent = isInvestigating && thoughts.length === index;

          return (
            <div
              key={node.id}
              className={`p-2 rounded-lg border text-xs flex items-center gap-2 transition-all ${
                isDone
                  ? "bg-zinc-50 dark:bg-zinc-900/90 border-emerald-500/40 dark:border-emerald-500/30 text-zinc-900 dark:text-zinc-200 shadow-sm"
                  : isCurrent
                  ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500/50 text-blue-700 dark:text-blue-300 animate-pulse"
                  : "bg-zinc-100/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-white/5 text-zinc-400 dark:text-zinc-500"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isDone ? 'text-emerald-600 dark:text-emerald-400' : isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 dark:text-zinc-500'}`} strokeWidth={1.5} />
              <span className="font-medium whitespace-nowrap truncate">{node.label}</span>
            </div>
          );
        })}
      </div>

      {/* 下半区：左侧思维链终端 + 右侧业务机理与拆解清单 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* 左侧：Agent 思考链原生终端 (7 列) */}
        <div className="lg:col-span-7 rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 dark:border-white/10 p-3 flex flex-col h-[280px] overflow-hidden shadow-inner">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 dark:border-white/5 text-[11px] text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5 whitespace-nowrap text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              AGENT_THOUGHT_TRACE
            </span>
            <span className="whitespace-nowrap text-zinc-500">ReAct Tool-Calling Engine</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 font-mono text-xs pr-1">
            {thoughts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500 text-xs italic">
                等待异常捕获触发 Agent 推理链路...
              </div>
            ) : (
              thoughts.map((item: any, i: number) => (
                <div key={i} className="flex flex-col gap-0.5 animate-fadeIn">
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                    <span>[{item.timestamp}]</span>
                    <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-blue-300 font-sans text-[10px]">
                      {item.node}
                    </span>
                  </div>
                  <p className="text-zinc-100 text-xs pl-2 border-l border-zinc-700 leading-relaxed">
                    {item.thought}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 右侧：拆解出的 SOP 与调拨备件 (5 列) */}
        <div className="lg:col-span-5 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-white/10 p-3 flex flex-col justify-between h-[280px] overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 whitespace-nowrap flex-shrink-0">
                自主拆解维保规程 (SOP)
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap flex-shrink-0">
                原厂权威认证
              </span>
            </div>

            <div className="space-y-1.5 my-2">
              {sopSteps.length === 0 ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">暂无 SOP</p>
              ) : (
                sopSteps.map((step: string, i: number) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                    <ChevronRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <p className="text-[11px] leading-snug line-clamp-2" title={step}>
                      {step}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 永嘉本地备件匹配 */}
          <div className="border-t border-zinc-200 dark:border-white/5 pt-2 mt-2">
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-300 block mb-1.5">
              ERP 本地备件供应链协同
            </span>
            <div className="space-y-1">
              {parts.slice(0, 2).map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
                  <div className="truncate mr-2">
                    <span className="text-zinc-900 dark:text-zinc-200 font-medium block truncate">{p.name}</span>
                    <span className="text-zinc-500 text-[10px] truncate block">{p.supplier}</span>
                  </div>
                  <div className="text-right flex-shrink-0 font-mono">
                    <span className="text-emerald-600 dark:text-emerald-400 block font-semibold">库存: {p.stock_qty}套</span>
                    <span className="text-zinc-500 text-[10px]">￥{p.unit_price_cny}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
