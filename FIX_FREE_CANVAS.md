# 🔧 修复 Free Canvas 功能开关

## 🐛 问题

**症状**:
1. ❌ 后台"功能开关管理"页面看不到 Free Canvas
2. ❌ 前端导航菜单中 Free Canvas 入口被隐藏

**原因**: 数据库中没有 `free-canvas` 的记录

---

## ✅ 解决方案

### 方法 1: 在 Supabase Dashboard 运行 SQL

1. **登录 Supabase Dashboard**
2. **进入 SQL Editor**
3. **复制并运行以下 SQL**:

```sql
-- 添加 Free Canvas 功能页面
INSERT INTO public.feature_pages (page_key, display_name, description, display_order, is_active) VALUES
  ('free-canvas', 'Free Canvas', 'Design freely with AI assistance', 10, true)
ON CONFLICT (page_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- 验证结果
SELECT page_key, display_name, is_active, display_order
FROM feature_pages
WHERE page_key = 'free-canvas';
```

4. **查看结果**:
```
page_key      | display_name  | is_active | display_order
--------------|---------------|-----------|---------------
free-canvas   | Free Canvas   | true      | 10
```

✅ 如果看到这条记录，说明添加成功！

---

### 方法 2: 运行完整的迁移脚本

如果你还没有运行过 `010_add_simple_feature_pages.sql`，可以运行完整脚本：

```sql
-- 插入所有 5 个简单功能页面
INSERT INTO public.feature_pages (page_key, display_name, description, display_order, is_active) VALUES
  ('item-replace', 'Item Replace', 'Replace items in your design', 6, true),
  ('wall-paint', 'Wall Paint', 'Change wall colors and finishes', 7, true),
  ('reference-style', 'Reference Style Match', 'Match and apply reference styles', 8, true),
  ('multi-item', 'Multi-Item Preview', 'Preview multiple design elements', 9, true),
  ('free-canvas', 'Free Canvas', 'Design freely with AI assistance', 10, true)
ON CONFLICT (page_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;
```

---

## 🧪 验证步骤

### 1️⃣ 验证数据库

运行查询确认 Free Canvas 已添加:

```sql
-- 查看所有功能页面（应该有 10-11 条）
SELECT 
  page_key,
  display_name,
  is_active,
  display_order
FROM feature_pages
ORDER BY display_order;
```

**预期结果** - 应该看到:
```
page_key           | display_name              | is_active | display_order
-------------------|---------------------------|-----------|---------------
interior-design    | Interior Design           | true      | 1
festive-decor      | Festive Decor             | true      | 2
exterior-design    | Exterior Design           | true      | 3
floor-style        | Floor Style               | true      | 4
garden-backyard    | Garden & Backyard Design  | true      | 5
item-replace       | Item Replace              | true      | 6
wall-paint         | Wall Paint                | true      | 7
reference-style    | Reference Style Match     | true      | 8
multi-item         | Multi-Item Preview        | true      | 9
free-canvas        | Free Canvas               | true      | 10  ← 应该在这里
```

---

### 2️⃣ 验证后台管理

1. **刷新前端页面**
   - 按 `Ctrl + Shift + R` 强制刷新

2. **访问后台管理**
   - http://localhost:3001?page=admin
   - 点击 **"🔧 功能开关"**

3. **应该看到 Free Canvas**
   ```
   ┌────────────────────────────────────┐
   │ ✏️ Free Canvas                     │
   │    [已启用]                        │
   │ Design freely with AI assistance   │
   │                      [开关 ON]     │
   │                                    │
   │ ✓ 前端可见 - 用户可以在导航菜单... │
   └────────────────────────────────────┘
   ```

4. **统计信息更新**
   - 顶部应该显示正确的功能数量
   - 例如: `[共 10 个功能] [10 个已启用] [0 个已禁用]`

---

### 3️⃣ 验证前端显示

1. **刷新前端页面** (`Ctrl + Shift + R`)

2. **点击 "Interior Design" 下拉菜单**

