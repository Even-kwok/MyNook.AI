import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 前端只需要这些信息，不需要完整的 prompt
interface TemplatePreview {
  id: string;
  template_id: string;
  name: string;
  imageUrl: string; // 注意：匹配前端的命名
  subcategory_id: string | null;
  subcategory_name?: string;
  category_name?: string;
  room_types: string[];
  is_active: boolean;
  display_order: number;
}

interface TemplateCategory {
  name: string;
  templates: TemplatePreview[];
}

export const useTemplates = (roomType?: string) => {
  const [templates, setTemplates] = useState<TemplatePreview[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        
        // 使用JOIN查询获取完整的category和subcategory信息
        // 只查询前端需要的字段，不查询 prompt（保护核心资产）
        let query = supabase
          .from('prompt_templates')
          .select(`
            id,
            template_id,
            name,
            image_url,
            subcategory_id,
            room_types,
            is_active,
            display_order,
            subcategories!inner (
              id,
              subcategory_key,
              display_name,
              categories!inner (
                id,
                category_key,
                display_name
              )
            )
          `)
          .eq('is_active', true)
          .eq('subcategories.categories.category_key', 'interior') // 只加载室内设计模板
          .order('display_order', { ascending: true });

        // 如果指定了房间类型，筛选适用的模板
        if (roomType && roomType !== 'all') {
          query = query.contains('room_types', [roomType]);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        // 转换数据格式以匹配前端期望的结构
        const formattedTemplates: TemplatePreview[] = (data || []).map((t: any) => ({
          id: t.template_id, // 前端使用 template_id 作为 id
          template_id: t.template_id,
          name: t.name,
          imageUrl: t.image_url, // 转换为驼峰命名
          subcategory_id: t.subcategory_id,
          subcategory_name: t.subcategories?.display_name,
          category_name: t.subcategories?.categories?.display_name,
          room_types: t.room_types || [],
          is_active: t.is_active,
          display_order: t.display_order,
        }));

        setTemplates(formattedTemplates);

        // 按子类别分组
        const grouped = formattedTemplates.reduce((acc, template) => {
          const categoryName = template.subcategory_name || 'Other Styles';
          const existing = acc.find(c => c.name === categoryName);
          
          if (existing) {
            existing.templates.push(template);
          } else {
            acc.push({
              name: categoryName,
              templates: [template],
            });
          }
          
          return acc;
        }, [] as TemplateCategory[]);

        setCategories(grouped);
      } catch (err) {
        console.error('Error loading templates:', err);
        setError(err instanceof Error ? err.message : '加载模板失败');
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [roomType]);

  return { templates, categories, loading, error };
};

// Hook for loading templates by category (wall paint, floor style, etc.)
// categoryKey: 'wall-finishes', 'floor-styles', 'garden', 'exterior', 'festive'
export const useTemplatesByCategory = (categoryKey: string) => {
  const [templates, setTemplates] = useState<TemplatePreview[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        
        // 使用JOIN查询获取指定category下的所有模板
        const { data, error: fetchError } = await supabase
          .from('prompt_templates')
          .select(`
            id,
            template_id,
            name,
            image_url,
            subcategory_id,
            room_types,
            is_active,
            display_order,
            subcategories!inner (
              id,
              subcategory_key,
              display_name,
              categories!inner (
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

        const formattedTemplates: TemplatePreview[] = (data || []).map((t: any) => ({
          id: t.template_id,
          template_id: t.template_id,
          name: t.name,
          imageUrl: t.image_url,
          subcategory_id: t.subcategory_id,
          subcategory_name: t.subcategories?.display_name,
          category_name: t.subcategories?.categories?.display_name,
          room_types: t.room_types || [],
          is_active: t.is_active,
          display_order: t.display_order,
        }));

        setTemplates(formattedTemplates);

        // 按子类别分组
        const grouped = formattedTemplates.reduce((acc, template) => {
          const categoryName = template.subcategory_name || 'Styles';
          const existing = acc.find(c => c.name === categoryName);
          
          if (existing) {
            existing.templates.push(template);
          } else {
            acc.push({
              name: categoryName,
              templates: [template],
            });
          }
          
          return acc;
        }, [] as TemplateCategory[]);

        setCategories(grouped);
      } catch (err) {
        console.error('Error loading templates:', err);
        setError(err instanceof Error ? err.message : '加载模板失败');
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [categoryKey]);

  return { templates, categories, loading, error };
};

