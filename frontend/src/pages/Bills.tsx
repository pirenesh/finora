import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Droplets, Flame, Wifi, Smartphone, Tv, Car, Shield, 
  Home, GraduationCap, Plus, Search, Calendar, List, 
  CheckCircle, Clock, AlertCircle, Edit2, 
  Trash2, Bell, FileText, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';

// --- Types ---
export type BillCategory = 'Electricity' | 'Water' | 'Gas' | 'Broadband' | 'Mobile' | 'DTH' | 'FASTag' | 'OTT' | 'Insurance' | 'Rent' | 'Education';
export type BillStatus = 'Pending' | 'Paid' | 'Overdue';

export interface Bill {
  id: string;
  name: string;
  provider: string;
  amount: number;
  dueDate: string;
  status: BillStatus;
  category: BillCategory;
  notes?: string;
}

// --- Icons & Colors Mapping ---
const categoryMeta: Record<BillCategory, { icon: any, color: string }> = {
  Electricity: { icon: Zap, color: '#F59E0B' },
  Water: { icon: Droplets, color: '#3B82F6' },
  Gas: { icon: Flame, color: '#EF4444' },
  Broadband: { icon: Wifi, color: '#8B5CF6' },
  Mobile: { icon: Smartphone, color: '#10B981' },
  DTH: { icon: Tv, color: '#6366F1' },
  FASTag: { icon: Car, color: '#EC4899' },
  OTT: { icon: Tv, color: '#EAB308' },
  Insurance: { icon: Shield, color: '#14B8A6' },
  Rent: { icon: Home, color: '#F97316' },
  Education: { icon: GraduationCap, color: '#8B5CF6' }
};

const statusMeta: Record<BillStatus, { color: string, bg: string, icon: any }> = {
  Pending: { color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock },
  Paid: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle },
  Overdue: { color: 'text-rose-500', bg: 'bg-rose-500/10', icon: AlertCircle },
};

