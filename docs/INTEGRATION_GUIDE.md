# 瓯阀智枢 (OuValve-Ops) 企业级集成与系统部署技术方案说明书

> **文档性质**：面向大赛专家评委与企业技术总监的正式集成交付白皮书  
> **适用版本**：OuValve-Ops v1.2.0 Enterprise  
> **覆盖场景**：工业 SCADA/DCS 现场协议对接、企业级微前端/大屏嵌入、ERP/EAM 数据穿透与容器化高可用部署

---

## 1. 总体集成拓扑架构 (System Integration Architecture)

“瓯阀智枢”定位为贯穿**工业自动化现场（OT）**、**企业信息化管理系统（IT）**与**智能协同端（CT）**的跨系统智能体中枢。

```
+-----------------------------------------------------------------------------------+
|                           工业物理现场 (OT Layer)                                 |
|   [压力/振动/位移传感器] ---> [边缘网关 / PLC] ---> [SCADA / DCS 控制系统]         |
+------------------------------------------+----------------------------------------+
                                           | (OPC-UA / MQTT / Modbus-TCP 时序数据流)
                                           v
+-----------------------------------------------------------------------------------+
|                        瓯阀智枢智能运维 Agent 中枢 (Agent Layer)                    |
|   +--------------------------+  +------------------------+  +------------------+  |
|   |   实时推流与感知适配器   |  |   自主规划决策中枢     |  | 物理机理求解器   |  |
|   |   (WebSocket / FastStream)| |  (Autonomous Planner)  |  | (NumPy/SciPy FFT)|  |
|   +--------------------------+  +------------------------+  +------------------+  |
|              ^                              ^                        ^            |
|              |                              |                        |            |
|              v                              v                        v            |
|   +----------------------------------------------------------------------------+  |
|   |        跨平台工具调用总线 (Cross-Platform Tool-Calling Bus)                |  |
|   +----------------------------------------------------------------------------+  |
+----------------------+-------------------------------+----------------------------+
                       |                               |
        (SQL / RESTful / OpenAPI)              (Webhook / JSON-RPC / Open Platform)
                       v                               v
+--------------------------------------+   +----------------------------------------+
|       企业业务与台账系统 (IT Layer)  |   |        移动与群组协作端 (CT Layer)      |
|  [ERP 资产台账与 BOM]                |   |  [钉钉自定义机器人 & ActionCard]       |
|  [永嘉本地 2 小时应急备件库]         |   |  [飞书机器人 & Interactive Card]       |
|  [EAM 维保排程与工单库]              |   |  [防爆手持终端 PDA / 移动巡检 App]    |
+--------------------------------------+   +----------------------------------------+
```

---

## 2. API 对接规范 (API Integration Specification)

系统原生开放符合 **OpenAPI 3.0 (Swagger/ReDoc)** 标准的 RESTful 接口与低延迟双向 WebSocket。

### 2.1 核心服务接口

| 接口分类 | 路径 / 协议 | 请求方式 | 说明 |
| :--- | :--- | :--- | :--- |
| **智能体自主规划** | `/api/agent/plan-and-execute` | `POST` | 接收自然语言业务目标，自主拆解任务树并执行跨平台工具调用 |
| **遥测感知流** | `/ws/telemetry` | `WebSocket` | 1Hz 全双工测点时序数据实时推流（含流量、吸入压、振动RMS、回差） |
| **工况模式模拟** | `/api/telemetry/fault-mode` | `POST` | 注入故障工况（如离心泵气蚀 `PUMP_CAVITATION`、阀门卡阻 `VALVE_JAMMING`） |
| **人机协同审批** | `/api/agent/approve` | `POST` | 接收钉钉/飞书或 Web 审批动作，自动锁定工单并出库核销备件 |
| **现场技师任务** | `/api/technician/tasks` | `GET` | 供防爆手持终端获取待办检修工单列表 |
| **技师实操闭环** | `/api/technician/submit-closure`| `POST` | 回填 LOTO 安全三宝确认、SOP 执行打勾、照片留痕并归档入库 |
| **管理决策指标** | `/api/supervisor/overview` | `GET` | 获取设备平均无故障时间（MTBF）、平均修复时间（MTTR）及挽回停机损失 ROI |
| **应急供应链** | `/api/supervisor/supply-chain-map`| `GET`| 获取永嘉县本地 2 小时应急备件中心配送网拓扑 |
| **后台动态配置** | `/api/system/config` | `GET/POST`| 动态查看脱敏配置与在线热重载（大模型地址/密钥、钉飞 Webhook、物理阈值） |

---

## 3. 页面嵌入与微前端方案 (Frontend Embedding Methods)

