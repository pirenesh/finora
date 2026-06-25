import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Sparkles, CheckCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setSubmitting(false);
      return;
    }

    try {
      const res = await axios.put(`/api/auth/reset-password/${token}`, { password });
      if (res.data.success) {
        addToast('Password reset successful! Please log in.', 'success');
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired token.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b14] relative overflow-hidden px-4">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-brand-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-brand-info/20 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md p-8 rounded-3xl border border-white/5 bg-[#151c2c]/55 backdrop-blur-xl shadow-2xl z-10 text-[#f3f4f6] animate-in zoom-in-95 duration-300">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/30 mb-3 text-white text-2xl font-bold">
            🔑
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight bg-brand-primary bg-clip-text text-transparent flex items-center">
            Set New Password
            <Sparkles size={16} className="ml-1.5 text-yellow-300 animate-pulse" />
          </h2>
          <p className="text-xs text-gray-400 font-semibold tracking-wide uppercase mt-1 text-center">
            Create a strong new password for your account
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 text-xs font-semibold text-brand-danger bg-brand-danger/10 border border-brand-danger/20 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              New Password
            </label>
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

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Confirm New Password
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                <CheckCircle size={16} />
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-3 outline-none rounded-xl border border-gray-800 bg-[#0e1422] focus:border-brand-primary text-sm font-semibold transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-bold bg-brand-primary hover:brightness-105 text-white flex items-center justify-center space-x-2 shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/35 transition duration-200 mt-2"
          >
            <CheckCircle size={18} />
            <span>{submitting ? 'Updating Password...' : 'Reset Password'}</span>
          </button>
        </form>

        <div className="text-center mt-6">
          <Link to="/login" className="text-xs font-bold text-gray-400 hover:text-white transition flex items-center justify-center space-x-1">
            <ArrowLeft size={14} />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
