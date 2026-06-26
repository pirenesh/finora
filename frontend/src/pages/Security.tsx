import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Shield, ShieldAlert, Key, Smartphone, Clock, Mail, CheckCircle, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export const Security = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSecurityData = async () => {
      try {
        const res = await axios.get('/api/security/dashboard');
        setData(res.data.data);
      } catch (error) {
        console.error('Failed to load security data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const score = data?.securityScore || 0;
  let scoreColor = 'text-brand-danger';
  if (score >= 80) scoreColor = 'text-brand-success';
  else if (score >= 50) scoreColor = 'text-brand-warning';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
          <Shield className="text-brand-primary" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Security Center</h1>
          <p className="text-sm text-gray-400">Manage your account security and activity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center space-y-4 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          <div className={`text-5xl font-black ${scoreColor}`}>
            {score}/100
          </div>
          <div className="text-sm text-gray-400 font-semibold uppercase tracking-widest">
            Security Score
          </div>
        </div>

        {/* Verification Status */}
        <div className="md:col-span-2 glass-panel p-6 rounded-3xl border border-white/5 shadow-xl space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 blur-3xl pointer-events-none" />
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider relative z-10">Account Status</h3>
          <div className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-2xl border border-white/5 relative z-10">
            <div className="flex items-center space-x-3">
              <Mail className={data?.isEmailVerified ? "text-brand-success" : "text-brand-warning"} size={20} />
              <div>
                <div className="text-sm font-bold text-white">Email Verification</div>
                <div className="text-xs text-gray-400">{user?.email}</div>
              </div>
            </div>
            {data?.isEmailVerified ? (
              <span className="flex items-center text-xs font-bold text-brand-success bg-brand-success/10 px-3 py-1 rounded-full">
                <CheckCircle size={14} className="mr-1" /> Verified
              </span>
            ) : (
              <span className="flex items-center text-xs font-bold text-brand-warning bg-brand-warning/10 px-3 py-1 rounded-full">
                <ShieldAlert size={14} className="mr-1" /> Unverified
              </span>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-xl border border-dark-border/50">
            <div className="flex items-center space-x-3">
              <Fingerprint className="text-brand-info" size={20} />
              <div>
                <div className="text-sm font-bold text-white">App Lock (PIN/Biometric)</div>
                <div className="text-xs text-gray-400">Secures your dashboard and bank links</div>
              </div>
            </div>
            <span className="flex items-center text-xs font-bold text-brand-info bg-brand-info/10 px-3 py-1.5 rounded-full border border-brand-info/20">
               Active
            </span>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="glass-panel rounded-3xl border border-white/5 shadow-xl overflow-hidden mt-6">
        <div className="p-6 border-b border-white/5 bg-white/5">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center">
            <Clock size={16} className="mr-2 text-brand-primary" /> Recent Activity
          </h3>
        </div>
        <div className="divide-y divide-white/5">
          {data?.recentActivity?.length > 0 ? (
            data.recentActivity.map((log: any, i: number) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-dark-bg/30 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${
                    log.action.includes('SUCCESS') ? 'bg-brand-success/10 text-brand-success' :
                    log.action.includes('FAILED') ? 'bg-brand-danger/10 text-brand-danger' :
                    'bg-brand-primary/10 text-brand-primary'
                  }`}>
                    {log.action.includes('PASSWORD') ? <Key size={16} /> : <Smartphone size={16} />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white capitalize">
                      {log.action.replace('_', ' ').toLowerCase()}
                    </div>
                    <div className="text-xs text-gray-500">
                      IP: {log.ipAddress || 'Unknown'} • {log.deviceInfo ? log.deviceInfo.split(' ')[0] : 'Unknown Device'}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-semibold text-gray-400">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-gray-400">
              No recent activity found.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
