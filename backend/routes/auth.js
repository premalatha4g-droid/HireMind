const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'hiremind_super_secure_jwt_token_secret_key_12345678901234567890';

// Register User
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing registration details.' });
    }

    const existingUser = await db.User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already registered.' });
    }

    // BCrypt Hashing
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new db.User({
      name,
      email,
      password: hashedPassword,
      role
    });

    const savedUser = await user.save();

    // Log transaction
    const log = new db.AuditLog({
      userId: savedUser._id,
      action: 'USER_REGISTER',
      details: `User registered: ${email} (${role})`,
      status: 'SUCCESS'
    });
    await log.save();

    // Generate JWT token
    const token = jwt.sign({ userId: savedUser._id, email: savedUser.email, role: savedUser.role }, JWT_SECRET, { expiresIn: '24h' });

    // Auto-Notification
    try {
      const { sendNotification } = require('../services/notificationService');
      await sendNotification(savedUser._id, 'Welcome to HireMind AI', `Dear ${savedUser.name}, your account registration was successful. Welcome aboard!`);
    } catch (e) {}

    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password, isGoogleLogin } = req.body;
    if (!email || (!password && !isGoogleLogin)) {
      return res.status(400).json({ error: 'Missing login credentials.' });
    }

    const user = await db.User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify Password unless Google Login Identity is requested
    if (!isGoogleLogin) {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
    }

    // Check if 2FA is enabled
    if (user.is2FAEnabled) {
      return res.status(200).json({
        requires2FA: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }

    // Log transaction
    const log = new db.AuditLog({
      userId: user._id,
      action: 'USER_LOGIN',
      details: `User logged in: ${email}`,
      status: 'SUCCESS'
    });
    await log.save();

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify 2FA OTP Code
router.post('/2fa/verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Missing 2FA verification parameters.' });
    }

    const user = await db.User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Verify simulated OTP code (accepts 123456 for the simulation demo)
    if (code !== '123456') {
      return res.status(400).json({ error: 'Invalid 2FA verification code. Use simulated code 123456.' });
    }

    // Log transaction
    const log = new db.AuditLog({
      userId: user._id,
      action: 'USER_2FA_VERIFY',
      details: `User completed 2FA: ${email}`,
      status: 'SUCCESS'
    });
    await log.save();

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle 2FA status
router.post('/2fa/toggle', authMiddleware, async (req, res) => {
  try {
    const user = await db.User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    user.is2FAEnabled = !user.is2FAEnabled;
    const saved = await user.save();

    // Log transaction
    const log = new db.AuditLog({
      userId: req.userId,
      action: 'TOGGLE_2FA',
      details: `Toggled 2FA to: ${saved.is2FAEnabled}`,
      status: 'SUCCESS'
    });
    await log.save();

    res.json({ is2FAEnabled: saved.is2FAEnabled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Candidates list
router.get('/candidates', authMiddleware, async (req, res) => {
  if (req.userRole !== 'RECRUITER' && req.userRole !== 'ADMIN' && req.userRole !== 'HIRING_MANAGER') {
    return res.status(403).json({ error: 'Access denied. Privileged role required.' });
  }
  try {
    const list = await db.User.find({ role: 'CANDIDATE' }).select('-password');
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Interviewers list
router.get('/interviewers', authMiddleware, async (req, res) => {
  if (req.userRole !== 'RECRUITER' && req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Privileged role required.' });
  }
  try {
    const list = await db.User.find({ role: 'INTERVIEWER' }).select('-password');
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Users directory
router.get('/users', authMiddleware, async (req, res) => {
  if (req.userRole !== 'ADMIN' && req.userRole !== 'RECRUITER') {
    return res.status(403).json({ error: 'Access denied. Privileged role required.' });
  }
  try {
    const list = await db.User.find().select('-password');
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing reset parameters.' });
    }
    const user = await db.User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No user registered with this email.' });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all registered accounts for Google Simulated OAuth list
router.get('/google-accounts', async (req, res) => {
  try {
    const users = await db.User.find({}, 'name email role');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
