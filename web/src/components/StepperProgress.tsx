import React from 'react';
import { AlertCircle, Cpu, FileText, Database, Wrench, Send, CheckCircle2 } from 'lucide-react';

interface StepperProgressProps {
  investigation: any;
  isInvestigating: boolean;
  faultMode: string;
}

const steps = [
  { id: 'detect', label: '异常捕获', icon: AlertCircle },
  { id: 'diagnose', label: 'Agent 自主诊断', icon: Cpu },
  { id: 'rag', label: '规程匹配', icon: FileText },
  { id: 'erp', label: '工单生成', icon: Database },
  { id: 'notify', label: '推送审批', icon: Send },
  { id: 'close', label: '现场闭环', icon: Wrench },
];

export const StepperProgress: React.FC<StepperProgressProps> = ({ investigation, isInvestigating, faultMode }) => {
  const thoughts = investigation?.thought_logs ?? [];
  const hasWorkOrder = !!investigation?.work_order;
  const isNormal = faultMode === 'NORMAL';

  // Determine completed step count based on actual progress
  let completedCount = 0;
  if (thoughts.length > 0) completedCount = Math.min(thoughts.length, 4);
  if (hasWorkOrder) completedCount = 5;
  if (investigation?.approval_status === 'APPROVED') completedCount = 6;

  return (
    <div className="w-full rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm transition-colors">
      <div className="flex items-center gap-1 sm:gap-0 overflow-x-auto scrollbar-none">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isDone = completedCount > index;
          const isCurrent = isInvestigating && completedCount === index;
          const isActive = isDone || isCurrent;

          return (
            <React.Fragment key={step.id}>
              {/* Step node */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all ${
                  isDone
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-blue-500 text-white animate-pulse'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-white/10'
                }`}>
                  {isDone ? (
                    <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={2} />
                  ) : (
                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={1.5} />
                  )}
                </div>
                <span className={`text-[10px] sm:text-[11px] font-medium whitespace-nowrap ${
                  isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500'
                }`}>
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className={`flex-1 min-w-[12px] sm:min-w-[20px] h-px mx-1 sm:mx-2 ${
                  completedCount > index + 1
                    ? 'bg-emerald-400'
                    : completedCount === index + 1 && isInvestigating
                    ? 'bg-blue-400 animate-pulse'
                    : 'bg-zinc-200 dark:bg-zinc-700'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
