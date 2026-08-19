const express = require('express');
const router = express.Router();
const db = require('../models');
const authMiddleware = require('../middleware/auth');
const codeExecutor = require('../services/codeExecutorService');
const matchEngine = require('../services/matchEngine');

// Create or update coding assessment
router.post('/', authMiddleware, async (req, res) => {
  if (req.userRole !== 'RECRUITER' && req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Recruiter privileges required.' });
  }

  try {
    const { jobId, title, instructions, timeLimit, questions, passPercentage } = req.body;
    if (!jobId || !title || timeLimit === undefined || !questions) {
      return res.status(400).json({ error: 'Missing required parameters: jobId, title, timeLimit, questions.' });
    }

    const job = await db.Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job listing not found.' });
    }

    // Delete old assessment if it exists
    const oldAssessment = await db.Assessment.findOne({ jobId });
    if (oldAssessment) {
      const oldQuestions = await db.Question.find({ assessmentId: oldAssessment._id });
      for (const q of oldQuestions) {
        await db.TestCase.deleteMany({ questionId: q._id });
        await db.Question.findByIdAndDelete(q._id);
      }
      await db.Assessment.findByIdAndDelete(oldAssessment._id);
    }

    // Create Assessment
    const assessment = new db.Assessment({
      jobId,
      title,
      description: instructions || '',
      difficulty: 'MEDIUM',
      durationMinutes: parseInt(timeLimit) || 30,
      passPercentage: parseInt(passPercentage) || 60
    });

    const savedAssessment = await assessment.save();
    const questionsResp = [];

    for (const q of questions) {
      const question = new db.Question({
        assessmentId: savedAssessment._id,
        type: 'CODING',
        questionText: q.description || '',
        difficulty: q.difficulty || 'MEDIUM',
        points: parseInt(q.points) || 10,
        codeTemplate: q.codeTemplate || ''
      });

      const savedQuestion = await question.save();
      const savedTestCases = [];

      if (q.testCases) {
        for (const tc of q.testCases) {
          const rawIn = tc.input !== undefined ? tc.input : '';
          const rawOut = tc.expectedOutput !== undefined ? tc.expectedOutput : (tc.output !== undefined ? tc.output : '');
          const tcInput = typeof rawIn === 'object' ? JSON.stringify(rawIn) : String(rawIn);
          const tcOutput = typeof rawOut === 'object' ? JSON.stringify(rawOut) : String(rawOut);

          const testCase = new db.TestCase({
            questionId: savedQuestion._id,
            input: tcInput,
            expectedOutput: tcOutput
          });
          savedTestCases.push(await testCase.save());
        }
      }

      questionsResp.push({
        id: savedQuestion._id,
        title: q.title || 'CODING',
        description: question.questionText,
        codeTemplate: question.codeTemplate,
        testCases: savedTestCases.map(tc => ({ id: tc._id, questionId: tc.questionId, input: tc.input, expectedOutput: tc.expectedOutput }))
      });
    }

    // Log action
    const log = new db.AuditLog({
      userId: req.userId,
      action: 'CREATE_CODING_ASSESSMENT',
      details: `Assessment ID: ${savedAssessment._id}, Job ID: ${jobId}`,
      status: 'SUCCESS'
    });
    await log.save();

    res.status(201).json({
      message: 'Coding assessment created successfully.',
      assessment: {
        id: savedAssessment._id,
        jobId,
        title,
        passPercentage: savedAssessment.passPercentage,
        questions: questionsResp
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Candidate's applied jobs with linked assessments details
router.get('/my-applications', authMiddleware, async (req, res) => {
  try {
    const apps = await db.Application.find({ candidateId: req.userId });
    const resp = [];

    for (const app of apps) {
      const job = await db.Job.findById(app.jobId);
      let jobMap = null;
      if (job) {
        jobMap = {
          id: job._id,
          title: job.title,
          company: job.company
        };

        const ass = await db.Assessment.findOne({ jobId: job._id });
        if (ass) {
          jobMap.assessment = {
            id: ass._id,
            title: ass.title,
            timeLimit: ass.durationMinutes,
            passPercentage: ass.passPercentage || 60
          };
        }
      }

      const submissions = await db.Submission.find({ candidateId: req.userId });

      resp.push({
        id: app._id,
        status: app.status,
        matchScore: app.matchScore,
        readinessScore: app.readinessScore,
        job: jobMap,
        submissions: submissions || []
      });
    }

    res.json(resp);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Assessment details for Job (mask test cases for candidates)
router.get('/job/:jobId', authMiddleware, async (req, res) => {
  try {
    let ass = await db.Assessment.findOne({ jobId: req.params.jobId });
    if (!ass) {
      ass = await db.Assessment.findById(req.params.jobId);
    }
    if (!ass) {
      return res.status(404).json({ error: 'No coding assessment configured for this job.' });
    }

    const questions = await db.Question.find({ assessmentId: ass._id });
    const isStaff = ['RECRUITER', 'ADMIN', 'HIRING_MANAGER'].includes(req.userRole);

    const questionsResp = [];
    for (const q of questions) {
      const firstTc = await db.TestCase.findOne({ questionId: q._id });
      const qMap = {
        id: q._id,
        assessmentId: q.assessmentId,
        type: q.type,
        title: 'Coding Challenge',
        description: q.questionText,
        questionText: q.questionText,
        codeTemplate: q.codeTemplate,
        template: q.codeTemplate,
        difficulty: q.difficulty,
        points: q.points,
        sampleInput: firstTc ? firstTc.input : '[]',
        sampleExpectedOutput: firstTc ? firstTc.expectedOutput : '""'
      };

      if (isStaff) {
        const testCases = await db.TestCase.find({ questionId: q._id });
        qMap.testCases = testCases;
      } else {
        qMap.testCases = []; // Mask test cases for candidate
      }
      questionsResp.push(qMap);
    }

    const priorSub = await db.Submission.findOne({ assessmentId: ass._id, candidateId: req.userId });

    const assessmentObj = {
      id: ass._id,
      jobId: ass.jobId,
      title: ass.title,
      description: ass.description || '',
      timeLimit: ass.durationMinutes,
      passPercentage: ass.passPercentage || 60,
      questions: questionsResp,
      alreadySubmitted: !!priorSub
    };

    res.json({
      ...assessmentObj,
      assessment: assessmentObj
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Run candidate code preview test case
router.post('/run-preview', async (req, res) => {
  const { code, sampleInput, sampleOutput } = req.body;
  if (!code || sampleInput === undefined || sampleOutput === undefined) {
    return res.status(400).json({ error: 'Missing run parameters: code, sampleInput, sampleOutput.' });
  }

  try {
    const mockTc = { input: sampleInput, expectedOutput: sampleOutput };
    const execResults = codeExecutor.execute(code, [mockTc], 1000);
    const result = execResults[0];

    res.json({
      passed: result.passed,
      actual: result.actual !== null ? String(result.actual) : '',
      error: result.error !== null ? String(result.error) : ''
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Coding Assessment Answers & Grade -> Shortlist on Passing Score
router.post('/:id/submit', authMiddleware, async (req, res) => {
  try {
    const { applicationId, answers } = req.body;

    const ass = await db.Assessment.findById(req.params.id);
    if (!ass) {
      return res.status(404).json({ error: 'Assessment record not found.' });
    }

    let targetAppId = applicationId;
    if (!targetAppId) {
      const foundApp = await db.Application.findOne({ candidateId: req.userId, jobId: ass.jobId });
      if (foundApp) {
        targetAppId = foundApp._id;
      }
    }

    if (!targetAppId || !answers) {
      return res.status(400).json({ error: 'Missing answers mapping payload.' });
    }

    const app = await db.Application.findById(targetAppId);
    if (!app) {
      return res.status(404).json({ error: 'Application record not found.' });
    }
    if (app.candidateId !== req.userId) {
      return res.status(403).json({ error: 'Access denied. Candidate mismatch.' });
    }

    const questions = await db.Question.find({ assessmentId: ass._id });
    let totalPoints = 0;
    let scoredPoints = 0;

    // Create parent Submission row first to get ID
    const submission = new db.Submission({
      candidateId: req.userId,
      assessmentId: ass._id,
      score: 0
    });
    const savedSubmission = await submission.save();

    for (const q of questions) {
      const candidateCode = answers[q._id];
      if (!candidateCode) continue;

      const testCases = await db.TestCase.find({ questionId: q._id });
      const executionResults = codeExecutor.execute(candidateCode, testCases, 1000);

      const passedCount = executionResults.filter(r => r.passed).length;
      const isCorrect = passedCount === testCases.length && testCases.length > 0;
      const scoreObtained = isCorrect ? q.points : 0;

      totalPoints += q.points;
      scoredPoints += scoreObtained;

      const qSub = new db.QuestionSubmission({
        submissionId: savedSubmission._id,
        questionId: q._id,
        codeSubmitted: candidateCode,
        isCorrect,
        scoreObtained
      });
      await qSub.save();
    }

    const finalPercentScore = totalPoints > 0 ? Math.round((scoredPoints / totalPoints) * 100) : 100;
    savedSubmission.score = finalPercentScore;
    await savedSubmission.save();

    const passThreshold = ass.passPercentage !== undefined ? ass.passPercentage : 60;
    const isPassed = finalPercentScore >= passThreshold;

    // Update Application Status: If candidate scores >= passPercentage, automatically Shortlist them for Interview!
    if (isPassed) {
      app.status = 'SHORTLISTED';
    } else {
      app.status = 'ASSESSMENT';
    }
    await app.save();

    const integrity = req.body.integrityScore !== undefined ? req.body.integrityScore : 100;
    const switches = req.body.tabSwitches || 0;

    // Update SkillEvidence
    await db.SkillEvidence.findOneAndUpdate(
      { candidateId: req.userId, skillName: ass.title, source: 'ASSESSMENT' },
      {
        candidateId: req.userId,
        skillName: ass.title,
        source: 'ASSESSMENT',
        confidence: finalPercentScore >= 80 ? 'HIGH' : (isPassed ? 'MEDIUM' : 'LOW'),
        details: `Scored ${finalPercentScore}% (Pass threshold: ${passThreshold}%) in technical assessment. Proctoring Integrity: ${integrity}% (${switches} tab switches). ${isPassed ? 'Shortlisted for Interview.' : 'Below pass threshold.'}`,
        verificationStatus: isPassed ? 'VERIFIED' : 'NEEDS_VERIFICATION'
      },
      { upsert: true, new: true }
    );

    // Trigger score recalculations
    await matchEngine.calculateReadiness(targetAppId);

    // Simulated Plagiarism Detection
    let plagiarismDetected = false;
    let maxSimilarity = 14; // baseline similarity
    for (const q of questions) {
      const code = answers[q._id] || '';
      if (code.includes('copypaste') || code.includes('stackoverflow') || code.includes('chatgpt') || code.includes('github')) {
        plagiarismDetected = true;
        maxSimilarity = 92; // High similarity flag
      }
    }

    // Auto-Notification to Candidate
    try {
      const { sendNotification } = require('../services/notificationService');
      const job = await db.Job.findById(app.jobId);
      const jobTitle = job ? job.title : 'Position';
      if (isPassed) {
        await sendNotification(
          req.userId,
          'Assessment Passed - Shortlisted for Interview!',
          `Congratulations! You scored ${finalPercentScore}% on the coding assessment for "${jobTitle}" (Passing cutoff: ${passThreshold}%). Your application is now Shortlisted for Technical Interview.`
        );
      } else {
        await sendNotification(
          req.userId,
          'Assessment Score Recorded',
          `Your technical assessment for "${jobTitle}" has been graded. Score: ${finalPercentScore}% (Passing cutoff: ${passThreshold}%).`
        );
      }
    } catch (e) {}

    // Log action
    const log = new db.AuditLog({
      userId: req.userId,
      action: 'SUBMIT_CODING_ASSESSMENT',
      details: `Submission ID: ${savedSubmission._id}, Assessment ID: ${ass._id}, Score: ${finalPercentScore}%, Shortlisted: ${isPassed}`,
      status: 'SUCCESS'
    });
    await log.save();

    res.json({
      message: isPassed 
        ? 'Coding challenge submitted! You scored above the passing threshold and have been Shortlisted for Technical Interview.'
        : 'Coding challenge submitted and scored.',
      score: finalPercentScore,
      passPercentage: passThreshold,
      isPassed,
      shortlisted: isPassed,
      status: app.status,
      submission: savedSubmission
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Submission Details for Recruiter review by Application ID
router.get('/submissions/application/:applicationId', authMiddleware, async (req, res) => {
  try {
    const app = await db.Application.findById(req.params.applicationId);
    if (!app) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const ass = await db.Assessment.findOne({ jobId: app.jobId });
    if (!ass) {
      return res.status(404).json({ error: 'No assessment configured for this job.' });
    }

    const sub = await db.Submission.findOne({ assessmentId: ass._id, candidateId: app.candidateId });
    if (!sub) {
      return res.json([]);
    }

    const details = await db.QuestionSubmission.find({ submissionId: sub._id });
    const resp = [];

    for (const qs of details) {
      const q = await db.Question.findById(qs.questionId);
      resp.push({
        id: qs._id,
        questionId: qs.questionId,
        codeSubmitted: qs.codeSubmitted,
        isCorrect: qs.isCorrect,
        scoreObtained: qs.scoreObtained,
        createdAt: qs.createdAt,
        question: q
      });
    }

    res.json(resp);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all submissions for a Job (for Recruiter Assessment Overview & 1-click Shortlisting)
router.get('/submissions/job/:jobId', authMiddleware, async (req, res) => {
  if (req.userRole !== 'RECRUITER' && req.userRole !== 'ADMIN' && req.userRole !== 'HIRING_MANAGER') {
    return res.status(403).json({ error: 'Access denied. Privileged role required.' });
  }

  try {
    const ass = await db.Assessment.findOne({ jobId: req.params.jobId });
    if (!ass) {
      return res.json({ assessment: null, submissions: [] });
    }

    const submissions = await db.Submission.find({ assessmentId: ass._id });
    const resp = [];

    for (const sub of submissions) {
      const candidate = await db.User.findById(sub.candidateId).select('-password');
      const application = await db.Application.findOne({ candidateId: sub.candidateId, jobId: req.params.jobId });
      const evidence = await db.SkillEvidence.findOne({ candidateId: sub.candidateId, source: 'ASSESSMENT' });
      
      const isPassed = sub.score >= (ass.passPercentage || 60);

      // Extract integrity score and tab switches if available in evidence details
      let integrityScore = 100;
      let tabSwitches = 0;
      if (evidence && evidence.details) {
        const integrityMatch = evidence.details.match(/Integrity:\s*(\d+)%/i);
        const switchMatch = evidence.details.match(/(\d+)\s*tab switches/i);
        if (integrityMatch) integrityScore = parseInt(integrityMatch[1]);
        if (switchMatch) tabSwitches = parseInt(switchMatch[1]);
      }

      resp.push({
        id: sub._id,
        submissionId: sub._id,
        candidateId: sub.candidateId,
        candidate: candidate ? { name: candidate.name, email: candidate.email } : null,
        applicationId: application ? application._id : null,
        applicationStatus: application ? application.status : 'APPLIED',
        score: sub.score,
        passPercentage: ass.passPercentage || 60,
        isPassed,
        integrityScore,
        tabSwitches,
        completedAt: sub.completedAt
      });
    }

    res.json({
      assessment: {
        id: ass._id,
        title: ass.title,
        passPercentage: ass.passPercentage || 60,
        timeLimit: ass.durationMinutes
      },
      submissions: resp
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
