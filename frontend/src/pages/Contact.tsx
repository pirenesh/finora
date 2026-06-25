import React, { useState } from 'react';
import { LandingNavbar } from '../components/LandingNavbar';
import { Footer } from '../components/Footer';
import { Send, Check, Mail, Phone, MapPin, Linkedin, Instagram, Briefcase, User, Code2 } from 'lucide-react';

// Custom SVG for WhatsApp since it's not natively in lucide-react
const WhatsappIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

export const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setError('Please fill in all required fields.');
      return;
    }

    const emailRegex = /.+\@.+\..+/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setSubmitted(true);
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#f3f4f6] flex flex-col relative overflow-hidden">
      
      {/* Background glowing blobs */}
      <div className="glow-blob w-[500px] h-[500px] bg-brand-primary -top-40 -left-40 animate-pulse-slow"></div>
      <div className="glow-blob w-[400px] h-[400px] bg-brand-info -bottom-20 -right-20 animate-pulse-slow" style={{ animationDelay: '3s' }}></div>

      <LandingNavbar />

      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 md:py-24 relative z-10 w-full grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start">
        
        {/* Left Column - Developer Profile */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Profile Card */}
          <div className="p-6 sm:p-8 rounded-3xl border border-gray-800 bg-[#151c2c]/60 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
            {/* Decorative gradient overlay */}
            <div className="absolute top-0 inset-x-0 h-1 bg-brand-primary"></div>
            
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-brand-primary p-0.5">
                <div className="w-full h-full rounded-full bg-[#151c2c] flex items-center justify-center text-white">
                  <User size={28} />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Pirenesh Ragule</h1>
                <p className="text-xs font-bold text-brand-info flex items-center mt-1">
                  <Briefcase size={12} className="mr-1" />
                  Full Stack Developer & Project Lead
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0b0f19]/50 border border-gray-800/50">
                <p className="text-[10px] uppercase font-black text-gray-500 tracking-wider mb-1">Project</p>
                <p className="text-sm font-bold text-gray-200 flex items-center">
                  <Code2 size={16} className="text-brand-primary mr-2" />
                  Finorsa
                </p>
                <p className="text-xs text-gray-400 mt-1.5 leading-relaxed font-medium">
                  AI Powered Personal Finance Management Platform. Built with modern web technologies, real-time analytics, and intelligent financial insights.
                </p>
              </div>

              {/* Contact Details */}
              <div className="space-y-3 pt-2 font-semibold text-xs text-gray-300">
                <a href="mailto:pirenesh2026@gmail.com" className="flex items-center space-x-3.5 p-2 rounded-lg hover:bg-white/5 transition group/link cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover/link:bg-brand-primary group-hover/link:text-white transition">
                    <Mail size={16} />
                  </div>
                  <span className="group-hover/link:text-white transition">pirenesh2026@gmail.com</span>
                </a>

                <a href="tel:9488109189" className="flex items-center space-x-3.5 p-2 rounded-lg hover:bg-white/5 transition group/link cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-brand-info/10 flex items-center justify-center text-brand-info group-hover/link:bg-brand-info group-hover/link:text-white transition">
                    <Phone size={16} />
                  </div>
                  <span className="group-hover/link:text-white transition">+91 9488109189</span>
                </a>
                
                <div className="flex items-center space-x-3.5 p-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <MapPin size={16} />
                  </div>
                  <span>Available for freelance & full-time roles</span>
                </div>
              </div>

              {/* Social Icons */}
              <div className="pt-4 border-t border-gray-800/50 flex items-center space-x-3">
                <a href="#" className="w-10 h-10 rounded-xl bg-[#0b0f19] border border-gray-800 flex items-center justify-center text-gray-400 hover:text-[#25D366] hover:border-[#25D366] transition" title="WhatsApp">
                  <WhatsappIcon size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-[#0b0f19] border border-gray-800 flex items-center justify-center text-gray-400 hover:text-[#E1306C] hover:border-[#E1306C] transition" title="Instagram">
                  <Instagram size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-[#0b0f19] border border-gray-800 flex items-center justify-center text-gray-400 hover:text-[#0077b5] hover:border-[#0077b5] transition" title="LinkedIn">
                  <Linkedin size={18} />
                </a>
              </div>
            </div>
          </div>
          
        </div>

        {/* Right Column - Form */}
        <div className="lg:col-span-3 p-6 sm:p-8 rounded-3xl border border-gray-800 bg-[#151c2c]/40 backdrop-blur-md flex flex-col justify-center shadow-xl h-full">
          {submitted ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-brand-success/10 border border-brand-success/20 flex items-center justify-center text-brand-success animate-bounce">
                <Check size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Message Sent Successfully!</h2>
                <p className="text-sm text-gray-400 font-medium max-w-md mx-auto mt-2 leading-relaxed">
                  Thank you for reaching out. I've received your message and will get back to you at <strong>{email}</strong> as soon as possible.
                </p>
              </div>
              <button 
                onClick={() => setSubmitted(false)}
                className="mt-6 px-6 py-2.5 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Let's Connect</h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 font-medium">
                  Interested in Finorsa, collaboration, or hiring? Fill out the form below.
                </p>
              </div>

              {error && (
                <div className="p-3 text-xs font-semibold text-brand-danger bg-brand-danger/10 border border-brand-danger/20 rounded-xl flex items-center">
                  <span className="mr-2">⚠️</span> {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full px-4 py-3 outline-none rounded-xl border border-gray-800 bg-[#0e1422] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-sm font-medium text-white transition placeholder-gray-600"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                    className="w-full px-4 py-3 outline-none rounded-xl border border-gray-800 bg-[#0e1422] focus:border-brand-info focus:ring-1 focus:ring-brand-info text-sm font-medium text-white transition placeholder-gray-600"
                  />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can I help you? Please describe your query or project details..."
                  rows={5}
                  required
                  className="w-full px-4 py-3 resize-none outline-none rounded-xl border border-gray-800 bg-[#0e1422] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-sm font-medium text-white transition placeholder-gray-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl font-bold bg-brand-primary hover:opacity-90 text-white flex items-center justify-center space-x-2 shadow-lg shadow-brand-primary/20 transition duration-300 transform active:scale-[0.98]"
              >
                <span>Send Message</span>
                <Send size={16} className="ml-1" />
              </button>
            </form>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
};
export default Contact;
