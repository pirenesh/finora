import React from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info, 
  X 
} from 'lucide-react';
import { ToastItem, ToastType } from '../context/ToastContext';

interface ToastProps {
  toast: ToastItem;
  onClose: (id: string) => void;
}

const Toast = ({ toast, onClose }: ToastProps) => {
  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-brand-success shrink-0" size={16} />;
      case 'warning':
        return <AlertTriangle className="text-brand-warning shrink-0" size={16} />;
      case 'error':
        return <XCircle className="text-brand-danger shrink-0" size={16} />;
      case 'info':
        return <Info className="text-brand-info shrink-0" size={16} />;
    }
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-brand-success/30 shadow-emerald-500/5';
      case 'warning':
        return 'border-brand-warning/30 shadow-amber-500/5';
      case 'error':
        return 'border-brand-danger/30 shadow-rose-500/5';
      case 'info':
        return 'border-brand-info/30 shadow-cyan-500/5';
    }
  };

  return (
    <div className={`
      flex items-center space-x-3 p-4 rounded-xl border shadow-lg glass-panel-heavy
      text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200
      animate-in slide-in-from-top-3 fade-in duration-200
      ${getBorderColor(toast.type)}
    `}>
      {getIcon(toast.type)}
      <div className="flex-grow">{toast.message}</div>
      <button 
        onClick={() => onClose(toast.id)}
        className="p-0.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-white transition"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const ToastContainer = ({ 
  toasts, 
  removeToast 
}: { 
  toasts: ToastItem[]; 
  removeToast: (id: string) => void; 
}) => {
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col space-y-2.5 max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
};
