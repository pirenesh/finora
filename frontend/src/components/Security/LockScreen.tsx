import React, { useState, useEffect } from 'react';
import { Fingerprint, Lock, CheckCircle2, ShieldAlert, Delete } from 'lucide-react';
import { useAppLock } from '../../context/AppLockContext';
import { useToast } from '../../context/ToastContext';

interface LockScreenProps {
  type: 'app' | 'profile';
  onUnlock?: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ type, onUnlock }) => {
  const { unlockApp, unlockProfile } = useAppLock();
  const { addToast } = useToast();
  const [pin, setPin] = useState<string>('');
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);
  const [error, setError] = useState(false);

  const CORRECT_PIN = '1234'; // Simulated correct PIN for demo

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === CORRECT_PIN) {
        handleSuccess();
      } else {
        setError(true);
        addToast('Incorrect PIN. Try 1234.', 'error');
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 500);
      }
    }
  }, [pin]);

  const handleSuccess = () => {
    addToast(`${type === 'app' ? 'App' : 'Profile'} Unlocked Successfully!`, 'success');
    if (type === 'app') unlockApp();
    if (type === 'profile') unlockProfile();
    if (onUnlock) onUnlock();
  };

  const handleBiometricScan = () => {
    setIsBiometricScanning(true);
    // Simulate a 1.5 second scan
    setTimeout(() => {
      setIsBiometricScanning(false);
      handleSuccess();
    }, 1500);
  };

  const handlePinPress = (digit: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-[#0b0f19]/95 backdrop-blur-xl transition-all duration-300 ${type === 'profile' ? 'absolute rounded-3xl' : ''}`}>
      
      {/* Background glowing blobs */}
      {type === 'app' && (
        <>
          <div className="absolute w-[500px] h-[500px] bg-brand-primary/20 rounded-full blur-[100px] -top-40 -left-40 animate-pulse-slow"></div>
          <div className="absolute w-[400px] h-[400px] bg-brand-info/20 rounded-full blur-[100px] -bottom-20 -right-20 animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
        </>
      )}

      <div className="relative z-10 w-full max-w-sm px-6 flex flex-col items-center animate-in zoom-in-95 duration-300">
        
        {/* Header Icon */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-brand-primary/20 border border-white/10 ${error ? 'bg-red-500/20 text-red-500 animate-shake' : 'bg-[#151c2c] text-brand-primary'}`}>
          {isBiometricScanning ? (
            <Fingerprint size={32} className="animate-pulse" />
          ) : (
            <Lock size={32} />
          )}
        </div>

        {/* Titles */}
        <h2 className="text-2xl font-black text-white tracking-tight mb-2 text-center">
          {type === 'app' ? 'App Locked' : 'Profile Locked'}
        </h2>
        <p className="text-xs text-gray-400 font-medium text-center max-w-[250px] mb-8">
          Enter your 4-digit PIN or use Biometric Auth to view sensitive financial data. (Demo PIN: 1234)
        </p>

        {/* PIN Indicators */}
        <div className={`flex space-x-4 mb-10 ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((index) => (
            <div 
              key={index}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > index 
                  ? 'bg-brand-primary border-brand-primary shadow-[0_0_10px_rgba(109,40,217,0.5)]' 
                  : 'bg-transparent border-gray-600'
              } ${error ? 'border-red-500 bg-red-500' : ''}`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[280px] mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handlePinPress(num.toString())}
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl font-semibold text-white bg-white/5 hover:bg-white/15 active:bg-brand-primary/40 transition border border-white/5 backdrop-blur-md"
            >
              {num}
            </button>
          ))}
          
          {/* Biometric Button */}
          <button
            onClick={handleBiometricScan}
            disabled={isBiometricScanning}
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-brand-info bg-white/5 hover:bg-white/15 active:bg-brand-info/40 transition border border-white/5 backdrop-blur-md"
            title="Use Fingerprint / Face ID"
          >
            <Fingerprint size={28} className={isBiometricScanning ? 'animate-ping' : ''} />
          </button>

          {/* Zero */}
          <button
            onClick={() => handlePinPress('0')}
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl font-semibold text-white bg-white/5 hover:bg-white/15 active:bg-brand-primary/40 transition border border-white/5 backdrop-blur-md"
          >
            0
          </button>

          {/* Backspace */}
          <button
            onClick={handleBackspace}
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-gray-400 hover:text-white bg-white/5 hover:bg-white/15 active:bg-red-500/40 transition border border-white/5 backdrop-blur-md"
          >
            <Delete size={24} />
          </button>
        </div>

        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center space-x-1.5 opacity-60">
          <ShieldAlert size={12} />
          <span>End-to-End Encrypted</span>
        </div>
      </div>
    </div>
  );
};
