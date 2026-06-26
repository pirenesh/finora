import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  History, 
  Wallet, 
  Target,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';

export const MobileNav = () => {
  const menuItems = [
    { name: 'Home', path: '/', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: History },
    { name: 'Budgets', path: '/budgets', icon: Wallet },
    { name: 'Goals', path: '/goals', icon: Target },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full z-50 glass-panel-heavy border-t border-dark-border px-6 py-3 pb-safe">
      <div className="flex justify-between items-center">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center w-12 h-12"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="mobileNavIndicator"
                      className="absolute -top-3 w-10 h-1 bg-brand-primary rounded-b-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div className={`transition-all duration-300 ${isActive ? '-translate-y-1 text-brand-primary' : 'text-gray-400 hover:text-white'}`}>
                    <Icon size={isActive ? 22 : 20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-[9px] mt-1 font-semibold transition-all duration-300 ${isActive ? 'text-brand-primary opacity-100' : 'text-gray-400 opacity-0'}`}>
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
