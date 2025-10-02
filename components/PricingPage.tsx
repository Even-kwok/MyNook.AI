import React, { useState } from 'react';
import { IconCheck } from './Icons';
import { useSubscriptionTiers, SubscriptionTier } from '../hooks/useSubscriptionTiers';
import { useAuth } from '../context/AuthContext';
import { redirectToSubscriptionCheckout } from '../services/creemService';

// Feature descriptions for better UX
const getFeatureList = (tier: SubscriptionTier): string[] => {
    const features: string[] = [];
    const f = tier.features;

    // Credits
    features.push(`${tier.credits_per_month.toLocaleString()} credits per month`);

    // Concurrent generations
    if (f.concurrent_generations) {
        features.push(`Create up to ${f.concurrent_generations} designs in parallel`);
    }

    // Basic features
    if (f.basic_styles) features.push('Access to all basic styles');
    if (f.advanced_styles) features.push('Advanced AI styles');
    if (f.free_canvas) features.push('Free canvas mode');
    if (f.hd_export) features.push('HD quality export');
    if (!f.watermark) features.push('No watermark');

    // Premium features
    if (f.priority_queue) features.push('Priority queue access');
    if (f.custom_styles) features.push('Custom style creation');
    if (f.api_access) features.push('API access');

    // History
    if (f.history_days === -1) {
        features.push('Unlimited history');
    } else if (f.history_days) {
        features.push(`${f.history_days} days history`);
    }

    // Business features
    if (f.team_collaboration) features.push('Team collaboration');
    if (f.white_label) features.push('White label options');
    if (f.dedicated_support) features.push('Dedicated support');
    if (f.sla_guarantee) features.push('SLA guarantee');

    // Credit purchase limit
    if (tier.max_credits_purchase > 0) {
        features.push(`Buy up to ${tier.max_credits_purchase.toLocaleString()} extra credits`);
    }

    return features;
};

