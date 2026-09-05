import React, { useState, useEffect } from 'react';
import { X, Cpu, Send, Sliders, CheckCircle2, AlertCircle, RefreshCw, Key, Globe, Shield, ExternalLink, Sparkles } from 'lucide-react';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'llm' | 'channels' | 'physics'>('llm');
  const [loading, setLoading] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // 配置状态
  const [baseUrl, setBaseUrl] = useState<string>("https://api.deepseek.com/v1");
  const [apiKey, setApiKey] = useState<string>("");
  const [model, setModel] = useState<string>("deepseek-chat");
  const [dingtalkUrl, setDingtalkUrl] = useState<string>("");
  const [feishuUrl, setFeishuUrl] = useState<string>("");
  const [cavitationTolerance, setCavitationTolerance] = useState<string>("0.5");
  const [deadbandLimit, setDeadbandLimit] = useState<string>("1.0");

  // 测试结果状态
  const [llmTestStatus, setLlmTestStatus] = useState<any>(null);
  const [llmTesting, setLlmTesting] = useState<boolean>(false);
  const [channelTestStatus, setChannelTestStatus] = useState<any>(null);
  const [channelTesting, setChannelTesting] = useState<boolean>(false);

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
          if (data.cavitation_tolerance) setCavitationTolerance(data.cavitation_tolerance.value);
          if (data.valve_deadband_limit) setDeadbandLimit(data.valve_deadband_limit.value);
        })
        .catch(err => console.error("加载配置失败:", err));
    }
  }, [isOpen]);

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
            cavitation_tolerance: cavitationTolerance,
            valve_deadband_limit: deadbandLimit
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
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-950/40">
          <button
            onClick={() => setActiveTab('llm')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'llm'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            大模型服务设置
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
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
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'physics'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            工业机理阈值
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
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                  API Base URL
                </label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.deepseek.com/v1"
                    className="w-full pl-9 pr-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
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
                    <span>DeepSeek 官方模型文档</span>
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
                    placeholder="可自由填写或选择模型标识，如 deepseek-chat、deepseek-reasoner 或自定义微调模型"
                    className="w-full px-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <datalist id="preset-models">
                    <option value="deepseek-chat" label="DeepSeek-V3 推荐 (通用对话与 Tool-Calling 工具调用)" />
                    <option value="deepseek-reasoner" label="DeepSeek-R1 (深度思维链 CoT 推理)" />
                    <option value="qwen-plus" label="通义千问 Plus" />
                    <option value="qwen-max" label="通义千问 Max" />
                    <option value="gpt-4o-mini" label="OpenAI GPT-4o-mini" />
                    <option value="claude-3-5-sonnet-20241022" label="Claude 3.5 Sonnet" />
                  </datalist>
                </div>

                {/* 预设模型快捷选取卡片 (DeepSeek 官方规范优先) */}
                <div className="space-y-1.5">
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>官方推荐预设 (点击可快速载入):</span>
                  </div>

                  {/* DeepSeek 官方核心模型对齐 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setModel("deepseek-chat");
                        if (!baseUrl || baseUrl.includes("example")) {
                          setBaseUrl("https://api.deepseek.com/v1");
                        }
                      }}
                      className={`p-2 rounded-md text-left transition-all border flex flex-col gap-0.5 ${
                        model === "deepseek-chat"
                          ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200 shadow-sm"
                          : "bg-zinc-50/70 dark:bg-zinc-950/50 border-zinc-200 dark:border-white/10 hover:border-blue-300 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs">deepseek-chat</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono">
                          DeepSeek-V3
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        官方主力模型，支持原生 Tool Calls 与高速流式响应
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setModel("deepseek-reasoner");
                        if (!baseUrl || baseUrl.includes("example")) {
                          setBaseUrl("https://api.deepseek.com/v1");
                        }
                      }}
                      className={`p-2 rounded-md text-left transition-all border flex flex-col gap-0.5 ${
                        model === "deepseek-reasoner"
                          ? "bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-200 shadow-sm"
                          : "bg-zinc-50/70 dark:bg-zinc-950/50 border-zinc-200 dark:border-white/10 hover:border-purple-300 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs">deepseek-reasoner</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono">
                          DeepSeek-R1
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        深度思考推理模型，具备严谨思维链（CoT）机理推演
                      </span>
                    </button>
                  </div>

                  {/* 其他通用第三方与私有化模型快速切换 */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-zinc-400 mr-0.5">其他通用模型:</span>
                    {[
                      { name: "qwen-plus", label: "通义千问 Plus" },
                      { name: "qwen-max", label: "通义千问 Max" },
                      { name: "gpt-4o-mini", label: "GPT-4o-mini" },
                      { name: "claude-3-5-sonnet-20241022", label: "Claude-3.5" }
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
                <div className={`p-3 rounded-md text-xs space-y-1 font-mono ${
                  llmTestStatus.status === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                    : 'bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-500/30 text-red-800 dark:text-red-300'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span>{llmTestStatus.status === 'success' ? '✅ 连通校验成功' : '❌ 连接出现异常'}</span>
                    <span>延迟: {llmTestStatus.latency_ms} ms</span>
                  </div>
                  <p className="font-sans text-[11px] leading-relaxed">
                    {llmTestStatus.reply || llmTestStatus.message}
                  </p>
                </div>
              )}
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
