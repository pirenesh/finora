import React from 'react';
import { LandingNavbar } from '../components/LandingNavbar';
import { Footer } from '../components/Footer';
import { Sparkles, Brain, Landmark, Target, TrendingUp, Wallet, ShieldCheck, Zap, PieChart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const About = () => {
  const { t } = useTranslation();

  const features = [
    {
      title: t('landing.features.finbotTitle'),
      description: t('landing.features.finbotDesc'),
      icon: Brain,
      color: 'text-brand-primary bg-brand-primary/10'
    },
    {
      title: t('landing.features.chartsTitle'),
      description: t('landing.features.chartsDesc'),
      icon: PieChart,
      color: 'text-brand-info bg-brand-info/10'
    },
    {
      title: t('landing.features.budgetsTitle'),
      description: t('landing.features.budgetsDesc'),
      icon: Wallet,
      color: 'text-brand-warning bg-brand-warning/10'
    },
    {
      title: t('landing.features.exportsTitle'),
      description: t('landing.features.exportsDesc'),
      icon: ShieldCheck,
      color: 'text-brand-success bg-brand-success/10'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#f3f4f6] flex flex-col relative overflow-hidden">
      
      {/* Background glowing blobs */}
      <div className="glow-blob w-[500px] h-[500px] bg-brand-primary -top-40 -left-40 animate-pulse-slow"></div>
      <div className="glow-blob w-[400px] h-[400px] bg-brand-info -bottom-20 -right-20 animate-pulse-slow" style={{ animationDelay: '3s' }}></div>

      <LandingNavbar />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 md:py-24 relative z-10 w-full space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-5xl font-black text-white">Our Mission</h1>
          <p className="text-xs sm:text-sm text-gray-400 font-semibold max-w-lg mx-auto leading-relaxed">
            Democratic, transparent, and AI-first bookkeeping consoles for retail users around the globe.
          </p>
        </div>

        {/* Content Panel */}
        <div className="p-6 sm:p-8 rounded-3xl border border-gray-800 bg-[#151c2c]/40 backdrop-blur-md space-y-6 text-xs sm:text-sm text-gray-300 leading-relaxed font-semibold">
          <p>
            At <strong>FinBot AI</strong>, we believe that wealth management shouldn't require complex corporate financial advisors or expensive banking brokers. By combining standard accounting ledgers with state-of-the-art Large Language Models (LLMs) from Google Gemini, we provide retail users with an autonomous personal finance concierge.
          </p>
          <p>
            Our core mission revolves around three key design principles:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-left">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                <Brain size={16} />
              </div>
              <h4 className="font-bold text-xs text-white">AI-First Aggregation</h4>
              <p className="text-[10px] text-gray-400">
                Automated diagnostics compute savings margins, alerts, and SIP forecasts without manual spreadsheets.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-brand-info/10 flex items-center justify-center text-brand-info">
                <Target size={16} />
              </div>
              <h4 className="font-bold text-xs text-white">Strict Budget Guardrails</h4>
              <p className="text-[10px] text-gray-400">
                Persistent warning flags and in-dashboard notifications prevent budget overflows before they occur.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-brand-success/10 flex items-center justify-center text-brand-success">
                <Landmark size={16} />
              </div>
              <h4 className="font-bold text-xs text-white">Compound Interest Education</h4>
              <p className="text-[10px] text-gray-400">
                Empower users with investment suggestions (SIPs, Emergency reserves, Mutual funds) to grow assets.
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid Section Moved from Landing */}
        <section id="features" className="py-12 relative z-10 w-full">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-royal">{t('landing.featuresHeading')}</h2>
            <p className="text-xs sm:text-sm text-gray-400 font-semibold max-w-lg mx-auto font-sans">
              {t('landing.featuresSubheading')}
            </p>
          </div>
  
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div 
                  key={i} 
                  className="p-6 rounded-2xl border border-dark-border/80 bg-dark-card/45 backdrop-blur-md flex flex-col justify-between h-56 hover-glow transition"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${f.color}`}>
                    <Icon size={20} />
                  </div>
                  <div className="space-y-2 mt-4">
                    <h3 className="font-bold text-sm text-white">{f.title}</h3>
                    <p className="text-xs text-gray-400 font-semibold leading-relaxed">{f.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};
export default About;
