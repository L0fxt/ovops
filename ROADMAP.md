# 瓯阀智枢 (OuValve-Ops) 生产级演进路线图
**OuValve-Ops: Production-Grade Enterprise Integration Roadmap**

> **项目定位**：立足温州永嘉"中国泵阀之乡"，打造 **"工况实时感知 → 物理机理诊断 → 智能体自主规划 → ERP 业务穿透 → 移动端协同闭环"** 全链路工业智能运维 Agent。
>
> **本路线图核心目标**：将当前大赛演示原型系统，逐步演进为可对接企业真实生产环境的**生产级产品**，完成从 Mock 数据驱动到企业真实 API 驱动的全面切换。

---

## 📊 一、当前系统完成度总览

### 已交付能力矩阵

| 能力维度 | 完成度 | 当前实现方式 | 生产级目标 |
| :--- | :---: | :--- | :--- |
| 智能体自主规划 (Autonomous Planner) | ✅ 100% | DeepSeek 真实大模型 CoT + 离线机理兜底 | 稳定生产可用 |
| 原生 Function Calling 多轮工具调度 | ✅ 100% | 7 大工具 Schema 注册 + 动态调度 | 稳定生产可用 |
| 物理机理求解引擎 | ✅ 100% | NumPy/SciPy (NPSHa、FFT、回差拟合) | 算法成熟，可直接对接真实数据 |
| ERP 数据库穿透 | ⚠️ 70% | 内置 SQLite 模拟种子数据 | **需对接企业真实 ERP 数据库/API** |
| 设备遥测时序数据 | ⚠️ 30% | 纯数学仿真器 (`fault_generator.py`) | **需对接企业设备数据查询接口** |
| RAG 专家知识库 | ⚠️ 40% | 2 条硬编码知识条目 | **需向量化真实 SOP 文档** |
| 钉钉/飞书协同通道 | ✅ 90% | 真实 Webhook + multi_url 跳转审批 | 生产可用，需企业自建应用升级 |
| 四大角色端前端 | ✅ 95% | 完整 RBAC + 全端 UI | 需动态设备列表替换硬编码 |
| 供应链地图 | ⚠️ 50% | 4 个硬编码永嘉备件仓库节点 | 需对接企业真实供应商库存 |
| 主管决策 KPI | ⚠️ 60% | 部分硬编码 MTBF/MTTR | 需真实统计计算 |

---

## 🔍 二、假数据 / Mock 模块全量审计清单

> [!CAUTION]
> 以下模块使用了硬编码/模拟数据，**在对接企业真实环境前必须逐一替换**。

### 2.1 设备遥测数据层 — 全量模拟 🔴

