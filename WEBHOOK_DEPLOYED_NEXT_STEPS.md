# ✅ Webhook 已成功部署！

## 🎉 部署成功

你的 Creem Webhook Edge Function 已经成功部署到 Supabase！

**Webhook URL**:
```
https://tftjmzhywyioysnjanmf.supabase.co/functions/v1/creem-webhook
```

---

## 📋 接下来的步骤

### 步骤 1: 获取 Creem Webhook Secret（5 分钟）

1. **打开 Creem Dashboard**
   - 访问: https://www.creem.io/dashboard

2. **进入 Webhooks 设置**
   - 点击左侧菜单的 **"Developers"** 或 **"Webhooks"**

3. **创建或查看 Webhook 端点**
   - 点击 **"Add Endpoint"** 或 **"Create Webhook"**
   - 或者如果已有端点，点击查看

4. **复制 Webhook Secret**
   - 找到 "Webhook Secret" 或 "Signing Secret"
   - 格式类似: `whsec_abcdefghijklmnopqrstuvwxyz1234567890`
   - **复制这个 Secret**

---

### 步骤 2: 配置 Webhook Secret 到 Supabase（2 分钟）

在 PowerShell 中运行（替换为你的实际 Secret）:

```powershell
supabase secrets set CREEM_WEBHOOK_SECRET=whsec_你的实际secret
```

**示例**:
```powershell
supabase secrets set CREEM_WEBHOOK_SECRET=whsec_abc123xyz789
```

**验证设置成功**:
```powershell
supabase secrets list
```

应该看到 `CREEM_WEBHOOK_SECRET` 在列表中。

---

### 步骤 3: 在 Creem 配置 Webhook URL（3 分钟）

回到 Creem Dashboard:

1. **填写 Endpoint URL**:
   ```
   https://tftjmzhywyioysnjanmf.supabase.co/functions/v1/creem-webhook
   ```

2. **选择事件类型**，至少包括:
   - ✅ `subscription.created` - 订阅创建
   - ✅ `subscription.updated` - 订阅更新
   - ✅ `subscription.renewed` - 订阅续期
   - ✅ `subscription.cancelled` - 订阅取消
   - ✅ `charge.succeeded` - 支付成功
   
   **或者直接选择 "All events"（推荐）**

3. **保存端点**

4. **测试连接**
   - 点击 "Send test event" 或 "Test"
   - 检查是否返回 200 OK

---

### 步骤 4: 测试完整流程（5 分钟）

1. **在你的网站上测试订阅购买**:
   - 访问 `http://localhost:3001/?page=pricing`
   - 点击任意套餐的 "Subscribe"
   - 使用测试卡完成支付 (4242 4242 4242 4242)

2. **检查 Supabase 数据库**:
   - 打开 Supabase Dashboard → Table Editor
   - 查看 `subscriptions` 表 - 应该有新记录
   - 查看 `user_profiles` 表 - `subscription_tier` 应该已更新，`credits` 应该增加
   - 查看 `credit_transactions` 表 - 应该有交易记录

3. **检查 Edge Function 日志**:
   - Supabase Dashboard → Edge Functions → creem-webhook → Logs
   - 应该看到处理日志

---

## 🔍 如何查看 Edge Function 日志

### 方法 1: Dashboard（推荐）
1. 访问 https://supabase.com/dashboard/project/tftjmzhywyioysnjanmf/functions
2. 点击 `creem-webhook`
3. 点击 **Logs** 标签
4. 查看实时日志

### 方法 2: CLI
```powershell
supabase functions logs creem-webhook --follow
```

**预期日志**（支付成功后）:
```
📨 Received webhook event: subscription.created
📦 Processing subscription event: subscription.created
✅ Subscription activated: pro (yearly) for user abc123
```

---

## ⚠️ 故障排除

### 问题 1: Webhook 返回 401
**原因**: Webhook Secret 未配置或不正确

**解决**:
```powershell
# 重新设置 secret
supabase secrets set CREEM_WEBHOOK_SECRET=whsec_正确的secret

# 不需要重新部署，Secret 会自动更新
```

---

### 问题 2: Webhook 返回 500
**原因**: Edge Function 代码错误或数据库问题

**解决**:
1. 查看 Edge Function 日志
2. 检查数据库表结构是否正确
3. 确认 RLS 策略允许更新

---

### 问题 3: 数据库未更新
**原因**: Webhook 收到但处理失败

**诊断**:
1. 查看 Creem Dashboard → Webhooks → Recent Deliveries
2. 查看 Supabase Edge Function 日志
3. 手动查询数据库确认

---

## ✅ 完成检查清单

- [ ] Edge Function 已部署 ✅
- [ ] Webhook Secret 已获取
- [ ] Secret 已配置到 Supabase
- [ ] Webhook URL 已添加到 Creem
- [ ] 测试事件返回 200 OK
- [ ] 实际支付测试成功
- [ ] 订阅状态已更新
- [ ] 积分已增加
- [ ] 交易记录已创建

---

## 🎯 下一步

完成 Webhook 配置后，你的支付系统就完全可用了！

**建议的后续工作**:
1. ✅ 测试所有订阅套餐（Pro, Premium, Business）
2. ✅ 测试积分包购买
3. ✅ 测试订阅取消流程
4. ✅ 监控 Edge Function 日志
5. ✅ 准备生产环境配置（Live Mode）

---

**创建时间**: 2025-01-02  
**状态**: Webhook 已部署，等待配置 Secret



