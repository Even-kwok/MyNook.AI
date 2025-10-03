import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Category, Subcategory, PromptTemplate } from '../../lib/database.types';
import { Button } from '../Button';
import { AnimatePresence, motion } from 'framer-motion';
import { IconX, IconChevronDown } from '../Icons';
import { TemplateEditModal } from './TemplateEditModal';

interface CategoryWithSubcategories extends Category {
  subcategories: (Subcategory & { templates: PromptTemplate[] })[];
}

export const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<CategoryWithSubcategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<{ id: string; name: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load categories
      const { data: categoriesData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (catError) throw catError;

      // Load subcategories with templates
      const categoriesWithData: CategoryWithSubcategories[] = [];
      
      for (const category of categoriesData || []) {
        const { data: subcategoriesData, error: subError } = await supabase
          .from('subcategories')
          .select('*')
          .eq('category_id', category.id)
          .order('display_order', { ascending: true });

        if (subError) throw subError;

        const subcategoriesWithTemplates = [];
        
        for (const subcategory of subcategoriesData || []) {
          const { data: templatesData, error: tempError } = await supabase
            .from('prompt_templates')
            .select('*')
            .eq('subcategory_id', subcategory.id)
            .order('display_order', { ascending: true });

          if (tempError) throw tempError;

          subcategoriesWithTemplates.push({
            ...subcategory,
            templates: templatesData || [],
          });
        }

        categoriesWithData.push({
          ...category,
          subcategories: subcategoriesWithTemplates,
        });
      }

      setCategories(categoriesWithData);
    } catch (err) {
      console.error('Error loading category data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const toggleSubcategory = (subcategoryId: string) => {
    setExpandedSubcategories(prev => {
      const next = new Set(prev);
      if (next.has(subcategoryId)) {
        next.delete(subcategoryId);
      } else {
        next.add(subcategoryId);
      }
      return next;
    });
  };

  const handleToggleCategoryActive = async (category: Category) => {
    try {
      const newStatus = !category.is_active;
      const { error } = await supabase
        .from('categories')
        .update({ is_active: newStatus })
        .eq('id', category.id);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        action_param: 'toggle_active',
        entity_type_param: 'category',
        entity_id_param: category.id,
        details_param: { is_active: newStatus },
      });

      loadData();
    } catch (err) {
      console.error('Error toggling category:', err);
      alert('Failed to toggle category: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleToggleSubcategoryActive = async (subcategory: Subcategory) => {
    try {
      const newStatus = !subcategory.is_active;
      const { error } = await supabase
        .from('subcategories')
        .update({ is_active: newStatus })
        .eq('id', subcategory.id);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        action_param: 'toggle_active',
        entity_type_param: 'subcategory',
        entity_id_param: subcategory.id,
        details_param: { is_active: newStatus },
      });

      loadData();
    } catch (err) {
      console.error('Error toggling subcategory:', err);
      alert('Failed to toggle subcategory: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Are you sure? This will delete the category and all its subcategories and templates.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        action_param: 'delete',
        entity_type_param: 'category',
        entity_id_param: categoryId,
      });

      loadData();
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDeleteSubcategory = async (subcategoryId: string) => {
    if (!window.confirm('Are you sure? This will delete the subcategory and all its templates.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', subcategoryId);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        action_param: 'delete',
        entity_type_param: 'subcategory',
        entity_id_param: subcategoryId,
      });

      loadData();
    } catch (err) {
      console.error('Error deleting subcategory:', err);
      alert('Failed to delete subcategory: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleAddTemplate = (subcategoryId: string, subcategoryName: string) => {
    setEditingTemplate(null);
    setSelectedSubcategory({ id: subcategoryId, name: subcategoryName });
    setIsModalOpen(true);
  };

  const handleEditTemplate = (template: PromptTemplate, subcategoryName: string) => {
    setEditingTemplate(template);
    setSelectedSubcategory({ id: template.subcategory_id!, name: subcategoryName });
    setIsModalOpen(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('prompt_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        action_param: 'delete',
        entity_type_param: 'template',
        entity_id_param: templateId,
      });

      loadData();
    } catch (err) {
      console.error('Error deleting template:', err);
      alert('Failed to delete template: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Style Template Management</h1>
          <p className="text-slate-600 mt-1">
            Manage categories, subcategories, and templates ({categories.reduce((sum, cat) => sum + cat.subcategories.reduce((subSum, sub) => subSum + sub.templates.length, 0), 0)} templates total)
          </p>
        </div>
        <Button primary onClick={() => alert('Add Category modal - TODO')}>
          <span className="text-xl mr-2">+</span>
          Add Category
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Categories */}
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {/* Category Header */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <IconChevronDown
                    className={`w-5 h-5 transition-transform ${
                      expandedCategories.has(category.id) ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{category.display_name}</h2>
                  <p className="text-sm text-slate-600">
                    {category.subcategories.length} subcategories • {category.category_key}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Active Toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={category.is_active}
                    onChange={() => handleToggleCategoryActive(category)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Subcategories */}
            <AnimatePresence>
              {expandedCategories.has(category.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-3">
                    {category.subcategories.map((subcategory) => (
                      <div key={subcategory.id} className="bg-slate-50 rounded-lg border border-slate-200">
                        {/* Subcategory Header */}
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleSubcategory(subcategory.id)}
                              className="text-slate-600 hover:text-slate-900 transition-colors"
                            >
                              <IconChevronDown
                                className={`w-4 h-4 transition-transform ${
                                  expandedSubcategories.has(subcategory.id) ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                            <div>
                              <h3 className="font-semibold text-slate-900">{subcategory.display_name}</h3>
                              <p className="text-xs text-slate-500">
                                {subcategory.templates.length} templates • {subcategory.subcategory_key}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Active Toggle */}
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={subcategory.is_active}
                                onChange={() => handleToggleSubcategoryActive(subcategory)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteSubcategory(subcategory.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Templates */}
                        <AnimatePresence>
                          {expandedSubcategories.has(subcategory.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-3 pt-0">
                                <div className="grid grid-cols-6 gap-3">
                                  {subcategory.templates.map((template) => (
                                    <div
                                      key={template.id}
                                      className="relative aspect-square bg-white rounded border border-slate-200 overflow-hidden group cursor-pointer"
                                      onClick={() => handleEditTemplate(template, subcategory.display_name)}
                                    >
                                      <img
                                        src={template.image_url}
                                        alt={template.name}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex flex-col items-center justify-center gap-2">
                                        <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 text-center px-2">
                                          {template.name}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTemplate(template.id);
                                          }}
                                          className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                      {!template.is_active && (
                                        <div className="absolute top-1 left-1">
                                          <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded">
                                            Disabled
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {/* Add Template Button */}
                                  <button
                                    onClick={() => handleAddTemplate(subcategory.id, subcategory.display_name)}
                                    className="aspect-square border-2 border-dashed border-slate-300 rounded hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex items-center justify-center text-slate-400 hover:text-indigo-600"
                                  >
                                    <span className="text-3xl">+</span>
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Template Edit Modal */}
      <AnimatePresence>
        {isModalOpen && selectedSubcategory && (
          <TemplateEditModal
            template={editingTemplate}
            subcategoryId={selectedSubcategory.id}
            subcategoryName={selectedSubcategory.name}
            onClose={() => {
              setIsModalOpen(false);
              setEditingTemplate(null);
              setSelectedSubcategory(null);
            }}
            onSave={() => {
              loadData();
              setIsModalOpen(false);
              setEditingTemplate(null);
              setSelectedSubcategory(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