3. **应该看到 Free Canvas 选项**
   ```
   Interior Design ▼
     ├─ Interior Design
     ├─ Festive Decor
     ├─ Exterior Design
     ├─ Item Replace
     ├─ Wall Paint
     ├─ Floor Style
     ├─ Garden & Backyard Design
     ├─ Reference Style Match
     ├─ AI Design Advisor
     ├─ Multi-Item Preview
     └─ Free Canvas  ← 应该在这里
   ```

---

### 4️⃣ 测试开关功能

1. **关闭 Free Canvas**:
   - 后台点击 Free Canvas 的开关
   - 状态变为 "已禁用"

2. **刷新前端**:
   - `Ctrl + Shift + R`
   - 下拉菜单中**不应该显示** Free Canvas

3. **重新开启**:
   - 后台开启 Free Canvas
   - 刷新前端
   - 下拉菜单中**又显示** Free Canvas

---

## 🔍 故障排查

### 问题 1: SQL 执行失败

**错误**: `relation "feature_pages" does not exist`

**原因**: feature_pages 表不存在

**解决**: 先运行基础迁移创建表
```sql
-- 检查表是否存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'feature_pages'
);
```

如果返回 `false`，需要先运行 `008_add_feature_pages.sql`

---

### 问题 2: 添加成功但后台看不到

**原因**: 前端缓存或页面未刷新

**解决**:
1. 硬刷新: `Ctrl + Shift + F5`
2. 清除浏览器缓存
3. 重启开发服务器:
   ```powershell
   # 停止当前服务器 (Ctrl+C)
   npm run dev
   ```

---

### 问题 3: 后台看到了但前端没显示

**原因**: `useActiveFeatures` hook 没有加载到 free-canvas

**检查浏览器控制台**:
```javascript
// 按 F12 打开控制台，查看是否有错误
```

**检查 App.tsx 映射**:
```typescript
const featureKeyMap = {
  // ...
  'freeCanvas': 'free-canvas',  // 确保有这行
};
```

---

### 问题 4: 开关切换无效

**原因**: RLS 策略或权限问题

**检查权限**:
```sql
-- 确认当前用户是管理员
SELECT id, email, role FROM user_profiles WHERE id = auth.uid();
```

**应该返回**: `role = 'admin'`

---

## 📊 完整诊断脚本

一键检查所有问题:

```sql
-- 1. 检查 feature_pages 表是否存在
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'feature_pages')
    THEN '✅ feature_pages 表存在'
    ELSE '❌ feature_pages 表不存在'
  END as table_status;

-- 2. 检查 free-canvas 记录是否存在
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM feature_pages WHERE page_key = 'free-canvas')
    THEN '✅ free-canvas 记录存在'
    ELSE '❌ free-canvas 记录不存在'
  END as record_status;

-- 3. 如果不存在，添加它
INSERT INTO public.feature_pages (page_key, display_name, description, display_order, is_active) VALUES
  ('free-canvas', 'Free Canvas', 'Design freely with AI assistance', 10, true)
ON CONFLICT (page_key) DO NOTHING;

-- 4. 显示 free-canvas 的详细信息
SELECT * FROM feature_pages WHERE page_key = 'free-canvas';

-- 5. 统计所有功能
SELECT 
  COUNT(*) as total_features,
  COUNT(*) FILTER (WHERE is_active = true) as active_features,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_features
FROM feature_pages;

-- 6. 列出所有功能
SELECT page_key, display_name, is_active, display_order
FROM feature_pages
ORDER BY display_order;
```

---

## 🎯 快速修复（3 步）

### 第 1 步: 在 Supabase 运行 SQL

```sql
INSERT INTO public.feature_pages (page_key, display_name, description, display_order, is_active) VALUES
  ('free-canvas', 'Free Canvas', 'Design freely with AI assistance', 10, true)
ON CONFLICT (page_key) DO NOTHING;
```

### 第 2 步: 验证

```sql
SELECT * FROM feature_pages WHERE page_key = 'free-canvas';
```

### 第 3 步: 刷新前端

```
Ctrl + Shift + R
```

---

**完成！现在 Free Canvas 应该在后台和前端都显示了！** 🎉✨

如果还有问题，请检查浏览器控制台（F12）是否有错误信息。



