# 🔧 修复用户显示问题

## 🐛 问题描述

**症状**: 后台用户管理只显示 1 个用户，但实际有 2 个用户（123@123、4835300@qq.com）

**可能原因**: 
1. ❌ 其中一个用户在 `auth.users` 表中存在，但在 `user_profiles` 表中没有对应记录
2. ❌ RLS 策略阻止了某些用户显示
3. ❌ 用户注册时自动创建 profile 的触发器没有正常工作

---

## 🔍 诊断步骤

### 第 1 步: 运行诊断脚本

1. **登录 Supabase Dashboard**
   - https://supabase.com

2. **打开 SQL Editor**
   - 左侧菜单 → SQL Editor → New Query

3. **复制并运行 `diagnose_users.sql`**

4. **查看结果**

---

### 预期输出示例

#### A. 如果两个用户都有 profile 记录
```
=== Auth Users ===
id                                   | email              | created_at
-------------------------------------|--------------------|-----------
abc123...                            | 123@123            | 2025-10-01
def456...                            | 4835300@qq.com     | 2025-09-30

=== User Profiles ===
id                                   | email              | role  | subscription_tier
-------------------------------------|--------------------| ------|-------------------
abc123...                            | 123@123            | user  | free
def456...                            | 4835300@qq.com     | admin | free

=== Missing Profiles ===
id                                   | email              | profile_status
-------------------------------------|--------------------|-----------------
abc123...                            | 123@123            | ✅ 有 profile 记录
def456...                            | 4835300@qq.com     | ✅ 有 profile 记录
```

✅ **如果看到这样的结果**: 两个用户都有 profile，问题可能是 RLS 策略或前端代码。

---

#### B. 如果有用户缺少 profile 记录（最可能的情况）
```
=== Auth Users ===
id                                   | email              | created_at
-------------------------------------|--------------------|-----------
abc123...                            | 123@123            | 2025-10-01
def456...                            | 4835300@qq.com     | 2025-09-30

=== User Profiles ===
id                                   | email              | role  | subscription_tier
-------------------------------------|--------------------| ------|-------------------
def456...                            | 4835300@qq.com     | admin | free

=== Missing Profiles ===
id                                   | email              | profile_status
-------------------------------------|--------------------|-----------------
abc123...                            | 123@123            | ❌ 缺少 profile 记录  ← 问题在这里！
def456...                            | 4835300@qq.com     | ✅ 有 profile 记录

=== Statistics ===
metric                               | count
-------------------------------------|-------
auth.users 中的用户数                 | 2
user_profiles 中的用户数              | 1
缺少 profile 的用户数                 | 1      ← 证实了问题
```

❌ **如果看到这样的结果**: 有用户缺少 profile 记录，需要运行修复脚本。

---

## ✅ 修复方案

### 方案 1: 自动修复（推荐）

在 Supabase SQL Editor 运行以下脚本：

```sql
-- 为所有缺少 profile 的用户自动创建记录
INSERT INTO public.user_profiles (id, email, display_name, role, subscription_tier, credits)
SELECT 
  au.id,
  au.email,
  NULL as display_name,
  'user' as role,
  'free' as subscription_tier,
  10 as credits
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 验证修复结果
SELECT id, email, role, subscription_tier, credits
FROM public.user_profiles
ORDER BY created_at DESC;
```

**预期结果**:
```
id                                   | email              | role  | subscription_tier | credits
-------------------------------------|--------------------| ------|-------------------|--------
abc123...                            | 123@123            | user  | free              | 10
def456...                            | 4835300@qq.com     | admin | free              | 10
```

✅ 现在应该看到 2 个用户！

---

### 方案 2: 手动创建（如果自动修复失败）

如果知道缺少的用户 ID，可以手动插入：

```sql
-- 获取缺少的用户信息
SELECT id, email FROM auth.users 
WHERE id NOT IN (SELECT id FROM user_profiles);

-- 假设缺少的用户 ID 是 'user-id-here'
INSERT INTO public.user_profiles (id, email, display_name, role, subscription_tier, credits)
VALUES (
  'user-id-here',           -- 替换为实际的用户 ID
  '123@123',                -- 替换为实际的 email
  NULL,                     -- 显示名称（可选）
  'user',                   -- 角色
  'free',                   -- 订阅套餐
  10                        -- 初始积分
);
```

---

### 方案 3: 修复注册触发器（防止未来问题）

检查并创建自动创建 profile 的触发器：

