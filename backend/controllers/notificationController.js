const Notification = require('../models/Notification');

// @desc    Get all notifications for user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    if (global.useMockDb) {
      // Ensure notifications array exists in mockDb
      if (!global.mockDb.notifications) global.mockDb.notifications = [];
      const userNotifications = global.mockDb.notifications
        .filter(n => n.userId.toString() === req.user._id.toString())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json({ success: true, count: userNotifications.length, data: userNotifications });
    }

    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark specific notification as read
// @route   PUT /api/notifications/:id
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    if (global.useMockDb) {
      const idx = global.mockDb.notifications.findIndex(n => n._id.toString() === req.params.id);
      if (idx === -1) {
        res.status(404);
        throw new Error('Notification not found');
      }

      if (global.mockDb.notifications[idx].userId.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized');
      }

      global.mockDb.notifications[idx].isRead = true;
      return res.status(200).json({ success: true, data: global.mockDb.notifications[idx] });
    }

    let notification = await Notification.findById(req.params.id);
    if (!notification) {
      res.status(404);
      throw new Error('Notification not found');
    }

    if (notification.userId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications for current user as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res, next) => {
  try {
    if (global.useMockDb) {
      if (!global.mockDb.notifications) global.mockDb.notifications = [];
      global.mockDb.notifications.forEach((n, idx) => {
        if (n.userId.toString() === req.user._id.toString()) {
          global.mockDb.notifications[idx].isRead = true;
        }
      });
      return res.status(200).json({ success: true, message: 'All notifications marked as read' });
    }

    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
