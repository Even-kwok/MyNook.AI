# 🔧 修复 500 错误和 Profile 查询失败

## 🐛 问题分析

从浏览器控制台看到：

```
AdminPage - Loading: false
AdminPage - User: { email: "4835300@qq.com", ... }
AdminPage - Profile: null  ← 关键问题！
```

以及多个 **500 (Internal Server Error)** 错误。

---

## 🎯 根本原因

1. **RLS 策略冲突**: 
   - 我们添加了新的管理员策略
   - 可能与旧的策略产生冲突
   - 导致 Supabase 查询失败，返回 500 错误

2. **fetchProfile 失败**:
   - `AuthContext` 的 `fetchProfile` 函数查询失败
   - 导致 `profile` 被设为 `null`
   - 触发 "访问受限" 页面

---

## ✅ 解决方案：重建 RLS 策略

我们需要删除所有旧策略，然后创建一个干净、合并的策略。

---

## 🚀 修复步骤

### 第 1 步: 在 Supabase 运行修复脚本

登录 **Supabase Dashboard** → **SQL Editor** → 运行以下脚本：

```sql
-- 1. 删除所有现有的 user_profiles RLS 策略
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.user_profiles';
    END LOOP;
END $$;

-- 2. 创建新的合并策略（用户 OR 管理员）
CREATE POLICY "users_and_admins_can_view_profiles" 
ON public.user_profiles
FOR SELECT 
TO public
USING (
  -- 用户可以查看自己 OR 管理员可以查看所有
  auth.uid() = id
  OR
  EXISTS (
    SELECT 1 
    FROM public.user_profiles AS admin_check
    WHERE admin_check.id = auth.uid() 
      AND admin_check.role = 'admin'
  )
);

CREATE POLICY "users_and_admins_can_update_profiles" 
ON public.user_profiles
FOR UPDATE 
TO public
USING (
  auth.uid() = id
  OR
  EXISTS (
    SELECT 1 
    FROM public.user_profiles AS admin_check
    WHERE admin_check.id = auth.uid() 
      AND admin_check.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = id
  OR
  EXISTS (
    SELECT 1 
    FROM public.user_profiles AS admin_check
    WHERE admin_check.id = auth.uid() 
      AND admin_check.role = 'admin'
  )
);

-- 3. 确保你的账号是管理员
UPDATE public.user_profiles
SET role = 'admin'
WHERE email = '4835300@qq.com';
```

---

### 第 2 步: 验证策略

```sql
-- 查看新策略
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_profiles';
```

**应该只看到 2 个策略**:
```
policyname                              | cmd
----------------------------------------|--------
users_and_admins_can_view_profiles      | SELECT
users_and_admins_can_update_profiles    | UPDATE
```

---

### 第 3 步: 测试查询

```sql
-- 查询所有用户（作为管理员应该能看到所有）
SELECT email, role, subscription_tier 
FROM public.user_profiles 
ORDER BY created_at DESC;
```

**应该返回 2 个用户**:
```
email              | role  | subscription_tier
-------------------|-------|------------------
123@123            | user  | free
4835300@qq.com     | admin | business
```

---

### 第 4 步: 清除前端缓存并重新登录

1. **完全退出登录**
2. **关闭浏览器**
3. **清除缓存**: `Ctrl + Shift + Delete`
   - 勾选 "Cookies and other site data"
   - 时间范围选择 "All time"
   - 点击 "Clear data"
4. **重新打开浏览器**
5. **访问应用并登录**
6. **访问后台**: http://localhost:3001?page=admin

---

## 🧪 验证修复

### 1. 浏览器控制台（F12）

刷新后台页面，查看日志：

```javascript
AdminPage - Loading: false
AdminPage - User: { email: "4835300@qq.com", ... }
AdminPage - Profile: { 
  role: "admin",  ← 应该不是 null 了！
  email: "4835300@qq.com",
  subscription_tier: "business"
}
```

✅ 如果 `Profile` 不是 `null` 且 `role = "admin"`，修复成功！

---

### 2. 网络请求（F12 → Network）

刷新页面，找到 `user_profiles` 的请求：

- **Status**: 应该是 `200 OK`（不是 500）
- **Response**: 应该返回完整的 profile 对象

---

### 3. 后台页面

- ✅ 不再显示 "访问受限"
- ✅ 正常显示管理界面
- ✅ 可以访问用户管理

---

## 🔍 如果还不行

### 检查 1: 确认 role 已更新

```sql
SELECT id, email, role FROM public.user_profiles WHERE email = '4835300@qq.com';
```

应该返回 `role = 'admin'`

---

### 检查 2: 确认 RLS 已启用

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';
```

应该返回 `rowsecurity = true`

---

### 检查 3: 测试策略（作为当前用户）

```sql
-- 这个查询应该返回你自己的 profile
SELECT * FROM public.user_profiles WHERE id = auth.uid();
```

如果返回空，说明 RLS 策略还是有问题。

---

### 检查 4: 查看详细错误

在浏览器控制台（F12），展开红色的错误信息，查看详细的错误堆栈。

可能的错误信息：
- `new row violates row-level security policy` → RLS 策略问题
- `permission denied` → 权限问题
- `relation does not exist` → 表不存在（不太可能）

---

## 📊 完整诊断脚本

运行这个脚本查看完整状态：

```sql
-- 1. 检查 RLS 是否启用
SELECT 
  '=== RLS Status ===' as info,
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- 2. 列出所有策略
SELECT 
  '=== RLS Policies ===' as info,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 3. 检查用户数据
SELECT 
  '=== User Data ===' as info,
  email,
  role,
  CASE 
    WHEN role = 'admin' THEN '✅ 管理员'
    WHEN role = 'user' THEN '👤 普通用户'
    ELSE '❌ 角色未设置'
  END as role_status
FROM public.user_profiles;

-- 4. 测试查询（模拟前端）
SELECT 
  '=== Test Query ===' as info,
  COUNT(*) as accessible_profiles
FROM public.user_profiles;

-- 5. 检查当前用户
SELECT 
  '=== Current User ===' as info,
  auth.uid() as current_user_id,
  (SELECT email FROM user_profiles WHERE id = auth.uid()) as email,
  (SELECT role FROM user_profiles WHERE id = auth.uid()) as role;
```

---

## 🎯 关键点

### 为什么要合并策略？

**之前的问题**:
- 有多个独立的策略（用户策略 + 管理员策略）
- Supabase 在执行查询时可能产生冲突
- 导致查询失败，返回 500 错误

**现在的解决方案**:
- 只有 **1 个 SELECT 策略**，使用 `OR` 逻辑
- 只有 **1 个 UPDATE 策略**，使用 `OR` 逻辑
- 避免策略冲突

**策略逻辑**:
```sql
USING (
  auth.uid() = id          -- 用户可以访问自己
  OR                        -- 或者
  EXISTS (                  -- 管理员可以访问所有
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
```

---

## ✅ 快速修复总结

1. ✅ 运行 SQL 脚本删除旧策略
2. ✅ 创建新的合并策略
3. ✅ 更新 role = 'admin'
4. ✅ 完全退出并清除缓存
5. ✅ 重新登录
6. ✅ 访问后台

---

**现在运行修复脚本！** 🚀

完整脚本已保存在 `fix_rls_conflicts.sql` 文件中。



