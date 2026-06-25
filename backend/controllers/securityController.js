const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

// @desc    Get user security dashboard data (activity logs, sessions, status)
// @route   GET /api/security/dashboard
// @access  Private
const getSecurityDashboard = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+isEmailVerified');

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const activityLogs = await ActivityLog.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10); // recent 10 activities

    const lastLogin = await ActivityLog.findOne({ userId: req.user._id, action: 'LOGIN_SUCCESS' })
      .sort({ createdAt: -1 });

    const passwordChanges = await ActivityLog.countDocuments({ userId: req.user._id, action: 'PASSWORD_CHANGE' });

    // Dummy score calculation based on verified email, password changes, etc.
    let score = 50;
    if (user.isEmailVerified) score += 20;
    if (passwordChanges > 0) score += 10;
    if (activityLogs.length > 0) score += 20;

    res.status(200).json({
      success: true,
      data: {
        isEmailVerified: user.isEmailVerified,
        securityScore: score,
        lastLogin: lastLogin ? lastLogin.createdAt : null,
        recentActivity: activityLogs
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSecurityDashboard
};
