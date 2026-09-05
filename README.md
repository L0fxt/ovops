# 瓯阀智枢 (OuValve-Ops)

### 跨系统数据穿透与智能运维 Agent (Cross-System Data Penetration & Intelligent O&M Agent)

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.14-blue.svg)](https://www.python.org/)
[![Node](https://img.shields.io/badge/Node.js-%3E%3D%2018.0.0-green.svg)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.2+-61DAFB.svg)](https://react.dev/)
[![DeepSeek](https://img.shields.io/badge/DeepSeek-V4--Pro%20%7C%20Flash-4F46E5.svg)](https://api-docs.deepseek.com/zh-cn/)
[![Tests](https://img.shields.io/badge/Tests-18%2F18%20Passed%20(100%25)-success.svg)](./tests)
[![License](https://img.shields.io/badge/License-Apache%202.0-lightgrey.svg)](./LICENSE)

> **立足浙江温州永嘉“中国泵阀之乡”，面向流程工业核心流体控制装备（特种耐酸离心泵、高压套筒调节阀），依托 LangGraph 状态机、自研轻量 Tool-Calling 工具链与工业机理算法，穿透 ERP 业务数据孤岛，构建具备“自主目标规划、多轮工具调度、机理研判与移动人机闭环”能力的企业级可运行 AI Agent 智能运维中枢。**

📖 **项目路线图与技术规范**：[ROADMAP.md](./ROADMAP.md)  
📚 **企业级集成与部署技术指南**：[docs/INTEGRATION_GUIDE.md](./docs/INTEGRATION_GUIDE.md)  
🎬 **5分钟参赛演示视频脚本与答辩解说词**：[docs/DEMO_SCRIPT.md](./docs/DEMO_SCRIPT.md)

---

## 🌟 大赛三大核心能力对齐

依据大赛针对参赛作品**“必须为可运行的 AI Agent，须具备三大核心能力，不可仅做通用大模型简单套壳”**的硬性要求，本项目实现全面落地：

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        瓯阀智枢 (OuValve-Ops) 智能运维 Agent 核心架构                   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        ▼                                   ▼                                   ▼
【能力 1: 智能体自主规划】             【能力 2: 跨平台工具调用】             【能力 3: 永嘉场景闭环定制】
  - Plan-and-Solve 任务树拆解           - ⚙️ 机理算力: NPSHa / SciPy FFT      - 🗄️ ERP 设备主数据与台账穿透
  - DeepSeek-V4-Pro 深度推理 (CoT)      - 📚 规程知识: 永嘉原厂维保 SOP RAG   - 🗺️ 永嘉 2小时应急备件供应链
  - 动态工序生成与执行状态追踪          - 🌐 移动协同: 钉钉/飞书互动卡片       - 👥 四大角色端分离 (中控/技师/主管/管理员)
  - 离线高保真物理机理双模兜底          - 🗄️ 业务数据: SQLite 资产与备件库     - 🔒 LOTO 安全作业与人机协同出库
```

1. **智能体自主规划 (Autonomous Goal Planner)**：
   * 调度员可直接输入任意自然语言运维目标；
   * 调用 DeepSeek 官方生产大模型进行深度逻辑推演，完整提取并透明呈现大模型**工程思考思维链 (Reasoning Content)**；
   * 动态拆解生成多阶段强依赖任务树（测点捕获 -> 机理核算 -> SOP 规程检索 -> ERP 穿透 -> 自主建单 -> 钉飞卡片分发）。
2. **跨平台工具调用 (Cross-Platform Native Tool Calling)**：
   * 基于自研轻量 `@tool` 装饰器，实现标准 OpenAI Function Calling 协议转换；
   * 由大模型根据工况自主决定调用：
     * `calculate_pump_cavitation`：水动力学有效汽蚀余量 ($NPSHa$) 在线求解；
     * `analyze_vibration_fft`：SciPy 2000~4500Hz 高频振动能量积分诊断；
     * `calculate_valve_hysteresis`：控制阀 PV-SP 阶跃回差死区非线性拟合；
     * `search_maintenance_sop`：永嘉骨干制造厂排障规程 RAG 检索；
     * `query_equipment_ledger` / `query_spare_parts_inventory`：直连 ERP 数据库资产与备件库存；
     * `create_maintenance_work_order`：自主生成正式维保工单实体；
     * `ChannelDispatch_DingTalk_Feishu`：下发结构化 ActionCard / Interactive Card。
3. **业务场景定制与工业闭环**：
   * **四大角色端分离**：中控调度大屏、现场维保技师移动防爆端（LOTO 锁+SOP打钩+实物笔记闭环）、维保主管 Kanban 审批与永嘉备件供应链地图、系统管理员动态配置中枢；
   * **双模高可用兜底**：在线走实时 DeepSeek 大模型；遇到断网或未配 Key 时，**0ms 静默平滑降级**至本地确定性机理引擎，答辩演示 100% 零翻车。

---

## 💻 运行环境与版本要求

| 运行时 / 组件 | 推荐版本 | 最低要求 | 验证状态 |
| :--- | :--- | :--- | :---: |
| **Python** | `3.11.x` / `3.12.x` / `3.14.x` | `>= 3.10.0` | ✅ 已在 Python 3.14.7 严格通过 |
| **Node.js** | `20.x LTS` / `22.x LTS` / `24.x` | `>= 18.0.0` | ✅ 已在 Node v24.16.0 编译通过 |
| **npm** | `10.x` / `11.x` | `>= 9.0.0` | ✅ 已在 npm 11.13.0 验证通过 |
| **操作系统** | macOS (Apple Silicon / Intel), Linux (Ubuntu 20.04+), Windows (WSL2) | POSIX / Windows | ✅ 跨平台适配 |

---

## 📦 依赖下载与安装指南

### 1. 克隆代码仓库
```bash
git clone https://github.com/L0fxt/ovops.git
cd ovops
```

### 2. Python 后端依赖安装

建议使用虚拟环境进行依赖隔离：

```bash
# 创建并激活 Python 虚拟环境
python3 -m venv .venv
source .venv/bin/activate       # macOS / Linux
# .venv\Scripts\activate      # Windows PowerShell

# 升级 pip
pip install --upgrade pip

# 方式 A：以可编辑模式安装项目及核心依赖（推荐）
pip install -e .

# 方式 B：通过 requirements.txt 安装
pip install -r requirements.txt
```

### 3. 前端依赖安装与资源构建

```bash
cd web
npm install
npm run build     # 编译生成生产静态资源包至 web/dist/，由 FastAPI 统一托管
cd ..
```

---

## 🚀 启动与运行指南

### 方式一：一键全栈启动（推荐）

项目根目录提供自动化一键启动脚本，自动检测 Python 虚拟环境、前端构建产物并启动热重载服务：

```bash
# 赋予执行权限并一键启动
chmod +x start.sh
./start.sh
```

### 方式二：手动分步启动

```bash
# 1. 激活虚拟环境
source .venv/bin/activate

# 2. 启动统一后端服务（自动托管 API、WebSocket 及前端页面）
uvicorn ovops.main:app --host 0.0.0.0 --port 8000 --reload
```

### 方式三：前端独立热重载开发模式（供前端深度调试）

若需要对前端代码进行实时热更新开发，可单独启动 Vite 开发服务器：

```bash
cd web
npm run dev
# Vite 开发服务器运行于 http://localhost:5173，自动反代 8000 端口后端
```

---

## 🌐 访问端点导航

启动成功后，浏览器访问以下地址：

| 平台模块 | 访问 URL | 说明 |
| :--- | :--- | :--- |
| **🖥️ 工业智能体综合调度大屏** | [http://localhost:8000](http://localhost:8000) | 包含数字孪生看板、自主目标规划中枢、多角色端切换 |
| **📚 OpenAPI (Swagger UI)** | [http://localhost:8000/docs](http://localhost:8000/docs) | 交互式 RESTful API 调试与接口契约说明 |
| **📖 ReDoc 规范文档** | [http://localhost:8000/redoc](http://localhost:8000/redoc) | 结构化工业接口参数文档 |
| **⚡ WebSocket 遥测流** | `ws://localhost:8000/ws/telemetry` | 1Hz 全双工高频工业遥测数据推流与广播 |

---

## ⚙️ 大模型与系统配置指南

系统支持在 **Web 界面直接配置** 或通过 **环境变量** 进行管理：

### 1. 界面可视化配置（热重载无需重启）
1. 打开系统界面右上角 **⚙️【系统配置】**；
2. **大模型配置 (LLM)**：
   * **API Base URL**：`https://api.deepseek.com`（官方规范根路径，无需 `/v1`）；
   * **API Key**：填写您的 DeepSeek API Key（系统支持自动去除隐式换行/空格，保存后安全脱敏存储于 SQLite）；
   * **推理模型**：支持在输入框**自由填写任意模型名称**，或一键点击官方推荐预设（`deepseek-v4-pro` 旗舰版、`deepseek-v4-flash` 高效轻量版、`deepseek-v4-flash-vision-exp` 实验多模态版）；
   * 点击 **【测试模型连通性】**：系统将直连 DeepSeek 官方生产集群进行端到端校验并回显毫秒延迟；
3. **协作平台配置**：支持配置钉钉机器人 Webhook 及飞书自定义机器人 Webhook；
4. 点击 **【保存配置】**：配置持久化写入 SQLite `system_configs` 表，并即时热重载生效。

### 2. 离线演示与无 Key 兜底
若处于工控内网隔离环境或未填写 API Key，系统将自动激活**【本地高保真机理引擎】**，依靠嵌入的 NumPy/SciPy 水动力学数学模型与永嘉 SOP 知识库完成自主规划与闭环工单生成，保证现场路演体验 100% 稳定流畅。

---

## 🧪 自动化测试验证

系统配备完备的 Pytest 单元测试与端到端回归套件：

```bash
# 激活环境后运行全量测试
source .venv/bin/activate
pytest -v
```

**测试覆盖清单 (18/18 100% Passed)**：
* `tests/test_autonomous_planner.py`：自主规划器双模执行、思维链与工单生成测试
* `tests/test_physics.py`：离心泵气蚀 $NPSHa$、FFT 频域分析与控制阀回差算法测试
* `tests/test_erp_tools.py`：ERP 台账穿透、备件库存预扣与工单生命周期测试
* `tests/test_roles_workflow.py`：技师工单 SOP 核验与主管供应链看板测试
* `tests/test_system_config.py`：系统配置热重载、大模型 Ping 诊断与 Webhook 测试
* `tests/test_agent_graph.py`：LangGraph 闭环状态机流转测试

---

## 📁 项目目录结构规范

```text
ovops/
├── config/                        # 全局配置中心 (Settings 单例、环境变量管理)
├── data/
│   ├── erp/                       # 工业 ERP 核心资产库 (SQLite: 台账、备件、工单持久化)
│   └── knowledge/                 # 永嘉泵阀专家知识库 (权威维保 SOP 手册)
├── docs/                          # 大赛正式交付文档
│   ├── DEMO_SCRIPT.md             # 5分钟视频录制分镜脚本与答辩解说词
│   └── INTEGRATION_GUIDE.md       # 企业级集成与部署技术方案说明书
├── ovops/                         # 智能体核心业务包
│   ├── agent/                     # 规划大脑 (AutonomousGoalPlanner, LangGraph, Tool Registry)
│   ├── api/                       # FastAPI 路由层 (遥测、Agent、系统配置、多角色接口)
│   ├── channels/                  # 多端协同层 (钉钉 ActionCard、飞书 Interactive Card)
│   ├── simulator/                 # 工业时序发生器 (离心泵气蚀、控制阀卡阻工况注入)
│   ├── tools/                     # 跨平台工具层 (物理机理、FFT频谱、ERP穿透、SOP检索)
│   └── main.py                    # 统一应用入口与静态资源托管
├── tests/                         # Pytest 全量自动化回归测试套件
├── web/                           # 前端工业数字孪生与多角色工作台 (React 19 + Vite + TailwindCSS)
│   ├── src/
│   │   ├── components/            # 自主规划控制台、数字孪生拓扑图、时序 ECharts 图表
│   │   └── views/                 # 调度大屏、技师端、主管端、系统设置弹窗
│   └── package.json               # 前端依赖与构建脚本
├── pyproject.toml                 # Python 项目元数据与依赖定义
├── requirements.txt               # pip 依赖锁定清单
├── ROADMAP.md                     # 研发路线图与交付进度全景
├── start.sh                       # 全栈一键启动脚本
└── README.md                      # 项目说明文档
```

---

## 📄 开源与版权说明

本项目严格遵循大赛保密与合规规范，全代码库及测试数据已完成敏感品牌绝对脱敏（泛化为永嘉特种流体装备产业标准实体）。遵循 [Apache 2.0 开源协议](./LICENSE)。
