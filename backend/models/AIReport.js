const mongoose = require('mongoose');

const AIReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: String,
    required: true,
    match: [/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format']
  },
  healthScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  healthStatus: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  spendingPatterns: [
    {
      category: String,
      status: String,
      description: String
    }
  ],
  savingsSuggestions: [String],
  recommendations: [String],
  predictiveAnalytics: {
    nextMonthExpenses: Number,
    expectedSavings: Number,
    spendingForecast: String
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
});

AIReportSchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('AIReport', AIReportSchema);
