import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid
} from 'recharts';
import { 
  Brain, Sparkles, Activity,
  Award, Lock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export const Analytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [aiReport, setAiReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const COLORS = ['#10B981', '#2563EB', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#14B8A6', '#6366F1', '#F43F5E'];

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const txRes = await axios.get('/api/transactions');
      if (txRes.data.success) {
        setTransactions(txRes.data.data);
      }

      const aiRes = await axios.get(`/api/ai/report?month=${selectedMonth}&refresh=true`);
      if (aiRes.data.success) {
        setAiReport(aiRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedMonth, user?.role]);

  // Aggregate Category Expense Data for Pie Chart
  const getExpensePieData = () => {
    const expenseMap: { [key: string]: number } = {};
    let total = 0;

    transactions
      .filter(tx => tx.type === 'expense')
      .forEach(tx => {
        expenseMap[tx.category] = (expenseMap[tx.category] || 0) + tx.amount;
        total += tx.amount;
      });

    return Object.keys(expenseMap).map(cat => ({
      name: cat,
      value: expenseMap[cat],
      percentage: total > 0 ? parseFloat(((expenseMap[cat] / total) * 100).toFixed(1)) : 0
    }));
  };

  // Aggregate Daily Spending Data for Trend Line Chart
  const getDailyTrendData = () => {
    const dailyMap: { [key: string]: number } = {};
    
    // Group all expenses by date first
    transactions
      .filter(tx => tx.type === 'expense')
      .forEach(tx => {
        const dateStr = new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        dailyMap[dateStr] = (dailyMap[dateStr] || 0) + tx.amount;
      });

    // Build the last 30 days exactly in chronological order (oldest to newest left to right)
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      last30Days.push({
        date: dateStr,
        Spent: dailyMap[dateStr] || 0
      });
    }

    return last30Days;
  };

  const getComparisonData = () => {
    let incomeTotal = 0;
    let expenseTotal = 0;

    transactions.forEach(tx => {
      if (tx.type === 'income') incomeTotal += tx.amount;
      else expenseTotal += tx.amount;
    });

    return [
      { name: 'Income vs Expense', Income: incomeTotal, Expense: expenseTotal }
    ];
  };

  const pieData = getExpensePieData();
  const trendData = getDailyTrendData();
  const comparisonData = getComparisonData();

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
            Financial Analytics
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Deeper statistical breakdowns, monthly trends, and AI-predicted forecasts.
          </p>
        </div>

        {/* Month Picker */}
        <div className="relative">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-700 dark:text-[#f3f4f6] cursor-pointer outline-none focus:border-brand-primary"
          />
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* AI Reports Summary Row */}
          {aiReport ? (
            <div className="p-6 rounded-2xl glass-panel relative border border-brand-primary/10 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
              <div className="absolute top-0 right-0 w-36 h-36 bg-brand-primary rounded-bl-full pointer-events-none" />
              
              {/* Health status */}
              <div className="space-y-2 flex flex-col justify-center border-r border-gray-200 dark:border-dark-border/40 pr-6">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                    <Brain size={16} />
                  </div>
                  <h3 className="font-bold text-sm text-gray-800 dark:text-white flex items-center">
                    FinBot Diagnostic
                    <Sparkles size={11} className="ml-1 text-yellow-500" />
                  </h3>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-normal italic font-medium">
                  "{aiReport.summary}"
                </p>
              </div>

              {/* Predictive analytics */}
              <div className="space-y-1.5 flex flex-col justify-center border-r border-gray-200 dark:border-dark-border/40 pr-6">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center">
                  <Activity size={12} className="text-brand-info mr-1" />
                  Predictive Analysis Forecast
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] text-gray-400 block font-bold">NEXT MONTH SPENDING</span>
                    <span className="text-sm font-black text-brand-danger">₹{aiReport.predictiveAnalytics?.nextMonthExpenses?.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 block font-bold">EXPECTED SAVINGS</span>
                    <span className="text-sm font-black text-brand-success">₹{aiReport.predictiveAnalytics?.expectedSavings?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <p className="text-[9px] text-gray-400 font-semibold leading-tight pt-1">
                  {aiReport.predictiveAnalytics?.spendingForecast}
                </p>
              </div>

              {/* Action items */}
              <div className="space-y-1.5 flex flex-col justify-center">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center">
                  <Award size={12} className="text-brand-primary mr-1" />
                  AI Recommended Plan
                </h4>
                <ul className="text-[11px] space-y-1 text-gray-600 dark:text-gray-300 font-semibold">
                  {aiReport.recommendations?.slice(0, 3).map((r: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <span className="text-brand-primary mr-1.5">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {/* Core Graphs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Category Expenses Pie Chart */}
            <div className="p-6 rounded-2xl glass-panel space-y-4">
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-dark-border pb-3">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider flex items-center">
                  Category Expenses Distribution
                </h3>
              </div>

              <div className="h-64 w-full relative flex items-center justify-center">
                {pieData.length === 0 ? (
                  <p className="text-center text-xs text-gray-400">No expense records found to generate distribution chart.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0b0e26', 
                          borderColor: '#1f2444', 
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '11px'
                        }} 
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Daily Expense Trend Line Chart */}
            <div className="p-6 rounded-2xl glass-panel space-y-4">
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-dark-border pb-3">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider flex items-center">
                  Outflow Trend (Last 30 days)
                </h3>
              </div>

              <div className="h-64 w-full">
                {trendData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    No recent debit entries.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2444" vertical={false} opacity={0.15} />
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} />
                      <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0b0e26', 
                          borderColor: '#1f2444', 
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '11px'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Spent" 
                        stroke="#F43F5E" 
                        strokeWidth={3} 
                        dot={{ r: 3, fill: '#F43F5E' }} 
                        activeDot={{ r: 5 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* Cashflow Comparison Bar Chart */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">
              Cash Inflow vs Outflow Comparison
            </h3>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0b0e26', 
                      borderColor: '#1f2444', 
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px'
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Income" fill="#10B981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Expense" fill="#F43F5E" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown Table */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">
              Category Cost Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-dark-border text-gray-400 uppercase tracking-wider font-bold">
                    <th className="py-3 px-2">Category</th>
                    <th className="py-3 px-2 text-right">Total Spent</th>
                    <th className="py-3 px-2 text-right">Percentage Outflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                  {pieData.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-10 text-center text-gray-400">
                        No expense logs recorded.
                      </td>
                    </tr>
                  ) : (
                    pieData.map((item, idx) => (
                      <tr key={idx} className="text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100/10 dark:hover:bg-dark-card/25 transition">
                        <td className="py-3 px-2 flex items-center space-x-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span>{item.name}</span>
                        </td>
                        <td className="py-3 px-2 text-right text-gray-800 dark:text-white font-bold">
                          ₹{item.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-2 text-right text-gray-500 font-bold">
                          {item.percentage}%
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
    </motion.div>
  );
};
export default Analytics;
