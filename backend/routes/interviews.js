const express = require('express');
const router = express.Router();
const db = require('../models');
const authMiddleware = require('../middleware/auth');
const matchEngine = require('../services/matchEngine');

// Schedule Interview (Recruiter/Admin only)
router.post('/schedule', authMiddleware, async (req, res) => {
  if (req.userRole !== 'RECRUITER' && req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Recruiter privileges required.' });
  }

  try {
    const { applicationId, interviewerId, date, time } = req.body;
    if (!applicationId || !interviewerId || !date || !time) {
      return res.status(400).json({ error: 'Missing required parameters: applicationId, interviewerId, date, time.' });
    }

    const app = await db.Application.findById(applicationId);
    if (!app) {
      return res.status(404).json({ error: 'Application record not found.' });
    }

    const interviewer = await db.User.findById(interviewerId);
    if (!interviewer || interviewer.role !== 'INTERVIEWER') {
      return res.status(400).json({ error: 'Selected user is not an interviewer.' });
    }

    // Update Application Status to INTERVIEW
    app.status = 'INTERVIEW';
    await app.save();

    // Map scheduled details as a placeholder schedule verification in SkillEvidence
    const scheduleDetail = `Technical Interview scheduled with ${interviewer.name} on ${date} at ${time}.`;
    await db.SkillEvidence.findOneAndUpdate(
      { candidateId: app.candidateId, skillName: 'Technical Interview', source: 'INTERVIEW' },
      {
        candidateId: app.candidateId,
        skillName: 'Technical Interview',
        source: 'INTERVIEW',
        verificationStatus: 'NEEDS_VERIFICATION',
        confidence: 'LOW',
        details: scheduleDetail
      },
      { upsert: true, new: true }
    );

    // Create Audit Log
    const log = new db.AuditLog({
      userId: req.userId,
      action: 'SCHEDULE_INTERVIEW',
      details: `Scheduled interview for App: ${applicationId} with ${interviewerId}`,
      status: 'SUCCESS'
    });
    await log.save();

    // Auto-Notifications
    try {
      const { sendNotification } = require('../services/notificationService');
      const job = await db.Job.findById(app.jobId);
      const jobTitle = job ? job.title : 'Position';
      // Notify Candidate
      await sendNotification(app.candidateId, 'Interview Scheduled', `Dear Candidate, your Technical Interview for "${jobTitle}" has been scheduled on ${date} at ${time}.`);
      // Notify Interviewer
      await sendNotification(interviewerId, 'New Interview Evaluation Assigned', `You have been assigned to evaluate candidate ${app.candidateId} for "${jobTitle}" on ${date} at ${time}.`);
    } catch (e) {}

    res.json({ message: 'Interview scheduled successfully and email invitation simulation sent.' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Assigned Interviews for Interviewer
router.get('/assigned', authMiddleware, async (req, res) => {
  if (req.userRole !== 'INTERVIEWER' && req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Interviewer role required.' });
  }

  try {
    // List all applications with status 'INTERVIEW' or higher to show evaluations
    const apps = await db.Application.find({ status: { $in: ['INTERVIEW', 'SHORTLISTED', 'REJECTED', 'SCREENING'] } });
    const resp = [];

    for (const app of apps) {
      const candidate = await db.User.findById(app.candidateId).select('-password');
      const job = await db.Job.findById(app.jobId);
      const resume = await db.Resume.findOne({ candidateId: app.candidateId });

      let parsedSkills = [];
      if (resume) {
        const analysis = await db.ResumeAnalysis.findOne({ resumeId: resume._id });
        if (analysis) {
          try {
            const skillsObj = JSON.parse(analysis.skills || '{}');
            Object.values(skillsObj).forEach(val => {
              if (Array.isArray(val)) parsedSkills = parsedSkills.concat(val);
            });
          } catch (e) {}
        }
      }

      // Check if feedback already exists
      const priorFeedback = await db.InterviewFeedback.findOne({ interviewId: app._id });
      const status = priorFeedback ? 'COMPLETED' : (app.status === 'INTERVIEW' ? 'SCHEDULED' : 'COMPLETED');

      // Fetch scheduled date/time from SkillEvidence
      const evidence = await db.SkillEvidence.findOne({ candidateId: app.candidateId, skillName: 'Technical Interview', source: 'INTERVIEW' });
      let date = '2026-08-15';
      let time = '10:00';
      
      if (evidence && evidence.details) {
        const match = evidence.details.match(/on ([\d-]+) at ([\d:]+)/);
        if (match) {
          date = match[1];
          time = match[2];
        }
      }

      resp.push({
        id: app._id,
        applicationId: app._id,
        status, // 'SCHEDULED' or 'COMPLETED'
        date,
        time,
        type: 'TECHNICAL_INTERVIEW',
        application: {
          id: app._id,
          status: app.status,
          candidate: {
            name: candidate ? candidate.name : 'Unknown Candidate',
            email: candidate ? candidate.email : ''
          },
          job: {
            title: job ? job.title : 'Position',
            company: job ? job.company : ''
          }
        },
        candidateSkills: parsedSkills,
        questions: [
          {
            id: 'q1',
            category: 'React Core',
            difficulty: 'MEDIUM',
            question: 'Explain React\'s Virtual DOM reconciliation process and how it optimizes UI updates.',
            evaluationCriteria: 'Look for Virtual DOM representation, diffing, and batching.'
          },
          {
            id: 'q2',
            category: 'State Management',
            difficulty: 'MEDIUM',
            question: 'What is the difference between state and props, and when would you use useContext or Redux?',
            evaluationCriteria: 'Expect state local vs props read-only, and context vs redux use-cases.'
          },
          {
            id: 'q3',
            category: 'Performance',
            difficulty: 'HARD',
            question: 'Describe how you optimize performance in a React app containing large list datasets.',
            evaluationCriteria: 'Check for virtualization/windowing, memo hooks, and React.memo.'
          }
        ]
      });
    }

    res.json(resp);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Interview Feedback (handles POST /:interviewId/feedback/submit and POST /submit-feedback)
router.post('/:interviewId/feedback/submit', authMiddleware, async (req, res) => {
  req.body.applicationId = req.params.interviewId;
  return submitFeedbackHandler(req, res);
});

router.post('/submit-feedback', authMiddleware, async (req, res) => {
  return submitFeedbackHandler(req, res);
});

async function submitFeedbackHandler(req, res) {
  if (req.userRole !== 'INTERVIEWER' && req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Interviewer privileges required.' });
  }

  try {
    const { applicationId, technicalScore, problemSolvingScore, projectUnderstandingScore, communicationScore, comments, recommendation } = req.body;
    if (!applicationId || technicalScore === undefined || problemSolvingScore === undefined || projectUnderstandingScore === undefined || communicationScore === undefined || !recommendation) {
      return res.status(400).json({ error: 'Missing required feedback parameter properties.' });
    }

    const app = await db.Application.findById(applicationId);
    if (!app) {
      return res.status(404).json({ error: 'Application record not found.' });
    }

    // Save feedback
    const feedback = new db.InterviewFeedback({
      interviewId: app._id,
      technicalScore: parseInt(technicalScore) || 0,
      problemSolvingScore: parseInt(problemSolvingScore) || 0,
      projectUnderstandingScore: parseInt(projectUnderstandingScore) || 0,
      communicationScore: parseInt(communicationScore) || 0,
      comments: comments || '',
      recommendation
    });
    await feedback.save();

    // Map recommendation to application status transitions
    if (recommendation === 'RECOMMEND_HIRE') {
      app.status = 'SHORTLISTED';
    } else if (recommendation === 'REJECT') {
      app.status = 'REJECTED';
    } else {
      app.status = 'SCREENING';
    }
    await app.save();

    // Update SkillEvidence for Interview
    const avgScore = (parseInt(technicalScore) + parseInt(problemSolvingScore) + parseInt(projectUnderstandingScore) + parseInt(communicationScore)) / 4.0;
    const feedbackDetails = `Scored average ${Math.round(avgScore * 10)}% (Tech: ${technicalScore}/10, Comm: ${communicationScore}/10). Notes: ${comments}`;
    
    await db.SkillEvidence.findOneAndUpdate(
      { candidateId: app.candidateId, skillName: 'Technical Interview', source: 'INTERVIEW' },
      {
        candidateId: app.candidateId,
        skillName: 'Technical Interview',
        source: 'INTERVIEW',
        verificationStatus: recommendation === 'REJECT' ? 'NEEDS_VERIFICATION' : 'VERIFIED',
        confidence: avgScore >= 8.0 ? 'HIGH' : 'MEDIUM',
        details: feedbackDetails
      },
      { upsert: true, new: true }
    );

    // Recalculate candidate readiness
    await matchEngine.calculateReadiness(applicationId);

    // Create Audit Log
    const log = new db.AuditLog({
      userId: req.userId,
      action: 'EVALUATE_INTERVIEW',
      details: `Submitted evaluation for App: ${applicationId} - Recommendation: ${recommendation}`,
      status: 'SUCCESS'
    });
    await log.save();

    res.json({ message: 'Interview feedback evaluation submitted successfully.' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET AI Pre-Screening Interview configuration
router.get('/pre-screening/:applicationId', authMiddleware, async (req, res) => {
  try {
    const app = await db.Application.findById(req.params.applicationId);
    if (!app) return res.status(404).json({ error: 'Application not found.' });

    const questions = [
      { id: 1, text: "Explain React's Virtual DOM reconciliation process and how it optimizes UI updates." },
      { id: 2, text: "What is the difference between state and props, and when would you use useContext or Redux?" },
      { id: 3, text: "Describe how you optimize performance in a React app containing large list datasets." }
    ];

    res.json({
      applicationId: app._id,
      status: app.status,
      questions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Submit AI Pre-Screening Answers & Grade
router.post('/pre-screening/:applicationId/submit', authMiddleware, async (req, res) => {
  try {
    const app = await db.Application.findById(req.params.applicationId);
    if (!app) return res.status(404).json({ error: 'Application not found.' });

    const { answers } = req.body;
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Missing answers payload.' });
    }

    // Basic heuristic grading representing "AI Parser"
    let scoredPoints = 0;
    const ansArray = Object.values(answers);
    
    ansArray.forEach(ans => {
      const text = (ans || '').toLowerCase();
      // Look for technical keywords
      if (text.includes('diff') || text.includes('reconciliation') || text.includes('fiber') || text.includes('dom')) scoredPoints += 25;
      if (text.includes('context') || text.includes('redux') || text.includes('state') || text.includes('props')) scoredPoints += 25;
      if (text.includes('memo') || text.includes('callback') || text.includes('lazy') || text.includes('virtual')) scoredPoints += 30;
    });

    const aiScore = Math.min(Math.max(scoredPoints, 40), 95); // score clamp between 40-95%
    
    // Update Application Metrics
    app.readinessScore = aiScore;
    app.status = 'SCREENING';
    await app.save();

    // Seed SkillEvidence
    await db.SkillEvidence.findOneAndUpdate(
      { candidateId: app.candidateId, skillName: 'AI Pre-Screening Interview', source: 'INTERVIEW' },
      {
        candidateId: app.candidateId,
        skillName: 'AI Pre-Screening Interview',
        source: 'INTERVIEW',
        verificationStatus: 'VERIFIED',
        confidence: aiScore >= 75 ? 'HIGH' : 'MEDIUM',
        details: `Passed automated AI pre-screening text evaluation with grading score: ${aiScore}%.`
      },
      { upsert: true, new: true }
    );

    // Auto-Notification
    try {
      const { sendNotification } = require('../services/notificationService');
      await sendNotification(app.candidateId, 'AI Interview Evaluated', `Your AI Pre-screening answers were analyzed. Automated Readiness Index updated to ${aiScore}%.`);
      
      const job = await db.Job.findById(app.jobId);
      if (job && job.createdById) {
        await sendNotification(job.createdById, 'AI Pre-Screening Completed', `Candidate completed pre-screening chat. Automated score generated: ${aiScore}%.`);
      }
    } catch (e) {}

    // Audit Log
    const log = new db.AuditLog({
      userId: req.userId,
      action: 'SUBMIT_AI_INTERVIEW',
      details: `Graded AI Pre-screening App: ${app._id} - Score: ${aiScore}%`,
      status: 'SUCCESS'
    });
    await log.save();

    res.json({
      message: 'AI pre-screening graded and processed.',
      score: aiScore,
      status: app.status
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Build AI Draft Summary based on notes
router.post('/:interviewId/feedback/draft', authMiddleware, async (req, res) => {
  if (req.userRole !== 'INTERVIEWER' && req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Interviewer privileges required.' });
  }

  try {
    const { rawNotes, technicalScore, problemSolvingScore, communicationScore, projectUnderstandingScore } = req.body;
    const avgScore = (parseInt(technicalScore) + parseInt(problemSolvingScore) + parseInt(communicationScore) + parseInt(projectUnderstandingScore)) / 4.0;
    
    const strengths = [];
    const weaknesses = [];
    
    if (avgScore >= 8) {
      strengths.push('Strong core technical knowledge');
      strengths.push('Good problem-solving methodologies');
    } else {
      strengths.push('Cooperative communication');
      weaknesses.push('Needs depth in React optimizations');
    }

    if (rawNotes && (rawNotes.toLowerCase().includes('excellent') || rawNotes.toLowerCase().includes('good'))) {
      strengths.push('Clear articulation and structural thinking');
    }

    const comments = `The candidate demonstrated strong capability in JS core aspects. Raw Notes: "${rawNotes || ''}". Technical Rating: ${avgScore}/10. Recommended to proceed.`;

    res.json({
      comments,
      strengths,
      weaknesses,
      recommendation: avgScore >= 7 ? 'PROCEED' : 'HOLD',
      isRealAI: false
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
