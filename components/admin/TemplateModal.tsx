import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../Button';
import { IconX, IconUpload } from '../Icons';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  styleCategoryId: string;
  editingTemplate?: {
    id: string;
    template_id: string;
    name: string;
    image_url: string;
    prompt: string;
    display_order: number;
    is_active: boolean;
  } | null;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  styleCategoryId,
  editingTemplate,
}) => {
  const [formData, setFormData] = useState({
    template_id: '',
    name: '',
    image_url: '',
    prompt: '',
    display_order: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTemplate) {
      setFormData({
        template_id: editingTemplate.template_id,
        name: editingTemplate.name,
        image_url: editingTemplate.image_url,
        prompt: editingTemplate.prompt,
        display_order: editingTemplate.display_order,
        is_active: editingTemplate.is_active,
      });
    } else {
      setFormData({
        template_id: '',
        name: '',
        image_url: '',
        prompt: '',
        display_order: 0,
        is_active: true,
      });
    }
    setError(null);
    setUploadedFile(null);
  }, [editingTemplate, isOpen]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过 5MB');
      return;
    }

    setUploadedFile(file);
    setError(null);

    // Generate preview URL
    const previewUrl = URL.createObjectURL(file);
    setFormData({ ...formData, image_url: previewUrl });
  };

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `template-images/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('public-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('图片上传失败: ' + uploadError.message);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('public-assets')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let finalImageUrl = formData.image_url;

      // If user uploaded a file, upload it to Supabase Storage
      if (uploadedFile) {
        setUploading(true);
        finalImageUrl = await uploadImageToSupabase(uploadedFile);
        setUploading(false);
      }

      if (editingTemplate) {
        // Update existing
        const { error: updateError } = await supabase
          .from('prompt_templates')
          .update({
            template_id: formData.template_id,
            name: formData.name,
            image_url: finalImageUrl,
            prompt: formData.prompt,
            display_order: formData.display_order,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTemplate.id);

        if (updateError) throw updateError;
      } else {
        // Create new
        const { error: insertError } = await supabase
          .from('prompt_templates')
          .insert({
            style_category_id: styleCategoryId,
            template_id: formData.template_id,
            name: formData.name,
            image_url: finalImageUrl,
            prompt: formData.prompt,
            display_order: formData.display_order,
            is_active: formData.is_active,
          });

        if (insertError) throw insertError;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving template:', err);
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">
            {editingTemplate ? '编辑模板' : '添加模板'}
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
              模板 ID (template_id) *
            </label>
            <input
              type="text"
              value={formData.template_id}
              onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="例如: modern-minimalist-001"
              required
              disabled={!!editingTemplate}
            />
            <p className="text-xs text-slate-500 mt-1">
              唯一标识符，创建后不可修改
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              模板名称 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="例如: Modern Minimalist"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              模板图片 *
            </label>
            
            {/* Upload Button */}
            <div className="flex gap-3 mb-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <IconUpload className="w-4 h-4" />
                {uploadedFile ? '更换图片' : '上传图片'}
              </button>
              {uploadedFile && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="text-green-600">✓</span>
                  <span className="truncate max-w-[200px]">{uploadedFile.name}</span>
                  <span className="text-slate-400">({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>

            {/* URL Input (alternative) */}
            <div className="relative">
              <input
                type="url"
                value={uploadedFile ? '' : formData.image_url}
                onChange={(e) => {
                  setUploadedFile(null);
                  setFormData({ ...formData, image_url: e.target.value });
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="或输入图片 URL: https://example.com/image.jpg"
                disabled={!!uploadedFile}
                required={!uploadedFile}
              />
              {uploadedFile && (
                <div className="absolute inset-0 bg-slate-50 rounded-lg flex items-center justify-center text-sm text-slate-500">
                  已选择本地图片
                </div>
              )}
            </div>
            
            <p className="text-xs text-slate-500 mt-1">
              支持 JPG, PNG, GIF 格式，最大 5MB
            </p>

            {/* Image Preview */}
            {formData.image_url && (
              <div className="mt-3">
                <p className="text-xs text-slate-600 mb-2">预览:</p>
                <img
                  src={formData.image_url}
                  alt="预览"
                  className="w-40 h-40 object-cover rounded-lg border-2 border-slate-200 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23f1f5f9"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-size="14">无效图片</text></svg>';
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              提示词 (Prompt) *
            </label>
            <textarea
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
              rows={6}
              placeholder="输入用于 AI 生成的提示词..."
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              {formData.prompt.length} 个字符
            </p>
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

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button type="submit" disabled={saving || uploading} className="flex-1">
              {uploading ? '上传图片中...' : saving ? '保存中...' : '保存'}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              disabled={saving || uploading}
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

