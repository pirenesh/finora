import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Minus,
  TrendingUp,
  Activity,
  HelpCircle,
  PiggyBank,
  ShieldCheck,
  CreditCard,
  Calculator,
  Landmark
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: Date;
}

// ── MoneyRobot icon ──────────────────────────────────────────────────────────
export const MoneyRobotIcon = ({ size = 20 }: { size?: number }) => (
  <div className="relative flex items-center justify-center">
    <Bot size={size} className="text-white shrink-0" />
    <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-gray-900 rounded-full w-3.5 h-3.5 flex items-center justify-center border border-violet-600 shadow-sm animate-bounce text-[9px] font-extrabold leading-none">
      ₹
    </span>
  </div>
);

// ── Inline Markdown Renderer ─────────────────────────────────────────────────
// Renders **bold**, *italic*, bullet points (•, -, *), numbered lists, and line breaks
const MarkdownText = ({ text }: { text: string }) => {
  const renderLine = (line: string, key: number) => {
    // Bullet point lines
    const bulletMatch = line.match(/^[•\-\*]\s+(.+)/);
    if (bulletMatch) {
      return (
        <div key={key} className="flex items-start space-x-1.5 my-0.5">
          <span className="text-brand-primary mt-0.5 shrink-0 font-bold">•</span>
          <span>{applyInlineStyles(bulletMatch[1])}</span>
        </div>
      );
    }

    // Numbered list lines
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      return (
        <div key={key} className="flex items-start space-x-1.5 my-0.5">
          <span className="text-brand-primary shrink-0 font-bold text-[11px] mt-0.5">{numberedMatch[1]}.</span>
          <span>{applyInlineStyles(numberedMatch[2])}</span>
        </div>
      );
    }

    // Heading-like lines (starts with ##)
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      return <p key={key} className="font-bold text-gray-800 dark:text-white mt-2 mb-0.5">{applyInlineStyles(headingMatch[1])}</p>;
    }

    // Empty line = spacer
    if (line.trim() === '') {
      return <div key={key} className="h-1.5" />;
    }

    // Normal line
    return <p key={key} className="my-0.5">{applyInlineStyles(line)}</p>;
  };

  // Apply inline bold (**text**) and italic (*text*) styles
  const applyInlineStyles = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return <em key={i} className="italic text-gray-700 dark:text-gray-200">{part.slice(1, -1)}</em>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const lines = text.split('\n');
  return (
    <div className="space-y-0.5 text-xs md:text-sm leading-relaxed">
      {lines.map((line, i) => renderLine(line, i))}
    </div>
  );
};

// ── Quick action prompt definitions ─────────────────────────────────────────
const QUICK_ACTIONS = [
  { text: 'Analyze my financial health',   icon: Activity },
  { text: 'What is SIP and how to start?', icon: TrendingUp },
  { text: 'How to build an emergency fund?', icon: ShieldCheck },
  { text: 'Best ways to save money',        icon: PiggyBank },
  { text: 'Explain mutual funds for beginners', icon: HelpCircle },
  { text: 'How to manage credit card debt?',    icon: CreditCard },
  { text: 'Tax saving tips under 80C',          icon: Calculator },
  { text: 'Retirement planning with NPS & PPF', icon: Landmark },
];

