const Notification = require('../models/Notification');
const { NotFoundError } = require('../utils/errors');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Get user's notifications
 * GET /api/v1/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    return sendSuccess(res, { notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark notification as read
 * PATCH /api/v1/notifications/:notificationId/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    return sendSuccess(res, { notification }, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
};

/**
 * Mark all as read
 * PATCH /api/v1/notifications/mark-all-read
 */
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    return sendSuccess(res, {}, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
