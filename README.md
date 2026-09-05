# 瓯阀智枢 (OuValve-Ops)

### 跨系统数据穿透与智能运维 Agent
**OuValve-Ops: Cross-System Data Penetration & Intelligent O&M Agent**

> **立足浙江温州永嘉“中国泵阀之乡”，聚焦流程工业核心流体控制装备（离心泵、控制阀），依托 LangGraph 状态机、自研轻量 Tool-Calling 工具链与工业机理算法，穿透 ERP 数据孤岛，构建主动预警、机理研判、任务拆解与移动协同的闭环智能运维中枢。**

---

## 📌 核心痛点与解决定位

| 传统痛点 | 瓯阀智枢 (OuValve-Ops) 解决方案 |
| :--- | :--- |
| **ERP 与工况时序割裂**：业务系统管账、控制系统管动，数据沉睡不互通。 | **跨系统智能穿透**：Agent 自动穿透打通 ERP 设备台账、BOM 与现场传感器时序数据。 |
| **被动维修代价高昂**：坏了才修，离心泵气蚀与控制阀卡阻导致非计划停机。 | **工业机理在线核算**：嵌入水力气蚀余量计算 ($NPSHa$)、FFT 振动频谱特征提取与阀门回差拟合。 |
| **专家经验难以传承**：排查高度依赖老技师，非结构化经验散落各处。 | **专家 SOP 规程 RAG**：沉淀宣达、伯特利等永嘉龙头权威排障手册，毫秒级语义匹配。 |
| **告警静默且协作断层**：报警无法找对人，维保工单流转与备件调拨割裂。 | **多端主动触达与闭环**：钉钉 ActionCard 与飞书 Interactive Card 秒级推送，一键核准自动扣减 ERP 备件。 |

---

## 🏗️ 系统技术架构

* **工作流状态机**：`LangGraph`（编排 `AnomalyDetect -> PhysicsDiagnose -> KnowledgeRAG -> ERPPenetration -> TaskDecompose -> ChannelNotify`）
* **智能体工具内核**：自研轻量 `@tool` 注册与 Pydantic 驱动的标准 Tool-Calling 架构
* **工业机理与算法**：`NumPy` + `SciPy`（$NPSHa$ 水力核算、`scipy.fft` 高频气蚀冲击分析、阀门回差死区分析）
* **异构数据底座**：`SQLite`（ERP 设备台账、备品备件库、工单库）+ 工业时序发生器
* **协同触达通道**：钉钉群机器人（ActionCard 交互卡片）+ 飞书 Webhook（Interactive Card 交互卡片）
* **后端 API 与推流**：`FastAPI` + `WebSocket`（全双工 1Hz 时序广播与 Agent 思考链流式输出）
* **前端工业数字孪生大屏**：`React 18` + `Vite` + `TailwindCSS` + `Lucide-React` + `Apache ECharts`（严格遵循 `anti-ai-slop-ui-expert` 工业级高质感与防文本挤压规范）

---

## 🚀 极速启动与运行 (Quick Start)

### 1. 启动后端与一体化服务
```bash
# 赋予执行权限并一键启动（自动加载虚拟环境与依赖）
./start.sh
```
启动成功后：
* 🌐 **工业数字孪生大屏**：[http://localhost:8000](http://localhost:8000)
* 📚 **API 交互文档 (Swagger)**：[http://localhost:8000/docs](http://localhost:8000/docs)

### 2. 前端独立开发模式（可选）
```bash
cd web
npm install
npm run dev
# 访问 http://localhost:5173，自动反向代理后端 API 与 WebSocket
```

### 3. 运行全量自动化测试
```bash
source .venv/bin/activate
pytest -v
```

---

## 🖥️ 演示操作指南 (Demo Walkthrough)

1. 打开看板 [http://localhost:8000](http://localhost:8000)；
2. 在顶部导航栏点击 **“宣达离心泵气蚀 (P-201)”** 或 **“伯特利调节阀卡阻 (V-102)”** 注入工业典型故障；
3. 观察数字孪生拓扑图与 ECharts 实时曲线（压降与振动突增）；
4. 观察 **LangGraph 状态机** 自主推进：
   * 自动完成物理机理公式计算（$NPSHa$ 严重低于必需汽蚀余量）；
   * 自动检索永嘉原厂维保规程 SOP；
   * 穿透 ERP 调取台账并锁定永嘉宣达备件中心库存；
   * 自主拆解生成维保工单并推送到钉钉/飞书卡片；
5. 在界面下方的 **“多端协同模拟舱”** 中点击 **“一键核准并预扣备件”**，观察 ERP 工单状态实时变更为 `APPROVED`，备件库存自动核销，实现人机协同闭环！

---

## 📁 核心目录结构规范

```text
ovops/
├── config/                        # 全局配置 (环境变量、大模型、Webhook)
├── data/
│   ├── erp/                       # 模拟 ERP 业务数据 (SQLite: 设备台账、备件库、工单库)
│   └── knowledge/                 # 永嘉泵阀专家排障 SOP 手册
├── ovops/
│   ├── agent/                     # LangGraph 状态机与自研 @tool 注册表
│   ├── tools/                     # 机理计算 (physics_tools)、ERP穿透 (erp_tools)、规程检索 (rag_tools)
│   ├── channels/                  # 钉钉 / 飞书 协同交互卡片生成器
│   ├── simulator/                 # 离心泵气蚀 / 控制阀卡阻工业传感器时序仿真器
│   ├── api/                       # FastAPI 路由与 WebSocket 全双工推流
│   └── main.py                    # 统一服务启动入口
├── tests/                         # 自动化单元测试 (机理算法、ERP穿透、状态机流转)
├── web/                           # React 18 工业级高质感数字孪生大屏
└── start.sh                       # 一键启动脚本
```
