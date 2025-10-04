# 多设备开发设置指南

## 🚀 快速设置步骤

### 1. Git用户配置 (每台设备都需要)
```bash
# 设置你的身份信息
git config --global user.name "你的真实姓名"
git config --global user.email "你的邮箱@example.com"

# 验证配置
git config --list | grep user
```

### 2. 认证设置 (推荐使用SSH)

#### 选项A: SSH密钥 (推荐)
```bash
# 生成SSH密钥
ssh-keygen -t ed25519 -C "your.email@example.com"

# 添加到SSH代理
ssh-add ~/.ssh/id_ed25519

# 复制公钥到剪贴板
cat ~/.ssh/id_ed25519.pub | pbcopy

# 在GitHub上添加SSH密钥: Settings > SSH and GPG keys > New SSH key
```

#### 选项B: Personal Access Token
```bash
# 在GitHub上生成Personal Access Token
# Settings > Developer settings > Personal access tokens > Tokens (classic)

# 使用token作为密码
git remote set-url origin https://github.com/Even-kwok/MyNook.AI.git
```

### 3. 分支工作流设置

#### 在每台设备上执行:
```bash
# 克隆项目 (如果是新设备)
git clone https://github.com/Even-kwok/MyNook.AI.git
cd MyNook.AI

# 或者拉取最新代码 (如果已有项目)
git fetch origin

# 切换到开发分支
git checkout develop
git pull origin develop

# 创建功能分支
git checkout -b feature/your-feature-name

# 设置上游跟踪
git push -u origin feature/your-feature-name
```

## 🔄 日常开发工作流

### 开始工作前 (每台设备)
```bash
# 1. 拉取最新代码
git fetch origin

# 2. 切换到你的功能分支
git checkout feature/your-feature-name

# 3. 拉取最新更改
git pull origin feature/your-feature-name
```

### 完成工作后
```bash
# 1. 添加更改
git add .

# 2. 提交更改
git commit -m "描述你的更改"

# 3. 推送到远程
git push origin feature/your-feature-name
```

### 切换设备时
```bash
# 1. 拉取最新代码
git pull origin feature/your-feature-name

# 2. 继续开发
# ... 你的开发工作 ...

# 3. 提交并推送
git add .
git commit -m "继续开发: 描述更改"
git push origin feature/your-feature-name
```

## 📋 最佳实践

### 1. 提交规范
```bash
# 使用清晰的提交信息
git commit -m "feat: 添加新功能"
git commit -m "fix: 修复bug"
git commit -m "docs: 更新文档"
git commit -m "style: 代码格式调整"
```

### 2. 分支命名规范
- `feature/功能名称` - 新功能
- `fix/问题描述` - Bug修复
- `hotfix/紧急修复` - 紧急修复
- `refactor/重构内容` - 代码重构

### 3. 冲突解决
```bash
# 当出现冲突时
git pull origin feature/your-feature-name

# 如果有冲突，手动解决后
git add .
git commit -m "解决合并冲突"
git push origin feature/your-feature-name
```

## 🛠️ 常用命令速查

```bash
# 查看分支状态
git status
git branch -a

# 查看提交历史
git log --oneline

# 查看远程仓库
git remote -v

# 强制同步远程分支
git fetch origin
git reset --hard origin/feature/your-feature-name

# 删除本地分支
git branch -d feature/old-feature

# 删除远程分支
git push origin --delete feature/old-feature
```

## ⚠️ 注意事项

1. **总是先拉取再推送** - 避免冲突
2. **频繁提交** - 小步快跑，避免大文件丢失
3. **使用描述性提交信息** - 方便追踪更改
4. **定期同步** - 每天开始工作前先同步
5. **备份重要更改** - 重要功能完成后及时合并到develop

## 🔧 故障排除

### 如果推送失败
```bash
# 检查网络连接
ping github.com

# 检查认证
ssh -T git@github.com

# 重新设置远程URL
git remote set-url origin git@github.com:Even-kwok/MyNook.AI.git
```

### 如果分支不同步
```bash
# 强制同步
git fetch origin
git reset --hard origin/feature/your-feature-name
```

### 如果丢失了更改
```bash
# 查看reflog
git reflog

# 恢复特定提交
git checkout <commit-hash>
```
