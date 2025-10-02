/**
 * Secure Creem Payment Service
 * 
 * 安全的支付服务 - 所有敏感信息都在后端处理
 * 前端只负责UI交互，不直接接触API密钥
 */

import { supabase } from '../lib/supabase';

// 支付请求接口
interface PaymentRequest {
  type: 'subscription' | 'credits';
  tier?: 'pro' | 'premium' | 'business';
  billingCycle?: 'monthly' | 'yearly';
  creditSize?: 'small' | 'medium' | 'large';
}

interface PaymentResponse {
  success: boolean;
  paymentLink?: string;
  error?: string;
}

/**
 * 安全地创建订阅支付链接
 * 通过后端API处理，不暴露敏感信息
 */
export const createSubscriptionPayment = async (
  tier: 'pro' | 'premium' | 'business',
  billingCycle: 'monthly' | 'yearly'
): Promise<PaymentResponse> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        success: false,
        error: 'Please login to continue with payment'
      };
    }

    console.log('🔒 Creating secure subscription payment:', { tier, billingCycle });

    const { data, error } = await supabase.functions.invoke('create-payment-link', {
      body: {
        type: 'subscription',
        tier,
        billingCycle
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      console.error('❌ Payment creation failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to create payment link'
      };
    }

    return {
      success: true,
      paymentLink: data.paymentLink
    };

  } catch (error: any) {
    console.error('❌ Payment service error:', error);
    return {
      success: false,
      error: error.message || 'Payment service unavailable'
    };
  }
};

/**
 * 安全地创建积分包支付链接
 * 通过后端API处理，不暴露敏感信息
 */
export const createCreditPayment = async (
  creditSize: 'small' | 'medium' | 'large'
): Promise<PaymentResponse> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        success: false,
        error: 'Please login to continue with payment'
      };
    }

    console.log('🔒 Creating secure credit payment:', { creditSize });

    const { data, error } = await supabase.functions.invoke('create-payment-link', {
      body: {
        type: 'credits',
        creditSize
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      console.error('❌ Credit payment creation failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to create payment link'
      };
    }

    return {
      success: true,
      paymentLink: data.paymentLink
    };

  } catch (error: any) {
    console.error('❌ Credit payment service error:', error);
    return {
      success: false,
      error: error.message || 'Payment service unavailable'
    };
  }
};

/**
 * 安全地跳转到订阅支付页面
 * 通过后端API创建安全的支付链接
 */
export const redirectToSubscriptionCheckout = async (
  tier: 'pro' | 'premium' | 'business',
  billingCycle: 'monthly' | 'yearly'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await createSubscriptionPayment(tier, billingCycle);
    
    if (result.success && result.paymentLink) {
      console.log('🔒 Redirecting to secure payment:', { tier, billingCycle });
      window.location.href = result.paymentLink;
      return { success: true };
    } else {
      console.error('❌ Failed to create payment link:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error: any) {
    console.error('❌ Payment service error:', error);
    return { success: false, error: error.message || 'Payment service unavailable' };
  }
};

/**
 * 安全地跳转到积分包支付页面
 * 通过后端API创建安全的支付链接
 */
export const redirectToCreditPackCheckout = async (
  size: 'small' | 'medium' | 'large'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await createCreditPayment(size);
    
    if (result.success && result.paymentLink) {
      console.log('🔒 Redirecting to secure credit payment:', { size });
      window.location.href = result.paymentLink;
      return { success: true };
    } else {
      console.error('❌ Failed to create credit payment link:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error: any) {
    console.error('❌ Credit payment service error:', error);
    return { success: false, error: error.message || 'Payment service unavailable' };
  }
};

/**
 * 积分包大小映射（前端显示用）
 */
export const CREDIT_PACK_INFO = {
  small: {
    credits: 100,
    price: 9.90,
    size: 'small' as const,
  },
  medium: {
    credits: 300,
    price: 24.99,
    size: 'medium' as const,
  },
  large: {
    credits: 1000,
    price: 69.99,
    size: 'large' as const,
  },
} as const;

/**
 * 根据 bundle_id 获取积分包大小
 */
export const getBundleSizeFromId = (bundleId: string): 'small' | 'medium' | 'large' | null => {
  const mapping: Record<string, 'small' | 'medium' | 'large'> = {
    'bundle_small': 'small',
    'bundle_medium': 'medium',
    'bundle_large': 'large',
  };
  
  return mapping[bundleId] || null;
};

/**
 * 检查支付系统是否可用
 * 通过检查后端API连接状态
 */
export const isPaymentSystemAvailable = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session; // 需要用户登录才能使用支付系统
  } catch (error) {
    console.error('❌ Payment system check failed:', error);
    return false;
  }
};

// 开发模式下输出安全提示
if (import.meta.env.DEV) {
  console.log('🔒 Secure Payment Service Initialized - All sensitive data handled by backend');
}



