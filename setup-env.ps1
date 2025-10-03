# ===================================
# HomeVision AI - 环境变量配置脚本
# ===================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  HomeVision AI - 环境变量配置向导" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 检查 .env.local 是否已存在
if (Test-Path ".env.local") {
    Write-Host "⚠️  检测到现有的 .env.local 文件" -ForegroundColor Yellow
    $overwrite = Read-Host "是否要覆盖现有配置？(y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "❌ 已取消配置" -ForegroundColor Red
        exit
    }
    Write-Host ""
}

Write-Host "📝 请输入以下配置信息（按 Enter 使用默认值）：" -ForegroundColor Green
Write-Host ""

# ===================================
# Gemini API Key
# ===================================
Write-Host "1️⃣  Gemini API Key" -ForegroundColor Yellow
Write-Host "   获取地址: https://aistudio.google.com/apikey" -ForegroundColor Gray
$geminiKey = Read-Host "   请输入 Gemini API Key"

# ===================================
# Supabase Configuration
# ===================================
Write-Host ""
Write-Host "2️⃣  Supabase Project URL" -ForegroundColor Yellow
Write-Host "   示例: https://tftjmzhywyioysnjanmf.supabase.co" -ForegroundColor Gray
$supabaseUrl = Read-Host "   请输入 Supabase URL"

Write-Host ""
Write-Host "3️⃣  Supabase Anon Key" -ForegroundColor Yellow
Write-Host "   在 Supabase Dashboard → Settings → API → anon public" -ForegroundColor Gray
$supabaseKey = Read-Host "   请输入 Supabase Anon Key"

# ===================================
# Creem API Key
# ===================================
Write-Host ""
Write-Host "4️⃣  Creem API Key" -ForegroundColor Yellow
Write-Host "   默认值: creem_TrKvWJbdKBWnKqvBAopAa" -ForegroundColor Gray
$creemKey = Read-Host "   请输入 Creem API Key (或按 Enter 使用默认值)"
if ([string]::IsNullOrWhiteSpace($creemKey)) {
    $creemKey = "creem_TrKvWJbdKBWnKqvBAopAa"
}

# ===================================
# 验证输入
# ===================================
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  配置摘要" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$hasError = $false

# 验证 Gemini API Key
if ([string]::IsNullOrWhiteSpace($geminiKey)) {
    Write-Host "❌ Gemini API Key: 未提供" -ForegroundColor Red
    $hasError = $true
} elseif ($geminiKey -match "^AIza[A-Za-z0-9_-]{35}$") {
    Write-Host "✅ Gemini API Key: $($geminiKey.Substring(0, 10))..." -ForegroundColor Green
} else {
    Write-Host "⚠️  Gemini API Key: $($geminiKey.Substring(0, [Math]::Min(10, $geminiKey.Length)))... (格式可能不正确)" -ForegroundColor Yellow
}

# 验证 Supabase URL
if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
    Write-Host "❌ Supabase URL: 未提供" -ForegroundColor Red
    $hasError = $true
} elseif ($supabaseUrl -match "^https://[a-zA-Z0-9]+\.supabase\.co$") {
    Write-Host "✅ Supabase URL: $supabaseUrl" -ForegroundColor Green
} else {
    Write-Host "⚠️  Supabase URL: $supabaseUrl (格式可能不正确)" -ForegroundColor Yellow
}

# 验证 Supabase Anon Key
if ([string]::IsNullOrWhiteSpace($supabaseKey)) {
    Write-Host "❌ Supabase Anon Key: 未提供" -ForegroundColor Red
    $hasError = $true
} else {
    Write-Host "✅ Supabase Anon Key: $($supabaseKey.Substring(0, 20))..." -ForegroundColor Green
}

# 验证 Creem API Key
if ([string]::IsNullOrWhiteSpace($creemKey)) {
    Write-Host "❌ Creem API Key: 未提供" -ForegroundColor Red
    $hasError = $true
} elseif ($creemKey -match "^creem_[A-Za-z0-9]+$") {
    Write-Host "✅ Creem API Key: $creemKey" -ForegroundColor Green
} else {
    Write-Host "⚠️  Creem API Key: $creemKey (格式可能不正确)" -ForegroundColor Yellow
}

Write-Host ""

# 如果有错误，提示用户
if ($hasError) {
    Write-Host "❌ 配置不完整，无法继续" -ForegroundColor Red
    Write-Host "   请确保所有必需的配置都已提供" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "按 Enter 键退出"
    exit 1
}

# 确认写入
$confirm = Read-Host "是否写入配置到 .env.local？(Y/n)"
if ($confirm -eq "n" -or $confirm -eq "N") {
    Write-Host "❌ 已取消配置" -ForegroundColor Red
    exit
}

# ===================================
# 写入 .env.local 文件
# ===================================
$envContent = @"
# ===================================
# Google Gemini API
# ===================================
# 用于 AI 图片生成和 AI Design Advisor
# 获取地址: https://aistudio.google.com/apikey
GEMINI_API_KEY=$geminiKey

# ===================================
# Supabase Configuration
# ===================================
# 数据库、认证、存储服务
# 获取地址: https://supabase.com/dashboard/project/你的项目ID/settings/api
VITE_SUPABASE_URL=$supabaseUrl
VITE_SUPABASE_ANON_KEY=$supabaseKey

# ===================================
# Creem Payment Platform
# ===================================
# 支付和订阅管理（Merchant of Record）
# 获取地址: https://www.creem.io/dashboard
VITE_CREEM_API_KEY=$creemKey

# ===================================
# RevenueCat (已弃用 - 被 Creem 替代)
# ===================================
# 如果你仍想使用 RevenueCat，取消注释下面这行
# VITE_REVENUECAT_PUBLIC_KEY=你的_RevenueCat_公钥

# ===================================
# 自动生成时间: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ===================================
"@

try {
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8 -NoNewline
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "  ✅ 配置成功！" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📄 配置文件已保存到: .env.local" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🚀 下一步：" -ForegroundColor Yellow
    Write-Host "   1. 重启开发服务器（如果正在运行）" -ForegroundColor White
    Write-Host "      Ctrl+C 停止，然后运行: npm run dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2. 验证配置" -ForegroundColor White
    Write-Host "      打开浏览器控制台，查看 Creem Service 初始化日志" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   3. 测试支付功能" -ForegroundColor White
    Write-Host "      访问 Pricing 页面，点击订阅按钮" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "❌ 写入配置文件失败: $_" -ForegroundColor Red
    Write-Host ""
    Read-Host "按 Enter 键退出"
    exit 1
}

Write-Host ""
Read-Host "按 Enter 键退出"



