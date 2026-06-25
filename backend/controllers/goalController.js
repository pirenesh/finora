const Goal = require('../models/Goal');

// @desc    Get user goals
// @route   GET /api/goals
// @access  Private
const getGoals = async (req, res, next) => {
  try {
    if (global.useMockDb) {
      const userGoals = (global.mockDb.goals || [])
        .filter(g => g.userId.toString() === req.user._id.toString())
        .sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
      return res.status(200).json({ success: true, count: userGoals.length, data: userGoals });
    }

    const goals = await Goal.find({ userId: req.user._id }).sort({ targetDate: 1 });
    res.status(200).json({ success: true, count: goals.length, data: goals });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a financial goal
// @route   POST /api/goals
// @access  Private
const createGoal = async (req, res, next) => {
  try {
    const { name, targetAmount, currentSavings, targetDate, category, description } = req.body;

    if (!name || !targetAmount || !targetDate) {
      res.status(400);
      throw new Error('Please enter name, target amount, and target date');
    }

    const userId = req.user._id;

    if (global.useMockDb) {
      const mockId = Math.random().toString(36).substring(7);
      const newGoal = {
        _id: mockId,
        userId: userId.toString(),
        name,
        targetAmount: parseFloat(targetAmount),
        currentSavings: parseFloat(currentSavings || 0),
        targetDate: new Date(targetDate),
        category: category || 'savings',
        description: description || '',
        status: 'active',
        createdAt: new Date()
      };

      if (!global.mockDb.goals) global.mockDb.goals = [];
      global.mockDb.goals.push(newGoal);

      return res.status(201).json({ success: true, data: newGoal });
    }

    const goal = await Goal.create({
      userId,
      name,
      targetAmount,
      currentSavings: currentSavings || 0,
      targetDate,
      category,
      description
    });

    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user goal
// @route   PUT /api/goals/:id
// @access  Private
const updateGoal = async (req, res, next) => {
  try {
    const { name, targetAmount, currentSavings, targetDate, category, description, status } = req.body;

    if (global.useMockDb) {
      const idx = (global.mockDb.goals || []).findIndex(g => g._id.toString() === req.params.id);

      if (idx === -1) {
        res.status(404);
        throw new Error('Goal not found');
      }

      if (global.mockDb.goals[idx].userId.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized');
      }

      const current = global.mockDb.goals[idx];
      const updated = {
        ...current,
        name: name !== undefined ? name : current.name,
        targetAmount: targetAmount !== undefined ? parseFloat(targetAmount) : current.targetAmount,
        currentSavings: currentSavings !== undefined ? parseFloat(currentSavings) : current.currentSavings,
        targetDate: targetDate ? new Date(targetDate) : current.targetDate,
        category: category !== undefined ? category : current.category,
        description: description !== undefined ? description : current.description,
        status: status !== undefined ? status : current.status
      };

      if (updated.currentSavings >= updated.targetAmount) {
        updated.status = 'achieved';
      } else {
        updated.status = 'active';
      }

      global.mockDb.goals[idx] = updated;
      return res.status(200).json({ success: true, data: updated });
    }

    let goal = await Goal.findById(req.params.id);
    if (!goal) {
      res.status(404);
      throw new Error('Goal not found');
    }

    if (goal.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const updates = { name, targetAmount, currentSavings, targetDate, category, description, status };
    
    const newSavings = currentSavings !== undefined ? parseFloat(currentSavings) : goal.currentSavings;
    const newTarget = targetAmount !== undefined ? parseFloat(targetAmount) : goal.targetAmount;
    if (newSavings >= newTarget) {
      updates.status = 'achieved';
    } else {
      updates.status = 'active';
    }

    goal = await Goal.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: goal });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user goal
// @route   DELETE /api/goals/:id
// @access  Private
const deleteGoal = async (req, res, next) => {
  try {
    if (global.useMockDb) {
      const idx = (global.mockDb.goals || []).findIndex(g => g._id.toString() === req.params.id);

      if (idx === -1) {
        res.status(404);
        throw new Error('Goal not found');
      }

      if (global.mockDb.goals[idx].userId.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized');
      }

      global.mockDb.goals.splice(idx, 1);
      return res.status(200).json({ success: true, data: {} });
    }

    const goal = await Goal.findById(req.params.id);
    if (!goal) {
      res.status(404);
      throw new Error('Goal not found');
    }

    if (goal.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    await Goal.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal
};