| 文件 | 行号 | Mock 内容 | 生产级替换方案 |
| :--- | :---: | :--- | :--- |
| [fault_generator.py](file:///Users/paistarss/product/bengfa/ovops/simulator/fault_generator.py) | 全文件 | P-201 和 V-102 的所有传感器数据均为数学公式 + 高斯噪声随机生成 | 对接企业设备数据查询 API |
| [routes_telemetry.py](file:///Users/paistarss/product/bengfa/ovops/api/routes_telemetry.py) | L10-28 | `/api/telemetry/latest` 和 `/history` 直接从仿真器取数 | 改为从企业 API 拉取 + 本地缓存 |

**具体模拟项**：
- 离心泵入口压力 `inlet_pressure_kpa`：`125.0 + 3.0*sin(t/8)` + 高斯噪声
- 离心泵振动 `vibration_rms_mms`：`1.6 + noise(0.1)` / 故障时 `7.4`
- 离心泵流量 `flow_rate_m3h`：`120.0 + noise(1.5)`
- 离心泵轴承温度 `bearing_temp_c`：`53.0 + noise(0.3)`
- 控制阀设定值/实际值 `sp_percent/pv_percent`：周期三角波 + 噪声
- 控制阀回差 `deadband_pct`：`0.5 + noise(0.05)` / 故障时 `5.8`
- 高频振动波形 `generate_vibration_waveform()`：`sin(2π*48.3*t)` 合成

### 2.2 ERP 种子数据层 — 硬编码 🟡

| 文件 | 行号 | Mock 内容 | 说明 |
| :--- | :---: | :--- | :--- |
| [init_db.py](file:///Users/paistarss/product/bengfa/data/erp/init_db.py) | L93-167 | 4 台设备（P-201, V-102, P-202, V-103）固化种子 | 设备台账应从企业 ERP 同步 |
| [init_db.py](file:///Users/paistarss/product/bengfa/data/erp/init_db.py) | L171-178 | 6 条备品备件库存记录 | 备件库存应从企业供应链系统同步 |
| [init_db.py](file:///Users/paistarss/product/bengfa/data/erp/init_db.py) | L183-193 | 系统配置默认值 | 可保留，首次启动初始化用 |

**关键点**：设备编号、名称、型号、制造商、额定参数、库存数量均为**手工编造**。

### 2.3 RAG 知识库 — 硬编码嵌入 🔴

| 文件 | 行号 | Mock 内容 |
| :--- | :---: | :--- |
| [rag_tools.py](file:///Users/paistarss/product/bengfa/ovops/tools/rag_tools.py) | L5-33 | 仅 2 条知识条目硬编码在 Python List 中（`KB-PUMP-001` 离心泵气蚀规程、`KB-VALVE-002` 控制阀卡阻规程）|
| [rag_tools.py](file:///Users/paistarss/product/bengfa/ovops/tools/rag_tools.py) | L43-48 | 检索为简单 `keywords in query` 关键词匹配，非向量语义检索 |

### 2.4 物理机理计算 — 硬编码常量 🟡

| 文件 | 行号 | 硬编码内容 |
| :--- | :---: | :--- |
| [physics_tools.py](file:///Users/paistarss/product/bengfa/ovops/tools/physics_tools.py) | L23 | 介质密度 `1800.0`（P-201 浓硫酸）/ `1000.0`（其他）写死 |
| [physics_tools.py](file:///Users/paistarss/product/bengfa/ovops/tools/physics_tools.py) | L30 | 管道直径 `DN100 = 0.1m` 写死 |
| [physics_tools.py](file:///Users/paistarss/product/bengfa/ovops/tools/physics_tools.py) | L36 | 额定 NPSHr `3.2m` 写死（应从设备铭牌读取） |
| [physics_tools.py](file:///Users/paistarss/product/bengfa/ovops/tools/physics_tools.py) | L126 | 泵基频 `48.3 Hz` (2900 RPM) 写死 |

### 2.5 Agent 规划器 — 硬编码分支 🟡

| 文件 | 行号 | 硬编码内容 |
| :--- | :---: | :--- |
| [planner.py](file:///Users/paistarss/product/bengfa/ovops/agent/planner.py) | L61-64 | 设备推断仅支持 P-201 和 V-102 两个位号的关键词匹配 |
| [planner.py](file:///Users/paistarss/product/bengfa/ovops/agent/planner.py) | L281-286 | 物理诊断缺省分支仅覆盖"气蚀"和"卡阻"两种故障 |
| [planner.py](file:///Users/paistarss/product/bengfa/ovops/agent/planner.py) | L291-294 | 兜底备件清单写死 2 种预案 |
| [planner.py](file:///Users/paistarss/product/bengfa/ovops/agent/planner.py) | L301 | 技师姓名写死 `"陈工(资深运维技师)"` |

### 2.6 主管决策看板 — 硬编码 KPI 🟡

| 文件 | 行号 | 硬编码内容 |
| :--- | :---: | :--- |
| [routes_supervisor.py](file:///Users/paistarss/product/bengfa/ovops/api/routes_supervisor.py) | L37-38 | `mtbf_hours: 2480`、`mttr_hours: 1.6` 为静态常量 |
| [routes_supervisor.py](file:///Users/paistarss/product/bengfa/ovops/api/routes_supervisor.py) | L30-31 | 停机损失估算 `每张工单 × 125000 元` 为固定系数 |
| [routes_supervisor.py](file:///Users/paistarss/product/bengfa/ovops/api/routes_supervisor.py) | L46-88 | 供应链地图 4 个仓库节点全为硬编码 JSON |

### 2.7 前端 — 硬编码设备/场景 🟡

| 文件 | 行号 | 硬编码内容 |
| :--- | :---: | :--- |
| [AutonomousPlannerConsole.tsx](file:///Users/paistarss/product/bengfa/web/src/components/AutonomousPlannerConsole.tsx) | L45-64 | 3 个预设运维目标场景 hardcode P-201/V-102 |
| [DigitalTwinFlow.tsx](file:///Users/paistarss/product/bengfa/web/src/components/DigitalTwinFlow.tsx) | L75-83 | 数字孪生流程图写死 P-201 节点 |
| [TelemetryChart.tsx](file:///Users/paistarss/product/bengfa/web/src/components/TelemetryChart.tsx) | L29, L156 | 时序图表标题写死 P-201 |
| [Navbar.tsx](file:///Users/paistarss/product/bengfa/web/src/components/Navbar.tsx) | L81-90 | 故障注入按钮写死 P-201 / V-102 |
| [ChannelSimulator.tsx](file:///Users/paistarss/product/bengfa/web/src/components/ChannelSimulator.tsx) | L52 | 告警标题写死 P-201 |

---

## 🏢 三、企业对接架构设计

### 3.1 企业侧提供能力

企业提供**一个统一的设备数据查询 HTTP API**，我方系统通过该接口获取所需数据：

```
┌─────────────────────────────────────────────────────────────────────┐
│                       企业侧 (数据提供方)                            │
│                                                                     │
│   已有系统    ─────►  统一设备数据查询 API  ◄────── 我方系统调用     │
│   ┌─────────┐        ┌─────────────────────┐      ┌──────────────┐ │
│   │ DCS/PLC │        │ GET /api/devices     │      │ 瓯阀智枢     │ │
│   │ SCADA   │───────►│ GET /api/devices/:id │◄─────│ 数据采集层   │ │
│   │ ERP     │        │ GET /api/devices/:id/│      └──────────────┘ │
│   │ 供应链   │        │     realtime-data    │                       │
│   └─────────┘        └─────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 企业 API 对接适配层设计

```
我方系统新增模块：

ovops/
├── adapters/                        ← 【新增】企业 API 适配层
│   ├── __init__.py
│   ├── base_adapter.py              ← 适配器抽象基类 (ABC)
│   ├── enterprise_api_client.py     ← 企业设备数据 API HTTP Client
│   ├── data_mapper.py               ← 企业字段 → 内部标准字段映射
│   ├── cache.py                     ← 本地缓存层 (Redis/SQLite TTL)
│   └── health_checker.py            ← API 可用性探活与自动降级
│
├── simulator/
│   └── fault_generator.py           ← 保留，作为企业 API 不可达时的降级数据源
```

### 3.3 双源数据架构：企业 API 优先，仿真器兜底

```
               ┌──────────────────────────────────┐
               │   数据源选择器 (DataSourceRouter)  │
               └───────┬──────────┬───────────────┘
                       │          │
            ┌──────────▼──┐  ┌───▼──────────────┐
            │ 企业 API     │  │ 本地仿真器        │
            │ (优先级 P0)  │  │ (降级兜底 P1)     │
            │              │  │                   │
            │ HTTP Client  │  │ fault_generator   │
            │ + 字段映射   │  │ + 随机噪声合成    │
            │ + TTL 缓存   │  │                   │
            └──────────────┘  └───────────────────┘
                       │          │
                       ▼          ▼
               ┌──────────────────────────────────┐
               │  统一内部数据模型 (标准化测点结构)  │
               │  inlet_pressure_kpa, vibration_.. │
               └──────────────────────────────────┘
```

### 3.4 企业 API 字段映射配置 (示例)

```yaml
# config/enterprise_api_mapping.yaml
enterprise_api:
  base_url: "https://enterprise.example.com/api"  # 企业 API 地址
  auth:
    type: "bearer"  # 或 "api_key" / "basic"
    token_env: "ENTERPRISE_API_TOKEN"  # Token 从环境变量读取

  endpoints:
    device_list: "/devices"
    device_detail: "/devices/{device_id}"
    realtime_data: "/devices/{device_id}/realtime-data"
    history_data: "/devices/{device_id}/history?start={start}&end={end}"

  field_mapping:
    # 企业字段名 → 瓯阀智枢内部标准字段名
    device_id: "equipment_id"
    inlet_pressure: "inlet_pressure_kpa"
    outlet_pressure: "outlet_pressure_kpa"
    vibration_value: "vibration_rms_mms"
    temperature: "bearing_temp_c"
    flow: "flow_rate_m3h"

  polling:
    interval_seconds: 2    # 轮询间隔
    timeout_seconds: 5     # 单次请求超时
    retry_count: 3         # 失败重试次数
    fallback_to_simulator: true  # 超时后自动降级到仿真器
```

---

## 📅 四、生产级演进里程碑 (Production Roadmap)

### Phase 7：企业设备数据 API 对接层 `[P0 最高优先]`

> **目标**：替换仿真器，从企业真实设备数据查询接口获取实时/历史传感器数据。
> **预计工期**：3-5 个工作日

| # | 子任务 | 优先级 | 说明 |
| :---: | :--- | :---: | :--- |
| 7.1 | **设计企业 API 适配层抽象接口** (`adapters/base_adapter.py`) | P0 | 定义 `get_device_list()`、`get_realtime_data(device_id)`、`get_history_data(device_id, start, end)` 标准抽象方法 |
| 7.2 | **实现企业 HTTP API Client** (`adapters/enterprise_api_client.py`) | P0 | 基于 `httpx.AsyncClient`，支持 Bearer Token / API Key 鉴权、超时重试、连接池 |
| 7.3 | **实现字段映射层** (`adapters/data_mapper.py`) | P0 | 读取 YAML 映射配置，将企业不规范/异构字段名统一转换为内部标准模型字段 |
| 7.4 | **实现本地缓存层** (`adapters/cache.py`) | P0 | SQLite 或 Redis 缓存最近 N 秒数据，避免高频重复请求企业 API；支持 TTL 过期策略 |
| 7.5 | **实现数据源路由器** (`adapters/__init__.py` 中的 `DataSourceRouter`) | P0 | 企业 API 优先 → 超时/异常自动降级到仿真器 → 恢复后自动切回 |
| 7.6 | **重构 `routes_telemetry.py`** | P0 | `/api/telemetry/latest` 和 `/history` 改为从 `DataSourceRouter` 取数，而非直接调用 `telemetry_sim` |
| 7.7 | **重构物理工具入参来源** | P0 | `calculate_pump_cavitation` 等工具函数的入口数据改为从适配层传入，而非从仿真器 |
| 7.8 | **API 可用性探活与监控** (`adapters/health_checker.py`) | P0 | 定时健康检查企业 API 端点，记录延迟与成功率，前端管理面板可视化 |
| 7.9 | **后台管理面板增加"企业 API 配置"** | P0 | 在 AdminSettingsModal 新增 Tab，用于配置企业 API 地址、Token、轮询间隔、字段映射、测试连通性 |
| 7.10 | **保留故障注入演示模式** | P1 | 在管理面板增加"数据源模式切换"：`企业API`/`仿真器`/`混合模式(API优先)`，方便展演与调试 |

---

### Phase 8：ERP 设备台账与备件库动态同步 `[P0 最高优先]`

> **目标**：设备资产主数据与备品备件库存从企业 API 实时同步，替代 SQLite 静态种子数据。
> **预计工期**：2-3 个工作日

| # | 子任务 | 优先级 | 说明 |
| :---: | :--- | :---: | :--- |
| 8.1 | **设备台账同步服务** | P0 | 启动时 + 定时（每 5 分钟）从企业 API `/devices` 拉取设备清单，UPSERT 到本地 SQLite `equipments` 表 |
| 8.2 | **备品备件库存同步** | P0 | 从企业 API 获取设备关联备件信息并同步到 `spare_parts` 表 |
| 8.3 | **设备额定参数动态读取** | P0 | 物理计算所需的 NPSHr、管径、转速、介质密度等参数从设备铭牌/台账字段读取，**不再硬编码** |
| 8.4 | **前端动态设备列表** | P0 | 数字孪生大屏、故障注入按钮、规划器预设场景改为从 `/api/erp/equipments` 动态渲染，不再写死 P-201/V-102 |
| 8.5 | **增量同步与冲突处理** | P1 | 支持增量更新（`updated_after` 参数），处理本地工单与远端状态冲突 |
| 8.6 | **同步日志与审计** | P1 | 记录每次同步的变更数量、耗时、异常，管理面板可视化 |

---

### Phase 9：RAG 知识库生产化 `[P0 高优先]`

> **目标**：将硬编码的 2 条知识条目替换为可扩展的向量检索引擎，支持导入企业真实 SOP 文档。
> **预计工期**：3-4 个工作日

| # | 子任务 | 优先级 | 说明 |
| :---: | :--- | :---: | :--- |
| 9.1 | **引入轻量向量存储** | P0 | 选型：ChromaDB (轻量嵌入式) 或 FAISS (高性能)，替代 Python List 硬编码 |
| 9.2 | **文档导入管线** | P0 | 支持上传 PDF/DOCX/TXT 格式的企业设备 SOP / 维保手册，自动分块 + Embedding |
| 9.3 | **Embedding 模型集成** | P0 | 调用 DeepSeek Embedding API 或 BGE-M3 本地模型，将文档块向量化存储 |
| 9.4 | **语义检索替换关键词匹配** | P0 | `search_maintenance_sop()` 改为 Top-K 向量余弦相似度检索 + 重排序 |
| 9.5 | **管理面板：知识库管理** | P1 | 上传/删除/预览 SOP 文档列表，查看文档分块数与 Embedding 状态 |
| 9.6 | **知识库版本管理** | P2 | 支持多版本 SOP 规程，标记生效版本 |

---

### Phase 10：物理机理计算参数化 `[P1 高优先]`

> **目标**：消除物理工具中的硬编码常量，所有工程参数从设备铭牌动态读取。
> **预计工期**：1-2 个工作日

| # | 子任务 | 优先级 | 说明 |
| :---: | :--- | :---: | :--- |
| 10.1 | **NPSHr 从设备台账读取** | P0 | 不再写死 `3.2m`，从 `equipments.rated_params` JSON 中提取 `npsh_r` 字段 |
| 10.2 | **介质密度参数化** | P0 | 不再 `if P-201 then 1800` 分支写死，从设备关联的介质物性数据库获取 |
| 10.3 | **管径/转速/基频参数化** | P1 | 管道直径 DN、额定转速 RPM 从设备台账读取，FFT 基频自动计算 `RPM/60` |
| 10.4 | **机理计算结果持久化** | P1 | 每次物理诊断结果写入 `diagnosis_logs` 表，用于趋势分析与 MTBF 统计 |

---

### Phase 11：主管决策看板真实化 `[P1 中优先]`

> **目标**：KPI 数据从真实工单统计与设备运行记录计算得出，替代硬编码常数。
> **预计工期**：2 个工作日

| # | 子任务 | 优先级 | 说明 |
| :---: | :--- | :---: | :--- |
| 11.1 | **MTBF 真实统计** | P1 | 基于设备运行小时数与故障工单数计算 `MTBF = 总运行时长 / 故障次数` |
| 11.2 | **MTTR 真实统计** | P1 | 基于工单 `created_at` 到 `CLOSED` 的时间差均值计算 |
| 11.3 | **停机损失动态估算** | P1 | 从企业提供的单位时间产值参数 × 避免的停机时长计算 |
| 11.4 | **供应链地图对接真实供应商** | P2 | 从企业供应商系统 API 获取仓库坐标、库存量、配送 ETA |
| 11.5 | **健康度评分算法升级** | P1 | 综合近 30 天振动趋势、故障频率、运行小时数等多维指标动态计算，替代静态 `96.5` 分 |

---

### Phase 12：Agent 规划器泛化 `[P1 中优先]`

> **目标**：消除规划器中对特定设备编号和故障类型的硬编码分支，使其支持任意设备、任意故障。
> **预计工期**：2-3 个工作日

| # | 子任务 | 优先级 | 说明 |
| :---: | :--- | :---: | :--- |
| 12.1 | **设备推断泛化** | P1 | 从 `if "V-102" in goal` 分支升级为从设备台账全量模糊匹配 + LLM 意图识别 |
| 12.2 | **故障类型推断泛化** | P1 | 不再限于"气蚀"和"卡阻"两种，由 LLM 结合设备类型与遥测特征动态判定 |
| 12.3 | **备件推荐泛化** | P1 | 根据设备-备件关联关系从 ERP 动态查询推荐，而非写死 2 种预案 |
| 12.4 | **技师分配动态化** | P2 | 从技师排班表或企业人员 API 查询当值技师，而非写死"陈工" |
| 12.5 | **离线兜底引擎泛化** | P2 | 在无 LLM 模式下，基于设备类型自动选择匹配的物理机理工具链 |

---

### Phase 13：安全加固与多租户 `[P1 中优先]`

> **预计工期**：3-4 个工作日

| # | 子任务 | 优先级 | 说明 |
| :---: | :--- | :---: | :--- |
| 13.1 | **用户认证系统** | P1 | JWT Token 认证，替代当前完全无鉴权的 API |
| 13.2 | **RBAC 权限守卫** | P1 | 中控员只读遥测/Agent，技师只能操作自己的工单，主管可审批，管理员全权限 |
| 13.3 | **API 密钥加密存储** | P1 | LLM API Key 与企业 Token 改用 AES-256 加密存储于 SQLite，运行时解密 |
| 13.4 | **操作审计日志** | P1 | 所有工单审批、配置变更、Agent 触发记录完整审计轨迹 |
| 13.5 | **请求频率限制** | P2 | 对企业 API 调用频率设上限，防止异常循环暴刷 |
| 13.6 | **多租户隔离** (远期) | P2 | 支持多家永嘉泵阀企业独立实例或数据隔离部署 |

---

### Phase 14：生产部署与运维 `[P1 中优先]`

> **预计工期**：2-3 个工作日

| # | 子任务 | 优先级 | 说明 |
| :---: | :--- | :---: | :--- |
| 14.1 | **Docker 容器化** | P1 | Dockerfile + docker-compose.yml (Python 后端 + Node 前端构建 + SQLite 数据卷) |
| 14.2 | **环境变量规范化** | P1 | 所有敏感配置（企业 API Token、LLM Key、数据库路径）通过 `.env` 或 K8s Secret 注入 |
| 14.3 | **健康检查与监控** | P1 | Prometheus metrics 端点 + Grafana 仪表盘（API 延迟、企业 API 成功率、Agent 调度耗时） |
| 14.4 | **日志结构化** | P1 | 全链路 JSON 格式结构化日志 (loguru/structlog)，支持 ELK 采集 |
| 14.5 | **数据库迁移工具** | P1 | Alembic 管理 SQLite → PostgreSQL 迁移脚本 |
| 14.6 | **CI/CD 流水线** | P2 | GitHub Actions: lint → test → build → deploy |

---

### Phase 15：前端生产级升级 `[P2 低优先]`

| # | 子任务 | 优先级 | 说明 |
| :---: | :--- | :---: | :--- |
| 15.1 | **动态设备选择器** | P1 | 所有硬编码 P-201/V-102 的地方改为从 API 动态加载设备下拉列表 |
| 15.2 | **数字孪生流程图动态渲染** | P2 | 根据设备拓扑关系动态生成流程图节点，而非写死 |
| 15.3 | **时序图表多设备支持** | P2 | 支持切换查看任意设备的时序曲线 |
| 15.4 | **国际化 (i18n)** | P2 | 中/英文切换支持 |
| 15.5 | **Code Splitting** | P2 | 按角色拆分代码包，减小首屏体积 |

---

## 🔗 五、企业对接实施步骤（推荐执行顺序）

```
Week 1 ──────────────────────────────────────────────────────────────────
│
├─ Day 1-2: Phase 7.1 ~ 7.5  ← 搭建企业 API 适配层框架 (P0)
│           与企业确认 API 文档、鉴权方式、字段含义
│
├─ Day 3:   Phase 7.6 ~ 7.8  ← 重构遥测数据源，接入真实设备数据 (P0)
│
├─ Day 4:   Phase 8.1 ~ 8.4  ← 设备台账与备件库同步 (P0)
│
├─ Day 5:   Phase 10.1 ~ 10.3 ← 物理计算参数化 (P0/P1)
│

Week 2 ──────────────────────────────────────────────────────────────────
│
├─ Day 6-7: Phase 9.1 ~ 9.4  ← RAG 向量化知识库落地 (P0)
│
├─ Day 8:   Phase 11.1 ~ 11.3 ← 主管 KPI 真实化 (P1)
│
├─ Day 9:   Phase 12.1 ~ 12.3 ← Agent 泛化 (P1)
│
├─ Day 10:  Phase 7.9, 7.10   ← 管理面板企业 API 配置 & 联调验收 (P0)
│

Week 3 ──────────────────────────────────────────────────────────────────
│
├─ Day 11-12: Phase 13.1 ~ 13.4 ← 安全加固 (P1)
│
├─ Day 13-14: Phase 14.1 ~ 14.5 ← 容器化部署 (P1)
│
├─ Day 15:    Phase 15.1       ← 前端动态设备 + 全量回归测试
│
└─ 🎯 联调上线：可在企业内网环境部署运行，接收真实传感器数据并闭环处置
```

---

## 📐 六、企业 API 接口规约建议 (供企业侧参考)

我方系统需要企业提供以下最小 API 能力集：

### 6.1 设备列表查询 `GET /api/devices`

```json
{
  "devices": [
    {
      "device_id": "P-201",
      "device_name": "特种高硅耐酸工业离心泵",
      "device_type": "centrifugal_pump",
      "area": "精细化工区",
      "status": "running",
      "rated_params": {
        "npsh_r": 3.2,
        "flow_rate_m3h": 120.0,
        "rpm": 2900,
        "pipe_dn_mm": 100,
        "medium_density_kgm3": 1800
      }
    }
  ]
}
```

### 6.2 设备实时数据查询 `GET /api/devices/{device_id}/realtime-data`

```json
{
  "device_id": "P-201",
  "timestamp": "2026-09-06T01:20:00+08:00",
  "measurements": {
    "inlet_pressure": 125.3,
    "outlet_pressure": 648.7,
    "vibration_rms": 1.8,
    "vibration_hf_accel": 0.31,
    "flow_rate": 119.5,
    "bearing_temperature": 53.2
  },
  "unit_mapping": {
    "inlet_pressure": "kPa",
    "outlet_pressure": "kPa",
    "vibration_rms": "mm/s",
    "vibration_hf_accel": "g",
    "flow_rate": "m³/h",
    "bearing_temperature": "℃"
  }
}
```

### 6.3 设备历史数据查询 `GET /api/devices/{device_id}/history?start=...&end=...`

```json
{
  "device_id": "P-201",
  "start": "2026-09-05T00:00:00+08:00",
  "end": "2026-09-06T00:00:00+08:00",
  "interval_seconds": 60,
  "data_points": [
    {
      "timestamp": "2026-09-05T00:01:00+08:00",
      "inlet_pressure": 124.8,
      "vibration_rms": 1.7,
      "flow_rate": 120.1,
      "bearing_temperature": 52.9
    }
  ]
}
```

> [!IMPORTANT]
> 企业 API 仅需提供**只读查询**能力。工单创建、审批、备件扣减等写操作全部在我方系统内部完成，不会反向写入企业系统。

---

## 📌 七、优先级速查表

| 优先级 | 含义 | 覆盖 Phase |
| :---: | :--- | :--- |
| **P0** | 阻断性：不完成则无法对接企业生产环境 | Phase 7 (设备数据 API)、Phase 8 (ERP 同步)、Phase 9 (RAG 向量化)、Phase 10 部分 |
| **P1** | 重要性：影响系统专业性与可靠性 | Phase 10 部分、Phase 11 (KPI)、Phase 12 (Agent 泛化)、Phase 13 (安全)、Phase 14 (部署) |
| **P2** | 增强性：提升用户体验与系统弹性 | Phase 15 (前端升级)、各模块中的高级功能 |
