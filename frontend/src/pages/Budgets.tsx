import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Calendar, AlertTriangle, Landmark, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { BudgetModal } from '../components/BudgetModal';
import { useToast } from '../context/ToastContext';

export const Budgets = () => {
  const { addToast } = useToast();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/budgets?month=${month}`);
      if (res.data.success) {
        setBudgets(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [month]);

  const handleDeleteBudget = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this budget threshold?')) return;

    try {
      const res = await axios.delete(`/api/budgets/${id}`);
      if (res.data.success) {
        addToast('Budget limit cleared.', 'info');
        fetchBudgets();
      }
    } catch (err) {
      console.error('Failed to delete budget:', err);
      addToast('Failed to delete budget.', 'error');
    }
  };

  const getOverallBudgetStatus = () => {
    const totalBudget = budgets.find(b => b.category === 'Total');
    if (totalBudget) return totalBudget;

    // Sum others if no explicit Total is set
    const totalLimit = budgets.reduce((sum, item) => sum + (item.category !== 'Total' ? item.limit : 0), 0);
    const totalSpent = budgets.reduce((sum, item) => sum + (item.category !== 'Total' ? item.spent : 0), 0);

    return {
      limit: totalLimit,
      spent: totalSpent,
      percentage: totalLimit > 0 ? parseFloat(((totalSpent / totalLimit) * 100).toFixed(2)) : 0,
      isOverspent: totalSpent > totalLimit
    };
  };

  const overall = getOverallBudgetStatus();

  const getCategoryEmoji = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'housing': return '🏡';
      case 'vehicle': return '🚗';
      case 'education': return '📚';
      case 'travel': return '✈️';
      case 'retirement': return '🏖️';
      case 'savings': return '💰';
      case 'wedding': return '💍';
      case 'business': return '🏢';
      case 'electronics': return '💻';
      case 'investment': return '📈';
      case 'charity': return '🤝';
      case 'health': return '🏥';
      case 'emergency': return '🚨';
      case 'food': return '☕';
      case 'shopping': return '🛒';
      case 'bills': return '📄';
      case 'total': return '🏦';
      default: return '🏷️';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-800 dark:text-white">
            Budget Configurations
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Set and track spending boundaries to avoid financial leaks.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Month selector */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Calendar size={14} />
            </span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-700 dark:text-[#f3f4f6] cursor-pointer outline-none focus:border-brand-primary"
            />
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-primary hover:bg-indigo-600 shadow-md shadow-brand-primary/10 transition duration-200"
          >
            <Plus size={14} />
            <span>Configure Budget</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Overall Progress Indicator */}
          <div className="p-6 rounded-2xl glass-panel grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="space-y-1.5 md:col-span-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Overall Budget Health for {month}
              </span>
              <div className="flex justify-between items-baseline">
                <h2 className={`text-3xl font-black ${overall.isOverspent ? 'text-brand-danger' : 'text-brand-primary'}`}>
                  ₹{overall.spent.toLocaleString('en-IN')}
                  <span className="text-xs font-semibold text-gray-400 ml-1">
                    spent of ₹{overall.limit.toLocaleString('en-IN')} cap
                  </span>
                </h2>
                <span className="text-sm font-black text-gray-500 dark:text-gray-300">
                  {overall.percentage}%
                </span>
              </div>
              
              <div className="w-full bg-dark-bg rounded-full h-3 shadow-inner border border-white/5 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, overall.percentage)}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={`h-full rounded-full ${overall.isOverspent ? 'bg-brand-danger' : 'bg-brand-primary'}`}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/40 dark:bg-dark-card/45 border border-gray-100 dark:border-dark-border/40 flex items-center space-x-3.5 h-full">
              {overall.isOverspent ? (
                <>
                  <div className="w-10 h-10 rounded-lg bg-brand-danger/10 flex items-center justify-center text-brand-danger shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-brand-danger uppercase tracking-wider">Overspending Alert</h4>
                    <p className="text-[10px] text-gray-400 font-medium leading-tight mt-0.5">
                      You are over budget by ₹{(overall.spent - overall.limit).toLocaleString('en-IN')}!
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-lg bg-brand-success/10 flex items-center justify-center text-brand-success shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-brand-success uppercase tracking-wider">Safe spending Zone</h4>
                    <p className="text-[10px] text-gray-400 font-medium leading-tight mt-0.5">
                      You have ₹{(overall.limit - overall.spent).toLocaleString('en-IN')} remaining before cap.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Budgets Grid */}
          <motion.div 
            initial="hidden" animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {budgets.length === 0 ? (
              <div className="col-span-full py-16 text-center text-gray-400 font-semibold glass-panel rounded-2xl">
                No budget thresholds set for this month. Click "Configure Budget" to establish boundaries.
              </div>
            ) : (
              budgets.map(b => (
                <motion.div 
                  variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}
                  key={b._id} 
                  className="p-6 rounded-3xl glass-panel relative flex flex-col justify-between h-48 hover-glow border border-white/5 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-brand-primary/10 to-transparent pointer-events-none" />

                  <div className="flex justify-between items-start z-10">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl p-2.5 bg-dark-bg/50 rounded-2xl shadow-inner border border-white/5">
                        {getCategoryEmoji(b.category)}
                      </div>
                      <div>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-brand-primary/10 text-brand-primary">
                          {b.category === 'Total' ? 'Overall Cap' : b.category}
                        </span>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1.5">Monthly Limit</h4>
                        <h3 className="text-lg font-black text-gray-800 dark:text-white">₹{b.limit.toLocaleString('en-IN')}</h3>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteBudget(b._id)}
                      className="p-2 rounded-xl border border-brand-danger/10 hover:border-brand-danger/25 text-brand-danger bg-brand-danger/5 hover:bg-brand-danger/10 transition"
                      title="Remove Target"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="mt-4 space-y-2 z-10">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-gray-400">Spent: ₹{b.spent.toLocaleString('en-IN')}</span>
                      <span className={b.isOverspent ? 'text-brand-danger font-black' : 'text-gray-500 dark:text-gray-300'}>
                        {b.percentage}%
                      </span>
                    </div>

                    <div className="w-full bg-dark-bg rounded-full h-2.5 shadow-inner border border-white/5 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.min(100, b.percentage)}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={`h-full ${b.isOverspent ? 'bg-brand-danger shadow-sm shadow-brand-danger/20' : 'bg-brand-primary shadow-sm shadow-brand-primary/20'}`}
                      />
                    </div>
                  </div>

                  {b.isOverspent && (
                    <div className="absolute top-2 right-12 z-20 animate-pulse">
                      <span className="bg-brand-danger/10 text-brand-danger text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border border-brand-danger/25">
                        Overspent
                      </span>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        </>
      )}

      {/* Budget Set Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMonth={month}
        onSuccess={fetchBudgets}
      />
    </div>
  );
};
export default Budgets;
