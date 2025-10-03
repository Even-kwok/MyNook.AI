import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface RoomType {
  id: string;
  room_key: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  feature_page_id: string;
}

/**
 * Hook to load active room types for a specific feature page
 * @param featurePageKey - The feature page key (e.g., 'interior-design')
 */
export const useRoomTypes = (featurePageKey: string = 'interior-design') => {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRoomTypes = async () => {
      try {
        setLoading(true);
        setError(null);

        // First get the feature page ID
        const { data: featurePage, error: pageError } = await supabase
          .from('feature_pages')
          .select('id')
          .eq('page_key', featurePageKey)
          .eq('is_active', true)
          .single();

        if (pageError) throw pageError;
        if (!featurePage) {
          throw new Error(`Feature page '${featurePageKey}' not found`);
        }

        // Then get room types for that feature page
        const { data, error: fetchError } = await supabase
          .from('room_types')
          .select('*')
          .eq('feature_page_id', featurePage.id)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (fetchError) throw fetchError;

        setRoomTypes(data || []);
      } catch (err) {
        console.error('Error loading room types:', err);
        setError(err instanceof Error ? err.message : '加载房间类型失败');
        setRoomTypes([]);
      } finally {
        setLoading(false);
      }
    };

    loadRoomTypes();
  }, [featurePageKey]);

  return { roomTypes, loading, error };
};

