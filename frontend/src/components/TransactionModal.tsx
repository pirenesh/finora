import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'income' | 'expense';
  editItem?: any;
  onSuccess: () => void;
}

export const TransactionModal = ({ isOpen, onClose, type, editItem, onSuccess }: TransactionModalProps) => {
  const { addToast } = useToast();
  const [amount, setAmount] = useState<string | number>('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Bulk logging states
  const [isBulk, setIsBulk] = useState(false);
  const [bulkAmounts, setBulkAmounts] = useState<Record<string, string>>({});
  const [bulkDescriptions, setBulkDescriptions] = useState<Record<string, string>>({});

  // Categories list
  const incomeCategories = ['Salary', 'Freelancing', 'Business', 'Investments', 'Other Income'];
  const expenseCategories = ['Food', 'Transport', 'Education', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Travel', 'Others'];
  const activeCategories = type === 'income' ? incomeCategories : expenseCategories;

  // Populate fields if editing or reset on open
  useEffect(() => {
    if (editItem) {
      setAmount(editItem.amount);
      setCategory(editItem.category);
      setDate(new Date(editItem.date).toISOString().slice(0, 10));
      setDescription(editItem.description || '');
      setIsBulk(false);
    } else {
      setAmount('');
      setCategory(activeCategories[0] || '');
      setDate(new Date().toISOString().slice(0, 10));
      setDescription('');
      setIsBulk(false);

      // Reset bulk inputs
      const initAmounts: Record<string, string> = {};
      const initDescs: Record<string, string> = {};
      activeCategories.forEach(cat => {
        initAmounts[cat] = '';
        initDescs[cat] = '';
      });
      setBulkAmounts(initAmounts);
      setBulkDescriptions(initDescs);
    }
    setError('');
  }, [editItem, type, isOpen]);

  // Adjust category and bulk inputs if type changes
  useEffect(() => {
    if (!editItem) {
      setCategory(activeCategories[0] || '');
      
      const initAmounts: Record<string, string> = {};
      const initDescs: Record<string, string> = {};
      activeCategories.forEach(cat => {
        initAmounts[cat] = '';
        initDescs[cat] = '';
      });
      setBulkAmounts(initAmounts);
      setBulkDescriptions(initDescs);
    }
  }, [type]);

  if (!isOpen) return null;

  const handleBulkAmountChange = (cat: string, val: string) => {
    setBulkAmounts(prev => ({ ...prev, [cat]: val }));
  };

  const handleBulkDescChange = (cat: string, val: string) => {
    setBulkDescriptions(prev => ({ ...prev, [cat]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isBulk) {
      // Validate bulk data
      const items = Object.entries(bulkAmounts)
        .map(([cat, amt]) => ({
          category: cat,
          amount: parseFloat(amt),
          description: bulkDescriptions[cat]?.trim() || description
        }))
        .filter(item => !isNaN(item.amount) && item.amount > 0);

      if (items.length === 0) {
        setError('Please enter an amount for at least one category.');
        return;
      }

      if (!date) {
        setError('Please select a date.');
        return;
      }

      setLoading(true);

      const endpoint = type === 'income' ? '/api/income' : '/api/expense';
      const payload = type === 'income'
        ? { date, description, incomes: items }
        : { date, description, expenses: items };

      try {
        const res = await axios.post(endpoint, payload);
        if (res.data.success) {
          addToast(`Successfully logged ${items.length} ${type} entries!`, 'success');
          onSuccess();
          onClose();
        }
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to save transaction. Try again.');
        addToast('Transaction failed to save.', 'error');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Single mode validation
    if (!amount || !category || !date) {
      setError('Please fill in amount, category, and date.');
      return;
    }

    setLoading(true);

    const payload = {
      amount: parseFloat(amount.toString()),
      category,
      date,
      description
    };

    try {
      const endpoint = type === 'income' ? '/api/income' : '/api/expense';
      let res;

      if (editItem) {
        res = await axios.put(`${endpoint}/${editItem._id}`, payload);
      } else {
        res = await axios.post(endpoint, payload);
      }

      if (res.data.success) {
        addToast(
          editItem
            ? `Successfully updated ${type} entry!`
            : `Successfully created new ${type} entry!`,
          'success'
        );
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save transaction. Try again.');
      addToast('Transaction failed to save.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-xs px-4">
      {/* Modal Card */}
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-dark-border shadow-2xl glass-panel-heavy overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className={`
          px-6 py-4 flex items-center justify-between text-white
          ${type === 'income' ? 'bg-gradient-to-r from-brand-success to-emerald-600' : 'bg-gradient-to-r from-brand-danger to-rose-600'}
        `}>
          <h3 className="font-bold text-base flex items-center">
            <Sparkles size={16} className="mr-1.5 animate-pulse" />
            {editItem ? 'Modify' : 'Add New'} {type === 'income' ? 'Income' : 'Expense'}
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

          {/* Toggle for Single vs Bulk mode */}
          {!editItem && (
            <div className="flex border-b border-gray-200 dark:border-dark-border mb-2">
              <button
                type="button"
                onClick={() => setIsBulk(false)}
                className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition ${
                  !isBulk
                    ? type === 'income'
                      ? 'border-b-2 border-brand-success text-brand-success'
                      : 'border-b-2 border-brand-danger text-brand-danger'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                Single Category
              </button>
              <button
                type="button"
                onClick={() => setIsBulk(true)}
                className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition ${
                  isBulk
                    ? type === 'income'
                      ? 'border-b-2 border-brand-success text-brand-success'
                      : 'border-b-2 border-brand-danger text-brand-danger'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                Multiple Categories
              </button>
            </div>
          )}

          {isBulk ? (
            /* Bulk / Multi-Category Inputs Grid */
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Enter amounts for the categories you want to log:
              </div>
              {activeCategories.map((cat) => (
                <div key={cat} className="flex items-center space-x-2 p-2 rounded-xl bg-gray-50/50 dark:bg-dark-bg/50 border border-gray-100 dark:border-dark-border/40">
                  <span className="w-24 text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                    {cat}
                  </span>
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={bulkAmounts[cat] || ''}
                      onChange={(e) => handleBulkAmountChange(cat, e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-full pl-6 pr-2 py-1.5 outline-none rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-xs font-semibold focus:border-brand-primary"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Memo (optional)"
                    value={bulkDescriptions[cat] || ''}
                    onChange={(e) => handleBulkDescChange(cat, e.target.value)}
                    className="w-28 px-2 py-1.5 outline-none rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-xs font-normal focus:border-brand-primary"
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Standard Single Mode Inputs */
            <>
              {/* Amount Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount ({type === 'income' ? 'Earnings' : 'Cost'}) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required={!isBulk}
                    className="w-full pl-8 pr-4 py-2.5 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:border-brand-primary dark:focus:border-brand-primary text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Category Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:border-brand-primary dark:focus:border-brand-primary text-sm font-semibold cursor-pointer"
                >
                  {activeCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Transaction Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2.5 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:border-brand-primary dark:focus:border-brand-primary text-sm font-semibold cursor-pointer"
            />
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {isBulk ? 'Default Memo / Description (used for blank category memos)' : 'Memo / Description'}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Monthly salary payout, Grocery run"
              className="w-full px-3 py-2.5 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:border-brand-primary dark:focus:border-brand-primary text-sm font-semibold"
            />
          </div>

          {/* Submit Action */}
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
              className={`
                flex-1 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center space-x-1.5 shadow-md shadow-brand-primary/10 transition
                ${type === 'income' ? 'bg-brand-success hover:bg-emerald-600 shadow-emerald-500/10' : 'bg-brand-danger hover:bg-rose-600 shadow-rose-500/10'}
              `}
            >
              <Save size={14} />
              <span>{loading ? 'Saving...' : 'Save Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default TransactionModal;
