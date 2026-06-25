const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  targetAmount: {
    type: Number,
    required: true
  },
  currentSavings: {
    type: Number,
    required: true,
    default: 0
  },
  targetDate: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    enum: ['housing', 'vehicle', 'education', 'travel', 'retirement', 'savings', 'wedding', 'business', 'electronics', 'investment', 'charity', 'health', 'emergency', 'other'],
    default: 'savings'
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'achieved'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Goal', GoalSchema);
