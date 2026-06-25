import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bell, CheckCheck, Circle, Sparkles, X } from 'lucide-react';
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'budget_warning':
        return 'text-brand-warning bg-brand-warning/10';
      case 'high_expense':
        return 'text-brand-danger bg-brand-danger/10';
      default:
        return 'text-brand-primary bg-brand-primary/10';
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
      {isOpen && (
        <div className="absolute right-0 mt-3.5 w-80 sm:w-96 rounded-2xl border border-gray-200 dark:border-dark-border shadow-2xl glass-panel-heavy overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          
          {/* Header */}
          <div className="px-4 py-3.5 bg-brand-primary border-b border-gray-200 dark:border-dark-border/40 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Sparkles size={14} className="text-brand-primary animate-pulse" />
              <h3 className="font-bold text-xs sm:text-sm text-gray-800 dark:text-white uppercase tracking-wider">Alerts & Notifications</h3>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[10px] font-bold text-brand-primary hover:underline flex items-center space-x-1"
              >
                <CheckCheck size={12} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Body */}
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-dark-border/40 bg-white/70 dark:bg-dark-card/85">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 font-semibold">
                No notifications logged. You are all caught up!
              </div>
            ) : (
              notifications.map((item) => (
                <div 
                  key={item._id}
                  onClick={() => !item.isRead && handleMarkAsRead(item._id)}
                  className={`
                    p-4 flex items-start space-x-3 text-left transition cursor-pointer
                    ${item.isRead ? 'opacity-65 hover:bg-gray-50/20' : 'bg-brand-primary/5 hover:bg-brand-primary/10'}
                  `}
                >
                  {/* Indicator Dot */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${getTypeColor(item.type)}`}>
                    {item.isRead ? <Circle size={10} className="fill-current text-gray-400" /> : <Sparkles size={14} className="animate-spin-slow" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-800 dark:text-white truncate">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal mt-0.5">
                      {item.message}
                    </p>
                    <span className="text-[9px] text-gray-400 block mt-1">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
