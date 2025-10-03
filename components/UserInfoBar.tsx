import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';

interface UserInfoBarProps {
  onNavigate?: (page: string) => void;
}

export const UserInfoBar: React.FC<UserInfoBarProps> = ({ onNavigate }) => {
  const { profile, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!profile) return null;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'bg-gradient-to-r from-indigo-500 to-blue-500';
      case 'premium':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'business':
        return 'bg-gradient-to-r from-orange-500 to-red-500';
      default:
        return 'bg-gradient-to-r from-slate-400 to-slate-500';
    }
  };

  const getTierName = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-4 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
        {/* Credits Display */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full">
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <div className="text-xs text-slate-500 leading-none">Credits</div>
            <div className="text-lg font-bold text-slate-900 leading-none mt-0.5">
              {profile.credits}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-200"></div>

        {/* Subscription Tier */}
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 ${getTierColor(profile.subscription_tier)} rounded-full`}>
            <span className="text-xs font-semibold text-white">{getTierName(profile.subscription_tier)}</span>
          </div>
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-white">
                {profile.display_name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <AnimatePresence>
            {showDropdown && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                ></div>

                {/* Dropdown Menu */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-20 overflow-hidden"
                >
                  {/* User Info */}
                  <div className="p-4 border-b border-slate-100">
                    <div className="font-medium text-slate-900">{profile.display_name || 'User'}</div>
                    <div className="text-sm text-slate-500 truncate">{profile.email}</div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        if (onNavigate) {
                          onNavigate('subscription');
                        } else {
                          window.location.href = '/?page=subscription';
                        }
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Manage Subscription
                    </button>
                    <button
                      onClick={() => {
                        if (onNavigate) {
                          onNavigate('subscription');
                        } else {
                          window.location.href = '/?page=subscription';
                        }
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Buy Credits
                    </button>
                    <button
                      onClick={() => {
                        if (onNavigate) {
                          onNavigate('My Renders');
                        } else {
                          window.location.href = '/?page=myRenders';
                        }
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Generation History
                    </button>
                  </div>

                  {/* Sign Out */}
                  <div className="border-t border-slate-100 py-2">
                    <button
                      onClick={async () => {
                        await signOut();
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

