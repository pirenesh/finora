const mongoose = require('mongoose');

const BankLoanSchema = new mongoose.Schema({
  bankName: {
    type: String,
    required: true,
    index: true
  },
  loanType: {
    type: String,
    required: true,
    enum: ['Home Loan', 'Personal Loan', 'Education Loan', 'Gold Loan', 'Vehicle Loan'],
    index: true
  },
  interestRate: {
    type: String,
    required: true
  },
  processingFee: {
    type: String,
    required: true
  },
  maxTenureYears: {
    type: Number,
    required: true
  },
  features: [{
    type: String
  }],
  link: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BankLoan', BankLoanSchema);
