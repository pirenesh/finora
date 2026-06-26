import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  RefreshCw,
  Globe,
  Briefcase
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Market = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/market/insights');
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch market insights", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, []);

  const renderChange = (change: number) => {
    const isPos = change >= 0;
    return (
      <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-md ${isPos ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-danger/10 text-brand-danger'}`}>
        {isPos ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
        {Math.abs(change).toFixed(2)}%
      </div>
    );
  };

  const renderCard = (title: string, value: string, change: number, Icon: any, colorClass: string) => (
    <motion.div 
      variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}
      className={`p-5 rounded-2xl glass-panel hover-glow border border-white/5 relative overflow-hidden`}
    >
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-2.5 rounded-xl bg-dark-bg ${colorClass} border border-white/5 shadow-inner`}>
          <Icon size={20} />
        </div>
        {renderChange(change)}
      </div>
      <div className="relative z-10">
        <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</h4>
        <div className="text-2xl font-black text-white">{value}</div>
      </div>
    </motion.div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-panel p-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Market Dashboard
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Live insights on global indices, metals, and cryptocurrencies.
          </p>
        </div>
        <button
          onClick={fetchMarketData}
          disabled={loading}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-primary hover:bg-emerald-500 shadow-md transition duration-200"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {loading || !data ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <motion.div 
          className="space-y-8"
          initial="hidden" animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
        >
          {/* Commodities */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
              <Activity size={16} className="mr-2 text-brand-primary" />
              Precious Metals
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {renderCard('Gold', `₹${data.metals.gold.price}`, data.metals.gold.change, Activity, 'text-yellow-400')}
              {renderCard('Silver', `₹${data.metals.silver.price}`, data.metals.silver.change, Activity, 'text-gray-300')}
            </div>
          </div>

          {/* Crypto */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
              <Globe size={16} className="mr-2 text-brand-secondary" />
              Cryptocurrencies
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {renderCard('Bitcoin (BTC)', `₹${data.crypto.bitcoin.price.toLocaleString()}`, data.crypto.bitcoin.change, Globe, 'text-orange-500')}
            </div>
          </div>

          {/* Global Indices */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
              <Briefcase size={16} className="mr-2 text-brand-info" />
              Global Indices
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {renderCard('NIFTY 50', data.indianMarkets.nifty50.value.toLocaleString(), data.indianMarkets.nifty50.change, Briefcase, 'text-blue-400')}
              {renderCard('SENSEX', data.indianMarkets.sensex.value.toLocaleString(), data.indianMarkets.sensex.change, Briefcase, 'text-blue-500')}
              {renderCard('NASDAQ', data.international.nasdaq.value.toLocaleString(), data.international.nasdaq.change, Briefcase, 'text-brand-info')}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="glass-panel p-6">
              <h3 className="text-sm font-bold text-brand-success uppercase tracking-wider mb-4">Top Gainers</h3>
              <div className="space-y-3">
                {data.trending.slice(0, 3).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-dark-bg/50 border border-white/5">
                    <span className="font-bold text-white">{item.symbol}</span>
                    {renderChange(item.change)}
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-panel p-6">
              <h3 className="text-sm font-bold text-brand-danger uppercase tracking-wider mb-4">Top Losers</h3>
              <div className="space-y-3">
                {data.trending.slice(3, 6).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-dark-bg/50 border border-white/5">
                    <span className="font-bold text-white">{item.symbol}</span>
                    {renderChange(item.change)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
export default Market;
