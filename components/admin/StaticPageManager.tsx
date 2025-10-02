import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../Button';
import { IconEdit, IconCheck, IconX, IconEye, IconEyeOff } from '../Icons';

interface StaticPage {
  id: string;
  page_key: string;
  title: string;
  content: string;
  meta_description: string | null;
  is_published: boolean;
  display_order: number;
  last_edited_by: string | null;
  created_at: string;
  updated_at: string;
}

export const StaticPageManager: React.FC = () => {
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<StaticPage | null>(null);
  const [previewPage, setPreviewPage] = useState<StaticPage | null>(null);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('static_pages')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPages(data || []);
    } catch (err) {
      console.error('Error loading pages:', err);
      alert('加载页面失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingPage) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      const { error } = await supabase
        .from('static_pages')
        .update({
          title: editingPage.title,
          content: editingPage.content,
          meta_description: editingPage.meta_description,
          is_published: editingPage.is_published,
          last_edited_by: userId,
        })
        .eq('id', editingPage.id);

      if (error) throw error;

      alert('保存成功！');
      setEditingPage(null);
      loadPages();
    } catch (err) {
      console.error('Error saving page:', err);
      alert('保存失败');
    }
  };

  const togglePublish = async (page: StaticPage) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      const { error } = await supabase
        .from('static_pages')
        .update({
          is_published: !page.is_published,
          last_edited_by: userId,
        })
        .eq('id', page.id);

      if (error) throw error;
      loadPages();
    } catch (err) {
      console.error('Error toggling publish:', err);
      alert('操作失败');
    }
  };

  const getPageIcon = (pageKey: string) => {
    switch (pageKey) {
      case 'term': return '📜';
      case 'pricing': return '💰';
      case 'faq': return '❓';
      default: return '📄';
    }
  };

  const getPageName = (pageKey: string) => {
    switch (pageKey) {
      case 'term': return '服务条款 (Terms)';
      case 'pricing': return '价格 (Pricing)';
      case 'faq': return '常见问题 (FAQ)';
      default: return pageKey;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">📄 静态页面管理</h2>
          <p className="text-sm text-slate-600 mt-1">管理服务条款、价格、常见问题等静态内容</p>
        </div>
      </div>

      {/* 页面列表 */}
      <div className="grid grid-cols-1 gap-4">
        {pages.map((page) => (
          <div
            key={page.id}
            className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-indigo-300 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{getPageIcon(page.page_key)}</span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{getPageName(page.page_key)}</h3>
                    <p className="text-sm text-slate-500">{page.title}</p>
                  </div>
                </div>

                {page.meta_description && (
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">{page.meta_description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>最后更新: {new Date(page.updated_at).toLocaleString('zh-CN')}</span>
                  <span>•</span>
                  <span className={page.is_published ? 'text-green-600 font-semibold' : 'text-orange-600'}>
                    {page.is_published ? '✓ 已发布' : '○ 草稿'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewPage(page)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
                  title="预览"
                >
                  <IconEye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setEditingPage({ ...page })}
                  className="p-2 bg-indigo-100 hover:bg-indigo-200 rounded-lg text-indigo-700 transition-colors"
                  title="编辑"
                >
                  <IconEdit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => togglePublish(page)}
                  className={`p-2 rounded-lg transition-colors ${
                    page.is_published
                      ? 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                      : 'bg-green-100 hover:bg-green-200 text-green-700'
                  }`}
                  title={page.is_published ? '取消发布' : '发布'}
                >
                  {page.is_published ? <IconEyeOff className="w-5 h-5" /> : <IconCheck className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 编辑模态框 */}
      {editingPage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {getPageIcon(editingPage.page_key)} 编辑 {getPageName(editingPage.page_key)}
                </h3>
                <p className="text-sm text-slate-600 mt-1">编辑页面内容 (支持 Markdown)</p>
              </div>
              <button
                onClick={() => setEditingPage(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <IconX className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* 标题 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">页面标题</label>
                <input
                  type="text"
                  value={editingPage.title}
                  onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="输入页面标题"
                />
              </div>

              {/* SEO 描述 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">SEO 描述</label>
                <input
                  type="text"
                  value={editingPage.meta_description || ''}
                  onChange={(e) => setEditingPage({ ...editingPage, meta_description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="用于搜索引擎优化的页面描述"
                />
              </div>

              {/* 内容 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  页面内容 (Markdown 格式)
                </label>
                <textarea
                  value={editingPage.content}
                  onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  placeholder="使用 Markdown 格式编辑内容..."
                  rows={20}
                  style={{ minHeight: '400px' }}
                />
                <p className="text-xs text-slate-500 mt-2">
                  💡 提示: 使用 Markdown 语法，如 # 标题, **粗体**, - 列表等
                </p>
              </div>

              {/* 发布状态 */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <input
                  type="checkbox"
                  id="is-published"
                  checked={editingPage.is_published}
                  onChange={(e) => setEditingPage({ ...editingPage, is_published: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="is-published" className="text-sm font-medium text-slate-700 cursor-pointer">
                  发布此页面（用户可见）
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
              <Button
                onClick={() => setEditingPage(null)}
                className="bg-slate-200 text-slate-700 hover:bg-slate-300"
              >
                取消
              </Button>
              <Button onClick={handleSave} className="bg-indigo-600 text-white hover:bg-indigo-700">
                保存更改
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 预览模态框 */}
      {previewPage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {getPageIcon(previewPage.page_key)} {previewPage.title}
                </h3>
                <p className="text-sm text-slate-600 mt-1">预览模式</p>
              </div>
              <button
                onClick={() => setPreviewPage(null)}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <IconX className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="prose prose-slate max-w-none">
                {/* 简单的 Markdown 渲染 (使用基本的文本格式) */}
                <div
                  className="markdown-content"
                  dangerouslySetInnerHTML={{
                    __html: previewPage.content
                      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-4 text-slate-900">$1</h1>')
                      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mb-3 mt-6 text-slate-900">$1</h2>')
                      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mb-2 mt-4 text-slate-800">$1</h3>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                      .replace(/^- (.*$)/gim, '<li class="ml-6">$1</li>')
                      .replace(/\n\n/g, '</p><p class="mb-4">')
                      .replace(/^(.+)$/gim, '<p class="mb-4 text-slate-700 leading-relaxed">$1</p>')
                      .replace(/---/g, '<hr class="my-6 border-slate-200" />')
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
              <p className="text-xs text-slate-500">
                最后更新: {new Date(previewPage.updated_at).toLocaleString('zh-CN')}
              </p>
              <Button onClick={() => setPreviewPage(null)} className="bg-slate-200 text-slate-700 hover:bg-slate-300">
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



