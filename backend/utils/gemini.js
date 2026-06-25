require('dotenv').config();
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const { getCachedMarketData } = require('../controllers/marketController');

// ─────────────────────────────────────────────────────────────────────────────
// Fix SSL certificate verification for environments with proxy/corporate certs
// ─────────────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production' || process.env.DISABLE_SSL_VERIFY === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// ─────────────────────────────────────────────────────────────────────────────
// Initialise Gemini client
// ─────────────────────────────────────────────────────────────────────────────
let genAI = null;
let geminiAvailable = false;

if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
    geminiAvailable = true;
    console.log('✅ Gemini AI initialized successfully.');
  } catch (err) {
    console.error('❌ Failed to initialize Gemini AI:', err.message);
  }
} else {
  console.warn('⚠️  GEMINI_API_KEY is not set. FinBot will use the local fallback engine.');
}

// ─────────────────────────────────────────────────────────────────────────────
// Model cascade: try models in order until one works.
// ─────────────────────────────────────────────────────────────────────────────
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-1.5-flash',
];

// Safety settings — allow finance-related content
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

// ─────────────────────────────────────────────────────────────────────────────
// FinBot AI System Prompt
// ─────────────────────────────────────────────────────────────────────────────
const FINBOT_SYSTEM_PROMPT = `You are FinBot AI, an intelligent, interactive, and highly professional financial consultant embedded inside a Smart Finance Management System for Indian users. You are not a simple FAQ bot; you are a real-world financial advisor.

Your core expertise covers:
- **Personal Finance & Budgeting**: 50/30/20 rule, zero-based budgeting
- **Investments & Wealth**: SIPs, Mutual Funds (Equity/Debt/ELSS), Stocks, PPF, NPS, FDs
- **Loans & Debt**: Education, Home, Personal, and Car loans. EMI calculations, interest rates, and choosing the right bank.
- **Taxes & Insurance**: Section 80C/80D, Term life, Health insurance.

Consulting & Interaction Rules:
1. **Be Highly Interactive**: Do not just give a generic block of text. If a user asks for a loan, investment advice, or financial planning, *always ask relevant follow-up questions* (e.g., "What is your monthly income?", "What is your preferred repayment tenure?", "What is your risk tolerance?").
2. **Provide Specific Recommendations**: When asked about loans, credit cards, or accounts, recommend *specific Indian banks* (e.g., SBI, HDFC, ICICI, Bank of Baroda, Axis Bank) and explain their pros, cons, and typical interest rates.
3. **Show the Math**: Provide estimated EMI calculations, SIP return projections, or tax savings when relevant.
4. **Contextual & Unique**: Never return generic, repeated, or pre-canned responses. Every response must be uniquely tailored to the user's specific scenario and input. Reference their actual financial data if provided in the context.
5. **Format Standards**: Always use Indian Rupees (₹) formatted correctly (e.g., ₹5,00,000). Use bullet points, numbered lists, and **bold text** to make your advice scannable.
6. **Professional Tone**: Be encouraging, analytical, and professional. Avoid overly complex jargon without explanation.
7. **Disclaimers**: Briefly mention market risks when discussing equities and that you are an AI consultant.`;

