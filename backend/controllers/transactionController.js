const Transaction = require('../models/Transaction');

// @desc    Get all transactions (with filters, sorting, search)
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  try {
    const { type, category, startDate, endDate, search, sortBy, sortOrder } = req.query;

    if (global.useMockDb) {
      let filtered = global.mockDb.transactions.filter(t => t.userId.toString() === req.user._id.toString());

      // Filter by type
      if (type) {
        filtered = filtered.filter(t => t.type === type);
      }

      // Filter by category
      if (category) {
        filtered = filtered.filter(t => t.category === category);
      }

      // Filter by date range
      if (startDate || endDate) {
        filtered = filtered.filter(t => {
          const tDate = new Date(t.date);
          if (startDate && tDate < new Date(startDate)) return false;
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (tDate > end) return false;
          }
          return true;
        });
      }

      // Search by description or category
      if (search) {
        const term = search.toLowerCase();
        filtered = filtered.filter(t => 
          (t.description && t.description.toLowerCase().includes(term)) || 
          t.category.toLowerCase().includes(term)
        );
      }

      // Sort
      const field = sortBy || 'date';
      const isAsc = sortOrder === 'asc';

      filtered.sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];

        if (field === 'date') {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }

        if (aVal < bVal) return isAsc ? -1 : 1;
        if (aVal > bVal) return isAsc ? 1 : -1;
        return 0;
      });

      // Calculate summaries
      const summary = { income: 0, expense: 0, balance: 0 };
      filtered.forEach(t => {
        if (t.type === 'income') summary.income += t.amount;
        else summary.expense += t.amount;
      });
      summary.balance = summary.income - summary.expense;

      return res.status(200).json({
        success: true,
        count: filtered.length,
        summary,
        data: filtered
      });
    }

    const query = { userId: req.user._id };

    // Filter by type ('income' or 'expense')
    if (type) {
      query.type = type;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        // Extend to end of the day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Search by description or category
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort settings
    const sort = {};
    const field = sortBy || 'date';
    const order = sortOrder === 'asc' ? 1 : -1;
    sort[field] = order;

    const transactions = await Transaction.find(query).sort(sort);

    // Calculate overall summaries for the matching query (useful for analytics)
    const summary = {
      income: 0,
      expense: 0,
      balance: 0
    };

    transactions.forEach(t => {
      if (t.type === 'income') {
        summary.income += t.amount;
      } else {
        summary.expense += t.amount;
      }
    });
    summary.balance = summary.income - summary.expense;

    res.status(200).json({
      success: true,
      count: transactions.length,
      summary,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions
};
