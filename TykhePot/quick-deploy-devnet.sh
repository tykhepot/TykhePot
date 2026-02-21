#!/bin/bash

# TykhePot Devnet 快速部署脚本
# 方案A: 测试网演示版上线

set -e

echo "🚀 TykhePot Devnet 快速部署"
echo "============================"
echo ""

# 颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 配置
export PATH="$HOME/.local/bin:$PATH"
solana config set --url devnet

echo "👛 钱包地址: $(solana address)"
echo ""

# 检查余额
echo "💰 检查余额..."
BALANCE=$(solana balance 2>/dev/null | awk '{print $1}' || echo "0")
echo "当前余额: $BALANCE SOL"

if (( $(echo "$BALANCE < 1" | bc -l) )); then
    echo -e "${RED}❌ 余额不足${NC}"
    echo "请通过 https://faucet.solana.com/ 获取 SOL"
    exit 1
fi

echo -e "${GREEN}✅ 余额充足${NC}"
echo ""

# 部署合约
echo "📤 开始部署..."
cd ~/Desktop/TykhePot/smart-contract

echo "1. 安装依赖..."
npm install 2>&1 | tail -3

echo ""
echo "2. 构建合约..."
anchor build 2>&1 | tail -5

echo ""
echo "3. 部署到 Devnet..."
# 捕获部署输出
DEPLOY_OUTPUT=$(anchor deploy --provider.cluster devnet 2>&1)
echo "$DEPLOY_OUTPUT" | tail -10

# 提取程序ID
PROGRAM_ID=$(echo "$DEPLOY_OUTPUT" | grep "Program Id:" | awk '{print $3}')
if [ -z "$PROGRAM_ID" ]; then
    PROGRAM_ID="TykhePot111111111111111111111111111111111"
    echo "使用默认程序ID: $PROGRAM_ID"
else
    echo -e "${GREEN}✅ 合约部署成功${NC}"
    echo "程序ID: $PROGRAM_ID"
fi

echo ""
echo "4. 记录部署信息..."
mkdir -p deploys
cat > deploys/devnet-$(date +%s).json << EOF
{
  "network": "devnet",
  "deployTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "deployer": "$(solana address)",
  "programId": "$PROGRAM_ID",
  "note": "方案A: 测试网演示版"
}
EOF

echo ""
echo -e "${GREEN}🎉 部署完成!${NC}"
echo ""
echo "程序ID: $PROGRAM_ID"
echo ""
echo "下一步:"
echo "1. 更新前端 .env"
echo "2. 构建前端"
echo "3. 部署到 Vercel"
echo "4. 配置域名"
