import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="border-t border-gray-200 dark:border-dark-border/40 bg-white/30 dark:bg-dark-bg/20 py-12 px-6 sm:px-12 text-[#f3f4f6]">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left branding */}
        <div className="space-y-4 col-span-1 md:col-span-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-primary to-brand-info flex items-center justify-center text-white font-bold">
              💰
            </div>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-brand-primary to-brand-info bg-clip-text text-transparent">
              FinBot AI
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
            The next-generation smart wealth manager. Track portfolios, configure budget boundaries, and get predictive insights directly from an advanced generative AI assistant.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider mb-4">Product</h4>
          <ul className="text-xs space-y-2.5 text-gray-500 dark:text-gray-400 font-semibold">
            <li><Link to="/pricing" className="hover:text-brand-primary transition">Plans & Pricing</Link></li>
            <li><a href="#features" className="hover:text-brand-primary transition">Features</a></li>
            <li><a href="#faq" className="hover:text-brand-primary transition">FAQ Core</a></li>
          </ul>
        </div>

        {/* Company Links */}
        <div>
          <h4 className="text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider mb-4">Company</h4>
          <ul className="text-xs space-y-2.5 text-gray-500 dark:text-gray-400 font-semibold">
            <li><Link to="/about" className="hover:text-brand-primary transition">Our Mission</Link></li>
            <li><Link to="/contact" className="hover:text-brand-primary transition">Contact Sales</Link></li>
            <li><a href="#privacy" className="hover:text-brand-primary transition">Privacy Policy</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto border-t border-gray-100 dark:border-dark-border/20 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 font-semibold">
        <span>© {new Date().getFullYear()} FinBot AI Inc. All rights reserved.</span>
        <span className="mt-2 sm:mt-0">Built as a premium deployable SaaS application.</span>
      </div>
    </footer>
  );
};
export default Footer;
