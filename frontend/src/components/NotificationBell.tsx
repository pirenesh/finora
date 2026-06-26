import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bell, CheckCheck, Circle, Sparkles, X, AlertTriangle, TrendingDown, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'budget_warning' | 'high_expense' | 'system_alert';
  isRead: boolean;
  createdAt: string;
}

export const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    let interval: any;
    if (user) {
      fetchNotifications();
      // Poll notifications every 30 seconds for simulated real-time updates
      interval = setInterval(fetchNotifications, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await axios.put(`/api/notifications/${id}`);
      if (res.data.success) {
        setNotifications(prev => 
          prev.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await axios.put('/api/notifications/read-all');
      if (res.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'budget_warning':
        return <AlertTriangle size={14} className="text-brand-warning animate-pulse" />;
      case 'high_expense':
        return <TrendingDown size={14} className="text-brand-danger animate-pulse" />;
      default:
        return <Info size={14} className="text-brand-primary animate-pulse" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'budget_warning':
        return 'text-brand-warning bg-brand-warning/10 border-brand-warning/20';
      case 'high_expense':
        return 'text-brand-danger bg-brand-danger/10 border-brand-danger/20';
      default:
        return 'text-brand-primary bg-brand-primary/10 border-brand-primary/20';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 relative shadow-sm"
        title="Notifications Center"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-danger text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3.5 w-80 sm:w-96 rounded-3xl border border-white/10 shadow-2xl glass-panel overflow-hidden z-50"
          >
            
            {/* Premium Gradient Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 border-b border-white/10 flex items-center justify-between shadow-md relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
              <div className="flex items-center space-x-1.5 text-white relative z-10">
                <Sparkles size={16} className="animate-pulse" />
                <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider">Alerts & Notifications</h3>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] font-bold text-white bg-white/20 hover:bg-white/30 px-2.5 py-1.5 rounded-lg backdrop-blur-md transition flex items-center space-x-1 relative z-10 shadow-sm"
                >
                  <CheckCheck size={12} />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* List Body */}
            <div className="max-h-80 overflow-y-auto divide-y divide-white/5 bg-dark-bg/80 backdrop-blur-xl custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 font-semibold">
                No notifications logged. You are all caught up!
              </div>
            ) : (
              notifications.map((item) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={item._id}
                  onClick={() => !item.isRead && handleMarkAsRead(item._id)}
                  className={`
                    p-4 flex items-start space-x-3 text-left transition duration-300 cursor-pointer relative overflow-hidden
                    ${item.isRead ? 'opacity-60 hover:bg-white/5' : 'bg-brand-primary/5 hover:bg-brand-primary/10 border-l-4 border-l-brand-primary'}
                  `}
                >
                  {/* Indicator Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-inner ${getTypeColor(item.type)}`}>
                    {item.isRead ? <CheckCheck size={14} className="text-gray-400" /> : getTypeIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0 z-10">
                    <h4 className={`text-xs font-bold truncate ${item.isRead ? 'text-gray-400' : 'text-white'}`}>
                      {item.title}
                    </h4>
                    <p className={`text-[11px] leading-relaxed mt-1 ${item.isRead ? 'text-gray-500' : 'text-gray-300'}`}>
                      {item.message}
                    </p>
                    <span className="text-[9px] text-gray-500 font-semibold block mt-1.5 uppercase tracking-wider">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};
