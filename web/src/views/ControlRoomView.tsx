import React from 'react';
import { StepperProgress } from '../components/StepperProgress';
import { DigitalTwinFlow } from '../components/DigitalTwinFlow';
import { TelemetryChart } from '../components/TelemetryChart';
import { AutonomousPlannerConsole } from '../components/AutonomousPlannerConsole';
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
  approvalStatus,
  onApprove,
  onExecuteGoal,
  workOrders,
  spareParts,
  equipments
}) => {
  return (
    <div className="space-y-3 sm:space-y-4 animate-fadeIn">
      {/* Row 1: Stepper progress — closed-loop narrative */}
      <StepperProgress
        investigation={investigation}
        isInvestigating={isInvestigating}
        faultMode={faultMode}
      />

      {/* Row 2: Agent Console — HERO, first thing visible, accent border */}
      <AutonomousPlannerConsole
        investigation={investigation}
        isPlanning={isInvestigating}
        onExecuteGoal={onExecuteGoal}
      />

      {/* Row 3: Two-column grid — Digital Twin + Channel Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        <div className="lg:col-span-7">
          <DigitalTwinFlow p201={p201} v102={v102} faultMode={faultMode} />
        </div>
        <div className="lg:col-span-5">
          <ChannelSimulator
            notifications={investigation?.channel_notifications ?? []}
            onApprove={onApprove}
            workOrder={investigation?.work_order}
            approvalStatus={approvalStatus}
          />
        </div>
      </div>

      {/* Row 4: Two-column grid — Telemetry Charts + ERP Data */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        <div className="lg:col-span-7">
          <TelemetryChart historyP201={historyP201} historyV102={historyV102} theme={theme} />
        </div>
        <div className="lg:col-span-5">
          <ErpTable
            workOrders={workOrders}
            spareParts={spareParts}
            equipments={equipments}
          />
        </div>
      </div>
    </div>
  );
};
