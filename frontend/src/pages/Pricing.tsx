import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LandingNavbar } from '../components/LandingNavbar';
import { Footer } from '../components/Footer';
import { Check, ShieldAlert, Sparkles, Zap } from 'lucide-react';

export const Pricing = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const handleSubscribePro = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      // Simulate upgrading subscription in backend
      const success = await updateProfile({ role: 'pro' });
      if (success) {
        alert('Congratulations! You have successfully upgraded to the Pro Tier. FinBot AI and advanced PDF reports are now unlocked.');
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      alert('Subscription upgrade failed.');
    }
  };

  const tiers = [
    {
      name: 'Free Basic',
      price: '₹0',
      period: 'forever',
      description: 'Standard bookkeeping console for retail users.',
      features: [
        'Sync Income & Expense logs',
        'Visual Cash Flow aggregates',
        'Basic budget caps tracking',
        'Standard dashboard cards'
      ],
      restricted: [
        'FinBot AI Chatbot access',
        'Cached monthly health reports',
        'Budget overrun warnings',
        'PDF statement printing'
      ],
      buttonText: 'Current Plan',
      isPro: false
    },
    {
      name: 'Pro Premium',
      price: '₹499',
      period: 'month',
      description: 'Advanced wealth engine with Gemini-powered AI diagnostic.',
      features: [
        'Everything in Free Basic',
        'Unlimited FinBot AI Chat queries',
        'Monthly AI financial health reports',
        'Predictive expense projections',
        'PDF statement & Excel CSV exports',
        'Overrun alert notifications'
      ],
      restricted: [],
      buttonText: 'Upgrade to Pro Premium',
      isPro: true
    },
    {
      name: 'Enterprise Console',
      price: 'Custom',
      period: 'custom pricing',
      description: 'Wealth consolidation tools for registered advisors.',
      features: [
        'Everything in Pro Premium',
        'Multi-client dashboard consolidation',
        'Custom advisor white-labeling',
        'API hooks for external bank feeds',
        'SLA guaranteed dedicated support'
      ],
      restricted: [],
      buttonText: 'Contact Sales',
      isPro: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#f3f4f6] flex flex-col relative overflow-hidden">
      
      {/* Background glowing blobs */}
      <div className="glow-blob w-[500px] h-[500px] bg-brand-primary -top-40 -left-40 animate-pulse-slow"></div>
      <div className="glow-blob w-[400px] h-[400px] bg-brand-info -bottom-20 -right-20 animate-pulse-slow" style={{ animationDelay: '3s' }}></div>

      <LandingNavbar />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 md:py-24 relative z-10 w-full">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border border-brand-primary/20 bg-brand-primary/5 text-[10px] font-bold text-brand-primary">
            <Zap size={10} />
            <span>SAAS SUBSCRIPTIONS</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white">Plan Tiers & Pricing</h1>
          <p className="text-xs sm:text-sm text-gray-400 font-semibold max-w-md mx-auto leading-relaxed">
            Choose the subscription plan that fits your financial goals. Upgrade or downgrade at any time.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {tiers.map((tier, idx) => (
            <div 
              key={idx}
              className={`
                p-6 rounded-3xl border flex flex-col justify-between
                ${tier.isPro 
                  ? 'border-brand-primary bg-[#151c2c]/85 shadow-xl shadow-brand-primary/5 scale-105 z-10' 
                  : 'border-gray-800 bg-[#151c2c]/40 backdrop-blur-md'}
              `}
            >
              {/* Card Header */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-gray-300 uppercase tracking-wider">{tier.name}</h3>
                  {tier.isPro && (
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-brand-primary text-white flex items-center space-x-0.5 animate-pulse">
                      <Sparkles size={8} />
                      <span>Most Popular</span>
                    </span>
                  )}
                </div>

                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl sm:text-4xl font-black text-white">{tier.price}</span>
                  <span className="text-xs text-gray-400 font-semibold">/ {tier.period}</span>
                </div>

                <p className="text-xs text-gray-400 font-medium leading-relaxed">{tier.description}</p>
                <hr className="border-gray-800/80 my-4" />

                {/* Features List */}
                <ul className="space-y-2.5 text-xs text-gray-300 font-semibold">
                  {tier.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start space-x-2">
                      <Check size={14} className="text-brand-success shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                  {tier.restricted.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start space-x-2 opacity-45">
                      <ShieldAlert size={14} className="text-brand-danger shrink-0 mt-0.5" />
                      <span className="line-through">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-8">
                {tier.isPro ? (
                  <button
                    onClick={handleSubscribePro}
                    className="w-full py-3.5 rounded-2xl font-bold bg-brand-primary hover:bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-brand-primary/20 transition-all duration-200"
                  >
                    {user?.role === 'pro' ? 'Already Active' : tier.buttonText}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (!tier.price.includes('0')) {
                        alert('Enterprise support is a SaaS mock demo. Pro Tier satisfies all advanced AI options.');
                      } else {
                        navigate('/register');
                      }
                    }}
                    disabled={!!user && tier.price.includes('0')}
                    className={`
                      w-full py-3.5 rounded-2xl font-bold transition-all duration-200
                      ${!!user && tier.price.includes('0')
                        ? 'bg-gray-800/50 text-gray-500 cursor-default border border-gray-800' 
                        : 'border border-gray-800 bg-[#151c2c]/40 hover:bg-[#151c2c]/85 hover:border-gray-700 text-gray-300'}
                    `}
                  >
                    {!!user && tier.price.includes('0') ? 'Active Base Tier' : tier.buttonText}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};
export default Pricing;
