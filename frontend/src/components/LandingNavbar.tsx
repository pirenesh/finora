import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, LayoutDashboard } from 'lucide-react';

export const LandingNavbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 h-16 w-full border-b border-gray-200 dark:border-dark-border/40 glass-panel px-6 sm:px-12 flex items-center justify-between">
      <Link to="/" className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center shadow-md text-white font-bold text-base">
          💰
        </div>
        <span className="font-extrabold text-sm sm:text-base tracking-tight bg-brand-primary bg-clip-text text-transparent">
          FinBot AI
        </span>
      </Link>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center space-x-8 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
        <Link to="/" className="hover:text-brand-primary dark:hover:text-white transition">Home</Link>
        <Link to="/pricing" className="hover:text-brand-primary dark:hover:text-white transition">Pricing</Link>
        <Link to="/about" className="hover:text-brand-primary dark:hover:text-white transition">About Us</Link>
        <Link to="/contact" className="hover:text-brand-primary dark:hover:text-white transition">Contact</Link>
      </div>

      {/* CTAs */}
      <div className="flex items-center space-x-3">
        {user ? (
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-primary hover:bg-indigo-600 shadow-md shadow-brand-primary/10 transition"
          >
            <LayoutDashboard size={14} />
            <span>Go to Dashboard</span>
          </button>
        ) : (
          <>
            <Link 
              to="/login" 
              className="text-xs sm:text-sm font-bold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-primary hover:brightness-105 shadow-md shadow-brand-primary/15 transition"
            >
              <span>Get Started</span>
              <Sparkles size={11} className="animate-pulse" />
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};
export default LandingNavbar;
