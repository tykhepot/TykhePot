#!/bin/bash

# TykhePot 演示模式快速部署脚本
# 无需 SOL，立即上线展示

set -e

echo "🚀 TykhePot 演示模式部署"
echo "========================="
echo ""

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd ~/Desktop/TykhePot/frontend

echo "📦 步骤 1: 安装依赖..."
npm install 2>&1 | tail -3

echo ""
echo "⚙️  步骤 2: 配置演示模式..."
cp .env.demo .env

echo ""
echo "🔨 步骤 3: 构建..."
npm run build 2>&1 | tail -10

echo ""
echo "📤 步骤 4: 部署到 Vercel..."
if command -v vercel &> /dev/null; then
    vercel --prod --yes
else
    echo -e "${YELLOW}Vercel CLI 未安装${NC}"
    echo "正在安装..."
    npm install -g vercel
    vercel --prod --yes
fi

echo ""
echo -e "${GREEN}✅ 演示模式部署完成！${NC}"
echo ""
echo "访问地址: https://tykhepot.vercel.app"
echo ""
echo "功能:"
echo "  ✅ 完整 UI 展示"
echo "  ✅ 模拟数据"
echo "  ✅ 钱包连接"
echo "  ✅ 所有页面可用"
echo ""
echo "下一步:"
echo "1. 配置自定义域名 tykhepot.com"
echo "2. 获取 SOL 后部署真实合约"
echo "3. 更新为生产模式"
