import React from 'react';
import { StepperProgress } from '../components/StepperProgress';
import { DigitalTwinFlow } from '../components/DigitalTwinFlow';
import { TelemetryChart } from '../components/TelemetryChart';
import { AutonomousPlannerConsole } from '../components/AutonomousPlannerConsole';
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
  onApprove?: (orderNo: string) => void;
  onExecuteGoal: (goal: string, eqId?: string) => void;
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
  onExecuteGoal,
  workOrders,
  spareParts,
  equipments
}) => {
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 阶段 1: 业务全流程闭环导航指示器 */}
      <StepperProgress
        investigation={investigation}
        isInvestigating={isInvestigating}
        faultMode={faultMode}
      />

      {/* 阶段 2: 智能体自主规划与求解中枢 (首屏主角，具有品牌光晕与聚焦输入) */}
      <AutonomousPlannerConsole
        investigation={investigation}
        isPlanning={isInvestigating}
        onExecuteGoal={onExecuteGoal}
      />

      {/* 阶段 3: 永嘉流体装备工艺拓扑与数字孪生实时流 */}
      <DigitalTwinFlow p201={p201} v102={v102} faultMode={faultMode} />

      {/* 阶段 4: ECharts 工业级时序动态监测 */}
      <TelemetryChart historyP201={historyP201} historyV102={historyV102} theme={theme} />

      {/* 阶段 5: 企业 ERP 核心数据穿透看板 (工单 / 备件 / 台账) */}
      <ErpTable
        workOrders={workOrders}
        spareParts={spareParts}
        equipments={equipments}
      />
    </div>
  );
};
