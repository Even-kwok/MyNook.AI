# 🔄 执行迁移 008：添加功能页面层级

## 📋 这个迁移做什么？

### 完善四层结构
```
之前（不完整）:
room_types → style_categories → templates

现在（完整）:
feature_pages → room_types → style_categories → templates
     ↓              ↓              ↓                 ↓
 功能页面       房间/场景类型    风格分类          具体模板
```

### 具体变更

1. **创建 `feature_pages` 表**
   - Interior Design
   - Festive Decor
   - Exterior Design
   - Floor Style
   - Garden & Backyard Design
   - Reference Style Match
   - AI Design Advisor
   - Multi-Item Preview

2. **修改 `room_types` 表**
   - 添加 `feature_page_id` 外键
   - 将现有房间类型关联到 Interior Design

3. **添加其他功能页的场景类型**
   - Festive: Christmas, Halloween
   - Exterior: House Facade, Commercial Building
   - Garden: Front Yard, Backyard
   - Floor: Universal Flooring

4. **创建视图**
   - `templates_full_hierarchy` - 方便查询完整层级

---

## ⚡ 如何执行

### 方法1：Supabase Dashboard（推荐）
1. 打开 https://supabase.com/dashboard
2. 选择你的项目
3. 进入 **SQL Editor**
4. 打开文件 `supabase/migrations/008_add_feature_pages.sql`
5. 复制所有内容
6. 粘贴到 SQL Editor
7. 点击 **Run**

### 方法2：Supabase CLI
```bash
cd "C:\Users\USER\Desktop\ai-studio-v4.4 - 20251001"
supabase migration new add_feature_pages
# 然后复制 008_add_feature_pages.sql 的内容
supabase db push
```

---

## ✅ 执行后验证

在 SQL Editor 中运行：

```sql
-- 1. 检查功能页面
SELECT page_key, display_name, is_active 
FROM feature_pages 
ORDER BY display_order;

-- 预期结果：8个功能页面

-- 2. 检查房间类型关联
SELECT 
  fp.display_name AS feature_page,
  rt.display_name AS room_type,
  rt.room_key
FROM room_types rt
LEFT JOIN feature_pages fp ON rt.feature_page_id = fp.id
ORDER BY fp.display_order, rt.display_order;

-- 预期结果：
-- - 8个原有房间关联到 Interior Design
-- - 新增的场景类型关联到对应功能页

-- 3. 检查完整层级视图
SELECT 
  feature_page_name,
  room_type_name,
  style_category_name,
  COUNT(*) as template_count
FROM templates_full_hierarchy
WHERE template_active = true
GROUP BY feature_page_name, room_type_name, style_category_name
ORDER BY feature_page_name, room_type_name, style_category_name;

-- 预期结果：显示完整的层级结构和模板数量
```

---

## 📊 执行后数据结构

### Feature Pages (8个)
1. Interior Design - 8个房间类型
2. Festive Decor - 2个场景（Christmas, Halloween）
3. Exterior Design - 2个场景（House Facade, Commercial Building）
4. Floor Style - 1个通用场景
5. Garden & Backyard - 2个场景（Front Yard, Backyard）
6. Reference Style Match - 待添加场景
7. AI Design Advisor - 待添加场景
8. Multi-Item Preview - 待添加场景

### Room Types/Scenes（15个）
**Interior Design (8个)**:
- Living Room, Bedroom, Kitchen, Bathroom
- Dining Room, Home Office, Kids Room, Nursery

**Festive Decor (2个)**:
- Christmas Decoration
- Halloween Decoration

**Exterior Design (2个)**:
- House Facade
- Commercial Building

**Garden & Backyard (2个)**:
- Front Yard
- Backyard

**Floor Style (1个)**:
- Universal Flooring

---

## 🎯 执行后效果

### 后台管理界面将显示：
```
📦 Interior Design (功能页面)
  ├─ 🏠 Living Room (房间类型)
  │   ├─ Modern Styles (风格分类)
  │   │   ├─ Modern Minimalist (模板)
  │   │   └─ Contemporary (模板)
  │   └─ Classic Styles (风格分类)
  │       ├─ Victorian (模板)
  │       └─ Art Deco (模板)
  └─ 🛏️ Bedroom
      └─ ...

🎄 Festive Decor (功能页面)
  ├─ Christmas Decoration (场景类型)
  │   └─ [待添加风格分类和模板]
  └─ Halloween Decoration (场景类型)
      └─ [待添加风格分类和模板]

🏢 Exterior Design (功能页面)
  ├─ House Facade (场景类型)
  └─ Commercial Building (场景类型)

🌳 Garden & Backyard (功能页面)
  ├─ Front Yard (场景类型)
  └─ Backyard (场景类型)
```

---

## ⏭️ 执行成功后

告诉我结果，然后我会：
1. ✅ 更新后台管理界面显示完整的功能页面层级
2. ✅ 更新前端各功能页使用新的数据结构
3. ✅ 添加测试模板数据到新的场景类型

---

**现在去 Supabase Dashboard 执行这个迁移！** 🚀



