import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthPage } from './AuthPage';
import { UserInfoBar } from './UserInfoBar';

interface ProtectedAppProps {
  children: React.ReactNode;
}

export const ProtectedApp: React.FC<ProtectedAppProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();

  // Show loading spinner while checking auth (quick check)
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // ✅ 新逻辑：允许所有人浏览，只在必要时显示登录/订阅提示
  // 如果已登录且有profile，显示用户信息栏
  const showUserBar = user && profile;

  return (
    <>
      {/* User Info Bar - only shown if logged in */}
      {showUserBar && (
        <div className="fixed top-4 right-4 z-50">
          <UserInfoBar />
        </div>
      )}
      
      {/* Main App Content - always shown */}
      {children}
    </>
  );
};

