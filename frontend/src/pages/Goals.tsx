import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Target, 
  Trash2, 
  Calendar, 
  Award, 
  TrendingUp, 
  Percent, 
  X, 
  Coins,
  ChevronRight,
  HelpCircle,
  PiggyBank
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

export const Goals = () => {
  const { addToast } = useToast();
  const { t } = useTranslation();
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Goal Form State
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentSavings, setCurrentSavings] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('savings');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Allocation panel states
  const [allocatingGoalId, setAllocatingGoalId] = useState<string | null>(null);
  const [allocateAmount, setAllocateAmount] = useState('');

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/goals');
      if (res.data.success) {
        setGoals(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load goals:', err);
      addToast('Failed to load life goals.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleOpenAddModal = () => {
    setName('');
    setTargetAmount('');
    setCurrentSavings('');
    setTargetDate('');
    setCategory('savings');
    setDescription('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleAddGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || !targetDate) {
      setFormError('Please enter Name, Target Amount, and Target Date.');
      return;
    }

    try {
      const payload = {
        name,
        targetAmount: parseFloat(targetAmount),
        currentSavings: parseFloat(currentSavings || '0'),
        targetDate,
        category,
        description
      };

      const res = await axios.post('/api/goals', payload);
      if (res.data.success) {
        addToast(`Life Goal "${name}" created successfully!`, 'success');
        fetchGoals();
        setIsAddModalOpen(false);
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to create life goal.');
    }
  };

  const handleAllocateSubmit = async (e: React.FormEvent, goal: any) => {
    e.preventDefault();
    const parsedAmount = parseFloat(allocateAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      addToast('Please enter a valid savings amount.', 'error');
      return;
    }

    try {
      const newSavings = goal.currentSavings + parsedAmount;
      const res = await axios.put(`/api/goals/${goal._id}`, {
        currentSavings: newSavings
      });

      if (res.data.success) {
        addToast(`Allocated ₹${parsedAmount.toLocaleString()} to "${goal.name}"!`, 'success');
        setAllocatingGoalId(null);
        setAllocateAmount('');
        fetchGoals();
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to allocate savings.', 'error');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this financial goal? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await axios.delete(`/api/goals/${id}`);
      if (res.data.success) {
        addToast('Life goal deleted.', 'info');
        fetchGoals();
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to delete goal.', 'error');
    }
  };

  // Summarize metrics
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.currentSavings, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
  const activeCount = goals.filter(g => g.status === 'active').length;

  const getRemainingMonths = (dateStr: string) => {
    const today = new Date();
    const target = new Date(dateStr);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.ceil(diffDays / 30);
    return months > 0 ? months : 0;
  };

  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
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
      default: return '🎯';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-800 dark:text-white">
            {t('goals.title')}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('goals.subtitle')}
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-primary hover:bg-violet-600 shadow-md shadow-violet-500/10 transition duration-200"
        >
          <Plus size={16} />
          <span>{t('goals.addGoal')}</span>
        </button>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Goals Grid list */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">
              Goal Tracking Workspace
            </h3>

            {goals.length === 0 ? (
              <div className="p-12 text-center rounded-2xl glass-panel text-gray-400 font-semibold space-y-4">
                <Target size={48} className="mx-auto text-gray-500 opacity-60" />
                <div>
                  <p>No active life goals established yet.</p>
                  <p className="text-xs text-gray-500 mt-1">Click "Establish New Goal" above to create milestones.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {goals.map((goal) => {
                  const progress = Math.min(100, Math.round((goal.currentSavings / goal.targetAmount) * 100));
                  const monthsLeft = getRemainingMonths(goal.targetDate);
                  
                  const monthlyTarget = monthsLeft > 0
                    ? Math.max(0, Math.ceil((goal.targetAmount - goal.currentSavings) / monthsLeft))
                    : goal.targetAmount - goal.currentSavings;

                  const isAchieved = goal.status === 'achieved' || progress >= 100;

                  return (
                    <motion.div 
                      key={goal._id}
                      variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}
                      className={`p-6 rounded-3xl border transition duration-300 glass-panel flex flex-col justify-between space-y-5 relative overflow-hidden hover-glow ${
                        isAchieved 
                          ? 'border-brand-success/30 shadow-brand-success/10' 
                          : 'border-white/5'
                      }`}
                    >
                      {/* Gradient Banner Top */}
                      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-brand-primary/20 to-transparent pointer-events-none" />
                      
                      {isAchieved && (
                        <div className="absolute right-0 top-0 w-24 h-24 bg-brand-success/10 rounded-bl-full flex items-center justify-center text-brand-success font-bold rotate-12 shrink-0 pointer-events-none">
                          <Award size={28} />
                        </div>
                      )}

                      <div className="space-y-2 relative z-10">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3 max-w-[85%]">
                            <div className="text-3xl p-3 bg-dark-bg/50 rounded-2xl shadow-inner border border-white/5">
                              {getCategoryEmoji(goal.category)}
                            </div>
                            <div className="space-y-0.5">
                              <span className={`text-[10px] font-extrabold uppercase text-gray-400 tracking-wider`}>
                                {goal.category}
                              </span>
                              <h4 className="font-extrabold text-lg text-white leading-tight truncate">
                                {goal.name}
                              </h4>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => handleDeleteGoal(goal._id)}
                            className="p-1.5 rounded-lg text-brand-danger hover:bg-brand-danger/10 transition shrink-0"
                            title="Delete Milestone"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {goal.description && (
                          <p className="text-[11px] text-gray-500 leading-normal italic font-medium">
                            {goal.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-gray-600 dark:text-gray-300">₹{goal.currentSavings.toLocaleString()} Saved</span>
                          <span className="text-gray-400">Target: ₹{goal.targetAmount.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-dark-bg h-2.5 rounded-full overflow-hidden shadow-inner border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${progress}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`h-full ${
                              isAchieved ? 'bg-brand-success' : 'bg-brand-primary'
                            }`}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-black tracking-wide text-gray-400">
                          <span>{progress}% Completed</span>
                          <span className="flex items-center space-x-1">
                            <Calendar size={10} className="mr-0.5" />
                            <span>
                              {isAchieved 
                                ? 'Achieved!' 
                                : monthsLeft > 0 
                                  ? `${monthsLeft} month(s) left` 
                                  : 'Due this month'}
                            </span>
                          </span>
                        </div>
                      </div>

                      {!isAchieved && (
                        <div className="p-3.5 rounded-xl bg-violet-600/5 dark:bg-dark-card/30 border border-brand-primary/10 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Recommended Savings</span>
                            <span className="font-extrabold text-gray-800 dark:text-white">
                              ₹{monthlyTarget.toLocaleString()}/month
                            </span>
                          </div>
                          <span className="text-[9px] text-brand-primary font-bold px-2 py-0.5 rounded bg-brand-primary/10 uppercase tracking-widest shrink-0">
                            Required Target
                          </span>
                        </div>
                      )}

                      {!isAchieved ? (
                        <div className="pt-2 border-t border-gray-100 dark:border-dark-border/40">
                          {allocatingGoalId === goal._id ? (
                            <form 
                              onSubmit={(e) => handleAllocateSubmit(e, goal)} 
                              className="flex items-center space-x-2 text-xs"
                            >
                              <div className="relative flex-1">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">₹</span>
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  placeholder="Amount to save..."
                                  value={allocateAmount}
                                  onChange={(e) => setAllocateAmount(e.target.value)}
                                  className="w-full pl-6 pr-2.5 py-1.5 outline-none rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg font-bold text-gray-850 dark:text-white"
                                />
                              </div>
                              <button
                                type="submit"
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white bg-brand-success hover:bg-emerald-600 transition"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setAllocatingGoalId(null)}
                                className="p-1.5 rounded-lg border border-gray-200 dark:border-dark-border text-gray-400 hover:text-gray-500 transition"
                              >
                                <X size={12} />
                              </button>
                            </form>
                          ) : (
                            <button
                              onClick={() => {
                                setAllocatingGoalId(goal._id);
                                setAllocateAmount('');
                              }}
                              className="w-full flex items-center justify-center space-x-1 py-1.5 rounded-xl text-[10px] font-bold border border-brand-primary/20 bg-brand-primary/5 text-brand-primary hover:bg-brand-primary/10 transition"
                            >
                              <PiggyBank size={12} />
                              <span>Allocate Extra Savings</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-xs font-bold text-emerald-500">
                          🎉 Milestone Fully Achieved! Congratulations!
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add New Goal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-65 backdrop-blur-xs px-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-dark-border shadow-2xl glass-panel-heavy overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 flex items-center justify-between text-white bg-brand-primary">
              <h3 className="font-bold text-base flex items-center">
                <Target size={16} className="mr-1.5" />
                Establish Financial Milestone
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg hover:bg-white/10 text-white/80 transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddGoalSubmit} className="p-6 space-y-4 bg-white dark:bg-dark-card text-gray-800 dark:text-gray-100">
              {formError && (
                <div className="p-3 text-xs font-semibold text-brand-danger bg-brand-danger/10 border border-brand-danger/20 rounded-xl">
                  {formError}
                </div>
              )}

              {/* Goal Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Goal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dream House Downpayment, New Laptop"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:border-brand-primary text-xs font-semibold text-gray-850 dark:text-white"
                />
              </div>

              {/* Grid Target and Current Savings */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Target Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="0"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:border-brand-primary text-xs font-semibold text-gray-850 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Initial Savings (Opt)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={currentSavings}
                      onChange={(e) => setCurrentSavings(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:border-brand-primary text-xs font-semibold text-gray-850 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Target Date and Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Target Date *</label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-2 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:border-brand-primary text-xs font-semibold cursor-pointer text-gray-850 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-2 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:border-brand-primary text-xs font-semibold text-gray-850 dark:text-white"
                  >
                    <option value="savings">{t('goals.categories.Other')} (Savings)</option>
                    <option value="housing">{t('goals.categories.Home')}</option>
                    <option value="vehicle">{t('goals.categories.Car')}</option>
                    <option value="education">{t('goals.categories.Education')}</option>
                    <option value="travel">{t('goals.categories.Travel')}</option>
                    <option value="retirement">{t('goals.categories.Retirement')}</option>
                    <option value="wedding">{t('goals.categories.Wedding')}</option>
                    <option value="business">{t('goals.categories.Business')}</option>
                    <option value="electronics">{t('goals.categories.Electronics')}</option>
                    <option value="investment">{t('goals.categories.Investment')}</option>
                    <option value="charity">{t('goals.categories.Charity')}</option>
                    <option value="health">{t('goals.categories.Health')}</option>
                    <option value="emergency">{t('goals.categories.Emergency')}</option>
                    <option value="other">{t('goals.categories.Other')}</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Description / Memo</label>
                <input
                  type="text"
                  placeholder="e.g. Settle this target by December"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:border-brand-primary text-xs font-semibold text-gray-850 dark:text-white"
                />
              </div>

              {/* Form buttons */}
              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-grow py-2.5 border border-gray-200 dark:border-dark-border rounded-xl text-xs font-bold text-gray-400 transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-grow py-2.5 rounded-xl text-xs font-bold text-white bg-brand-primary hover:bg-violet-600 transition"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Goals;
