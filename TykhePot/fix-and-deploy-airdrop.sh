#!/bin/bash

# TykhePot AIRDROP_VAULT 修复和部署脚本
# 问题：AIRDROP_VAULT的owner是Token程序而不是global_state PDA
# 解决方案：在initialize时设置正确的authority

set -e

NETWORK="${1:-devnet}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔧 TykhePot AIRDROP_VAULT 修复脚本"
echo "==========================================="
echo ""
echo "网络: $NETWORK"
echo ""

# 检查修改
echo "📋 检查合约修改..."
echo ""

if grep -q "SetAuthority" "$PROJECT_ROOT/smart-contract/programs/royalpot/src/lib.rs"; then
    echo -e "${GREEN}✅${NC} SetAuthority已添加到导入"
else
    echo -e "${RED}❌${NC} SetAuthority未找到"
    exit 1
fi

if grep -q "#\[account(mut)\]" "$PROJECT_ROOT/smart-contract/programs/royalpot/src/lib.rs" | grep -A2 "airdrop_vault"; then
    echo -e "${GREEN}✅${NC} airdrop_vault已设置为mut账户"
else
    echo -e "${RED}❌${NC} airdrop_vault未设置为mut"
    exit 1
fi

if grep -q "token::set_authority" "$PROJECT_ROOT/smart-contract/programs/royalpot/src/lib.rs"; then
    echo -e "${GREEN}✅${NC} set_authority代码已添加"
else
    echo -e "${RED}❌${NC} set_authority代码未找到"
    exit 1
fi

echo ""
echo "✅ 所有修改已验证"
echo ""
echo "📝 修改说明："
echo "  1. 导入SetAuthority指令"
echo "  2. airdrop_vault改为mut账户"
echo "  3. initialize中添加set_authority调用"
echo "  4. 将AIRDROP_VAULT的authority设置为global_state PDA"
echo ""
echo "这将允许程序正确地从AIRDROP_VAULT转账TPOT到pool vault"
echo ""
