import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, UserPlus, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const Register = () => {
  const { register, error, setError } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localErr, setLocalErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setLocalErr('Please enter all fields');
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setLocalErr('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
      return;
    }

    setSubmitting(true);
    setLocalErr('');
    setError(null);

    const success = await register(username, email, password);
    setSubmitting(false);

    if (success) {
      addToast('Profile created successfully! Welcome to FinBot AI.', 'success');
      navigate('/');
    } else {
      addToast('Registration failed.', 'error');
    }
  };

  const activeError = localErr || error;

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-[#0b0f19] px-4 overflow-hidden">
      {/* Abstract Glowing Blobs */}
      <div className="glow-blob w-[400px] h-[400px] bg-brand-primary -top-10 -left-10 animate-pulse-slow"></div>
      <div className="glow-blob w-[300px] h-[300px] bg-brand-info -bottom-10 -right-10 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      {/* Registration Card */}
      <div className="w-full max-w-md p-8 rounded-3xl border border-white/5 bg-[#151c2c]/55 backdrop-blur-xl shadow-2xl z-10 text-[#f3f4f6] animate-in zoom-in-95 duration-300">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/30 mb-3 text-white text-2xl font-bold">
            💰
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight bg-brand-primary bg-clip-text text-transparent flex items-center">
            FinBot AI
            <Sparkles size={16} className="ml-1.5 text-yellow-300 animate-pulse" />
          </h2>
          <p className="text-xs text-gray-400 font-semibold tracking-wide uppercase mt-1">
            Smart Finance Tracker
          </p>
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-white">Create Account</h3>
          <p className="text-xs text-gray-400 mt-1">Register now and explore AI-powered wealth analytics.</p>
        </div>

        {activeError && (
          <div className="mb-5 p-3 text-xs font-semibold text-brand-danger bg-brand-danger/10 border border-brand-danger/20 rounded-xl">
            {activeError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Profile Name / Username
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                <User size={16} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. JohnDoe"
                required
                className="w-full pl-10 pr-4 py-3 outline-none rounded-xl border border-gray-800 bg-[#0e1422] focus:border-brand-primary text-sm font-semibold transition"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-10 pr-4 py-3 outline-none rounded-xl border border-gray-800 bg-[#0e1422] focus:border-brand-primary text-sm font-semibold transition"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Password
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
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500">
                  <span>Strength</span>
                </div>
                <div className="flex gap-1 h-1.5">
                  <div className={`flex-1 rounded-full ${password.length >= 8 ? 'bg-brand-success' : 'bg-gray-700'}`}></div>
                  <div className={`flex-1 rounded-full ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'bg-brand-success' : 'bg-gray-700'}`}></div>
                  <div className={`flex-1 rounded-full ${/\d/.test(password) ? 'bg-brand-success' : 'bg-gray-700'}`}></div>
                  <div className={`flex-1 rounded-full ${/[@$!%*?&]/.test(password) ? 'bg-brand-success' : 'bg-gray-700'}`}></div>
                </div>
                <div className="text-[10px] text-gray-500 font-medium">
                  Needs: 8+ chars, upper & lower, number, special char.
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-bold bg-brand-primary hover:brightness-105 text-white flex items-center justify-center space-x-2 shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/35 transition duration-200 mt-2"
          >
            <UserPlus size={18} />
            <span>{submitting ? 'Creating Profile...' : 'Begin Wealth Journey'}</span>
          </button>
        </form>

        {/* Redirect to Login */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-brand-info hover:underline">
              Sign In Instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default Register;
