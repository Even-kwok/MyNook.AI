# 🚨 修复无限递归错误

## 🐛 问题确认

从控制台错误可以看到：
```
❌ Infinite recursion detected in policy for relation 'user_profiles'
❌ 大量 500 (Internal Server Error)
❌ Error fetching user profile
```

**根本原因**: RLS 策略有无限递归！

当前策略：
```sql
-- ❌ 有问题的策略
USING (
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
)
```

**问题**：
1. 查询 `user_profiles` 时触发 RLS 策略
2. RLS 策略又去查询 `user_profiles` 来检查 role
3. 这又触发 RLS 策略...
4. 无限递归！💥

---

## ✅ 解决方案

使用 `IN` 子查询代替标量子查询，Postgres 会缓存子查询结果，避免递归。

---

## 🚀 立即执行

### 在 Supabase Dashboard 运行

登录 **Supabase Dashboard** → **SQL Editor** → 运行：

```sql
-- 1. 删除所有旧策略
DO $$ 
DECLARE pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_profiles' 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.user_profiles';
    END LOOP;
END $$;

-- 2. 创建新的无递归策略

-- 用户查看自己
CREATE POLICY "select_own_profile" 
ON public.user_profiles
FOR SELECT 
USING (auth.uid() = id);

-- 管理员查看所有（使用 IN 避免递归）
CREATE POLICY "select_all_profiles_if_admin" 
ON public.user_profiles
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT id FROM public.user_profiles 
    WHERE role = 'admin'
  )
);

-- 用户更新自己
CREATE POLICY "update_own_profile" 
ON public.user_profiles
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 管理员更新所有
CREATE POLICY "update_all_profiles_if_admin" 
ON public.user_profiles
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT id FROM public.user_profiles 
    WHERE role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.user_profiles 
    WHERE role = 'admin'
  )
);

-- 3. 确保你是管理员
UPDATE public.user_profiles
SET role = 'admin'
WHERE email = '4835300@qq.com';

-- 4. 验证
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_profiles';
SELECT email, role FROM public.user_profiles;
```

---

## 🔧 为什么这样可以避免递归？

### ❌ 旧的方式（递归）
```sql
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  -- ↑ 这会再次触发 RLS，导致无限递归
)
```

### ✅ 新的方式（无递归）
```sql
USING (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin')
  -- ↑ Postgres 会缓存 IN 子查询的结果，不会重复触发
)
```

**技术原因**:
- `IN` 子查询会被 Postgres 优化为一次性查询
- 结果会被缓存用于后续的权限检查
- 不会重新触发 RLS 策略

---

## 🧪 验证修复

### 第 1 步: 运行 SQL

应该看到：
```
=== RLS Policies ===
policyname                       | operation
---------------------------------|-----------
select_own_profile               | SELECT
select_all_profiles_if_admin     | SELECT
update_own_profile               | UPDATE
update_all_profiles_if_admin     | UPDATE

=== All Users ===
email              | role  | subscription_tier | credits
-------------------|-------|-------------------|--------
123@123            | user  | free              | 10
4835300@qq.com     | admin | business          | 1000
```

---

### 第 2 步: 完全清除浏览器缓存

**非常重要！**

1. 关闭所有浏览器窗口
2. 重新打开浏览器
3. 按 `Ctrl + Shift + Delete`
4. 勾选：
   - ✅ Cookies and site data
   - ✅ Cached images and files
5. 时间范围: **All time**
6. 点击 "Clear data"
7. 关闭浏览器

---

### 第 3 步: 重启开发服务器

```bash
# 停止服务器 (Ctrl+C)
npm run dev
```

---

### 第 4 步: 测试

1. 打开浏览器
2. 访问: http://localhost:3001
3. 按 F12 查看控制台

**应该看到**:
- ✅ **无错误！**（没有红色错误）
- ✅ **无 500 错误**
- ✅ **无 "infinite recursion" 错误**

4. 查看页面右上角：
- ✅ 语言选择器（EN）
- ✅ "Upgrade to PRO" 按钮
- ✅ 登录按钮（用户图标）

---

### 第 5 步: 测试登录

1. 点击登录按钮
2. 输入: 4835300@qq.com
3. 输入密码
4. 登录

**登录后应该看到**:
- ✅ UserInfoBar（积分 + Business 徽章 + 头像）
- ✅ 无错误

---

## 📊 诊断脚本

如果还有问题，运行诊断：

```sql
-- 1. 检查策略数量
SELECT COUNT(*) as policy_count 
FROM pg_policies 
WHERE tablename = 'user_profiles';
-- 应该返回: 4

-- 2. 列出所有策略
SELECT policyname, cmd, pg_get_expr(qual, 'public.user_profiles'::regclass) as condition
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 3. 检查你的 role
SELECT email, role FROM public.user_profiles WHERE email = '4835300@qq.com';
-- 应该返回: role = 'admin'

-- 4. 测试查询
SELECT email, role FROM public.user_profiles;
-- 如果你是管理员，应该返回 2 个用户
```

---

## 🎯 关键点

### 为什么之前的方案会无限递归？

```sql
-- ❌ 问题代码
CREATE POLICY "policy_name" ON user_profiles
FOR SELECT USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  -- 问题：查询 user_profiles 又触发这个策略
);
```

### 正确的方案

```sql
-- ✅ 正确代码
CREATE POLICY "policy_name" ON user_profiles
FOR SELECT USING (
  auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin')
  -- IN 子查询会被缓存，避免递归
);
```

---

## ✅ 完成检查清单

- [ ] 在 Supabase 运行 SQL 脚本
- [ ] 验证返回 4 个策略
- [ ] 验证你的 role = 'admin'
- [ ] 完全关闭浏览器
- [ ] 清除所有缓存（All time）
- [ ] 重启开发服务器
- [ ] 打开浏览器访问应用
- [ ] 控制台无错误
- [ ] 右上角显示按钮
- [ ] 能够正常登录
- [ ] 登录后显示 UserInfoBar

---

**现在立即运行 SQL 修复脚本！** 🚀

完整脚本保存在 `fix_infinite_recursion.sql`。

**一定要清除浏览器缓存并重启服务器！**



