import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../Button';
import { IconX } from '../Icons';

interface FeaturePageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingPage?: {
    id: string;
    page_key: string;
    display_name: string;
    description: string | null;
    display_order: number;
    is_active: boolean;
  } | null;
}

export const FeaturePageModal: React.FC<FeaturePageModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingPage,
}) => {
  const [formData, setFormData] = useState({
    page_key: '',
    display_name: '',
    description: '',
    display_order: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingPage) {
      setFormData({
        page_key: editingPage.page_key,
        display_name: editingPage.display_name,
        description: editingPage.description || '',
        display_order: editingPage.display_order,
        is_active: editingPage.is_active,
      });
    } else {
      setFormData({
        page_key: '',
        display_name: '',
        description: '',
        display_order: 0,
        is_active: true,
      });
    }
    setError(null);
  }, [editingPage, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingPage) {
        // Update existing
        const { error: updateError } = await supabase
          .from('feature_pages')
          .update({
            page_key: formData.page_key,
            display_name: formData.display_name,
            description: formData.description || null,
            display_order: formData.display_order,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPage.id);

        if (updateError) throw updateError;
      } else {
        // Create new
        const { error: insertError } = await supabase
          .from('feature_pages')
          .insert({
            page_key: formData.page_key,
            display_name: formData.display_name,
            description: formData.description || null,
            display_order: formData.display_order,
            is_active: formData.is_active,
          });

        if (insertError) throw insertError;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving feature page:', err);
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">
            {editingPage ? '编辑功能页面' : '添加功能页面'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              页面标识 (page_key) *
            </label>
            <input
              type="text"
              value={formData.page_key}
              onChange={(e) => setFormData({ ...formData, page_key: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="例如: custom-feature"
              required
              disabled={!!editingPage}
            />
            <p className="text-xs text-slate-500 mt-1">
              唯一标识符，只能包含小写字母、数字和连字符
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              显示名称 *
            </label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="例如: Custom Feature"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={3}
              placeholder="功能页面描述"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              排序顺序
            </label>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              min="0"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-slate-700">
              启用
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={saving}
              className="flex-1"
            >
              {saving ? '保存中...' : '保存'}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 bg-slate-200 text-slate-700 hover:bg-slate-300"
            >
              取消
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};



