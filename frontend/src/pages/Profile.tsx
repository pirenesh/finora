import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAppLock } from '../context/AppLockContext';
import { LockScreen } from '../components/Security/LockScreen';
import { User, Mail, ShieldAlert, Camera, Check, Sparkles, Lock, ShieldCheck, Fingerprint } from 'lucide-react';

export const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { addToast } = useToast();
  const { isProfileUnlocked } = useAppLock();
  const [showProfileLock, setShowProfileLock] = useState(!isProfileUnlocked);

  useEffect(() => {
    if (isProfileUnlocked) setShowProfileLock(false);
  }, [isProfileUnlocked]);

  // Settings states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [avatar, setAvatar] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Financial summary state
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setCurrency(user.currency || 'INR');
      setAvatar(user.profilePic || '');
    }

    // Fetch total financial summaries
    axios.get('/api/transactions')
      .then(res => {
        if (res.data.success) {
          setSummary(res.data.summary);
        }
      })
      .catch(err => console.error(err));
  }, [user]);

  const handleRandomizeAvatar = () => {
    const seeds = ['shadow', 'leo', 'max', 'bella', 'rocky', 'coco', 'luna', 'charlie'];
    const randomSeed = seeds[Math.floor(Math.random() * seeds.length)] + Math.floor(Math.random() * 100);
    const newAvatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`;
    setAvatar(newAvatarUrl);
    addToast('New avatar generated!', 'info');
  };

  const handleToggleSubscription = async () => {
    if (!user) return;
    const newRole = user.role === 'pro' ? 'free' : 'pro';
    
    try {
      setSubmitting(true);
      const success = await updateProfile({ role: newRole });
      if (success) {
        addToast(`Subscription updated to ${newRole.toUpperCase()}!`, 'success');
      } else {
        addToast('Failed to update subscription.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error processing subscription change.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email) {
      setErrorMsg('Please fill in username and email.');
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    const payload: any = {
      username,
      email,
      currency,
      profilePic: avatar
    };

    if (password) {
      payload.password = password;
    }

    const success = await updateProfile(payload);
    setSubmitting(false);

    if (success) {
      setSuccessMsg('Your security profile has been updated successfully!');
      addToast('Profile changes saved successfully.', 'success');
      setPassword('');
    } else {
      setErrorMsg('Profile update failed. Try another email or username.');
      addToast('Profile update failed.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-800 dark:text-white">
            Profile & Security Settings
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Customize your credentials, financial preferences, and profile avatars.
          </p>
        </div>
        {isProfileUnlocked && (
          <div className="text-[10px] font-bold text-brand-success bg-brand-success/10 px-3 py-1.5 rounded-full flex items-center">
            <ShieldCheck size={12} className="mr-1" /> Profile Unlocked
          </div>
        )}
      </div>

      <div className="relative">
        {/* Lock Overlay */}
        {!isProfileUnlocked && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0b0f19]/60 backdrop-blur-md rounded-3xl border border-gray-800/50">
            <div className="bg-[#151c2c] p-6 rounded-2xl flex flex-col items-center shadow-2xl border border-gray-800">
              <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-4">
                <Fingerprint size={32} />
              </div>
              <h3 className="text-lg font-black text-white mb-2">Profile Locked</h3>
              <p className="text-xs text-gray-400 font-medium text-center max-w-[200px] mb-6">
                Sensitive details are hidden. Authenticate to view or edit your profile.
              </p>
              <button
                onClick={() => setShowProfileLock(true)}
                className="px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-400 hover:scale-[1.02] text-white shadow-lg shadow-emerald-500/20 transition flex items-center"
              >
                <Lock size={14} className="mr-2" /> Unlock Profile
              </button>
            </div>
          </div>
        )}

        {/* Lock Screen Modal */}
        {showProfileLock && !isProfileUnlocked && (
          <LockScreen type="profile" onUnlock={() => setShowProfileLock(false)} />
        )}

        <div className={`space-y-6 transition-all duration-500 ${!isProfileUnlocked ? 'opacity-30 pointer-events-none select-none filter blur-[8px]' : ''}`}>
          {/* Profile Overview Card */}
      <div className="p-6 rounded-2xl glass-panel relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4 z-10">
          <div className="relative group">
            <img 
              src={avatar || 'https://api.dicebear.com/7.x/bottts/svg'} 
              alt="Profile avatar" 
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-brand-primary/20 bg-gray-200 dark:bg-gray-800"
            />
            <button 
              onClick={handleRandomizeAvatar}
              className="absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-brand-primary hover:bg-indigo-600 text-white shadow-lg transition"
              title="Regenerate Avatar"
            >
              <Camera size={14} />
            </button>
          </div>

          <div>
            <h2 className="text-xl font-black text-gray-800 dark:text-white flex items-center">
              {user?.username}
              <span className={`ml-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border
                ${user?.role === 'pro' 
                  ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/25' 
                  : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}
              `}>
                {user?.role === 'pro' ? 'Pro Member' : 'Free Account'}
              </span>
            </h2>
            <p className="text-xs text-gray-400 font-semibold">{user?.email}</p>
            <p className="text-[10px] text-gray-500 font-medium mt-1">
              Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active session'}
            </p>
          </div>
        </div>

        {/* Short Balance Summaries */}
        <div className="grid grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-gray-200 dark:border-dark-border/40 pt-4 md:pt-0 md:pl-6 z-10">
          <div>
            <span className="text-[9px] text-gray-400 block font-bold uppercase">Total Earned</span>
            <span className="text-sm font-black text-brand-success">₹{summary.income.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[9px] text-gray-400 block font-bold uppercase">Total Debits</span>
            <span className="text-sm font-black text-brand-danger">₹{summary.expense.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[9px] text-gray-400 block font-bold uppercase">Net Capital</span>
            <span className="text-sm font-black text-brand-info">₹{summary.balance.toLocaleString()}</span>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 w-36 h-36 bg-brand-primary rounded-tl-full pointer-events-none" />
      </div>

      {/* Subscription SaaS Box */}
      <div className="p-6 rounded-2xl glass-panel relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-brand-primary/10">
        <div className="flex items-center space-x-3.5 z-10">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            {user?.role === 'pro' ? <ShieldCheck size={20} /> : <Lock size={18} />}
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-white">
              {user?.role === 'pro' ? 'Pro Premium Unlocked' : 'Base Subscription Plan'}
            </h4>
            <p className="text-xs text-gray-400 font-semibold max-w-lg leading-relaxed mt-0.5">
              {user?.role === 'pro' 
                ? 'Your account has access to the full FinBot AI Assistant chatbot, cached financial health scores, and premium PDF statement formatting.' 
                : 'Upgrade to Pro Premium to unlock direct FinBot chatbot queries, diagnostic health indices, and PDF statement downloads.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleSubscription}
          disabled={submitting}
          className={`
            px-6 py-3 rounded-xl font-bold text-xs shadow-md transition z-10 shrink-0
            ${user?.role === 'pro' 
              ? 'bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-200' 
              : 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white hover:scale-[1.02] shadow-emerald-500/20'}
          `}
        >
          {user?.role === 'pro' ? 'Downgrade to Free' : 'Upgrade to Pro'}
        </button>
      </div>

      {/* Main Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Security Settings Form */}
        <div className="md:col-span-2 p-6 rounded-2xl glass-panel space-y-4">
          <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">
            Edit Credentials
          </h3>

          {successMsg && (
            <div className="p-3 text-xs font-semibold text-brand-success bg-brand-success/10 border border-brand-success/20 rounded-xl flex items-center space-x-1.5">
              <Check size={14} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 text-xs font-semibold text-brand-danger bg-brand-danger/10 border border-brand-danger/20 rounded-xl">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Floating Username */}
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 z-10">
                  <User size={15} />
                </span>
                <input
                  type="text"
                  id="profileUser"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="peer w-full pl-10 pr-4 pt-6 pb-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-sm font-semibold placeholder-transparent transition-all"
                  placeholder="Username"
                />
                <label htmlFor="profileUser" className="absolute left-10 top-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-xs peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-emerald-500">
                  Username
                </label>
              </div>

              {/* Floating Email */}
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 z-10">
                  <Mail size={15} />
                </span>
                <input
                  type="email"
                  id="profileEmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="peer w-full pl-10 pr-4 pt-6 pb-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-sm font-semibold placeholder-transparent transition-all"
                  placeholder="Email"
                />
                <label htmlFor="profileEmail" className="absolute left-10 top-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-xs peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-emerald-500">
                  Email Address
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Floating Password */}
              <div className="relative group">
                <input
                  type="password"
                  id="profilePass"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New Password"
                  className="peer w-full px-4 pt-6 pb-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-sm font-semibold placeholder-transparent transition-all"
                />
                <label htmlFor="profilePass" className="absolute left-4 top-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-xs peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:text-emerald-500">
                  New Password (optional)
                </label>
              </div>

              {/* Currency Settings */}
              <div className="relative group">
                <select
                  id="profileCur"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="peer w-full px-4 pt-6 pb-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-sm font-semibold transition-all cursor-pointer"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
                <label htmlFor="profileCur" className="absolute left-4 top-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider transition-all peer-focus:text-emerald-500">
                  Default Currency
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="py-3 px-6 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-400 hover:scale-[1.02] text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-all mt-4 w-full sm:w-auto"
            >
              <span>{submitting ? 'Updating...' : 'Save Settings'}</span>
            </button>
          </form>
        </div>

        {/* Security Advisories Card */}
        <div className="p-6 rounded-2xl glass-panel space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider flex items-center">
              <ShieldAlert size={16} className="text-brand-warning mr-1.5" />
              Security Advisories
            </h3>
            <ul className="text-xs space-y-3.5 text-gray-500 dark:text-gray-400 font-semibold mt-4">
              <li>
                🔐 Passwords are encrypted server-side using cryptographic salts and SHA-256 standard hashing.
              </li>
              <li>
                🤖 FinBot AI reads transaction aggregates and budgets to generate health indices. No personal contact information is processed.
              </li>
              <li>
                ⏱️ Session tokens are stored in cookie headers and expire automatically after 30 days of inactivity.
              </li>
            </ul>
          </div>

          <div className="p-3.5 bg-brand-primary/5 rounded-xl border border-brand-primary/10 text-[10px] text-gray-400 text-center font-semibold italic">
            "An investment in knowledge pays the best interest." – Benjamin Franklin
          </div>
        </div>

      </div>
      </div>
    </div>
    </div>
  );
};
export default Profile;
