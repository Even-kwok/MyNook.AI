import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { PromptTemplate, Subcategory } from '../../lib/database.types';
import { Button } from '../Button';
import { motion } from 'framer-motion';
import { IconX } from '../Icons';

interface TemplateEditModalProps {
  template: PromptTemplate | null;
  subcategoryId: string;
  subcategoryName: string;
  onClose: () => void;
  onSave: () => void;
}

export const TemplateEditModal: React.FC<TemplateEditModalProps> = ({
  template,
  subcategoryId,
  subcategoryName,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    template_id: template?.template_id || '',
    name: template?.name || '',
    image_url: template?.image_url || '',
    prompt: template?.prompt || '',
    room_types: template?.room_types || [],
    is_active: template?.is_active ?? true,
    display_order: template?.display_order || 0,
    subcategory_id: subcategoryId,
  });
  const [saving, setSaving] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState<string[]>(template?.room_types || []);
  const [error, setError] = useState<string | null>(null);

  const roomTypeOptions = [
    { value: 'living-room', label: 'Living Room' },
    { value: 'dining-room', label: 'Dining Room' },
    { value: 'bedroom', label: 'Bedroom' },
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'bathroom', label: 'Bathroom' },
    { value: 'home-office', label: 'Home Office' },
    { value: 'nursery', label: 'Nursery' },
    { value: 'kids-room', label: 'Kids Room' },
    { value: 'yoga-studio', label: 'Yoga Studio' },
    { value: 'garden', label: 'Garden' },
    { value: 'library', label: 'Library' },
    { value: 'theater', label: 'Theater' },
    { value: 'studio', label: 'Studio' },
    { value: 'game-room', label: 'Game Room' },
    { value: 'wine-cellar', label: 'Wine Cellar' },
    { value: 'music-room', label: 'Music Room' },
    { value: 'fitness-room', label: 'Fitness Room' },
    { value: 'pantry', label: 'Pantry' },
    { value: 'laundry-room', label: 'Laundry Room' },
    { value: 'mudroom', label: 'Mudroom' },
    { value: 'balcony', label: 'Balcony' },
    { value: 'attic', label: 'Attic' },
    { value: 'basement', label: 'Basement' },
    { value: 'closet', label: 'Closet' },
  ];

  const toggleRoom = (roomValue: string) => {
    const newRooms = selectedRooms.includes(roomValue)
      ? selectedRooms.filter((r) => r !== roomValue)
      : [...selectedRooms, roomValue];
    setSelectedRooms(newRooms);
    setFormData({ ...formData, room_types: newRooms });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Validation
      if (!formData.template_id || !formData.name || !formData.image_url || !formData.prompt) {
        throw new Error('Please fill in all required fields');
      }

      if (template) {
        // Update existing template
        const { error } = await supabase
          .from('prompt_templates')
          .update({
            name: formData.name,
            image_url: formData.image_url,
            prompt: formData.prompt,
            room_types: formData.room_types,
            is_active: formData.is_active,
            display_order: formData.display_order,
          })
          .eq('id', template.id);

        if (error) throw error;

        await supabase.rpc('log_admin_action', {
          action_param: 'update',
          entity_type_param: 'template',
          entity_id_param: template.id,
          details_param: { name: formData.name, subcategory_id: subcategoryId },
        });
      } else {
        // Create new template
        const { error } = await supabase.from('prompt_templates').insert([
          {
            template_id: formData.template_id,
            name: formData.name,
            image_url: formData.image_url,
            prompt: formData.prompt,
            room_types: formData.room_types,
            is_active: formData.is_active,
            display_order: formData.display_order,
            subcategory_id: subcategoryId,
          },
        ]);

        if (error) throw error;

        await supabase.rpc('log_admin_action', {
          action_param: 'create',
          entity_type_param: 'template',
          entity_id_param: formData.template_id,
          details_param: { name: formData.name, subcategory_id: subcategoryId },
        });
      }

      onSave();
    } catch (err) {
      console.error('Error saving template:', err);
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-white p-6 border-b border-slate-200 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {template ? 'Edit Template' : 'Add New Template'}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Subcategory: <span className="font-medium">{subcategoryName}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <IconX className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Template ID */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Template ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.template_id}
                  onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                  placeholder="e.g., design-scandinavian-modern"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  disabled={!!template} // Can't change ID after creation
                />
                {template && (
                  <p className="text-xs text-slate-500 mt-1">Template ID cannot be changed</p>
                )}
              </div>

              {/* Template Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Scandinavian Modern"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Image URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              {formData.image_url && (
                <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Invalid+URL';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Prompt */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                AI Prompt <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                rows={8}
                placeholder="Enter detailed AI generation prompt..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-mono text-sm"
                required
              ></textarea>
              <p className="text-xs text-slate-500 mt-1">
                This prompt will be sent to Gemini API. Be specific and detailed.
              </p>
            </div>

            {/* Room Types */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Applicable Room Types (Optional)
              </label>
              <div className="border border-slate-300 rounded-lg p-3 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {roomTypeOptions.map((room) => (
                  <label
                    key={room.value}
                    className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRooms.includes(room.value)}
                      onChange={() => toggleRoom(room.value)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">{room.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Selected: {selectedRooms.length} room type{selectedRooms.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Display Order */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-500 mt-1">Lower numbers appear first</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <div className="flex items-center gap-3 pt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                  <span className="text-sm text-slate-700">
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white p-6 border-t border-slate-200 flex justify-end gap-3">
            <Button type="button" onClick={onClose} className="!bg-slate-200 !text-slate-700 hover:!bg-slate-300">
              Cancel
            </Button>
            <Button type="submit" primary disabled={saving}>
              {saving ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

