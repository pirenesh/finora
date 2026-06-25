import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AuthGuard } from './components/AuthGuard';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { FloatingBot } from './components/FloatingBot';
import { GPayNotification } from './components/GPayNotification';
import { AppLockProvider, useAppLock } from './context/AppLockContext';
import { LockScreen } from './components/Security/LockScreen';
import { useDebtNotifications } from './hooks/useDebtNotifications';

// SaaS Marketing Pages (Landing removed per request, now Login is entry)
import { Pricing } from './pages/Pricing';
import { About } from './pages/About';
import { Contact } from './pages/Contact';

// Dashboard Console Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Income } from './pages/Income';
import { Expense } from './pages/Expense';
import { Budgets } from './pages/Budgets';
import { Transactions } from './pages/Transactions';
import { Analytics } from './pages/Analytics';
import { Profile } from './pages/Profile';
import { Security } from './pages/Security';
import { LandingNavbar } from './components/LandingNavbar';
import { Debt } from './pages/Debt';
import { BankLink } from './pages/BankLink';
import { Goals } from './pages/Goals';

const PrivateLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAppUnlocked } = useAppLock();
  useDebtNotifications(); // Initialize debt push notifications

  if (!isAppUnlocked) {
    return <LockScreen type="app" />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0b0f19] dark:text-[#f3f4f6] transition-colors duration-300">
      {/* Sidebar background decoration */}
      <div className="glow-blob w-[300px] h-[300px] bg-brand-primary top-10 left-10 animate-pulse-slow"></div>
      <div className="glow-blob w-[250px] h-[250px] bg-brand-info bottom-10 right-10 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      <Sidebar />
      <div className="flex-grow flex flex-col min-w-0 relative">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 relative z-10">
          {children}
        </main>
      </div>
      
      {/* AI Chatbot floating assistant */}
      <FloatingBot />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppLockProvider>
          <Router>
            <Routes>
            {/* Public SaaS Marketing Pages */}
            <Route path="/landing" element={<Navigate to="/login" replace />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />

            {/* Public Auth Pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Secure Private Console Pages */}
            <Route
              path="/"
              element={
                <AuthGuard>
                  <PrivateLayout>
                    <Dashboard />
                  </PrivateLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/income"
              element={
                <AuthGuard>
                  <PrivateLayout>
                    <Income />
                  </PrivateLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/expense"
              element={
                <AuthGuard>
                  <PrivateLayout>
                    <Expense />
                  </PrivateLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/budgets"
              element={
                <AuthGuard>
                  <PrivateLayout>
                    <Budgets />
                  </PrivateLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/transactions"
              element={
                <AuthGuard>
                  <PrivateLayout>
                    <Transactions />
                  </PrivateLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/debt"
              element={
                <AuthGuard>
                  <PrivateLayout>
                    <Debt />
                  </PrivateLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/bank-accounts"
              element={
                <AuthGuard>
                  <PrivateLayout>
                    <BankLink />
                  </PrivateLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/goals"
              element={
                <AuthGuard>
                  <PrivateLayout>
                    <Goals />
                  </PrivateLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/analytics"
              element={
                <AuthGuard>
                  <PrivateLayout>
                    <Analytics />
                  </PrivateLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/profile"
              element={
                <AuthGuard>
                  <PrivateLayout>
                    <Profile />
                  </PrivateLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/security"
              element={
                <AuthGuard>
                  <PrivateLayout>
                    <Security />
                  </PrivateLayout>
                </AuthGuard>
              }
            />

            {/* Redirects */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        <GPayNotification />
        </AppLockProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
