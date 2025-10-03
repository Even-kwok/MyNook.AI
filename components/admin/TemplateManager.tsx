import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Button } from '../Button';

interface Template {
  id: string;
  template_id: string;
  name: string;
  image_url: string;
  prompt: string;
  subcategory_id: string | null;
  room_types: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  // 关联查询的数据
  subcategory_name?: string;
  category_name?: string;
  category_key?: string;
}

export const TemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  
  // 筛选状态
  const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 从数据库动态加载的分类和子分类
  const [categories, setCategories] = useState<Array<{value: string; label: string}>>([]);
  const [subcategories, setSubcategories] = useState<Array<{value: string; label: string; category_id: string}>>([]);

  const roomTypes = [
    { value: 'all', label: '全部房间' },
    { value: 'living-room', label: '客厅 (Living Room)' },
    { value: 'dining-room', label: '餐厅 (Dining Room)' },
    { value: 'bedroom', label: '卧室 (Bedroom)' },
    { value: 'kitchen', label: '厨房 (Kitchen)' },
    { value: 'bathroom', label: '浴室 (Bathroom)' },
    { value: 'home-office', label: '家庭办公室 (Home Office)' },
    { value: 'nursery', label: '育儿室 (Nursery)' },
    { value: 'kids-room', label: '儿童房 (Kids Room)' },
    { value: 'yoga-studio', label: '瑜伽室 (Yoga Studio)' },
    { value: 'garden', label: '花园 (Garden)' },
    { value: 'library', label: '图书馆 (Library)' },
    { value: 'theater', label: '影院 (Theater)' },
    { value: 'studio', label: '工作室 (Studio)' },
    { value: 'game-room', label: '游戏室 (Game Room)' },
    { value: 'wine-cellar', label: '酒窖 (Wine Cellar)' },
    { value: 'music-room', label: '音乐室 (Music Room)' },
    { value: 'fitness-room', label: '健身房 (Fitness Room)' },
    { value: 'pantry', label: '食品储藏室 (Pantry)' },
    { value: 'laundry-room', label: '洗衣房 (Laundry Room)' },
    { value: 'mudroom', label: '泥房 (Mudroom)' },
    { value: 'balcony', label: '阳台 (Balcony)' },
    { value: 'attic', label: '阁楼 (Attic)' },
    { value: 'basement', label: '地下室 (Basement)' },
    { value: 'closet', label: '衣柜间 (Closet)' },
  ];

  // Load categories and subcategories
  const loadCategoriesAndSubcategories = async () => {
    try {
      // 加载分类
      const { data: categoriesData, error: catError } = await supabase
        .from('categories')
        .select('id, category_key, display_name')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (catError) throw catError;
      
      setCategories([
        { value: 'all', label: '全部分类' },
        ...(categoriesData || []).map(cat => ({
          value: cat.id,
          label: cat.display_name
        }))
      ]);

      // 加载子分类
      const { data: subcategoriesData, error: subError } = await supabase
        .from('subcategories')
        .select('id, category_id, subcategory_key, display_name')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (subError) throw subError;
      
      setSubcategories(subcategoriesData || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  // Load templates with filters
  const loadTemplates = async () => {
    try {
      setLoading(true);
      
      // 使用JOIN查询获取完整信息
      let query = supabase
        .from('prompt_templates')
        .select(`
          *,
          subcategories (
            id,
            subcategory_key,
            display_name,
            categories (
              id,
              category_key,
              display_name
            )
          )
        `)
        .order('display_order', { ascending: true });

      // 应用筛选
      if (selectedRoomType !== 'all') {
        query = query.contains('room_types', [selectedRoomType]);
      }
      if (selectedCategory !== 'all') {
        query = query.eq('subcategories.category_id', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // 转换数据格式
      const formattedTemplates = (data || []).map((t: any) => ({
        ...t,
        subcategory_name: t.subcategories?.display_name,
        category_name: t.subcategories?.categories?.display_name,
        category_key: t.subcategories?.categories?.category_key,
      }));
      
      setTemplates(formattedTemplates);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError(err instanceof Error ? err.message : '加载模板失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载分类和模板
  useEffect(() => {
    loadCategoriesAndSubcategories();
    loadTemplates();
  }, []);

  // 当筛选条件改变时重新加载
  useEffect(() => {
    loadTemplates();
  }, [selectedRoomType, selectedCategory]);

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个模板吗？')) return;

    try {
      const { error } = await supabase
        .from('prompt_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        action_param: 'delete',
        entity_type_param: 'template',
        entity_id_param: id,
      });

      loadTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      alert('删除失败：' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  const handleToggleActive = async (template: Template) => {
    try {
      const { error } = await supabase
        .from('prompt_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        action_param: 'update',
        entity_type_param: 'template',
        entity_id_param: template.id,
        details_param: { action: 'toggle_active', is_active: !template.is_active },
      });

      loadTemplates();
    } catch (err) {
      console.error('Error toggling template:', err);
      alert('操作失败：' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">风格模板管理</h1>
          <p className="text-slate-600 mt-1">管理 AI 生成的设计风格模板（共 {templates.length} 个）</p>
        </div>
        <Button primary onClick={handleCreate}>
          <span className="text-xl mr-2">+</span>
          添加新模板
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              房间类型
            </label>
            <select
              value={selectedRoomType}
              onChange={(e) => setSelectedRoomType(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {roomTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              分类
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button 
              onClick={() => {
                setSelectedRoomType('all');
                setSelectedCategory('all');
              }}
              className="w-full"
            >
              重置筛选
            </Button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"
          >
            {/* Image */}
            <div className="aspect-square bg-slate-100 relative">
              {template.image_url ? (
                <img
                  src={template.image_url}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  无图片
                </div>
              )}
              {/* Status Badge */}
              <div className="absolute top-2 right-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    template.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {template.is_active ? '启用' : '禁用'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-semibold text-slate-900 mb-1">{template.name}</h3>
              <p className="text-xs text-slate-500 mb-2">
                ID: {template.template_id}
              </p>
              <div className="flex flex-wrap gap-1 mb-2">
                {template.category_name && (
                  <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                    {template.category_name}
                  </span>
                )}
                {template.subcategory_name && (
                  <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                    {template.subcategory_name}
                  </span>
                )}
              </div>
              {template.room_types && template.room_types.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {template.room_types.slice(0, 3).map((room: string) => (
                    <span key={room} className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                      {roomTypes.find((r) => r.value === room)?.label || room}
                    </span>
                  ))}
                  {template.room_types.length > 3 && (
                    <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
                      +{template.room_types.length - 3}
                    </span>
                  )}
                </div>
              )}
              <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                {template.prompt}
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(template)}
                  className="flex-1 px-3 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleToggleActive(template)}
                  className="flex-1 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  {template.is_active ? '禁用' : '启用'}
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {templates.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">还没有模板</h3>
          <p className="text-slate-600 mb-4">开始添加你的第一个风格模板</p>
          <Button primary onClick={handleCreate}>
            添加新模板
          </Button>
        </div>
      )}

      {/* Template Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <TemplateEditModal
            template={editingTemplate}
            categories={categories}
            onClose={() => setIsModalOpen(false)}
            onSave={() => {
              loadTemplates();
              setIsModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Template Edit Modal Component
interface TemplateEditModalProps {
  template: Template | null;
  categories: { value: string; label: string }[];
  onClose: () => void;
  onSave: () => void;
}

const TemplateEditModal: React.FC<TemplateEditModalProps> = ({
  template,
  categories,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    template_id: template?.template_id || '',
    name: template?.name || '',
    image_url: template?.image_url || '',
    prompt: template?.prompt || '',
    category: template?.category || 'interior',
    style_category: template?.style_category || 'Design Aesthetics',
    room_types: template?.room_types || [],
    is_active: template?.is_active ?? true,
    sort_order: template?.sort_order || 0,
    display_order: template?.display_order || 0,
  });
  const [saving, setSaving] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState<string[]>(template?.room_types || []);

  const roomTypeOptions = [
    { value: 'living-room', label: '客厅' },
    { value: 'bedroom', label: '卧室' },
    { value: 'kitchen', label: '厨房' },
    { value: 'bathroom', label: '浴室' },
    { value: 'dining-room', label: '餐厅' },
    { value: 'home-office', label: '家庭办公室' },
    { value: 'balcony', label: '阳台' },
    { value: 'garden', label: '花园' },
    { value: 'nursery', label: '育儿室' },
    { value: 'kids-room', label: '儿童房' },
  ];

  const toggleRoom = (roomValue: string) => {
    const newRooms = selectedRooms.includes(roomValue)
      ? selectedRooms.filter((r) => r !== roomValue)
      : [...selectedRooms, roomValue];
    setSelectedRooms(newRooms);
    setFormData({ ...formData, room_types: newRooms });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (template) {
        // Update existing
        const { error } = await supabase
          .from('prompt_templates')
          .update(formData)
          .eq('id', template.id);

        if (error) throw error;

        // Log action
        await supabase.rpc('log_admin_action', {
          action_param: 'update',
          entity_type_param: 'template',
          entity_id_param: template.id,
          details_param: formData,
        });
      } else {
        // Create new
        const { error } = await supabase.from('prompt_templates').insert([formData]);

        if (error) throw error;

        // Log action
        await supabase.rpc('log_admin_action', {
          action_param: 'create',
          entity_type_param: 'template',
          entity_id_param: formData.template_id,
          details_param: formData,
        });
      }

      onSave();
    } catch (err) {
      console.error('Error saving template:', err);
      alert('保存失败：' + (err instanceof Error ? err.message : '未知错误'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900">
              {template ? '编辑模板' : '添加新模板'}
            </h2>
          </div>

          {/* Form */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  模板 ID
                </label>
                <input
                  type="text"
                  value={formData.template_id}
                  onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                  placeholder="例如: design-modern-minimalist"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  disabled={!!template}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  模板名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如: 现代简约"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  大分类
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  风格分类
                </label>
                <select
                  value={formData.style_category}
                  onChange={(e) => setFormData({ ...formData, style_category: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="Design Aesthetics">设计美学</option>
                  <option value="Color Schemes">配色方案</option>
                  <option value="Material & Texture">材质纹理</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  显示顺序
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                适用房间类型（多选）
              </label>
              <div className="border border-slate-300 rounded-lg p-3 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {roomTypeOptions.map((room) => (
                  <label key={room.value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedRooms.includes(room.value)}
                      onChange={() => toggleRoom(room.value)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">{room.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                已选择 {selectedRooms.length} 个房间类型
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                图片 URL
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                提示词（Prompt）
              </label>
              <textarea
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                placeholder="输入详细的 AI 生成提示词..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-48 font-mono text-sm"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                这是发送给 AI 的提示词，越详细效果越好
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label htmlFor="is_active" className="text-sm text-slate-700">
                启用此模板（用户可见）
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
            <Button onClick={onClose} disabled={saving}>
              取消
            </Button>
            <Button primary type="submit" disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

