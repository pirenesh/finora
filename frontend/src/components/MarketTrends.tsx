import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Sparkles, 
  LineChart, 
  Coins, 
  RefreshCw, 
  Globe, 
  Briefcase,
  X,
  ChevronRight
} from 'lucide-react';

interface MarketTrendsProps {
  isHidden?: boolean;
}

export const MarketTrends = ({ isHidden = false }: MarketTrendsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'markets' | 'crypto' | 'metals' | 'funds' | 'global'>('markets');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

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

  const renderChange = (change: number, size: 'sm' | 'md' = 'sm') => {
    const isPos = change >= 0;
    if (size === 'sm') {
      return (
        <span className={`ml-1 font-bold ${isPos ? 'text-green-400' : 'text-red-400'}`}>
          {isPos ? '▲' : '▼'}
        </span>
      );
    }
    return (
      <div className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded-md ${isPos ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
        {isPos ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
        {Math.abs(change)}%
      </div>
    );
  };

  const getTickerItems = () => {
    if (!data) return [{ id: 'loading', label: 'Loading live markets...', value: '', change: 0 }];
    return [
      { id: 'gold', label: 'Gold', value: `₹${data.metals.gold.price}`, change: data.metals.gold.change, rawData: data.metals.gold },
      { id: 'silver', label: 'Silver', value: `₹${data.metals.silver.price}`, change: data.metals.silver.change, rawData: data.metals.silver },
      { id: 'btc', label: 'BTC', value: `₹${data.crypto.bitcoin.price.toLocaleString()}`, change: data.crypto.bitcoin.change, rawData: data.crypto.bitcoin },
      { id: 'nifty', label: 'Nifty', value: data.indianMarkets.nifty50.value.toLocaleString(), change: data.indianMarkets.nifty50.change, rawData: data.indianMarkets.nifty50 },
      { id: 'sensex', label: 'Sensex', value: data.indianMarkets.sensex.value.toLocaleString(), change: data.indianMarkets.sensex.change, rawData: data.indianMarkets.sensex },
      { id: 'nasdaq', label: 'NASDAQ', value: data.international.nasdaq.value.toLocaleString(), change: data.international.nasdaq.change, rawData: data.international.nasdaq },
    ];
  };

  const renderRow = (icon: any, title: string, value: string | number, change?: number, subtitle?: string) => (
    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-dark-bg/50 rounded-lg border border-white/10 shadow-inner">
          {icon}
        </div>
        <div>
          <span className="text-sm font-bold text-white block">{title}</span>
          {subtitle && <span className="text-[10px] text-gray-400 uppercase tracking-wider">{subtitle}</span>}
        </div>
      </div>
      <div className="text-right flex flex-col items-end">
        <div className="text-sm font-black text-white">{value}</div>
        {change !== undefined && renderChange(change, 'md')}
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading || !data) {
      return (
        <div className="space-y-3 animate-pulse p-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg"></div>
                <div className="w-24 h-4 bg-white/10 rounded"></div>
              </div>
              <div className="w-16 h-4 bg-white/10 rounded"></div>
            </div>
          ))}
        </div>
      );
    }

    switch (activeTab) {
      case 'metals':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
            {renderRow(<Sparkles className="text-yellow-400" size={16} />, "Gold (24K)", `₹${data.metals.gold.price}`, data.metals.gold.change, data.metals.gold.unit)}
            {renderRow(<Sparkles className="text-gray-300" size={16} />, "Silver", `₹${data.metals.silver.price}`, data.metals.silver.change, data.metals.silver.unit)}
          </div>
        );
      case 'crypto':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
            {renderRow(<Coins className="text-brand-warning" size={16} />, "Bitcoin", `₹${data.crypto.bitcoin.price.toLocaleString()}`, data.crypto.bitcoin.change, data.crypto.bitcoin.symbol)}
            {renderRow(<Coins className="text-brand-info" size={16} />, "Ethereum", `₹${data.crypto.ethereum.price.toLocaleString()}`, data.crypto.ethereum.change, data.crypto.ethereum.symbol)}
          </div>
        );
      case 'markets':
        return (
          <div className="space-y-3 p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderRow(<LineChart className="text-brand-success" size={16} />, "Nifty 50", data.indianMarkets.nifty50.value, data.indianMarkets.nifty50.change, "NSE")}
              {renderRow(<LineChart className="text-brand-success" size={16} />, "Sensex", data.indianMarkets.sensex.value, data.indianMarkets.sensex.change, "BSE")}
            </div>
            <div className="pt-2 border-t border-white/10 mt-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-2 block">Top Gainers</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {data.indianMarkets.topGainers?.map((g: any, i: number) => 
                  renderRow(<TrendingUp className="text-brand-success" size={14} />, g.symbol, "", g.change)
                )}
              </div>
            </div>
          </div>
        );
      case 'funds':
        return (
          <div className="space-y-3 p-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 block mb-1">Trending SIPs (1Y Return)</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {data.mutualFunds.map((mf: any, i: number) => 
                renderRow(<Briefcase className="text-brand-primary" size={16} />, mf.name, `${mf.returns1Y}%`, undefined, `Min SIP: ₹${mf.sipMin}`)
              )}
            </div>
          </div>
        );
      case 'global':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-2">
            {renderRow(<Globe className="text-brand-info" size={16} />, "NASDAQ", data.international.nasdaq.value, data.international.nasdaq.change, "USA")}
            {renderRow(<Globe className="text-brand-info" size={16} />, "S&P 500", data.international.sp500.value, data.international.sp500.change, "USA")}
            {renderRow(<Globe className="text-brand-info" size={16} />, "Dow Jones", data.international.dowJones.value, data.international.dowJones.change, "USA")}
          </div>
        );
    }
  };

  const tickerItems = getTickerItems();
  const marqueeItems = [...tickerItems, ...tickerItems];

  const renderAssetModal = () => {
    if (!selectedAsset) return null;
    
    const { id, label, value, change, rawData } = selectedAsset;
    const isPos = change >= 0;

    let modalContent = null;

    if (id === 'gold') {
      const price24K = rawData.price;
      const price22K = Math.round(price24K * 0.916);
      const price18K = Math.round(price24K * 0.75);
      
      modalContent = (
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🥇</div>
            <h2 className="text-xl font-bold text-white mb-1">Gold (24K)</h2>
            <div className="text-3xl font-black text-brand-primary mb-2">₹{price24K.toLocaleString()} <span className="text-sm font-medium text-gray-400">/ gram</span></div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${isPos ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isPos ? '▲' : '▼'} {Math.abs(change)}% Today
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-5 mb-5">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Purity Breakdown</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">22K (Standard)</div>
                <div className="text-white font-bold text-lg">₹{price22K.toLocaleString()}</div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">18K (Jewelry)</div>
                <div className="text-white font-bold text-lg">₹{price18K.toLocaleString()}</div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">10 Grams (24K)</div>
                <div className="text-white font-bold text-lg">₹{(price24K * 10).toLocaleString()}</div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">100 Grams (24K)</div>
                <div className="text-white font-bold text-lg">₹{(price24K * 100).toLocaleString()}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-xl p-4 mb-4">
            <p className="text-xs text-white leading-relaxed">
              Gold is {isPos ? 'up' : 'down'} today. Good time to hold. Import duty + GST included in Indian price.
            </p>
          </div>
          <div className="text-xs text-center text-gray-400">
            <span className="font-bold">Best for:</span> Long term hedge, SGB, Gold ETF
          </div>
        </div>
      );
    } 
    else if (id === 'silver') {
      const price = rawData.price;
      
      modalContent = (
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🥈</div>
            <h2 className="text-xl font-bold text-white mb-1">Silver</h2>
            <div className="text-3xl font-black text-gray-300 mb-2">₹{price.toLocaleString()} <span className="text-sm font-medium text-gray-500">/ gram</span></div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${isPos ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isPos ? '▲' : '▼'} {Math.abs(change)}% Today
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-5 mb-5 grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
              <div className="text-xs text-gray-400 uppercase font-bold mb-1">Per Gram</div>
              <div className="text-white font-bold text-xl">₹{price.toLocaleString()}</div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
              <div className="text-xs text-gray-400 uppercase font-bold mb-1">Per KG</div>
              <div className="text-white font-bold text-xl">₹{(price * 1000).toLocaleString()}</div>
            </div>
          </div>
          
          <div className="text-xs text-center text-gray-400 mt-6 bg-white/5 py-3 rounded-lg">
            <span className="font-bold text-white">Best for:</span> Industrial investment, Silver ETF
          </div>
        </div>
      );
    }
    else if (id === 'btc') {
      const price = rawData.price;
      // Estimate USD value (fallback if no USD/INR rate available)
      const usdInr = 84.5; 
      const usdVal = Math.round(price / usdInr);
      
      modalContent = (
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">₿</div>
            <h2 className="text-xl font-bold text-white mb-1">Bitcoin (BTC)</h2>
            <div className="text-3xl font-black text-[#F7931A] mb-1">₹{price.toLocaleString()}</div>
            <div className="text-sm text-gray-400 font-bold mb-3">~${usdVal.toLocaleString()} USD</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${isPos ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isPos ? '▲' : '▼'} {Math.abs(change)}% Today
            </div>
          </div>
          
          <div className="bg-[#F7931A]/10 border border-[#F7931A]/20 rounded-xl p-4 mb-4 mt-6">
            <p className="text-xs text-white leading-relaxed text-center">
              Market sentiment is {isPos ? 'bullish' : 'bearish'} today. High volatility asset.
            </p>
          </div>
          <div className="text-xs text-center text-gray-400 mt-2">
            <span className="font-bold text-white">Best for:</span> High risk, long term crypto allocation
          </div>
        </div>
      );
    }
    else {
      // General Index (Nifty, Sensex, NASDAQ)
      modalContent = (
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-brand-info/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-info/30">
              <Globe className="text-brand-info" size={32} />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{label}</h2>
            <div className="text-3xl font-black text-white mb-2">{rawData.value ? rawData.value.toLocaleString() : value}</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${isPos ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isPos ? '▲' : '▼'} {Math.abs(change)}% Today
            </div>
          </div>
          
          {data.indianMarkets.topGainers && id === 'nifty' && (
            <div className="border-t border-white/10 pt-5 mb-5">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Top Movers</h4>
              <div className="space-y-2">
                {data.indianMarkets.topGainers.map((g: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-white/5 p-2 px-3 rounded-lg">
                    <span className="font-bold text-sm text-white">{g.symbol}</span>
                    <span className="text-brand-success font-bold text-xs">▲ {g.change}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-6">
            <p className="text-xs text-gray-300 leading-relaxed text-center">
              The {label} index represents a major benchmark for {id === 'nasdaq' ? 'tech and global equities' : 'Indian market performance'}.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center sm:justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
          onClick={() => setSelectedAsset(null)} 
        />
        
        {/* Bottom Sheet / Modal */}
        <div className="relative w-full sm:w-[420px] bg-[#1a1400] border-t sm:border border-[#d4af37] rounded-t-[24px] sm:rounded-[24px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300 ease-out z-10">
          <button 
            onClick={() => setSelectedAsset(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20"
          >
            <X size={16} className="text-white" />
          </button>
          {modalContent}
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full relative z-40 ${isHidden ? 'hidden' : ''}`}>
      {/* Ticker Bar (Always Visible & Sticky) */}
      {!selectedAsset && (
        <div className="h-12 w-full bg-[#1a1400] flex items-center justify-between overflow-hidden shadow-lg border-y border-[#d4af37] relative">
          
          {/* Left Side: Indicator */}
          <div className="flex-shrink-0 h-full flex items-center px-4 bg-[#1a1400] z-10 border-r border-[#d4af37] shadow-[4px_0_15px_rgba(10,8,0,1)]">
            <span className="relative flex h-2.5 w-2.5 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ef4444] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ef4444]"></span>
            </span>
            <span className="text-xs font-black text-[#d4af37] uppercase tracking-widest hidden sm:block">Live Markets</span>
            <span className="text-xs font-black text-[#d4af37] uppercase tracking-widest sm:hidden">Live</span>
          </div>

          {/* Middle: Scrolling Ticker */}
          <div className="flex-1 overflow-hidden h-full flex items-center relative mask-image-edges">
            <div className="ticker-content flex items-center h-full">
              {marqueeItems.map((item, idx) => (
                item.id === 'loading' ? (
                  <div key={idx} className="flex items-center mx-6 text-sm whitespace-nowrap text-gray-400">
                    {item.label}
                  </div>
                ) : (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedAsset(item)}
                    className="flex items-center mx-6 text-sm whitespace-nowrap hover:bg-white/5 px-2 py-1 rounded-md transition-colors group cursor-pointer"
                  >
                    <span className="text-[#8a7a40] font-semibold mr-2 group-hover:text-[#d4af37] transition-colors">{item.label}</span>
                    <span className="text-[#d4af37] font-bold">{item.value}</span>
                    {item.value && renderChange(item.change, 'sm')}
                    <span className="text-white/20 ml-6 hidden group-hover:inline-block opacity-0 group-hover:opacity-100 transition-opacity">|</span>
                    <span className="text-white/20 ml-6 group-hover:hidden transition-opacity">|</span>
                  </button>
                )
              ))}
            </div>
          </div>

          {/* Right Side: Button */}
          <div 
            className="flex-shrink-0 h-full flex items-center px-4 bg-[#16213e] z-10 border-l border-white/5 cursor-pointer hover:bg-white/5 transition group shadow-[-4px_0_15px_rgba(22,33,62,1)]"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span className="text-xs font-bold text-gray-300 group-hover:text-white transition hidden sm:block mr-1">
              {isExpanded ? 'Close Details' : 'View Details'}
            </span>
            {isExpanded ? <X size={16} className="text-gray-400 group-hover:text-white" /> : <ChevronRight size={16} className="text-gray-400 group-hover:text-white" />}
          </div>
        </div>
      )}

      {/* Expanded Panel (Absolute dropdown overlay) */}
      {isExpanded && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0b0e26]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-40 animate-in fade-in slide-in-from-top-2 duration-300">
          
          <div className="p-4 flex items-center justify-between border-b border-white/5 bg-white/5">
            <h3 className="text-sm font-bold text-white flex items-center">
              <Activity size={16} className="mr-2 text-brand-primary" />
              Market Deep Dive
            </h3>
            <button 
              onClick={() => setIsExpanded(false)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition"
            >
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          <div className="p-4 sm:p-5">
            {/* Tabs */}
            <div className="flex overflow-x-auto hide-scrollbar space-x-2 pb-4 mb-2">
              {[
                { id: 'markets', icon: <LineChart size={14} />, label: 'Markets' },
                { id: 'crypto', icon: <Coins size={14} />, label: 'Crypto' },
                { id: 'metals', icon: <Sparkles size={14} />, label: 'Metals' },
                { id: 'funds', icon: <Briefcase size={14} />, label: 'Funds' },
                { id: 'global', icon: <Globe size={14} />, label: 'Global' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Data Content */}
            <div className="min-h-[200px]">
              {renderContent()}
            </div>

            {/* AI Tip Section */}
            <div className="mt-6">
              {loading ? (
                <div className="w-full bg-gradient-to-r from-brand-primary/20 to-brand-info/10 border border-brand-primary/20 rounded-xl p-4 flex items-start space-x-4 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/30 flex-shrink-0"></div>
                  <div className="space-y-2 w-full mt-1">
                    <div className="h-3 bg-brand-primary/30 rounded w-1/4"></div>
                    <div className="h-2 bg-white/10 rounded w-full mt-2"></div>
                    <div className="h-2 bg-white/10 rounded w-5/6"></div>
                  </div>
                </div>
              ) : data?.aiTip ? (
                <div className="w-full bg-gradient-to-r from-brand-primary/20 to-brand-info/10 border border-brand-primary/20 rounded-xl p-4 flex items-start space-x-4 shadow-lg shadow-brand-primary/10 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-primary/20 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div className="bg-brand-primary/20 p-2 rounded-xl flex-shrink-0 relative z-10 border border-brand-primary/30">
                    <Sparkles size={24} className="text-brand-primary animate-pulse-slow" />
                  </div>
                  <div className="relative z-10 flex-1">
                    <h4 className="text-[10px] font-black uppercase text-brand-primary tracking-widest mb-1.5 flex items-center justify-between">
                      Today's AI Investment Tip
                      <span className="text-gray-500 text-[9px] font-medium hidden sm:block">Powered by Gemini</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-white font-medium leading-relaxed">{data.aiTip}</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
              <span className="text-[10px] text-gray-500">
                {data?.lastUpdated ? `Last updated: ${new Date(data.lastUpdated).toLocaleTimeString()}` : 'Live Data'}
              </span>
              <button 
                onClick={fetchMarketData}
                disabled={loading}
                className="flex items-center space-x-1.5 text-[10px] font-bold text-gray-400 hover:text-white transition disabled:opacity-50"
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Asset Modals */}
      {renderAssetModal()}
    </div>
  );
};
