import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Activity, Gauge } from 'lucide-react';

interface TelemetryChartProps {
  historyP201: any[];
  historyV102: any[];
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({ historyP201, historyV102 }) => {
  const times = historyP201.map(d => {
    const date = new Date(d.timestamp * 1000);
    return `${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  });

  // 离心泵 P-201 压差与振动双轴时序配置
  const p201Option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#18181B',
      borderColor: '#3F3F46',
      textStyle: { color: '#F4F4F5', fontFamily: 'monospace', fontSize: 12 },
    },
    legend: {
      data: ['入口压力(kPa)', '振动有效值(mm/s)'],
      textStyle: { color: '#A1A1AA', fontSize: 11 },
      top: 0,
      right: 10
    },
    grid: { left: '3%', right: '3%', bottom: '3%', top: '18%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: times,
      axisLine: { lineStyle: { color: '#27272A' } },
      axisLabel: { color: '#71717A', fontFamily: 'monospace', fontSize: 10 }
    },
    yAxis: [
      {
        type: 'value',
        name: '压力 (kPa)',
        nameTextStyle: { color: '#71717A', fontSize: 10 },
        splitLine: { lineStyle: { color: '#18181B', type: 'dashed' } },
        axisLabel: { color: '#71717A', fontFamily: 'monospace', fontSize: 10 }
      },
      {
        type: 'value',
        name: '振动 (mm/s)',
        nameTextStyle: { color: '#71717A', fontSize: 10 },
        splitLine: { show: false },
        axisLabel: { color: '#71717A', fontFamily: 'monospace', fontSize: 10 }
      }
    ],
    series: [
      {
        name: '入口压力(kPa)',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: historyP201.map(d => d.inlet_pressure_kpa),
        itemStyle: { color: '#3B82F6' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(59, 130, 246, 0.25)' }, { offset: 1, color: 'rgba(59, 130, 246, 0.0)' }]
          }
        }
      },
      {
        name: '振动有效值(mm/s)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        showSymbol: false,
        data: historyP201.map(d => d.vibration_rms_mms),
        itemStyle: { color: '#EF4444' },
        lineStyle: { width: 2 }
      }
    ]
  };

  // 控制阀 V-102 SP 开度指令 vs PV 实际反馈阶跃曲线
  const v102Option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#18181B',
      borderColor: '#3F3F46',
      textStyle: { color: '#F4F4F5', fontFamily: 'monospace', fontSize: 12 },
    },
    legend: {
      data: ['开度设定 SP (%)', '开度反馈 PV (%)'],
      textStyle: { color: '#A1A1AA', fontSize: 11 },
      top: 0,
      right: 10
    },
    grid: { left: '3%', right: '3%', bottom: '3%', top: '18%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: times,
      axisLine: { lineStyle: { color: '#27272A' } },
      axisLabel: { color: '#71717A', fontFamily: 'monospace', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      name: '行程开度 (%)',
      nameTextStyle: { color: '#71717A', fontSize: 10 },
      splitLine: { lineStyle: { color: '#18181B', type: 'dashed' } },
      axisLabel: { color: '#71717A', fontFamily: 'monospace', fontSize: 10 }
    },
    series: [
      {
        name: '开度设定 SP (%)',
        type: 'line',
        step: 'middle',
        showSymbol: false,
        data: historyV102.map(d => d.sp_percent),
        itemStyle: { color: '#10B981' },
        lineStyle: { width: 1.5, type: 'dashed' }
      },
      {
        name: '开度反馈 PV (%)',
        type: 'line',
        smooth: false,
        showSymbol: false,
        data: historyV102.map(d => d.pv_percent),
        itemStyle: { color: '#F59E0B' },
        lineStyle: { width: 2 }
      }
    ]
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
      {/* 离心泵压力/振动趋势图 */}
      <div className="rounded-xl bg-zinc-900/60 border border-white/10 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
            <h4 className="text-xs font-semibold text-zinc-100 whitespace-nowrap">
              宣达离心泵 (P-201) · 入口压降与高频振动关联时序
            </h4>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap flex-shrink-0">
            采样: 1.0s / 窗口: 60s
          </span>
        </div>
        <div className="h-[200px] w-full">
          <ReactECharts option={p201Option} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>

      {/* 控制阀跟踪响应曲线 */}
      <div className="rounded-xl bg-zinc-900/60 border border-white/10 p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
            <h4 className="text-xs font-semibold text-zinc-100 whitespace-nowrap">
              伯特利控制阀 (V-102) · 阀位指令(SP)与反馈(PV)迟滞响应
            </h4>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap flex-shrink-0">
            GB/T 4213 校验
          </span>
        </div>
        <div className="h-[200px] w-full">
          <ReactECharts option={v102Option} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>
    </div>
  );
};
