const Debt = require('../models/Debt');
const Transaction = require('../models/Transaction');

// Helper to calculate accrued interest
const calculateAccruedInterest = (debt, targetDate = new Date()) => {
  const { amount, interestRate, interestPeriod, interestType, startDate } = debt;
  
  if (!interestRate || interestRate <= 0 || interestPeriod === 'none') {
    return 0;
  }

  const start = new Date(startDate);
  const target = new Date(targetDate);
  
  if (target <= start) return 0;

  const diffMs = target.getTime() - start.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  let timeUnits = 0;
  if (interestPeriod === 'monthly') {
    timeUnits = diffDays / 30.4375; // average days in a month
  } else if (interestPeriod === 'yearly') {
    timeUnits = diffDays / 365.25;  // average days in a year
  }

  const principal = parseFloat(amount);
  const rateFraction = parseFloat(interestRate) / 100;

  if (interestType === 'simple') {
    return principal * rateFraction * timeUnits;
  } else if (interestType === 'compound') {
    // A = P * (1 + r)^t, Interest = A - P
    const totalAmount = principal * Math.pow(1 + rateFraction, timeUnits);
    return totalAmount - principal;
  }

  return 0;
};

// @desc    Get all debts for user
// @route   GET /api/debt
// @access  Private
const getDebts = async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (global.useMockDb) {
      const userDebts = global.mockDb.debts
        .filter(d => d.userId.toString() === userId.toString())
        .map(d => {
          const totalRepaid = d.repayments.reduce((sum, r) => sum + r.amount, 0);
          
          // Calculate interest up to now, or up to the date of last repayment if paid
          const calcLimitDate = d.status === 'paid' && d.repayments.length > 0
            ? new Date(Math.max(...d.repayments.map(r => new Date(r.date).getTime())))
            : new Date();

          const accruedInterest = calculateAccruedInterest(d, calcLimitDate);
          const currentBalance = Math.max(0, d.amount + accruedInterest - totalRepaid);

          return {
            ...d,
            accruedInterest,
            totalRepaid,
            currentBalance
          };
        });
      return res.status(200).json({ success: true, count: userDebts.length, data: userDebts });
    }

    const debts = await Debt.find({ userId }).lean();
    
    const formattedDebts = debts.map(d => {
      const totalRepaid = d.repayments.reduce((sum, r) => sum + r.amount, 0);
      
      const calcLimitDate = d.status === 'paid' && d.repayments.length > 0
        ? new Date(Math.max(...d.repayments.map(r => new Date(r.date).getTime())))
        : new Date();

      const accruedInterest = calculateAccruedInterest(d, calcLimitDate);
      const currentBalance = Math.max(0, d.amount + accruedInterest - totalRepaid);

      return {
        ...d,
        accruedInterest,
        totalRepaid,
        currentBalance
      };
    });

    res.status(200).json({ success: true, count: formattedDebts.length, data: formattedDebts });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new debt
// @route   POST /api/debt
// @access  Private
const createDebt = async (req, res, next) => {
  try {
    const { 
      lenderBorrowerName, 
      type, 
      amount, 
      interestRate, 
      interestPeriod, 
      interestType, 
      startDate, 
      dueDate, 
      dueFrequency,
      description,
      mirrorTransaction 
    } = req.body;

    if (!lenderBorrowerName || !type || !amount || !startDate) {
      res.status(400);
      throw new Error('Please fill in borrower/lender name, type, amount, and start date');
    }

    const userId = req.user._id;

    if (global.useMockDb) {
      const mockId = Math.random().toString(36).substring(7);
      const newDebt = {
        _id: mockId,
        userId: userId.toString(),
        lenderBorrowerName,
        type,
        amount: parseFloat(amount),
        interestRate: parseFloat(interestRate || 0),
        interestPeriod: interestPeriod || 'none',
        interestType: interestType || 'simple',
        startDate: new Date(startDate),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        dueFrequency: dueFrequency || 'once',
        description,
        status: 'active',
        repayments: [],
        createdAt: new Date()
      };

      global.mockDb.debts.push(newDebt);

      if (mirrorTransaction) {
        const txId = 't' + Math.random().toString(36).substring(7);
        global.mockDb.transactions.push({
          _id: txId,
          userId: userId.toString(),
          type: type === 'borrowed' ? 'income' : 'expense',
          amount: parseFloat(amount),
          category: type === 'borrowed' ? 'Other Income' : 'Others',
          date: new Date(startDate),
          description: `Loan ${type === 'borrowed' ? 'Borrowed from' : 'Lent to'} ${lenderBorrowerName} (Ref: ${mockId})`,
          referenceId: mockId,
          createdAt: new Date()
        });
      }

      return res.status(201).json({ success: true, data: newDebt });
    }

    const debt = await Debt.create({
      userId,
      lenderBorrowerName,
      type,
      amount,
      interestRate,
      interestPeriod,
      interestType,
      startDate,
      dueDate,
      dueFrequency: dueFrequency || 'once',
      description
    });

    if (mirrorTransaction) {
      await Transaction.create({
        userId,
        type: type === 'borrowed' ? 'income' : 'expense',
        amount,
        category: type === 'borrowed' ? 'Other Income' : 'Others',
        date: startDate,
        description: `Loan ${type === 'borrowed' ? 'Borrowed from' : 'Lent to'} ${lenderBorrowerName}`,
        referenceId: debt._id
      });
    }

    res.status(201).json({ success: true, data: debt });
  } catch (error) {
    next(error);
  }
};

