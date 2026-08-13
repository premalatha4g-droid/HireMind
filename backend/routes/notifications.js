const express = require('express');
const router = express.Router();
const db = require('../models');
const authMiddleware = require('../middleware/auth');

// Get all notifications for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const list = await db.Notification.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all as read
router.post('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    await db.Notification.updateMany({ userId: req.userId, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
