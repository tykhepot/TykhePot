#!/bin/bash

# TykhePot 一键部署脚本
# 用法: ./deploy.sh [devnet|mainnet]

set -e

NETWORK=${1:-devnet}
echo "🚀 TykhePot 部署脚本"
echo "====================="
echo "网络: $NETWORK"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查依赖
check_dependencies() {
    echo "📦 检查依赖..."
    
    if ! command -v solana &> /dev/null; then
        echo -e "${RED}❌ Solana CLI 未安装${NC}"
        echo "请运行: sh -c \"\$(curl -sSfL https://release.solana.com/v1.17.0/install)\""
        exit 1
    fi
    
    if ! command -v anchor &> /dev/null; then
        echo -e "${RED}❌ Anchor 未安装${NC}"
        echo "请运行: cargo install --git https://github.com/coral-xyz/anchor avm && avm install latest"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 所有依赖已安装${NC}"
    echo ""
}

# 检查钱包
check_wallet() {
    echo "👛 检查钱包..."
    
    solana config get
    
    BALANCE=$(solana balance | awk '{print $1}')
    echo "当前余额: $BALANCE SOL"
    
    if (( $(echo "$BALANCE < 0.5" | bc -l) )); then
        echo -e "${YELLOW}⚠️ 余额不足，正在请求空投...${NC}"
        solana airdrop 2 || echo -e "${RED}空投请求失败，请手动获取${NC}"
    fi
    
    echo ""
}

# 构建合约
build_contract() {
    echo "🔨 构建合约..."
    
    cd smart-contract
    
    echo "安装依赖..."
    npm install
    
    echo "构建 Anchor..."
    anchor build
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 构建失败${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 构建成功${NC}"
    echo ""
    cd ..
}

# 部署合约
deploy_contract() {
    echo "📤 部署合约到 $NETWORK..."
    
    cd smart-contract
    
    if [ "$NETWORK" = "devnet" ]; then
        anchor deploy --provider.cluster devnet
    else
        anchor deploy --provider.cluster mainnet
    fi
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 部署失败${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 部署成功${NC}"
    echo ""
    cd ..
}

# 初始化合约
initialize_contract() {
    echo "🔧 初始化合约..."
    
    cd smart-contract
    
    if [ "$NETWORK" = "devnet" ]; then
        npm run initialize:devnet
    else
        npm run initialize:mainnet
    fi
    
    echo -e "${GREEN}✅ 初始化成功${NC}"
    echo ""
    cd ..
}

# 构建前端
build_frontend() {
    echo "🎨 构建前端..."
    
    cd frontend
    
    echo "安装依赖..."
    npm install
    
    echo "构建..."
    npm run build
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 构建失败${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 构建成功${NC}"
    echo ""
    cd ..
}

# 部署前端 (可选)
deploy_frontend() {
    echo "🌐 部署前端 (Vercel)..."
    
    read -p "是否部署到 Vercel? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd frontend
        
        if ! command -v vercel &> /dev/null; then
            echo "安装 Vercel CLI..."
            npm i -g vercel
        fi
        
        vercel --prod
        cd ..
    fi
    
    echo ""
}

# 验证部署
verify_deployment() {
    echo "✅ 验证部署..."
    
    echo "合约地址:"
    cat smart-contract/deploys/$NETWORK-*.json | grep programId
    
    echo ""
    echo "Token 地址:"
    cat smart-contract/deploys/$NETWORK-*.json | grep tokenMint
    
    echo ""
    echo "在 Solscan 查看:"
    if [ "$NETWORK" = "devnet" ]; then
        echo "https://solscan.io/?cluster=devnet"
    else
        echo "https://solscan.io/"
    fi
    
    echo ""
}

# 主流程
main() {
    check_dependencies
    check_wallet
    build_contract
    deploy_contract
    initialize_contract
    build_frontend
    deploy_frontend
    verify_deployment
    
    echo -e "${GREEN}🎉 部署完成!${NC}"
    echo ""
    echo "下一步:"
    echo "1. 在 Solscan 验证合约"
    echo "2. 配置前端环境变量"
    echo "3. 测试所有功能"
    echo "4. 启动推广"
}

# 执行
main
