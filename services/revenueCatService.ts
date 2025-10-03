import Purchases from '@revenuecat/purchases-js';

// RevenueCat configuration
const REVENUECAT_PUBLIC_KEY = import.meta.env.VITE_REVENUECAT_PUBLIC_KEY;

// Product ID mappings
export const PRODUCT_IDS = {
  // Subscriptions - Monthly
  pro_monthly: 'pro_monthly',
  premium_monthly: 'premium_monthly',
  business_monthly: 'business_monthly',
  
  // Subscriptions - Yearly
  pro_yearly: 'pro_yearly',
  premium_yearly: 'premium_yearly',
  business_yearly: 'business_yearly',
  
  // Credits
  credits_small: 'credits_small',
  credits_medium: 'credits_medium',
  credits_large: 'credits_large',
} as const;

export type ProductId = typeof PRODUCT_IDS[keyof typeof PRODUCT_IDS];

// Tier to Product ID mapping
export const TIER_TO_PRODUCT = {
  pro: {
    monthly: PRODUCT_IDS.pro_monthly,
    yearly: PRODUCT_IDS.pro_yearly,
  },
  premium: {
    monthly: PRODUCT_IDS.premium_monthly,
    yearly: PRODUCT_IDS.premium_yearly,
  },
  business: {
    monthly: PRODUCT_IDS.business_monthly,
    yearly: PRODUCT_IDS.business_yearly,
  },
} as const;

// Credit bundle to Product ID mapping
export const CREDIT_BUNDLE_TO_PRODUCT = {
  bundle_small: PRODUCT_IDS.credits_small,
  bundle_medium: PRODUCT_IDS.credits_medium,
  bundle_large: PRODUCT_IDS.credits_large,
} as const;

/**
 * Initialize RevenueCat SDK
 * Call this once when the app starts
 */
export const initializeRevenueCat = async (userId: string): Promise<boolean> => {
  if (!REVENUECAT_PUBLIC_KEY) {
    console.error('❌ RevenueCat Public Key not found in environment variables');
    return false;
  }

  try {
    await Purchases.configure({
      apiKey: REVENUECAT_PUBLIC_KEY,
      appUserID: userId,
    });
    
    console.log('✅ RevenueCat initialized for user:', userId);
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize RevenueCat:', error);
    return false;
  }
};

/**
 * Get available offerings (products)
 */
export const getOfferings = async () => {
  try {
    const offerings = await Purchases.getOfferings();
    console.log('📦 Available offerings:', offerings);
    return offerings;
  } catch (error) {
    console.error('❌ Failed to get offerings:', error);
    return null;
  }
};

/**
 * Purchase a subscription
 * @param tier - Subscription tier (pro, premium, business)
 * @param billingCycle - monthly or yearly
 * @param userId - User ID
 * @param userEmail - User email
 */
export const purchaseSubscription = async (
  tier: 'pro' | 'premium' | 'business',
  billingCycle: 'monthly' | 'yearly',
  userId: string,
  userEmail: string
): Promise<{
  success: boolean;
  error?: string;
  customerInfo?: any;
}> => {
  // Check if RevenueCat is configured
  if (!REVENUECAT_PUBLIC_KEY) {
    return {
      success: false,
      error: 'Payment system is not configured yet. Please contact support.',
    };
  }

  try {
    const productId = TIER_TO_PRODUCT[tier][billingCycle];
    
    console.log('🛒 Initiating purchase:', {
      tier,
      billingCycle,
      productId,
      userId,
    });

    // In RevenueCat Web SDK, we typically redirect to a checkout page
    // For now, we'll use the purchasePackage method
    const offerings = await Purchases.getOfferings();
    
    if (!offerings || !offerings.current) {
      throw new Error('No offerings available');
    }

    // Find the package with matching product ID
    const packages = offerings.current.availablePackages;
    const targetPackage = packages.find(pkg => pkg.identifier === productId);

    if (!targetPackage) {
      throw new Error(`Product ${productId} not found in offerings`);
    }

    // Purchase the package
    const { customerInfo } = await Purchases.purchasePackage(targetPackage);

    console.log('✅ Purchase successful:', customerInfo);

    return {
      success: true,
      customerInfo,
    };
  } catch (error: any) {
    console.error('❌ Purchase failed:', error);
    
    // Check if user cancelled
    if (error.userCancelled) {
      return {
        success: false,
        error: 'Purchase cancelled by user',
      };
    }

    return {
      success: false,
      error: error.message || 'Purchase failed',
    };
  }
};

