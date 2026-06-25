import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LandingNavbar } from '../components/LandingNavbar';
import { Footer } from '../components/Footer';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, 
  TrendingUp, 
  Wallet, 
  Brain, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  PieChart
} from 'lucide-react';

export const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-dark-bg text-dark-text flex flex-col relative overflow-hidden font-sans">
      
      {/* Background ambient glowing blobs */}
      <div className="glow-blob w-[500px] h-[500px] bg-brand-primary -top-40 -left-40 animate-pulse-slow"></div>
      <div className="glow-blob w-[400px] h-[400px] bg-brand-info -bottom-20 -right-20 animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
 
      <LandingNavbar />
 
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 md:py-32 relative z-10 max-w-5xl mx-auto space-y-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border border-brand-primary/20 bg-brand-primary/5 text-xs font-bold text-brand-primary animate-bounce font-sans">
          <Sparkles size={12} className="animate-spin-slow" />
          <span>{t('landing.badge')}</span>
        </div>
 
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-none text-white max-w-4xl font-royal">
          {t('landing.heroTitle')} <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-brand-primary via-amber-200 to-brand-info bg-clip-text text-transparent">
            {t('landing.heroHighlight')}
          </span>
        </h1>
 
        <p className="text-xs sm:text-base text-gray-400 font-semibold max-w-2xl leading-relaxed font-sans">
          {t('landing.heroSubtitle')}
        </p>
 
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full sm:w-auto font-sans">
          {user ? (
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 rounded-2xl text-sm font-bold text-black bg-brand-primary hover:brightness-105 shadow-xl shadow-brand-primary/15 transition-all duration-200"
            >
              <span>{t('landing.ctaDashboard')}</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <>
              <Link
                to="/register"
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 rounded-2xl text-sm font-bold text-black bg-brand-primary hover:brightness-105 shadow-xl shadow-brand-primary/20 transition-all duration-200"
              >
                <span>{t('landing.ctaRegister')}</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/pricing"
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 rounded-2xl text-sm font-bold text-gray-300 border border-dark-border bg-dark-card/40 hover:bg-dark-card/75 hover:border-gray-700 transition-all duration-200"
              >
                <span>{t('landing.ctaPricing')}</span>
              </Link>
            </>
          )}
        </div>
      </section>
 
      {/* Features Grid Section */}
      <section id="features" className="py-20 px-6 sm:px-12 relative z-10 max-w-6xl mx-auto w-full">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-royal">{t('landing.featuresHeading')}</h2>
          <p className="text-xs sm:text-sm text-gray-400 font-semibold max-w-lg mx-auto font-sans">
            {t('landing.featuresSubheading')}
          </p>
        </div>
 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div 
                key={i} 
                className="p-6 rounded-2xl border border-dark-border/80 bg-dark-card/45 backdrop-blur-md flex flex-col justify-between h-64 hover-glow transition"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${f.color}`}>
                  <Icon size={20} />
                </div>
                <div className="space-y-2 mt-6">
                  <h3 className="font-bold text-sm text-white">{f.title}</h3>
                  <p className="text-xs text-gray-400 font-semibold leading-relaxed">{f.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
 
      {/* Testimonials Console Section */}
      <section className="py-20 px-6 sm:px-12 relative z-10 bg-dark-card/20 border-y border-dark-border w-full">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h3 className="text-2xl font-extrabold text-white font-royal">{t('landing.testimonialHeading')}</h3>
          <blockquote className="text-base sm:text-xl font-medium italic text-gray-300 leading-normal font-cormorant">
            {t('landing.testimonialQuote')}
          </blockquote>
          <div className="font-sans">
            <h5 className="font-bold text-sm text-brand-primary">{t('landing.testimonialName')}</h5>
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{t('landing.testimonialTitle')}</span>
          </div>
        </div>
      </section>
 
      {/* Final Call To Action */}
      <section className="py-24 px-6 sm:px-12 text-center relative z-10 max-w-4xl mx-auto space-y-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-royal">{t('landing.ctaFinalHeading')}</h2>
        <p className="text-xs sm:text-sm text-gray-400 font-semibold max-w-md mx-auto leading-relaxed font-sans">
          {t('landing.ctaFinalSubtitle')}
        </p>
        <div className="pt-2 font-sans">
          <Link
            to="/register"
            className="inline-flex items-center space-x-2 px-8 py-4 rounded-2xl text-sm font-bold text-black bg-brand-primary hover:brightness-105 shadow-xl shadow-brand-primary/20 transition-all duration-200"
          >
            <span>{t('landing.ctaFinalBtn')}</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};
export default Landing;
