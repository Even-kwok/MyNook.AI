import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook to load active feature pages from database
 * Returns array of active page_keys
 */
export const useActiveFeatures = () => {
  const [activeFeatures, setActiveFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActiveFeatures = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('feature_pages')
          .select('page_key')
          .eq('is_active', true);

        if (error) throw error;
        
        setActiveFeatures(data?.map(f => f.page_key) || []);
      } catch (err) {
        console.error('Error loading active features:', err);
        // 如果加载失败，默认显示所有功能（容错）
        setActiveFeatures([
          'interior-design',
          'festive-decor',
          'exterior-design',
          'floor-style',
          'garden-backyard',
          'item-replace',
          'wall-paint',
          'reference-style',
          'multi-item',
          'free-canvas'
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadActiveFeatures();
  }, []);

  return { activeFeatures, loading };
};



