import React, { useState, useEffect } from 'react';
import { BarChart3, MapPin, DollarSign, Clock, ShieldCheck, CheckCircle2, ArrowRight, Truck, AlertTriangle, Layers } from 'lucide-react';

interface SupervisorViewProps {
  workOrders: any[];
  onApproveOrder: (orderNo: string) => void;
}

export const SupervisorView: React.FC<SupervisorViewProps> = ({ workOrders, onApproveOrder }) => {
  const [kpis, setKpis] = useState<any>({
    total_assets: 4,
    avg_health_score: 96.8,
    mtbf_hours: 2480,
    mttr_hours: 1.6,
    avoided_downtime_hours: 34,
    estimated_saved_cny: 625000
  });

  const [supplyMap, setSupplyMap] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/supervisor/overview')
      .then(r => r.json())
      .then(data => {
        if (data.kpis) setKpis(data.kpis);
      })
      .catch(err => console.error("加载主管KPI失败:", err));

    fetch('/api/supervisor/supply-chain-map')
      .then(r => r.json())
      .then(data => {
        if (data.hubs) setSupplyMap(data.hubs);
      })
      .catch(err => console.error("加载供应链失败:", err));
  }, [workOrders]);

  // 4 列 Kanban 状态分组
  const pendingOrders = workOrders.filter(o => o.status === 'PENDING_APPROVAL');
  const approvedOrders = workOrders.filter(o => o.status === 'APPROVED');
  const inProgressOrders = workOrders.filter(o => o.status === 'IN_PROGRESS');
  const closedOrders = workOrders.filter(o => o.status === 'CLOSED');

  return (
    <div className="w-full space-y-5 animate-fadeIn">
      
      {/* 顶部 KPI 卡片行 (4 块 Bento Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 挽回停机损失 (最抓眼球的 ROI) */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 whitespace-nowrap">
              <DollarSign className="w-4 h-4" /> 预测性运维累计挽回损失 (ROI)
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold whitespace-nowrap">
              避免停产
            </span>
          </div>
          <div className="my-2">
            <span className="font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ￥{kpis.estimated_saved_cny?.toLocaleString() ?? '625,000'}
            </span>
            <span className="text-xs text-zinc-500 block mt-0.5 font-mono">
              折合避免非计划停机: {kpis.avoided_downtime_hours ?? 34} 小时
            </span>
          </div>
          <div className="text-[11px] text-zinc-500">
            * 依照连续流程工业单次非计划停机损失估算
          </div>
        </div>

        {/* 全厂平均健康度 */}
        <div className="rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/10 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap">全厂装备平均健康度</span>
            <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400">4 台主力机组</span>
          </div>
          <div className="my-2">
            <span className="font-mono text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {kpis.avg_health_score ?? 96.8} <span className="text-sm font-normal text-zinc-500">/ 100</span>
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 block mt-0.5">
              优良受控率: 98.2%
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 truncate">
            时序监测与机理预警 100% 覆盖
          </div>
        </div>

        {/* MTBF 平均无故障间隔 */}
        <div className="rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/10 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap">MTBF (平均无故障时间)</span>
            <Clock className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="my-2">
            <span className="font-mono text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {kpis.mtbf_hours ?? 2480} <span className="text-sm font-normal text-zinc-500">小时</span>
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 block mt-0.5">
              行业基准提升 +28%
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 truncate">
            基于振动与气蚀早期微弱特征抑制
          </div>
        </div>

        {/* MTTR 平均修复时长 */}
        <div className="rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/10 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap">MTTR (平均修复时长)</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="my-2">
            <span className="font-mono text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {kpis.mttr_hours ?? 1.6} <span className="text-sm font-normal text-zinc-500">小时</span>
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 block mt-0.5">
              协同派单提速 65%
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 truncate">
            钉飞即时推送 + 备件调拨预占
          </div>
        </div>

      </div>

      {/* 核心中段：全厂 4 列 Kanban 维保工单流转看板 */}
      <div className="rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/10 p-4 lg:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
              全厂维保工单全生命周期看板 (Kanban Workflow)
            </h3>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            支持主管一键审批 · 联动 ERP 备件出库锁定
          </span>
        </div>

        {/* 4 列 Kanban 网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* 列 1: 待审批 */}
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/5 p-3 flex flex-col min-h-[260px]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200 dark:border-white/5">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                待审批核准 ({pendingOrders.length})
              </span>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto">
              {pendingOrders.map(o => (
                <div key={o.order_no} className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-500/30 shadow-sm space-y-1.5">
                  <div className="flex justify-between items-center font-mono text-xs">
                    <span className="font-bold text-blue-600 dark:text-blue-400">{o.order_no}</span>
                    <span className="px-1.5 py-0.2 rounded bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px]">
                      {o.severity}
                    </span>
                  </div>
                  <h5 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 leading-snug">
                    {o.fault_type}
                  </h5>
                  <p className="text-[11px] text-zinc-500 font-mono">设备: {o.equipment_id} | 技师: {o.assigned_tech}</p>
                  <button
                    onClick={() => onApproveOrder(o.order_no)}
                    className="w-full mt-2 py-1 px-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    主管一键核准工单
                  </button>
                </div>
              ))}
              {pendingOrders.length === 0 && (
                <div className="h-full flex items-center justify-center text-xs text-zinc-400 italic">
                  暂无待审批工单
                </div>
              )}
            </div>
          </div>

          {/* 列 2: 备件已就绪 */}
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/5 p-3 flex flex-col min-h-[260px]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200 dark:border-white/5">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                备件锁定就绪 ({approvedOrders.length})
              </span>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto">
              {approvedOrders.map(o => (
                <div key={o.order_no} className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-sm space-y-1.5">
                  <div className="flex justify-between items-center font-mono text-xs">
                    <span className="font-bold text-blue-600 dark:text-blue-400">{o.order_no}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">已自动锁库</span>
                  </div>
                  <h5 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 leading-snug">
                    {o.fault_type}
                  </h5>
                  <p className="text-[11px] text-zinc-500 font-mono">设备: {o.equipment_id} | 现场技师已领单</p>
                  <div className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-950 p-1.5 rounded">
                    调拨中心: 永嘉本地应急仓备件已出库
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 列 3: 检修执行中 */}
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/5 p-3 flex flex-col min-h-[260px]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200 dark:border-white/5">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                检修执行中 ({inProgressOrders.length})
              </span>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto">
              {inProgressOrders.length === 0 && (
                <div className="h-full flex items-center justify-center text-xs text-zinc-400 italic">
                  现场技师作业实时排程中
                </div>
              )}
            </div>
          </div>

          {/* 列 4: 已闭环沉淀 */}
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/5 p-3 flex flex-col min-h-[260px]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200 dark:border-white/5">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                已闭环沉淀 ({closedOrders.length})
              </span>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto">
              {closedOrders.map(o => (
                <div key={o.order_no} className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-emerald-300 dark:border-emerald-500/30 shadow-sm space-y-1.5">
                  <div className="flex justify-between items-center font-mono text-xs">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">{o.order_no}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">验收闭环</span>
                  </div>
                  <h5 className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 leading-snug">
                    {o.fault_type}
                  </h5>
                  <p className="text-[11px] text-zinc-500 truncate" title={o.resolution_note}>
                    {o.resolution_note || "技师已完成现场更换并沉淀至知识库"}
                  </p>
                </div>
              ))}
              {closedOrders.length === 0 && (
                <div className="h-full flex items-center justify-center text-xs text-zinc-400 italic">
                  暂无闭环归档工单
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 永嘉县 2 小时应急备件供应链物流拓扑 */}
      <div className="rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/10 p-4 lg:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
              永嘉县本地 2 小时流体装备应急备件保障地图 (中国泵阀之乡产业生态)
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
            平均加急配送时效: 32 分钟
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {supplyMap.map((hub) => (
            <div key={hub.id} className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/5 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">{hub.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 whitespace-nowrap flex-shrink-0">
                    {hub.distance_km} km
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1 truncate" title={hub.location}>
                  {hub.location}
                </p>
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] text-zinc-400 block">储备核心物料:</span>
                  <div className="flex flex-wrap gap-1">
                    {hub.inventory_types.map((t: string, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 text-[10px] text-zinc-700 dark:text-zinc-300">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Truck className="w-3.5 h-3.5" /> {hub.eta_minutes} 分钟达
                </span>
                <span className="text-[10px] text-zinc-500">24h 应急响应</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
