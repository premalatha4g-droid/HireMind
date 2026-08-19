const express = require('express');
const router = express.Router();
const db = require('../models');
const authMiddleware = require('../middleware/auth');
const geminiService = require('../services/geminiService');
const matchEngine = require('../services/matchEngine');

// Format JobAnalysis stringified properties back to JSON Arrays
const formatJobAnalysis = (analysis) => {
  if (!analysis) return null;
  const analysisObj = analysis.toJSON ? analysis.toJSON() : { ...analysis };
  
  const parseSafe = (val) => {
    if (!val) return [];
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch (e) { return []; }
  };

  return {
    id: analysisObj._id || analysisObj.id,
    jobId: analysisObj.jobId,
    summary: analysisObj.summary,
    experienceYears: analysisObj.experienceYears,
    education: analysisObj.education,
    seniorityLevel: analysisObj.seniorityLevel,
    isRealAI: analysisObj.isRealAI,
    createdAt: analysisObj.createdAt,
    responsibilities: parseSafe(analysisObj.responsibilities),
    requiredSkills: parseSafe(analysisObj.requiredSkills),
    preferredSkills: parseSafe(analysisObj.preferredSkills),
    certifications: parseSafe(analysisObj.certifications),
    technologies: parseSafe(analysisObj.technologies)
  };
};

