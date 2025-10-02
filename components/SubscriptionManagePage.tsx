import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSubscriptionTiers, SubscriptionTier } from '../hooks/useSubscriptionTiers';
import { supabase } from '../lib/supabase';
import { IconCheck, IconCrown, IconSparkles } from './Icons';
import { redirectToSubscriptionCheckout, redirectToCreditPackCheckout, getBundleSizeFromId } from '../services/creemService';

interface CreditBundle {
  id: string;
  bundle_id: string;
  name: string;
  credits: number;
  price_usd: number;
  is_active: boolean;
}

interface CreditTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

export const SubscriptionManagePage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { tiers, loading: tiersLoading } = useSubscriptionTiers();
  const [creditBundles, setCreditBundles] = useState<CreditBundle[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loadingBundles, setLoadingBundles] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'credits' | 'history'>('overview');
  const [purchasingTier, setPurchasingTier] = useState<string | null>(null);
  const [purchasingBundle, setPurchasingBundle] = useState<string | null>(null);

  useEffect(() => {
    fetchCreditBundles();
    fetchTransactions();
  }, []);

  const fetchCreditBundles = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_bundles')
        .select('*')
        .eq('is_active', true)
        .order('price_usd', { ascending: true });

      if (error) throw error;
      setCreditBundles(data || []);
    } catch (error) {
      console.error('Error fetching credit bundles:', error);
    } finally {
      setLoadingBundles(false);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleUpgrade = async (tier: SubscriptionTier, billingCycle: 'monthly' | 'yearly' = 'yearly') => {
    if (!user || !profile) return;
    if (purchasingTier) return; // Prevent duplicate purchases

    try {
      setPurchasingTier(tier.tier);
      console.log('🛒 Upgrading subscription via Creem:', { tier: tier.tier, billingCycle });

      // 跳转到安全的支付页面
      await redirectToSubscriptionCheckout(
        tier.tier as 'pro' | 'premium' | 'business',
        billingCycle
      );
      
      // 注意：用户会被重定向，所以不会执行到这里
    } catch (error: any) {
      console.error('❌ Error redirecting to checkout:', error);
      alert(`Error: ${error.message}`);
      setPurchasingTier(null);
    }
  };

  const handlePurchaseCredits = async (bundle: CreditBundle) => {
    if (!user || !profile) return;
    if (purchasingBundle) return; // Prevent duplicate purchases

    try {
      setPurchasingBundle(bundle.bundle_id);
      console.log('🪙 Purchasing credits via Creem:', { bundleId: bundle.bundle_id, credits: bundle.credits });

      // 将 bundle_id 转换为 Creem 的 size
      const size = getBundleSizeFromId(bundle.bundle_id);
      
      if (!size) {
        throw new Error(`Unknown bundle ID: ${bundle.bundle_id}`);
      }

      // 跳转到安全的支付页面
      await redirectToCreditPackCheckout(size);
      
      // 注意：用户会被重定向，所以不会执行到这里
    } catch (error: any) {
      console.error('❌ Error redirecting to credit purchase:', error);
      alert(`Error: ${error.message}`);
      setPurchasingBundle(null);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'from-indigo-500 to-blue-500';
      case 'premium':
        return 'from-purple-500 to-pink-500';
      case 'business':
        return 'from-orange-500 to-red-500';
      default:
        return 'from-slate-400 to-slate-500';
    }
  };

  const getTierName = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'subscription_grant':
        return 'text-green-600 bg-green-50';
      case 'generation':
        return 'text-blue-600 bg-blue-50';
      case 'refund':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  if (!profile) {
    return (
      <main className="flex-1 overflow-y-auto bg-slate-50 text-slate-900">
        <div className="py-16 px-4 text-center">
          <p className="text-slate-500">Please login to manage your subscription</p>
        </div>
      </main>
    );
  }

  const currentTier = tiers.find(t => t.tier === profile.subscription_tier);
  const availableUpgrades = tiers.filter(t => {
    const tierOrder = { free: 0, pro: 1, premium: 2, business: 3 };
    return tierOrder[t.tier] > tierOrder[profile.subscription_tier as keyof typeof tierOrder];
  });

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 text-slate-900 scrollbar-hide">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Subscription Management</h1>
          <p className="mt-2 text-slate-600">Manage your subscription, credits, and billing</p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-slate-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('credits')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'credits'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Buy Credits
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              History
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Current Plan Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${getTierColor(profile.subscription_tier)}`}></div>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-slate-900">
                        {getTierName(profile.subscription_tier)} Plan
                      </h2>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getTierColor(profile.subscription_tier)} text-white`}>
                        Active
                      </span>
                    </div>
                    <p className="mt-2 text-slate-600">
                      {currentTier ? `$${currentTier.price_usd}/month` : 'Free forever'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-3xl font-bold text-slate-900">
                      <IconSparkles className="w-8 h-8 text-amber-500" />
                      {profile.credits}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">credits available</p>
                  </div>
                </div>

                {currentTier && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Plan Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <IconCheck className="w-4 h-4 text-green-500" />
                        <span>{currentTier.credits_per_month.toLocaleString()} credits/month</span>
                      </div>
                      {currentTier.features.concurrent_generations && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <IconCheck className="w-4 h-4 text-green-500" />
                          <span>{currentTier.features.concurrent_generations} parallel designs</span>
                        </div>
                      )}
                      {currentTier.features.priority_queue && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <IconCheck className="w-4 h-4 text-green-500" />
                          <span>Priority queue access</span>
                        </div>
                      )}
                      {currentTier.features.api_access && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <IconCheck className="w-4 h-4 text-green-500" />
                          <span>API access</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Upgrade Options */}
            {availableUpgrades.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  <IconCrown className="inline w-6 h-6 text-amber-500 mr-2" />
                  Upgrade Your Plan
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {availableUpgrades.map((tier) => (
                    <div
                      key={tier.id}
                      className="bg-white rounded-xl shadow-sm border-2 border-slate-200 hover:border-indigo-300 transition-all p-6"
                    >
                      <h3 className="text-xl font-bold text-slate-900">{tier.name}</h3>
                      <div className="mt-4">
                        <span className="text-3xl font-bold text-slate-900">
                          ${tier.price_usd.toFixed(0)}
                        </span>
                        <span className="text-slate-500">/month</span>
                      </div>
                      <ul className="mt-6 space-y-3">
                        <li className="flex items-center gap-2 text-sm text-slate-600">
                          <IconCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{tier.credits_per_month.toLocaleString()} credits/month</span>
                        </li>
                        {tier.features.concurrent_generations && (
                          <li className="flex items-center gap-2 text-sm text-slate-600">
                            <IconCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>{tier.features.concurrent_generations} parallel designs</span>
                          </li>
                        )}
                        {tier.features.api_access && (
                          <li className="flex items-center gap-2 text-sm text-slate-600">
                            <IconCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>API access</span>
                          </li>
                        )}
                      </ul>
                      <button
                        onClick={() => handleUpgrade(tier)}
                        disabled={purchasingTier === tier.tier}
                        className={`mt-6 w-full py-3 px-4 font-semibold rounded-lg transition-colors ${
                          purchasingTier === tier.tier
                            ? 'bg-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {purchasingTier === tier.tier ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          `Upgrade to ${tier.name}`
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'credits' && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Purchase Additional Credits</h2>
            <p className="text-slate-600 mb-6">
              Need more credits? Purchase a credit bundle and use them anytime.
            </p>
            
            {loadingBundles ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {creditBundles.map((bundle) => (
                  <div
                    key={bundle.id}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow p-6"
                  >
                    <h3 className="text-xl font-bold text-slate-900">{bundle.name}</h3>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-indigo-600">
                        {bundle.credits.toLocaleString()}
                      </span>
                      <span className="text-slate-500 ml-2">credits</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-slate-900">
                        ${bundle.price_usd.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      ${(bundle.price_usd / bundle.credits).toFixed(3)} per credit
                    </div>
                    <button
                      onClick={() => handlePurchaseCredits(bundle)}
                      disabled={purchasingBundle === bundle.bundle_id}
                      className={`mt-6 w-full py-3 px-4 font-semibold rounded-lg transition-colors ${
                        purchasingBundle === bundle.bundle_id
                          ? 'bg-slate-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {purchasingBundle === bundle.bundle_id ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        'Purchase'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Transaction History</h2>
            
            {loadingTransactions ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                <p className="text-slate-500">No transactions yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Credits
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionColor(transaction.transaction_type)}`}>
                            {transaction.transaction_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {transaction.description}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

