const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Category is required']
  },
  limit: {
    type: Number,
    required: [true, 'Limit is required'],
    min: [0, 'Limit cannot be negative']
  },
  month: {
    type: String,
    required: [true, 'Month is required'],
    match: [/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a user can only have one budget per category per month
BudgetSchema.index({ userId: 1, category: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Budget', BudgetSchema);
