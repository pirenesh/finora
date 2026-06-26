import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, Languages } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

export const Header = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const [lang, setLang] = useState<'en' | 'ta'>(
    (localStorage.getItem('lang') as 'en' | 'ta') || 'en'
  );

  // Force dark mode for the Royal Black & Gold Theme
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'ta' : 'en';
    setLang(newLang);
    localStorage.setItem('lang', newLang);
    i18n.changeLanguage(newLang);
  };

  // Get active title based on path
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return t('header.pageTitles.dashboard');
      case '/income':
        return t('header.pageTitles.income');
      case '/expense':
        return t('header.pageTitles.expense');
      case '/budgets':
        return t('header.pageTitles.budgets');
      case '/transactions':
        return t('header.pageTitles.transactions');
      case '/debt':
        return t('header.pageTitles.debt');
      case '/goals':
        return t('header.pageTitles.goals');
      case '/bank-accounts':
        return t('header.pageTitles.bankAccounts');
      case '/analytics':
        return t('header.pageTitles.analytics');
      case '/profile':
        return t('header.pageTitles.profile');
      default:
        return t('header.pageTitles.default');
    }
  };

  // Format today's date
  const getFormattedDate = () => {
    return new Date().toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <header className="sticky top-0 z-30 h-20 w-full flex items-center justify-between px-6 md:px-8 border-b border-gray-200 dark:border-dark-border glass-panel">
      {/* Page Title / Mobile Padding */}
      <div className="pl-12 md:pl-0">
        <h2 className="text-lg md:text-xl font-bold tracking-tight text-white">
          {getPageTitle()}
        </h2>
        <p className="hidden md:block text-[11px] text-gray-400 font-medium">
          {t('header.welcomeBack', { name: user?.username || 'user' })}
        </p>
      </div>

      {/* Action Items */}
      <div className="flex items-center space-x-3">
        {/* Date Display */}
        <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-100/50 dark:bg-gray-800/40">
          <Calendar size={14} className="text-brand-primary" />
          <span>{getFormattedDate()}</span>
        </div>

        {/* Language Toggle Button */}
        <button
          onClick={toggleLanguage}
          title={t('header.toggleLanguage')}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-brand-primary/30 bg-brand-primary/5 hover:bg-brand-primary/15 text-brand-primary transition-all duration-200 text-xs font-bold"
        >
          <Languages size={15} />
          <span className="hidden sm:inline">{lang === 'en' ? 'தமிழ்' : 'EN'}</span>
        </button>

        {/* Notifications Bell */}
        <NotificationBell />


        {/* Mini profile picture */}
        <div className="flex items-center space-x-2">
          <img 
            src={user?.profilePic || 'https://api.dicebear.com/7.x/bottts/svg'} 
            alt="User profile" 
            className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-primary/50 bg-dark-card"
          />
        </div>
      </div>
    </header>
  );
};
export default Header;
