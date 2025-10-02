import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface FeaturePage {
  id: string;
  page_key: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
}

// Helper function to get feature icon
const getFeatureIcon = (pageKey: string): string => {
  const iconMap: Record<string, string> = {
    'interior-design': '🏠',
    'festive-decor': '🎄',
    'exterior-design': '🏢',
    'floor-style': '🪵',
    'garden-backyard': '🌳',
    'item-replace': '🔄',
    'wall-paint': '🎨',
    'reference-style': '📸',
    'multi-item': '🖼️',
    'free-canvas': '✏️',
    'ai-advisor': '🤖',
  };
  return iconMap[pageKey] || '⚙️';
};

// Helper function to check if feature has template management
const hasTemplates = (pageKey: string): boolean => {
  const templatesFeatures = [
    'interior-design',
    'festive-decor',
    'exterior-design',
    'floor-style',
    'garden-backyard'
  ];
  return templatesFeatures.includes(pageKey);
};

export const FeatureToggleManager: React.FC = () => {
  const [features, setFeatures] = useState<FeaturePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      setLoading(true);
      // 加载所有功能页面（不再限制特定功能）
      const { data, error } = await supabase
        .from('feature_pages')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setFeatures(data || []);
    } catch (err) {
      console.error('Error loading features:', err);
      alert('加载功能列表失败');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (featureId: string, currentStatus: boolean) => {
    try {
      setSaving(featureId);
      const { error } = await supabase
        .from('feature_pages')
        .update({ is_active: !currentStatus })
        .eq('id', featureId);

      if (error) throw error;
      
      // 更新本地状态
      setFeatures(prev =>
        prev.map(f =>
          f.id === featureId ? { ...f, is_active: !currentStatus } : f
        )
      );
    } catch (err) {
      console.error('Error toggling feature:', err);
      alert('更新失败');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">功能开关管理（全部功能）</h1>
        <p className="text-slate-600 mt-2">
          控制所有功能在前端的显示/隐藏。关闭后，用户将无法在导航菜单中看到该功能入口。
        </p>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
            共 {features.length} 个功能
          </span>
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
            {features.filter(f => f.is_active).length} 个已启用
          </span>
          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded">
            {features.filter(f => !f.is_active).length} 个已禁用
          </span>
        </div>
      </div>

      {features.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <p className="text-slate-500">暂无可管理的功能</p>
          <p className="text-xs text-slate-400 mt-2">请先运行数据库迁移添加功能页面</p>
        </div>
      ) : (
        <div className="space-y-4">
          {features.map(feature => (
            <div
              key={feature.id}
              className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFeatureIcon(feature.page_key)}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {feature.display_name}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            feature.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {feature.is_active ? '已启用' : '已禁用'}
                        </span>
                        {hasTemplates(feature.page_key) && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            有模板管理
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {feature.description && (
                    <p className="text-sm text-slate-600 mt-2">
                      {feature.description}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    Key: <code className="bg-slate-100 px-1 rounded">{feature.page_key}</code>
                  </p>
                </div>

                <div className="ml-6">
                  <button
                    onClick={() => toggleFeature(feature.id, feature.is_active)}
                    disabled={saving === feature.id}
                    className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      feature.is_active ? 'bg-green-600' : 'bg-slate-300'
                    } ${saving === feature.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-transform ${
                        feature.is_active ? 'translate-x-11' : 'translate-x-1'
                      }`}
                    />
                    <span className="sr-only">Toggle feature</span>
                  </button>
                  {saving === feature.id && (
                    <p className="text-xs text-slate-500 mt-2">保存中...</p>
                  )}
                </div>
              </div>

              {/* 状态说明 */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-600">
                  {feature.is_active ? (
                    <>
                      <span className="text-green-600 font-medium">✓ 前端可见</span> - 用户可以在导航菜单中看到并使用此功能
                    </>
                  ) : (
                    <>
                      <span className="text-slate-500 font-medium">✕ 前端隐藏</span> - 用户无法在导航菜单中看到此功能
                    </>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 说明卡片 */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 功能分类</h4>
        <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <p className="font-semibold mb-2">🎨 完整模板管理功能:</p>
            <ul className="space-y-1 ml-4">
              <li>• Interior Design</li>
              <li>• Festive Decor</li>
              <li>• Exterior Design</li>
              <li>• Floor Style</li>
              <li>• Garden & Backyard Design</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-2">🔧 简单工具功能:</p>
            <ul className="space-y-1 ml-4">
              <li>• Item Replace</li>
              <li>• Wall Paint</li>
              <li>• Reference Style Match</li>
              <li>• Multi-Item Preview</li>
              <li>• Free Canvas</li>
              <li>• AI Design Advisor</li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-blue-700 mt-4 pt-3 border-t border-blue-200">
          <strong>提示</strong>: 关闭功能后，前端用户将无法看到该功能的入口。已有的模板数据不会被删除。
        </p>
      </div>
    </div>
  );
};

