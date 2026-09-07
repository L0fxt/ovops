import React, { useState } from 'react';
import { Send, CheckCircle2, ShieldCheck, Smartphone } from 'lucide-react';

interface ChannelSimulatorProps {
  notifications: any[];
  onApprove: (orderNo: string) => void;
  workOrder: any;
  approvalStatus: string;
}

export const ChannelSimulator: React.FC<ChannelSimulatorProps> = ({
  onApprove,
  workOrder,
  approvalStatus
}) => {
  const isApproved = approvalStatus === "APPROVED";
  const orderNo = workOrder?.order_no || "WO-0905-A1";
  
  const [activeChannel, setActiveChannel] = useState<'feishu' | 'dingtalk'>('feishu');

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 p-3 lg:p-5 shadow-sm flex flex-col gap-3 transition-colors w-full">
      {/* 头部标题与 Toggle */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-white/10 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
            多端主动协同模拟舱
          </h3>
        </div>
        
        <div className="flex items-center p-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex-shrink-0">
          <button
            onClick={() => setActiveChannel('feishu')}
            className={`px-3 py-1 text-xs font-medium rounded-sm transition-all whitespace-nowrap ${
              activeChannel === 'feishu'
                ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            飞书
          </button>
          <button
            onClick={() => setActiveChannel('dingtalk')}
            className={`px-3 py-1 text-xs font-medium rounded-sm transition-all whitespace-nowrap ${
              activeChannel === 'dingtalk'
                ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            钉钉
          </button>
        </div>
      </div>

      {/* 单一卡片展示 */}
      <div className="w-full">
        {activeChannel === 'feishu' ? (
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 p-3 lg:p-4 flex flex-col justify-between shadow-sm transition-colors">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200 dark:border-white/5">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  飞书 · 专属机器人
                </span>
                <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap flex-shrink-0">
                  Interactive Card
                </span>
              </div>
              <div className="text-xs text-zinc-700 dark:text-zinc-300 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate">
                    ⚡ 预测性运维告警
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-500/30 whitespace-nowrap flex-shrink-0">
                    CRITICAL
                  </span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px] line-clamp-2">
                  机理模型已自动比对《特种耐酸离心泵原厂运维规程 (Q/YJ-PUMP-02)》，已生成应急降频与内窥探伤任务清单。
                </p>
                <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 font-mono text-[11px] flex flex-wrap gap-x-4 gap-y-1">
                  <div>单据: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{orderNo}</span></div>
                  <div>余量: 0.0m &lt; 3.2m</div>
                  <div className="w-full truncate">调拨: 24小时内送达现场</div>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-white/5">
              {isApproved ? (
                <div className="w-full py-1.5 px-3 rounded bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap">
                  <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                  飞书端已完成数据闭环回填
                </div>
              ) : (
                <button
                  onClick={() => onApprove(orderNo)}
                  className="w-full py-1.5 px-3 rounded bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                  飞书端核准调拨并启动工单
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 p-3 lg:p-4 flex flex-col justify-between shadow-sm transition-colors">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200 dark:border-white/5">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  钉钉 · 智能运维通知
                </span>
                <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap flex-shrink-0">
                  ActionCard
                </span>
              </div>
              <div className="text-xs text-zinc-700 dark:text-zinc-300 space-y-1.5">
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate">
                  🚨【瓯阀智枢】离心泵气蚀告警
                </h4>
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px] line-clamp-2">
                  监测到特种耐酸离心泵入口压头骤降，高频微爆振动超标，自动拆解维保排障计划并匹配备件库。
                </p>
                <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 font-mono text-[11px] flex flex-wrap gap-x-4 gap-y-1">
                  <div>编号: <span className="text-blue-600 dark:text-blue-400 font-bold">{orderNo}</span></div>
                  <div>指派: 陈工</div>
                  <div className="w-full truncate">备件: 超耐酸高硅叶轮</div>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-white/5">
              {isApproved ? (
                <div className="w-full py-1.5 px-3 rounded bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap">
                  <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                  钉钉端已核准闭环 · 备件已出库
                </div>
              ) : (
                <button
                  onClick={() => onApprove(orderNo)}
                  className="w-full py-1.5 px-3 rounded bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                  钉钉端一键确认派工并预扣备件
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
        <Smartphone className="w-3.5 h-3.5" strokeWidth={1.5} />
        <span>同步推送至 钉钉 · 飞书 · 企业微信</span>
      </div>
    </div>
  );
};
