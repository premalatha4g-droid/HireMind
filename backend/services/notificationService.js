const db = require('../models');

const sendNotification = async (userId, title, message, type = 'EMAIL') => {
  try {
    const notification = new db.Notification({
      userId,
      title,
      message,
      type
    });
    await notification.save();
    console.log(`[Simulated Notification] Sent to ${userId}: ${title} - ${message}`);
  } catch (err) {
    console.error('Failed to save simulated notification:', err.message);
  }
};

module.exports = { sendNotification };
