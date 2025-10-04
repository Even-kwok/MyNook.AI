#!/bin/bash

# 多设备开发快速设置脚本
# 在每台新设备上运行此脚本

echo "🚀 开始设置多设备开发环境..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 1. 设置Git用户信息
echo "📝 配置Git用户信息..."
read -p "请输入你的姓名: " username
read -p "请输入你的邮箱: " email

git config --global user.name "$username"
git config --global user.email "$email"

echo "✅ Git用户信息已设置"

# 2. 检查SSH密钥
echo "🔑 检查SSH密钥..."
if [ ! -f ~/.ssh/id_ed25519 ]; then
    echo "生成新的SSH密钥..."
    ssh-keygen -t ed25519 -C "$email" -f ~/.ssh/id_ed25519 -N ""
    ssh-add ~/.ssh/id_ed25519
    echo "📋 请将以下公钥添加到GitHub:"
    echo "---"
    cat ~/.ssh/id_ed25519.pub
    echo "---"
    echo "🔗 GitHub设置链接: https://github.com/settings/ssh/new"
    read -p "按回车键继续..."
else
    echo "✅ SSH密钥已存在"
fi

# 3. 测试GitHub连接
echo "🌐 测试GitHub连接..."
if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    echo "✅ GitHub连接成功"
else
    echo "❌ GitHub连接失败，请检查SSH密钥设置"
    exit 1
fi

# 4. 设置远程URL为SSH
echo "🔗 设置远程URL..."
git remote set-url origin git@github.com:Even-kwok/MyNook.AI.git

# 5. 拉取最新代码
echo "📥 拉取最新代码..."
git fetch origin

# 6. 设置分支跟踪
echo "🌿 设置分支跟踪..."
git checkout develop
git branch --set-upstream-to=origin/develop develop
git pull origin develop

# 7. 创建功能分支
echo "🛠️ 创建功能分支..."
read -p "请输入功能分支名称 (例如: feature/new-ui): " feature_name
git checkout -b "$feature_name"
git push -u origin "$feature_name"

echo "🎉 多设备开发环境设置完成！"
echo ""
echo "📋 下一步:"
echo "1. 开始开发你的功能"
echo "2. 使用 'git add .' 添加更改"
echo "3. 使用 'git commit -m \"描述\"' 提交更改"
echo "4. 使用 'git push' 推送到远程"
echo ""
echo "🔄 切换设备时记得先运行:"
echo "git pull origin $feature_name"
