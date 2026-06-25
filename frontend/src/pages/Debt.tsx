import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Coins, 
  Trash2, 
  History, 
  Calendar, 
  User, 
  Percent, 
  Save, 
  X, 
  CheckCircle,
  TrendingDown,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { CibilCalculator } from '../components/CibilCalculator';

const useModalNav = (isOpen: boolean) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open-nav-hidden');
    } else {
      document.body.classList.remove('modal-open-nav-hidden');
    }
    return () => document.body.classList.remove('modal-open-nav-hidden');
  }, [isOpen]);
};

export const Debt = () => {
  const { addToast } = useToast();
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBorrowed, setTotalBorrowed] = useState(0);
  const [totalLent, setTotalLent] = useState(0);
  const [payoffMethod, setPayoffMethod] = useState<'avalanche' | 'snowball'>('avalanche');

  // Expanded card tracking
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);

  // Modal control states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any | null>(null);

  useModalNav(isAddModalOpen || isRepayModalOpen);

  // New Debt Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'borrowed' | 'lent'>('borrowed');
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [interestPeriod, setInterestPeriod] = useState<'none' | 'monthly' | 'yearly'>('none');
  const [interestType, setInterestType] = useState<'simple' | 'compound'>('simple');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [dueFrequency, setDueFrequency] = useState<'once' | 'monthly' | 'yearly'>('once');
  const [description, setDescription] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [mirrorTx, setMirrorTx] = useState(true);
  const [formError, setFormError] = useState('');

  // Repayment Form State
  const [repayAmount, setRepayAmount] = useState('');
  const [repayDate, setRepayDate] = useState(new Date().toISOString().slice(0, 10));
  const [repayDescription, setRepayDescription] = useState('');
  const [repayMirrorTx, setRepayMirrorTx] = useState(true);
  const [repayError, setRepayError] = useState('');

  const fetchDebts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/debt');
      if (res.data.success) {
        setDebts(res.data.data);
        
        // Sum total borrowed and lent outstanding balances
        let borrowedSum = 0;
        let lentSum = 0;
        res.data.data.forEach((item: any) => {
          if (item.status === 'active') {
            if (item.type === 'borrowed') {
              borrowedSum += item.currentBalance;
            } else {
              lentSum += item.currentBalance;
            }
          }
        });
        setTotalBorrowed(borrowedSum);
        setTotalLent(lentSum);
      }
    } catch (err) {
      console.error('Failed to fetch debt list:', err);
      addToast('Failed to load debts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  const renderDueDate = (dueDate: string | Date | undefined) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let colorClass = 'text-gray-400';
    if (diffDays < 7 && diffDays >= 0) colorClass = 'text-red-500 font-bold';
    else if (diffDays < 30 && diffDays >= 0) colorClass = 'text-yellow-500 font-bold';
    else if (diffDays < 0) colorClass = 'text-red-600 font-black';

    return (
      <>
        <span className="text-gray-300 dark:text-gray-600">•</span>
        <span className={colorClass}>
          Due: {due.toLocaleDateString('en-IN')} ({diffDays < 0 ? `Overdue by ${Math.abs(diffDays)} days` : `${diffDays} days left`})
        </span>
      </>
    );
  };

  const handleOpenAddModal = () => {
    setName('');
    setType('borrowed');
    setAmount('');
    setInterestRate('');
    setInterestPeriod('none');
    setInterestType('simple');
    setStartDate(new Date().toISOString().slice(0, 10));
    setDueDate('');
    setDueFrequency('once');
    setDescription('');
    setAccountNumber('');
    setIfscCode('');
    setUpiId('');
    setPhoneNumber('');
    setMirrorTx(true);
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenRepayModal = (debt: any) => {
    setSelectedDebt(debt);
    setRepayAmount('');
    setRepayDate(new Date().toISOString().slice(0, 10));
    setRepayDescription('');
    setRepayMirrorTx(true);
    setRepayError('');
    setIsRepayModalOpen(true);
  };

  const handleAddDebtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !startDate) {
      setFormError('Please fill in Name, Amount, and Start Date.');
      return;
    }

    try {
      const payload = {
        lenderBorrowerName: name,
        type,
        amount: parseFloat(amount),
        interestRate: parseFloat(interestRate || '0'),
        interestPeriod,
        interestType,
        startDate,
        dueDate: dueDate || undefined,
        dueFrequency,
        description,
        accountNumber,
        ifscCode,
        upiId,
        phoneNumber,
        mirrorTransaction: mirrorTx
      };

      const res = await axios.post('/api/debt', payload);
      if (res.data.success) {
        addToast(`Debt record created successfully!`, 'success');
        fetchDebts();
        setIsAddModalOpen(false);
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to create debt record.');
    }
  };

  const handleRepaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayAmount || !repayDate) {
      setRepayError('Please enter amount and date.');
      return;
    }

    try {
      const payload = {
        amount: parseFloat(repayAmount),
        date: repayDate,
        description: repayDescription,
        mirrorTransaction: repayMirrorTx
      };

      const res = await axios.post(`/api/debt/${selectedDebt._id}/repay`, payload);
      if (res.data.success) {
        addToast(`Repayment logged successfully!`, 'success');
        fetchDebts();
        setIsRepayModalOpen(false);
      }
    } catch (err: any) {
      console.error(err);
      setRepayError(err.response?.data?.message || 'Failed to record repayment.');
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this debt record? This will delete all repayment history and related cash flows.')) {
      return;
    }

    try {
      const res = await axios.delete(`/api/debt/${id}`);
      if (res.data.success) {
        addToast('Debt record deleted.', 'info');
        fetchDebts();
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to delete debt record.', 'error');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedDebtId(expandedDebtId === id ? null : id);
  };

  // Overdue and Due soon calculations
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const overdueDebts = debts.filter(d => {
    if (d.status !== 'active' || d.currentBalance <= 0 || !d.dueDate) return false;
    const due = new Date(d.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < todayDate;
  });

  const dueSoonDebts = debts.filter(d => {
    if (d.status !== 'active' || d.currentBalance <= 0 || !d.dueDate) return false;
    const due = new Date(d.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - todayDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  const activeLiabilities = debts.filter(d => d.status === 'active' && d.type === 'borrowed' && d.currentBalance > 0);

  const sortedPayoffDebts = [...activeLiabilities].sort((a, b) => {
    if (payoffMethod === 'avalanche') {
      if (b.interestRate !== a.interestRate) {
        return b.interestRate - a.interestRate;
      }
      return b.currentBalance - a.currentBalance;
    } else {
      if (a.currentBalance !== b.currentBalance) {
        return a.currentBalance - b.currentBalance;
      }
      return b.interestRate - a.interestRate;
    }
  });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-800 dark:text-white">
            Debts & Loans Tracker
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Monitor money you owe (borrowed) and money owed to you (lent) with automatic interest accumulation.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-primary hover:bg-violet-600 shadow-md shadow-violet-500/10 transition duration-200"
        >
          <Plus size={16} />
          <span>Add Liability / Asset</span>
        </button>
      </div>

      <CibilCalculator />

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Smart Debt Alerts */}
          {(overdueDebts.length > 0 || dueSoonDebts.length > 0) && (
            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-700 dark:text-rose-400 space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm uppercase tracking-wider flex items-center">
                  ⚠️ Smart Debt Alerts
                </span>
              </div>
              <ul className="space-y-1 font-semibold leading-relaxed">
                {overdueDebts.map(d => (
                  <li key={d._id} className="flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>
                      <strong>OVERDUE:</strong> {d.type === 'borrowed' ? 'Pay' : 'Receive'} <strong>₹{d.currentBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong> {d.type === 'borrowed' ? 'to' : 'from'} <strong>{d.lenderBorrowerName}</strong> (Due: {new Date(d.dueDate).toLocaleDateString('en-IN')}).
                    </span>
                  </li>
                ))}
                {dueSoonDebts.map(d => (
                  <li key={d._id} className="flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>
                      <strong>DUE SOON:</strong> {d.type === 'borrowed' ? 'Pay' : 'Receive'} <strong>₹{d.currentBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong> {d.type === 'borrowed' ? 'to' : 'from'} <strong>{d.lenderBorrowerName}</strong> (Due: {new Date(d.dueDate).toLocaleDateString('en-IN')}).
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Borrowed Outstanding */}
            <div className="p-6 rounded-2xl glass-panel relative overflow-hidden flex items-center justify-between">
              <div className="z-10">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Borrowings (Liabilities)</span>
                <h2 className="text-3xl font-black text-brand-danger mt-1">
                  ₹{totalBorrowed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h2>
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand-danger/10 flex items-center justify-center text-brand-danger z-10">
                <TrendingDown size={24} />
              </div>
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-gradient-to-tr from-brand-danger/5 to-transparent rounded-tl-full pointer-events-none" />
            </div>

            {/* Total Lent Outstanding */}
            <div className="p-6 rounded-2xl glass-panel relative overflow-hidden flex items-center justify-between">
              <div className="z-10">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Receivables (Assets)</span>
                <h2 className="text-3xl font-black text-brand-success mt-1">
                  ₹{totalLent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h2>
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand-success/10 flex items-center justify-center text-brand-success z-10">
                <TrendingUp size={24} />
              </div>
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-gradient-to-tr from-brand-success/5 to-transparent rounded-tl-full pointer-events-none" />
            </div>
          </div>

          {/* Smart Payoff Advisor Card */}
          <div className="p-6 rounded-2xl glass-panel border border-violet-500/10 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-primary/5 to-transparent rounded-bl-full pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 dark:border-dark-border/40 pb-4">
              <div>
                <h3 className="font-extrabold text-sm text-gray-800 dark:text-white uppercase tracking-wider flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-primary mr-2 animate-pulse" />
                  FinBot Smart Debt Payoff Advisor
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Mathematically optimized debt elimination strategies.</p>
              </div>
              
              <div className="flex space-x-1 bg-gray-100 dark:bg-dark-bg/60 p-1 rounded-xl border border-gray-200 dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setPayoffMethod('avalanche')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all duration-200 ${
                    payoffMethod === 'avalanche'
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-500'
                  }`}
                >
                  Avalanche (Interest)
                </button>
                <button
                  type="button"
                  onClick={() => setPayoffMethod('snowball')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all duration-200 ${
                    payoffMethod === 'snowball'
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-500'
                  }`}
                >
                  Snowball (Balance)
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-violet-600/5 border border-brand-primary/10 text-xs text-gray-600 dark:text-gray-300 font-semibold leading-relaxed">
              {payoffMethod === 'avalanche' ? (
                <p>
                  <strong className="text-brand-primary uppercase tracking-wide text-[10px] block mb-1">Methodology: Debt Avalanche</strong>
                  Sorts liabilities by interest rates in descending order. Paying off high-interest debt first minimizes total interest paid and shortens the payoff period.
                </p>
              ) : (
                <p>
                  <strong className="text-brand-primary uppercase tracking-wide text-[10px] block mb-1">Methodology: Debt Snowball</strong>
                  Sorts liabilities by outstanding balance in ascending order. Eliminating smaller loans first provides quick psychological wins to build momentum.
                </p>
              )}
            </div>

            {activeLiabilities.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-4">
                No active borrowings found. You are currently debt-free!
              </p>
            ) : (
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Recommended Payoff Priority Plan:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sortedPayoffDebts.map((debt, index) => {
                    let monthlyLeak = 0;
                    if (debt.interestRate > 0 && debt.interestPeriod !== 'none') {
                      if (debt.interestPeriod === 'monthly') {
                        monthlyLeak = debt.currentBalance * (debt.interestRate / 100);
                      } else {
                        monthlyLeak = (debt.currentBalance * (debt.interestRate / 100)) / 12;
                      }
                    }

                    return (
                      <div 
                        key={debt._id} 
                        className="p-3 rounded-xl border border-gray-150 dark:border-dark-border/40 bg-white/45 dark:bg-dark-card/45 relative flex items-start space-x-3 hover:border-brand-primary/30 transition"
                      >
                        <div className="w-6 h-6 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-black shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-xs font-extrabold text-gray-800 dark:text-white truncate">
                            Settle: {debt.lenderBorrowerName}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 flex items-center justify-between">
                            <span>Outstanding: ₹{debt.currentBalance.toLocaleString()}</span>
                            <span className="text-amber-500 font-extrabold">Rate: {debt.interestRate}%</span>
                          </p>
                          {monthlyLeak > 0 && (
                            <p className="text-[9px] font-bold text-rose-500">
                              💸 Interest Leak: ~₹{monthlyLeak.toLocaleString('en-IN', { maximumFractionDigits: 1 })}/mo
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Active Debt Ledger */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">
              Outstanding Records
            </h3>

            {debts.filter(d => d.status === 'active').length === 0 ? (
              <div className="p-12 text-center rounded-2xl glass-panel text-gray-400 font-semibold">
                No active borrowings or lent loans found.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {debts.filter(d => d.status === 'active').map((debt) => {
                  const repaidPct = Math.min(100, Math.round((debt.totalRepaid / (debt.amount + debt.accruedInterest || 1)) * 100));
                  const isExpanded = expandedDebtId === debt._id;

                  return (
                    <div 
                      key={debt._id} 
                      className={`rounded-2xl border transition duration-200 glass-panel overflow-hidden ${
                        isExpanded ? 'border-brand-primary/45' : 'border-gray-200 dark:border-dark-border'
                      }`}
                    >
                      {/* Main Card Header info */}
                      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start space-x-3.5">
                          <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                            debt.type === 'borrowed' ? 'bg-brand-danger/10 text-brand-danger' : 'bg-brand-success/10 text-brand-success'
                          }`}>
                            <Coins size={20} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-bold text-sm text-gray-800 dark:text-white">
                                {debt.lenderBorrowerName}
                              </h4>
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${
                                debt.type === 'borrowed' ? 'bg-brand-danger/10 text-brand-danger' : 'bg-brand-success/10 text-brand-success'
                              }`}>
                                {debt.type === 'borrowed' ? 'Borrowed' : 'Lent'}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5 flex items-center flex-wrap gap-y-1 space-x-1">
                              <Calendar size={11} />
                              <span>Logged: {new Date(debt.startDate).toLocaleDateString('en-IN')}</span>
                              {renderDueDate(debt.dueDate)}
                            </p>
                            {debt.description && (
                              <p className="text-[11px] text-gray-500 mt-1 italic">{debt.description}</p>
                            )}
                          </div>
                        </div>

                        {/* Financial Summaries & UPI */}
                        <div className="flex flex-wrap items-center gap-4 text-right md:justify-end mt-4 md:mt-0">
                          {debt.type === 'borrowed' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!debt.upiId) {
                                  alert('No UPI ID added for this lender');
                                  return;
                                }
                                window.open(`upi://pay?pa=${debt.upiId}&pn=${encodeURIComponent(debt.lenderBorrowerName)}&am=${debt.currentBalance}&cu=INR&tn=Loan+EMI+Payment`, '_blank');
                              }}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white bg-green-600 hover:bg-green-700 transition shadow-lg shadow-green-600/20 mr-2 flex items-center"
                            >
                              💸 Pay EMI
                            </button>
                          )}
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Principal</span>
                            <p className="text-xs font-bold text-gray-600 dark:text-gray-300">
                              ₹{debt.amount.toLocaleString()}
                            </p>
                          </div>
                          {debt.interestRate > 0 && (
                            <div>
                              <span className="text-[10px] text-gray-400 uppercase font-semibold">Accrued Interest ({debt.interestRate}%)</span>
                              <p className="text-xs font-bold text-amber-500">
                                +₹{debt.accruedInterest.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </p>
                            </div>
                          )}
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Repaid</span>
                            <p className="text-xs font-bold text-gray-500">
                              -₹{debt.totalRepaid.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Balance Due</span>
                            <p className={`text-sm font-black ${
                              debt.type === 'borrowed' ? 'text-brand-danger' : 'text-brand-success'
                            }`}>
                              ₹{debt.currentBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 shrink-0 md:self-center">
                          <button
                            onClick={() => handleOpenRepayModal(debt)}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white bg-brand-primary hover:bg-violet-600 transition"
                          >
                            Repay
                          </button>
                          <button
                            onClick={() => toggleExpand(debt._id)}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-dark-border text-gray-500 hover:text-gray-800 dark:hover:text-white transition"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <button
                            onClick={() => handleDeleteDebt(debt._id)}
                            className="p-1.5 rounded-lg text-brand-danger hover:bg-brand-danger/10 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Repayment Progress Slider */}
                      <div className="px-5 pb-3">
                        <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${repaidPct}%` }}
                            className={`h-full transition-all duration-300 ${
                              debt.type === 'borrowed' ? 'bg-brand-danger' : 'bg-brand-success'
                            }`}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold text-gray-400 mt-1">
                          <span>{repaidPct}% repaid</span>
                          <span>Total: ₹{(debt.amount + debt.accruedInterest).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {/* Expanded Repayment History Details */}
                      {isExpanded && (
                        <div className="px-5 py-4 border-t border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-card/10 space-y-3">
                          <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <span className="flex items-center space-x-1">
                              <History size={12} />
                              <span>Repayment Ledger</span>
                            </span>
                            <span>{debt.repayments.length} log(s)</span>
                          </div>
                          
                          {debt.repayments.length === 0 ? (
                            <p className="text-xs text-gray-400 italic text-center py-2">
                              No payments recorded yet. Click "Repay" to register transactions.
                            </p>
                          ) : (
                            <div className="divide-y divide-gray-100 dark:divide-dark-border text-xs">
                              {debt.repayments.map((repay: any) => (
                                <div key={repay._id} className="py-2.5 flex items-center justify-between">
                                  <div className="space-y-0.5">
                                    <p className="font-semibold text-gray-700 dark:text-gray-200 flex items-center space-x-1">
                                      <Calendar size={10} className="text-gray-400" />
                                      <span>{new Date(repay.date).toLocaleDateString('en-IN')}</span>
                                    </p>
                                    {repay.description && (
                                      <p className="text-[10px] text-gray-400 flex items-center space-x-1">
                                        <FileText size={10} />
                                        <span>{repay.description}</span>
                                      </p>
                                    )}
                                  </div>
                                  <span className={`font-black ${
                                    debt.type === 'borrowed' ? 'text-brand-danger' : 'text-brand-success'
                                  }`}>
                                    - ₹{repay.amount.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Interest detail breakdowns */}
                          {debt.interestRate > 0 && (
                            <div className="pt-2 border-t border-gray-200 dark:border-dark-border flex flex-col md:flex-row md:justify-between text-[10px] font-semibold text-gray-400">
                              <span>Interest Period: {debt.interestPeriod}</span>
                              <span>Interest Calculation: {debt.interestType}</span>
                              <span>Rate: {debt.interestRate}% per {debt.interestPeriod === 'monthly' ? 'month' : 'year'}</span>
                            </div>
                          )}

                          {/* Creditor / Banking Details */}
                          {(debt.accountNumber || debt.ifscCode || debt.upiId || debt.phoneNumber) && (
                            <div className="pt-3 mt-2 border-t border-gray-200 dark:border-dark-border">
                              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Creditor Details</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                {debt.accountNumber && (
                                  <div>
                                    <span className="text-[9px] text-gray-400 block uppercase">Account No.</span>
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{debt.accountNumber}</span>
                                  </div>
                                )}
                                {debt.ifscCode && (
                                  <div>
                                    <span className="text-[9px] text-gray-400 block uppercase">IFSC Code</span>
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{debt.ifscCode}</span>
                                  </div>
                                )}
                                {debt.upiId && (
                                  <div>
                                    <span className="text-[9px] text-gray-400 block uppercase">UPI ID</span>
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{debt.upiId}</span>
                                  </div>
                                )}
                                {debt.phoneNumber && (
                                  <div>
                                    <span className="text-[9px] text-gray-400 block uppercase">Phone No.</span>
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{debt.phoneNumber}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Paid / Settled Debt Ledger */}
          <div className="space-y-4 pt-6">
            <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Settled / Settled Ledger
            </h3>

            {debts.filter(d => d.status === 'paid').length === 0 ? (
              <div className="p-8 text-center border border-dashed border-gray-200 dark:border-dark-border rounded-2xl text-gray-400 text-xs italic">
                No paid-off debt logs.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 opacity-65 hover:opacity-90 transition">
                {debts.filter(d => d.status === 'paid').map((debt) => (
                  <div key={debt._id} className="p-4 rounded-xl border border-gray-200 dark:border-dark-border glass-panel flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <CheckCircle className="text-brand-success shrink-0" size={16} />
                      <div>
                        <h4 className="font-semibold text-gray-700 dark:text-gray-200">{debt.lenderBorrowerName}</h4>
                        <p className="text-[10px] text-gray-400">
                          {debt.type === 'borrowed' ? 'Borrowed loan' : 'Lent loan'} settled • {new Date(debt.startDate).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-gray-500">
                        ₹{debt.amount.toLocaleString()} Principal
                      </p>
                      <p className="text-[10px] text-brand-success font-semibold">
                        Fully Settled
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Log New Debt Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-[20px] border border-white/10 shadow-[0_0_40px_rgba(212,175,55,0.15)] bg-white dark:bg-[#0b0f19] overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            
            {/* Premium Gradient Header */}
            <div className="px-6 py-5 flex items-center justify-between text-white bg-[#d4af37] text-[#0a0800] shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
              <h3 className="font-bold text-lg flex items-center relative z-10 tracking-wide">
                <Coins size={18} className="mr-2" />
                Log New Debt
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="p-1.5 rounded-full hover:bg-white/20 text-white/90 transition-all duration-200 relative z-10 backdrop-blur-sm"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddDebtSubmit} className="p-6 space-y-5 text-gray-800 dark:text-gray-100 overflow-y-auto custom-scrollbar">
              {formError && (
                <div className="p-3 text-xs font-semibold text-brand-danger bg-brand-danger/10 border border-brand-danger/20 rounded-xl flex items-center gap-2">
                  <X size={14} /> {formError}
                </div>
              )}

              {/* Animated Pill Toggle */}
              <div className="relative flex p-1 bg-gray-100 dark:bg-gray-800/50 rounded-full shadow-inner">
                <div
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-gray-700 rounded-full shadow-sm transition-transform duration-300 ease-spring border border-gray-200/50 dark:border-gray-600/50 ${
                    type === 'borrowed' ? 'translate-x-0' : 'translate-x-full'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setType('borrowed')}
                  className={`relative z-10 w-1/2 py-2.5 text-xs font-bold transition-colors duration-300 flex items-center justify-center gap-1.5 ${
                    type === 'borrowed' ? 'text-brand-danger drop-shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  <TrendingDown size={14} /> I Borrowed
                </button>
                <button
                  type="button"
                  onClick={() => setType('lent')}
                  className={`relative z-10 w-1/2 py-2.5 text-xs font-bold transition-colors duration-300 flex items-center justify-center gap-1.5 ${
                    type === 'lent' ? 'text-brand-success drop-shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  <TrendingUp size={14} /> I Lent
                </button>
              </div>

              {/* Floating Label Input: Name */}
              <div className="relative group">
                <input
                  type="text"
                  id="debtName"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="peer w-full px-4 pt-6 pb-2 outline-none rounded-xl border border-gray-200 dark:border-gray-700/50 bg-gray-50/50 dark:bg-[#060713]/50 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50 text-sm font-semibold placeholder-transparent transition-all"
                  placeholder="Lender Name"
                />
                <label htmlFor="debtName" className="absolute left-4 top-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-xs peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#d4af37]">
                  Lender or Borrower Name *
                </label>
              </div>

              {/* Floating Label Input: Amount */}
              <div className="relative group">
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold transition-colors ${amount ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400'}`}>₹</span>
                <input
                  type="number"
                  id="debtAmount"
                  required
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="peer w-full pl-8 pr-4 pt-6 pb-2 outline-none rounded-xl border border-gray-200 dark:border-gray-700/50 bg-gray-50/50 dark:bg-[#060713]/50 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50 text-sm font-semibold placeholder-transparent transition-all"
                  placeholder="0.00"
                />
                <label htmlFor="debtAmount" className="absolute left-8 top-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-xs peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#d4af37]">
                  Principal Amount *
                </label>
              </div>

              {/* Interest Section */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase">Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="0"
                    className="w-full px-2 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:border-brand-primary text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase">Cycle</label>
                  <select
                    value={interestPeriod}
                    onChange={(e: any) => setInterestPeriod(e.target.value)}
                    className="w-full px-2 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:border-brand-primary text-xs font-semibold"
                  >
                    <option value="none">None</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase">Type</label>
                  <select
                    value={interestType}
                    disabled={interestPeriod === 'none'}
                    onChange={(e: any) => setInterestType(e.target.value)}
                    className="w-full px-2 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:border-brand-primary text-xs font-semibold"
                  >
                    <option value="simple">Simple</option>
                    <option value="compound">Compound</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="relative group">
                  <input
                    type="date"
                    id="startDate"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="peer w-full px-4 pt-6 pb-2 outline-none rounded-xl border border-gray-200 dark:border-gray-700/50 bg-gray-50/50 dark:bg-[#060713]/50 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50 text-sm font-semibold transition-all cursor-pointer"
                  />
                  <label htmlFor="startDate" className="absolute left-4 top-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider transition-all peer-focus:text-[#d4af37]">
                    Start Date *
                  </label>
                </div>
                <div className="relative group">
                  <input
                    type="date"
                    id="dueDate"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="peer w-full px-4 pt-6 pb-2 outline-none rounded-xl border border-gray-200 dark:border-gray-700/50 bg-gray-50/50 dark:bg-[#060713]/50 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50 text-sm font-semibold transition-all cursor-pointer"
                  />
                  <label htmlFor="dueDate" className="absolute left-4 top-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider transition-all peer-focus:text-[#d4af37]">
                    Next Due Date
                  </label>
                </div>
              </div>

              {/* Due Frequency */}
              <div className="space-y-1 mb-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Payment Frequency</label>
                <select
                  value={dueFrequency}
                  onChange={(e: any) => setDueFrequency(e.target.value)}
                  className="w-full px-2 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:border-brand-primary text-xs font-semibold"
                >
                  <option value="once">One-Time / Custom</option>
                  <option value="monthly">Every Month</option>
                  <option value="yearly">Every Year</option>
                </select>
              </div>

              {/* Description */}
              <div className="relative group mb-4 mt-2">
                <input
                  type="text"
                  id="debtDesc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="peer w-full px-4 pt-6 pb-2 outline-none rounded-xl border border-gray-200 dark:border-gray-700/50 bg-gray-50/50 dark:bg-[#060713]/50 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50 text-sm font-semibold placeholder-transparent transition-all"
                  placeholder="Memo"
                />
                <label htmlFor="debtDesc" className="absolute left-4 top-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-xs peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#d4af37]">
                  Memo
                </label>
              </div>

              {/* Creditor Details */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">💳 Payment Details (Optional)</h5>
                
                <div className="grid grid-cols-1 gap-3 mb-3">
                  <div className="relative group">
                    <input
                      type="text"
                      id="debtUpi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="peer w-full px-4 pt-6 pb-2 outline-none rounded-xl border border-gray-200 dark:border-gray-700/50 bg-gray-50/50 dark:bg-[#060713]/50 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50 text-sm font-semibold placeholder-transparent transition-all"
                      placeholder="Lender's UPI ID"
                    />
                    <label htmlFor="debtUpi" className="absolute left-4 top-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-xs peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#d4af37]">
                      Lender's UPI ID
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div className="relative group">
                    <input
                      type="text"
                      id="debtAcc"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="peer w-full px-4 pt-6 pb-2 outline-none rounded-xl border border-gray-200 dark:border-gray-700/50 bg-gray-50/50 dark:bg-[#060713]/50 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50 text-sm font-semibold placeholder-transparent transition-all"
                      placeholder="Account Number"
                    />
                    <label htmlFor="debtAcc" className="absolute left-4 top-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-xs peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#d4af37]">
                      Bank Account Number
                    </label>
                  </div>
                  <div className="relative group">
                    <input
                      type="text"
                      id="debtIfsc"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                      className="peer w-full px-4 pt-6 pb-2 outline-none rounded-xl border border-gray-200 dark:border-gray-700/50 bg-gray-50/50 dark:bg-[#060713]/50 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50 text-sm font-semibold placeholder-transparent transition-all uppercase"
                      placeholder="IFSC"
                    />
                    <label htmlFor="debtIfsc" className="absolute left-4 top-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-xs peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-[#d4af37]">
                      IFSC Code
                    </label>
                  </div>
                </div>
              </div>

              {/* Mirror Transaction Toggle */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-dark-bg/40 border border-gray-150 dark:border-dark-border/40">
                <div>
                  <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300">Mirror to Transactions</h5>
                  <p className="text-[9px] text-gray-400">Post this principal in your main wealth cash logs</p>
                </div>
                <input
                  type="checkbox"
                  checked={mirrorTx}
                  onChange={(e) => setMirrorTx(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-primary border-gray-300 focus:ring-brand-primary"
                />
              </div>

              {/* Buttons */}
              <div className="pt-4 flex space-x-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl text-xs font-bold text-white bg-[#d4af37] text-[#0a0800] hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#d4af37]/30 transition-all duration-200"
                >
                  Save Debt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Repayment Modal */}
      {isRepayModalOpen && selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-xs px-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-dark-border shadow-2xl glass-panel-heavy overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 flex items-center justify-between text-white bg-gradient-to-r from-brand-primary to-brand-info shrink-0">
              <h3 className="font-bold text-base flex items-center">
                <Save size={16} className="mr-1.5" />
                Record Loan Repayment
              </h3>
              <button onClick={() => setIsRepayModalOpen(false)} className="p-1 rounded-lg hover:bg-white/10 text-white/80 transition">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleRepaySubmit} className="p-6 space-y-4 bg-white dark:bg-dark-card text-gray-800 dark:text-gray-100 overflow-y-auto">
              {repayError && (
                <div className="p-3 text-xs font-semibold text-brand-danger bg-brand-danger/10 border border-brand-danger/20 rounded-xl">
                  {repayError}
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-dark-bg/60 border border-gray-100 dark:border-dark-border/40 text-xs space-y-1">
                <p className="font-bold text-gray-700 dark:text-gray-200">
                  Loan Ref: {selectedDebt.lenderBorrowerName} ({selectedDebt.type})
                </p>
                <p className="text-gray-500">
                  Principal: ₹{selectedDebt.amount.toLocaleString()} • Current Outstanding: ₹{selectedDebt.currentBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              </div>

              {/* Repay Amount */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Repayment Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:border-brand-primary text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Repayment Date *</label>
                <input
                  type="date"
                  required
                  value={repayDate}
                  onChange={(e) => setRepayDate(e.target.value)}
                  className="w-full px-2 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:border-brand-primary text-xs font-semibold cursor-pointer"
                />
              </div>

              {/* Memo */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Memo</label>
                <input
                  type="text"
                  value={repayDescription}
                  onChange={(e) => setRepayDescription(e.target.value)}
                  placeholder="e.g. Paid first quarterly installment"
                  className="w-full px-3 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:border-brand-primary text-xs font-semibold"
                />
              </div>

              {/* Repay Mirror Transaction Toggle */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-dark-bg/40 border border-gray-150 dark:border-dark-border/40">
                <div>
                  <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300">Mirror to Transactions</h5>
                  <p className="text-[9px] text-gray-400">Post this repayment in your main cash flow logs</p>
                </div>
                <input
                  type="checkbox"
                  checked={repayMirrorTx}
                  onChange={(e) => setRepayMirrorTx(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-primary border-gray-300 focus:ring-brand-primary"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsRepayModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-dark-border rounded-xl text-xs font-bold text-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-primary hover:bg-violet-600 transition"
                >
                  Save Repayment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Debt;
