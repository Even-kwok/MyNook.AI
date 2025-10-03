import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SubscriptionTier {
  id: string;
  tier: 'pro' | 'premium' | 'business';
  name: string;
  price_usd: number; // Monthly price
  price_yearly_usd?: number; // Yearly price (monthly equivalent)
  yearly_billed_usd?: number; // Total billed amount for yearly
  credits_per_month: number;
  max_credits_purchase: number;
  features: {
    basic_styles?: boolean;
    advanced_styles?: boolean;
    free_canvas?: boolean;
    hd_export?: boolean;
    history_days?: number;
    watermark?: boolean;
    concurrent_generations?: number;
    priority_queue?: boolean;
    api_access?: boolean;
    custom_styles?: boolean;
    team_collaboration?: boolean;
    white_label?: boolean;
    dedicated_support?: boolean;
    sla_guarantee?: boolean;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useSubscriptionTiers = () => {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('is_active', true)
        .order('price_usd', { ascending: true });

      if (error) throw error;
      setTiers(data || []);
    } catch (err) {
      console.error('Error fetching subscription tiers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription tiers');
    } finally {
      setLoading(false);
    }
  };

  return { tiers, loading, error, refetch: fetchTiers };
};

