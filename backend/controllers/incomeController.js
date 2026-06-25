const Income = require('../models/Income');
const Transaction = require('../models/Transaction');

// @desc    Get all incomes
// @route   GET /api/income
// @access  Private
const getIncomes = async (req, res, next) => {
  try {
    if (global.useMockDb) {
      const userIncomes = global.mockDb.incomes
        .filter(inc => inc.userId.toString() === req.user._id.toString())
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.status(200).json({ success: true, count: userIncomes.length, data: userIncomes });
    }

    const incomes = await Income.find({ userId: req.user._id }).sort({ date: -1 });
    res.status(200).json({ success: true, count: incomes.length, data: incomes });
  } catch (error) {
    next(error);
  }
};

// @desc    Add income
// @route   POST /api/income
// @access  Private
const addIncome = async (req, res, next) => {
  try {
    const { amount, category, date, description, incomes } = req.body;

    // Support bulk add
    if (incomes && Array.isArray(incomes)) {
      if (!date) {
        res.status(400);
        throw new Error('Please specify a date for bulk incomes');
      }

      const results = [];

      for (const item of incomes) {
        const itemAmount = parseFloat(item.amount);
        const itemCategory = item.category;
        const itemDescription = item.description || description || '';

        if (isNaN(itemAmount) || itemAmount <= 0 || !itemCategory) {
          continue; // skip empty or invalid items
        }

        if (global.useMockDb) {
          const mockId = Math.random().toString(36).substring(7);
          const income = {
            _id: mockId,
            userId: req.user._id.toString(),
            amount: itemAmount,
            category: itemCategory,
            date: new Date(date),
            description: itemDescription,
            createdAt: new Date()
          };

          global.mockDb.incomes.push(income);

          global.mockDb.transactions.push({
            _id: 't' + mockId,
            userId: req.user._id.toString(),
            type: 'income',
            amount: itemAmount,
            category: itemCategory,
            date: new Date(date),
            description: itemDescription,
            referenceId: mockId,
            createdAt: new Date()
          });

          results.push(income);
        } else {
          const income = await Income.create({
            userId: req.user._id,
            amount: itemAmount,
            category: itemCategory,
            date,
            description: itemDescription
          });

          await Transaction.create({
            userId: req.user._id,
            type: 'income',
            amount: itemAmount,
            category: itemCategory,
            date,
            description: itemDescription,
            referenceId: income._id
          });

          results.push(income);
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
      const income = {
        _id: mockId,
        userId: req.user._id.toString(),
        amount: parseFloat(amount),
        category,
        date: new Date(date),
        description,
        createdAt: new Date()
      };

      global.mockDb.incomes.push(income);

      // Add to unified transaction ledger
      global.mockDb.transactions.push({
        _id: 't' + mockId,
        userId: req.user._id.toString(),
        type: 'income',
        amount: parseFloat(amount),
        category,
        date: new Date(date),
        description,
        referenceId: mockId,
        createdAt: new Date()
      });

      return res.status(201).json({ success: true, data: income });
    }

    const income = await Income.create({
      userId: req.user._id,
      amount,
      category,
      date,
      description
    });

    // Mirror to unified Transactions
    await Transaction.create({
      userId: req.user._id,
      type: 'income',
      amount,
      category,
      date,
      description,
      referenceId: income._id
    });

    res.status(201).json({ success: true, data: income });
  } catch (error) {
    next(error);
  }
};

// @desc    Update income
// @route   PUT /api/income/:id
// @access  Private
const updateIncome = async (req, res, next) => {
  try {
    const { amount, category, date, description } = req.body;

    if (global.useMockDb) {
      const idx = global.mockDb.incomes.findIndex(inc => inc._id.toString() === req.params.id);
      
      if (idx === -1) {
        res.status(404);
        throw new Error('Income not found');
      }

      if (global.mockDb.incomes[idx].userId.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to edit this income');
      }

      const updated = {
        ...global.mockDb.incomes[idx],
        amount: amount !== undefined ? parseFloat(amount) : global.mockDb.incomes[idx].amount,
        category: category || global.mockDb.incomes[idx].category,
        date: date ? new Date(date) : global.mockDb.incomes[idx].date,
        description: description !== undefined ? description : global.mockDb.incomes[idx].description
      };

      global.mockDb.incomes[idx] = updated;

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

      return res.status(200).json({ success: true, data: updated });
    }

    let income = await Income.findById(req.params.id);

    if (!income) {
      res.status(404);
      throw new Error('Income not found');
    }

    // Verify ownership
    if (income.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to edit this income');
    }

    income = await Income.findByIdAndUpdate(
      req.params.id,
      { amount, category, date, description },
      { new: true, runValidators: true }
    );

    // Update mirrored Transaction
    await Transaction.findOneAndUpdate(
      { referenceId: income._id },
      { amount, category, date, description }
    );

    res.status(200).json({ success: true, data: income });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete income
// @route   DELETE /api/income/:id
// @access  Private
const deleteIncome = async (req, res, next) => {
  try {
    if (global.useMockDb) {
      const idx = global.mockDb.incomes.findIndex(inc => inc._id.toString() === req.params.id);

      if (idx === -1) {
        res.status(404);
        throw new Error('Income not found');
      }

      if (global.mockDb.incomes[idx].userId.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to delete this income');
      }

      global.mockDb.incomes.splice(idx, 1);

      // Remove from transaction ledger
      const txIdx = global.mockDb.transactions.findIndex(t => t.referenceId.toString() === req.params.id);
      if (txIdx !== -1) {
        global.mockDb.transactions.splice(txIdx, 1);
      }

      return res.status(200).json({ success: true, data: {} });
    }

    const income = await Income.findById(req.params.id);

    if (!income) {
      res.status(404);
      throw new Error('Income not found');
    }

    // Verify ownership
    if (income.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to delete this income');
    }

    await Income.findByIdAndDelete(req.params.id);

    // Delete mirrored Transaction
    await Transaction.findOneAndDelete({ referenceId: income._id });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getIncomes,
  addIncome,
  updateIncome,
  deleteIncome
};
