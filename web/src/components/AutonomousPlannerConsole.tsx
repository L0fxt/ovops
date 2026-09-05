import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Send, 
  Cpu, 
  Database, 
  Share2, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronRight, 
  Sparkles, 
  Layers, 
  FileText,
  Terminal,
  Activity
} from 'lucide-react';

interface TaskStep {
  step_id: string;
  step_title: string;
  category: 'PLANNER' | 'PHYSICS_SOLVER' | 'KNOWLEDGE_RAG' | 'DATABASE_ERP' | 'THIRD_PARTY_TOOL';
  category_label: string;
  status: string;
  duration_ms: number;
  tool_name: string;
  input_payload: any;
  output_payload: any;
  thought: string;
}

interface AutonomousPlannerConsoleProps {
  investigation: any;
  isPlanning: boolean;
  onExecuteGoal: (goal: string, eqId?: string) => void;
}

export const AutonomousPlannerConsole: React.FC<AutonomousPlannerConsoleProps> = ({
  investigation,
  isPlanning,
  onExecuteGoal
}) => {
  const [goalText, setGoalText] = useState<string>(
    "针对 P-201 特种耐酸工业离心泵入口压力骤降与高频微爆振动，自主核算汽蚀余量，穿透 ERP 匹配本地备件并生成抢修闭环工单"
  );
  const [expandedStep, setExpandedStep] = useState<string | null>("STEP-2");
  const [showReasoning, setShowReasoning] = useState<boolean>(true);

  const presets = [
    {
      label: "离心泵气蚀闭环抢修",
      eqId: "P-201",
      goal: "针对 P-201 特种耐酸工业离心泵入口压力骤降与高频微爆振动，自主核算汽蚀余量，穿透 ERP 匹配本地备件并生成抢修闭环工单"
    },
    {
      label: "调节阀卡阻回差分析",
      eqId: "V-102",
      goal: "检测到 V-102 高压套筒调节阀行程反馈严重滞后，自主拟合 PV-SP 回差死区，检索原厂拆检规程并联动钉飞协同端下发检修审批"
    },
    {
      label: "全厂设备健康度全盘诊断",
      eqId: "P-201",
      goal: "全面评估主装置关键流体设备当前健康度，自主规划本周末预防性停机检修排程，完成永嘉本地备件库预扣调拨"
    }
  ];

  const taskTree: TaskStep[] = investigation?.task_tree || [];
  const totalElapsed = investigation?.total_elapsed_ms || 86;
  const isRealLlm = investigation?.planner_mode === "REAL_LLM_DEEPSEEK";
  const llmModel = investigation?.llm_model || "DeepSeek-V4";
  const llmReasoning = investigation?.llm_reasoning;
  const summaryText = investigation?.summary;

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'PHYSICS_SOLVER':
        return (
          <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap flex items-center gap-1">
            <Cpu className="w-3 h-3" strokeWidth={1.5} />
            机理算力层 (NumPy/SciPy)
          </span>
        );
      case 'DATABASE_ERP':
        return (
          <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap flex items-center gap-1">
            <Database className="w-3 h-3" strokeWidth={1.5} />
            数据库/ERP (SQL Data)
          </span>
        );
      case 'THIRD_PARTY_TOOL':
        return (
          <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap flex items-center gap-1">
            <Share2 className="w-3 h-3" strokeWidth={1.5} />
            第三方协同 (钉钉/飞书)
          </span>
        );
      case 'KNOWLEDGE_RAG':
        return (
          <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 whitespace-nowrap flex items-center gap-1">
            <BookOpen className="w-3 h-3" strokeWidth={1.5} />
            专家规程库 (RAG)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap flex items-center gap-1">
            <BrainCircuit className="w-3 h-3" strokeWidth={1.5} />
            决策中枢 (Planner)
          </span>
        );
    }
  };

  const handleRunGoal = () => {
    if (!goalText.trim()) return;
    onExecuteGoal(goalText);
  };

  return (
    <div className="w-full bg-white dark:bg-[#09090B] border border-zinc-200 dark:border-white/10 rounded-xl p-4 lg:p-6 shadow-sm transition-colors space-y-4">
      
      {/* 头部标题与定位 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
            <BrainCircuit className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-sm lg:text-base text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                智能体自主目标规划与跨平台求解中枢 (Autonomous Goal Planner)
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap flex-shrink-0">
                Plan-and-Solve 架构
              </span>
              {isRealLlm ? (
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap flex items-center gap-1 flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-blue-500 animate-pulse" strokeWidth={1.5} />
                  {llmModel} 真实大模型在线驱动
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20 whitespace-nowrap flex items-center gap-1 flex-shrink-0">
                  🛡️ 本地高保真机理引擎 (离线模式)
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
              理解复杂自然语言业务目标 · 自主拆解多阶段任务工序 · 动态调度跨系统工具闭环
            </p>
          </div>
        </div>

        {/* 运行指标 */}
        <div className="flex items-center gap-3 text-xs font-mono text-zinc-500 dark:text-zinc-400 flex-shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10">
            <Layers className="w-3.5 h-3.5 text-blue-500" strokeWidth={1.5} />
            <span>拆解工序: <strong className="text-zinc-800 dark:text-zinc-200">{taskTree.length || 6} 阶段</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10">
            <Clock className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.5} />
            <span>求解耗时: <strong className="text-zinc-800 dark:text-zinc-200">{totalElapsed} ms</strong></span>
          </div>
        </div>
      </div>

      {/* 快捷业务场景胶囊 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap flex items-center gap-1 flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.5} />
          典型复杂目标:
        </span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              setGoalText(p.goal);
              onExecuteGoal(p.goal, p.eqId);
            }}
            className="px-2.5 py-1 text-xs rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 transition-all active:scale-[0.98] whitespace-nowrap flex-shrink-0"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 业务目标自由输入栏 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Terminal className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
          <input
            type="text"
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRunGoal()}
            placeholder="输入自然语言运维目标，如：针对P-201入口压降，核算气蚀机理并调取本地备件建单..."
            className="w-full pl-9 pr-3 py-2 text-xs lg:text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-white/15 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans transition-colors"
          />
        </div>
        <button
          onClick={handleRunGoal}
          disabled={isPlanning}
          className="px-4 py-2 text-xs lg:text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white border border-blue-400/30 flex items-center justify-center gap-1.5 shadow-sm transition-all whitespace-nowrap flex-shrink-0 disabled:opacity-50"
        >
          <Send className={`w-3.5 h-3.5 ${isPlanning ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          {isPlanning ? 'Agent 自主规划拆解中...' : '提交目标并自主规划'}
        </button>
      </div>

      {/* 大模型工程推演思维链 (DeepSeek CoT Reasoning) */}
      {llmReasoning && (
        <div className="border border-blue-200/80 dark:border-blue-900/50 rounded-lg overflow-hidden bg-blue-50/20 dark:bg-blue-950/20 shadow-xs transition-colors">
          <div 
            onClick={() => setShowReasoning(!showReasoning)}
            className="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-blue-100/40 dark:hover:bg-blue-900/30 transition-colors border-b border-blue-200/50 dark:border-blue-900/30"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-blue-950 dark:text-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" strokeWidth={1.5} />
              <span>大模型工程推演思维链 (DeepSeek CoT Reasoning)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                真实在线生成
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-mono">
              <span>{showReasoning ? '收起思维链' : '展开思维链'}</span>
              {showReasoning ? <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} /> : <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />}
            </div>
          </div>
          {showReasoning && (
            <div className="p-3 text-xs font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto bg-white/70 dark:bg-zinc-950/70 selection:bg-blue-500/20">
              {llmReasoning}
            </div>
          )}
        </div>
      )}

      {/* 智能体决议总结摘要 */}
      {summaryText && (
        <div className="p-3 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50/70 dark:bg-zinc-900/50 text-xs text-zinc-800 dark:text-zinc-200 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
            <Activity className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.5} />
            <span>智能体综合研判与处置决议:</span>
          </div>
          <p className="leading-relaxed font-sans text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
            {summaryText}
          </p>
        </div>
      )}

      {/* 自主规划任务树 (Dynamic Task Tree DAG) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-medium px-1">
          <span>自主拆解多步骤业务任务树与跨平台工具调度实况:</span>
          <span className="font-mono text-[11px]">点击步骤可展开查看入参与底层工具载荷</span>
        </div>

        <div className="space-y-2">
          {taskTree.map((step) => {
            const isExpanded = expandedStep === step.step_id;
            return (
              <div 
                key={step.step_id}
                className="border border-zinc-200 dark:border-white/10 rounded-lg overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/40 transition-colors"
              >
                {/* 步骤条目摘要 */}
                <div 
                  onClick={() => setExpandedStep(isExpanded ? null : step.step_id)}
                  className="p-3 flex flex-wrap items-center justify-between gap-2 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" strokeWidth={1.5} />
                    <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 font-bold whitespace-nowrap flex-shrink-0">
                      [{step.step_id}]
                    </span>
                    <span className="font-medium text-xs lg:text-sm text-zinc-900 dark:text-zinc-100 whitespace-nowrap flex-shrink-0">
                      {step.step_title}
                    </span>
                    <span className="hidden md:inline-block">
                      {getCategoryBadge(step.category)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                    <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-white/10 hidden sm:inline">
                      {step.tool_name}
                    </span>
                    <span className="text-zinc-600 dark:text-zinc-300">
                      {step.duration_ms} ms
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                    )}
                  </div>
                </div>

                {/* 步骤详情展开面板 */}
                {isExpanded && (
                  <div className="p-3 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-white/10 space-y-2 text-xs">
                    {/* 思考逻辑 */}
                    <div className="p-2 rounded bg-zinc-100/80 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 font-sans leading-relaxed">
                      <strong className="text-zinc-900 dark:text-zinc-100 font-mono">Agent 思维决策: </strong>
                      {step.thought}
                    </div>

                    {/* 真实工具入参与出参 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono">
                      <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 overflow-x-auto">
                        <div className="text-[11px] text-zinc-500 pb-1 font-sans font-medium flex items-center gap-1">
                          <span>📥 工具调用入参 (Input Payload)</span>
                        </div>
                        <pre className="text-[11px] text-zinc-700 dark:text-zinc-300 whitespace-pre">
                          {JSON.stringify(step.input_payload, null, 2)}
                        </pre>
                      </div>

                      <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 overflow-x-auto">
                        <div className="text-[11px] text-zinc-500 pb-1 font-sans font-medium flex items-center gap-1">
                          <span>📤 结构化执行返回 (Output Payload)</span>
                        </div>
                        <pre className="text-[11px] text-zinc-700 dark:text-zinc-300 whitespace-pre">
                          {JSON.stringify(step.output_payload, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
