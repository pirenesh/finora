import React, { useState } from 'react';
import { ShieldCheck, Info, User, CreditCard, Phone, Loader2 } from 'lucide-react';

export const CibilCalculator = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pan, setPan] = useState('');
  const [mobile, setMobile] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [score, setScore] = useState(0);

  const handleFetch = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2); // Loading step
    
    // Simulate API delay
    setTimeout(() => {
      // Generate a deterministic but pseudo-random score based on PAN for fun
      let hash = 0;
      for (let i = 0; i < pan.length; i++) {
        hash = pan.charCodeAt(i) + ((hash << 5) - hash);
      }
      // Bound between 650 and 850
      const randomScore = 650 + (Math.abs(hash) % 200);
      setScore(randomScore);
      setStep(3); // Result step
    }, 2500);
  };

  const getScoreColor = (s: number) => {
    if (s >= 750) return 'text-brand-success';
    if (s >= 650) return 'text-brand-info';
    if (s >= 550) return 'text-brand-warning';
    return 'text-brand-danger';
  };

  const getScoreStatus = (s: number) => {
    if (s >= 750) return 'Excellent';
    if (s >= 650) return 'Good';
    if (s >= 550) return 'Average';
    return 'Poor';
  };

  const radius = 80;
  const circumference = Math.PI * radius; // semi-circle
  const strokeDashoffset = score > 0 ? circumference - ((score - 300) / 600) * circumference : circumference;

  return (
    <div className="p-6 rounded-2xl glass-panel relative overflow-hidden border border-gray-200 dark:border-dark-border/40">
      <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider mb-6 flex items-center border-b border-gray-200 dark:border-dark-border pb-3">
        <ShieldCheck size={16} className="text-brand-primary mr-1.5" />
        Check Free CIBIL Score
      </h3>

      {step === 1 && (
        <form onSubmit={handleFetch} className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">First Name (As per PAN)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><User size={14} /></span>
              <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full pl-9 pr-3 py-2.5 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-xs font-bold text-gray-800 dark:text-white" placeholder="First Name" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Last Name</label>
            <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-3 py-2.5 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-xs font-bold text-gray-800 dark:text-white" placeholder="Last Name" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">PAN Number</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><CreditCard size={14} /></span>
              <input type="text" required value={pan} onChange={e => setPan(e.target.value.toUpperCase())} maxLength={10} className="w-full pl-9 pr-3 py-2.5 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-xs font-bold uppercase text-gray-800 dark:text-white" placeholder="ABCDE1234F" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Mobile Number</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Phone size={14} /></span>
              <input type="tel" required value={mobile} onChange={e => setMobile(e.target.value)} maxLength={10} className="w-full pl-9 pr-3 py-2.5 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-xs font-bold text-gray-800 dark:text-white" placeholder="9876543210" />
            </div>
          </div>
          
          <div className="sm:col-span-2 pt-3">
            <button type="submit" className="w-full py-3 rounded-xl font-bold bg-brand-primary hover:bg-indigo-600 text-white shadow-lg transition flex items-center justify-center">
              <ShieldCheck size={16} className="mr-2" />
              Check Score for Free
            </button>
            <p className="text-center text-[9px] text-gray-400 mt-3 font-semibold flex items-center justify-center">
              <Info size={10} className="mr-1" />
              Checking your CIBIL score will not impact your credit score. Powered by Experian & CIBIL.
            </p>
          </div>
        </form>
      )}

      {step === 2 && (
        <div className="py-12 flex flex-col items-center justify-center space-y-4">
          <Loader2 size={32} className="text-brand-primary animate-spin" />
          <h4 className="font-bold text-gray-800 dark:text-white">Fetching your report...</h4>
          <p className="text-xs text-gray-500 font-medium">Securely connecting to credit bureaus</p>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 py-6">
          <div className="relative flex justify-center items-end" style={{ width: 200, height: 100 }}>
            {/* Background Arc */}
            <svg width="200" height="100" viewBox="0 0 200 100" className="absolute top-0 overflow-visible">
              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" className="text-gray-200 dark:text-gray-800" />
              {/* Foreground Arc */}
              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" className={`${getScoreColor(score)} transition-all duration-1000 ease-out`} style={{ strokeDasharray: circumference, strokeDashoffset: strokeDashoffset }} />
            </svg>
            
            {/* Score Text */}
            <div className="absolute bottom-0 flex flex-col items-center translate-y-2">
              <span className={`text-4xl font-black ${getScoreColor(score)}`}>{score}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Out of 900</span>
            </div>
          </div>
          
          <div className="text-center md:text-left space-y-2">
            <h4 className={`text-2xl font-black uppercase tracking-wide ${getScoreColor(score)}`}>
              {getScoreStatus(score)}
            </h4>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 max-w-[200px]">
              Hi {firstName}, your credit score is in the {getScoreStatus(score).toLowerCase()} range. Keep paying your EMIs on time!
            </p>
            <button onClick={() => setStep(1)} className="text-[10px] font-bold text-brand-primary underline hover:text-indigo-500 mt-4 inline-block">
              Check another PAN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