export const PricingPage: React.FC = () => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly'); // Default to yearly
    const [purchasing, setPurchasing] = useState(false);
    const { tiers, loading, error } = useSubscriptionTiers();
    const { user, profile, refreshProfile } = useAuth();

    const handleSubscribe = async (tier: SubscriptionTier, billingType: 'monthly' | 'yearly') => {
        if (!user || !profile) {
            alert('Please login to subscribe');
            return;
        }

        // Prevent duplicate clicks
        if (purchasing) return;

        try {
            setPurchasing(true);
            
            console.log('🛒 Initiating Creem checkout:', {
                tier: tier.tier,
                billingType,
                userId: user.id,
                userEmail: user.email
            });

            // 跳转到安全的支付页面
            const result = await redirectToSubscriptionCheckout(
                tier.tier as 'pro' | 'premium' | 'business',
                billingType
            );
            
            if (!result.success) {
                // 支付链接创建失败，显示错误并重置状态
                alert(`Payment Error: ${result.error}`);
                setPurchasing(false);
            }
            // 如果成功，用户会被重定向，不需要重置状态
            
        } catch (error: any) {
            console.error('❌ Error redirecting to checkout:', error);
            alert(`Error: ${error.message}`);
            setPurchasing(false);
        }
    };

    if (loading) {
        return (
            <main className="flex-1 overflow-y-auto bg-white text-slate-900 scrollbar-hide">
                <div className="py-16 px-4 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-slate-500">Loading pricing plans...</p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex-1 overflow-y-auto bg-white text-slate-900 scrollbar-hide">
                <div className="py-16 px-4 text-center">
                    <p className="text-red-600">Error loading pricing: {error}</p>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 overflow-y-auto bg-white text-slate-900 scrollbar-hide">
            <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
                        Plans & Pricing
                    </h1>
                    <p className="mt-4 text-xl text-slate-500 max-w-2xl mx-auto">
                        Choose the plan that's right for you and unlock the full power of AI interior design.
                    </p>

                    {/* Billing Cycle Toggle */}
                    <div className="mt-10 flex justify-center">
                        <div className="relative inline-flex items-center p-1 bg-slate-100 rounded-full border border-slate-200">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-6 py-2 text-sm font-semibold rounded-full focus:outline-none transition-colors duration-300 ${
                                    billingCycle === 'monthly' 
                                        ? 'bg-white text-slate-800 shadow-sm' 
                                        : 'text-slate-600 hover:text-slate-800'
                                }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className={`px-6 py-2 text-sm font-semibold rounded-full focus:outline-none transition-colors duration-300 ${
                                    billingCycle === 'yearly' 
                                        ? 'bg-white text-slate-800 shadow-sm' 
                                        : 'text-slate-600 hover:text-slate-800'
                                }`}
                            >
                                Yearly
                            </button>
                            <div className="absolute -top-5 -right-5 transform">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600 ring-2 ring-white">
                                    Save 50%+
                                </span>
                            </div>
                        </div>
                    </div>

                    {profile && (
                        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                            <span className="text-sm text-slate-600">Current plan:</span>
                            <span className="font-semibold text-indigo-600 capitalize">{profile.subscription_tier}</span>
                            <span className="text-sm text-slate-500">•</span>
                            <span className="text-sm text-slate-600">{profile.credits} credits</span>
                        </div>
                    )}
                </div>

                <div className="mt-16 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {tiers.map((tier, index) => {
                        const features = getFeatureList(tier);
                        const isCurrentPlan = profile?.subscription_tier === tier.tier;
                        const isPopular = tier.tier === 'premium'; // Premium is most popular

                        return (
                            <div
                                key={tier.id}
                                className={`relative border rounded-2xl p-8 flex flex-col h-full text-white ${
                                    isPopular ? 'bg-slate-900 border-transparent shadow-2xl shadow-indigo-200' : 
                                    tier.tier === 'business' ? 'bg-slate-800 border-slate-700' :
                                    'bg-slate-700 border-slate-600'
                                }`}
                            >
                                {isPopular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-indigo-500 text-white">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                {isCurrentPlan && (
                                    <div className="absolute -top-4 right-4">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
                                            Current Plan
                                        </span>
                                    </div>
                                )}

                                <h3 className="text-2xl font-bold text-white">{tier.name}</h3>
                                
                                <div className="mt-6 flex items-baseline gap-x-2">
                                    <span className="text-5xl font-extrabold tracking-tight text-white">
                                        ${billingCycle === 'yearly' 
                                            ? (tier.price_yearly_usd || tier.price_usd).toFixed(0)
                                            : tier.price_usd.toFixed(0)}
                                    </span>
                                    <span className="text-base font-medium text-slate-400">
                                        / month
                                    </span>
                                </div>
                                
                                <p className="mt-2 text-sm text-slate-400">
                                    {billingCycle === 'yearly' 
                                        ? `billed yearly $${tier.yearly_billed_usd?.toFixed(0) || (tier.price_usd * 12).toFixed(0)}`
                                        : 'billed monthly'}
                                </p>

                                <button
                                    onClick={() => handleSubscribe(tier, billingCycle)}
                                    disabled={isCurrentPlan || purchasing}
                                    className={`mt-8 w-full py-3 px-6 rounded-lg font-semibold text-center transition-all duration-200 ${
                                        isCurrentPlan || purchasing
                                            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                            : 'bg-indigo-500 text-white hover:bg-indigo-400 transform hover:scale-[1.02]'
                                    }`}
                                >
                                    {purchasing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </span>
                                    ) : isCurrentPlan ? (
                                        'Current Plan'
                                    ) : user ? (
                                        'Subscribe'
                                    ) : (
                                        'Get Started'
                                    )}
                                </button>

                                <div className="mt-10 flex-1">
                                    <ul role="list" className="space-y-4 text-sm leading-6">
                                        {features.map((feature) => (
                                            <li key={feature} className="flex gap-x-3">
                                                <IconCheck className="h-6 w-5 flex-none text-indigo-400" aria-hidden="true" />
                                                <span className="text-slate-300">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Credit Bundles Section */}
                <div className="mt-24 max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900">Need More Credits?</h2>
                        <p className="mt-2 text-slate-600">Purchase additional credits anytime</p>
                    </div>
                    
                    {/* TODO: Add credit bundles component */}
                    <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-slate-500">Credit bundles coming soon!</p>
                    </div>
                </div>
            </div>
        </main>
    );
};
