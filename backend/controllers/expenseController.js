const Expense = require('../models/Expense');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Notification = require('../models/Notification');

// Helper to check and create notifications based on budgets
const checkBudgetAlerts = async (userId, amount, category, date) => {
  const month = new Date(date).toISOString().slice(0, 7); // YYYY-MM
  const start = new Date(`${month}-01T00:00:00.000Z`);
  const nextMonthNum = parseInt(month.slice(5, 7)) + 1;
  const endYear = nextMonthNum > 12 ? parseInt(month.slice(0, 4)) + 1 : parseInt(month.slice(0, 4));
  const endMonth = nextMonthNum > 12 ? '01' : nextMonthNum.toString().padStart(2, '0');
  const end = new Date(`${endYear}-${endMonth}-01T00:00:00.000Z`);

  try {
    // 1. High Expense Alert (Trigger if amount >= 15000)
    if (amount >= 15000) {
      const title = 'High Expense Logged';
      const message = `A large outflow of ₹${amount.toLocaleString()} was recorded under ${category}.`;
      
      if (global.useMockDb) {
        if (!global.mockDb.notifications) global.mockDb.notifications = [];
        global.mockDb.notifications.push({
          _id: Math.random().toString(36).substring(7),
          userId: userId.toString(),
          title,
          message,
          type: 'high_expense',
          isRead: false,
          createdAt: new Date()
        });
      } else {
        await Notification.create({
          userId,
          title,
          message,
          type: 'high_expense'
        });
      }
    }

    // 2. Budget Threshold Checks
    if (global.useMockDb) {
      const budget = global.mockDb.budgets.find(b => b.userId.toString() === userId.toString() && b.category === category && b.month === month);
      if (budget) {
        const spent = global.mockDb.expenses
          .filter(exp => exp.userId.toString() === userId.toString() && exp.category === category && new Date(exp.date) >= start && new Date(exp.date) < end)
          .reduce((sum, e) => sum + e.amount, 0);

        if (spent > budget.limit) {
          const title = `Budget Limit Exceeded: ${category}`;
          const message = `Your total spending in ${category} has reached ₹${spent.toLocaleString()}, which exceeds your monthly budget cap of ₹${budget.limit.toLocaleString()}.`;
          
          if (!global.mockDb.notifications) global.mockDb.notifications = [];
          global.mockDb.notifications.push({
            _id: Math.random().toString(36).substring(7),
            userId: userId.toString(),
            title,
            message,
            type: 'budget_warning',
            isRead: false,
            createdAt: new Date()
          });
        }
      }
    } else {
      const budget = await Budget.findOne({ userId, category, month });
      if (budget) {
        // Aggregate spent in this category
        const expensesAgg = await Expense.aggregate([
          {
            $match: {
              userId,
              category,
              date: { $gte: start, $lt: end }
            }
          },
          {
            $group: {
              _id: null,
              totalSpent: { $sum: '$amount' }
            }
          }
        ]);

        const totalSpent = expensesAgg.length > 0 ? expensesAgg[0].totalSpent : 0;
        if (totalSpent > budget.limit) {
          await Notification.create({
            userId,
            title: `Budget Limit Exceeded: ${category}`,
            message: `Your total spending in ${category} has reached ₹${totalSpent.toLocaleString()}, which exceeds your monthly budget cap of ₹${budget.limit.toLocaleString()}.`,
            type: 'budget_warning'
          });
        }
      }
    }
  } catch (err) {
    console.error('Failed to process notifications:', err);
  }
};

// @desc    Get all expenses
// @route   GET /api/expense
// @access  Private
const getExpenses = async (req, res, next) => {
  try {
    if (global.useMockDb) {
      const userExpenses = global.mockDb.expenses
        .filter(exp => exp.userId.toString() === req.user._id.toString())
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.status(200).json({ success: true, count: userExpenses.length, data: userExpenses });
    }

    const expenses = await Expense.find({ userId: req.user._id }).sort({ date: -1 });
    res.status(200).json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    next(error);
  }
};

