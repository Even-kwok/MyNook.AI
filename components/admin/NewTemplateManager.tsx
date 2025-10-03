import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../Button';
import { AnimatePresence, motion } from 'framer-motion';
import { IconX, IconChevronDown, IconEdit, IconTrash, IconPlus } from '../Icons';

interface RoomType {
  id: string;
  room_key: string;
  display_name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

interface StyleCategory {
  id: string;
  room_type_id: string;
  style_key: string;
  display_name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  room_type_name?: string;
}

interface Template {
  id: string;
  template_id: string;
  name: string;
  image_url: string;
  prompt: string;
  style_category_id: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  style_category_name?: string;
  room_type_name?: string;
}

export const NewTemplateManager: React.FC = () => {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [styleCategories, setStyleCategories] = useState<StyleCategory[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 筛选状态
  const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
  const [selectedStyleCategory, setSelectedStyleCategory] = useState<string>('all');
  
  // 展开状态
  const [expandedRoomTypes, setExpandedRoomTypes] = useState<Set<string>>(new Set());
  const [expandedStyleCategories, setExpandedStyleCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load room types
      const { data: roomTypesData, error: rtError } = await supabase
        .from('room_types')
        .select('*')
        .order('display_order', { ascending: true });

      if (rtError) throw rtError;

      // Load style categories
      const { data: styleCategoriesData, error: scError } = await supabase
        .from('style_categories')
        .select(`
          *,
          room_types (
            room_key,
            display_name
          )
        `)
        .order('display_order', { ascending: true });

      if (scError) throw scError;

      // Load templates
      const { data: templatesData, error: tError } = await supabase
        .from('prompt_templates')
        .select(`
          *,
          style_categories (
            style_key,
            display_name,
            room_types (
              room_key,
              display_name
            )
          )
        `)
        .order('display_order', { ascending: true });

      if (tError) throw tError;

      setRoomTypes(roomTypesData || []);
      
      const styleCategoriesWithRoomType = (styleCategoriesData || []).map(sc => ({
        ...sc,
        room_type_name: sc.room_types?.display_name || 'Unknown'
      }));
      setStyleCategories(styleCategoriesWithRoomType);
      
      const templatesWithInfo = (templatesData || []).map(t => ({
        ...t,
        style_category_name: t.style_categories?.display_name || 'Unknown',
        room_type_name: t.style_categories?.room_types?.display_name || 'Unknown'
      }));
      setTemplates(templatesWithInfo);

    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const toggleRoomType = (roomTypeId: string) => {
    const newExpanded = new Set(expandedRoomTypes);
    if (newExpanded.has(roomTypeId)) {
      newExpanded.delete(roomTypeId);
    } else {
      newExpanded.add(roomTypeId);
    }
    setExpandedRoomTypes(newExpanded);
  };

  const toggleStyleCategory = (styleCategoryId: string) => {
    const newExpanded = new Set(expandedStyleCategories);
    if (newExpanded.has(styleCategoryId)) {
      newExpanded.delete(styleCategoryId);
    } else {
      newExpanded.add(styleCategoryId);
    }
    setExpandedStyleCategories(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          错误: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">模板管理（新结构）</h1>
          <p className="text-slate-600">
            管理四层结构: Interior Design → Room Type → Style Category → Template
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => alert('Add Room Type - Coming Soon')}>
            <IconPlus className="w-4 h-4 mr-2" />
            添加房间类型
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-indigo-600">{roomTypes.length}</div>
          <div className="text-sm text-slate-600">房间类型</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-purple-600">{styleCategories.length}</div>
          <div className="text-sm text-slate-600">风格分类</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-green-600">{templates.length}</div>
          <div className="text-sm text-slate-600">模板总数</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-orange-600">
            {templates.filter(t => t.is_active).length}
          </div>
          <div className="text-sm text-slate-600">活跃模板</div>
        </div>
      </div>

      {/* Hierarchical View */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">层级结构视图</h2>
        </div>
        
        <div className="p-6 space-y-4">
          {roomTypes.map(roomType => {
            const isExpanded = expandedRoomTypes.has(roomType.id);
            const roomStyleCategories = styleCategories.filter(sc => sc.room_type_id === roomType.id);
            const roomTemplateCount = templates.filter(t => 
              roomStyleCategories.some(sc => sc.id === t.style_category_id)
            ).length;

            return (
              <div key={roomType.id} className="border border-slate-200 rounded-lg">
                {/* Room Type Header */}
                <div 
                  className="flex items-center justify-between p-4 bg-indigo-50 cursor-pointer hover:bg-indigo-100 transition-colors"
                  onClick={() => toggleRoomType(roomType.id)}
                >
                  <div className="flex items-center gap-3">
                    <IconChevronDown 
                      className={`w-5 h-5 text-slate-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                    />
                    <div>
                      <h3 className="font-semibold text-slate-900">{roomType.display_name}</h3>
                      <p className="text-sm text-slate-600">
                        {roomStyleCategories.length} 个风格分类, {roomTemplateCount} 个模板
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        alert('Edit Room Type - Coming Soon');
                      }}
                      className="p-2 hover:bg-indigo-200 rounded"
                    >
                      <IconEdit className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        alert('Add Style Category - Coming Soon');
                      }}
                      className="p-2 hover:bg-indigo-200 rounded"
                    >
                      <IconPlus className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>

                {/* Style Categories */}
                {isExpanded && (
                  <div className="p-4 space-y-3">
                    {roomStyleCategories.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        暂无风格分类，点击上方 + 按钮添加
                      </div>
                    ) : (
                      roomStyleCategories.map(styleCategory => {
                        const isStyleExpanded = expandedStyleCategories.has(styleCategory.id);
                        const categoryTemplates = templates.filter(t => t.style_category_id === styleCategory.id);

                        return (
                          <div key={styleCategory.id} className="border border-slate-200 rounded-lg">
                            {/* Style Category Header */}
                            <div 
                              className="flex items-center justify-between p-3 bg-purple-50 cursor-pointer hover:bg-purple-100 transition-colors"
                              onClick={() => toggleStyleCategory(styleCategory.id)}
                            >
                              <div className="flex items-center gap-3">
                                <IconChevronDown 
                                  className={`w-4 h-4 text-slate-600 transition-transform ${isStyleExpanded ? 'rotate-180' : ''}`} 
                                />
                                <div>
                                  <h4 className="font-medium text-slate-900">{styleCategory.display_name}</h4>
                                  <p className="text-xs text-slate-600">{categoryTemplates.length} 个模板</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    alert('Edit Style Category - Coming Soon');
                                  }}
                                  className="p-1.5 hover:bg-purple-200 rounded"
                                >
                                  <IconEdit className="w-3.5 h-3.5 text-slate-600" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    alert('Add Template - Coming Soon');
                                  }}
                                  className="p-1.5 hover:bg-purple-200 rounded"
                                >
                                  <IconPlus className="w-3.5 h-3.5 text-slate-600" />
                                </button>
                              </div>
                            </div>

                            {/* Templates */}
                            {isStyleExpanded && (
                              <div className="p-3">
                                {categoryTemplates.length === 0 ? (
                                  <div className="text-center py-6 text-slate-500 text-sm">
                                    暂无模板，点击上方 + 按钮添加
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 gap-3">
                                    {categoryTemplates.map(template => (
                                      <div 
                                        key={template.id} 
                                        className="border border-slate-200 rounded-lg p-3 hover:border-indigo-300 transition-colors"
                                      >
                                        <div className="flex gap-3">
                                          <img 
                                            src={template.image_url} 
                                            alt={template.name}
                                            className="w-20 h-20 object-cover rounded"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <h5 className="font-medium text-slate-900 truncate">{template.name}</h5>
                                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{template.prompt}</p>
                                            <div className="flex gap-2 mt-2">
                                              <button
                                                onClick={() => alert('Edit Template - Coming Soon')}
                                                className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded"
                                              >
                                                编辑
                                              </button>
                                              <button
                                                onClick={() => alert('Delete Template - Coming Soon')}
                                                className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded"
                                              >
                                                删除
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};



