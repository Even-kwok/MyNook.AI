import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PromptTemplateCategory } from '../types';

interface TemplateData {
  id: string;
  template_id: string;
  name: string;
  image_url: string;
  prompt: string;
  subcategory_id: string | null;
  room_types: string[];
  display_order: number;
  is_active: boolean;
  subcategory_name?: string;
  category_name?: string;
  category_key?: string;
}

/**
 * Hook to load templates grouped by subcategory for a specific room type
 * Used in the main design interface
 */
export const useTemplatesByRoomType = (roomType: string, categoryKey: string = 'interior') => {
  const [categories, setCategories] = useState<PromptTemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query with JOINs - explicitly specify the foreign key relationship
        let query = supabase
          .from('prompt_templates')
          .select(`
            id,
            template_id,
            name,
            image_url,
            prompt,
            subcategory_id,
            room_types,
            display_order,
            is_active,
            subcategories!prompt_templates_subcategory_id_fkey (
              id,
              subcategory_key,
              display_name,
              categories!subcategories_category_id_fkey (
                id,
                category_key,
                display_name
              )
            )
          `)
          .eq('is_active', true)
          .eq('subcategories.categories.category_key', categoryKey)
          .order('display_order', { ascending: true });

        // Filter by room type if specified and not 'all'
        if (roomType && roomType !== 'all') {
          query = query.contains('room_types', [roomType]);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        // Group templates by subcategory
        const grouped: { [key: string]: PromptTemplateCategory } = {};

        (data || []).forEach((t: any) => {
          const subcategoryName = t.subcategories?.display_name || 'Other';
          
          if (!grouped[subcategoryName]) {
            grouped[subcategoryName] = {
              name: subcategoryName,
              templates: [],
            };
          }

          grouped[subcategoryName].templates.push({
            id: t.template_id,
            name: t.name,
            imageUrl: t.image_url,
            prompt: t.prompt,
          });
        });

        // Convert to array
        const categoriesArray = Object.values(grouped);

        setCategories(categoriesArray);
      } catch (err) {
        console.error('Error loading templates:', err);
        setError(err instanceof Error ? err.message : '加载模板失败');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [roomType, categoryKey]);

  return { categories, loading, error };
};

/**
 * Hook to load templates for specific category (wall-finishes, floor-styles, etc.)
 */
export const useTemplatesByCategory = (categoryKey: string) => {
  const [categories, setCategories] = useState<PromptTemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('prompt_templates')
          .select(`
            id,
            template_id,
            name,
            image_url,
            prompt,
            subcategory_id,
            room_types,
            display_order,
            is_active,
            subcategories!prompt_templates_subcategory_id_fkey (
              id,
              subcategory_key,
              display_name,
              categories!subcategories_category_id_fkey (
                id,
                category_key,
                display_name
              )
            )
          `)
          .eq('is_active', true)
          .eq('subcategories.categories.category_key', categoryKey)
          .order('display_order', { ascending: true });

        if (fetchError) throw fetchError;

        // Group by subcategory
        const grouped: { [key: string]: PromptTemplateCategory } = {};

        (data || []).forEach((t: any) => {
          const subcategoryName = t.subcategories?.display_name || 'Other';
          
          if (!grouped[subcategoryName]) {
            grouped[subcategoryName] = {
              name: subcategoryName,
              templates: [],
            };
          }

          grouped[subcategoryName].templates.push({
            id: t.template_id,
            name: t.name,
            imageUrl: t.image_url,
            prompt: t.prompt,
          });
        });

        setCategories(Object.values(grouped));
      } catch (err) {
        console.error('Error loading templates:', err);
        setError(err instanceof Error ? err.message : '加载模板失败');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [categoryKey]);

  return { categories, loading, error };
};

/**
 * Hook to load ALL templates (for Explore page gallery)
 */
export const useAllTemplates = () => {
  const [allTemplates, setAllTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAllTemplates = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('prompt_templates')
          .select(`
            id,
            template_id,
            name,
            image_url,
            prompt,
            display_order,
            is_active
          `)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (fetchError) throw fetchError;

        const formatted = (data || []).map((t: any) => ({
          id: t.template_id,
          name: t.name,
          imageUrl: t.image_url,
          prompt: t.prompt,
        }));

        setAllTemplates(formatted);
      } catch (err) {
        console.error('Error loading all templates:', err);
        setError(err instanceof Error ? err.message : '加载所有模板失败');
        setAllTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllTemplates();
  }, []);

  return { allTemplates, loading, error };
};

