import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../Button';
import { AnimatePresence, motion } from 'framer-motion';
import { IconX, IconChevronDown, IconEdit, IconTrash, IconPlus } from '../Icons';
import { FeaturePageModal } from './FeaturePageModal';
import { RoomTypeModal } from './RoomTypeModal';
import { StyleCategoryModal } from './StyleCategoryModal';
import { TemplateModal } from './TemplateModal';

interface FeaturePage {
  id: string;
  page_key: string;
  display_name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

interface RoomType {
  id: string;
  room_key: string;
  display_name: string;
  feature_page_id: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  feature_page_name?: string;
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
}

export const FeaturePageManager: React.FC = () => {
  const [featurePages, setFeaturePages] = useState<FeaturePage[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [styleCategories, setStyleCategories] = useState<StyleCategory[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 展开状态
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [expandedRoomTypes, setExpandedRoomTypes] = useState<Set<string>>(new Set());
  const [expandedStyleCategories, setExpandedStyleCategories] = useState<Set<string>>(new Set());
  
  // 模态框状态
  const [featurePageModal, setFeaturePageModal] = useState<{ isOpen: boolean; editing: FeaturePage | null }>({ isOpen: false, editing: null });
  const [roomTypeModal, setRoomTypeModal] = useState<{ isOpen: boolean; editing: RoomType | null; featurePageId: string | null }>({ isOpen: false, editing: null, featurePageId: null });
  const [styleCategoryModal, setStyleCategoryModal] = useState<{ isOpen: boolean; editing: StyleCategory | null; roomTypeId: string | null }>({ isOpen: false, editing: null, roomTypeId: null });
  const [templateModal, setTemplateModal] = useState<{ isOpen: boolean; editing: Template | null; styleCategoryId: string | null }>({ isOpen: false, editing: null, styleCategoryId: null });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load feature pages
      const { data: pagesData, error: pagesError } = await supabase
        .from('feature_pages')
        .select('*')
        .order('display_order', { ascending: true });

      if (pagesError) throw pagesError;

      // Load room types with feature page info
      const { data: roomTypesData, error: rtError } = await supabase
        .from('room_types')
        .select(`
          *,
          feature_pages (
            page_key,
            display_name
          )
        `)
        .order('display_order', { ascending: true });

      if (rtError) throw rtError;

      // Load style categories with room type info
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
            display_name
          )
        `)
        .order('display_order', { ascending: true });

      if (tError) throw tError;

      setFeaturePages(pagesData || []);
      
      const roomTypesWithPageName = (roomTypesData || []).map(rt => ({
        ...rt,
        feature_page_name: rt.feature_pages?.display_name || 'No Page'
      }));
      setRoomTypes(roomTypesWithPageName);
      
      const styleCategoriesWithRoomName = (styleCategoriesData || []).map(sc => ({
        ...sc,
        room_type_name: sc.room_types?.display_name || 'No Room'
      }));
      setStyleCategories(styleCategoriesWithRoomName);
      
      const templatesWithInfo = (templatesData || []).map(t => ({
        ...t,
        style_category_name: t.style_categories?.display_name || 'No Style'
      }));
      setTemplates(templatesWithInfo);

    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const togglePage = (pageId: string) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageId)) {
      newExpanded.delete(pageId);
    } else {
      newExpanded.add(pageId);
    }
    setExpandedPages(newExpanded);
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

  // 删除函数
  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`确定要删除模板 "${templateName}" 吗？`)) return;
    
    try {
      const { error } = await supabase
        .from('prompt_templates')
        .delete()
        .eq('id', templateId);
      
      if (error) throw error;
      loadAllData();
    } catch (err) {
      console.error('Error deleting template:', err);
      alert('删除失败');
    }
  };

  const handleDeleteStyleCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`确定要删除风格分类 "${categoryName}" 吗？这将同时删除其下所有模板。`)) return;
    
    try {
      const { error } = await supabase
        .from('style_categories')
        .delete()
        .eq('id', categoryId);
      
      if (error) throw error;
      loadAllData();
    } catch (err) {
      console.error('Error deleting style category:', err);
      alert('删除失败');
    }
  };

  const handleDeleteRoomType = async (roomTypeId: string, roomTypeName: string) => {
    if (!confirm(`确定要删除房间类型 "${roomTypeName}" 吗？这将同时删除其下所有风格分类和模板。`)) return;
    
    try {
      const { error } = await supabase
        .from('room_types')
        .delete()
        .eq('id', roomTypeId);
      
      if (error) throw error;
      loadAllData();
    } catch (err) {
      console.error('Error deleting room type:', err);
      alert('删除失败');
    }
  };

  const handleDeleteFeaturePage = async (pageId: string, pageName: string) => {
    if (!confirm(`确定要删除功能页面 "${pageName}" 吗？这将同时删除其下所有内容。`)) return;
    
    try {
      const { error } = await supabase
        .from('feature_pages')
        .delete()
        .eq('id', pageId);
      
      if (error) throw error;
      loadAllData();
    } catch (err) {
      console.error('Error deleting feature page:', err);
      alert('删除失败');
    }
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

  // Calculate statistics
  const totalRoomTypes = roomTypes.length;
  const totalStyleCategories = styleCategories.length;
  const totalTemplates = templates.length;
  const activeTemplates = templates.filter(t => t.is_active).length;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">模板管理（完整层级）</h1>
          <p className="text-slate-600">
            管理所有功能页面的模板: Feature Pages → Room Types → Style Categories → Templates
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setFeaturePageModal({ isOpen: true, editing: null })}>
            <IconPlus className="w-4 h-4 mr-2" />
            添加功能页面
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-blue-600">{featurePages.length}</div>
          <div className="text-sm text-slate-600">功能页面</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-indigo-600">{totalRoomTypes}</div>
          <div className="text-sm text-slate-600">房间/场景类型</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-purple-600">{totalStyleCategories}</div>
          <div className="text-sm text-slate-600">风格分类</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-green-600">{totalTemplates}</div>
          <div className="text-sm text-slate-600">模板总数</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-orange-600">{activeTemplates}</div>
          <div className="text-sm text-slate-600">活跃模板</div>
        </div>
      </div>

      {/* Hierarchical View */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">完整层级结构</h2>
        </div>
        
        <div className="p-6 space-y-4">
          {featurePages.map(page => {
            const isPageExpanded = expandedPages.has(page.id);
            const pageRoomTypes = roomTypes.filter(rt => rt.feature_page_id === page.id);
            const pageStyleCategories = styleCategories.filter(sc => 
              pageRoomTypes.some(rt => rt.id === sc.room_type_id)
            );
            const pageTemplates = templates.filter(t => 
              pageStyleCategories.some(sc => sc.id === t.style_category_id)
            );

            return (
              <div key={page.id} className="border-2 border-blue-200 rounded-lg">
                {/* Feature Page Header */}
                <div 
                  className="flex items-center justify-between p-4 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => togglePage(page.id)}
                >
                  <div className="flex items-center gap-3">
                    <IconChevronDown 
                      className={`w-5 h-5 text-slate-600 transition-transform ${isPageExpanded ? 'rotate-180' : ''}`} 
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">📦 {page.display_name}</h3>
                      <p className="text-sm text-slate-600">
                        {pageRoomTypes.length} 个场景类型, {pageStyleCategories.length} 个风格分类, {pageTemplates.length} 个模板
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFeaturePageModal({ isOpen: true, editing: page });
                      }}
                      className="p-2 hover:bg-blue-200 rounded"
                      title="编辑功能页面"
                    >
                      <IconEdit className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRoomTypeModal({ isOpen: true, editing: null, featurePageId: page.id });
                      }}
                      className="p-2 hover:bg-blue-200 rounded"
                      title="添加场景类型"
                    >
                      <IconPlus className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFeaturePage(page.id, page.display_name);
                      }}
                      className="p-2 hover:bg-red-200 rounded"
                      title="删除功能页面"
                    >
                      <IconTrash className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Room Types */}
                {isPageExpanded && (
                  <div className="p-4 space-y-3">
                    {pageRoomTypes.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-blue-200 rounded-lg">
                        <p className="text-slate-500 mb-4">暂无场景类型</p>
                        <button
                          onClick={() => setRoomTypeModal({ isOpen: true, editing: null, featurePageId: page.id })}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <IconPlus className="w-5 h-5" />
                          添加第一个场景类型
                        </button>
                      </div>
                    ) : (
                      pageRoomTypes.map(roomType => {
                        const isRoomExpanded = expandedRoomTypes.has(roomType.id);
                        const roomStyleCategories = styleCategories.filter(sc => sc.room_type_id === roomType.id);
                        const roomTemplates = templates.filter(t => 
                          roomStyleCategories.some(sc => sc.id === t.style_category_id)
                        );

                        return (
                          <div key={roomType.id} className="border border-indigo-200 rounded-lg">
                            {/* Room Type Header */}
                            <div 
                              className="flex items-center justify-between p-3 bg-indigo-50 cursor-pointer hover:bg-indigo-100 transition-colors"
                              onClick={() => toggleRoomType(roomType.id)}
                            >
                              <div className="flex items-center gap-3">
                                <IconChevronDown 
                                  className={`w-4 h-4 text-slate-600 transition-transform ${isRoomExpanded ? 'rotate-180' : ''}`} 
                                />
                                <div>
                                  <h4 className="font-semibold text-slate-900">{roomType.display_name}</h4>
                                  <p className="text-xs text-slate-600">
                                    {roomStyleCategories.length} 个风格分类, {roomTemplates.length} 个模板
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRoomTypeModal({ isOpen: true, editing: roomType, featurePageId: null });
                                  }}
                                  className="p-1.5 hover:bg-indigo-200 rounded"
                                  title="编辑房间类型"
                                >
                                  <IconEdit className="w-3.5 h-3.5 text-slate-600" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStyleCategoryModal({ isOpen: true, editing: null, roomTypeId: roomType.id });
                                  }}
                                  className="p-1.5 hover:bg-indigo-200 rounded"
                                  title="添加风格分类"
                                >
                                  <IconPlus className="w-3.5 h-3.5 text-slate-600" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteRoomType(roomType.id, roomType.display_name);
                                  }}
                                  className="p-1.5 hover:bg-red-200 rounded"
                                  title="删除房间类型"
                                >
                                  <IconTrash className="w-3.5 h-3.5 text-red-600" />
                                </button>
                              </div>
                            </div>

                            {/* Style Categories */}
                            {isRoomExpanded && (
                              <div className="p-3 space-y-3">
                                {roomStyleCategories.length === 0 ? (
                                  <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                                    <p className="text-slate-500 text-sm mb-3">暂无风格分类</p>
                                    <button
                                      onClick={() => setStyleCategoryModal({ isOpen: true, editing: null, roomTypeId: roomType.id })}
                                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                      <IconPlus className="w-4 h-4" />
                                      添加风格分类
                                    </button>
                                  </div>
                                ) : (
                                  roomStyleCategories.map(styleCategory => {
                                    const isStyleExpanded = expandedStyleCategories.has(styleCategory.id);
                                    const categoryTemplates = templates.filter(t => t.style_category_id === styleCategory.id);

                                    return (
                                      <div key={styleCategory.id} className="border border-purple-200 rounded-lg">
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
                                              <h5 className="font-medium text-slate-900">{styleCategory.display_name}</h5>
                                              <p className="text-xs text-slate-600">{categoryTemplates.length} 个模板</p>
                                            </div>
                                          </div>
                                          <div className="flex gap-2">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setStyleCategoryModal({ isOpen: true, editing: styleCategory, roomTypeId: null });
                                              }}
                                              className="p-1.5 hover:bg-purple-200 rounded"
                                              title="编辑风格分类"
                                            >
                                              <IconEdit className="w-3.5 h-3.5 text-slate-600" />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setTemplateModal({ isOpen: true, editing: null, styleCategoryId: styleCategory.id });
                                              }}
                                              className="p-1.5 hover:bg-purple-200 rounded"
                                              title="添加模板"
                                            >
                                              <IconPlus className="w-3.5 h-3.5 text-slate-600" />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteStyleCategory(styleCategory.id, styleCategory.display_name);
                                              }}
                                              className="p-1.5 hover:bg-red-200 rounded"
                                              title="删除风格分类"
                                            >
                                              <IconTrash className="w-3.5 h-3.5 text-red-600" />
                                            </button>
                                          </div>
                                        </div>

                                        {/* Templates */}
                                        {isStyleExpanded && (
                                          <div className="p-3 space-y-3">
                                            {/* 添加模板按钮 - 始终显示 */}
                                            <div className="flex justify-end">
                                              <button
                                                onClick={() => setTemplateModal({ isOpen: true, editing: null, styleCategoryId: styleCategory.id })}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                                              >
                                                <IconPlus className="w-4 h-4" />
                                                添加模板
                                              </button>
                                            </div>

                                            {categoryTemplates.length === 0 ? (
                                              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                                                <p className="text-slate-500 text-sm">暂无模板，点击上方按钮添加</p>
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
                                                        <h6 className="font-medium text-slate-900 truncate text-sm">{template.name}</h6>
                                                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{template.prompt}</p>
                                                        <div className="flex gap-2 mt-2">
                                                          <button
                                                            onClick={() => setTemplateModal({ isOpen: true, editing: template, styleCategoryId: null })}
                                                            className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded"
                                                          >
                                                            编辑
                                                          </button>
                                                          <button
                                                            onClick={() => handleDeleteTemplate(template.id, template.name)}
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
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <FeaturePageModal
        isOpen={featurePageModal.isOpen}
        onClose={() => setFeaturePageModal({ isOpen: false, editing: null })}
        onSuccess={loadAllData}
        editingPage={featurePageModal.editing}
      />

      <RoomTypeModal
        isOpen={roomTypeModal.isOpen}
        onClose={() => setRoomTypeModal({ isOpen: false, editing: null, featurePageId: null })}
        onSuccess={loadAllData}
        featurePageId={roomTypeModal.featurePageId || roomTypeModal.editing?.feature_page_id || ''}
        editingRoomType={roomTypeModal.editing}
      />

      <StyleCategoryModal
        isOpen={styleCategoryModal.isOpen}
        onClose={() => setStyleCategoryModal({ isOpen: false, editing: null, roomTypeId: null })}
        onSuccess={loadAllData}
        roomTypeId={styleCategoryModal.roomTypeId || styleCategoryModal.editing?.room_type_id || ''}
        editingStyleCategory={styleCategoryModal.editing}
      />

      <TemplateModal
        isOpen={templateModal.isOpen}
        onClose={() => setTemplateModal({ isOpen: false, editing: null, styleCategoryId: null })}
        onSuccess={loadAllData}
        styleCategoryId={templateModal.styleCategoryId || templateModal.editing?.style_category_id || ''}
        editingTemplate={templateModal.editing}
      />
    </div>
  );
};

