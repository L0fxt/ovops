import React from 'react';
import { Send, CheckCircle2, MessageSquare, ExternalLink, ShieldCheck, Clock } from 'lucide-react';

interface ChannelSimulatorProps {
  notifications: any[];
  onApprove: (orderNo: string) => void;
  workOrder: any;
  approvalStatus: string;
}

export const ChannelSimulator: React.FC<ChannelSimulatorProps> = ({
  notifications,
  onApprove,
  workOrder,
  approvalStatus
}) => {
  const isApproved = approvalStatus === "APPROVED";
  const orderNo = workOrder?.order_no || "WO-0905-A1";

  return (
    <div className="rounded-xl bg-zinc-900/60 border border-white/10 p-4 lg:p-5 shadow-sm flex flex-col gap-4">
      {/* 头部标题 */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-zinc-100 whitespace-nowrap">
            多端主动协同模拟舱 (钉钉 / 飞书 互动卡片)
          </h3>
        </div>
        <span className="text-[11px] font-mono text-zinc-400 whitespace-nowrap flex-shrink-0">
          主动推送 · 现场技师移动端审批
        </span>
      </div>

      {/* 双通道卡片展示：钉钉 ActionCard 与 飞书卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* 钉钉 ActionCard 仿真 */}
        <div className="rounded-lg bg-zinc-950 border border-white/10 p-4 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
              <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                钉钉 · 智能运维工作通知
              </span>
              <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap flex-shrink-0">
                ActionCard 协议
              </span>
            </div>

            <div className="text-xs text-zinc-300 space-y-1.5 leading-relaxed">
              <h4 className="font-semibold text-zinc-100 text-sm">
                🚨【瓯阀智枢】离心泵 P-201 气蚀告警工单
              </h4>
              <p className="text-zinc-400 text-[11px]">
                监测到宣达耐酸离心泵入口压头骤降，高频微爆振动超标，自动拆解维保排障计划并匹配备件库。
              </p>
              <div className="p-2 rounded bg-zinc-900 border border-white/5 font-mono text-[11px] space-y-1">
                <div>工单编号: <span className="text-blue-400 font-bold">{orderNo}</span></div>
                <div>指派技师: 陈工 (资深维保工程师)</div>
                <div>本地备件: 超耐酸高硅叶轮 (宣达备件库)</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5">
            {isApproved ? (
              <div className="w-full py-2 px-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                钉钉端已核准闭环 · 备件已出库
              </div>
            ) : (
              <button
                onClick={() => onApprove(orderNo)}
                className="w-full py-2 px-3 rounded bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                钉钉端一键确认派工并预扣备件
              </button>
            )}
          </div>
        </div>

        {/* 飞书 Interactive Card 仿真 */}
        <div className="rounded-lg bg-zinc-950 border border-white/10 p-4 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                飞书 · 瓯阀智枢专属机器人
              </span>
              <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap flex-shrink-0">
                Interactive Card
              </span>
            </div>

            <div className="text-xs text-zinc-300 space-y-1.5 leading-relaxed">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-100 text-sm">
                  ⚡ 流程装备预测性运维告警
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30 whitespace-nowrap flex-shrink-0">
                  CRITICAL
                </span>
              </div>
              <p className="text-zinc-400 text-[11px]">
                机理模型已自动比对《宣达实业 Q/XD-02 维保规程》，已生成应急降频与内窥探伤任务清单。
              </p>
              <div className="p-2 rounded bg-zinc-900 border border-white/5 font-mono text-[11px] space-y-1">
                <div>ERP单据: <span className="text-emerald-400 font-bold">{orderNo}</span></div>
                <div>安全余量: NPSHa(0.0m) &lt; NPSHr(3.2m)</div>
                <div>调拨周期: 24小时内送达现场</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5">
            {isApproved ? (
              <div className="w-full py-2 px-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap">
                <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                飞书端已完成数据闭环回填
              </div>
            ) : (
              <button
                onClick={() => onApprove(orderNo)}
                className="w-full py-2 px-3 rounded bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                飞书端核准调拨并启动工单
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
