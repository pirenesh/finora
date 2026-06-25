import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0b0f19]">
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute top-5 text-xl">💰</div>
          <p className="mt-4 text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 animate-pulse">
            Authorizing secure session...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />; // SaaS redirect to login as entry page
  }

  return <>{children}</>;
};
export default AuthGuard;