/**
 * Purchase credits (one-time purchase)
 * @param bundleId - Credit bundle ID from database
 */
export const purchaseCredits = async (
  bundleId: string
): Promise<{
  success: boolean;
  error?: string;
  customerInfo?: any;
}> => {
  // Check if RevenueCat is configured
  if (!REVENUECAT_PUBLIC_KEY) {
    return {
      success: false,
      error: 'Payment system is not configured yet. Please contact support.',
    };
  }

  try {
    const productId = CREDIT_BUNDLE_TO_PRODUCT[bundleId as keyof typeof CREDIT_BUNDLE_TO_PRODUCT];
    
    if (!productId) {
      throw new Error(`Unknown bundle ID: ${bundleId}`);
    }

    console.log('🪙 Initiating credit purchase:', {
      bundleId,
      productId,
    });

    const offerings = await Purchases.getOfferings();
    
    if (!offerings || !offerings.current) {
      throw new Error('No offerings available');
    }

    const packages = offerings.current.availablePackages;
    const targetPackage = packages.find(pkg => pkg.identifier === productId);

    if (!targetPackage) {
      throw new Error(`Product ${productId} not found in offerings`);
    }

    const { customerInfo } = await Purchases.purchasePackage(targetPackage);

    console.log('✅ Credit purchase successful:', customerInfo);

    return {
      success: true,
      customerInfo,
    };
  } catch (error: any) {
    console.error('❌ Credit purchase failed:', error);
    
    if (error.userCancelled) {
      return {
        success: false,
        error: 'Purchase cancelled by user',
      };
    }

    return {
      success: false,
      error: error.message || 'Purchase failed',
    };
  }
};

/**
 * Get customer info (current subscription status)
 */
export const getCustomerInfo = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    console.log('👤 Customer info:', customerInfo);
    return customerInfo;
  } catch (error) {
    console.error('❌ Failed to get customer info:', error);
    return null;
  }
};

/**
 * Restore purchases (useful for users who reinstall or switch devices)
 */
export const restorePurchases = async (): Promise<{
  success: boolean;
  error?: string;
  customerInfo?: any;
}> => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    console.log('✅ Purchases restored:', customerInfo);
    
    return {
      success: true,
      customerInfo,
    };
  } catch (error: any) {
    console.error('❌ Failed to restore purchases:', error);
    return {
      success: false,
      error: error.message || 'Failed to restore purchases',
    };
  }
};

/**
 * Check if user has active entitlement
 * @param entitlementId - Entitlement identifier (e.g., 'pro_access')
 */
export const hasEntitlement = async (entitlementId: string): Promise<boolean> => {
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return false;

    const entitlement = customerInfo.entitlements.active[entitlementId];
    return !!entitlement;
  } catch (error) {
    console.error('❌ Failed to check entitlement:', error);
    return false;
  }
};

/**
 * Get user's active subscription tier from RevenueCat
 */
export const getActiveSubscription = async (): Promise<{
  tier: 'free' | 'pro' | 'premium' | 'business';
  billingCycle?: 'monthly' | 'yearly';
  expiresAt?: string;
} | null> => {
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return null;

    const entitlements = customerInfo.entitlements.active;

    // Check for active subscriptions in priority order
    if (entitlements['business_access']) {
      return {
        tier: 'business',
        expiresAt: entitlements['business_access'].expirationDate,
      };
    }
    
    if (entitlements['premium_access']) {
      return {
        tier: 'premium',
        expiresAt: entitlements['premium_access'].expirationDate,
      };
    }
    
    if (entitlements['pro_access']) {
      return {
        tier: 'pro',
        expiresAt: entitlements['pro_access'].expirationDate,
      };
    }

    return { tier: 'free' };
  } catch (error) {
    console.error('❌ Failed to get active subscription:', error);
    return null;
  }
};

/**
 * Log out user from RevenueCat (call when user signs out)
 */
export const logoutRevenueCat = async (): Promise<void> => {
  try {
    await Purchases.logOut();
    console.log('✅ Logged out from RevenueCat');
  } catch (error) {
    console.error('❌ Failed to logout from RevenueCat:', error);
  }
};

