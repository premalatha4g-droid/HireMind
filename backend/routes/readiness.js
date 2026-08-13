const express = require('express');
const router = express.Router();
const db = require('../models');
const authMiddleware = require('../middleware/auth');
const matchEngine = require('../services/matchEngine');

// Get Dashboard Analytics (Recruiter/Admin only)
router.get('/dashboard-stats', authMiddleware, async (req, res) => {
  if (req.userRole !== 'RECRUITER' && req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Privileged role required.' });
  }

  try {
    const totalJobs = await db.Job.countDocuments();
    const apps = await db.Application.find();
    
    let strongMatches = 0;
    const pipeline = {
      APPLIED: 0,
      SCREENING: 0,
      SHORTLISTED: 0,
      INTERVIEW: 0,
      ASSESSMENT: 0,
      OFFER: 0,
      HIRED: 0,
      REJECTED: 0
    };

    apps.forEach(app => {
      if (app.matchScore && app.matchScore >= 80) {
        strongMatches++;
      }
      const status = (app.status || 'APPLIED').toUpperCase();
      pipeline[status] = (pipeline[status] || 0) + 1;
    });

    const readinessList = await db.ReadinessAnalysis.find();
    let highReadiness = 0;
    readinessList.forEach(r => {
      if (r.readinessScore && r.readinessScore >= 75) {
        highReadiness++;
      }
    });

    const evidences = await db.SkillEvidence.find();
    let needsVerification = 0;
    const confidenceDist = { HIGH: 0, MEDIUM: 0, LOW: 0 };

    evidences.forEach(ev => {
      if (ev.verificationStatus && ev.verificationStatus.toUpperCase() === 'UNVERIFIED') {
        needsVerification++;
      }
      const conf = (ev.confidence || 'LOW').toUpperCase();
      if (confidenceDist[conf] !== undefined) {
        confidenceDist[conf]++;
      }
    });

    res.json({
      totalJobs,
      totalApplications: apps.length,
      strongMatches,
      highReadiness,
      needsVerification,
      pipeline,
      confidenceDist
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Candidate Stats (for Candidate dashboard widgets)
router.get('/candidate-stats', authMiddleware, async (req, res) => {
  if (req.userRole !== 'CANDIDATE') {
    return res.status(403).json({ error: 'Only candidate accounts can access candidate dashboard stats.' });
  }

  try {
    const apps = await db.Application.find({ candidateId: req.userId });
    const resume = await db.Resume.findOne({ candidateId: req.userId });
    
    let profileCompleteness = 25; // Base profile creation score
    if (resume) {
      profileCompleteness += 25;
      const analysis = await db.ResumeAnalysis.findOne({ resumeId: resume._id });
      if (analysis) {
        try {
          if (JSON.parse(analysis.experience || '[]').length > 0) profileCompleteness += 25;
          if (JSON.parse(analysis.projects || '[]').length > 0) profileCompleteness += 25;
        } catch (e) {}
      }
    }

    const assessmentsCount = await db.Submission.countDocuments({ candidateId: req.userId });
    const offersCount = await db.Offer.countDocuments(); // Fallback simulation

    res.json({
      profileCompleteness: Math.min(100, profileCompleteness),
      totalApplications: apps.length,
      assessmentsCount,
      offersCount
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Readiness Report by Application ID (Both /application and /report paths mapped for UI resilience)
router.get('/application/:applicationId', authMiddleware, getReadinessReport);
router.get('/report/:applicationId', authMiddleware, getReadinessReport);

async function getReadinessReport(req, res) {
  try {
    const app = await db.Application.findById(req.params.applicationId);
    if (!app) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const isOwner = app.candidateId === req.userId;
    const isStaff = ['RECRUITER', 'ADMIN', 'HIRING_MANAGER'].includes(req.userRole);

    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'Unauthorized access to readiness report.' });
    }

    let readiness = await db.ReadinessAnalysis.findOne({ applicationId: app._id });
    if (!readiness) {
      // Calculate on the fly
      try {
        readiness = await matchEngine.calculateReadiness(app._id);
      } catch (err) {
        return res.status(404).json({ error: 'Readiness report not calculated yet.' });
      }
    }

    const parseSafe = (val) => {
      if (!val) return [];
      if (typeof val === 'object') return val;
      try { return JSON.parse(val); } catch (e) { return []; }
    };

    const readinessObj = readiness.toJSON();
    readinessObj.evidenceConflicts = parseSafe(readinessObj.evidenceConflicts);

    // Fetch candidate's related SkillEvidences as part of report
    const skillEvidence = await db.SkillEvidence.find({ candidateId: app.candidateId });
    readinessObj.skillEvidence = skillEvidence;

    res.json(readinessObj);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Recruiter override verification Status
router.post('/override', authMiddleware, async (req, res) => {
  if (req.userRole !== 'RECRUITER' && req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Recruiter privileges required.' });
  }

  try {
    const { skillEvidenceId, verificationStatus, recruiterNotes, overrideConfidence } = req.body;
    if (!skillEvidenceId || !verificationStatus) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    const evidence = await db.SkillEvidence.findById(skillEvidenceId);
    if (!evidence) {
      return res.status(404).json({ error: 'Skill evidence record not found.' });
    }

    evidence.verificationStatus = verificationStatus;
    evidence.recruiterNotes = recruiterNotes || null;
    evidence.overrideConfidence = overrideConfidence || null;
    evidence.updatedAt = new Date();

    const savedEvidence = await evidence.save();

    // Recalculate match and readiness for all candidate's applications
    const apps = await db.Application.find({ candidateId: evidence.candidateId });
    for (const app of apps) {
      try {
        await matchEngine.calculateMatch(app._id);
      } catch (e) {}
    }

    res.json({ message: 'Manual override verification saved.', evidence: savedEvidence });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