// @desc    Record repayment on a debt
// @route   POST /api/debt/:id/repay
// @access  Private
const recordRepayment = async (req, res, next) => {
  try {
    const { amount, date, description, mirrorTransaction } = req.body;

    if (!amount || !date) {
      res.status(400);
      throw new Error('Please fill in repayment amount and date');
    }

    const userId = req.user._id;

    if (global.useMockDb) {
      const idx = global.mockDb.debts.findIndex(d => d._id.toString() === req.params.id);
      if (idx === -1) {
        res.status(404);
        throw new Error('Debt record not found');
      }

      const debt = global.mockDb.debts[idx];

      if (debt.userId.toString() !== userId.toString()) {
        res.status(401);
        throw new Error('Not authorized to edit this debt record');
      }

      const mockRepayId = Math.random().toString(36).substring(7);
      const repayment = {
        _id: mockRepayId,
        amount: parseFloat(amount),
        date: new Date(date),
        description
      };

      debt.repayments.push(repayment);

      // Calculate total repaid and outstanding balance
      const totalRepaid = debt.repayments.reduce((sum, r) => sum + r.amount, 0);
      const accruedInterest = calculateAccruedInterest(debt, new Date(date));
      const currentBalance = debt.amount + accruedInterest - totalRepaid;

      if (currentBalance <= 0) {
        debt.status = 'paid';
      }

      if (mirrorTransaction) {
        const txId = 't' + Math.random().toString(36).substring(7);
        global.mockDb.transactions.push({
          _id: txId,
          userId: userId.toString(),
          type: debt.type === 'borrowed' ? 'expense' : 'income',
          amount: parseFloat(amount),
          category: debt.type === 'borrowed' ? 'Others' : 'Other Income',
          date: new Date(date),
          description: `Repayment ${debt.type === 'borrowed' ? 'made' : 'received'} for ${debt.lenderBorrowerName}'s loan`,
          referenceId: debt._id,
          createdAt: new Date()
        });
      }

      global.mockDb.debts[idx] = debt;
      return res.status(200).json({ success: true, data: debt });
    }

    const debt = await Debt.findById(req.params.id);
    if (!debt) {
      res.status(404);
      throw new Error('Debt record not found');
    }

    if (debt.userId.toString() !== userId.toString()) {
      res.status(401);
      throw new Error('Not authorized to edit this debt record');
    }

    const repayment = {
      amount,
      date,
      description
    };

    debt.repayments.push(repayment);

    // Calculate details
    const totalRepaid = debt.repayments.reduce((sum, r) => sum + r.amount, 0);
    const accruedInterest = calculateAccruedInterest(debt, new Date(date));
    const currentBalance = debt.amount + accruedInterest - totalRepaid;

    if (currentBalance <= 0) {
      debt.status = 'paid';
    }

    if (mirrorTransaction) {
      const transaction = await Transaction.create({
        userId,
        type: debt.type === 'borrowed' ? 'expense' : 'income',
        amount,
        category: debt.type === 'borrowed' ? 'Others' : 'Other Income',
        date,
        description: `Repayment ${debt.type === 'borrowed' ? 'made' : 'received'} for ${debt.lenderBorrowerName}'s loan`,
        referenceId: debt._id
      });
      debt.repayments[debt.repayments.length - 1].transactionId = transaction._id;
    }

    await debt.save();
    res.status(200).json({ success: true, data: debt });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a debt record
// @route   DELETE /api/debt/:id
// @access  Private
const deleteDebt = async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (global.useMockDb) {
      const idx = global.mockDb.debts.findIndex(d => d._id.toString() === req.params.id);
      if (idx === -1) {
        res.status(404);
        throw new Error('Debt record not found');
      }

      if (global.mockDb.debts[idx].userId.toString() !== userId.toString()) {
        res.status(401);
        throw new Error('Not authorized to delete this record');
      }

      global.mockDb.debts.splice(idx, 1);

      // Clean mirrored transactions
      global.mockDb.transactions = global.mockDb.transactions.filter(t => t.referenceId?.toString() !== req.params.id);

      return res.status(200).json({ success: true, data: {} });
    }

    const debt = await Debt.findById(req.params.id);
    if (!debt) {
      res.status(404);
      throw new Error('Debt record not found');
    }

    if (debt.userId.toString() !== userId.toString()) {
      res.status(401);
      throw new Error('Not authorized to delete this record');
    }

    await Debt.findByIdAndDelete(req.params.id);

    // Clean mirrored transactions
    await Transaction.deleteMany({ referenceId: debt._id });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDebts,
  createDebt,
  recordRepayment,
  deleteDebt
};