// @desc    Add expense
// @route   POST /api/expense
// @access  Private
const addExpense = async (req, res, next) => {
  try {
    const { amount, category, date, description, expenses } = req.body;

    // Support bulk add
    if (expenses && Array.isArray(expenses)) {
      if (!date) {
        res.status(400);
        throw new Error('Please specify a date for bulk expenses');
      }

      const results = [];

      for (const item of expenses) {
        const itemAmount = parseFloat(item.amount);
        const itemCategory = item.category;
        const itemDescription = item.description || description || '';

        if (isNaN(itemAmount) || itemAmount <= 0 || !itemCategory) {
          continue; // skip empty or invalid items
        }

        if (global.useMockDb) {
          const mockId = Math.random().toString(36).substring(7);
          const expense = {
            _id: mockId,
            userId: req.user._id.toString(),
            amount: itemAmount,
            category: itemCategory,
            date: new Date(date),
            description: itemDescription,
            createdAt: new Date()
          };

          global.mockDb.expenses.push(expense);

          global.mockDb.transactions.push({
            _id: 't' + mockId,
            userId: req.user._id.toString(),
            type: 'expense',
            amount: itemAmount,
            category: itemCategory,
            date: new Date(date),
            description: itemDescription,
            referenceId: mockId,
            createdAt: new Date()
          });

          setTimeout(() => checkBudgetAlerts(req.user._id, itemAmount, itemCategory, date), 10);
          results.push(expense);
        } else {
          const expense = await Expense.create({
            userId: req.user._id,
            amount: itemAmount,
            category: itemCategory,
            date,
            description: itemDescription
          });

          await Transaction.create({
            userId: req.user._id,
            type: 'expense',
            amount: itemAmount,
            category: itemCategory,
            date,
            description: itemDescription,
            referenceId: expense._id
          });

          setTimeout(() => checkBudgetAlerts(req.user._id, itemAmount, itemCategory, date), 10);
          results.push(expense);
        }
      }

      return res.status(201).json({ success: true, count: results.length, data: results });
    }

    // Standard single mode
    if (!amount || !category || !date) {
      res.status(400);
      throw new Error('Please fill in amount, category, and date');
    }

    if (global.useMockDb) {
      const mockId = Math.random().toString(36).substring(7);
      const expense = {
        _id: mockId,
        userId: req.user._id.toString(),
        amount: parseFloat(amount),
        category,
        date: new Date(date),
        description,
        createdAt: new Date()
      };

      global.mockDb.expenses.push(expense);

      // Add to unified transaction ledger
      global.mockDb.transactions.push({
        _id: 't' + mockId,
        userId: req.user._id.toString(),
        type: 'expense',
        amount: parseFloat(amount),
        category,
        date: new Date(date),
        description,
        referenceId: mockId,
        createdAt: new Date()
      });

      // Async process alerts
      setTimeout(() => checkBudgetAlerts(req.user._id, parseFloat(amount), category, date), 10);

      return res.status(201).json({ success: true, data: expense });
    }

    const expense = await Expense.create({
      userId: req.user._id,
      amount,
      category,
      date,
      description
    });

    // Mirror to unified Transactions
    await Transaction.create({
      userId: req.user._id,
      type: 'expense',
      amount,
      category,
      date,
      description,
      referenceId: expense._id
    });

    // Async process alerts
    setTimeout(() => checkBudgetAlerts(req.user._id, parseFloat(amount), category, date), 10);

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

// @desc    Update expense
// @route   PUT /api/expense/:id
// @access  Private
const updateExpense = async (req, res, next) => {
  try {
    const { amount, category, date, description } = req.body;

    if (global.useMockDb) {
      const idx = global.mockDb.expenses.findIndex(exp => exp._id.toString() === req.params.id);

      if (idx === -1) {
        res.status(404);
        throw new Error('Expense not found');
      }

      if (global.mockDb.expenses[idx].userId.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to edit this expense');
      }

      const updated = {
        ...global.mockDb.expenses[idx],
        amount: amount !== undefined ? parseFloat(amount) : global.mockDb.expenses[idx].amount,
        category: category || global.mockDb.expenses[idx].category,
        date: date ? new Date(date) : global.mockDb.expenses[idx].date,
        description: description !== undefined ? description : global.mockDb.expenses[idx].description
      };

      global.mockDb.expenses[idx] = updated;

      // Update mirrored Transaction
      const txIdx = global.mockDb.transactions.findIndex(t => t.referenceId.toString() === req.params.id);
      if (txIdx !== -1) {
        global.mockDb.transactions[txIdx] = {
          ...global.mockDb.transactions[txIdx],
          amount: updated.amount,
          category: updated.category,
          date: updated.date,
          description: updated.description
        };
      }

      // Check alerts
      setTimeout(() => checkBudgetAlerts(req.user._id, updated.amount, updated.category, updated.date), 10);

      return res.status(200).json({ success: true, data: updated });
    }

    let expense = await Expense.findById(req.params.id);

    if (!expense) {
      res.status(404);
      throw new Error('Expense not found');
    }

    // Verify ownership
    if (expense.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to edit this expense');
    }

    expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { amount, category, date, description },
      { new: true, runValidators: true }
    );

    // Update mirrored Transaction
    await Transaction.findOneAndUpdate(
      { referenceId: expense._id },
      { amount, category, date, description }
    );

    // Check alerts
    setTimeout(() => checkBudgetAlerts(req.user._id, expense.amount, expense.category, expense.date), 10);

    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete expense
// @route   DELETE /api/expense/:id
// @access  Private
const deleteExpense = async (req, res, next) => {
  try {
    if (global.useMockDb) {
      const idx = global.mockDb.expenses.findIndex(exp => exp._id.toString() === req.params.id);

      if (idx === -1) {
        res.status(404);
        throw new Error('Expense not found');
      }

      if (global.mockDb.expenses[idx].userId.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to delete this expense');
      }

      global.mockDb.expenses.splice(idx, 1);

      // Remove from transaction ledger
      const txIdx = global.mockDb.transactions.findIndex(t => t.referenceId.toString() === req.params.id);
      if (txIdx !== -1) {
        global.mockDb.transactions.splice(txIdx, 1);
      }

      return res.status(200).json({ success: true, data: {} });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      res.status(404);
      throw new Error('Expense not found');
    }

    // Verify ownership
    if (expense.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to delete this expense');
    }

    await Expense.findByIdAndDelete(req.params.id);

    // Delete mirrored Transaction
    await Transaction.findOneAndDelete({ referenceId: expense._id });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense
};