// Get all Jobs (populates skills on each job)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const list = await db.Job.find(filter).sort({ createdAt: -1 });
    const formattedJobs = [];

    for (const j of list) {
      const jobObj = j.toJSON();
      const skills = await db.JobSkill.find({ jobId: j._id });
      jobObj.skills = skills;
      formattedJobs.push(jobObj);
    }

    res.json(formattedJobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analyze job description (creates draft)
router.post('/analyze', authMiddleware, async (req, res) => {
  if (req.userRole !== 'RECRUITER' && req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Recruiter privileges required.' });
  }

  try {
    const { title, company, description, location, employmentType, experienceYears, salary } = req.body;
    if (!title || !company || !description || !location || !employmentType || experienceYears === undefined || !salary) {
      return res.status(400).json({ error: 'Missing required job parameter properties.' });
    }

    // Save Job as DRAFT
    const job = new db.Job({
      title,
      company,
      description,
      location,
      employmentType,
      experienceYears: parseInt(experienceYears) || 0,
      salary,
      status: 'DRAFT',
      createdById: req.userId
    });

    const savedJob = await job.save();

    // Run AI description requirement parsing
    const aiResult = geminiService.analyzeJobDescription(title, description);
    const parsed = JSON.parse(aiResult);

    const analysis = new db.JobAnalysis({
      jobId: savedJob._id,
      summary: parsed.summary || '',
      responsibilities: JSON.stringify(parsed.responsibilities || []),
      requiredSkills: JSON.stringify(parsed.requiredSkills || []),
      preferredSkills: JSON.stringify(parsed.preferredSkills || []),
      experienceYears: parseInt(experienceYears) || 0,
      education: parsed.education || '',
      certifications: JSON.stringify(parsed.certifications || []),
      technologies: JSON.stringify(parsed.technologies || []),
      seniorityLevel: parsed.seniorityLevel || 'MID',
      isRealAI: !!parsed.isRealAI
    });

    const savedAnalysis = await analysis.save();

    // Create JobSkill records
    const tempSkills = [];
    if (parsed.requiredSkills) {
      for (const s of parsed.requiredSkills) {
        const js = new db.JobSkill({ jobId: savedJob._id, skillName: s, isRequired: true });
        tempSkills.push(await js.save());
      }
    }
    if (parsed.preferredSkills) {
      for (const s of parsed.preferredSkills) {
        const js = new db.JobSkill({ jobId: savedJob._id, skillName: s, isRequired: false });
        tempSkills.push(await js.save());
      }
    }

    // Log action
    const log = new db.AuditLog({
      userId: req.userId,
      action: 'ANALYZE_JOB_DESCRIPTION',
      details: `Job ID: ${savedJob._id} - ${title}`,
      status: 'SUCCESS'
    });
    await log.save();

    res.status(201).json({
      message: 'Job description analyzed and saved as draft.',
      job: savedJob,
      analysis: formatJobAnalysis(savedAnalysis),
      skills: tempSkills
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Single Job details by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await db.Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job listing not found.' });
    }

    const jobObj = job.toJSON();
    const skills = await db.JobSkill.find({ jobId: job._id });
    jobObj.skills = skills;

    const analysis = await db.JobAnalysis.findOne({ jobId: job._id });
    jobObj.analysis = formatJobAnalysis(analysis);

    res.json(jobObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Job helper
const updateJobAndAnalysis = async (jobId, body, setStatus = null) => {
  const job = await db.Job.findById(jobId);
  if (!job) return null;

  if (body.title) job.title = body.title;
  if (body.company) job.company = body.company;
  if (body.description) job.description = body.description;
  if (body.location) job.location = body.location;
  if (body.employmentType) job.employmentType = body.employmentType;
  if (body.experienceYears !== undefined) job.experienceYears = parseInt(body.experienceYears) || 0;
  if (body.salary) job.salary = body.salary;
  if (setStatus) job.status = setStatus;

  const savedJob = await job.save();

  // Update JobAnalysis if provided
  let analysis = await db.JobAnalysis.findOne({ jobId: job._id });
  if (analysis) {
    if (body.summary !== undefined) analysis.summary = body.summary;
    if (body.responsibilities !== undefined) analysis.responsibilities = JSON.stringify(body.responsibilities);
    if (body.requiredSkills !== undefined) analysis.requiredSkills = JSON.stringify(body.requiredSkills);
    if (body.preferredSkills !== undefined) analysis.preferredSkills = JSON.stringify(body.preferredSkills);
    if (body.education !== undefined) analysis.education = body.education;
    if (body.certifications !== undefined) analysis.certifications = JSON.stringify(body.certifications);
    if (body.technologies !== undefined) analysis.technologies = JSON.stringify(body.technologies);
    if (body.seniorityLevel !== undefined) analysis.seniorityLevel = body.seniorityLevel;
    await analysis.save();
  }

  // Update JobSkill records if requiredSkills/preferredSkills provided
  if (body.requiredSkills || body.preferredSkills) {
    await db.JobSkill.deleteMany({ jobId: job._id });
    if (Array.isArray(body.requiredSkills)) {
      for (const s of body.requiredSkills) {
        if (s) {
          const js = new db.JobSkill({ jobId: job._id, skillName: String(s).trim(), isRequired: true });
          await js.save();
        }
      }
    }
    if (Array.isArray(body.preferredSkills)) {
      for (const s of body.preferredSkills) {
        if (s) {
          const js = new db.JobSkill({ jobId: job._id, skillName: String(s).trim(), isRequired: false });
          await js.save();
        }
      }
    }
  }

  return savedJob;
};

// Update an existing Job (PUT /:id)
router.put('/:id', authMiddleware, async (req, res) => {
  if (req.userRole !== 'RECRUITER' && req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Recruiter privileges required.' });
  }
  try {
    const savedJob = await updateJobAndAnalysis(req.params.id, req.body);
    if (!savedJob) {
      return res.status(404).json({ error: 'Job listing not found.' });
    }

    const log = new db.AuditLog({
      userId: req.userId,
      action: 'UPDATE_JOB',
      details: `Updated Job ID: ${savedJob._id}`,
      status: 'SUCCESS'
    });
    await log.save();

    res.json({ message: 'Job listing updated successfully.', job: savedJob });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Publish a Job (PUT /:id/publish)
router.put('/:id/publish', authMiddleware, async (req, res) => {
  if (req.userRole !== 'RECRUITER' && req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Recruiter privileges required.' });
  }
  try {
    const savedJob = await updateJobAndAnalysis(req.params.id, req.body, 'ACTIVE');
    if (!savedJob) {
      return res.status(404).json({ error: 'Job listing not found.' });
    }

    // Log action
    const log = new db.AuditLog({
      userId: req.userId,
      action: 'PUBLISH_JOB',
      details: `Published Job ID: ${savedJob._id}`,
      status: 'SUCCESS'
    });
    await log.save();

    res.json({ message: 'Job listing published successfully.', job: savedJob });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a Job
router.delete('/:id', authMiddleware, async (req, res) => {
  if (req.userRole !== 'RECRUITER' && req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Recruiter privileges required.' });
  }
  try {
    const job = await db.Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job listing not found.' });
    }
    await db.JobAnalysis.deleteMany({ jobId: req.params.id });
    await db.JobSkill.deleteMany({ jobId: req.params.id });
    await db.Assessment.deleteMany({ jobId: req.params.id });

    // Log action
    const log = new db.AuditLog({
      userId: req.userId,
      action: 'DELETE_JOB',
      details: `Deleted Job ID: ${req.params.id}`,
      status: 'SUCCESS'
    });
    await log.save();

    res.json({ message: 'Job listing deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Apply for Job
router.post('/:id/apply', authMiddleware, async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await db.Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job listing not found.' });
    }

    // Check duplicate application
    const existing = await db.Application.findOne({ candidateId: req.userId, jobId });
    if (existing) {
      return res.status(400).json({ error: 'You have already applied for this job.' });
    }

    const application = new db.Application({
      candidateId: req.userId,
      jobId,
      status: 'APPLIED',
      matchScore: 0,
      readinessScore: 0
    });

    const savedApp = await application.save();

    // Run scoring engines asynchronously
    try {
      await matchEngine.calculateMatch(savedApp._id);
    } catch (e) {
      console.error('Initial scoring engine run failed:', e);
    }

    // Auto-Notifications
    try {
      const { sendNotification } = require('../services/notificationService');
      // Notify Candidate
      await sendNotification(req.userId, 'Application Received', `Your application for "${job.title}" at "${job.company}" was submitted successfully.`);
      // Notify Recruiter
      if (job.createdById) {
        await sendNotification(job.createdById, 'New Applicant Registered', `Candidate ${req.userEmail} has applied for your listing: "${job.title}".`);
      }
    } catch (e) {}

    // Log action
    const log = new db.AuditLog({
      userId: req.userId,
      action: 'APPLY_JOB',
      details: `Applied to Job ID: ${jobId}`,
      status: 'SUCCESS'
    });
    await log.save();

    res.status(201).json({ message: 'Successfully applied for the job.', application: savedApp });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Matches for a Job
router.get('/:id/matches', authMiddleware, async (req, res) => {
  if (req.userRole !== 'RECRUITER' && req.userRole !== 'ADMIN' && req.userRole !== 'HIRING_MANAGER') {
    return res.status(403).json({ error: 'Access denied. Privileged role required.' });
  }
  try {
    const jobId = req.params.id;
    const applications = await db.Application.find({ jobId });
    
    const matchesList = [];
    for (const app of applications) {
      const candidate = await db.User.findById(app.candidateId).select('-password');
      if (!candidate) continue;
      
      const appObj = app.toJSON();
      appObj.candidate = candidate;

      const matchAnalysis = await db.MatchAnalysis.findOne({ applicationId: app._id });
      
      const parseSafe = (val) => {
        if (!val) return [];
        if (typeof val === 'object') return val;
        try { return JSON.parse(val); } catch (e) { return []; }
      };

      let formattedMatch = null;
      if (matchAnalysis) {
        formattedMatch = matchAnalysis.toJSON();
        formattedMatch.matchedRequiredSkills = parseSafe(formattedMatch.matchedRequiredSkills);
        formattedMatch.missingRequiredSkills = parseSafe(formattedMatch.missingRequiredSkills);
        formattedMatch.matchedPreferredSkills = parseSafe(formattedMatch.matchedPreferredSkills);
        formattedMatch.matchedProjects = parseSafe(formattedMatch.matchedProjects);
        formattedMatch.missingProjectTechnologies = parseSafe(formattedMatch.missingProjectTechnologies);
        formattedMatch.matchedCertifications = parseSafe(formattedMatch.matchedCertifications);
        formattedMatch.missingCertifications = parseSafe(formattedMatch.missingCertifications);
      }

      matchesList.push({
        id: app._id,
        applicationId: app._id,
        candidateId: app.candidateId,
        overallScore: app.matchScore,
        application: appObj,
        matchAnalysis: formattedMatch
      });
    }

    res.json(matchesList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all applications globally (for Kanban board)
router.get('/applications/all', authMiddleware, async (req, res) => {
  if (req.userRole !== 'RECRUITER' && req.userRole !== 'ADMIN' && req.userRole !== 'HIRING_MANAGER') {
    return res.status(403).json({ error: 'Access denied. Privileged role required.' });
  }
  try {
    const apps = await db.Application.find();
    const resp = [];
    for (const app of apps) {
      const candidate = await db.User.findById(app.candidateId).select('-password');
      const job = await db.Job.findById(app.jobId);
      if (!candidate || !job) continue;
      resp.push({
        id: app._id,
        candidateId: app.candidateId,
        jobId: app.jobId,
        status: app.status,
        matchScore: app.matchScore,
        readinessScore: app.readinessScore,
        createdAt: app.createdAt,
        candidate,
        job
      });
    }
    res.json(resp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update application status (for Kanban drag & drop transitions)
router.put('/applications/:applicationId/status', authMiddleware, async (req, res) => {
  if (req.userRole !== 'RECRUITER' && req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Recruiter privileges required.' });
  }
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Missing transition status parameter.' });
    }
    const app = await db.Application.findById(req.params.applicationId);
    if (!app) return res.status(404).json({ error: 'Application not found.' });

    app.status = status;
    const saved = await app.save();

    // Trigger score recalculations
    try {
      await matchEngine.calculateReadiness(app._id);
    } catch (e) {}

    // Audit log
    const log = new db.AuditLog({
      userId: req.userId,
      action: 'TRANSITION_APPLICATION_STAGE',
      details: `Moved app: ${app._id} to ${status}`,
      status: 'SUCCESS'
    });
    await log.save();

    res.json({ message: 'Application stage transitioned.', application: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
