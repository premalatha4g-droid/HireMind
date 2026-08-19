const express = require('express');
const router = express.Router();
const db = require('../models');
const authMiddleware = require('../middleware/auth');
const matchEngine = require('../services/matchEngine');

const parseSafe = (val) => {
  if (!val) return [];
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch (e) { return []; }
};

const formatMatch = (matchAnalysis) => {
  if (!matchAnalysis) return null;
  const formatted = matchAnalysis.toJSON ? matchAnalysis.toJSON() : { ...matchAnalysis };
  formatted.matchedRequiredSkills = parseSafe(formatted.matchedRequiredSkills);
  formatted.missingRequiredSkills = parseSafe(formatted.missingRequiredSkills);
  formatted.matchedPreferredSkills = parseSafe(formatted.matchedPreferredSkills);
  formatted.matchedProjects = parseSafe(formatted.matchedProjects);
  formatted.missingProjectTechnologies = parseSafe(formatted.missingProjectTechnologies);
  formatted.matchedCertifications = parseSafe(formatted.matchedCertifications);
  formatted.missingCertifications = parseSafe(formatted.missingCertifications);
  return formatted;
};

// GET Matches for a specific Job ID
router.get('/job/:jobId', authMiddleware, async (req, res) => {
  if (req.userRole !== 'RECRUITER' && req.userRole !== 'ADMIN' && req.userRole !== 'HIRING_MANAGER') {
    return res.status(403).json({ error: 'Access denied. Privileged role required.' });
  }

  try {
    const jobId = req.params.jobId;
    const applications = await db.Application.find({ jobId });
    
    const matchesList = [];
    for (const app of applications) {
      const candidate = await db.User.findById(app.candidateId).select('-password');
      if (!candidate) continue;
      
      const appObj = app.toJSON();
      appObj.candidate = candidate;

      let matchAnalysis = await db.MatchAnalysis.findOne({ applicationId: app._id });
      if (!matchAnalysis) {
        try {
          matchAnalysis = await matchEngine.calculateMatch(app._id);
        } catch (e) {
          console.warn('Match calculation skipped for app:', app._id, e.message);
        }
      }

      matchesList.push({
        id: app._id,
        applicationId: app._id,
        candidateId: app.candidateId,
        overallScore: app.matchScore || (matchAnalysis ? matchAnalysis.overallScore : 0),
        application: appObj,
        matchAnalysis: formatMatch(matchAnalysis)
      });
    }

    // Sort by overallScore descending
    matchesList.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));

    res.json(matchesList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Trigger on-demand Recalculation for Application
router.post('/calculate', authMiddleware, async (req, res) => {
  try {
    const { applicationId } = req.body;
    if (!applicationId) {
      return res.status(400).json({ error: 'Missing applicationId parameter.' });
    }

    const app = await db.Application.findById(applicationId);
    if (!app) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const matchAnalysis = await matchEngine.calculateMatch(applicationId);
    const readiness = await matchEngine.calculateReadiness(applicationId);

    // Audit log
    const log = new db.AuditLog({
      userId: req.userId,
      action: 'RECALCULATE_MATCH',
      details: `Recalculated match & readiness for Application: ${applicationId}`,
      status: 'SUCCESS'
    });
    await log.save();

    res.json({
      message: 'Match and readiness recalculated successfully.',
      match: formatMatch(matchAnalysis),
      readiness
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Match Analysis for specific Application
router.get('/application/:applicationId', authMiddleware, async (req, res) => {
  try {
    const app = await db.Application.findById(req.params.applicationId);
    if (!app) return res.status(404).json({ error: 'Application not found.' });

    let matchAnalysis = await db.MatchAnalysis.findOne({ applicationId: app._id });
    if (!matchAnalysis) {
      matchAnalysis = await matchEngine.calculateMatch(app._id);
    }

    const gaps = await db.SkillGap.find({ matchAnalysisId: matchAnalysis._id });

    res.json({
      matchAnalysis: formatMatch(matchAnalysis),
      skillGaps: gaps
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
