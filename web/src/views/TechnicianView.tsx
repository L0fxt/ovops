import React, { useState } from 'react';
import { QrCode, ShieldCheck, CheckSquare, Camera, Send, CheckCircle2, AlertTriangle, FileText, User } from 'lucide-react';

interface TechnicianViewProps {
  workOrders: any[];
  onReload: () => void;
}

export const TechnicianView: React.FC<TechnicianViewProps> = ({ workOrders, onReload }) => {
  const activeOrder = workOrders.find(o => o.status !== 'CLOSED') || workOrders[0];
  const [selectedOrderNo, setSelectedOrderNo] = useState<string>(activeOrder?.order_no || '');
  const currentOrder = workOrders.find(o => o.order_no === selectedOrderNo) || activeOrder;

  // 技师实操交互状态
  const [scanned, setScanned] = useState<boolean>(false);
  const [lotoElectric, setLotoElectric] = useState<boolean>(false);
  const [lotoBlind, setLotoBlind] = useState<boolean>(false);
  const [lotoGas, setLotoGas] = useState<boolean>(false);
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);
  const [techNote, setTechNote] = useState<string>("现场已完成叶轮拆检与动静环机封更换，复查对中偏差在 0.04mm 内，盘车平顺无卡阻。");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [closedSuccess, setClosedSuccess] = useState<boolean>(false);

  const steps = currentOrder?.decomposed_steps || [
    "【Step 1】通知中控提升吸入静压并调整运行频次",
    "【Step 2】拆卸吸入侧法兰，使用工业内窥镜探伤",
    "【Step 3】更换原厂超耐酸高硅叶轮及碳化硅机封成套组件",
    "【Step 4】盘车试运转并回填检修参数"
  ];

  const toggleStep = (idx: number) => {
    setCheckedSteps(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const isLotoReady = lotoElectric && lotoBlind && lotoGas;
  const isAllStepsDone = checkedSteps.length === steps.length;
  const isAlreadyClosed = currentOrder?.status === 'CLOSED';

  const handleSubmitClosure = async () => {
    if (!currentOrder) return;
    setSubmitting(true);
    try {
      await fetch('/api/technician/submit-closure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_no: currentOrder.order_no,
          tech_name: "陈工(资深运维技师)",
          loto_confirmed: isLotoReady,
          completed_steps: steps,
          tech_notes: techNote,
          photo_evidence: "evidence_pump_impeller_inspection.jpg"
        })
      });
      setClosedSuccess(true);
      onReload();
    } catch (e) {
      console.error("提交闭环失败:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-fadeIn pb-8">
      
      {/* 技师身份与手持防爆终端标识栏 */}
      <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">陈工 (资深维保工程师)</span>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                防爆掌机在线
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-mono">责任工段: 精细化工区 / 反应系统</p>
          </div>
        </div>

        {/* 当前工单选择器 */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500 whitespace-nowrap">当前任务:</span>
          <select
            value={currentOrder?.order_no || ''}
            onChange={(e) => {
              setSelectedOrderNo(e.target.value);
              setScanned(false);
              setClosedSuccess(false);
            }}
            className="px-2.5 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-white/10 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
          >
            {workOrders.map((o) => (
              <option key={o.order_no} value={o.order_no}>
                {o.order_no} ({o.equipment_id} - {o.status === 'CLOSED' ? '已闭环' : '处理中'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentOrder && (
        <>
          {/* 工单基本概况卡片 */}
          <div className="rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/10 p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                {currentOrder.order_no}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium font-mono ${
                currentOrder.status === 'CLOSED' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              }`}>
                {currentOrder.status === 'CLOSED' ? '已闭环沉淀' : '现场作业中'}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {currentOrder.fault_type}
            </h4>
            <div className="text-xs text-zinc-500 flex items-center justify-between font-mono pt-1 border-t border-zinc-100 dark:border-white/5">
              <span>设备位号: {currentOrder.equipment_id}</span>
              <span>严重等级: {currentOrder.severity}</span>
            </div>
          </div>

          {/* 步骤 1: 现场设备扫码核验 */}
          <div className="rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/10 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  步骤 1: 设备位号防爆扫码核验
                </h4>
              </div>
              {scanned ? (
                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 已核验
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 text-xs">待扫码</span>
              )}
            </div>

            {scanned ? (
              <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 font-mono flex items-center justify-between">
                <span>二维码匹配成功: {currentOrder.equipment_id} (精细化工工段)</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">GPS锁定</span>
              </div>
            ) : (
              <button
                onClick={() => setScanned(true)}
                className="w-full py-2 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold border border-zinc-300 dark:border-white/10 flex items-center justify-center gap-2 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                点击模拟扫描设备铭牌二维码
              </button>
            )}
          </div>

          {/* 步骤 2: LOTO 安全作业票确认 */}
          <div className="rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/10 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" strokeWidth={1.5} />
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  步骤 2: 工业 LOTO 安全防护与作业票确认
                </h4>
              </div>
              <span className={`text-xs font-mono font-medium ${isLotoReady ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'}`}>
                {isLotoReady ? '安全措施就绪' : '严禁违规开工'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={lotoElectric}
                  onChange={(e) => setLotoElectric(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>电气动力一次回路已拉闸、断电上锁并挂警告牌 (LOTO Lock)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={lotoBlind}
                  onChange={(e) => setLotoBlind(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>进出口法兰已泄压并加装高压耐酸隔离盲板</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={lotoGas}
                  onChange={(e) => setLotoGas(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>便携式有毒气体分析合格，动火作业票已中控签发</span>
              </label>
            </div>
          </div>

          {/* 步骤 3: 规程 SOP 交互式逐步打钩 */}
          <div className="rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/10 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  步骤 3: 智能体自主拆解 SOP 步骤执行打钩
                </h4>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                {checkedSteps.length} / {steps.length}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {steps.map((step: string, idx: number) => {
                const isChecked = checkedSteps.includes(idx);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                      isChecked
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/30 text-zinc-800 dark:text-zinc-200'
                        : 'bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      className="mt-0.5 rounded text-emerald-600 focus:ring-0"
                    />
                    <span className={`leading-relaxed text-xs ${isChecked ? 'line-through opacity-70' : ''}`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 步骤 4: 检修实操记录与证据上传 */}
          <div className="rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/10 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
              <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                步骤 4: 检修留痕与经验闭环反哺
              </h4>
            </div>

            <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400 font-mono">
                📸 实物证据: 气蚀叶轮实拍对比图.jpg
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                已自动压缩上传
              </span>
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 text-xs mb-1 font-medium">
                现场排障笔记与经验沉淀 (自动更新设备专家档案):
              </label>
              <textarea
                value={techNote}
                onChange={(e) => setTechNote(e.target.value)}
                rows={3}
                className="w-full p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 提交闭环按钮 */}
            {isAlreadyClosed || closedSuccess ? (
              <div className="w-full py-2.5 px-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                工单已完成现场验收，数据闭环沉淀入库！
              </div>
            ) : (
              <button
                disabled={submitting || !scanned || !isLotoReady || !isAllStepsDone}
                onClick={handleSubmitClosure}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {submitting ? '正在提交沉淀...' : '完成检修并提交全流程闭环'}
              </button>
            )}

            {!isAllStepsDone && !isAlreadyClosed && (
              <p className="text-[11px] text-zinc-400 text-center">
                * 请先完成扫码核验、勾选全部安全措施及 SOP 执行步骤方可提交闭环
              </p>
            )}
          </div>
        </>
      )}

    </div>
  );
};
