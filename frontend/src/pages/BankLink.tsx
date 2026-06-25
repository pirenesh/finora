import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { usePlaidLink } from 'react-plaid-link';
import { 
  Plus, 
  Building, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  X, 
  ArrowRight,
  Shield,
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  Fingerprint
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAppLock } from '../context/AppLockContext';
import { LockScreen } from '../components/Security/LockScreen';

export const BankLink = () => {
  const { addToast } = useToast();
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const { isProfileUnlocked } = useAppLock();
  const [showProfileLock, setShowProfileLock] = useState(!isProfileUnlocked);

  useEffect(() => {
    if (isProfileUnlocked) setShowProfileLock(false);
  }, [isProfileUnlocked]);

  // Link Modal Simulation (Sandbox Fallback Mode)
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simStep, setSimStep] = useState(1); // 1: Bank List, 2: Credentials, 3: Success
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [simUsername, setSimUsername] = useState('user_good');
  const [simPassword, setSimPassword] = useState('pass_good');
  const [simError, setSimError] = useState('');

  // Plaid API States
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isPlaidMock, setIsPlaidMock] = useState(true);

  // Manual Indian Bank States
  const [linkMethod, setLinkMethod] = useState<'plaid' | 'indian'>('plaid');
  const [manualBankName, setManualBankName] = useState('');
  const [manualHolderName, setManualHolderName] = useState('');
  const [manualAccountNumber, setManualAccountNumber] = useState('');
  const [manualIfscCode, setManualIfscCode] = useState('');
  const [manualBalance, setManualBalance] = useState(0);
  const [hideBalances, setHideBalances] = useState(true);

  // Sandbox banks list
  const sandboxBanks = [
    { id: 'ins_109', name: 'Chase Bank (Sandbox)', color: 'bg-blue-600' },
    { id: 'ins_1', name: 'Bank of America (Sandbox)', color: 'bg-red-600' },
    { id: 'ins_3', name: 'Wells Fargo (Sandbox)', color: 'bg-yellow-600' },
    { id: 'ins_5', name: 'Citi Bank (Sandbox)', color: 'bg-sky-500' }
  ];

  // Common Indian Banks for Autocomplete
  const indianBanks = [
    "State Bank of India (SBI)",
    "HDFC Bank",
    "ICICI Bank",
    "Punjab National Bank (PNB)",
    "Axis Bank",
    "Kotak Mahindra Bank",
    "Bank of Baroda",
    "Bank of India",
    "Canara Bank",
    "Union Bank of India",
    "IndusInd Bank",
    "Yes Bank",
    "IDFC FIRST Bank",
    "Indian Bank",
    "Indian Overseas Bank",
    "UCO Bank",
    "Central Bank of India",
    "Bank of Maharashtra",
    "South Indian Bank",
    "Federal Bank",
    "Karur Vysya Bank",
    "City Union Bank",
    "RBL Bank",
    "Bandhan Bank"
  ];

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/plaid/connections');
      if (res.data.success) {
        setConnections(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load bank connections:', err);
      addToast('Failed to load bank accounts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const initPlaidLink = async () => {
    try {
      const res = await axios.post('/api/plaid/create-link-token');
      if (res.data.success) {
        setLinkToken(res.data.link_token);
        setIsPlaidMock(res.data.is_mock);
      }
    } catch (err) {
      console.error('Plaid link token failed:', err);
    }
  };

  useEffect(() => {
    fetchConnections();
    initPlaidLink();
  }, []);

  // Real Plaid Link Hook (Only fires when Plaid credentials exist in backend)
  const { open, ready } = usePlaidLink({
    token: linkToken || '',
    onSuccess: async (public_token, metadata) => {
      try {
        const res = await axios.post('/api/plaid/exchange-public-token', {
          publicToken: public_token,
          institutionName: metadata.institution?.name || 'Connected Bank',
          institutionId: metadata.institution?.institution_id || 'ins_101',
          isMock: false
        });
        if (res.data.success) {
          addToast(`Linked ${metadata.institution?.name || 'Bank'} successfully!`, 'success');
          fetchConnections();
        }
      } catch (err) {
        console.error('Public token exchange failed:', err);
        addToast('Bank linking failed.', 'error');
      }
    },
  });

  const handleLinkClick = () => {
    if (!isPlaidMock && ready && open) {
      open();
    } else {
      setIsSimulatorOpen(true);
      setLinkMethod('plaid');
      setSelectedBank(sandboxBanks[0]);
      setSimStep(1);
      setSimUsername('user_good');
      setSimPassword('pass_good');
      setSimError('');
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBankName || !manualHolderName || !manualAccountNumber || !manualIfscCode) {
      addToast('Please fill all required Indian banking fields', 'error');
      return;
    }
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
    if (!ifscRegex.test(manualIfscCode)) {
      addToast('Invalid IFSC Code format. E.g., SBIN0001829', 'error');
      return;
    }
    if (manualAccountNumber.length < 9 || manualAccountNumber.length > 18 || !/^\d+$/.test(manualAccountNumber)) {
      addToast('Account Number should be between 9 and 18 digits', 'error');
      return;
    }

    try {
      const res = await axios.post('/api/plaid/link-indian', {
        bankName: manualBankName,
        accountHolderName: manualHolderName,
        accountNumber: manualAccountNumber,
        ifscCode: manualIfscCode.toUpperCase(),
        balance: manualBalance
      });

      if (res.data.success) {
        addToast(`Linked ${manualBankName} successfully!`, 'success');
        setIsSimulatorOpen(false);
        setManualBankName('');
        setManualHolderName('');
        setManualAccountNumber('');
        setManualIfscCode('');
        setManualBalance(0);
        fetchConnections();
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.response?.data?.message || 'Manual link failed.', 'error');
    }
  };

  // Mock exchange submit
  const handleSimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (simUsername !== 'user_good' || simPassword !== 'pass_good') {
      setSimError('Invalid credentials. Use user_good / pass_good for Sandbox.');
      return;
    }

    try {
      const res = await axios.post('/api/plaid/exchange-public-token', {
        publicToken: 'mock-public-token-' + Math.random().toString(36).substring(7),
        institutionName: selectedBank.name,
        institutionId: selectedBank.id,
        isMock: true
      });

      if (res.data.success) {
        setSimStep(3); // Success Screen
      }
    } catch (err) {
      console.error(err);
      setSimError('Simulation failed. Try again.');
    }
  };

  const handleSimFinish = () => {
    setIsSimulatorOpen(false);
    fetchConnections();
  };

  const handleSyncTransactions = async (connectionId: string) => {
    try {
      setSyncingId(connectionId);
      const res = await axios.post('/api/plaid/sync', { connectionId });
      if (res.data.success) {
        addToast(`Sync complete! Pulled ${res.data.count} recent bank transaction logs.`, 'success');
        fetchConnections();
      }
    } catch (err) {
      console.error('Failed to sync bank:', err);
      addToast('Transaction sync failed.', 'error');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!window.confirm('Are you sure you want to disconnect this bank account? This stops auto-sync but retains already imported transactions.')) {
      return;
    }

    try {
      const res = await axios.delete(`/api/plaid/connections/${id}`);
      if (res.data.success) {
        addToast('Bank account disconnected.', 'info');
        fetchConnections();
      }
    } catch (err) {
      console.error('Failed to disconnect bank:', err);
      addToast('Failed to disconnect.', 'error');
    }
  };

  return (
    <div className="relative">
      {/* Lock Overlay */}
      {!isProfileUnlocked && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0b0f19]/60 backdrop-blur-md rounded-3xl border border-gray-800/50 min-h-[400px]">
          <div className="bg-[#151c2c] p-6 rounded-2xl flex flex-col items-center shadow-2xl border border-gray-800">
            <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-4">
              <Fingerprint size={32} />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Banking Locked</h3>
            <p className="text-xs text-gray-400 font-medium text-center max-w-[200px] mb-6">
              Sensitive financial details are hidden. Authenticate to view your connected banks.
            </p>
            <button
              onClick={() => setShowProfileLock(true)}
              className="px-6 py-2.5 rounded-xl font-bold bg-brand-primary hover:bg-indigo-600 text-white shadow-lg transition flex items-center"
            >
              <Lock size={14} className="mr-2" /> Unlock Banking
            </button>
          </div>
        </div>
      )}

      {/* Lock Screen Modal */}
      {showProfileLock && !isProfileUnlocked && (
        <LockScreen type="profile" onUnlock={() => setShowProfileLock(false)} />
      )}

      <div className={`space-y-6 transition-all duration-500 ${!isProfileUnlocked ? 'opacity-30 pointer-events-none select-none filter blur-[8px]' : ''}`}>
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-800 dark:text-white flex items-center gap-2">
            Linked Bank Accounts
            <button 
              onClick={() => setHideBalances(!hideBalances)} 
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition focus:outline-none"
              title={hideBalances ? "Show Balances" : "Hide Balances"}
            >
              {hideBalances ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Link checking and savings accounts via Plaid to sync balances and download transaction ledgers automatically.
          </p>
        </div>
        <button
          onClick={handleLinkClick}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-primary hover:bg-violet-600 shadow-md shadow-violet-500/10 transition duration-200"
        >
          <Plus size={16} />
          <span>Link Bank Account</span>
        </button>
      </div>

      {/* Security Banner */}
      <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 flex items-start space-x-3 text-xs leading-relaxed">
        <Shield size={18} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">End-to-End Secure Bank Integration</p>
          <p className="opacity-80">
            We use Plaid’s 256-bit bank-grade encryption algorithms. Your raw banking credentials are never seen or stored on our servers.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {connections.length === 0 ? (
            <div className="p-12 text-center rounded-2xl glass-panel text-gray-400 font-semibold space-y-4">
              <Building size={48} className="mx-auto text-gray-500 opacity-60" />
              <div>
                <p>No connected bank accounts found.</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click "Link Bank Account" to connect your bank feeds.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {connections.map((conn) => (
                <div key={conn._id} className="p-6 rounded-2xl border border-gray-200 dark:border-dark-border glass-panel flex flex-col justify-between space-y-6">
                  {/* Bank card header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-xl bg-violet-600/10 text-violet-500 flex items-center justify-center shrink-0">
                        <Building size={22} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-800 dark:text-white">
                          {conn.institutionName}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                          Active Sync Connection
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDisconnect(conn._id)}
                      className="p-1.5 rounded-lg border border-brand-danger/20 bg-brand-danger/5 text-brand-danger hover:bg-brand-danger/10 transition"
                      title="Disconnect Institution"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Sub Accounts List */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 dark:border-dark-border/40 pb-1.5">
                      Sub Accounts & Balances
                    </h5>
                    {conn.accounts?.map((acc: any) => (
                      <div key={acc.accountId} className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <CreditCard size={13} className="text-gray-400" />
                          <span className="font-bold text-gray-700 dark:text-gray-200">{acc.name}</span>
                          <span className="text-[10px] text-gray-400 font-semibold">• • • • {acc.mask}</span>
                        </div>
                        <span className="font-black text-gray-800 dark:text-white">
                          ₹{hideBalances ? '••••••' : acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                    {conn.connectionType === 'indian_manual' && (
                      <div className="mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-dark-border/40 space-y-1 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>Holder:</span>
                          <span className="text-gray-700 dark:text-gray-200">{conn.accountHolderName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Account Number:</span>
                          <span className="text-gray-700 dark:text-gray-200">{conn.accountNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>IFSC Code:</span>
                          <span className="text-gray-700 dark:text-gray-200">{conn.ifscCode}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Connection Actions and Last Sync date */}
                  <div className="pt-2 border-t border-gray-200 dark:border-dark-border/40 flex items-center justify-between gap-4 text-[10px] text-gray-400 font-bold">
                    <span>
                      Last sync: {new Date(conn.lastSynced).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                    </span>
                    <button
                      onClick={() => handleSyncTransactions(conn._id)}
                      disabled={syncingId === conn._id}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-brand-primary text-white hover:bg-violet-600 transition shrink-0 shadow-md shadow-violet-500/10 disabled:opacity-50"
                    >
                      <RefreshCw size={11} className={syncingId === conn._id ? 'animate-spin' : ''} />
                      <span>{syncingId === conn._id ? 'Syncing...' : 'Sync Now'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Link Bank Account Modal */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-65 backdrop-blur-xs px-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header banner */}
            <div className="px-5 py-4 flex items-center justify-between text-white bg-slate-900 border-b border-white/5">
              <div className="flex items-center space-x-1.5">
                <Shield size={16} className="text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  {linkMethod === 'plaid' ? 'Plaid Link (Sandbox)' : 'Indian Manual Link'}
                </span>
              </div>
              <button 
                onClick={() => setIsSimulatorOpen(false)} 
                className="p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 dark:border-dark-border/40">
              <button
                type="button"
                onClick={() => setLinkMethod('plaid')}
                className={`flex-grow py-2.5 text-center text-xs font-bold transition ${
                  linkMethod === 'plaid' 
                    ? 'text-brand-primary border-b-2 border-brand-primary bg-violet-600/5' 
                    : 'text-gray-400 hover:text-gray-500'
                }`}
              >
                Plaid OAuth
              </button>
              <button
                type="button"
                onClick={() => setLinkMethod('indian')}
                className={`flex-grow py-2.5 text-center text-xs font-bold transition ${
                  linkMethod === 'indian' 
                    ? 'text-brand-primary border-b-2 border-brand-primary bg-violet-600/5' 
                    : 'text-gray-400 hover:text-gray-500'
                }`}
              >
                Manual Indian Bank
              </button>
            </div>

            {linkMethod === 'plaid' ? (
              <>
                {/* Step 1: Select Sandbox Bank */}
                {simStep === 1 && (
                  <div className="p-5 space-y-4">
                    <div>
                      <h4 className="font-bold text-sm text-gray-800 dark:text-white">Select your Institution</h4>
                      <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                        This is the Plaid sandbox connector simulator. Select one of the pre-configured banks below to proceed.
                      </p>
                    </div>

                    <div className="space-y-2">
                      {sandboxBanks.map((bank) => (
                        <button
                          key={bank.id}
                          onClick={() => {
                            setSelectedBank(bank);
                            setSimStep(2);
                          }}
                          className="w-full p-3 rounded-xl border border-gray-200 dark:border-dark-border/60 bg-gray-50/50 dark:bg-dark-bg/30 flex items-center justify-between hover:border-brand-primary hover:bg-brand-primary/5 transition text-left"
                        >
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{bank.name}</span>
                          <ArrowRight size={14} className="text-gray-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Login Credentials Form */}
                {simStep === 2 && selectedBank && (
                  <form onSubmit={handleSimSubmit} className="p-5 space-y-4 text-xs font-semibold text-gray-700 dark:text-gray-200">
                    <div>
                      <h4 className="font-bold text-sm text-gray-800 dark:text-white flex items-center">
                        Login to {selectedBank.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-normal">
                        Enter credentials to authenticate item exchange.
                      </p>
                    </div>

                    {simError && (
                      <div className="p-2.5 rounded-lg border border-brand-danger/20 bg-brand-danger/5 text-brand-danger text-[10px]">
                        {simError}
                      </div>
                    )}

                    <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px]">
                      <p className="font-bold flex items-center space-x-1 mb-1">
                        <AlertCircle size={12} />
                        <span>DEMO MODE ACTIVE</span>
                      </p>
                      <p className="opacity-90 leading-relaxed mb-2">
                        Real Plaid API keys are not configured. Do <strong>NOT</strong> enter your real bank credentials. Use the pre-filled demo credentials below to simulate a connection.
                      </p>
                      <div className="bg-amber-500/10 p-2 rounded flex flex-col gap-1">
                        <p>Username: <code className="font-bold">user_good</code></p>
                        <p>Password: <code className="font-bold">pass_good</code></p>
                      </div>
                    </div>

                    {/* Username */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-400 font-bold uppercase">Online Username</label>
                      <input
                        type="text"
                        required
                        value={simUsername}
                        onChange={(e) => setSimUsername(e.target.value)}
                        className="w-full px-3 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-xs font-bold text-gray-800 dark:text-white"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-400 font-bold uppercase">Online Password</label>
                      <input
                        type="password"
                        required
                        value={simPassword}
                        onChange={(e) => setSimPassword(e.target.value)}
                        className="w-full px-3 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-xs font-bold text-gray-800 dark:text-white"
                      />
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setSimStep(1)}
                        className="flex-grow py-2 rounded-xl border border-gray-200 dark:border-dark-border text-gray-400 text-center font-bold"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="flex-grow py-2 rounded-xl text-white bg-brand-primary hover:bg-violet-600 font-bold"
                      >
                        Authenticate
                      </button>
                    </div>
                  </form>
                )}

                {/* Step 3: Success Screen */}
                {simStep === 3 && selectedBank && (
                  <div className="p-5 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-brand-success/15 border border-brand-success/30 flex items-center justify-center text-brand-success">
                      <CheckCircle size={24} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-800 dark:text-white">Connection Successful!</h4>
                      <p className="text-[10px] text-gray-400 mt-1 max-w-[240px] leading-normal">
                        {selectedBank.name} has been linked. You can close this sandbox link widget now and trigger transaction syncing.
                      </p>
                    </div>
                    <button
                      onClick={handleSimFinish}
                      className="w-full py-2.5 rounded-xl font-bold bg-brand-success text-white hover:bg-emerald-600 text-xs shadow-md shadow-emerald-500/10 transition"
                    >
                      Close Link Widget
                    </button>
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleManualSubmit} className="p-5 space-y-4 text-xs font-semibold text-gray-700 dark:text-gray-200">
                <div>
                  <h4 className="font-bold text-sm text-gray-800 dark:text-white">Manual Indian Banking Link</h4>
                  <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                    Enter bank, holder name, IFSC, and Account number to link.
                  </p>
                </div>

                {/* Bank Name */}
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">Bank Name</label>
                  <input
                    type="text"
                    required
                    list="indian-banks-list"
                    placeholder="e.g. State Bank of India"
                    value={manualBankName}
                    onChange={(e) => setManualBankName(e.target.value)}
                    className="w-full px-3 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-xs font-bold text-gray-800 dark:text-white"
                  />
                  <datalist id="indian-banks-list">
                    {indianBanks.map((bank, idx) => (
                      <option key={idx} value={bank} />
                    ))}
                  </datalist>
                </div>

                {/* Holder Name */}
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">Account Holder Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amit Sharma"
                    value={manualHolderName}
                    onChange={(e) => setManualHolderName(e.target.value)}
                    className="w-full px-3 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-xs font-bold text-gray-800 dark:text-white"
                  />
                </div>

                {/* Account Number */}
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">Account Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9182049281"
                    value={manualAccountNumber}
                    onChange={(e) => setManualAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-xs font-bold text-gray-800 dark:text-white"
                  />
                </div>

                {/* IFSC Code */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] text-gray-400 font-bold uppercase">IFSC Code</label>
                    <a href="https://www.bankbazaar.com/ifsc-code.html" target="_blank" rel="noreferrer" className="text-[8px] text-brand-info hover:text-indigo-500 hover:underline font-bold transition">
                      Find IFSC Code
                    </a>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SBIN0001829"
                    value={manualIfscCode}
                    onChange={(e) => setManualIfscCode(e.target.value)}
                    className="w-full px-3 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-xs font-bold text-gray-800 dark:text-white"
                  />
                </div>

                {/* Opening Balance */}
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">Opening Balance (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 15000"
                    value={manualBalance || ''}
                    onChange={(e) => setManualBalance(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 outline-none rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-xs font-bold text-gray-800 dark:text-white"
                  />
                </div>

                {/* Actions */}
                <div className="pt-2 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsSimulatorOpen(false)}
                    className="flex-grow py-2 rounded-xl border border-gray-200 dark:border-dark-border text-gray-400 text-center font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-grow py-2 rounded-xl text-white bg-brand-primary hover:bg-violet-600 font-bold"
                  >
                    Link Account
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default BankLink;
