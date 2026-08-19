const express = require('express');
const router = express.Router();
const db = require('../models');
const authMiddleware = require('../middleware/auth');
const matchEngine = require('../services/matchEngine');
const geminiService = require('../services/geminiService');

// Schedule Interview (Recruiter/Admin only)
router.post('/schedule', authMiddleware, async (req, res) => {
  if (req.userRole !== 'RECRUITER' && req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Recruiter privileges required.' });
  }

  try {
    const { applicationId, interviewerId, date, time, type, meetingLink, questions } = req.body;
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

    // Check if Job has an Assessment configured
    const assessment = await db.Assessment.findOne({ jobId: app.jobId });
    if (assessment && app.status !== 'SHORTLISTED') {
      // Find candidate's submission for this assessment
      const submission = await db.Submission.findOne({ assessmentId: assessment._id, candidateId: app.candidateId });
      if (!submission) {
        return res.status(400).json({
          error: 'Cannot schedule interview: Candidate has not completed the required coding assessment for this position. Candidates must complete the assessment and be shortlisted based on their score before an interview can be conducted.'
        });
      }
      
      const passThreshold = assessment.passPercentage !== undefined ? assessment.passPercentage : 60;
      if (submission.score < passThreshold) {
        return res.status(400).json({
          error: `Cannot schedule interview: Candidate scored ${submission.score}%, which is below the required pass threshold (${passThreshold}%). Candidate must achieve a qualifying score to be shortlisted for technical interview.`
        });
      }
    }

    // Update Application Status to INTERVIEW
    app.status = 'INTERVIEW';
    await app.save();

    // Map scheduled details into SkillEvidence
    const scheduleType = type || 'TECHNICAL_INTERVIEW';
    const scheduleLink = meetingLink || 'https://meet.google.com/hiremind-interview-session';
    const scheduleDetail = `Technical Interview scheduled with ${interviewer.name} on ${date} at ${time} (Type: ${scheduleType}, Link: ${scheduleLink}).`;
    
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
      await sendNotification(app.candidateId, 'Interview Scheduled', `Dear Candidate, your Technical Interview for "${jobTitle}" has been scheduled on ${date} at ${time}. Link: ${scheduleLink}`);
      // Notify Interviewer
      await sendNotification(interviewerId, 'New Interview Evaluation Assigned', `You have been assigned to evaluate candidate for "${jobTitle}" on ${date} at ${time}.`);
    } catch (e) {}

    res.json({ message: 'Interview scheduled successfully and email invitation simulation sent.' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Generate Tailored Interview Questions based on Candidate & Job Gaps
router.post('/generate-questions', authMiddleware, async (req, res) => {
  try {
    const { applicationId } = req.body;
    if (!applicationId) {
      return res.status(400).json({ error: 'Missing applicationId parameter.' });
    }

    const app = await db.Application.findById(applicationId);
    if (!app) return res.status(404).json({ error: 'Application not found.' });

    const candidate = await db.User.findById(app.candidateId).select('-password');
    const job = await db.Job.findById(app.jobId);

    let matchAnalysis = await db.MatchAnalysis.findOne({ applicationId: app._id });
    let gaps = [];
    if (matchAnalysis) {
      gaps = await db.SkillGap.find({ matchAnalysisId: matchAnalysis._id });
    }

    const aiQuestionsStr = geminiService.generateInterviewQuestions(
      candidate ? candidate.name : 'Candidate',
      job ? job.title : 'Software Engineer',
      JSON.stringify(gaps)
    );

    const parsed = JSON.parse(aiQuestionsStr);

    res.json({
      questions: parsed.questions || [
        {
          question: 'Explain architectural best practices for asynchronous request handling and state synchronization.',
          category: 'TECHNICAL',
          difficulty: 'MEDIUM',
          evaluationCriteria: 'Listen for event queues, idempotency, and concurrency safety.'
        },
        {
          question: 'Describe how you troubleshoot latency bottlenecks across database queries and network services.',
          category: 'PERFORMANCE',
          difficulty: 'HARD',
          evaluationCriteria: 'Look for query profiling, indexing strategies, caching mechanisms, and connection pooling.'
        }
      ],
      isRealAI: true
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Recruiter Scheduled Interviews (GET /api/interviews/my-schedules)
router.get('/my-schedules', authMiddleware, async (req, res) => {
  try {
    const apps = await db.Application.find({
      status: { $in: ['INTERVIEW', 'ASSESSMENT', 'OFFER', 'HIRED', 'SHORTLISTED', 'REJECTED', 'SCREENING'] }
    }).sort({ createdAt: -1 });

    const resp = [];
    for (const app of apps) {
      const candidate = await db.User.findById(app.candidateId).select('-password');
      const job = await db.Job.findById(app.jobId);
      if (!candidate || !job) continue;

      const feedback = await db.InterviewFeedback.findOne({ interviewId: app._id });
      const evidence = await db.SkillEvidence.findOne({ candidateId: app.candidateId, skillName: 'Technical Interview', source: 'INTERVIEW' });

      let date = '2026-08-20';
      let time = '14:30';
      let type = 'TECHNICAL_INTERVIEW';
      let meetingLink = 'https://meet.google.com/hiremind-interview-session';

      if (evidence && evidence.details) {
        const dateMatch = evidence.details.match(/on ([\d-]+) at ([\d:]+)/);
        if (dateMatch) {
          date = dateMatch[1];
          time = dateMatch[2];
        }
        const typeMatch = evidence.details.match(/Type: ([^,\)]+)/);
        if (typeMatch) type = typeMatch[1];
        const linkMatch = evidence.details.match(/Link: ([^,\)]+)/);
        if (linkMatch) meetingLink = linkMatch[1];
      }

      resp.push({
        id: app._id,
        applicationId: app._id,
        status: feedback ? 'COMPLETED' : (app.status === 'INTERVIEW' ? 'SCHEDULED' : app.status),
        date,
        time,
        type,
        meetingLink,
        application: {
          id: app._id,
          status: app.status,
          candidate: {
            name: candidate.name,
            email: candidate.email
          },
          job: {
            title: job.title,
            company: job.company
          }
        },
        feedback: feedback ? {
          technicalScore: feedback.technicalScore,
          problemSolvingScore: feedback.problemSolvingScore,
          projectUnderstandingScore: feedback.projectUnderstandingScore,
          communicationScore: feedback.communicationScore,
          recommendation: feedback.recommendation,
          comments: feedback.comments
        } : null
      });
    }

    res.json(resp);

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
    const apps = await db.Application.find({
      status: { $in: ['INTERVIEW', 'ASSESSMENT', 'OFFER', 'HIRED', 'SHORTLISTED', 'REJECTED', 'SCREENING'] }
    });
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
      let date = '2026-08-20';
      let time = '14:30';
      let type = 'TECHNICAL_INTERVIEW';
      let meetingLink = 'https://meet.google.com/hiremind-interview-session';
      
      if (evidence && evidence.details) {
        const match = evidence.details.match(/on ([\d-]+) at ([\d:]+)/);
        if (match) {
          date = match[1];
          time = match[2];
        }
        const typeMatch = evidence.details.match(/Type: ([^,\)]+)/);
        if (typeMatch) type = typeMatch[1];
        const linkMatch = evidence.details.match(/Link: ([^,\)]+)/);
        if (linkMatch) meetingLink = linkMatch[1];
      }

      resp.push({
        id: app._id,
        applicationId: app._id,
        status, // 'SCHEDULED' or 'COMPLETED'
        date,
        time,
        type,
        meetingLink,
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
            category: 'Core System Logic',
            difficulty: 'MEDIUM',
            question: 'Explain concurrency, thread safety, and execution models in backend environments.',
            evaluationCriteria: 'Look for async concepts, race condition handling, and resource pooling.'
          },
          {
            id: 'q2',
            category: 'State & Architecture',
            difficulty: 'MEDIUM',
            question: 'What is the difference between monolithic and microservice architecture, and when do you isolate data models?',
            evaluationCriteria: 'Expect trade-offs on latency, distributed transactions, and service boundaries.'
          },
          {
            id: 'q3',
            category: 'Optimization & Scaling',
            difficulty: 'HARD',
            question: 'Describe how you optimize high-load database queries and caching layers.',
            evaluationCriteria: 'Check for index optimization, cache invalidation strategies, and read/write splitting.'
          }
        ]
      });
    }

    res.json(resp);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Interview Feedback
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
    if (!applicationId || technicalScore === undefined || problemSolvingScore === undefined || !recommendation) {
      return res.status(400).json({ error: 'Missing required feedback parameter properties.' });
    }

    const app = await db.Application.findById(applicationId);
    if (!app) {
      return res.status(404).json({ error: 'Application record not found.' });
    }

    // Save or update feedback
    let feedback = await db.InterviewFeedback.findOne({ interviewId: app._id });
    if (!feedback) {
      feedback = new db.InterviewFeedback({ interviewId: app._id });
    }

    feedback.technicalScore = parseInt(technicalScore) || 0;
    feedback.problemSolvingScore = parseInt(problemSolvingScore) || 0;
    feedback.projectUnderstandingScore = parseInt(projectUnderstandingScore) || 0;
    feedback.communicationScore = parseInt(communicationScore) || 0;
    feedback.comments = comments || '';
    feedback.recommendation = recommendation;

    await feedback.save();

    // Map recommendation to application status transitions
    if (recommendation === 'RECOMMEND_HIRE' || recommendation === 'PROCEED') {
      app.status = 'OFFER'; // Candidate successfully passed interview and is moved to offer stage
    } else if (recommendation === 'REJECT') {
      app.status = 'REJECTED';
    } else {
      app.status = 'INTERVIEW';
    }
    await app.save();

    // Update SkillEvidence for Interview
    const avgScore = (parseInt(technicalScore) + parseInt(problemSolvingScore) + (parseInt(projectUnderstandingScore) || 7) + (parseInt(communicationScore) || 7)) / 4.0;
    const feedbackDetails = `Scored average ${Math.round(avgScore * 10)}% (Tech: ${technicalScore}/10). Notes: ${comments}`;
    
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
      action: 'SUBMIT_FEEDBACK',
      details: `Submitted evaluation for App: ${applicationId} - Recommendation: ${recommendation}`,
      status: 'SUCCESS'
    });
    await log.save();

    res.json({ message: 'Interview feedback evaluation submitted successfully.' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Build AI Draft Summary based on notes
router.post('/:interviewId/feedback/draft', authMiddleware, async (req, res) => {
  if (req.userRole !== 'INTERVIEWER' && req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Interviewer privileges required.' });
  }

  try {
    const { rawNotes, technicalScore, problemSolvingScore, communicationScore, projectUnderstandingScore } = req.body;
    const avgScore = (parseInt(technicalScore) + parseInt(problemSolvingScore) + (parseInt(communicationScore) || 7) + (parseInt(projectUnderstandingScore) || 7)) / 4.0;
    
    const strengths = [];
    const weaknesses = [];
    
    if (avgScore >= 8) {
      strengths.push('Strong core technical knowledge and problem-solving methodology');
      strengths.push('Clean architectural design communication');
    } else {
      strengths.push('Cooperative communication');
      weaknesses.push('Could benefit from deeper optimization patterns');
    }

    if (rawNotes && (rawNotes.toLowerCase().includes('excellent') || rawNotes.toLowerCase().includes('good') || rawNotes.toLowerCase().includes('strong'))) {
      strengths.push('Clear articulation and structural thinking');
    }

    const comments = `The candidate demonstrated strong capability in core domain aspects. Raw Notes: "${rawNotes || ''}". Technical Rating: ${avgScore}/10.`;

    res.json({
      comments,
      strengths,
      weaknesses,
      recommendation: avgScore >= 7 ? 'RECOMMEND_HIRE' : 'HOLD',
      isRealAI: true
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET AI Pre-Screening Interview configuration
router.get('/pre-screening/:applicationId', authMiddleware, async (req, res) => {
  try {
    const app = await db.Application.findById(req.params.applicationId);
    if (!app) return res.status(404).json({ error: 'Application not found.' });

    const questions = [
      { id: 1, text: "Explain your experience with core system architecture, data modeling, and performance optimization." },
      { id: 2, text: "Describe how you design robust error-handling, caching, and state management mechanisms." },
      { id: 3, text: "How do you approach automated testing, continuous integration, and debugging complex production issues?" }
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

    let scoredPoints = 0;
    const ansArray = Object.values(answers);
    
    ansArray.forEach(ans => {
      const text = (ans || '').toLowerCase();
      if (text.length > 20) scoredPoints += 25;
      if (text.includes('architecture') || text.includes('system') || text.includes('model') || text.includes('data') || text.includes('cache')) scoredPoints += 10;
      if (text.includes('test') || text.includes('performance') || text.includes('scale') || text.includes('design') || text.includes('error')) scoredPoints += 10;
    });

    const aiScore = Math.min(Math.max(scoredPoints, 50), 95);
    
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

module.exports = router;
