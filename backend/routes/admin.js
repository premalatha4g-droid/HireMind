const express = require('express');
const router = express.Router();
const db = require('../models');
const authMiddleware = require('../middleware/auth');

// Get Immutable Audit Logs (Admin only)
router.get('/audit-logs', authMiddleware, async (req, res) => {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }

  try {
    const list = await db.AuditLog.find().sort({ createdAt: -1 });
    const resp = [];

    for (const log of list) {
      const user = await db.User.findById(log.userId).select('name email role');
      const logObj = log.toJSON();
      logObj.user = user;
      resp.push(logObj);
    }

    res.json(resp);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
