import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PromptTemplateCategory } from '../types';

/**
 * Hook to load templates for a specific feature page
 * Returns grouped templates by style categories
 * 
 * @param featurePageKey - The feature page key (e.g., 'floor-style', 'festive-decor')
 */
export const useFeaturePageTemplates = (featurePageKey: string) => {
  const [categories, setCategories] = useState<PromptTemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFeaturePageTemplates = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Get the feature page
        const { data: featurePage, error: pageError } = await supabase
          .from('feature_pages')
          .select('id')
          .eq('page_key', featurePageKey)
          .eq('is_active', true)
          .single();

        if (pageError) throw pageError;
        if (!featurePage) {
          console.warn(`Feature page '${featurePageKey}' not found`);
          setCategories([]);
          setLoading(false);
          return;
        }

        // 2. Get room types for this feature page
        const { data: roomTypes, error: roomError } = await supabase
          .from('room_types')
          .select('id')
          .eq('feature_page_id', featurePage.id)
          .eq('is_active', true);

        if (roomError) throw roomError;
        if (!roomTypes || roomTypes.length === 0) {
          console.warn(`No room types found for feature page '${featurePageKey}'`);
          setCategories([]);
          setLoading(false);
          return;
        }

        const roomTypeIds = roomTypes.map(rt => rt.id);

        // 3. Get all style categories for these room types
        const { data: styleCategories, error: categoriesError } = await supabase
          .from('style_categories')
          .select('*')
          .in('room_type_id', roomTypeIds)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (categoriesError) throw categoriesError;
        if (!styleCategories || styleCategories.length === 0) {
          console.warn(`No style categories found for feature page '${featurePageKey}'`);
          setCategories([]);
          setLoading(false);
          return;
        }

        const styleCategoryIds = styleCategories.map(sc => sc.id);

        // 4. Get all templates for these style categories
        const { data: templates, error: templatesError } = await supabase
          .from('prompt_templates')
          .select('id, template_id, name, image_url, prompt, style_category_id, display_order')
          .in('style_category_id', styleCategoryIds)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (templatesError) throw templatesError;

        // 5. Group templates by style category
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
          .filter(cat => cat.templates.length > 0); // Only return categories with templates

        setCategories(grouped);
      } catch (err) {
        console.error(`Error loading templates for ${featurePageKey}:`, err);
        setError(err instanceof Error ? err.message : `加载 ${featurePageKey} 模板失败`);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturePageTemplates();
  }, [featurePageKey]);

  return { categories, loading, error };
};