// ─────────────────────────────────────────────────────────────────────────────
// Local rule-based financial analysis engine (fallback when no API key)
// ─────────────────────────────────────────────────────────────────────────────
const performLocalAnalysis = (userData) => {
  const { incomes = [], expenses = [], budgets = [], transactions = [] } = userData;

  const totalIncome  = incomes.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const currentBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0
    ? parseFloat(((currentBalance / totalIncome) * 100).toFixed(2))
    : 0;

  const budgetLimits = {};
  budgets.forEach(b => { budgetLimits[b.category] = b.limit; });

  const expenseByCategory = {};
  expenses.forEach(e => {
    expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
  });

  const spendingPatterns = [];
  const savingsSuggestions = [];
  const recommendations = [];
  let hasOverspending = false;

  Object.keys(expenseByCategory).forEach(cat => {
    const spent = expenseByCategory[cat];
    const limit = budgetLimits[cat];
    if (limit && spent > limit) {
      hasOverspending = true;
      spendingPatterns.push({
        category: cat,
        status: 'Overspent',
        description: `Spent ₹${spent.toLocaleString('en-IN')} which exceeds the budget of ₹${limit.toLocaleString('en-IN')} by ₹${(spent - limit).toLocaleString('en-IN')}.`
      });
      savingsSuggestions.push(`Reduce spending on ${cat} to stay within your ₹${limit.toLocaleString('en-IN')} budget limit.`);
    }
  });

  if (spendingPatterns.length === 0) {
    spendingPatterns.push({
      category: 'General',
      status: 'Healthy',
      description: 'Your spending is well within limits across active categories.'
    });
  }

  let healthScore = 72;
  if (totalIncome > 0) {
    if (savingsRate >= 30)     healthScore += 18;
    else if (savingsRate >= 20) healthScore += 10;
    else if (savingsRate >= 10) healthScore += 3;
    else if (savingsRate < 0)   healthScore -= 25;
    else                        healthScore -= 10;
  }
  if (hasOverspending) healthScore -= 15;
  if (totalExpense > totalIncome) healthScore -= 10;
  healthScore = Math.max(0, Math.min(100, healthScore));

  let healthStatus = 'Fair';
  if (healthScore >= 85)      healthStatus = 'Excellent';
  else if (healthScore >= 70) healthStatus = 'Good';
  else if (healthScore < 50)  healthStatus = 'Poor';

  if (savingsRate < 20) {
    savingsSuggestions.push('Target saving at least 20% of your monthly income using the 50/30/20 rule.');
  }
  if ((expenseByCategory['Food'] || 0) > totalIncome * 0.3) {
    savingsSuggestions.push('Food expenses exceed 30% of income. Consider meal planning to reduce costs.');
  }
  if (savingsSuggestions.length === 0) {
    savingsSuggestions.push('Great savings rate! Consider automating monthly SIP investments for compounding growth.');
  }

  if (currentBalance > 10000) {
    recommendations.push('Build an Emergency Fund of 3–6 months of expenses in a liquid fund or sweep FD.');
    recommendations.push('Start a monthly SIP in an index fund or ELSS for tax-saving long-term growth.');
  } else {
    recommendations.push('Focus on building a core savings reserve before exploring investment markets.');
  }
  recommendations.push('Review and adjust your budget limits at the start of each month.');

  const nextMonthExpenses = parseFloat((totalExpense * 1.03).toFixed(2));
  const expectedSavings   = parseFloat((totalIncome - nextMonthExpenses).toFixed(2));
  const spendingForecast  = totalExpense > totalIncome
    ? 'High Risk: Expenses projected to outpace income. Immediate cost reduction advised.'
    : 'Stable: Projected expenses within income threshold. Continue with savings goals.';

  const fmt = (n) => `₹${n.toLocaleString('en-IN')}`;
  const summary = `You earned ${fmt(totalIncome)} and spent ${fmt(totalExpense)} this month, leaving a net savings of ${fmt(currentBalance)} (${savingsRate}% savings rate). Your financial health score is ${healthScore}/100 — "${healthStatus}".`;

  return {
    healthScore, healthStatus, summary,
    spendingPatterns, savingsSuggestions, recommendations,
    predictiveAnalytics: { nextMonthExpenses, expectedSavings, spendingForecast },
    _meta: { source: 'local', totalIncome, totalExpense, currentBalance, savingsRate }
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Generate structured monthly financial report via Gemini
// ─────────────────────────────────────────────────────────────────────────────
const generateFinancialReport = async (userData, month) => {
  const localAnalysis = performLocalAnalysis(userData);

  if (!geminiAvailable) {
    console.log('[FinBot] Using local analysis engine (no API key).');
    return localAnalysis;
  }

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        safetySettings: SAFETY_SETTINGS,
        generationConfig: { temperature: 0.4, maxOutputTokens: 1024 }
      });

      const { incomes, expenses, budgets } = userData;
      const fmt2 = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

      const prompt = `
You are FinBot AI, an expert Indian financial analyst. Analyse the following user financial data for ${month} and return a JSON report.

FINANCIAL DATA:
- Monthly Incomes: ${JSON.stringify(incomes.map(i => ({ source: i.category || i.source, amount: fmt2(i.amount) })))}
- Monthly Expenses: ${JSON.stringify(expenses.map(e => ({ category: e.category, amount: fmt2(e.amount) })))}
- Budget Limits: ${JSON.stringify(budgets.map(b => ({ category: b.category, limit: fmt2(b.limit) })))}
- Computed Health Score (local): ${localAnalysis.healthScore}/100
- Computed Savings Rate: ${localAnalysis._meta.savingsRate}%
- Total Income: ${fmt2(localAnalysis._meta.totalIncome)}
- Total Expense: ${fmt2(localAnalysis._meta.totalExpense)}

Provide a comprehensive financial analysis. Return ONLY a valid JSON object matching this exact schema (no markdown, no code fences):
{
  "healthScore": <integer 0-100>,
  "healthStatus": <"Excellent"|"Good"|"Fair"|"Poor">,
  "summary": "<2-3 sentence overview of financial health>",
  "spendingPatterns": [
    { "category": "<name>", "status": "<Healthy|Caution|Warning|Overspent>", "description": "<short explanation>" }
  ],
  "savingsSuggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "recommendations": ["<advice 1>", "<advice 2>", "<advice 3>"],
  "predictiveAnalytics": {
    "nextMonthExpenses": <number>,
    "expectedSavings": <number>,
    "spendingForecast": "<short text>"
  }
}`;

      const result   = await model.generateContent(prompt);
      const response = await result.response;
      const text     = response.text().trim();

      const cleanJson = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/, '')
        .trim();

      const aiReport = JSON.parse(cleanJson);
      console.log(`[FinBot Report] Generated with model: ${modelName}`);

      return {
        healthScore:         aiReport.healthScore         ?? localAnalysis.healthScore,
        healthStatus:        aiReport.healthStatus        ?? localAnalysis.healthStatus,
        summary:             aiReport.summary             ?? localAnalysis.summary,
        spendingPatterns:    aiReport.spendingPatterns    ?? localAnalysis.spendingPatterns,
        savingsSuggestions:  aiReport.savingsSuggestions  ?? localAnalysis.savingsSuggestions,
        recommendations:     aiReport.recommendations     ?? localAnalysis.recommendations,
        predictiveAnalytics: aiReport.predictiveAnalytics ?? localAnalysis.predictiveAnalytics,
      };

    } catch (error) {
      const isTransientError = error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('QUOTA') || error.message?.includes('503') || error.message?.includes('500');
      if (isTransientError) {
        console.warn(`[FinBot Report] Model ${modelName} transient error or quota exceeded, trying next...`);
        continue;
      }
      console.error(`[FinBot Report] Model ${modelName} error:`, error.message);
      continue;
    }
  }

  console.error('[FinBot Report] All Gemini models exhausted, using local fallback.');
  return localAnalysis;
};

