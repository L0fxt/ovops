import React, { useState, useEffect } from 'react';
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
  Terminal,
  Activity,
  AlertCircle,
  FileText,
  Wrench,
  ListTree,
  MessageSquareText,
  Package
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
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [showReasoning, setShowReasoning] = useState<boolean>(true);
  const [showPresets, setShowPresets] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'cot' | 'sop'>('tasks');
  const [equipments, setEquipments] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/agent/erp/equipments')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setEquipments(data); })
      .catch(() => {});
  }, [investigation]);

  useEffect(() => {
    if (investigation?.task_tree?.length > 0 && !expandedStep) {
      setExpandedStep(investigation.task_tree[0].step_id);
    }
  }, [investigation?.task_tree]);

  const presets = [
    { label: "离心泵气蚀闭环", eqId: "P-201", goal: "针对 P-201 特种耐酸工业离心泵入口压力骤降与高频微爆振动，自主核算汽蚀余量，穿透 ERP 匹配本地备件并生成抢修闭环工单" },
    { label: "调节阀卡阻分析", eqId: "V-102", goal: "检测到 V-102 高压套筒调节阀行程反馈严重滞后，自主拟合 PV-SP 回差死区，检索原厂拆检规程并联动钉飞协同端下发检修审批" },
    { label: "全厂健康度诊断", eqId: "P-201", goal: "全面评估主装置关键流体设备当前健康度，自主规划本周末预防性停机检修排程，完成永嘉本地备件库预扣调拨" }
  ];

  const taskTree: TaskStep[] = investigation?.task_tree || [];
  const totalElapsed = investigation?.total_elapsed_ms || 0;
  const isRealLlm = investigation?.planner_mode === "REAL_LLM_DEEPSEEK";
  const llmModel = investigation?.llm_model || "DeepSeek-V4";
  const llmReasoning = investigation?.llm_reasoning;
  const summaryText = investigation?.summary;
  const thoughts = investigation?.thought_logs ?? [];
  const sopSteps = investigation?.sop_steps ?? [];
  const parts = investigation?.available_spare_parts ?? [];

  const pipelineNodes = [
    { id: "detect", label: "异常感知", icon: AlertCircle },
    { id: "diagnose", label: "机理计算", icon: Cpu },
    { id: "rag", label: "规程匹配", icon: FileText },
    { id: "erp", label: "ERP穿透", icon: Database },
    { id: "decompose", label: "任务拆解", icon: Wrench },
    { id: "notify", label: "协同触达", icon: Send }
  ];

  const getCategoryBadge = (cat: string) => {
    const badges: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
      'PHYSICS_SOLVER': { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-600 dark:text-amber-400', icon: <Cpu className="w-3 h-3" strokeWidth={1.5} />, label: '机理算力' },
      'DATABASE_ERP': { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-600 dark:text-blue-400', icon: <Database className="w-3 h-3" strokeWidth={1.5} />, label: 'ERP数据' },
      'THIRD_PARTY_TOOL': { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', icon: <Share2 className="w-3 h-3" strokeWidth={1.5} />, label: '钉飞协同' },
      'KNOWLEDGE_RAG': { bg: 'bg-cyan-500/10 border-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400', icon: <BookOpen className="w-3 h-3" strokeWidth={1.5} />, label: 'RAG规程' },
    };
    const b = badges[cat] || { bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-600 dark:text-purple-400', icon: <BrainCircuit className="w-3 h-3" strokeWidth={1.5} />, label: '决策中枢' };
    return (<span className={`px-1.5 py-0.5 text-[10px] font-mono rounded border ${b.bg} ${b.text} whitespace-nowrap flex items-center gap-1`}>{b.icon}{b.label}</span>);
  };

  const handleRunGoal = () => {
    if (!goalText.trim()) return;
    setShowPresets(false);
    setActiveTab('tasks');
    onExecuteGoal(goalText);
  };

  const tabs = [
    { id: 'tasks' as const, label: '规划任务树', icon: ListTree, count: taskTree.length },
    { id: 'cot' as const, label: '思维链', icon: MessageSquareText, count: thoughts.length },
    { id: 'sop' as const, label: 'SOP与备件', icon: Package, count: sopSteps.length },
  ];

  return (
    <div className="w-full bg-white dark:bg-[#09090B] border-2 border-blue-500/25 dark:border-blue-500/20 rounded-xl shadow-sm shadow-blue-500/5 transition-colors overflow-hidden">
      
      {/* Header: compact title + LangGraph pipeline */}
      <div className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-5 border-b border-zinc-200 dark:border-white/10 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
              <BrainCircuit className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">Agent 规划中枢</h3>
            {isRealLlm ? (
              <span className="hidden sm:flex px-1.5 py-0.5 text-[10px] font-mono rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap items-center gap-1 flex-shrink-0">
                <Sparkles className="w-3 h-3 animate-pulse" strokeWidth={1.5} />{llmModel}
              </span>
            ) : (
              <span className="hidden sm:flex px-1.5 py-0.5 text-[10px] font-mono rounded bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border border-zinc-500/20 whitespace-nowrap items-center gap-1 flex-shrink-0">🛡️ 本地机理引擎</span>
            )}
          </div>
          {totalElapsed > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-[11px] font-mono text-zinc-500 flex-shrink-0">
              <Clock className="w-3 h-3 text-emerald-500" strokeWidth={1.5} />
              <span>{taskTree.length}步 · {totalElapsed}ms</span>
            </div>
          )}
        </div>

        {/* LangGraph pipeline nodes */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 -mb-0.5 scrollbar-none">
          {pipelineNodes.map((node, index) => {
            const Icon = node.icon;
            const isDone = thoughts.length > index;
            const isCurrent = isPlanning && thoughts.length === index;
            return (
              <React.Fragment key={node.id}>
                {index > 0 && <ChevronRight className={`w-3 h-3 flex-shrink-0 ${isDone ? 'text-emerald-400' : 'text-zinc-300 dark:text-zinc-600'}`} strokeWidth={1.5} />}
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                  isDone ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : isCurrent ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 animate-pulse"
                  : "text-zinc-400 dark:text-zinc-500 border border-transparent"
                }`}>
                  <Icon className="w-3 h-3 flex-shrink-0" strokeWidth={1.5} />
                  <span className="hidden sm:inline">{node.label}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Input area — FIRST thing user interacts with */}
      <div className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-5 border-b border-zinc-100 dark:border-white/5 space-y-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Terminal className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
            <input
              type="text"
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunGoal()}
              onFocus={() => setShowPresets(true)}
              placeholder="输入运维目标，如：P-201入口压降，核算气蚀并建单..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-white/15 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans transition-colors"
            />
          </div>
          <button onClick={handleRunGoal} disabled={isPlanning}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white border border-blue-400/30 flex items-center justify-center gap-1.5 shadow-sm transition-all whitespace-nowrap flex-shrink-0 disabled:opacity-50">
            <Send className={`w-3.5 h-3.5 ${isPlanning ? 'animate-spin' : ''}`} strokeWidth={1.5} />
            {isPlanning ? '规划中...' : '提交目标'}
          </button>
        </div>

        {showPresets && (
          <div className="flex flex-wrap items-center gap-1.5 animate-fadeIn">
            <span className="text-[11px] text-zinc-400 font-medium whitespace-nowrap flex-shrink-0">快捷:</span>
            {presets.map((p, idx) => (
              <button key={idx} onClick={() => { setGoalText(p.goal); onExecuteGoal(p.goal, p.eqId); setShowPresets(false); }}
                className="px-2 py-0.5 text-[11px] rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 transition-colors whitespace-nowrap flex-shrink-0">
                {p.label}
              </button>
            ))}
            {equipments.length > 0 && (<>
              <span className="text-zinc-300 dark:text-zinc-600">|</span>
              {equipments.map(eq => (
                <button key={eq.id} onClick={() => {
                  const isPump = eq.category === '离心泵' || eq.name?.includes('泵');
                  const newGoal = isPump
                    ? `针对 ${eq.id} (${eq.name}) 开展水动力学汽蚀余量与高频振动 FFT 研判，穿透 ERP 匹配本地备件并生成维保闭环工单`
                    : `针对 ${eq.id} (${eq.name}) 开展行程跟踪精度与非线性回差死区分析，检索原厂 SOP 规程并协同钉飞下发抢修工单`;
                  setGoalText(newGoal); onExecuteGoal(newGoal, eq.id); setShowPresets(false);
                }}
                  className="px-1.5 py-0.5 text-[10px] rounded bg-zinc-100 hover:bg-blue-50 dark:bg-zinc-900 dark:hover:bg-blue-950/40 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 transition-colors whitespace-nowrap font-mono">
                  {eq.id}
                </button>
              ))}
            </>)}
          </div>
        )}
      </div>

      {/* Summary banner */}
      {summaryText && (
        <div className="mx-3 sm:mx-4 lg:mx-5 mt-2.5 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs text-zinc-800 dark:text-zinc-200">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
            <Activity className="w-3.5 h-3.5" strokeWidth={1.5} /><span>Agent 综合研判决议</span>
          </div>
          <p className="leading-relaxed text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap line-clamp-3">{summaryText}</p>
        </div>
      )}

      {/* Tabs */}
      {(taskTree.length > 0 || thoughts.length > 0 || sopSteps.length > 0) && (
        <div className="px-3 sm:px-4 lg:px-5 pt-2.5">
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                  }`}>
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.5} /><span>{tab.label}</span>
                  {tab.count > 0 && <span className="text-[10px] font-mono bg-zinc-200 dark:bg-zinc-700 px-1 rounded">{tab.count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-5 lg:pb-4 space-y-2">

        {/* TAB 1: Task Tree */}
        {activeTab === 'tasks' && (
          <div className="space-y-1.5">
            {taskTree.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400 italic">
                {isPlanning ? (
                  <div className="flex flex-col items-center gap-2">
                    <BrainCircuit className="w-6 h-6 text-blue-500 animate-pulse" strokeWidth={1.5} />
                    <span>Agent 正在自主拆解任务工序...</span>
                  </div>
                ) : '输入业务目标并提交，Agent 将自主规划并执行'}
              </div>
            ) : (
              taskTree.map((step) => {
                const isExpanded = expandedStep === step.step_id;
                return (
                  <div key={step.step_id} className="border border-zinc-200 dark:border-white/10 rounded-lg overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/40 transition-colors">
                    <div onClick={() => setExpandedStep(isExpanded ? null : step.step_id)}
                      className="px-2.5 py-2 sm:px-3 flex items-center justify-between gap-2 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" strokeWidth={1.5} />
                        <span className="font-mono text-[11px] text-zinc-400 font-bold flex-shrink-0">[{step.step_id}]</span>
                        <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">{step.step_title}</span>
                        <span className="hidden md:inline-block">{getCategoryBadge(step.category)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 flex-shrink-0">
                        <span className="hidden sm:inline bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-white/10 text-[10px]">{step.tool_name}</span>
                        <span>{step.duration_ms}ms</span>
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} /> : <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-2.5 py-2 sm:px-3 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-white/10 space-y-2 text-xs">
                        <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                          <strong className="text-zinc-900 dark:text-zinc-100 font-mono text-[11px]">Agent 决策: </strong>{step.thought}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono">
                          <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 overflow-x-auto">
                            <div className="text-[10px] text-zinc-500 pb-1 font-sans font-medium">📥 入参</div>
                            <pre className="text-[10px] text-zinc-700 dark:text-zinc-300 whitespace-pre overflow-x-auto">{JSON.stringify(step.input_payload, null, 2)}</pre>
                          </div>
                          <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 overflow-x-auto">
                            <div className="text-[10px] text-zinc-500 pb-1 font-sans font-medium">📤 返回</div>
                            <pre className="text-[10px] text-zinc-700 dark:text-zinc-300 whitespace-pre overflow-x-auto">{JSON.stringify(step.output_payload, null, 2)}</pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: CoT / Thought Trace */}
        {activeTab === 'cot' && (
          <div className="space-y-3">
            {llmReasoning && (
              <div className="border border-blue-200/60 dark:border-blue-900/40 rounded-lg overflow-hidden bg-blue-50/20 dark:bg-blue-950/20">
                <div onClick={() => setShowReasoning(!showReasoning)}
                  className="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-blue-100/30 dark:hover:bg-blue-900/20 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-medium text-blue-800 dark:text-blue-200">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" strokeWidth={1.5} />
                    <span>DeepSeek 推演思维链</span>
                    <span className="text-[10px] font-mono px-1.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">真实在线</span>
                  </div>
                  {showReasoning ? <ChevronDown className="w-3.5 h-3.5 text-blue-500" /> : <ChevronRight className="w-3.5 h-3.5 text-blue-500" />}
                </div>
                {showReasoning && (
                  <div className="px-3 py-2 text-xs font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto bg-white/50 dark:bg-zinc-950/50 border-t border-blue-200/30 dark:border-blue-900/30">{llmReasoning}</div>
                )}
              </div>
            )}
            <div className="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 dark:border-white/10 p-2.5 sm:p-3 flex flex-col max-h-[280px] overflow-hidden shadow-inner">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-800 dark:border-white/5 text-[10px] text-zinc-400 font-mono">
                <span className="flex items-center gap-1.5 text-zinc-300"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />THOUGHT_TRACE</span>
                <span className="text-zinc-500">ReAct Engine</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs pr-1">
                {thoughts.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-500 text-xs italic py-6">等待 Agent 推理链路...</div>
                ) : (
                  thoughts.map((item: any, i: number) => (
                    <div key={i} className="flex flex-col gap-0.5 animate-fadeIn">
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                        <span>[{item.timestamp}]</span>
                        <span className="px-1 py-0.5 rounded bg-zinc-800 text-blue-300 text-[9px]">{item.node}</span>
                      </div>
                      <p className="text-zinc-200 text-[11px] pl-2 border-l border-zinc-700 leading-relaxed">{item.thought}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SOP & Spare Parts */}
        {activeTab === 'sop' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">维保规程 (SOP)</span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex-shrink-0">RAG 检索</span>
              </div>
              <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                {sopSteps.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-4 text-center italic">触发 Agent 后自动匹配规程</p>
                ) : sopSteps.map((step: string, i: number) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-700 dark:text-zinc-300">
                    <ChevronRight className="w-3 h-3 text-blue-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <p className="leading-snug line-clamp-2" title={step}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 p-3">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block mb-2">ERP 备件供应链</span>
              <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                {parts.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-4 text-center italic">触发 Agent 后自动穿透 ERP</p>
                ) : parts.slice(0, 4).map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-[11px] p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
                    <div className="min-w-0 mr-2">
                      <span className="text-zinc-900 dark:text-zinc-200 font-medium block truncate">{p.name}</span>
                      <span className="text-zinc-500 text-[10px] truncate block">{p.supplier}</span>
                    </div>
                    <div className="text-right flex-shrink-0 font-mono">
                      <span className="text-emerald-600 dark:text-emerald-400 block font-semibold">库存:{p.stock_qty}套</span>
                      <span className="text-zinc-500 text-[10px]">￥{p.unit_price_cny}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
