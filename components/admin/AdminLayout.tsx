import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: 'templates' | 'features' | 'static-pages' | 'users' | 'blog' | 'config' | 'stats';
  onNavigate: (page: 'templates' | 'features' | 'static-pages' | 'users' | 'blog' | 'config' | 'stats') => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, currentPage, onNavigate }) => {
  const { profile, signOut } = useAuth();

  const menuItems = [
    { id: 'templates' as const, name: '风格模板管理', icon: '🎨' },
    { id: 'features' as const, name: '功能开关', icon: '🔧' },
    { id: 'static-pages' as const, name: '静态页面管理', icon: '📄' },
    { id: 'users' as const, name: '用户管理', icon: '👥' },
    { id: 'blog' as const, name: 'Blog管理', icon: '📝' },
    { id: 'config' as const, name: '配置管理', icon: '⚙️' },
    { id: 'stats' as const, name: '数据统计', icon: '📊' },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo/Title */}
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900">AI Studio</h1>
          <p className="text-sm text-slate-500">管理后台</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPage === item.id
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Admin Info */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-white">
                {profile?.display_name?.[0]?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">
                {profile?.display_name || profile?.email}
              </div>
              <div className="text-xs text-slate-500">管理员</div>
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm('确定要退出登录吗？')) {
                signOut();
              }
            }}
            className="w-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            退出登录
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

