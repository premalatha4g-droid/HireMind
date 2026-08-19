require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hiremind';

// Core Middlewares
app.use(cors());
app.use(express.json());

// Rate Limiter security middleware (dependency-free)
const rateLimits = {};
app.use((req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  if (!rateLimits[ip]) rateLimits[ip] = [];
  rateLimits[ip] = rateLimits[ip].filter(timestamp => now - timestamp < 60000); // 1 minute window
  if (rateLimits[ip].length >= 120) {
    return res.status(429).json({ error: 'Too many requests from this IP. Please try again after 60 seconds.' });
  }
  rateLimits[ip].push(now);
  next();
});

// Database Connection & Fail-Safe handling
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connection established successfully.');
    seedDatabase();
  })
  .catch(err => {
    console.error('========================================================================');
    console.error('WARNING: Local MongoDB server is not running or failed to connect.');
    console.error(`Attempted target: ${MONGO_URI}`);
    console.error('Make sure MongoDB is running locally or specify Atlas MONGO_URI in .env.');
    console.error('========================================================================');
  });

// Seed system accounts (matching Java config)
async function seedDatabase() {
  try {
    const usersToSeed = [
      { email: 'candidate@hiremind.ai', name: 'John Doe', role: 'CANDIDATE' },
      { email: 'recruiter@hiremind.ai', name: 'Sarah Recruiter', role: 'RECRUITER' },
      { email: 'interviewer@hiremind.ai', name: 'Interviewer Account', role: 'INTERVIEWER' },
      { email: 'manager@hiremind.ai', name: 'Hiring Manager', role: 'HIRING_MANAGER' },
      { email: 'admin@hiremind.ai', name: 'System Admin', role: 'ADMIN' }
    ];

    const passwordHash = await bcrypt.hash('password123', 10);

    for (const u of usersToSeed) {
      const existing = await db.User.findOne({ email: u.email });
      if (!existing) {
        const user = new db.User({
          email: u.email,
          name: u.name,
          role: u.role,
          password: passwordHash
        });
        await user.save();
        console.log(`Seeded base user: ${u.email} (${u.role})`);
      }
    }
  } catch (err) {
    console.error('Failed to seed default system accounts:', err.message);
  }
}

// Router registrations
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/resume', require('./routes/resume'));
app.use('/api/resumes', require('./routes/resume'));
app.use('/api/readiness', require('./routes/readiness'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/interviews', require('./routes/interviews'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/roadmaps', require('./routes/roadmaps'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));

// Base health route
app.get('/health', (req, res) => {
  res.json({ status: 'UP', database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error occurred.' });
});

app.listen(PORT, () => {
  console.log(`HireMind AI Express server running on port ${PORT}`);
});
