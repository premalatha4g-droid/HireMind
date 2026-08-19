const express = require('express');
const router = express.Router();
const db = require('../models');
const authMiddleware = require('../middleware/auth');

const parseSafe = (val) => {
  if (!val) return [];
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch (e) { return []; }
};

// Create/Send Offer (Recruiter/Admin/Hiring Manager)
router.post('/', authMiddleware, async (req, res) => {
  if (req.userRole !== 'RECRUITER' && req.userRole !== 'ADMIN' && req.userRole !== 'HIRING_MANAGER') {
    return res.status(403).json({ error: 'Access denied. Privileged role required.' });
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
      action: 'CREATE_OFFER',
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

// Format single offer helper
const formatOfferDetails = async (offer) => {
  const app = await db.Application.findById(offer.applicationId);
  if (!app) return null;

  const candidate = await db.User.findById(app.candidateId).select('-password');
  const job = await db.Job.findById(app.jobId);

  const offerObj = offer.toJSON ? offer.toJSON() : { ...offer };
  offerObj.id = offerObj._id || offerObj.id;
  offerObj.benefits = parseSafe(offerObj.benefits);
  offerObj.jobTitle = job ? job.title : 'Position';
  offerObj.candidateName = candidate ? candidate.name : 'Candidate';
  offerObj.candidate = candidate;
  offerObj.job = job;
  offerObj.application = app;

  return offerObj;
};

// Get all offers (Recruiters/Admins view)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let list;
    if (req.userRole === 'CANDIDATE') {
      const apps = await db.Application.find({ candidateId: req.userId });
      const appIds = apps.map(a => a._id);
      list = await db.Offer.find({ applicationId: { $in: appIds } });
    } else {
      list = await db.Offer.find();
    }

    const resp = [];
    for (const offer of list) {
      const formatted = await formatOfferDetails(offer);
      if (formatted) resp.push(formatted);
    }

    res.json(resp);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Candidate or Recruiter offers (GET /my-offers)
router.get('/my-offers', authMiddleware, async (req, res) => {
  try {
    let list;
    if (req.userRole === 'CANDIDATE') {
      const apps = await db.Application.find({ candidateId: req.userId });
      const appIds = apps.map(a => a._id);
      list = await db.Offer.find({ applicationId: { $in: appIds } });
    } else {
      // Recruiter or Admin
      list = await db.Offer.find();
    }

    const resp = [];
    for (const offer of list) {
      const formatted = await formatOfferDetails(offer);
      if (formatted) resp.push(formatted);
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

    const isOwner = app.candidateId && req.userId && app.candidateId.toString() === req.userId.toString();
    const isStaff = ['RECRUITER', 'ADMIN', 'HIRING_MANAGER'].includes(req.userRole);

    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'Unauthorized access to offer terms.' });
    }

    const offer = await db.Offer.findOne({ applicationId: app._id });
    if (!offer) {
      return res.status(404).json({ error: 'No offer issued for this application.' });
    }

    const formatted = await formatOfferDetails(offer);
    res.json(formatted);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Common Offer Response Handler
const handleOfferResponse = async (req, res, forceDecision = null) => {
  try {
    const decision = forceDecision || req.body.response || req.body.action || '';
    const isAccept = decision.toUpperCase() === 'ACCEPT';

    const offer = await db.Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ error: 'Offer record not found.' });
    }

    const app = await db.Application.findById(offer.applicationId);
    if (!app) {
      return res.status(404).json({ error: 'Associated application record not found.' });
    }

    if (isAccept) {
      offer.status = 'ACCEPTED';
      app.status = 'HIRED';
    } else {
      offer.status = 'DECLINED';
      app.status = 'REJECTED';
    }

    await offer.save();
    await app.save();

    // Create Audit Log
    const log = new db.AuditLog({
      userId: req.userId,
      action: isAccept ? 'ACCEPT_OFFER' : 'DECLINE_OFFER',
      details: `${isAccept ? 'Accepted' : 'Declined'} employment offer terms for Offer ID: ${offer._id}`,
      status: 'SUCCESS'
    });
    await log.save();

    // Auto-Notifications
    try {
      const { sendNotification } = require('../services/notificationService');
      const job = await db.Job.findById(app.jobId);
      const jobTitle = job ? job.title : 'Position';
      if (isAccept) {
        await sendNotification(req.userId, 'Welcome to the Team!', `You have accepted the offer for "${jobTitle}". Onboarding is now initiated!`);
        if (job && job.createdById) {
          await sendNotification(job.createdById, 'Offer Accepted by Candidate', `Candidate has accepted your offer for "${jobTitle}".`);
        }
      } else {
        await sendNotification(req.userId, 'Offer Response Logged', `You have declined the offer for "${jobTitle}".`);
        if (job && job.createdById) {
          await sendNotification(job.createdById, 'Offer Declined', `Candidate has declined the offer for "${jobTitle}".`);
        }
      }
    } catch (e) {}

    res.json({ message: `Offer ${isAccept ? 'accepted' : 'declined'} successfully.` });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Candidate Respond to Offer (POST /:id/respond)
router.post('/:id/respond', authMiddleware, (req, res) => handleOfferResponse(req, res));

// Candidate Accept Offer (POST /:id/accept)
router.post('/:id/accept', authMiddleware, (req, res) => handleOfferResponse(req, res, 'ACCEPT'));

// Candidate Reject Offer (POST /:id/reject)
router.post('/:id/reject', authMiddleware, (req, res) => handleOfferResponse(req, res, 'DECLINE'));

module.exports = router;
