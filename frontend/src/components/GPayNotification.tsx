import React, { useState, useEffect } from 'react';
import { CheckCircle, ShieldCheck, X, Sparkles } from 'lucide-react';

interface GPayAlertData {
  amount: number;
  type: 'debit' | 'credit';
  name: string;
  bankName: string;
}

export const GPayNotification = () => {
  const [alert, setAlert] = useState<GPayAlertData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleAlert = (e: Event) => {
      const customEvent = e as CustomEvent<GPayAlertData>;
      if (customEvent.detail) {
        setAlert(customEvent.detail);
        setVisible(true);

        // Sound indicator mock (beep or ping if user interaction has occurred)
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
          gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
          
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.15);
        } catch (err) {
          // Audio Context auto-play blocking bypass
        }
      }
    };

    window.addEventListener('gpay-notification', handleAlert);
    return () => {
      window.removeEventListener('gpay-notification', handleAlert);
    };
  }, []);

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      setVisible(false);
    }, 5500);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible || !alert) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-9999 w-[90%] max-w-sm rounded-2xl bg-[#1a73e8] text-white shadow-2xl overflow-hidden animate-in slide-in-from-top-12 duration-300">
      {/* Decorative colored bar */}
      <div className="h-1 bg-gradient-to-r from-emerald-400 to-yellow-400" />
      
      <div className="p-4 flex items-start space-x-3">
        {/* Success checkmark badge */}
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <CheckCircle size={24} className="text-emerald-400 animate-pulse" />
        </div>
        
        {/* Content details */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-200 flex items-center">
              <Sparkles size={11} className="mr-1 text-yellow-300" />
              Google Pay Transaction Alert
            </span>
            <button 
              onClick={() => setVisible(false)}
              className="p-0.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition"
            >
              <X size={14} />
            </button>
          </div>
          
          <h4 className="text-2xl font-black tracking-tight flex items-baseline">
            ₹{alert.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h4>
          
          <p className="text-xs font-semibold leading-snug">
            {alert.type === 'debit' ? (
              <span>Sent successfully to <strong className="underline decoration-yellow-400">{alert.name}</strong></span>
            ) : (
              <span>Received successfully from <strong className="underline decoration-emerald-400">{alert.name}</strong></span>
            )}
          </p>

          <p className="text-[9px] text-blue-100 flex items-center space-x-1 pt-1 font-bold">
            <ShieldCheck size={10} className="text-emerald-400" />
            <span>Debited from {alert.bankName || 'Linked Bank'} • UPI Safe</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GPayNotification;