// --- Initial Mock Data ---
const getInitialBills = (): Bill[] => {
  const today = new Date();
  const d = (days: number) => {
    const date = new Date(today);
    date.setDate(today.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  return [
    { id: '1', name: 'Home Electricity', provider: 'State Electricity Board', amount: 2450, dueDate: d(-2), status: 'Overdue', category: 'Electricity', notes: 'Late fee applicable after 5 days' },
    { id: '2', name: 'Apartment Rent', provider: 'Landlord', amount: 25000, dueDate: d(5), status: 'Pending', category: 'Rent' },
    { id: '3', name: 'Netflix Premium', provider: 'Netflix', amount: 649, dueDate: d(12), status: 'Pending', category: 'OTT' },
    { id: '4', name: 'Jio Fiber Broadband', provider: 'Jio', amount: 999, dueDate: d(-10), status: 'Paid', category: 'Broadband' },
    { id: '5', name: 'Car Insurance', provider: 'HDFC Ergo', amount: 12500, dueDate: d(20), status: 'Pending', category: 'Insurance' },
    { id: '6', name: 'Water Bill', provider: 'Municipal Corp', amount: 450, dueDate: d(2), status: 'Pending', category: 'Water' },
    { id: '7', name: 'Airtel Postpaid', provider: 'Airtel', amount: 750, dueDate: d(-5), status: 'Paid', category: 'Mobile' },
  ];
};

export const Bills = () => {
  // --- State ---
  const [bills, setBills] = useState<Bill[]>(getInitialBills);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BillStatus | 'All'>('All');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  
  // Current Month for Calendar
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- Derived Data / Analytics ---
  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.provider.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [bills, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = bills.reduce((acc, b) => acc + b.amount, 0);
    const paid = bills.filter(b => b.status === 'Paid').reduce((acc, b) => acc + b.amount, 0);
    const pending = bills.filter(b => b.status === 'Pending').reduce((acc, b) => acc + b.amount, 0);
    const overdue = bills.filter(b => b.status === 'Overdue').reduce((acc, b) => acc + b.amount, 0);
    
    const catMap: Record<string, number> = {};
    bills.forEach(b => {
      catMap[b.category] = (catMap[b.category] || 0) + b.amount;
    });
    const pieData = Object.entries(catMap).map(([name, value]) => ({ name, value, color: categoryMeta[name as BillCategory].color }));

    return { total, paid, pending, overdue, pieData };
  }, [bills]);

  // --- Handlers ---
  const handleSaveBill = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newBill: Bill = {
      id: editingBill ? editingBill.id : Date.now().toString(),
      name: fd.get('name') as string,
      provider: fd.get('provider') as string,
      amount: Number(fd.get('amount')),
      dueDate: fd.get('dueDate') as string,
      status: fd.get('status') as BillStatus,
      category: fd.get('category') as BillCategory,
      notes: fd.get('notes') as string,
    };

    if (editingBill) {
      setBills(bills.map(b => b.id === newBill.id ? newBill : b));
    } else {
      setBills([...bills, newBill]);
    }
    setIsModalOpen(false);
    setEditingBill(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      setBills(bills.filter(b => b.id !== id));
    }
  };

  const handleMarkPaid = (id: string) => {
    setBills(bills.map(b => b.id === id ? { ...b, status: 'Paid' } : b));
  };

  // --- Calendar Helpers ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    return (
      <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white flex items-center"><Calendar size={20} className="mr-2 text-brand-primary" /> Calendar View</h3>
          <div className="flex items-center space-x-4">
            <button onClick={prevMonth} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition"><ChevronLeft size={16}/></button>
            <span className="font-bold text-white min-w-[120px] text-center">{monthName}</span>
            <button onClick={nextMonth} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition"><ChevronRight size={16}/></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-xs font-bold text-gray-500 uppercase">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="h-16 md:h-24"></div>;
            
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayBills = bills.filter(b => b.dueDate === dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <div key={day} className={`h-16 md:h-24 p-1.5 rounded-xl border ${isToday ? 'border-brand-primary bg-brand-primary/10' : 'border-white/5 bg-white/5'} flex flex-col hover:bg-white/10 transition overflow-y-auto hide-scrollbar`}>
                <span className={`text-xs font-bold mb-1 ${isToday ? 'text-brand-primary' : 'text-gray-400'}`}>{day}</span>
                <div className="space-y-1">
                  {dayBills.map(b => (
                    <div key={b.id} className={`text-[9px] px-1.5 py-0.5 rounded truncate font-semibold flex items-center ${b.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' : b.status === 'Overdue' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`} title={b.name}>
                      <span className="truncate w-full block">{b.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-panel p-5 rounded-2xl border border-white/5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="text-brand-primary" />
            Bills & Payments
          </h1>
          <p className="text-xs text-gray-400 mt-1">Manage and track your utility bills, subscriptions, and more.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => { setEditingBill(null); setIsModalOpen(true); }}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-primary hover:bg-emerald-500 shadow-md shadow-emerald-500/20 transition duration-200"
          >
            <Plus size={16} />
            <span>Add Bill</span>
          </button>
        </div>
      </div>

      {/* Analytics Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Bills (Monthly)', value: stats.total, color: 'text-white', border: 'border-white/10' },
          { label: 'Paid', value: stats.paid, color: 'text-emerald-500', border: 'border-emerald-500/20' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-500', border: 'border-amber-500/20' },
          { label: 'Overdue', value: stats.overdue, color: 'text-rose-500', border: 'border-rose-500/20' },
        ].map((stat, idx) => (
          <div key={idx} className={`p-5 rounded-2xl glass-panel border ${stat.border} relative overflow-hidden flex flex-col justify-center h-28`}>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</span>
            <h3 className={`text-2xl font-black mt-2 ${stat.color}`}>₹{stat.value.toLocaleString()}</h3>
          </div>
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Bills List */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Controls Bar */}
          <div className="glass-panel p-3 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input 
                type="text" 
                placeholder="Search bills..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-bg/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-primary transition"
              />
            </div>
            <div className="flex items-center space-x-2">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-dark-bg/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
              <div className="flex bg-dark-bg/50 rounded-lg p-1 border border-white/10">
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}><List size={16} /></button>
                <button onClick={() => setViewMode('calendar')} className={`p-1.5 rounded-md transition ${viewMode === 'calendar' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}><Calendar size={16} /></button>
              </div>
            </div>
          </div>

          {/* List or Calendar View */}
          {viewMode === 'list' ? (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredBills.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-12 text-center rounded-2xl border border-white/5">
                    <FileText size={48} className="mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400 font-medium">No bills found matching your criteria.</p>
                  </motion.div>
                ) : (
                  filteredBills.map((bill) => {
                    const CatIcon = categoryMeta[bill.category].icon;
                    const StatusIcon = statusMeta[bill.status].icon;
                    return (
                      <motion.div 
                        key={bill.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="glass-panel p-4 rounded-xl border border-white/5 hover:bg-white/5 transition group"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner shrink-0" style={{ backgroundColor: `${categoryMeta[bill.category].color}20`, borderColor: `${categoryMeta[bill.category].color}40`, color: categoryMeta[bill.category].color }}>
                              <CatIcon size={24} />
                            </div>
                            <div>
                              <h4 className="text-white font-bold">{bill.name}</h4>
                              <p className="text-xs text-gray-400">{bill.provider} • Due: {new Date(bill.dueDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-4">
                            <div className="text-left sm:text-right">
                              <div className="text-lg font-black text-white">₹{bill.amount.toLocaleString()}</div>
                              <div className={`text-[10px] font-bold inline-flex items-center px-1.5 py-0.5 rounded ${statusMeta[bill.status].bg} ${statusMeta[bill.status].color}`}>
                                <StatusIcon size={10} className="mr-1" />
                                {bill.status.toUpperCase()}
                              </div>
                            </div>
                            
                            {/* Actions Dropdown / Icons */}
                            <div className="flex items-center space-x-2">
                              {bill.status !== 'Paid' && (
                                <button onClick={() => handleMarkPaid(bill.id)} className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition" title="Mark as Paid">
                                  <CheckCircle size={16} />
                                </button>
                              )}
                              <button onClick={() => { setEditingBill(bill); setIsModalOpen(true); }} className="p-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition" title="Edit">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDelete(bill.id)} className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition" title="Delete">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </AnimatePresence>
            </div>
          ) : (
            renderCalendar()
          )}
        </div>

        {/* Right Column: Insights & Reminders */}
        <div className="space-y-6">
          
          {/* Reminders / Notifications */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center">
              <Bell size={16} className="mr-2 text-brand-primary" />
              Upcoming Reminders
            </h3>
            <div className="space-y-3">
              {bills.filter(b => b.status === 'Pending' || b.status === 'Overdue')
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .slice(0, 4)
                .map(bill => {
                  const daysDiff = Math.ceil((new Date(bill.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                  let urgencyClass = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
                  let urgencyText = `in ${daysDiff} days`;
                  
                  if (daysDiff < 0) {
                    urgencyClass = 'text-rose-500 bg-rose-500/10 border-rose-500/20 animate-pulse';
                    urgencyText = `${Math.abs(daysDiff)} days ago`;
                  } else if (daysDiff === 0) {
                    urgencyClass = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
                    urgencyText = 'Today';
                  }

                  return (
                    <div key={`rem-${bill.id}`} className={`p-3 rounded-xl border ${urgencyClass} flex justify-between items-center`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-current"></div>
                        <div>
                          <p className="text-xs font-bold">{bill.name}</p>
                          <p className="text-[10px] opacity-80">Due {urgencyText}</p>
                        </div>
                      </div>
                      <span className="text-sm font-black">₹{bill.amount}</span>
                    </div>
                  );
              })}
              {bills.filter(b => b.status !== 'Paid').length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">You're all caught up! No upcoming bills.</p>
              )}
            </div>
          </div>

          {/* Category Distribution Chart */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center">
              <FileText size={16} className="mr-2 text-brand-info" />
              Category Distribution
            </h3>
            <div className="h-48 w-full">
              {stats.pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {stats.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => `₹${value.toLocaleString()}`}
                      contentStyle={{ backgroundColor: '#0b0e26', borderColor: '#1f2444', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-500">No data available</div>
              )}
            </div>
            
            {/* Custom Legend */}
            <div className="flex flex-wrap gap-2 mt-2">
              {stats.pieData.map((d, i) => (
                <div key={i} className="flex items-center text-[9px] font-bold text-gray-400">
                  <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: d.color }}></div>
                  {d.name}
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>

      {/* Add / Edit Bill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#1a1c2e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden"
          >
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h2 className="text-lg font-bold text-white">{editingBill ? 'Edit Bill' : 'Add New Bill'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveBill} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Bill Name</label>
                  <input name="name" defaultValue={editingBill?.name} required className="w-full bg-dark-bg/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary transition" placeholder="e.g. Netflix Subscription" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Provider</label>
                  <input name="provider" defaultValue={editingBill?.provider} required className="w-full bg-dark-bg/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary transition" placeholder="e.g. Netflix Inc." />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Amount (₹)</label>
                  <input name="amount" type="number" min="0" step="1" defaultValue={editingBill?.amount} required className="w-full bg-dark-bg/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary transition" placeholder="e.g. 649" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Category</label>
                  <select name="category" defaultValue={editingBill?.category || 'Electricity'} className="w-full bg-dark-bg/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary transition">
                    {Object.keys(categoryMeta).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Status</label>
                  <select name="status" defaultValue={editingBill?.status || 'Pending'} className="w-full bg-dark-bg/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary transition">
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Due Date</label>
                  <input name="dueDate" type="date" defaultValue={editingBill?.dueDate || new Date().toISOString().split('T')[0]} required className="w-full bg-dark-bg/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary transition" />
                </div>
                
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Notes (Optional)</label>
                  <textarea name="notes" defaultValue={editingBill?.notes} rows={2} className="w-full bg-dark-bg/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary transition resize-none" placeholder="Add any notes here..."></textarea>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end space-x-3 border-t border-white/5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-white transition">Cancel</button>
                <button type="submit" className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-brand-primary hover:bg-emerald-500 shadow-md transition">{editingBill ? 'Save Changes' : 'Add Bill'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
};
