import React, { useState, useEffect } from 'react';
import { X, Cpu, Send, Sliders, CheckCircle2, AlertCircle, RefreshCw, Key, Globe, Shield, ExternalLink, Sparkles, Server, Activity, Wifi, Database, BookOpen, FileText } from 'lucide-react';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'llm' | 'channels' | 'enterprise_api' | 'physics' | 'knowledge'>('llm');
  const [loading, setLoading] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // 配置状态
  const [baseUrl, setBaseUrl] = useState<string>("https://api.deepseek.com");
  const [apiKey, setApiKey] = useState<string>("");
  const [model, setModel] = useState<string>("deepseek-v4-pro");
  const [dingtalkUrl, setDingtalkUrl] = useState<string>("");
  const [feishuUrl, setFeishuUrl] = useState<string>("");
  const [publicUrl, setPublicUrl] = useState<string>("http://localhost:8000");
  const [cavitationTolerance, setCavitationTolerance] = useState<string>("0.5");
  const [deadbandLimit, setDeadbandLimit] = useState<string>("1.0");

  // 企业设备数据 API 对接状态 (Phase 7)
  const [enterpriseBaseUrl, setEnterpriseBaseUrl] = useState<string>("");
  const [enterpriseToken, setEnterpriseToken] = useState<string>("");
  const [enterpriseAuthType, setEnterpriseAuthType] = useState<string>("bearer");
  const [dataSourceMode, setDataSourceMode] = useState<string>("API_FIRST");
  const [enterpriseTimeout, setEnterpriseTimeout] = useState<string>("3.0");

  // RAG 知识库状态 (Phase 9)
  const [knowledgeData, setKnowledgeData] = useState<any>(null);
  const [knowledgeLoading, setKnowledgeLoading] = useState<boolean>(false);
  const [reindexing, setReindexing] = useState<boolean>(false);
  const [reindexMsg, setReindexMsg] = useState<string>("");

  // 测试与同步状态
  const [llmTestStatus, setLlmTestStatus] = useState<any>(null);
  const [llmTesting, setLlmTesting] = useState<boolean>(false);
  const [channelTestStatus, setChannelTestStatus] = useState<any>(null);
  const [channelTesting, setChannelTesting] = useState<boolean>(false);
  const [enterpriseTestStatus, setEnterpriseTestStatus] = useState<any>(null);
  const [enterpriseTesting, setEnterpriseTesting] = useState<boolean>(false);
  const [assetSyncStatus, setAssetSyncStatus] = useState<any>(null);
  const [assetSyncing, setAssetSyncing] = useState<boolean>(false);

  // 加载系统配置
  useEffect(() => {
    if (isOpen) {
      fetch('/api/system/config')
        .then(r => r.json())
        .then(data => {
          if (data.llm_base_url) setBaseUrl(data.llm_base_url.value);
          if (data.llm_api_key) setApiKey(data.llm_api_key.value);
          if (data.llm_model) setModel(data.llm_model.value);
          if (data.dingtalk_webhook) setDingtalkUrl(data.dingtalk_webhook.value);
          if (data.feishu_webhook) setFeishuUrl(data.feishu_webhook.value);
          if (data.public_url) setPublicUrl(data.public_url.value);
          if (data.cavitation_tolerance) setCavitationTolerance(data.cavitation_tolerance.value);
          if (data.valve_deadband_limit) setDeadbandLimit(data.valve_deadband_limit.value);
          if (data.enterprise_api_base_url) setEnterpriseBaseUrl(data.enterprise_api_base_url.value);
          if (data.enterprise_api_token) setEnterpriseToken(data.enterprise_api_token.value);
          if (data.enterprise_api_auth_type) setEnterpriseAuthType(data.enterprise_api_auth_type.value);
          if (data.data_source_mode) setDataSourceMode(data.data_source_mode.value);
          if (data.enterprise_api_timeout) setEnterpriseTimeout(data.enterprise_api_timeout.value);
        })
        .catch(err => console.error("加载配置失败:", err));

      fetch('/api/system/sync-status')
        .then(r => r.json())
        .then(data => setAssetSyncStatus(data))
        .catch(() => {});

      fetchKnowledge();
    }
  }, [isOpen]);

  const fetchKnowledge = async () => {
    setKnowledgeLoading(true);
    try {
      const res = await fetch('/api/system/knowledge/list');
      const data = await res.json();
      setKnowledgeData(data);
    } catch (e) {
      console.error("加载知识库失败:", e);
    } finally {
      setKnowledgeLoading(false);
    }
  };

  const handleReindexKnowledge = async () => {
    setReindexing(true);
    setReindexMsg("");
    try {
      const res = await fetch('/api/system/knowledge/reindex', { method: 'POST' });
      const data = await res.json();
      setReindexMsg(data.message || "重新索引完成");
      fetchKnowledge();
    } catch (e: any) {
      setReindexMsg("重新索引失败: " + e.message);
    } finally {
      setReindexing(false);
    }
  };

  if (!isOpen) return null;

  // 保存系统配置
  const handleSave = async () => {
    setLoading(true);
    setSaveSuccess(false);
    try {
      await fetch('/api/system/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configs: {
            llm_base_url: baseUrl,
            llm_api_key: apiKey,
            llm_model: model,
            dingtalk_webhook: dingtalkUrl,
            feishu_webhook: feishuUrl,
            public_url: publicUrl,
            cavitation_tolerance: cavitationTolerance,
            valve_deadband_limit: deadbandLimit,
            enterprise_api_base_url: enterpriseBaseUrl,
            enterprise_api_token: enterpriseToken,
            enterprise_api_auth_type: enterpriseAuthType,
            data_source_mode: dataSourceMode,
            enterprise_api_timeout: enterpriseTimeout
          }
        })
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error("保存配置失败:", e);
    } finally {
      setLoading(false);
    }
  };

  // 测试大模型连通性
  const handleTestLlm = async () => {
    setLlmTesting(true);
    setLlmTestStatus(null);
    try {
      const res = await fetch('/api/system/test-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_url: baseUrl,
          api_key: apiKey.includes("******") ? undefined : apiKey,
          model: model
        })
      });
      const data = await res.json();
      setLlmTestStatus(data);
    } catch (e: any) {
      setLlmTestStatus({ status: 'error', message: e.message });
    } finally {
      setLlmTesting(false);
    }
  };

  // 测试钉钉/飞书通道连通性
  const handleTestChannel = async (channel: 'DINGTALK' | 'FEISHU') => {
    setChannelTesting(true);
    setChannelTestStatus(null);
    try {
      const res = await fetch('/api/system/test-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: channel,
          webhook: channel === 'DINGTALK' ? dingtalkUrl : feishuUrl
        })
      });
      const data = await res.json();
      setChannelTestStatus({ channel, ...data });
    } catch (e: any) {
      setChannelTestStatus({ status: 'error', message: e.message });
    } finally {
      setChannelTesting(false);
    }
  };

  // 测试企业设备数据 API 连通性 (Phase 7)
  const handleTestEnterpriseApi = async () => {
    setEnterpriseTesting(true);
    setEnterpriseTestStatus(null);
    try {
      const res = await fetch('/api/system/test-enterprise-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_url: enterpriseBaseUrl,
          token: enterpriseToken.includes("******") ? undefined : enterpriseToken,
          auth_type: enterpriseAuthType,
          timeout: parseFloat(enterpriseTimeout) || 3.0
        })
      });
      const data = await res.json();
      setEnterpriseTestStatus(data);
    } catch (e: any) {
      setEnterpriseTestStatus({ status: 'error', message: e.message });
    } finally {
      setEnterpriseTesting(false);
    }
  };

  // 手动同步企业设备台账与备件 (Phase 8)
  const handleSyncAssets = async () => {
    setAssetSyncing(true);
    setAssetSyncStatus(null);
    try {
      const res = await fetch('/api/system/sync-assets', { method: 'POST' });
      const data = await res.json();
      setAssetSyncStatus(data);
    } catch (e: any) {
      setAssetSyncStatus({ status: 'error', message: e.message });
    } finally {
      setAssetSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        
        {/* 弹窗头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                系统与算法管理员中枢 (Admin Configuration Console)
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                在线热配置大模型端点、钉飞 Webhook 密钥及工业机理阈值
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 标签栏 */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-950/40 overflow-x-auto">
          <button
            onClick={() => setActiveTab('llm')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'llm'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            大模型服务设置
          </button>
          <button
            onClick={() => setActiveTab('enterprise_api')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'enterprise_api'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            企业数据接口 (Enterprise API)
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'channels'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            协同通知通道 (钉钉/飞书)
          </button>
          <button
            onClick={() => setActiveTab('physics')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'physics'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            工业机理阈值
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'knowledge'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            RAG 专家规程知识库
          </button>
        </div>

        {/* 内容主体 */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {activeTab === 'llm' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/20 text-blue-800 dark:text-blue-300 leading-relaxed text-[11px]">
                💡 <b>运行模式说明</b>：支持填写真实 API Key 接入 DeepSeek-V3/R1 或通义千问；若留空密钥，系统将自动平滑回退至<b>内置工业物理机理引擎</b>，保障比赛离线答辩 100% 稳定运行。
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-700 dark:text-zinc-300 font-medium">
                    API Base URL
                  </label>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    官方推荐: https://api.deepseek.com
                  </span>
                </div>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.deepseek.com"
                    className="w-full pl-9 pr-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  💡 根据 DeepSeek 官方文档，OpenAI 格式端点为 <code className="text-zinc-700 dark:text-zinc-300">https://api.deepseek.com</code>（无需 /v1 后缀）；Anthropic 格式为 <code className="text-zinc-700 dark:text-zinc-300">https://api.deepseek.com/anthropic</code>。
                </p>
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                  API Key
                </label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full pl-9 pr-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  可前往 <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">DeepSeek 开放平台控制台</a> 申请与管理 API Key。
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-zinc-700 dark:text-zinc-300 font-medium flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-blue-500" />
                    <span>模型名称 (Model Identifier)</span>
                  </label>
                  <a
                    href="https://api-docs.deepseek.com/zh-cn/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-sans"
                  >
                    <span>查看 DeepSeek 官方模型文档</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* 可自由编辑与自定义填写的模型输入框，挂载 datalist 建议 */}
                <div className="relative mb-2">
                  <input
                    type="text"
                    list="preset-models"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="可自由填写或选择模型标识，如 deepseek-v4-flash、deepseek-v4-pro 等"
                    className="w-full px-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <datalist id="preset-models">
                    <option value="deepseek-v4-pro" label="DeepSeek-V4-Pro (官方高性能主力推荐)" />
                    <option value="deepseek-v4-flash" label="DeepSeek-V4-Flash (官方高速低延迟 · 工具调用推荐)" />
                    <option value="deepseek-v4-flash-vision-exp" label="DeepSeek-V4-Flash-Vision (官方实验性多模态)" />
                    <option value="deepseek-chat" label="DeepSeek-Chat 兼容别名" />
                    <option value="deepseek-reasoner" label="DeepSeek-Reasoner 兼容别名" />
                    <option value="qwen-plus" label="通义千问 Plus" />
                    <option value="qwen-max" label="通义千问 Max" />
                    <option value="gpt-4o-mini" label="OpenAI GPT-4o-mini" />
                  </datalist>
                </div>

                {/* 预设模型快捷选取卡片 (100% 对齐 DeepSeek 官方文档 PARAM | VALUE 规范) */}
                <div className="space-y-1.5">
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>官方文档核心模型 (点击即可自动载入):</span>
                  </div>

                  {/* DeepSeek 官方核心模型对齐 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setModel("deepseek-v4-flash");
                        setBaseUrl("https://api.deepseek.com");
                      }}
                      className={`p-2 rounded-md text-left transition-all border flex flex-col gap-0.5 ${
                        model === "deepseek-v4-flash"
                          ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200 shadow-sm"
                          : "bg-zinc-50/70 dark:bg-zinc-950/50 border-zinc-200 dark:border-white/10 hover:border-blue-300 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs">deepseek-v4-flash</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">
                          官方推荐
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        高效轻量版，极速响应，原生支持 Tool Calls
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setModel("deepseek-v4-pro");
                        setBaseUrl("https://api.deepseek.com");
                      }}
                      className={`p-2 rounded-md text-left transition-all border flex flex-col gap-0.5 ${
                        model === "deepseek-v4-pro"
                          ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200 shadow-sm"
                          : "bg-zinc-50/70 dark:bg-zinc-950/50 border-zinc-200 dark:border-white/10 hover:border-blue-300 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs">deepseek-v4-pro</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono">
                          Pro 旗舰
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        高性能标准模型，适用于复杂规划与深度推理
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setModel("deepseek-v4-flash-vision-exp");
                        setBaseUrl("https://api.deepseek.com");
                      }}
                      className={`p-2 rounded-md text-left transition-all border flex flex-col gap-0.5 ${
                        model === "deepseek-v4-flash-vision-exp"
                          ? "bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-200 shadow-sm"
                          : "bg-zinc-50/70 dark:bg-zinc-950/50 border-zinc-200 dark:border-white/10 hover:border-purple-300 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs truncate">v4-flash-vision</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono">
                          实验多模态
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        实验性模型，额外支持工业图像探伤输入
                      </span>
                    </button>
                  </div>

                  {/* 兼容别名与其他通用模型 */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-zinc-400 mr-0.5">兼容与通用模型:</span>
                    {[
                      { name: "deepseek-chat", label: "deepseek-chat" },
                      { name: "deepseek-reasoner", label: "deepseek-reasoner" },
                      { name: "qwen-plus", label: "通义千问 Plus" },
                      { name: "gpt-4o-mini", label: "GPT-4o-mini" }
                    ].map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setModel(item.name)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                          model === item.name
                            ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40 font-semibold"
                            : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10 hover:text-zinc-900 dark:hover:text-zinc-200"
                        }`}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  disabled={llmTesting}
                  onClick={handleTestLlm}
                  className="px-3 py-1.5 rounded bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${llmTesting ? 'animate-spin' : ''}`} />
                  {llmTesting ? '正在测试连通性...' : '一键测试模型连通性 (Ping)'}
                </button>
              </div>

              {llmTestStatus && (
                <div className={`p-3 rounded-md text-xs space-y-1.5 font-mono ${
                  llmTestStatus.status === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                    : 'bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-500/30 text-red-800 dark:text-red-300'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span>{llmTestStatus.status === 'success' ? '✅ 连通校验成功' : '❌ 连接出现异常'}</span>
                    <span>延迟: {llmTestStatus.latency_ms} ms</span>
                  </div>
                  <p className="font-sans text-[11px] leading-relaxed break-words">
                    {llmTestStatus.reply || llmTestStatus.message}
                  </p>
                  {llmTestStatus.status !== 'success' && (
                    <div className="pt-1 border-t border-red-200 dark:border-red-500/20 text-[10px] text-red-700 dark:text-red-400 font-sans">
                      💡 排查建议：1. 请确认您的 API Key 具有有效额度且未过期；2. 请确认 Base URL 与 Model 名称为 DeepSeek 官方支持版本；3. 若无外部网络，可清空 Key 以启用高保真离线机理引擎。
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'enterprise_api' && (
            <div className="space-y-4">
              <div className="p-3 rounded-md bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/20 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <Server className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">企业现场工业设备数据查询对接 (Phase 7 生产级适配)</p>
                  <p className="text-[11px] opacity-90">
                    通过企业提供的只读查询接口拉取实时传感器时序（温度、振动、流量、压力等）。系统采用双模路由机制，未配地址或企业端点故障时自动平滑降级至内置物理仿真器。
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                  数据源调度模式 (Data Source Mode)
                </label>
                <select
                  value={dataSourceMode}
                  onChange={(e) => setDataSourceMode(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-blue-500"
                >
                  <option value="API_FIRST">企业真实 API 优先 (推荐：异常/超时自动平滑降级至仿真器)</option>
                  <option value="API_ONLY">仅企业真实 API (严格生产模式：接口不可用时告警拦截)</option>
                  <option value="SIMULATOR_ONLY">仅本地高保真仿真器 (离线演练与展演大赛模式)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                  企业设备数据查询 API 根地址 (Base URL)
                </label>
                <input
                  type="text"
                  value={enterpriseBaseUrl}
                  onChange={(e) => setEnterpriseBaseUrl(e.target.value)}
                  placeholder="http://192.168.1.100:5000/api 或 https://iot.enterprise.local/api"
                  className="w-full px-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-blue-500 text-xs"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  需符合设备数据只读查询规约（支持 GET /devices 与 GET /devices/:id/realtime-data）。留空则使用仿真器。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                    接口鉴权方式 (Auth Type)
                  </label>
                  <select
                    value={enterpriseAuthType}
                    onChange={(e) => setEnterpriseAuthType(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-blue-500 text-xs"
                  >
                    <option value="bearer">Bearer Token (Authorization: Bearer ...)</option>
                    <option value="api_key">API Key (X-API-Key: ...)</option>
                    <option value="none">无鉴权 / 内网直通</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                    单次请求超时时间 (秒)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="10.0"
                    value={enterpriseTimeout}
                    onChange={(e) => setEnterpriseTimeout(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>
              </div>

              {enterpriseAuthType !== 'none' && (
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                    企业 API 认证鉴权凭证 (Token / Key)
                  </label>
                  <input
                    type="text"
                    value={enterpriseToken}
                    onChange={(e) => setEnterpriseToken(e.target.value)}
                    placeholder="输入由企业运维团队颁发的访问令牌或密钥"
                    className="w-full px-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>
              )}

              <div className="pt-2 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  disabled={enterpriseTesting}
                  onClick={handleTestEnterpriseApi}
                  className="px-3 py-1.5 rounded bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 text-xs"
                >
                  <Wifi className={`w-3.5 h-3.5 ${enterpriseTesting ? 'animate-spin' : ''}`} />
                  {enterpriseTesting ? '正在探测连通性...' : '一键测试企业接口连通性与设备解析'}
                </button>
              </div>

              {enterpriseTestStatus && (
                <div className={`p-3 rounded-md text-xs space-y-1.5 font-mono ${
                  enterpriseTestStatus.status === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                    : 'bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-500/30 text-red-800 dark:text-red-300'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span>{enterpriseTestStatus.status === 'success' ? '✅ 企业接口连通成功' : '❌ 接口探测失败'}</span>
                    {enterpriseTestStatus.latency_ms && (
                      <span>延迟: {enterpriseTestStatus.latency_ms} ms</span>
                    )}
                  </div>
                  <div>{enterpriseTestStatus.message}</div>
                  {enterpriseTestStatus.devices_detected !== undefined && (
                    <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                      在线设备数: {enterpriseTestStatus.devices_detected} 台
                      {enterpriseTestStatus.sample_devices?.length > 0 && (
                        <span>（检出示例: {enterpriseTestStatus.sample_devices.join(', ')}）</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Phase 8 资产台账与备件库同步 */}
              <div className="pt-3 border-t border-zinc-200 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-semibold text-xs">
                    <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>企业资产台账与备件主数据同步 (Phase 8)</span>
                  </div>
                  <button
                    type="button"
                    disabled={assetSyncing}
                    onClick={handleSyncAssets}
                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 text-xs shadow-sm"
                  >
                    <RefreshCw className={`w-3 h-3 ${assetSyncing ? 'animate-spin' : ''}`} />
                    {assetSyncing ? '正在拉取台账...' : '立即同步企业台账'}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  从企业 API GET /devices 获取工业设备台账与备件，增量更新本地 SQLite 数据库并绑定物理机理铭牌参数。
                </p>

                {assetSyncStatus && (
                  <div className={`p-2.5 rounded-md text-xs font-mono space-y-1 ${
                    assetSyncStatus.status === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      : assetSyncStatus.status === 'skipped'
                      ? 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300'
                      : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300'
                  }`}>
                    <div className="flex items-center justify-between font-bold">
                      <span>{assetSyncStatus.status === 'success' ? '✅ 台账同步完成' : assetSyncStatus.status === 'skipped' ? 'ℹ️ 维持本地台账' : '⚠️ 同步状态提醒'}</span>
                      {assetSyncStatus.duration_ms !== undefined && (
                        <span>耗时: {assetSyncStatus.duration_ms} ms</span>
                      )}
                    </div>
                    <div>{assetSyncStatus.message}</div>
                    {assetSyncStatus.synced_count !== undefined && assetSyncStatus.synced_count > 0 && (
                      <div className="text-[11px] opacity-80">
                        同步设备数: {assetSyncStatus.synced_count} 台 | 备件数: {assetSyncStatus.parts_synced_count || 0} 件
                        {assetSyncStatus.sync_time && <span> (时间: {assetSyncStatus.sync_time})</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'channels' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-700 dark:text-zinc-300 font-medium">
                    钉钉自定义机器人 Webhook URL
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTestChannel('DINGTALK')}
                    disabled={channelTesting}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-[11px]"
                  >
                    发送测试卡片
                  </button>
                </div>
                <input
                  type="text"
                  value={dingtalkUrl}
                  onChange={(e) => setDingtalkUrl(e.target.value)}
                  placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
                  className="w-full px-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-700 dark:text-zinc-300 font-medium">
                    飞书自定义机器人 Webhook URL
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTestChannel('FEISHU')}
                    disabled={channelTesting}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px]"
                  >
                    发送测试卡片
                  </button>
                </div>
                <input
                  type="text"
                  value={feishuUrl}
                  onChange={(e) => setFeishuUrl(e.target.value)}
                  placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
                  className="w-full px-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-700 dark:text-zinc-300 font-medium flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-zinc-500" />
                    服务公网 / 局域网访问地址 (Public Base URL)
                  </label>
                  <span className="text-[11px] text-zinc-400">用于卡片移动端直达核准</span>
                </div>
                <input
                  type="text"
                  value={publicUrl}
                  onChange={(e) => setPublicUrl(e.target.value)}
                  placeholder="http://localhost:8000 或 http://局域网IP:8000"
                  className="w-full px-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                />
                <p className="mt-1 text-[11px] text-zinc-500">
                  飞书/钉钉卡片点击核准跳转此地址。局域网演示请填机器真实内网 IP（如 http://192.168.x.x:8000），公网部署请填域名。
                </p>
              </div>

              {channelTestStatus && (
                <div className={`p-3 rounded-md text-xs font-mono ${
                  channelTestStatus.status === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                    : 'bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-500/30 text-red-800 dark:text-red-300'
                }`}>
                  {channelTestStatus.message}
                </div>
              )}
            </div>
          )}

          {activeTab === 'physics' && (
            <div className="space-y-4">
              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                  离心泵气蚀安全裕度阈值 (米 NPSHa - NPSHr)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={cavitationTolerance}
                  onChange={(e) => setCavitationTolerance(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1">低于此裕度值时，Agent 自动判定为气蚀风险并启动任务拆解。</p>
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                  控制阀回差死区允许上限 (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={deadbandLimit}
                  onChange={(e) => setDeadbandLimit(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1">符合 GB/T 4213 工业控制阀国家标准，超出 1.0% 时触发阀杆卡阻预警。</p>
              </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    工业 SOP 向量知识库 (NumPy Dense + BM25 Hybrid RAG)
                  </h4>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                    用于支撑专家规程匹配、应急步骤推荐与跨平台卡片下发。规程支持 Markdown 原生排版，引擎冷启动毫秒级向量化。
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                    <span>文档总数: <strong className="text-zinc-800 dark:text-zinc-200">{knowledgeData?.total_documents ?? 0} 篇</strong></span>
                    <span>上次索引: <strong className="text-zinc-800 dark:text-zinc-200">{knowledgeData?.last_indexed_time || '未索引'}</strong></span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={reindexing}
                  onClick={handleReindexKnowledge}
                  className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${reindexing ? 'animate-spin' : ''}`} />
                  {reindexing ? '正在重建索引...' : '重新构建向量索引'}
                </button>
              </div>

              {reindexMsg && (
                <div className="p-2.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/10 text-xs text-zinc-700 dark:text-zinc-300 font-mono">
                  {reindexMsg}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  当前已收录工业标准化排障 SOP 规程清单:
                </label>
                {knowledgeLoading ? (
                  <div className="py-6 text-center text-xs text-zinc-400">正在读取规程索引...</div>
                ) : knowledgeData?.documents?.length > 0 ? (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {knowledgeData.documents.map((doc: any) => (
                      <div
                        key={doc.doc_id}
                        className="p-3 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-950/40 hover:border-blue-500/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-semibold">
                              {doc.doc_id}
                            </span>
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                              {doc.title}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono">v{doc.version}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-500">
                          <span>品类: <strong className="text-zinc-700 dark:text-zinc-300">{doc.category}</strong></span>
                          <span>适配机型: <span className="font-mono">{doc.equipment_pattern}</span></span>
                          <span>步骤数: <strong>{doc.step_count} 步</strong></span>
                          <span>来源: {doc.source}</span>
                        </div>
                        {doc.keywords && doc.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {doc.keywords.map((kw: string, i: number) => (
                              <span key={i} className="px-1.5 py-0.2 rounded text-[9px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                #{kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-zinc-400">暂无 SOP 规程文件</div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* 弹窗底部操作 */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950">
          <div>
            {saveSuccess && (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                配置已即时热重载保存！
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-md bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors"
            >
              关闭
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSave}
              className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? '正在保存...' : '保存并热生效'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
