const express = require('express');
const router = express.Router();
const db = require('../models');
const authMiddleware = require('../middleware/auth');

// Create/Send Offer (Recruiter/Admin only)
router.post('/', authMiddleware, async (req, res) => {
  if (req.userRole !== 'RECRUITER' && req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Recruiter privileges required.' });
  }

  try {
    const { applicationId, salary, location, joiningDate, employmentType, benefits } = req.body;
    if (!applicationId || !salary || !location || !joiningDate || !employmentType) {
      return res.status(400).json({ error: 'Missing required offer parameter properties.' });
    }

    const app = await db.Application.findById(applicationId);
    if (!app) {
      return res.status(404).json({ error: 'Application record not found.' });
    }

    // Check if offer already sent
    let offer = await db.Offer.findOne({ applicationId });
    if (!offer) {
      offer = new db.Offer({ applicationId });
    }

    offer.salary = salary;
    offer.location = location;
    offer.joiningDate = joiningDate;
    offer.employmentType = employmentType;
    offer.benefits = typeof benefits === 'string' ? benefits : JSON.stringify(benefits || []);
    offer.status = 'SENT';
    
    const savedOffer = await offer.save();

    // Transition Application Status to OFFER
    app.status = 'OFFER';
    await app.save();

    // Create Audit Log
    const log = new db.AuditLog({
      userId: req.userId,
      action: 'SEND_OFFER',
      details: `Sent offer terms for App: ${applicationId}`,
      status: 'SUCCESS'
    });
    await log.save();

    // Auto-Notifications
    try {
      const { sendNotification } = require('../services/notificationService');
      const job = await db.Job.findById(app.jobId);
      const jobTitle = job ? job.title : 'Position';
      await sendNotification(app.candidateId, 'Job Offer Issued!', `Congratulations! You have received a formal Job Offer for the "${jobTitle}" position. Please review and accept in your dashboard.`);
    } catch (e) {}

    res.status(201).json({ message: 'Offer terms drafted and simulation invitation sent.', offer: savedOffer });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all offers (Recruiters/Admins view) or filter by candidate
router.get('/', authMiddleware, async (req, res) => {
  if (req.userRole !== 'RECRUITER' && req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Privileged role required.' });
  }

  try {
    const list = await db.Offer.find();
    const resp = [];

    const parseSafe = (val) => {
      if (!val) return [];
      if (typeof val === 'object') return val;
      try { return JSON.parse(val); } catch (e) { return []; }
    };

    for (const offer of list) {
      const app = await db.Application.findById(offer.applicationId);
      if (!app) continue;

      const candidate = await db.User.findById(app.candidateId).select('-password');
      const job = await db.Job.findById(app.jobId);

      const offerObj = offer.toJSON();
      offerObj.benefits = parseSafe(offerObj.benefits);
      offerObj.candidate = candidate;
      offerObj.job = job;

      resp.push(offerObj);
    }

    res.json(resp);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Candidate's own offers
router.get('/my-offers', authMiddleware, async (req, res) => {
  if (req.userRole !== 'CANDIDATE') {
    return res.status(403).json({ error: 'Access denied. Candidates only.' });
  }

  try {
    const apps = await db.Application.find({ candidateId: req.userId });
    const appIds = apps.map(a => a._id);
    
    const list = await db.Offer.find({ applicationId: { $in: appIds } });
    const resp = [];

    const parseSafe = (val) => {
      if (!val) return [];
      if (typeof val === 'object') return val;
      try { return JSON.parse(val); } catch (e) { return []; }
    };

    for (const offer of list) {
      const app = apps.find(a => a._id === offer.applicationId);
      if (!app) continue;

      const job = await db.Job.findById(app.jobId);
      const offerObj = offer.toJSON();
      offerObj.benefits = parseSafe(offerObj.benefits);
      offerObj.job = job;
      offerObj.application = app;

      resp.push(offerObj);
    }

    res.json(resp);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get offer details by Application ID
router.get('/application/:applicationId', authMiddleware, async (req, res) => {
  try {
    const app = await db.Application.findById(req.params.applicationId);
    if (!app) {
      return res.status(404).json({ error: 'Application record not found.' });
    }

    const isOwner = app.candidateId === req.userId;
    const isStaff = ['RECRUITER', 'ADMIN', 'HIRING_MANAGER'].includes(req.userRole);

    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'Unauthorized access to offer terms.' });
    }

    const offer = await db.Offer.findOne({ applicationId: app._id });
    if (!offer) {
      return res.status(404).json({ error: 'No offer issued for this application.' });
    }

    const parseSafe = (val) => {
      if (!val) return [];
      if (typeof val === 'object') return val;
      try { return JSON.parse(val); } catch (e) { return []; }
    };

    const offerObj = offer.toJSON();
    offerObj.benefits = parseSafe(offerObj.benefits);
    offerObj.application = app;

    const job = await db.Job.findById(app.jobId);
    offerObj.job = job;

    res.json(offerObj);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Candidate Accept Offer
router.post('/:id/accept', authMiddleware, async (req, res) => {
  if (req.userRole !== 'CANDIDATE') {
    return res.status(403).json({ error: 'Only candidate accounts can accept job offers.' });
  }

  try {
    const offer = await db.Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ error: 'Offer record not found.' });
    }

    const app = await db.Application.findById(offer.applicationId);
    if (!app || app.candidateId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized to accept this offer.' });
    }

    offer.status = 'ACCEPTED';
    await offer.save();

    // Transition Application Status to HIRED
    app.status = 'HIRED';
    await app.save();

    // Create Audit Log
    const log = new db.AuditLog({
      userId: req.userId,
      action: 'ACCEPT_OFFER',
      details: `Accepted employment offer terms for Offer ID: ${offer._id}`,
      status: 'SUCCESS'
    });
    await log.save();

    // Auto-Notifications
    try {
      const { sendNotification } = require('../services/notificationService');
      const job = await db.Job.findById(app.jobId);
      const jobTitle = job ? job.title : 'Position';
      // Notify Candidate
      await sendNotification(req.userId, 'Welcome to the Team!', `You have accepted the offer for "${jobTitle}". Acme Solutions is preparing your onboarding plan!`);
      // Notify Recruiter
      if (job && job.createdById) {
        await sendNotification(job.createdById, 'Offer Accepted by Candidate', `Great news! Candidate John Doe has accepted your offer for "${jobTitle}". Onboarding initiated.`);
      }
    } catch (e) {}

    res.json({ message: 'Congratulations! You have accepted the job offer.' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Candidate Reject Offer
router.post('/:id/reject', authMiddleware, async (req, res) => {
  if (req.userRole !== 'CANDIDATE') {
    return res.status(403).json({ error: 'Only candidate accounts can reject job offers.' });
  }

  try {
    const offer = await db.Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ error: 'Offer record not found.' });
    }

    const app = await db.Application.findById(offer.applicationId);
    if (!app || app.candidateId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized to reject this offer.' });
    }

    offer.status = 'REJECTED';
    await offer.save();

    // Transition Application Status to REJECTED
    app.status = 'REJECTED';
    await app.save();

    // Create Audit Log
    const log = new db.AuditLog({
      userId: req.userId,
      action: 'REJECT_OFFER',
      details: `Rejected employment offer terms for Offer ID: ${offer._id}`,
      status: 'SUCCESS'
    });
    await log.save();

    res.json({ message: 'Offer rejected successfully.' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
