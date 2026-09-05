import React from 'react';
import { DigitalTwinFlow } from '../components/DigitalTwinFlow';
import { TelemetryChart } from '../components/TelemetryChart';
import { AgentInvestigationPanel } from '../components/AgentInvestigationPanel';
import { ChannelSimulator } from '../components/ChannelSimulator';
import { ErpTable } from '../components/ErpTable';

interface ControlRoomViewProps {
  p201: any;
  v102: any;
  faultMode: string;
  historyP201: any[];
  historyV102: any[];
  theme: 'dark' | 'light';
  investigation: any;
  isInvestigating: boolean;
  approvalStatus: string;
  onApprove: (orderNo: string) => void;
  workOrders: any[];
  spareParts: any[];
  equipments: any[];
}

export const ControlRoomView: React.FC<ControlRoomViewProps> = ({
  p201,
  v102,
  faultMode,
  historyP201,
  historyV102,
  theme,
  investigation,
  isInvestigating,
  approvalStatus,
  onApprove,
  workOrders,
  spareParts,
  equipments
}) => {
  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 第一层：工业流体数字孪生拓扑 */}
      <DigitalTwinFlow p201={p201} v102={v102} faultMode={faultMode} />

      {/* 第二层：ECharts 工业级时序监测 */}
      <TelemetryChart historyP201={historyP201} historyV102={historyV102} theme={theme} />

      {/* 第三层：LangGraph 智能体状态机执行与思维链 */}
      <AgentInvestigationPanel
        investigation={investigation}
        isInvestigating={isInvestigating}
      />

      {/* 第四层：双通道主动协同模拟舱 (钉钉 & 飞书) */}
      <ChannelSimulator
        notifications={investigation?.channel_notifications ?? []}
        onApprove={onApprove}
        workOrder={investigation?.work_order}
        approvalStatus={approvalStatus}
      />

      {/* 第五层：ERP 核心资产与供应链穿透看板 */}
      <ErpTable
        workOrders={workOrders}
        spareParts={spareParts}
        equipments={equipments}
      />
    </div>
  );
};