```sql
-- 1. 检查触发器是否存在
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_schema = 'auth';

-- 2. 如果触发器不存在，创建它
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name, role, subscription_tier, credits)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name',
    'user',
    'free',
    10
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**注意**: Supabase 可能不允许直接在 `auth.users` 表上创建触发器。如果报错，可以忽略这一步，因为 Supabase 通常已经有内置的处理机制。

---

## 🧪 验证修复

### 1️⃣ 在 Supabase 验证

```sql
-- 应该看到 2 个用户
SELECT 
  id,
  email,
  display_name,
  role,
  subscription_tier,
  credits,
  created_at
FROM public.user_profiles
ORDER BY created_at DESC;
```

**预期**: 2 行记录

---

### 2️⃣ 在后台管理验证

1. **刷新后台页面**
   - 访问: http://localhost:3001?page=admin
   - 按 `Ctrl + Shift + R` 强制刷新

2. **点击 "👥 用户管理"**

3. **应该看到**:
   ```
   总用户数: 2
   
   用户列表:
   - 123@123 (或其他邮箱)
   - 4835300@qq.com
   ```

✅ 如果看到 2 个用户，问题解决！

---

## 🔍 深度诊断（如果问题仍未解决）

### 检查 RLS 策略

```sql
-- 查看 user_profiles 的 RLS 策略
SELECT 
  policyname,
  cmd as operation,
  qual as row_condition,
  with_check as insert_condition
FROM pg_policies 
WHERE tablename = 'user_profiles';
```

**预期策略**:
1. `Admins can view all profiles` - SELECT 操作，admin 可以查看所有用户
2. `Users can view own profile` - SELECT 操作，普通用户只能查看自己

如果策略有问题，可能需要修改。

---

### 检查管理员权限

```sql
-- 确认当前登录用户是管理员
SELECT id, email, role FROM public.user_profiles WHERE role = 'admin';
```

应该看到你当前登录的账号（4835300@qq.com）是 admin。

---

### 检查前端查询

打开浏览器控制台（F12），查看网络请求：

1. **访问用户管理页面**
2. **打开 Network 标签**
3. **刷新页面**
4. **查找 `user_profiles` 的请求**
5. **查看返回的数据**

应该看到类似：
```json
{
  "data": [
    { "id": "...", "email": "123@123", ... },
    { "id": "...", "email": "4835300@qq.com", ... }
  ]
}
```

如果只返回 1 条记录，问题在数据库层。
如果返回 2 条记录但前端只显示 1 条，问题在前端代码。

---

## 📊 完整诊断脚本

运行以下一键诊断脚本：

```sql
-- 完整诊断
DO $$
DECLARE
  auth_count INT;
  profile_count INT;
  missing_count INT;
BEGIN
  -- 统计
  SELECT COUNT(*) INTO auth_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM public.user_profiles;
  SELECT COUNT(*) INTO missing_count 
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON au.id = up.id
  WHERE up.id IS NULL;
  
  -- 输出结果
  RAISE NOTICE '========================================';
  RAISE NOTICE '用户诊断报告';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'auth.users 中的用户数: %', auth_count;
  RAISE NOTICE 'user_profiles 中的用户数: %', profile_count;
  RAISE NOTICE '缺少 profile 的用户数: %', missing_count;
  RAISE NOTICE '========================================';
  
  IF missing_count > 0 THEN
    RAISE NOTICE '⚠️  发现 % 个用户缺少 profile 记录！', missing_count;
    RAISE NOTICE '请运行修复脚本创建缺少的 profile 记录。';
  ELSE
    RAISE NOTICE '✅ 所有用户都有 profile 记录。';
    RAISE NOTICE '如果后台仍只显示 1 个用户，请检查 RLS 策略或前端代码。';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- 列出所有用户和 profile 状态
SELECT 
  au.email,
  CASE 
    WHEN up.id IS NULL THEN '❌ 缺少 profile'
    ELSE '✅ 有 profile'
  END as status,
  up.role,
  up.subscription_tier
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
ORDER BY au.created_at DESC;
```

---

## 🎯 快速修复（3 步）

### 第 1 步: 诊断

```sql
SELECT 
  au.email,
  CASE WHEN up.id IS NULL THEN '❌ 缺少' ELSE '✅ 正常' END as profile
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id;
```

### 第 2 步: 修复

```sql
INSERT INTO public.user_profiles (id, email, role, subscription_tier, credits)
SELECT au.id, au.email, 'user', 'free', 10
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ON CONFLICT DO NOTHING;
```

### 第 3 步: 验证

```sql
SELECT email, role FROM user_profiles ORDER BY created_at DESC;
```

---

**完成！现在后台应该显示 2 个用户了！** 🎉

如果还有问题，请查看浏览器控制台（F12）的错误信息，或运行深度诊断脚本。



