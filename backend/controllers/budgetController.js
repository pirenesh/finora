const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

// @desc    Get all budgets for a specific month
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res, next) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7); // Default current month YYYY-MM
    
    if (global.useMockDb) {
      const budgets = global.mockDb.budgets.filter(b => b.userId.toString() === req.user._id.toString() && b.month === month);
      
      // Calculate spent amount per category locally
      const start = new Date(`${month}-01T00:00:00.000Z`);
      const nextMonthNum = parseInt(month.slice(5, 7)) + 1;
      const endYear = nextMonthNum > 12 ? parseInt(month.slice(0, 4)) + 1 : parseInt(month.slice(0, 4));
      const endMonth = nextMonthNum > 12 ? '01' : nextMonthNum.toString().padStart(2, '0');
      const end = new Date(`${endYear}-${endMonth}-01T00:00:00.000Z`);

      const spentMap = {};
      global.mockDb.expenses
        .filter(exp => exp.userId.toString() === req.user._id.toString() && new Date(exp.date) >= start && new Date(exp.date) < end)
        .forEach(exp => {
          spentMap[exp.category] = (spentMap[exp.category] || 0) + exp.amount;
        });

      const trackedBudgets = budgets.map(b => {
        const spent = spentMap[b.category] || 0;
        return {
          _id: b._id,
          category: b.category,
          limit: b.limit,
          month: b.month,
          spent,
          percentage: b.limit > 0 ? parseFloat(((spent / b.limit) * 100).toFixed(2)) : 0,
          isOverspent: spent > b.limit
        };
      });

      return res.status(200).json({ success: true, month, data: trackedBudgets });
    }

    // Retrieve budgets set for this month in MongoDB
    const budgets = await Budget.find({ userId: req.user._id, month });
    
    // Calculate spent amount per category
    const startOfMonth = new Date(`${month}-01T00:00:00.000Z`);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    // Aggregate expenses for this user and month by category
    const expensesAgg = await Expense.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startOfMonth, $lt: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' }
        }
      }
    ]);

    const spentMap = {};
    expensesAgg.forEach(exp => {
      spentMap[exp._id] = exp.totalSpent;
    });

    // Form tracking records
    const trackedBudgets = budgets.map(b => {
      const spent = spentMap[b.category] || 0;
      return {
        _id: b._id,
        category: b.category,
        limit: b.limit,
        month: b.month,
        spent,
        percentage: b.limit > 0 ? parseFloat(((spent / b.limit) * 100).toFixed(2)) : 0,
        isOverspent: spent > b.limit
      };
    });

    res.status(200).json({ success: true, month, data: trackedBudgets });
  } catch (error) {
    next(error);
  }
};

// @desc    Set or update a budget limit
// @route   POST /api/budgets
// @access  Private
const setBudget = async (req, res, next) => {
  try {
    const { category, limit, month } = req.body;

    if (!category || limit === undefined || !month) {
      res.status(400);
      throw new Error('Please enter category, limit, and month (YYYY-MM)');
    }

    if (global.useMockDb) {
      const idx = global.mockDb.budgets.findIndex(b => b.userId.toString() === req.user._id.toString() && b.category === category && b.month === month);
      let budget;

      if (idx !== -1) {
        // Update
        global.mockDb.budgets[idx].limit = parseFloat(limit);
        budget = global.mockDb.budgets[idx];
      } else {
        // Create
        budget = {
          _id: Math.random().toString(36).substring(7),
          userId: req.user._id.toString(),
          category,
          limit: parseFloat(limit),
          month,
          createdAt: new Date()
        };
        global.mockDb.budgets.push(budget);
      }

      return res.status(200).json({ success: true, data: budget });
    }

    // Upsert the budget
    const budget = await Budget.findOneAndUpdate(
      { userId: req.user._id, category, month },
      { limit },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: budget });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res, next) => {
  try {
    if (global.useMockDb) {
      const idx = global.mockDb.budgets.findIndex(b => b._id.toString() === req.params.id);

      if (idx === -1) {
        res.status(404);
        throw new Error('Budget not found');
      }

      if (global.mockDb.budgets[idx].userId.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized');
      }

      global.mockDb.budgets.splice(idx, 1);
      return res.status(200).json({ success: true, data: {} });
    }

    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      res.status(404);
      throw new Error('Budget not found');
    }

    if (budget.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    await Budget.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBudgets,
  setBudget,
  deleteBudget
};
