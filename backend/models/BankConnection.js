const mongoose = require('mongoose');

const ConnectedAccountSchema = new mongoose.Schema({
  accountId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  mask: {
    type: String
  },
  type: {
    type: String,
    required: true
  },
  subtype: {
    type: String
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  }
});

const BankConnectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  connectionType: {
    type: String,
    enum: ['plaid', 'indian_manual'],
    default: 'plaid'
  },
  institutionId: {
    type: String,
    required: true
  },
  institutionName: {
    type: String,
    required: true
  },
  itemId: {
    type: String
  },
  accessToken: {
    type: String
  },
  accountNumber: {
    type: String
  },
  ifscCode: {
    type: String
  },
  accountHolderName: {
    type: String
  },
  accounts: [ConnectedAccountSchema],
  lastSynced: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BankConnection', BankConnectionSchema);