// ── Main FloatingBot component ───────────────────────────────────────────────
export const FloatingBot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen]       = useState(false);
  const [message, setMessage]     = useState('');
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [loading, setLoading]     = useState(false);
  const [isTyping, setIsTyping]   = useState(false);
  const chatEndRef                = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLTextAreaElement>(null);

  // Set welcome message on mount
  useEffect(() => {
    if (user) {
      setMessages([{
        id: 'welcome',
        sender: 'bot',
        text: `Hello **${user.username}**! 👋 I'm **FinBot AI**, your personal financial assistant powered by Google Gemini.\n\nI can help you with:\n• Budgeting & savings strategies\n• SIP, Mutual Funds & investments\n• Tax planning (80C, 80D)\n• Debt management & loans\n• Emergency fund planning\n• Stock market basics\n\nAsk me anything about personal finance or your account data!`,
        time: new Date()
      }]);
    }
  }, [user]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!user) return null;

  const handleSendMessage = useCallback(async (textToSend?: string) => {
    const text = (textToSend || message).trim();
    if (!text || loading) return;

    if (!textToSend) setMessage('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: new Date()
    };

    // Optimistically add user message
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setIsTyping(true);

    try {
      // Build history from current messages (trim to last 20 for token efficiency)
      const historySnapshot = [...messages].slice(-20).map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await axios.post('/api/ai/chat', {
        message: text,
        history: historySnapshot
      });

      if (res.data.success) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: res.data.reply,
          time: new Date()
        }]);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('FinBot request failed:', err);
      const errMsg = err.response?.data?.message
        || 'I encountered a temporary issue. Please try again in a moment.';
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: `⚠️ ${errMsg}`,
        time: new Date()
      }]);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  }, [message, messages, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const charCount = message.length;
  const isOverLimit = charCount > 800;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">

      {/* ── Chat Window ─────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="w-[360px] sm:w-[420px] h-[580px] mb-4 flex flex-col rounded-2xl border border-gray-200 dark:border-dark-border shadow-2xl glass-panel-heavy overflow-hidden"
          style={{ animation: 'slideUpFade 0.25s ease-out' }}
        >
          <style>{`
            @keyframes slideUpFade {
              from { opacity: 0; transform: translateY(20px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0)   scale(1); }
            }
          `}</style>

          {/* Header */}
          <div className="h-16 bg-gradient-to-r from-brand-primary via-violet-600 to-brand-info px-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md ring-1 ring-white/30">
                <MoneyRobotIcon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm flex items-center gap-1">
                  FinBot AI
                  <Sparkles size={12} className="text-yellow-300 animate-pulse" />
                </h3>
                <span className="text-[10px] text-white/75 font-medium">Personal Financial Assistant</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/15 transition"
                title="Minimise"
              >
                <Minus size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/15 transition"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gray-50/50 dark:bg-dark-bg/40 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {/* Bot avatar */}
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-primary to-brand-info flex items-center justify-center mr-2 mt-0.5 shrink-0 shadow-md">
                    <Bot size={14} className="text-white" />
                  </div>
                )}

                <div className={`
                  max-w-[82%] rounded-2xl px-4 py-2.5 shadow-sm
                  ${msg.sender === 'user'
                    ? 'bg-gradient-to-br from-brand-primary to-violet-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border text-gray-800 dark:text-gray-100 rounded-tl-none'}
                `}>
                  {msg.sender === 'bot' ? (
                    <MarkdownText text={msg.text} />
                  ) : (
                    <p className="text-xs md:text-sm font-medium leading-relaxed">{msg.text}</p>
                  )}
                  <span className={`block text-[9px] mt-1.5 text-right ${msg.sender === 'user' ? 'text-white/55' : 'text-gray-400'}`}>
                    {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start items-end space-x-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-primary to-brand-info flex items-center justify-center shrink-0 shadow-md">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex flex-col space-y-1.5">
                  <div className="flex space-x-1.5 items-center">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="w-2 h-2 rounded-full bg-brand-primary/60 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] text-gray-400 font-medium">FinBot is thinking...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Actions — shown only on first welcome message */}
          {messages.length === 1 && !loading && (
            <div className="px-3 py-2.5 border-t border-gray-100 dark:border-dark-border bg-white/40 dark:bg-dark-card/20 shrink-0">
              <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Quick Questions</p>
              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_ACTIONS.slice(0, 6).map((action, i) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(action.text)}
                      className="flex items-center space-x-1.5 p-2 rounded-xl text-left border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-brand-primary/5 hover:border-brand-primary/30 hover:shadow-sm text-[10px] font-semibold text-gray-600 dark:text-gray-300 transition-all duration-200"
                    >
                      <Icon size={11} className="text-brand-primary shrink-0" />
                      <span className="truncate">{action.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input bar */}
          <div className="px-3 py-2.5 border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card shrink-0">
            <div className="flex items-end space-x-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a finance question..."
                  rows={1}
                  disabled={loading}
                  className={`
                    w-full py-2.5 px-3 resize-none outline-none rounded-xl border
                    bg-gray-50 dark:bg-dark-bg text-xs md:text-sm max-h-28
                    text-gray-800 dark:text-white transition-all duration-200
                    disabled:opacity-60
                    ${isOverLimit
                      ? 'border-brand-danger focus:border-brand-danger'
                      : 'border-gray-200 dark:border-dark-border focus:border-brand-primary dark:focus:border-brand-primary'}
                  `}
                  style={{ scrollbarWidth: 'none' }}
                />
                {charCount > 600 && (
                  <span className={`absolute bottom-1.5 right-2 text-[8px] font-bold ${isOverLimit ? 'text-brand-danger' : 'text-gray-400'}`}>
                    {charCount}/1000
                  </span>
                )}
              </div>
              <button
                onClick={() => handleSendMessage()}
                disabled={!message.trim() || loading || isOverLimit}
                className="p-2.5 rounded-xl bg-gradient-to-br from-brand-primary to-violet-600 hover:brightness-110 text-white disabled:opacity-50 shadow-md shadow-brand-primary/25 transition-all duration-200 active:scale-95 shrink-0"
                title="Send message (Enter)"
              >
                <Send size={16} />
              </button>
            </div>

            {/* Footer: Powered by Gemini */}
            <div className="flex items-center justify-center mt-2 space-x-1">
              <span className="text-[8px] text-gray-400 font-medium">Powered by</span>
              <span className="text-[8px] font-bold bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 bg-clip-text text-transparent">
                Google Gemini
              </span>
              <Sparkles size={8} className="text-yellow-400" />
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Toggle Button ─────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative w-14 h-14 rounded-full bg-gradient-to-tr from-brand-primary to-brand-info flex items-center justify-center text-white shadow-xl shadow-brand-primary/35 hover:scale-105 transition-all duration-300 active:scale-95"
        title={isOpen ? 'Close FinBot' : 'Open FinBot AI'}
      >
        {/* Ping animation */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-brand-primary opacity-25 group-hover:scale-110 animate-ping z-0 pointer-events-none" />
        )}

        {isOpen ? (
          <X size={22} className="z-10" />
        ) : (
          <div className="z-10 scale-110">
            <MoneyRobotIcon size={26} />
          </div>
        )}
      </button>
    </div>
  );
};

export default FloatingBot;
