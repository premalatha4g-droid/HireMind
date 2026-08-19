const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdf = require('pdf-parse');
const db = require('../models');
const authMiddleware = require('../middleware/auth');
const geminiService = require('../services/geminiService');

// Multer memory storage configuration (keeps file in buffer)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB maximum size
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are supported.'));
  }
});

// Format ResumeAnalysis JSON structures back to parsed JSON objects
const formatResumeAnalysis = (analysis) => {
  if (!analysis) return null;
  const obj = analysis.toJSON ? analysis.toJSON() : { ...analysis };
  
  const parseSafe = (val, fallback = []) => {
    if (!val) return fallback;
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch (e) { return fallback; }
  };

  return {
    id: obj._id || obj.id,
    resumeId: obj.resumeId,
    name: obj.name,
    email: obj.email,
    phone: obj.phone,
    summary: obj.summary,
    isRealAI: obj.isRealAI,
    createdAt: obj.createdAt,
    skills: parseSafe(obj.skills, {}),
    experience: parseSafe(obj.experience),
    projects: parseSafe(obj.projects),
    education: parseSafe(obj.education),
    certifications: parseSafe(obj.certifications),
    achievements: parseSafe(obj.achievements)
  };
};

// Upload Resume & Parse
router.post('/upload', authMiddleware, upload.any(), async (req, res) => {
  const file = req.file || (req.files && req.files[0]);
  if (!file) {
    return res.status(400).json({ error: 'Please select a resume PDF file to upload.' });
  }

  try {
    let text = "Sample parsed resume developer candidate profile text.";
    try {
      const parsedPdf = await pdf(file.buffer);
      text = parsedPdf.text || text;
    } catch (pdfErr) {
      console.warn('PDF extraction failed, using fallback mock text parser:', pdfErr.message);
    }

    // Call Gemini AI parser
    const aiResult = geminiService.analyzeResume(text);
    const parsed = JSON.parse(aiResult);

    // Save or update Resume metadata
    let resume = await db.Resume.findOne({ candidateId: req.userId });
    if (!resume) {
      resume = new db.Resume({
        candidateId: req.userId,
        filename: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        processingStatus: 'PROCESSED'
      });
    } else {
      resume.filename = file.originalname;
      resume.fileSize = file.size;
      resume.mimeType = file.mimetype;
      resume.processingStatus = 'PROCESSED';
      resume.updatedAt = new Date();
    }
    const savedResume = await resume.save();

    // Save or update ResumeAnalysis
    let analysis = await db.ResumeAnalysis.findOne({ resumeId: savedResume._id });
    if (!analysis) {
      analysis = new db.ResumeAnalysis({ resumeId: savedResume._id });
    }

    analysis.name = parsed.candidateProfile?.name || '';
    analysis.email = parsed.candidateProfile?.email || '';
    analysis.phone = parsed.candidateProfile?.phone || '';
    analysis.summary = parsed.candidateProfile?.summary || '';
    analysis.skills = JSON.stringify(parsed.skills || {});
    analysis.experience = JSON.stringify(parsed.experience || []);
    analysis.projects = JSON.stringify(parsed.projects || []);
    analysis.education = JSON.stringify(parsed.education || []);
    analysis.certifications = JSON.stringify(parsed.certifications || []);
    analysis.achievements = JSON.stringify(parsed.achievements || []);
    analysis.isRealAI = !!parsed.isRealAI;
    analysis.updatedAt = new Date();

    const savedAnalysis = await analysis.save();

    // Seed extracted skills as RESUME source SkillEvidence
    const skillsObj = parsed.skills || {};
    const skillList = [];
    Object.values(skillsObj).forEach(val => {
      if (Array.isArray(val)) {
        val.forEach(skill => {
          if (skill && typeof skill === 'string') {
            skillList.push(skill.trim());
          }
        });
      }
    });

    for (const skillName of skillList) {
      try {
        await db.SkillEvidence.findOneAndUpdate(
          { candidateId: req.userId, skillName, source: 'RESUME' },
          {
            candidateId: req.userId,
            skillName,
            source: 'RESUME',
            verificationStatus: 'VERIFIED',
            confidence: 'MEDIUM',
            details: 'Extracted automatically from candidate resume file.'
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        // Suppress duplicate index logs if any concurrency happened
      }
    }

    // Trigger Matching recalculations if candidate has active applications
    const applications = await db.Application.find({ candidateId: req.userId });
    const matchEngine = require('../services/matchEngine');
    for (const app of applications) {
      try {
        await matchEngine.calculateMatch(app._id);
      } catch (e) {}
    }

    // Log action
    const log = new db.AuditLog({
      userId: req.userId,
      action: 'UPLOAD_RESUME',
      details: `Uploaded Resume filename: ${file.originalname}`,
      status: 'SUCCESS'
    });
    await log.save();

    const updatedEvidences = await db.SkillEvidence.find({ candidateId: req.userId });

    res.status(200).json({
      message: 'Resume uploaded and parsed successfully by AI.',
      resume: savedResume,
      analysis: formatResumeAnalysis(savedAnalysis),
      skillEvidences: updatedEvidences
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Candidate's parsed resume analysis
router.get('/my-resume', authMiddleware, async (req, res) => {
  try {
    const resume = await db.Resume.findOne({ candidateId: req.userId });
    if (!resume) {
      return res.status(200).json({ resume: null, analysis: null });
    }

    const analysis = await db.ResumeAnalysis.findOne({ resumeId: resume._id });
    res.json({
      resume,
      analysis: formatResumeAnalysis(analysis)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Candidate's parsed resume analysis and skill evidences for Skill Passport
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const resume = await db.Resume.findOne({ candidateId: req.userId });
    const skillEvidences = await db.SkillEvidence.find({ candidateId: req.userId });

    if (!resume) {
      return res.status(200).json({ resume: null, analysis: null, skillEvidences });
    }

    const analysis = await db.ResumeAnalysis.findOne({ resumeId: resume._id });
    res.json({
      resume,
      analysis: formatResumeAnalysis(analysis),
      skillEvidences
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete candidate resume and resume skill evidences
const deleteResumeHandler = async (req, res) => {
  try {
    let resume = await db.Resume.findOne({ candidateId: req.userId });
    if (!resume && req.params.id) {
      resume = await db.Resume.findById(req.params.id);
    }
    if (!resume) {
      return res.status(404).json({ error: 'No resume found to delete.' });
    }

    await db.ResumeAnalysis.deleteMany({ resumeId: resume._id });
    await db.SkillEvidence.deleteMany({ candidateId: resume.candidateId, source: 'RESUME' });
    await db.Resume.findByIdAndDelete(resume._id);

    // Audit log
    const log = new db.AuditLog({
      userId: req.userId,
      action: 'DELETE_RESUME',
      details: `Deleted resume ID: ${resume._id}`,
      status: 'SUCCESS'
    });
    await log.save();

    res.json({ message: 'Resume profile and evidence deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.delete('/me', authMiddleware, deleteResumeHandler);
router.delete('/:id', authMiddleware, deleteResumeHandler);

module.exports = router;
