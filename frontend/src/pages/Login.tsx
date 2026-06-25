import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

export const Login = () => {
  const { login, error, setError } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localErr, setLocalErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername || !password) {
      setLocalErr(t('login.enterAllFields'));
      return;
    }

    setSubmitting(true);
    setLocalErr('');
    setError(null);

    const success = await login(emailOrUsername, password, rememberMe);
    setSubmitting(false);

    if (success) {
      addToast(t('login.loginSuccess'), 'success');
      navigate('/');
    } else {
      addToast(t('login.loginFailed'), 'error');
    }
  };

  const activeError = localErr || error;

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-[#0b0f19] px-4 overflow-hidden">
      {/* Abstract Glowing Blobs */}
      <div className="glow-blob w-[400px] h-[400px] bg-brand-primary -top-10 -left-10 animate-pulse-slow"></div>
      <div className="glow-blob w-[300px] h-[300px] bg-brand-info -bottom-10 -right-10 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      {/* Login Card */}
      <div className="w-full max-w-md p-8 rounded-3xl border border-white/5 bg-[#151c2c]/55 backdrop-blur-xl shadow-2xl z-10 text-[#f3f4f6] animate-in zoom-in-95 duration-300">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/30 mb-3 text-white text-2xl font-bold">
            💰
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight bg-brand-primary bg-clip-text text-transparent flex items-center">
            FinBot AI
            <Sparkles size={16} className="ml-1.5 text-yellow-300 animate-pulse" />
          </h2>
          <p className="text-xs text-gray-400 font-semibold tracking-wide uppercase mt-1">
            {t('login.title')}
          </p>
        </div>

        {/* Welcome message */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-white">{t('login.welcomeBack')}</h3>
          <p className="text-xs text-gray-400 mt-1">{t('login.subtitle')}</p>
        </div>

        {activeError && (
          <div className="mb-5 p-3 text-xs font-semibold text-brand-danger bg-brand-danger/10 border border-brand-danger/20 rounded-xl">
            {activeError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username / Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {t('login.usernameOrEmail')}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                <Mail size={16} />
              </span>
              <input
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder={t('login.placeholder')}
                required
                className="w-full pl-10 pr-4 py-3 outline-none rounded-xl border border-gray-800 bg-[#0e1422] focus:border-brand-primary text-sm font-semibold transition"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {t('login.password')}
              </label>
              <Link 
                to="/forgot-password"
                className="text-xs font-semibold text-brand-primary hover:underline"
              >
                {t('login.forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                <Lock size={16} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-3 outline-none rounded-xl border border-gray-800 bg-[#0e1422] focus:border-brand-primary text-sm font-semibold transition"
              />
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center space-x-2 pt-1">
            <input 
              type="checkbox" 
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-gray-800 bg-[#0e1422] text-brand-primary focus:ring-brand-primary/50 cursor-pointer"
            />
            <label htmlFor="rememberMe" className="text-xs font-semibold text-gray-400 cursor-pointer select-none">
              Remember me for 30 days
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-bold bg-brand-primary hover:brightness-105 text-white flex items-center justify-center space-x-2 shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/35 transition duration-200 mt-2"
          >
            <LogIn size={18} />
            <span>{submitting ? t('login.authenticating') : t('login.loginBtn')}</span>
          </button>
        </form>

        {/* Redirect to Register */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="font-bold text-brand-info hover:underline">
              {t('login.createAccount')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default Login;
