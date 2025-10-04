#!/bin/bash

# 多设备同步脚本
# 在切换设备或开始工作前运行

echo "🔄 开始同步多设备开发环境..."

# 检查当前分支
current_branch=$(git branch --show-current)
echo "📍 当前分支: $current_branch"

# 1. 拉取最新代码
echo "📥 拉取最新代码..."
git fetch origin

# 2. 检查是否有未提交的更改
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  检测到未提交的更改"
    echo "选择操作:"
    echo "1) 提交更改"
    echo "2) 暂存更改"
    echo "3) 丢弃更改"
    read -p "请选择 (1-3): " choice
    
    case $choice in
        1)
            read -p "请输入提交信息: " commit_msg
            git add .
            git commit -m "$commit_msg"
            ;;
        2)
            git stash push -m "临时保存 $(date)"
            echo "✅ 更改已暂存"
            ;;
        3)
            git reset --hard HEAD
            echo "⚠️  未提交的更改已丢弃"
            ;;
        *)
            echo "❌ 无效选择，退出"
            exit 1
            ;;
    esac
fi

# 3. 拉取远程更改
echo "📥 拉取远程更改..."
git pull origin $current_branch

# 4. 检查是否有暂存的更改
if git stash list | grep -q "stash@{0}"; then
    echo "📦 发现暂存的更改"
    read -p "是否恢复暂存的更改? (y/n): " restore
    if [ "$restore" = "y" ]; then
        git stash pop
        echo "✅ 暂存的更改已恢复"
    fi
fi

# 5. 显示状态
echo ""
echo "📊 当前状态:"
git status --short
echo ""
echo "📈 最近提交:"
git log --oneline -5

echo ""
echo "✅ 同步完成！可以开始开发了"