为了方便嵌入企业中控室现有 SCADA 数字大屏、集中运营看板或集团门户，系统提供以下三种集成模式：

### 模式 A：微前端方案（推荐主流微前端框架）
系统前端基于标准 Vite + React 18 打包，天然兼容 **qiankun**、**micro-app** 或 **Single-SPA**：
```typescript
// 主系统应用注册示例 (qiankun 容器)
import { registerMicroApps, start } from 'qiankun';

registerMicroApps([
  {
    name: 'ouvalve-ops',
    entry: '//192.168.1.100:8000',
    container: '#micro-app-viewport',
    activeRule: '/smart-maintenance',
    props: {
      theme: 'dark',
      operatorId: 'OP-8821'
    }
  }
]);

start();
```

### 模式 B：安全 iframe 页面嵌入与双向事件通讯
适用于传统中控系统、大屏可视化工具（如 DataV、FineReport）无缝集成：
```html
<iframe 
  id="ouvalve-frame"
  src="http://your-domain:8000/?embed=true&role=OPERATOR"
  width="100%" 
  height="100%" 
  frameborder="0"
  allow="fullscreen">
</iframe>

<script>
  // 监听来自智能体的工单触发与审批告警事件
  window.addEventListener('message', function(event) {
    if (event.origin !== 'http://your-domain:8000') return;
    const { type, data } = event.data;
    if (type === 'OV_OPS_ALARM_TRIGGERED') {
      console.log('捕获瓯阀智枢报警:', data.equipment_id, data.fault_type);
    }
  });
</script>
```

### 模式 C：Web Component 独立组件封装
支持通过 `<ouvalve-twin-card>` 标签将流体数字孪生拓扑与实时状态卡片嵌入任意 Web 页面中。

---

## 4. 工业现场物联网通讯协议接入 (Industrial IoT Ingestion)

系统在边缘网关层提供标准驱动插件，支持三种主流工业现场协议转译为时序测点流：

1. **OPC-UA 协议采集**：
   * 采用标准 OPC-UA Client 定阅 PLC 节点命名空间；
   * 映射测点：`ns=2;s=P201.InletPressure` -> `inlet_pressure_kpa`，`ns=2;s=P201.VibrationRMS` -> `vibration_rms_mms`。
2. **MQTT 工业物联网代理**：
   * 支持接入 EMQX / Mosquitto 物联中继；
   * 订阅主题：`/industrial/ouvalve/+/telemetry`，载荷采用紧凑 JSON 格式推入 `ovops.simulator.fault_generator`。
3. **Modbus-TCP 现场总线直连**：
   * 针对老旧控制柜与智能定位器，通过轮询保持寄存器（Holding Registers）读取阀位反馈（PV）与设定值（SP）。

---

## 5. 企业 ERP 与业务系统穿透方案 (ERP Integration)

“瓯阀智枢”通过自研 `@tool` 轻量工具链实现对企业信息化底座的双向穿透：

* **设备资产台账（Ledger）同步**：
  * 支持对接 SAP PM / 金蝶云星空 / 用友 NC 的设备主数据；
  * 定期通过只读数据库视图或 Open API 同步出厂参数、设计汽蚀余量 $NPSHr$ 与安装位号。
* **本地备品备件库存穿透与预扣**：
  * 智能体诊断出故障根因后，直接检索“永嘉特种流体备件分发中心”与工厂本地二级备件库库存；
  * 工单审批通过后，触发自动预扣库存（Reserved Stock）事务，避免物料短缺延误停机窗口。
* **工单双向状态同步与回填留痕**：
  * 现场技师通过移动端完成 LOTO 安全确认并执行完 SOP 步骤后，日志自动沉淀写入 `maintenance_logs` 实操表，实现质量安全可追溯。

---

## 6. 容器化部署与高可用架构 (Deployment Topologies)

### 6.1 单机快速容器化部署 (Docker Compose)
在项目根目录运行预置的一键脚本：
```bash
# 1. 赋予执行权限并一键启动
chmod +x start.sh
./start.sh
```

或使用标准 `docker-compose.yml`：
```yaml
version: '3.8'

services:
  ouvalve-ops:
    image: ouvalve-ops:latest
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
    environment:
      - PYTHONUNBUFFERED=1
      - OPENAI_BASE_URL=https://api.deepseek.com/v1
    restart: always
```

### 6.2 工业高可用部署特性
* **动态热重载**：管理员在 Web 控制台修改大模型地址、API 密钥、群机器人 Webhook 时，后端即时热生效，**无需重启容器或服务进程**；
* **离线降级韧性**：当工厂外部网络断开或上游大模型服务不可用时，系统自动无缝降级为**高保真工业机理推理引擎**，确保工业控制与维保任务永不停摆。
