import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet,
  Brain,
  Activity,
  PlusCircle,
  Plus,
  RefreshCw,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { TransactionModal } from '../components/TransactionModal';
import { BudgetModal } from '../components/BudgetModal';
import { MarketTrends } from '../components/MarketTrends';
import { useTranslation } from 'react-i18next';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('income');
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  
  // Data states
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [budgets, setBudgets] = useState<any[]>([]);
  const [aiReport, setAiReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  // UPI Simulator States
  const [connections, setConnections] = useState<any[]>([]);
  const [upiId, setUpiId] = useState('amit@okaxis');
  const [upiAmount, setUpiAmount] = useState('');
  const [upiCategory, setUpiCategory] = useState('Food');
  const [upiDescription, setUpiDescription] = useState('UPI Simulator Transfer');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [upiSubmitting, setUpiSubmitting] = useState(false);
  const [hideBalances, setHideBalances] = useState(true);

  const activeMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const hideTicker = modalOpen || budgetModalOpen;

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch transactions
      const txRes = await axios.get('/api/transactions');
      if (txRes.data.success) {
        setTransactions(txRes.data.data.slice(0, 5)); // Last 5 transactions
        setSummary(txRes.data.summary);
      }

      // Fetch budgets
      const budgetRes = await axios.get(`/api/budgets?month=${activeMonth}`);
      if (budgetRes.data.success) {
        setBudgets(budgetRes.data.data);
      }

      // Fetch cached AI report
      const aiRes = await axios.get(`/api/ai/report?month=${activeMonth}`);
      if (aiRes.data.success) {
        setAiReport(aiRes.data.data);
      }

      // Fetch bank connections for UPI simulator
      const connRes = await axios.get('/api/plaid/connections');
      if (connRes.data.success) {
        setConnections(connRes.data.data);
        const firstConn = connRes.data.data[0];
        if (firstConn && firstConn.accounts && firstConn.accounts[0]) {
          setSelectedAccountId(firstConn.accounts[0].accountId);
        }
      }

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.role]);

  const handleRefreshAI = async () => {
    try {
      setAiLoading(true);
      const res = await axios.get(`/api/ai/report?month=${activeMonth}&refresh=true`);
      if (res.data.success) {
        setAiReport(res.data.data);
      }
    } catch (err) {
      console.error('AI refresh failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleUpiPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId || !upiAmount || parseFloat(upiAmount) <= 0 || !selectedAccountId) {
      alert('Please select a bank account, enter payee UPI ID and a valid payment amount.');
      return;
    }

    let selectedAcc: any = null;
    let institutionName = 'Linked Bank';

    for (const conn of connections) {
      const match = (conn.accounts || []).find((acc: any) => acc.accountId === selectedAccountId);
      if (match) {
        selectedAcc = match;
        institutionName = conn.institutionName;
        break;
      }
    }

    if (!selectedAcc) {
      alert('Selected account not found.');
      return;
    }

    try {
      setUpiSubmitting(true);
      const amountNum = parseFloat(upiAmount);
      
      const res = await axios.post('/api/expense', {
        amount: amountNum,
        category: upiCategory,
        date: new Date(),
        description: `[UPI Payment to ${upiId}] ${upiDescription || 'UPI Transfer'}`
      });

      if (res.data.success) {
        window.dispatchEvent(new CustomEvent('gpay-notification', {
          detail: {
            amount: amountNum,
            type: 'debit',
            name: upiId,
            bankName: `${institutionName} (•••• ${selectedAcc.mask})`
          }
        }));

        setUpiAmount('');
        setUpiDescription('UPI Simulator Transfer');
        await fetchDashboardData();
      }
    } catch (err: any) {
      console.error('UPI payment simulator failed:', err);
      alert(err.response?.data?.message || 'Payment simulation failed.');
    } finally {
      setUpiSubmitting(false);
    }
  };

  const openTransactionModal = (type: 'income' | 'expense') => {
    setModalType(type);
    setModalOpen(true);
  };

  const getChartData = () => {
    if (transactions.length === 0) {
      return [
        { name: 'Total Inflow', Amount: 0 },
        { name: 'Total Outflow', Amount: 0 }
      ];
    }

    return [
      { name: 'Total Inflow', Amount: summary.income, fill: '#10b981' },
      { name: 'Total Outflow', Amount: summary.expense, fill: '#ef4444' }
    ];
  };

  const getSavingsRate = () => {
    if (summary.income === 0) return 0;
    return parseFloat(((summary.balance / summary.income) * 100).toFixed(1));
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-800 dark:text-white flex items-center gap-2">
            {t('dashboard.title')}
            <button 
              onClick={() => setHideBalances(!hideBalances)} 
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
              title={hideBalances ? "Show Balances" : "Hide Balances"}
            >
              {hideBalances ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => openTransactionModal('income')}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-success hover:bg-emerald-600 shadow-md shadow-emerald-500/10 transition duration-200"
          >
            <Plus size={16} />
            <span>{t('dashboard.addIncome')}</span>
          </button>
          <button
            onClick={() => openTransactionModal('expense')}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-danger hover:bg-rose-600 shadow-md shadow-rose-500/10 transition duration-200"
          >
            <Plus size={16} />
            <span>{t('dashboard.addExpense')}</span>
          </button>
          <button
            onClick={() => setBudgetModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-primary hover:bg-indigo-600 shadow-md shadow-brand-primary/10 transition duration-200"
          >
            <PlusCircle size={16} />
            <span>{t('dashboard.configureBudget')}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Balance Card */}
            <div className="p-5 rounded-2xl glass-panel hover-glow relative overflow-hidden flex flex-col justify-between h-36">
              <div className="flex justify-between items-center z-10">
                <span className="text-xs font-semibold text-gray-400">{t('dashboard.netBalance')}</span>
                <div className="w-8 h-8 rounded-lg bg-brand-info/10 flex items-center justify-center text-brand-info">
                  <Wallet size={16} />
                </div>
              </div>
              <div className="mt-4 z-10">
                <h3 className={`text-2xl font-black ${summary.balance >= 0 ? 'text-gray-800 dark:text-white' : 'text-brand-danger'}`}>
                  ₹{hideBalances ? '••••••' : summary.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-[10px] text-gray-400 mt-1 font-semibold">
                  {t('dashboard.availableCapital')}
                </p>
              </div>
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-gradient-to-tr from-brand-info/10 to-transparent rounded-tl-full pointer-events-none" />
            </div>

            {/* Income Card */}
            <div className="p-5 rounded-2xl glass-panel hover-glow relative overflow-hidden flex flex-col justify-between h-36">
              <div className="flex justify-between items-center z-10">
                <span className="text-xs font-semibold text-gray-400">{t('dashboard.totalIncome')}</span>
                <div className="w-8 h-8 rounded-lg bg-brand-success/10 flex items-center justify-center text-brand-success">
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="mt-4 z-10">
                <h3 className="text-2xl font-black text-brand-success">
                  ₹{hideBalances ? '••••••' : summary.income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-[10px] text-emerald-500 font-bold mt-1">
                  {t('dashboard.activeInflows')}
                </p>
              </div>
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-gradient-to-tr from-brand-success/10 to-transparent rounded-tl-full pointer-events-none" />
            </div>

            {/* Expense Card */}
            <div className="p-5 rounded-2xl glass-panel hover-glow relative overflow-hidden flex flex-col justify-between h-36">
              <div className="flex justify-between items-center z-10">
                <span className="text-xs font-semibold text-gray-400">{t('dashboard.totalExpense')}</span>
                <div className="w-8 h-8 rounded-lg bg-brand-danger/10 flex items-center justify-center text-brand-danger">
                  <TrendingDown size={16} />
                </div>
              </div>
              <div className="mt-4 z-10">
                <h3 className="text-2xl font-black text-brand-danger">
                  ₹{hideBalances ? '••••••' : summary.expense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-[10px] text-rose-500 font-bold mt-1">
                  {t('dashboard.cashOutflows')}
                </p>
              </div>
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-gradient-to-tr from-brand-danger/10 to-transparent rounded-tl-full pointer-events-none" />
            </div>

            {/* Savings Rate Card */}
            <div className="p-5 rounded-2xl glass-panel hover-glow relative overflow-hidden flex flex-col justify-between h-36">
              <div className="flex justify-between items-center z-10">
                <span className="text-xs font-semibold text-gray-400">{t('dashboard.savingsRate')}</span>
                <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <DollarSign size={16} />
                </div>
              </div>
              <div className="mt-4 z-10">
                <h3 className="text-2xl font-black text-brand-primary">
                  {getSavingsRate()}%
                </h3>
                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-brand-primary h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, getSavingsRate()))}%` }}
                  />
                </div>
              </div>
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-brand-primary rounded-tl-full pointer-events-none" />
            </div>
          </div>

          {/* Market Trends Ticker */}
          <div className="-mx-4 sm:mx-0 sm:rounded-2xl shadow-2xl shadow-brand-primary/10 mb-6">
            <MarketTrends isHidden={hideTicker} />
          </div>

          {/* AI Insights Section with Subscription Gate */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* AI Insights Card */}
            <div className="lg:col-span-2 p-6 rounded-2xl glass-panel relative overflow-hidden flex flex-col justify-between border border-brand-primary/10 min-h-[220px]">
              <div className="absolute top-0 right-0 w-44 h-44 bg-brand-primary rounded-bl-full pointer-events-none" />
              
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-primary flex items-center justify-center text-white shadow-md shadow-brand-primary/10">
                    <Brain size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-800 dark:text-white flex items-center">
                      {t('dashboard.aiTitle')}
                      <Sparkles size={12} className="ml-1 text-yellow-500" />
                    </h3>
                    <p className="text-[10px] text-gray-400">{t('dashboard.aiPowered')}</p>
                  </div>
                </div>

                <button
                  onClick={handleRefreshAI}
                  disabled={aiLoading}
                  className="p-2 rounded-xl bg-gray-100 dark:bg-dark-card hover:bg-brand-primary/10 dark:hover:bg-brand-primary/15 text-gray-500 dark:text-gray-300 transition duration-200 flex items-center space-x-1"
                >
                  <RefreshCw size={13} className={aiLoading ? 'animate-spin text-brand-primary' : ''} />
                  <span className="text-[10px] font-bold">{t('dashboard.aiRefresh')}</span>
                </button>
              </div>

              {aiLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2">
                  <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] text-gray-400 font-bold animate-pulse">{t('dashboard.aiLoading')}</p>
                </div>
              ) : aiReport ? (
                <div className="mt-4 space-y-4 z-10">
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium italic">
                    "{aiReport.summary}"
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                    <div className="p-3.5 rounded-xl bg-white/45 dark:bg-dark-card/45 border border-gray-100 dark:border-dark-border/40">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                        <ShieldCheck size={12} className="text-brand-success mr-1 shrink-0" />
                        {t('dashboard.savingsSuggestions')}
                      </h4>
                      <ul className="text-xs space-y-1.5 text-gray-600 dark:text-gray-300 font-semibold">
                        {aiReport.savingsSuggestions?.slice(0, 2).map((s: string, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-brand-primary mr-1.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/45 dark:bg-dark-card/45 border border-gray-100 dark:border-dark-border/40">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                        <AlertTriangle size={12} className="text-brand-warning mr-1 shrink-0" />
                        {t('dashboard.spendingWarnings')}
                      </h4>
                      <ul className="text-xs space-y-1.5 text-gray-600 dark:text-gray-300 font-semibold">
                        {aiReport.spendingPatterns?.slice(0, 2).map((p: any, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-brand-warning mr-1.5">•</span>
                            <span className="truncate"><strong>{p.category}</strong>: {p.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-gray-400">
                  {t('dashboard.aiNoReport')}
                </div>
              )}
            </div>

            {/* Health Score Gauge */}
            <div className="p-6 rounded-2xl glass-panel flex flex-col justify-between items-center text-center min-h-[220px]">
              <div className="w-full flex items-center justify-between border-b border-gray-200 dark:border-dark-border pb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('dashboard.healthScore')}</span>
                <Activity size={16} className="text-brand-primary" />
              </div>

              {aiReport ? (
                <div className="my-3 flex flex-col items-center">
                  <div className="relative flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full border-4 border-gray-200 dark:border-gray-800 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-3xl font-black text-brand-primary">{aiReport.healthScore}</span>
                        <span className="text-xs text-gray-400 block font-semibold">/100</span>
                      </div>
                    </div>
                  </div>
                  <h4 className={`text-base font-black mt-3 uppercase tracking-wider 
                    ${aiReport.healthStatus === 'Excellent' || aiReport.healthStatus === 'Good' ? 'text-brand-success' : 'text-brand-warning'}
                  `}>
                    {aiReport.healthStatus} Status
                  </h4>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-gray-400">
                  Click analyze to evaluate health score.
                </div>
              )}
            </div>

          </div>

          {/* Charts & Ledgers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Charts */}
            <div className="lg:col-span-2 p-6 rounded-2xl glass-panel space-y-4">
              <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                {t('dashboard.cashFlowAnalytics')}
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData()} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d4af37" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                    <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0b0e26', 
                        borderColor: '#1f2444', 
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px'
                      }} 
                    />
                    <Bar dataKey="Amount" fill="url(#colorBarGradient)" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Budgets Tracker Widget */}
            <div className="bg-dark-card p-5 sm:p-6 rounded-3xl border border-dark-border shadow-xl w-full">
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-dark-border pb-3">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                  {t('dashboard.budgetsProgress')}
                </h3>
                <button 
                  onClick={() => setBudgetModalOpen(true)}
                  className="text-xs font-bold text-brand-primary hover:underline"
                >
                  Configure
                </button>
              </div>
              <div className="space-y-4 overflow-y-auto max-h-60 pr-1">
                {budgets.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-12">{t('dashboard.noActiveBudgets')}</p>
                ) : (
                  budgets.map(b => (
                    <div key={b._id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-gray-700 dark:text-gray-300">{b.category}</span>
                        <span className="text-gray-400">
                          ₹{b.spent} / <span className="font-bold text-gray-500 dark:text-gray-300">₹{b.limit}</span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${b.isOverspent ? 'bg-brand-danger' : 'bg-brand-primary'}`}
                          style={{ width: `${Math.min(100, b.percentage)}%` }}
                        />
                      </div>
                      {b.isOverspent && (
                        <p className="text-[9px] font-bold text-brand-danger flex items-center">
                          <AlertTriangle size={10} className="mr-0.5" />
                          Budget limit exceeded by ₹{b.spent - b.limit}!
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recent Transactions and UPI simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Transactions List */}
            <div className="lg:col-span-2 p-6 rounded-2xl glass-panel space-y-4">
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-dark-border pb-3">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                  {t('dashboard.recentTransactions')}
                </h3>
                <a 
                  href="/transactions" 
                  className="text-xs font-bold text-brand-primary hover:underline flex items-center"
                >
                  <span>{t('dashboard.viewAll')}</span>
                  <ChevronRight size={14} />
                </a>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-dark-border text-gray-400 uppercase tracking-wider font-bold">
                      <th className="py-3">{t('transactions.date')}</th>
                      <th className="py-3">{t('transactions.category')}</th>
                      <th className="py-3">{t('transactions.description')}</th>
                      <th className="py-3 text-right">{t('transactions.amount')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-400">
                          No transactions recorded. Use "Add Income" or "Add Expense" to begin.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx._id} className="text-gray-700 dark:text-gray-300 font-semibold">
                          <td className="py-3">{new Date(tx.date).toLocaleDateString('en-IN')}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase
                              ${tx.type === 'income' ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-danger/10 text-brand-danger'}
                            `}>
                              {tx.category}
                            </span>
                          </td>
                          <td className="py-3 font-normal text-gray-500 dark:text-gray-400">{tx.description || '-'}</td>
                          <td className={`py-3 text-right font-black ${tx.type === 'income' ? 'text-brand-success' : 'text-brand-danger'}`}>
                            {tx.type === 'income' ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* UPI Quick Pay Simulator Widget */}
            <div className="p-6 rounded-2xl glass-panel space-y-4 border border-violet-500/10 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-dark-border pb-3">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider flex items-center">
                    <Sparkles size={14} className="mr-1 text-yellow-500 animate-pulse" />
                    UPI Quick Pay
                  </h3>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                    Simulated GPay alerts
                  </span>
                </div>

                {/* Laser scan animation visual */}
                <div className="relative w-full h-32 rounded-xl bg-slate-950 border border-violet-500/20 overflow-hidden flex flex-col items-center justify-center mt-3">
                  <style>{`
                    @keyframes scanLine {
                      0% { top: 0%; }
                      50% { top: 100%; }
                      100% { top: 0%; }
                    }
                    .laser-line {
                      animation: scanLine 3s infinite linear;
                    }
                  `}</style>
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent laser-line shadow-[0_0_8px_#8b5cf6]" />
                  
                  <div className="relative w-16 h-16 border-2 border-violet-500/60 rounded-lg flex items-center justify-center p-1 bg-slate-950/80">
                    <div className="grid grid-cols-3 gap-1 opacity-70">
                      <div className="w-3.5 h-3.5 border-2 border-violet-400 bg-violet-400/20" />
                      <div className="w-3.5 h-3.5 bg-transparent" />
                      <div className="w-3.5 h-3.5 border-2 border-violet-400 bg-violet-400/20" />
                      <div className="w-3.5 h-3.5 bg-transparent" />
                      <div className="w-3.5 h-3.5 border-2 border-violet-400 bg-violet-400/20" />
                      <div className="w-3.5 h-3.5 bg-transparent" />
                      <div className="w-3.5 h-3.5 border-2 border-violet-400 bg-violet-400/20" />
                      <div className="w-3.5 h-3.5 bg-transparent" />
                      <div className="w-3.5 h-3.5 border-2 border-violet-400 bg-violet-400/20" />
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-violet-400 tracking-widest mt-2 uppercase animate-pulse">
                    Simulated UPI QR Scanner Active
                  </span>
                </div>

                <form onSubmit={handleUpiPay} className="space-y-3 mt-4 text-xs font-semibold text-gray-700 dark:text-gray-200">
                  {/* Select Bank Account */}
                  {connections.flatMap(c => c.accounts || []).length === 0 ? (
                    <div className="text-center p-3 rounded-xl border border-dashed border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-bg/25">
                      <p className="text-[10px] text-gray-400 font-semibold mb-2">No bank accounts linked to draw funds from.</p>
                      <button
                        type="button"
                        onClick={() => navigate('/bank-accounts')}
                        className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-[10px] font-bold shadow-md shadow-violet-500/10 hover:bg-violet-600 transition"
                      >
                        Connect a Bank Account
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-400 font-bold uppercase">Pay From Bank Account</label>
                        <select
                          value={selectedAccountId}
                          onChange={(e) => setSelectedAccountId(e.target.value)}
                          className="w-full px-3 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-xs font-bold text-gray-800 dark:text-white"
                        >
                          <option value="" disabled>Select account...</option>
                          {connections.flatMap(c => 
                            (c.accounts || []).map((acc: any) => ({
                              ...acc,
                              institutionName: c.institutionName
                            }))
                          ).map((acc) => (
                            <option key={acc.accountId} value={acc.accountId}>
                              {acc.institutionName} - {acc.name} (•••• {acc.mask}) [₹{acc.balance.toLocaleString('en-IN')}]
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Payee UPI ID */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-400 font-bold uppercase">Payee UPI ID</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. amit@okaxis"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="w-full px-3 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-xs font-bold text-gray-800 dark:text-white"
                        />
                      </div>

                      {/* Amount */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-400 font-bold uppercase">Amount (₹)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="e.g. 500"
                          value={upiAmount}
                          onChange={(e) => setUpiAmount(e.target.value)}
                          className="w-full px-3 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-xs font-bold text-gray-800 dark:text-white"
                        />
                      </div>

                      {/* Category */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-400 font-bold uppercase">Category</label>
                        <select
                          value={upiCategory}
                          onChange={(e) => setUpiCategory(e.target.value)}
                          className="w-full px-3 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-xs font-bold text-gray-800 dark:text-white"
                        >
                          <option value="Food">Food</option>
                          <option value="Shopping">Shopping</option>
                          <option value="Transport">Transport</option>
                          <option value="Bills">Bills</option>
                          <option value="Entertainment">Entertainment</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>

                      {/* Description */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-400 font-bold uppercase">Description</label>
                        <input
                          type="text"
                          placeholder="e.g. Lunch at office"
                          value={upiDescription}
                          onChange={(e) => setUpiDescription(e.target.value)}
                          className="w-full px-3 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-xs font-bold text-gray-800 dark:text-white"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={upiSubmitting}
                        className="w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 text-xs shadow-md shadow-violet-500/10 transition"
                      >
                        {upiSubmitting ? 'Processing Payment...' : 'Pay Instantly via UPI'}
                      </button>
                    </>
                  )}
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Interactive Modals */}
      <TransactionModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
        onSuccess={fetchDashboardData}
      />

      <BudgetModal
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        initialMonth={activeMonth}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};
export default Dashboard;
