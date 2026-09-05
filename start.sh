#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

if [ ! -d ".venv" ]; then
    echo "⚠️ 未发现虚拟环境，正在创建..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -e .
else
    source .venv/bin/activate
fi

# 检查前端构建产物
if [ ! -d "web/dist" ]; then
    echo "⚠️ 未检测到前端静态包 web/dist，正在自动构建..."
    if command -v npm >/dev/null 2>&1; then
        (cd web && npm install && npm run build)
    else
        echo "❌ 未检测到 npm，请先安装 Node.js (>=18) 并执行 cd web && npm install && npm run build"
    fi
fi

echo "================================================================"
echo " 🚀 瓯阀智枢 (OuValve-Ops) 正在启动..."
echo " 🌐 工业数字孪生大屏: http://localhost:8000"
echo " 📚 OpenAPI 交互文档: http://localhost:8000/docs"
echo "================================================================"

exec uvicorn ovops.main:app --host 0.0.0.0 --port 8000 --reload
