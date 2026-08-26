import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Layers, Loader2 } from 'lucide-react';
import { gigApi } from '../lib/apiClient';
import { GigResponse } from '../types/api';
import { CreateGigModal } from './CreateGigModal';
import { formatCurrency } from '../utils';

export const ProfessionalGigs: React.FC = () => {
  const [gigs, setGigs] = useState<GigResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this gig?')) {
      try {
        await gigApi.deleteGig(id);
        setGigs(prev => prev.filter(g => g.id !== id));
      } catch (err) {
        console.error('Failed to delete gig', err);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">My API Gigs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your service offerings and pricing.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Gig</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-navy-500 animate-spin" />
        </div>
      ) : gigs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <Layers className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Gigs Yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            You haven't created any service offerings yet.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-xl bg-navy-800 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 justify-center mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Gig</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {gigs.map(gig => (
            <div key={gig.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <span className="px-3 py-1 bg-navy-50 dark:bg-navy-900/30 text-navy-700 dark:text-navy-300 rounded-lg text-xs font-bold truncate max-w-[150px]">
                  {gig.category}
                </span>
                <button
                  onClick={() => handleDelete(gig.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">
                {gig.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 flex-grow">
                {gig.description}
              </p>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Starting at</p>
                  <p className="font-black text-slate-900 dark:text-white">{formatCurrency(gig.price)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Delivery</p>
                  <p className="font-bold text-slate-900 dark:text-white">{gig.delivery_time_days} Days</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateGigModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchGigs();
          }}
        />
      )}
    </div>
  );
};
