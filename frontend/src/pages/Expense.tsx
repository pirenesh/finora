import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, TrendingDown, Calendar, Tag, FileText } from 'lucide-react';
import { TransactionModal } from '../components/TransactionModal';
import { useToast } from '../context/ToastContext';

export const Expense = () => {
  const { addToast } = useToast();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/expense');
      if (res.data.success) {
        setExpenses(res.data.data);
        
        // Sum total expense
        const total = res.data.data.reduce((sum: number, item: any) => sum + item.amount, 0);
        setTotalExpense(total);
      }
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddClick = () => {
    setSelectedExpense(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (item: any) => {
    setSelectedExpense(item);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;

    try {
      const res = await axios.delete(`/api/expense/${id}`);
      if (res.data.success) {
        addToast('Expense record deleted.', 'info');
        fetchExpenses();
      }
    } catch (err) {
      console.error('Failed to delete expense:', err);
      addToast('Delete failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-800 dark:text-white">
            Expense Management
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Log and review your category spending, billing, and outflows.
          </p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-danger hover:bg-rose-600 shadow-md shadow-rose-500/10 transition duration-200"
        >
          <Plus size={16} />
          <span>Add Expense Record</span>
        </button>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Stats Bar */}
          <div className="p-6 rounded-2xl glass-panel relative overflow-hidden flex items-center justify-between">
            <div className="z-10">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Accumulated Expenses</span>
              <h2 className="text-3xl font-black text-brand-danger mt-1">
                ₹{totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-danger/10 flex items-center justify-center text-brand-danger z-10">
              <TrendingDown size={24} />
            </div>
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-gradient-to-tr from-brand-danger/5 to-transparent rounded-tl-full pointer-events-none" />
          </div>

          {/* Expenses Table Grid */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">
              Debit Ledger
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-dark-border text-gray-400 uppercase tracking-wider font-bold">
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2">Category</th>
                    <th className="py-3 px-2">Description</th>
                    <th className="py-3 px-2 text-right">Amount</th>
                    <th className="py-3 px-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400 font-semibold">
                        No expense records found. Use "Add Expense Record" to log transactions.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((item) => (
                      <tr key={item._id} className="text-gray-700 dark:text-gray-300 hover:bg-gray-100/10 dark:hover:bg-dark-card/25 transition">
                        <td className="py-3.5 px-2 font-semibold flex items-center space-x-1.5">
                          <Calendar size={13} className="text-gray-400" />
                          <span>{new Date(item.date).toLocaleDateString('en-IN')}</span>
                        </td>
                        <td className="py-3.5 px-2">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-brand-danger/10 text-brand-danger flex items-center w-fit space-x-1">
                            <Tag size={10} />
                            <span>{item.category}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-gray-500 dark:text-gray-400 font-normal">
                          {item.description ? (
                            <span className="flex items-center space-x-1">
                              <FileText size={13} className="text-gray-400" />
                              <span className="truncate max-w-[200px]">{item.description}</span>
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-3.5 px-2 text-right font-black text-brand-danger">
                          - ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-2 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="p-1.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-600 dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition"
                              title="Edit"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item._id)}
                              className="p-1.5 rounded-lg border border-brand-danger/20 bg-brand-danger/5 text-brand-danger hover:bg-brand-danger/10 transition"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Transaction Entry Drawer */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type="expense"
        editItem={selectedExpense}
        onSuccess={fetchExpenses}
      />
    </div>
  );
};
export default Expense;
