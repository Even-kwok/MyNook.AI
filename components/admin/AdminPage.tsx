import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminLayout } from './AdminLayout';
import { CategoryManager } from './CategoryManager';
import { NewTemplateManager } from './NewTemplateManager';
import { FeaturePageManager } from './FeaturePageManager';
import { FeatureToggleManager } from './FeatureToggleManager';
import { StaticPageManager } from './StaticPageManager';
import { UserManager } from './UserManager';
import { BlogManager } from './BlogManager';

export const AdminPage: React.FC = () => {
  const { profile, loading, user } = useAuth();
  const [currentPage, setCurrentPage] = useState<'templates' | 'features' | 'static-pages' | 'users' | 'blog' | 'config' | 'stats'>('templates');

  // Debug logging
  React.useEffect(() => {
    console.log('AdminPage - Loading:', loading);
    console.log('AdminPage - User:', user);
    console.log('AdminPage - Profile:', profile);
  }, [loading, user, profile]);

  // Check if user is admin
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="text-slate-600 ml-4">正在验证权限...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-4">
        <div className="text-6xl mb-4">🔐</div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">未登录</h1>
        <p className="text-slate-600 mb-4">请先登录后再访问管理后台</p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          前往登录
        </button>
      </div>
    );
  }

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-4">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">访问受限</h1>
        <p className="text-slate-600 mb-4">您没有权限访问管理后台</p>
        <div className="bg-slate-100 rounded-lg p-4 mb-4 text-sm text-slate-700 max-w-md">
          <p><strong>当前用户:</strong> {user?.email}</p>
          <p><strong>当前角色:</strong> {profile?.role || '未设置'}</p>
          <p><strong>需要角色:</strong> admin</p>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          如需管理员权限，请联系系统管理员或在数据库中设置 role = 'admin'
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <AdminLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === 'templates' && <FeaturePageManager />}
      {currentPage === 'features' && <FeatureToggleManager />}
      {currentPage === 'static-pages' && <StaticPageManager />}
      {currentPage === 'users' && <UserManager />}
      {currentPage === 'blog' && <BlogManager onClose={() => setCurrentPage('templates')} />}
      {currentPage === 'config' && (
        <div className="p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">配置管理</h1>
          <p className="text-slate-600">功能开发中...</p>
        </div>
      )}
      {currentPage === 'stats' && (
        <div className="p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">数据统计</h1>
          <p className="text-slate-600">功能开发中...</p>
        </div>
      )}
    </AdminLayout>
  );
};

