import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Layers, Loader2 } from 'lucide-react';
import { gigApi } from '../lib/apiClient';
import { GigResponse } from '../types/api';
import { GigCreationForm } from './GigCreationForm';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { formatCurrency } from '../utils';

export const ProfessionalGigs: React.FC = () => {
  const [gigs, setGigs] = useState<GigResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [gigToDelete, setGigToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGigs = async () => {
    setLoading(true);
    try {
      const data = await gigApi.getMyGigs();
      setGigs(data);
    } catch (err) {
      console.error('Failed to fetch gigs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGigs();
  }, []);

  const confirmDelete = async () => {
    if (!gigToDelete) return;
    setIsDeleting(true);
    try {
      await gigApi.deleteGig(gigToDelete);
      setGigs(prev => prev.filter(g => g.id !== gigToDelete));
    } catch (err) {
      console.error('Failed to delete gig', err);
    } finally {
      setIsDeleting(false);
      setGigToDelete(null);
    }
  };

  if (isCreating) {
    return (
      <GigCreationForm 
        onCancel={() => setIsCreating(false)} 
        onSuccess={() => {
          setIsCreating(false);
          fetchGigs();
        }} 
      />
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">My Gigs</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your service offerings and pricing.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 justify-center shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Gig</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
          <Loader2 className="w-8 h-8 text-navy-500 animate-spin" />
        </div>
      ) : gigs.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
            <Layers className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Gigs Yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
            You haven't created any service offerings yet. Start building your catalog to attract more customers.
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="px-6 py-3 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 justify-center mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Gig</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {gigs.map(gig => (
            <div key={gig.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-full hover:border-navy-500/30 transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <span className="px-3 py-1 bg-navy-50 dark:bg-navy-900/30 text-navy-700 dark:text-navy-300 rounded-lg text-xs font-bold truncate max-w-[150px] border border-navy-100/50 dark:border-navy-800/50">
                  {gig.category}
                </span>
                <button
                  onClick={() => setGigToDelete(gig.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">
                {gig.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-6 flex-grow">
                {gig.description}
              </p>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between mt-auto">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">Starting at</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(gig.price)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">Delivery</p>
                  <p className="font-bold text-slate-900 dark:text-white">{gig.delivery_time_days} Days</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={!!gigToDelete}
        onClose={() => setGigToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Service Gig"
        description="Are you sure you want to delete this gig? This action cannot be undone and it will be removed from your public catalog immediately."
        confirmText="Delete Gig"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
