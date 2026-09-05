import React, { useState } from 'react';
import { Database, FileText, Layers, CheckCircle, Clock } from 'lucide-react';

interface ErpTableProps {
  workOrders: any[];
  spareParts: any[];
  equipments: any[];
}

export const ErpTable: React.FC<ErpTableProps> = ({ workOrders, spareParts, equipments }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'parts' | 'assets'>('orders');

  return (
    <div className="rounded-xl bg-zinc-900/60 border border-white/10 p-4 lg:p-5 shadow-sm">
      {/* 头部与 Tab 切换 */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-zinc-100 whitespace-nowrap">
            企业 ERP 核心数据穿透看板 (打通业务与现场孤岛)
          </h3>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-md bg-zinc-950 border border-white/10 overflow-x-auto flex-shrink-0">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1 text-xs font-medium rounded transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 ${
              activeTab === 'orders' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
            维保工单库 ({workOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('parts')}
            className={`px-3 py-1 text-xs font-medium rounded transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 ${
              activeTab === 'parts' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" strokeWidth={1.5} />
            本地备件供应链 ({spareParts.length})
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`px-3 py-1 text-xs font-medium rounded transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 ${
              activeTab === 'assets' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" strokeWidth={1.5} />
            设备资产台账 ({equipments.length})
          </button>
        </div>
      </div>

      {/* 表格容器（强制带横向防挤压保护套袋） */}
      <div className="w-full overflow-x-auto mt-4">
        {activeTab === 'orders' && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 font-mono">
                <th className="py-2.5 px-3 min-w-[130px] whitespace-nowrap">工单编号</th>
                <th className="py-2.5 px-3 min-w-[90px] whitespace-nowrap">故障设备</th>
                <th className="py-2.5 px-3 min-w-[180px] whitespace-nowrap">研判机理类型</th>
                <th className="py-2.5 px-3 min-w-[90px] whitespace-nowrap">严重度</th>
                <th className="py-2.5 px-3 min-w-[110px] whitespace-nowrap">工单状态</th>
                <th className="py-2.5 px-3 min-w-[140px] whitespace-nowrap">指派技师</th>
                <th className="py-2.5 px-3 min-w-[140px] whitespace-nowrap">创建时间</th>
                <th className="py-2.5 px-3 min-w-[200px] whitespace-nowrap">闭环反馈</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {workOrders.map((order, idx) => (
                <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold text-blue-400 whitespace-nowrap flex-shrink-0">
                    {order.order_no}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-zinc-200 whitespace-nowrap flex-shrink-0">
                    {order.equipment_id}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-200 whitespace-nowrap">
                    {order.fault_type}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                      order.severity === 'CRITICAL' ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {order.severity}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                      order.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/15 text-blue-400'
                    }`}>
                      {order.status === 'APPROVED' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {order.status === 'APPROVED' ? '已核准出库' : '待钉飞审批'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-300 whitespace-nowrap">
                    {order.assigned_tech}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-zinc-500 whitespace-nowrap">
                    {order.created_at}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400 truncate max-w-[220px]" title={order.resolution_note || "待处理"}>
                    {order.resolution_note || "等待现场技师移动端闭环回填..."}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'parts' && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 font-mono">
                <th className="py-2.5 px-3 min-w-[130px] whitespace-nowrap">备件物料编码</th>
                <th className="py-2.5 px-3 min-w-[160px] whitespace-nowrap">备件品名</th>
                <th className="py-2.5 px-3 min-w-[120px] whitespace-nowrap">规格型号</th>
                <th className="py-2.5 px-3 min-w-[90px] whitespace-nowrap">适配设备</th>
                <th className="py-2.5 px-3 min-w-[100px] whitespace-nowrap">实时库存</th>
                <th className="py-2.5 px-3 min-w-[90px] whitespace-nowrap">参考单价</th>
                <th className="py-2.5 px-3 min-w-[200px] whitespace-nowrap">永嘉本地供应链服务商</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {spareParts.map((part, idx) => (
                <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold text-zinc-300 whitespace-nowrap flex-shrink-0">
                    {part.part_code}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-100 font-medium whitespace-nowrap">
                    {part.name}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-zinc-400 whitespace-nowrap">
                    {part.spec}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-blue-400 whitespace-nowrap">
                    {part.equipment_id}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                    {part.stock_qty} 套
                  </td>
                  <td className="py-2.5 px-3 font-mono text-zinc-400 whitespace-nowrap">
                    ￥{part.unit_price}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-300 truncate" title={part.supplier}>
                    {part.supplier}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'assets' && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 font-mono">
                <th className="py-2.5 px-3 min-w-[90px] whitespace-nowrap">设备位号</th>
                <th className="py-2.5 px-3 min-w-[150px] whitespace-nowrap">装备名称</th>
                <th className="py-2.5 px-3 min-w-[90px] whitespace-nowrap">品类</th>
                <th className="py-2.5 px-3 min-w-[120px] whitespace-nowrap">出厂型号</th>
                <th className="py-2.5 px-3 min-w-[160px] whitespace-nowrap">制造厂商 (永嘉龙头)</th>
                <th className="py-2.5 px-3 min-w-[200px] whitespace-nowrap">安装工段</th>
                <th className="py-2.5 px-3 min-w-[90px] whitespace-nowrap">健康评分</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {equipments.map((eq, idx) => (
                <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold text-blue-400 whitespace-nowrap">
                    {eq.id}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-100 font-medium whitespace-nowrap">
                    {eq.name}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap">
                    {eq.category}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-zinc-400 whitespace-nowrap">
                    {eq.model}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-200 whitespace-nowrap">
                    {eq.manufacturer}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400 truncate" title={eq.installation_area}>
                    {eq.installation_area}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                    {eq.health_score} 分
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
