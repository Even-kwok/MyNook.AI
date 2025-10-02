import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface StaticPageProps {
  pageKey: 'term' | 'pricing' | 'faq';
}

interface PageData {
  id: string;
  page_key: string;
  title: string;
  content: string;
  meta_description: string | null;
  updated_at: string;
}

export const StaticPage: React.FC<StaticPageProps> = ({ pageKey }) => {
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPage();
  }, [pageKey]);

  const loadPage = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('static_pages')
        .select('*')
        .eq('page_key', pageKey)
        .eq('is_published', true)
        .single();

      if (fetchError) throw fetchError;

      setPage(data);
    } catch (err) {
      console.error('Error loading page:', err);
      setError('加载页面失败');
    } finally {
      setLoading(false);
    }
  };

  const renderMarkdown = (markdown: string) => {
    return markdown
      .replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold mb-6 text-slate-900">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-3xl font-bold mb-4 mt-8 text-slate-900">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-2xl font-semibold mb-3 mt-6 text-slate-800">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/^- (.*$)/gim, '<li class="ml-6 mb-2 text-slate-700">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-4 text-slate-700 leading-relaxed">')
      .replace(/^(.+)$/gim, '<p class="mb-4 text-slate-700 leading-relaxed">$1</p>')
      .replace(/---/g, '<hr class="my-8 border-slate-300" />');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-slate-600">加载中...</p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">页面加载失败</h2>
        <p className="text-slate-600 mb-6">{error || '未找到该页面'}</p>
        <button
          onClick={loadPage}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">{page.title}</h1>
          {page.meta_description && (
            <p className="text-lg text-slate-600">{page.meta_description}</p>
          )}
          <p className="text-sm text-slate-500 mt-4">
            最后更新: {new Date(page.updated_at).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
          <div
            className="prose prose-slate prose-lg max-w-none
              prose-headings:font-bold
              prose-h1:text-4xl prose-h1:mb-6 prose-h1:text-slate-900
              prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:text-slate-900
              prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-6 prose-h3:text-slate-800
              prose-p:mb-4 prose-p:text-slate-700 prose-p:leading-relaxed
              prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-slate-900 prose-strong:font-semibold
              prose-ul:mb-4 prose-li:mb-2 prose-li:text-slate-700
              prose-hr:my-8 prose-hr:border-slate-300"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }}
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            有问题？ 联系我们: <a href="mailto:support@homevision.ai" className="text-indigo-600 hover:underline">support@homevision.ai</a>
          </p>
        </div>
      </div>
    </div>
  );
};



