import React, { useState } from 'react';
import { Loader2, X, ArrowLeft } from 'lucide-react';
import { gigApi } from '../lib/apiClient';
import { GigCreate } from '../types/api';
import { CATEGORIES } from '../mockData';

interface GigCreationFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export const GigCreationForm: React.FC<GigCreationFormProps> = ({ onCancel, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<GigCreate>({
    title: '',
    description: '',
    category: CATEGORIES[0] || 'Plumbing',
    price: 0,
    delivery_time_days: 1,
    tags: [],
    images: []
  });

  const [tagInput, setTagInput] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'delivery_time_days' ? Number(value) : value
    }));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags?.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...(prev.tags || []), tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tagToRemove) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await gigApi.createGig(formData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to create gig');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={onCancel}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Create New Gig</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Fill in the details for your new service offering.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm font-medium">
            {error}
          </div>
        )}
        
        <form id="gig-form" onSubmit={handleSubmit} className="space-y-8 w-full">
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Gig Title</label>
              <input
                required
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., I will fix your plumbing issues..."
                className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 transition-all text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</label>
              <textarea
                required
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                placeholder="Describe what this service includes in detail..."
                className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 transition-all text-slate-900 dark:text-white font-medium resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 transition-all text-slate-900 dark:text-white font-medium"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Starting Price (₦)</label>
                <input
                  required
                  type="number"
                  name="price"
                  min="0"
                  value={formData.price || ''}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 transition-all text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Delivery Time (Days)</label>
                <input
                  required
                  type="number"
                  name="delivery_time_days"
                  min="1"
                  value={formData.delivery_time_days || ''}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 transition-all text-slate-900 dark:text-white font-medium"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tags</label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Press Enter to add tag"
                  className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 transition-all text-slate-900 dark:text-white font-medium"
                />
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-50 text-navy-700 dark:bg-navy-900/40 dark:text-navy-300 text-xs font-bold border border-navy-100 dark:border-navy-800">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 p-0.5 rounded-full hover:bg-navy-100 dark:hover:bg-navy-900 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="pt-6 mt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-xl font-bold text-sm bg-navy-800 hover:bg-navy-900 text-white shadow-md flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {loading ? 'Creating Gig...' : 'Create Gig'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
