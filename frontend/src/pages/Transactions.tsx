import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Tag,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Transactions = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Available categories to select
  const allCategories = [
    'Salary', 'Freelancing', 'Business', 'Investments', 'Other Income',
    'Food', 'Transport', 'Education', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Travel', 'Others'
  ];

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (type) params.append('type', type);
      if (category) params.append('category', category);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);

      const res = await axios.get(`/api/transactions?${params.toString()}`);
      if (res.data.success) {
        setTransactions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [type, category, startDate, endDate, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  // Export to Excel / CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      addToast('No transactions available to export.', 'warning');
      return;
    }

    let csvContent = 'Date,Type,Category,Description,Amount (INR)\n';
    transactions.forEach(tx => {
      const dateStr = new Date(tx.date).toLocaleDateString('en-IN');
      const desc = tx.description ? tx.description.replace(/"/g, '""') : '';
      csvContent += `${dateStr},${tx.type.toUpperCase()},${tx.category},"${desc}",${tx.amount}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `finbot_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Excel/CSV spreadsheet downloaded.', 'success');
  };

  // Print PDF Statement (Pro Tier Feature)
  const handlePrintPDF = () => {
    if (user?.role !== 'pro') {
      addToast('PDF statement generation is reserved for Pro Premium subscribers.', 'warning');
      navigate('/pricing');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      addToast('Failed to open print window. Please allow popups.', 'error');
      return;
    }

    const tableRows = transactions.map(tx => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${new Date(tx.date).toLocaleDateString('en-IN')}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-transform: uppercase; font-weight: bold; color: ${tx.type === 'income' ? '#10b981' : '#ef4444'}">${tx.type}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${tx.category}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${tx.description || '-'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">₹${tx.amount.toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <title>Financial Transactions Statement - FinBot AI</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #333; margin: 40px; }
            h1 { color: #8b5cf6; margin-bottom: 5px; }
            p { color: #666; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f3f4f6; padding: 12px 10px; text-align: left; border-bottom: 2px solid #ddd; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>FinBot AI Transactions Ledger</h1>
          <p>Generated Statement: ${new Date().toLocaleDateString('en-IN')}</p>
          <hr/>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Title Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-800 dark:text-white">
            Transactions Ledger
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Query, sort, filter, and export your entire financial history.
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-[#f3f4f6] border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <Download size={14} />
            <span>Excel / CSV</span>
          </button>
          <button
            onClick={handlePrintPDF}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-primary hover:bg-indigo-600 shadow-md shadow-brand-primary/10 transition relative group"
          >
            {user?.role !== 'pro' ? (
              <>
                <Lock size={12} className="text-white/80 shrink-0" />
                <span>PDF Statement (Pro)</span>
              </>
            ) : (
              <>
                <Printer size={14} className="shrink-0" />
                <span>Print statement (PDF)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <div className="p-5 rounded-2xl glass-panel space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {/* Text Search */}
          <div className="relative col-span-1 sm:col-span-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={15} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description or category..."
              className="w-full pl-9 pr-3 py-2 text-xs font-bold outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card focus:border-brand-primary text-gray-800 dark:text-[#f3f4f6]"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card focus:border-brand-primary text-gray-800 dark:text-[#f3f4f6]"
            >
              <option value="">All Transactions</option>
              <option value="income">Inflow Only</option>
              <option value="expense">Outflow Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card focus:border-brand-primary text-gray-800 dark:text-[#f3f4f6]"
            >
              <option value="">All Categories</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Trigger button */}
          <div className="relative">
            <button
              type="submit"
              className="w-full py-2 bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-700 dark:text-[#f3f4f6] font-bold text-xs rounded-xl hover:bg-brand-primary hover:text-white transition duration-200 flex items-center justify-center space-x-1.5"
            >
              <Filter size={13} />
              <span>Apply filters</span>
            </button>
          </div>

          {/* Start Date */}
          <div className="flex flex-col space-y-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider pl-1">Start Date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card focus:border-brand-primary text-gray-800 dark:text-[#f3f4f6]"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col space-y-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider pl-1">End Date</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card focus:border-brand-primary text-gray-800 dark:text-[#f3f4f6]"
            />
          </div>

          {/* Sort By */}
          <div className="flex flex-col space-y-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider pl-1">Sort Attribute</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card focus:border-brand-primary text-gray-800 dark:text-[#f3f4f6]"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="category">Category</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex flex-col space-y-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider pl-1">Direction</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card focus:border-brand-primary text-gray-800 dark:text-[#f3f4f6]"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </form>
      </div>

      {/* Transactions Table Grid */}
      <div className="p-6 rounded-2xl glass-panel space-y-4">
        {loading ? (
          <div className="h-60 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-dark-border text-gray-400 uppercase tracking-wider font-bold">
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-2">Category</th>
                  <th className="py-3 px-2">Description</th>
                  <th className="py-3 px-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-gray-400 font-semibold">
                      No matching transactions found. Try adjusting your query parameters.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx._id} className="text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100/10 dark:hover:bg-dark-card/25 transition">
                      <td className="py-3.5 px-2 flex items-center space-x-1.5">
                        <Calendar size={13} className="text-gray-400" />
                        <span>{new Date(tx.date).toLocaleDateString('en-IN')}</span>
                      </td>
                      <td className="py-3.5 px-2">
                        {tx.type === 'income' ? (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-brand-success/10 text-brand-success flex items-center w-fit space-x-0.5">
                            <TrendingUp size={10} />
                            <span>Inflow</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-brand-danger/10 text-brand-danger flex items-center w-fit space-x-0.5">
                            <TrendingDown size={10} />
                            <span>Outflow</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-gray-800 dark:text-gray-200">
                        <span className="flex items-center space-x-1 font-bold">
                          <Tag size={12} className="text-gray-400" />
                          <span>{tx.category}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-gray-500 dark:text-gray-400 font-normal">
                        {tx.description || '-'}
                      </td>
                      <td className={`py-3.5 px-2 text-right font-black ${tx.type === 'income' ? 'text-brand-success' : 'text-brand-danger'}`}>
                        {tx.type === 'income' ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default Transactions;
