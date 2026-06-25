const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE', 'PROFILE_UPDATE', 'ACCOUNT_LOCKED', 'REGISTER']
  },
  ipAddress: {
    type: String
  },
  deviceInfo: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '90d' // Automatically delete logs after 90 days
  }
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
