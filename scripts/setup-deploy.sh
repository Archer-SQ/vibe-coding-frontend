#!/bin/bash

# 自动部署设置脚本
# 此脚本帮助您快速获取Vercel配置信息

set -e

echo "🚀 开始设置自动部署配置..."
echo ""

# 检查是否安装了Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ 未检测到Vercel CLI，正在安装..."
    npm install -g vercel@latest
    echo "✅ Vercel CLI安装完成"
else
    echo "✅ 检测到Vercel CLI"
fi

echo ""

# 检查是否已登录Vercel
echo "🔐 检查Vercel登录状态..."
if ! vercel whoami &> /dev/null; then
    echo "❌ 未登录Vercel，请先登录"
    vercel login
else
    echo "✅ 已登录Vercel"
fi

echo ""

# 链接项目
echo "🔗 链接Vercel项目..."
if [ ! -f ".vercel/project.json" ]; then
    echo "正在链接项目，请选择正确的项目..."
    vercel link
else
    echo "✅ 项目已链接"
fi

echo ""

# 读取项目配置
if [ -f ".vercel/project.json" ]; then
    PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
    ORG_ID=$(cat .vercel/project.json | grep -o '"orgId":"[^"]*' | cut -d'"' -f4)
    
    echo "📋 请将以下信息添加到GitHub Secrets:"
    echo ""
    echo "┌─────────────────────────────────────────────────────────────┐"
    echo "│                    GitHub Secrets 配置                      │"
    echo "├─────────────────────────────────────────────────────────────┤"
    echo "│ Secret名称: VERCEL_PROJECT_ID                               │"
    echo "│ 值: $PROJECT_ID"
    echo "├─────────────────────────────────────────────────────────────┤"
    echo "│ Secret名称: VERCEL_ORG_ID                                   │"
    echo "│ 值: $ORG_ID"
    echo "├─────────────────────────────────────────────────────────────┤"
    echo "│ Secret名称: VERCEL_TOKEN                                    │"
    echo "│ 值: [需要在Vercel Dashboard中生成]                          │"
    echo "└─────────────────────────────────────────────────────────────┘"
    echo ""
    echo "📖 详细配置步骤请参考: docs/auto-deploy-setup.md"
    echo ""
    echo "🔑 获取VERCEL_TOKEN的步骤:"
    echo "   1. 访问 https://vercel.com/account/tokens"
    echo "   2. 点击 'Create Token'"
    echo "   3. 输入Token名称（如: github-actions）"
    echo "   4. 选择过期时间"
    echo "   5. 复制生成的Token"
    echo ""
    echo "⚙️  配置GitHub Secrets的步骤:"
    echo "   1. 打开GitHub仓库页面"
    echo "   2. 点击 Settings → Secrets and variables → Actions"
    echo "   3. 点击 'New repository secret'"
    echo "   4. 添加上述三个Secret"
    echo ""
    echo "✅ 配置完成后，推送代码到main分支即可触发自动部署！"
else
    echo "❌ 无法读取项目配置，请确保已正确链接项目"
    exit 1
fi

echo ""
echo "🎉 设置完成！"