import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, ShieldAlert } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMonth?: string;
}

export const BudgetModal = ({ isOpen, onClose, onSuccess, initialMonth }: BudgetModalProps) => {
  const { addToast } = useToast();
  const [limit, setLimit] = useState('');
  const [category, setCategory] = useState('Total');
  const [month, setMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const expenseCategories = [
    'Total',
    'Food',
    'Transport',
    'Education',
    'Shopping',
    'Entertainment',
    'Bills',
    'Healthcare',
    'Travel',
    'Others'
  ];

  useEffect(() => {
    if (isOpen) {
      setLimit('');
      setCategory('Total');
      setMonth(initialMonth || new Date().toISOString().slice(0, 7));
      setError('');
    }
  }, [isOpen, initialMonth]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!limit || !category || !month) {
      setError('Please fill in limit, category, and month.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/api/budgets', {
        category,
        limit: parseFloat(limit),
        month
      });

      if (res.data.success) {
        addToast(`Successfully set ${category} budget to ₹${limit}!`, 'success');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save budget configuration.');
      addToast('Failed to save budget configuration.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-xs px-4">
      {/* Modal Container */}
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-dark-border shadow-2xl glass-panel-heavy overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-primary to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
          <h3 className="font-bold text-base flex items-center">
            <ShieldAlert size={16} className="mr-1.5 animate-bounce" />
            Configure Budget Target
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white dark:bg-dark-card text-gray-800 dark:text-gray-100">
          
          {error && (
            <div className="p-3 text-xs font-semibold text-brand-danger bg-brand-danger/10 border border-brand-danger/20 rounded-xl">
              {error}
            </div>
          )}

          {/* Month Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Budget Period *
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
              className="w-full px-3 py-2.5 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:border-brand-primary dark:focus:border-brand-primary text-sm font-semibold cursor-pointer"
            />
          </div>

          {/* Category Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Target Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:border-brand-primary dark:focus:border-brand-primary text-sm font-semibold cursor-pointer"
            >
              {expenseCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'Total' ? 'Overall Budget (Total)' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Limit / Cap Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Monthly Budget Limit *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                ₹
              </span>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="0.00"
                min="1"
                required
                className="w-full pl-8 pr-4 py-2.5 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:border-brand-primary dark:focus:border-brand-primary text-sm font-semibold"
              />
            </div>
            <p className="text-[10px] text-gray-400 italic">
              Setting a budget will trigger alerts if your expenses in this category exceed the limit.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 dark:border-dark-border rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center space-x-1.5 bg-brand-primary hover:bg-indigo-600 shadow-md shadow-brand-primary/10 transition"
            >
              <Save size={14} />
              <span>{loading ? 'Saving...' : 'Set Budget'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default BudgetModal;
