/**
 * Creem Payment Service
 * 
 * Creem 是一个为 AI SaaS 设计的完整支付平台
 * 集成方式：Payment Links（支付链接）
 */

// Creem API Key
const CREEM_API_KEY = import.meta.env.VITE_CREEM_API_KEY;

// Creem 产品 ID 映射
export const CREEM_PRODUCTS = {
  // 订阅产品
  subscriptions: {
    pro: {
      monthly: 'prod_2JlRhCPx3dJVaQUNLRgo6D',
      yearly: 'prod_43bA82tdR38NzQksz6fHxH',
    },
    premium: {
      monthly: 'prod_3wRnKHJa6LSF5afsd1QjEG',
      yearly: 'prod_18rfRuIGJVtWPeIIfZpLWA',
    },
    business: {
      monthly: 'prod_wMGy2WQe6Kv5PmTZLjcsn',
      yearly: 'prod_6065m1QjyimGZ8lg15pqB5',
    },
  },
  
  // 积分包
  credits: {
    small: 'prod_22tEVFxJtOQU8cm5H10bZc',    // 100 credits - $9.90
    medium: 'prod_3E171a5TGDhmBhtYM0Gbk3',   // 300 credits - $24.99
    large: 'prod_MmthQ5RlRKNalU3rEsowB',     // 1000 credits - $69.99
  },
} as const;

// Creem Payment Link 基础 URL
const CREEM_PAYMENT_BASE_URL = 'https://www.creem.io/payment';

/**
 * 获取订阅产品的支付链接
 * @param tier - 订阅层级 (pro, premium, business)
 * @param billingCycle - 计费周期 (monthly, yearly)
 * @param userId - 用户 ID (可选，用于追踪)
 * @param userEmail - 用户邮箱 (可选，用于预填)
 * @returns 支付链接
 */
export const getSubscriptionPaymentLink = (
  tier: 'pro' | 'premium' | 'business',
  billingCycle: 'monthly' | 'yearly',
  userId?: string,
  userEmail?: string
): string => {
  const productId = CREEM_PRODUCTS.subscriptions[tier][billingCycle];
  const baseUrl = `${CREEM_PAYMENT_BASE_URL}/${productId}`;
  
  // 构建 URL 参数
  const params = new URLSearchParams();
  
  if (userId) {
    params.set('client_reference_id', userId);
    params.set('metadata[user_id]', userId);
  }
  
  if (userEmail) {
    params.set('prefilled_email', userEmail);
  }
  
  // 添加成功和取消回调 URL
  const successUrl = `${window.location.origin}/?payment=success&tier=${tier}&billing=${billingCycle}`;
  const cancelUrl = `${window.location.origin}/?payment=cancelled`;
  
  params.set('success_url', successUrl);
  params.set('cancel_url', cancelUrl);
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

/**
 * 获取积分包的支付链接
 * @param size - 积分包大小 (small, medium, large)
 * @param userId - 用户 ID (可选，用于追踪)
 * @param userEmail - 用户邮箱 (可选，用于预填)
 * @returns 支付链接
 */
export const getCreditPackPaymentLink = (
  size: 'small' | 'medium' | 'large',
  userId?: string,
  userEmail?: string
): string => {
  const productId = CREEM_PRODUCTS.credits[size];
  const baseUrl = `${CREEM_PAYMENT_BASE_URL}/${productId}`;
  
  // 构建 URL 参数
  const params = new URLSearchParams();
  
  if (userId) {
    params.set('client_reference_id', userId);
    params.set('metadata[user_id]', userId);
    params.set('metadata[type]', 'credit_purchase');
    params.set('metadata[pack_size]', size);
  }
  
  if (userEmail) {
    params.set('prefilled_email', userEmail);
  }
  
  // 添加成功和取消回调 URL
  const successUrl = `${window.location.origin}/?payment=success&type=credits&size=${size}`;
  const cancelUrl = `${window.location.origin}/?payment=cancelled`;
  
  params.set('success_url', successUrl);
  params.set('cancel_url', cancelUrl);
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

/**
 * 跳转到订阅支付页面
 * @param tier - 订阅层级
 * @param billingCycle - 计费周期
 * @param userId - 用户 ID
 * @param userEmail - 用户邮箱
 */
export const redirectToSubscriptionCheckout = (
  tier: 'pro' | 'premium' | 'business',
  billingCycle: 'monthly' | 'yearly',
  userId: string,
  userEmail: string
): void => {
  const paymentLink = getSubscriptionPaymentLink(tier, billingCycle, userId, userEmail);
  
  console.log('🛒 Redirecting to Creem checkout:', {
    tier,
    billingCycle,
    userId,
    paymentLink
  });
  
  window.location.href = paymentLink;
};

/**
 * 跳转到积分包支付页面
 * @param size - 积分包大小
 * @param userId - 用户 ID
 * @param userEmail - 用户邮箱
 */
export const redirectToCreditPackCheckout = (
  size: 'small' | 'medium' | 'large',
  userId: string,
  userEmail: string
): void => {
  const paymentLink = getCreditPackPaymentLink(size, userId, userEmail);
  
  console.log('🪙 Redirecting to Creem credit purchase:', {
    size,
    userId,
    paymentLink
  });
  
  window.location.href = paymentLink;
};

/**
 * 积分包大小映射
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
  // 根据数据库中的 bundle_id 映射到 Creem 的 size
  const mapping: Record<string, 'small' | 'medium' | 'large'> = {
    'bundle_small': 'small',
    'bundle_medium': 'medium',
    'bundle_large': 'large',
  };
  
  return mapping[bundleId] || null;
};

/**
 * 检查 Creem 是否已配置
 */
export const isCreemConfigured = (): boolean => {
  return !!CREEM_API_KEY;
};

/**
 * 获取 Creem 配置状态信息
 */
export const getCreemStatus = () => {
  return {
    configured: isCreemConfigured(),
    apiKey: CREEM_API_KEY ? '✅ Configured' : '❌ Missing',
    products: {
      subscriptions: Object.keys(CREEM_PRODUCTS.subscriptions).length * 2, // 每个层级有月付和年付
      creditPacks: Object.keys(CREEM_PRODUCTS.credits).length,
    },
  };
};

// 开发模式下输出配置信息
if (import.meta.env.DEV) {
  console.log('🍦 Creem Service Initialized:', getCreemStatus());
}



