import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  History, 
  BarChart3, 
  User, 
  LogOut,
  Menu,
  X,
  Coins,
  CreditCard,
  Target,
  Shield
} from 'lucide-react';

export const Sidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: t('nav.dashboard'), path: '/', icon: LayoutDashboard },
    { name: t('nav.income'), path: '/income', icon: TrendingUp },
    { name: t('nav.expense'), path: '/expense', icon: TrendingDown },
    { name: t('nav.budgets'), path: '/budgets', icon: Wallet },
    { name: t('nav.transactions'), path: '/transactions', icon: History },
    { name: t('nav.debt'), path: '/debt', icon: Coins },
    { name: t('nav.bankLink'), path: '/bank-accounts', icon: CreditCard },
    { name: t('nav.goals'), path: '/goals', icon: Target },
    { name: t('nav.analytics'), path: '/analytics', icon: BarChart3 },
    { name: t('nav.profile'), path: '/profile', icon: User },
    { name: 'Security', path: '/security', icon: Shield },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-700 dark:text-[#f3f4f6] shadow-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div 
          onClick={toggleSidebar}
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-xs"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen z-40 w-64 flex flex-col
        border-r border-dark-border bg-[#050400]
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-dark-border bg-[#0a0800]">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20 border border-brand-primary/40 text-black font-royal font-black text-xl">
              F
            </div>
            <div>
              <h1 className="font-royal font-bold text-base tracking-wide text-brand-primary">
                FinBot AI
              </h1>
              <span className="text-[9px] text-brand-muted font-semibold tracking-wider font-sans block -mt-0.5">
                Smart Wealth
              </span>
            </div>
          </div>
          <button onClick={toggleSidebar} className="md:hidden text-gray-500 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-brand-primary text-black shadow-sm font-bold' 
                    : 'text-dark-text hover:text-brand-primary hover:bg-[#1a1400]'}
                `}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-dark-border space-y-4">
          <div className="flex items-center space-x-3">
            <img 
              src={user?.profilePic || 'https://api.dicebear.com/7.x/bottts/svg'} 
              alt="Avatar" 
              className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800 object-cover ring-2 ring-brand-primary/20"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-gray-700 dark:text-gray-200">
                {user?.username || 'User'}
              </p>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-gray-400 truncate max-w-[100px]">
                  {user?.email || 'user@example.com'}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase shrink-0
                  ${user?.role === 'pro' ? 'bg-brand-primary/20 text-brand-primary' : 'bg-gray-200 text-gray-600'}
                `}>
                  {user?.role || 'free'}
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-sm font-semibold text-brand-danger bg-brand-danger/5 hover:bg-brand-danger/10 border border-brand-danger/10 hover:border-brand-danger/25 transition-all duration-200"
          >
            <LogOut size={16} />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
export default Sidebar;
