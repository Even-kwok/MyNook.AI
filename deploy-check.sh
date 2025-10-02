#!/bin/bash

# 🚀 AI Studio 部署前检查脚本

echo "🔍 开始部署前检查..."

# 检查Node.js版本
echo "📦 检查Node.js版本..."
node_version=$(node -v)
echo "Node.js版本: $node_version"

# 检查npm版本
echo "📦 检查npm版本..."
npm_version=$(npm -v)
echo "npm版本: $npm_version"

# 检查环境变量文件
echo "🔧 检查环境变量..."
if [ -f ".env.local" ]; then
    echo "✅ .env.local 文件存在"
else
    echo "❌ .env.local 文件不存在，请创建并配置环境变量"
    exit 1
fi

# 检查必要的环境变量
required_vars=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY" "VITE_GEMINI_API_KEY")
for var in "${required_vars[@]}"; do
    if grep -q "$var" .env.local; then
        echo "✅ $var 已配置"
    else
        echo "❌ $var 未配置"
        exit 1
    fi
done

# 安装依赖
echo "📦 安装依赖..."
npm ci

# 运行类型检查
echo "🔍 运行TypeScript类型检查..."
npx tsc --noEmit
if [ $? -eq 0 ]; then
    echo "✅ TypeScript类型检查通过"
else
    echo "❌ TypeScript类型检查失败"
    exit 1
fi

# 运行构建
echo "🏗️ 运行构建..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ 构建成功"
else
    echo "❌ 构建失败"
    exit 1
fi

# 检查构建产物
echo "📁 检查构建产物..."
if [ -d "dist" ]; then
    echo "✅ dist目录存在"
    dist_size=$(du -sh dist | cut -f1)
    echo "📊 构建产物大小: $dist_size"
else
    echo "❌ dist目录不存在"
    exit 1
fi

# 检查关键文件
critical_files=("dist/index.html" "dist/assets")
for file in "${critical_files[@]}"; do
    if [ -e "dist/$file" ] || [ -d "dist/$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 不存在"
        exit 1
    fi
done

echo ""
echo "🎉 所有检查通过！准备部署..."
echo ""
echo "📋 下一步操作："
echo "1. 将代码推送到GitHub"
echo "2. 在Vercel/Netlify中连接仓库"
echo "3. 配置环境变量"
echo "4. 部署并测试"
echo ""

