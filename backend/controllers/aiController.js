const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const AIReport = require('../models/AIReport');
const BankLoan = require('../models/BankLoan');
const { generateFinancialReport, askFinBot, performLocalAnalysis } = require('../utils/gemini');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: gather user financial data for a given month
// ─────────────────────────────────────────────────────────────────────────────
const gatherUserData = async (userId, month) => {
  if (global.useMockDb) {
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const nextMonthNum = parseInt(month.slice(5, 7)) + 1;
    const endYear  = nextMonthNum > 12 ? parseInt(month.slice(0, 4)) + 1 : parseInt(month.slice(0, 4));
    const endMonth = nextMonthNum > 12 ? '01' : nextMonthNum.toString().padStart(2, '0');
    const end = new Date(`${endYear}-${endMonth}-01T00:00:00.000Z`);

    const incomes  = global.mockDb.incomes.filter(inc =>
      inc.userId.toString() === userId.toString() &&
      new Date(inc.date) >= start && new Date(inc.date) < end
    );
    const expenses = global.mockDb.expenses.filter(exp =>
      exp.userId.toString() === userId.toString() &&
      new Date(exp.date) >= start && new Date(exp.date) < end
    );
    const budgets  = global.mockDb.budgets.filter(b =>
      b.userId.toString() === userId.toString() && b.month === month
    );
    const transactions = global.mockDb.transactions
      .filter(t => t.userId.toString() === userId.toString())
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20);

    return { incomes, expenses, budgets, transactions };
  }

  const startOfMonth = new Date(`${month}-01T00:00:00.000Z`);
  const endOfMonth   = new Date(startOfMonth);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);

  const [incomes, expenses, budgets, transactions] = await Promise.all([
    Income.find({ userId, date: { $gte: startOfMonth, $lt: endOfMonth } }),
    Expense.find({ userId, date: { $gte: startOfMonth, $lt: endOfMonth } }),
    Budget.find({ userId, month }),
    Transaction.find({ userId }).sort({ date: -1 }).limit(20)
  ]);

  return { incomes, expenses, budgets, transactions };
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get or generate monthly AI financial health report
// @route   GET /api/ai/report
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getAIReport = async (req, res, next) => {
  try {
    const month   = req.query.month   || new Date().toISOString().slice(0, 7);
    const refresh = req.query.refresh === 'true';

    if (global.useMockDb) {
      let reportIdx = global.mockDb.aiReports.findIndex(
        r => r.userId.toString() === req.user._id.toString() && r.month === month
      );
      let report = reportIdx !== -1 ? global.mockDb.aiReports[reportIdx] : null;

      if (report && !refresh) {
        return res.status(200).json({ success: true, cached: true, data: report });
      }

      const userData = await gatherUserData(req.user._id, month);
      const analysis = await generateFinancialReport(userData, month);

      const mockId = report ? report._id : Math.random().toString(36).substring(7);
      report = {
        _id: mockId,
        userId: req.user._id.toString(),
        month,
        ...analysis,
        generatedAt: new Date()
      };

      if (reportIdx !== -1) {
        global.mockDb.aiReports[reportIdx] = report;
      } else {
        global.mockDb.aiReports.push(report);
      }

      return res.status(200).json({ success: true, cached: false, data: report });
    }

    // MongoDB path
    let report = await AIReport.findOne({ userId: req.user._id, month });
    if (report && !refresh) {
      return res.status(200).json({ success: true, cached: true, data: report });
    }

    const userData = await gatherUserData(req.user._id, month);
    const analysis = await generateFinancialReport(userData, month);

    report = await AIReport.findOneAndUpdate(
      { userId: req.user._id, month },
      { ...analysis, generatedAt: new Date() },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, cached: false, data: report });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Interact with FinBot AI chatbot
// @route   POST /api/ai/chat
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const chatWithBot = async (req, res, next) => {
  try {
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      res.status(400);
      throw new Error('Message cannot be empty.');
    }

    // Limit message length
    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Message too long. Please keep it under 1000 characters.'
      });
    }

    const month    = new Date().toISOString().slice(0, 7);
    const userData = await gatherUserData(req.user._id, month);

    // AI Bank Loan Interceptor
    const msgLower = message.toLowerCase();
    const loanKeywords = ['loan', 'interest', 'sbi', 'hdfc', 'icici', 'axis', 'kotak', 'rate', 'compare'];
    
    if (loanKeywords.some(kw => msgLower.includes(kw))) {
      let loanRecords = [];
      if (global.useMockDb) {
        if (!global.mockDb.bankLoans) {
          global.mockDb.bankLoans = require('../data/bankLoans.json');
        }
        loanRecords = global.mockDb.bankLoans;
      } else {
        loanRecords = await BankLoan.find({}); // Fetching all 50 since it's a small dataset and LLM context can handle ~1-2kb easily.
      }
      userData.bankLoansContext = loanRecords;
    }

    // Log in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[FinBot] Chat request from user ${req.user._id}: "${message.slice(0, 80)}${message.length > 80 ? '...' : ''}"`);
    }

    const reply = await askFinBot(message, history || [], userData);

    res.status(200).json({ success: true, reply });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAIReport, chatWithBot };
