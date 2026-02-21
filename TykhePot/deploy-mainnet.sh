#!/bin/bash

# TykhePot 主网部署脚本
# 用法: ./deploy-mainnet.sh

set -e

echo "🚀 TykhePot 主网部署"
echo "====================="
echo "⚠️  警告: 这将部署到 Solana 主网，消耗真实 SOL"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 确认
read -p "是否继续? (输入 'DEPLOY' 确认): " CONFIRM
if [ "$CONFIRM" != "DEPLOY" ]; then
    echo "取消部署"
    exit 0
fi

# 配置主网
echo "🔗 配置主网环境..."
solana config set --url mainnet-beta
echo ""

# 检查余额
echo "💰 检查余额..."
BALANCE=$(solana balance | awk '{print $1}')
echo "当前余额: $BALANCE SOL"

if (( $(echo "$BALANCE < 2" | bc -l) )); then
    echo -e "${RED}❌ 余额不足，需要至少 2 SOL${NC}"
    echo "请从交易所提取 SOL 到钱包"
    exit 1
fi

echo -e "${GREEN}✅ 余额充足${NC}"
echo ""

# 创建代币
echo "🪙 创建 TPOT 代币..."
cd smart-contract

# 检查是否已有代币配置
if [ -f "deploys/token-mint-mainnet.txt" ]; then
    TOKEN_MINT=$(cat deploys/token-mint-mainnet.txt)
    echo "使用已有代币: $TOKEN_MINT"
else
    echo "创建新代币..."
    # TOKEN_MINT=$(spl-token create-token --decimals 9 | grep "Creating token" | awk '{print $3}')
    # echo $TOKEN_MINT > deploys/token-mint-mainnet.txt
    echo "请手动创建代币并记录地址"
fi

echo ""

# 构建合约
echo "🔨 构建合约..."
anchor build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 构建失败${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 构建成功${NC}"
echo ""

# 部署合约
echo "📤 部署合约到主网..."
echo "这将消耗约 0.5-1 SOL"
read -p "确认部署? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    anchor deploy --provider.cluster mainnet
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 部署失败${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 部署成功${NC}"
fi
echo ""

# 记录部署信息
echo "📝 记录部署信息..."
mkdir -p deploys
cat > deploys/mainnet-$(date +%s).json << EOF
{
  "network": "mainnet",
  "deployTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "deployer": "$(solana address)",
  "tokenMint": "$TOKEN_MINT",
  "note": "需要手动更新 programId 和 statePDA"
}
EOF

echo ""
echo -e "${GREEN}🎉 主网部署完成!${NC}"
echo ""
echo "重要提示:"
echo "1. 记录程序 ID 和代币地址"
echo "2. 更新前端 .env 配置"
echo "3. 铸造 TPOT 代币"
echo "4. 初始化合约"
echo "5. 建立流动性（可选）"
echo "6. 配置域名"
echo ""
echo "⚠️  建议先小金额测试，确认无误后再全面开放"
