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

echo "================================================================"
echo " 🚀 瓯阀智枢 (OuValve-Ops) 正在启动..."
echo " 🌐 访问地址: http://localhost:8000"
echo " 📚 API 文档: http://localhost:8000/docs"
echo "================================================================"

exec uvicorn ovops.main:app --host 0.0.0.0 --port 8000
