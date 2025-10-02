import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PromptTemplateCategory } from '../types';

export interface StyleCategory {
  id: string;
  room_type_id: string;
  style_key: string;
  display_name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

export interface Template {
  id: string;
  template_id: string;
  name: string;
  image_url: string;
  prompt: string;
  display_order: number;
}

/**
 * Hook to load style categories for a specific room type
 * Returns categories with their templates grouped
 */
export const useStyleCategories = (roomTypeId: string | null) => {
  const [categories, setCategories] = useState<PromptTemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStyleCategories = async () => {
      // If no room type selected, return empty
      if (!roomTypeId) {
        setCategories([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load style categories for the selected room type
        const { data: styleCategories, error: categoriesError } = await supabase
          .from('style_categories')
          .select('*')
          .eq('room_type_id', roomTypeId)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (categoriesError) throw categoriesError;

        if (!styleCategories || styleCategories.length === 0) {
          setCategories([]);
          setLoading(false);
          return;
        }

        // Load templates for all style categories
        const styleCategoryIds = styleCategories.map(sc => sc.id);
        
        const { data: templates, error: templatesError } = await supabase
          .from('prompt_templates')
          .select('id, template_id, name, image_url, prompt, style_category_id, display_order')
          .in('style_category_id', styleCategoryIds)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (templatesError) throw templatesError;

        // Group templates by style category (只包含有模板的分类)
        const grouped = styleCategories
          .map(category => {
            const categoryTemplates = (templates || [])
              .filter(t => t.style_category_id === category.id)
              .map(t => ({
                id: t.template_id,
                name: t.name,
                imageUrl: t.image_url,
                prompt: t.prompt,
              }));
            
            return {
              name: category.display_name,
              templates: categoryTemplates
            };
          })
          .filter(cat => cat.templates.length > 0); // 只返回有模板的分类

        setCategories(grouped);
      } catch (err) {
        console.error('Error loading style categories:', err);
        setError(err instanceof Error ? err.message : '加载风格分类失败');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadStyleCategories();
  }, [roomTypeId]);

  return { categories, loading, error };
};

/**
 * Hook to load style categories by category key (for other pages like wall-finishes, garden, etc.)
 */
export const useStyleCategoriesByKey = (categoryKey: string) => {
  const [categories, setCategories] = useState<PromptTemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        // For non-interior categories, we'll need a different approach
        // For now, return empty (will implement later based on your needs)
        setCategories([]);
      } catch (err) {
        console.error('Error loading categories:', err);
        setError(err instanceof Error ? err.message : '加载分类失败');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [categoryKey]);

  return { categories, loading, error };
};