// ─────────────────────────────────────────────────────────────────────────────
// FinBot chat — multi-turn conversation via Gemini
// ─────────────────────────────────────────────────────────────────────────────
const askFinBot = async (message, history = [], userData = {}) => {
  const localAnalysis = performLocalAnalysis(userData);
  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const { incomes = [], expenses = [], budgets = [] } = userData;
  const topExpenses = Object.entries(
    expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, amt]) => `${cat}: ${fmt(amt)}`)
    .join(', ');

  const financialContext = `
[USER FINANCIAL SNAPSHOT — current month]
- Total Income    : ${fmt(localAnalysis._meta.totalIncome)}
- Total Expenses  : ${fmt(localAnalysis._meta.totalExpense)}
- Net Balance     : ${fmt(localAnalysis._meta.currentBalance)}
- Savings Rate    : ${localAnalysis._meta.savingsRate}%
- Health Score    : ${localAnalysis.healthScore}/100 (${localAnalysis.healthStatus})
- Top Expense Categories: ${topExpenses || 'No expenses recorded yet'}
- Active Budgets  : ${budgets.length} categories configured
- Spending Alerts : ${localAnalysis.spendingPatterns.filter(p => p.status !== 'Healthy').map(p => `${p.category} (${p.status})`).join(', ') || 'None'}
`.trim();

  let loanContext = '';
  if (userData.bankLoansContext && userData.bankLoansContext.length > 0) {
    const loanStrings = userData.bankLoansContext.map(l =>
      `- ${l.bankName} ${l.loanType}: ${l.interestRate} | Fee: ${l.processingFee} | Max Tenure: ${l.maxTenureYears} yrs | Features: ${l.features.join(', ')}`
    ).join('\n');
    loanContext = `\n\n[BANK LOANS DIRECTORY CONTEXT]\nThe user is asking about loans. Use the following real-world database records to provide accurate answers and comparisons:\n${loanStrings}`;
  }

  let marketContext = '';
  const cachedMarket = getCachedMarketData();
  if (cachedMarket) {
    marketContext = `\n\n[LIVE MARKET INSIGHTS]\nHere are the current real-time market trends you can use to give investment advice:\n`;
    marketContext += `Crypto: ${cachedMarket.crypto.map(c => `${c.name}: ${c.price} (${c.change}%)`).join(', ')}\n`;
    marketContext += `Metals: ${cachedMarket.metals.map(m => `${m.name}: ${m.price} (${m.change}%)`).join(', ')}\n`;
    marketContext += `Stocks: ${cachedMarket.stocks.map(s => `${s.name}: ${s.price} (${s.change}%)`).join(', ')}\n`;
    marketContext += `AI Tip: ${cachedMarket.aiTip}\n`;
  }

  // ── Local fallback when Gemini is unavailable ────────────────────────────
  if (!geminiAvailable) {
    const lower = message.toLowerCase();
    let reply = '';

    if (lower.includes('sip') || lower.includes('systematic investment')) {
      reply = `**Systematic Investment Plan (SIP)** is a method of investing in Mutual Funds in fixed periodic instalments (monthly/weekly).\n\n**Key Benefits:**\n• Rupee cost averaging — buy more units when markets are low\n• Power of compounding over time\n• Start with as little as ₹500/month\n• Available on Groww, Kuvera, Zerodha Coin\n\nWith your current balance of ${fmt(localAnalysis._meta.currentBalance)}, a SIP of ₹1,000–₹2,000/month in an index fund is a great starting point.`;
    } else if (lower.includes('mutual fund') || lower.includes('mf')) {
      reply = `**Mutual Funds** pool money from many investors to buy a diversified portfolio managed by professional fund managers.\n\n**Types:**\n• **Equity Funds** — high risk, high return (market-linked)\n• **Debt Funds** — stable, low risk (bonds/FDs)\n• **ELSS** — tax saving under Section 80C (3-year lock-in)\n• **Index Funds** — tracks Nifty/Sensex, lowest expense ratio\n\nStart with a SIP of ₹500/month on Groww or Kuvera.`;
    } else if (lower.includes('stock') || lower.includes('share market') || lower.includes('equity')) {
      reply = `**Stock Market (NSE/BSE) Basics:**\n\n• Stocks represent ownership in a company\n• Returns are market-linked — no guarantees\n• Study fundamentals (P/E ratio, revenue growth, debt)\n• Diversify across sectors to reduce risk\n• Recommended: Start with index ETFs (Nifty 50 ETF) before individual stocks\n\n⚠️ Always invest only what you can afford to lose. Consult a SEBI-registered advisor for personalised advice.`;
    } else if (lower.includes('tax') || lower.includes('80c') || lower.includes('itr')) {
      reply = `**Tax Saving Tips (India):**\n\n• **Section 80C** — up to ₹1.5L deduction via ELSS, PPF, EPF, LIC, NSC\n• **Section 80D** — health insurance premium deduction\n• **LTCG** — Long-term capital gains on equity >₹1L taxed at 10%\n• **STCG** — Short-term gains taxed at 15%\n• File ITR before 31 July each year\n\nWith income of ${fmt(localAnalysis._meta.totalIncome)}/month, maximising 80C can save you significant tax.`;
    } else if (lower.includes('emergency fund') || lower.includes('emergency')) {
      reply = `**Emergency Fund** is 3–6 months of your living expenses kept in a liquid, accessible account.\n\n**Your numbers:**\n• Monthly expenses: ${fmt(localAnalysis._meta.totalExpense)}\n• Target emergency fund: ${fmt(localAnalysis._meta.totalExpense * 6)}\n\n**Where to keep it:**\n• Sweep-in FD (auto-sweeps to FD, earns 5–7%)\n• Liquid Mutual Fund (same-day withdrawal)\n• High-yield savings account\n\nNever invest your emergency fund in stocks or locked instruments.`;
    } else if (lower.includes('loan') || lower.includes('emi') || lower.includes('debt')) {
      if (userData.bankLoansContext && userData.bankLoansContext.length > 0) {
        const matchedBanks = userData.bankLoansContext.filter(l => lower.includes(l.bankName.toLowerCase()));
        if (matchedBanks.length > 0) {
          const match = matchedBanks[0];
          reply = `**${match.bankName} ${match.loanType}**:\n• **Interest Rate**: ${match.interestRate}\n• **Processing Fee**: ${match.processingFee}\n• **Max Tenure**: ${match.maxTenureYears} years\n• **Features**: ${match.features.join(', ')}\n\n[Apply Here](${match.link})`;
        } else {
          reply = `**Debt Management Strategy:**\n\n• **Debt Avalanche** — Pay highest interest rate debt first (saves most money)\n• **Debt Snowball** — Pay smallest balance first (best for motivation)\n• Always pay credit card bills in full to avoid 36–42% annual interest\n• Pre-pay home loans when possible — reduces tenure significantly\n\n${localAnalysis.spendingPatterns.some(p => p.status === 'Overspent') ? '⚠️ You currently have overspent categories — prioritise clearing them before taking new loans.' : '✅ Your spending appears controlled. Good foundation for loan management.'}`;
        }
      } else {
        reply = `**Debt Management Strategy:**\n\n• **Debt Avalanche** — Pay highest interest rate debt first (saves most money)\n• **Debt Snowball** — Pay smallest balance first (best for motivation)\n• Always pay credit card bills in full to avoid 36–42% annual interest\n• Pre-pay home loans when possible — reduces tenure significantly\n\n${localAnalysis.spendingPatterns.some(p => p.status === 'Overspent') ? '⚠️ You currently have overspent categories — prioritise clearing them before taking new loans.' : '✅ Your spending appears controlled. Good foundation for loan management.'}`;
      }
    } else if (lower.includes('budget') || lower.includes('50/30/20') || lower.includes('spending')) {
      reply = `**50/30/20 Budgeting Rule:**\n\n• **50%** — Needs (rent, food, utilities, EMIs)\n• **30%** — Wants (dining out, entertainment, shopping)\n• **20%** — Savings & investments\n\n**Your current stats:**\n• Income: ${fmt(localAnalysis._meta.totalIncome)}\n• Expenses: ${fmt(localAnalysis._meta.totalExpense)}\n• Savings Rate: ${localAnalysis._meta.savingsRate}%\n\n${localAnalysis.savingsSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    } else if (lower.includes('health') || lower.includes('score') || lower.includes('analy') || lower.includes('my financ')) {
      reply = `**Your Financial Health Report:**\n\n• **Score**: ${localAnalysis.healthScore}/100 (${localAnalysis.healthStatus})\n• **Income**: ${fmt(localAnalysis._meta.totalIncome)}\n• **Expenses**: ${fmt(localAnalysis._meta.totalExpense)}\n• **Net Balance**: ${fmt(localAnalysis._meta.currentBalance)}\n• **Savings Rate**: ${localAnalysis._meta.savingsRate}%\n\n**Alerts:**\n${localAnalysis.spendingPatterns.map(p => `• ${p.category}: ${p.status} — ${p.description}`).join('\n')}\n\n**Recommendations:**\n${localAnalysis.recommendations.map(r => `• ${r}`).join('\n')}`;
    } else if (lower.includes('ppf') || lower.includes('nps') || lower.includes('epf') || lower.includes('retirement')) {
      reply = `**Retirement Planning Options (India):**\n\n• **PPF** — Public Provident Fund, 7.1% p.a., 15-year lock-in, Section 80C eligible\n• **NPS** — National Pension System, market-linked, Tier-1 tax-free on maturity (60%)\n• **EPF** — Employee Provident Fund, 8.5% p.a., employer contributes 12% of salary\n• **ELSS** — Mutual funds with 3-year lock-in, market returns + tax saving\n\nFor long-term retirement, combining PPF + NPS + SIP in index funds is a powerful strategy.`;
    } else if (lower.includes('compounding') || lower.includes('compound interest')) {
      reply = `**Power of Compounding:**\n\n• Investing ₹5,000/month at 12% annual return:\n  — After 10 years: ~₹11.6 Lakhs\n  — After 20 years: ~₹49.9 Lakhs\n  — After 30 years: ~₹1.76 Crore\n\n• **Rule of 72**: Divide 72 by your expected return to find doubling time.\n  At 12% — your money doubles every 6 years!\n\nStart early, stay consistent. Time is your biggest advantage.`;
    } else {
      reply = `Hi! I'm **FinBot AI** — your personal financial assistant. 🤖\n\n**Your Quick Summary:**\n• Income: ${fmt(localAnalysis._meta.totalIncome)}\n• Expenses: ${fmt(localAnalysis._meta.totalExpense)}\n• Health Score: ${localAnalysis.healthScore}/100 (${localAnalysis.healthStatus})\n\n**I can help you with:**\n• SIP & Mutual Funds\n• Tax saving strategies (80C, 80D)\n• Emergency fund planning\n• Debt management\n• Stock market basics\n• Budgeting (50/30/20 rule)\n• Retirement planning (PPF, NPS)\n• Financial health analysis\n\nWhat would you like to discuss today?`;
    }

    return reply;
  }

  // ── Real Gemini chat with multi-model cascade ─────────────────────────────
  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: FINBOT_SYSTEM_PROMPT + '\n\n' + financialContext + loanContext + marketContext,
        safetySettings: SAFETY_SETTINGS,
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 2048
        }
      });

      // ── FIX: Build safe history that always starts with a 'user' message ──
      const geminiHistory = history
        .slice(-20)
        .filter(msg => msg && msg.text && msg.text.trim() !== '')
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));

      // Remove leading 'model' messages — Gemini requires history to start with 'user'
      while (geminiHistory.length > 0 && geminiHistory[0].role === 'model') {
        geminiHistory.shift();
      }

      // Pass empty array if no valid history remains (always safe)
      const safeHistory = geminiHistory.length >= 2 ? geminiHistory : [];

      const chat = model.startChat({ history: safeHistory });

      const result   = await chat.sendMessage(message);
      const response = await result.response;
      const reply    = response.text().trim();

      console.log(`[FinBot Chat] Response from model: ${modelName}`);
      return reply || 'I could not generate a response. Please try rephrasing your question.';

    } catch (error) {
      const isTransientError = error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('QUOTA') || error.message?.includes('503') || error.message?.includes('500');
      if (isTransientError) {
        console.warn(`[FinBot Chat] Model ${modelName} transient error or quota exceeded, trying next model...`);
        continue;
      }

      console.error(`[FinBot Chat] Model ${modelName} error:`, error.message);

      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key not valid')) {
        return '❌ **Configuration Error**: The Gemini API key appears to be invalid. Please check your `GEMINI_API_KEY` in the backend `.env` file.\n\nGet a free key at: https://aistudio.google.com/app/apikey';
      }
      if (error.message?.includes('SAFETY')) {
        return 'I\'m unable to respond to that query. Please ask a finance-related question like budgeting, SIP, mutual funds, or tax planning.';
      }

      break; // non-recoverable error — stop cascade
    }
  }

  // All models failed — use contextual local fallback
  console.warn('[FinBot Chat] All Gemini models exhausted or failed. Using local fallback.');
  return `I'm experiencing high demand right now. Based on your data:\n\n• **Health Score**: ${localAnalysis.healthScore}/100 (${localAnalysis.healthStatus})\n• **Net Balance**: ${fmt(localAnalysis._meta.currentBalance)}\n• **Savings Rate**: ${localAnalysis._meta.savingsRate}%\n\nPlease try again in a moment for a full AI-powered response.`;
};

module.exports = { generateFinancialReport, askFinBot, performLocalAnalysis };