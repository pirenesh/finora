const mongoose = require('mongoose');

const RepaymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: [0, 'Repayment amount cannot be negative']
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  description: {
    type: String,
    trim: true
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }
});

const DebtSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lenderBorrowerName: {
    type: String,
    required: [true, 'Lender or Borrower name is required'],
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['borrowed', 'lent']
  },
  amount: {
    type: Number,
    required: [true, 'Principal amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  interestRate: {
    type: Number,
    default: 0,
    min: [0, 'Interest rate cannot be negative']
  },
  interestPeriod: {
    type: String,
    enum: ['none', 'monthly', 'yearly'],
    default: 'none'
  },
  interestType: {
    type: String,
    enum: ['simple', 'compound'],
    default: 'simple'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  accountNumber: {
    type: String,
    trim: true
  },
  ifscCode: {
    type: String,
    trim: true
  },
  upiId: {
    type: String,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  dueDate: {
    type: Date
  },
  dueFrequency: {
    type: String,
    enum: ['once', 'monthly', 'yearly'],
    default: 'once'
  },
  lastReminderSent: {
    type: Date
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'paid'],
    default: 'active'
  },
  repayments: [RepaymentSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Debt', DebtSchema);
