import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { DigitalTwinFlow } from './components/DigitalTwinFlow';
import { TelemetryChart } from './components/TelemetryChart';
import { AgentInvestigationPanel } from './components/AgentInvestigationPanel';
import { ChannelSimulator } from './components/ChannelSimulator';
import { ErpTable } from './components/ErpTable';

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('ovops_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const [faultMode, setFaultMode] = useState<string>("NORMAL");
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [isInvestigating, setIsInvestigating] = useState<boolean>(false);
  
  const [p201, setP201] = useState<any>(null);
  const [v102, setV102] = useState<any>(null);
  const [historyP201, setHistoryP201] = useState<any[]>([]);
  const [historyV102, setHistoryV102] = useState<any[]>([]);
  
  const [investigation, setInvestigation] = useState<any>(null);
  const [approvalStatus, setApprovalStatus] = useState<string>("PENDING");
  
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [spareParts, setSpareParts] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  // 0. 主题日夜切换副作用
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('ovops_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // 1. 初始化拉取 ERP 基础数据
  const loadErpData = async () => {
    try {
      const [resOrders, resParts, resEquips, resHistory] = await Promise.all([
        fetch('/api/agent/erp/work-orders').then(r => r.json()),
        fetch('/api/agent/erp/spare-parts').then(r => r.json()),
        fetch('/api/agent/erp/equipments').then(r => r.json()),
        fetch('/api/telemetry/history').then(r => r.json())
      ]);
      setWorkOrders(resOrders);
      setSpareParts(resParts);
      setEquipments(resEquips);
      if (resHistory?.p201) setHistoryP201(resHistory.p201);
      if (resHistory?.v102) setHistoryV102(resHistory.v102);
    } catch (e) {
      console.error("加载 ERP 数据失败:", e);
    }
  };

  useEffect(() => {
    loadErpData();
  }, []);

  // 2. 建立 WebSocket 长连接推流
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/telemetry`;

    const connectWs = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(connectWs, 2000);
      };
      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.p201) {
            setP201(data.p201);
            setHistoryP201(prev => [...prev.slice(-40), data.p201]);
          }
          if (data.v102) {
            setV102(data.v102);
            setHistoryV102(prev => [...prev.slice(-40), data.v102]);
          }
          if (data.fault_mode) {
            setFaultMode(data.fault_mode);
          }
        } catch (err) {
          console.error("解析 WS 帧异常:", err);
        }
      };
    };

    connectWs();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // 3. 切换工况故障模式
  const handleSwitchMode = async (mode: string) => {
    try {
      setFaultMode(mode);
      await fetch('/api/telemetry/fault-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      if (mode === "NORMAL") {
        setApprovalStatus("PENDING");
      }
    } catch (e) {
      console.error("切换工况异常:", e);
    }
  };

  // 4. 触发 LangGraph Agent 全链路研判
  const handleTriggerAgent = async (equipmentId: string) => {
    setIsInvestigating(true);
    setApprovalStatus("PENDING");
    try {
      const res = await fetch('/api/agent/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipment_id: equipmentId })
      });
      const data = await res.json();
      setInvestigation(data);
      // 刷新工单库
      const updatedOrders = await fetch('/api/agent/erp/work-orders').then(r => r.json());
      setWorkOrders(updatedOrders);
    } catch (e) {
      console.error("触发 Agent 异常:", e);
    } finally {
      setIsInvestigating(false);
    }
  };

  // 5. 现场技师移动端审批核准闭环
  const handleApprove = async (orderNo: string) => {
    try {
      await fetch('/api/agent/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_no: orderNo,
          note: "现场运维主管已在协同端一键审批，备件已出库调拨并预约停机检修窗口。"
        })
      });
      setApprovalStatus("APPROVED");
      // 重新拉取工单与备件
      const [updatedOrders, updatedParts] = await Promise.all([
        fetch('/api/agent/erp/work-orders').then(r => r.json()),
        fetch('/api/agent/erp/spare-parts').then(r => r.json())
      ]);
      setWorkOrders(updatedOrders);
      setSpareParts(updatedParts);
    } catch (e) {
      console.error("审批工单失败:", e);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* 顶部导航与控制器 */}
      <Navbar
        faultMode={faultMode}
        onSwitchMode={handleSwitchMode}
        wsConnected={wsConnected}
        isInvestigating={isInvestigating}
        onTriggerAgent={handleTriggerAgent}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* 主体画布：Bento 工业栅格 */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 lg:p-6 space-y-5">
        
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
          onApprove={handleApprove}
          workOrder={investigation?.work_order}
          approvalStatus={approvalStatus}
        />

        {/* 第五层：ERP 核心资产与供应链穿透看板 */}
        <ErpTable
          workOrders={workOrders}
          spareParts={spareParts}
          equipments={equipments}
        />

      </main>

      {/* 底部版权与背书 */}
      <footer className="w-full border-t border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950 py-3 px-6 text-center text-xs text-zinc-500 font-mono transition-colors">
        瓯阀智枢 (OuValve-Ops) · 温州永嘉特色流体装备产业智能体标杆 · 赋能超达/宣达/伯特利企业级智能运维
      </footer>
    </div>
  );
}

export default App;
