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
    const { jobId, title, instructions, timeLimit, questions } = req.body;
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
      durationMinutes: parseInt(timeLimit) || 30
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
          const tcInput = typeof tc.input === 'object' ? JSON.stringify(tc.input) : String(tc.input || '');
          const tcOutput = typeof tc.expectedOutput === 'object' 
            ? JSON.stringify(tc.expectedOutput) 
            : (typeof tc.output === 'object' ? JSON.stringify(tc.output) : String(tc.expectedOutput || tc.output || ''));

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
        questions: questionsResp
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Candidate's applied jobs with linked assessments details
router.get('/my-applications', authMiddleware, async (req, res) => {
  if (req.userRole !== 'CANDIDATE') {
    return res.status(403).json({ error: 'Access denied. Candidates only.' });
  }

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
            timeLimit: ass.durationMinutes
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
        submissions
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
    const ass = await db.Assessment.findOne({ jobId: req.params.jobId });
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

    res.json({
      assessment: {
        id: ass._id,
        jobId: ass.jobId,
        title: ass.title,
        description: ass.description || '',
        timeLimit: ass.durationMinutes,
        questions: questionsResp,
        alreadySubmitted: !!priorSub
      }
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

// Submit Coding Assessment Answers & Grade
router.post('/:id/submit', authMiddleware, async (req, res) => {
  if (req.userRole !== 'CANDIDATE') {
    return res.status(403).json({ error: 'Access denied. Candidates only endpoint.' });
  }

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

    // Update Application Status
    app.status = 'ASSESSMENT';
    await app.save();

    // Update SkillEvidence
    await db.SkillEvidence.findOneAndUpdate(
      { candidateId: req.userId, skillName: ass.title, source: 'ASSESSMENT' },
      {
        candidateId: req.userId,
        skillName: ass.title,
        source: 'ASSESSMENT',
        confidence: 'HIGH',
        details: `Scored ${finalPercentScore}% in technical assessment module.`,
        verificationStatus: 'VERIFIED'
      },
      { upsert: true, new: true }
    );

    // Trigger score recalculations
    await matchEngine.calculateReadiness(targetAppId);

    // Simulated Plagiarism Detection (Bonus)
    let plagiarismDetected = false;
    let maxSimilarity = 14; // baseline similarity
    for (const q of questions) {
      const code = answers[q._id] || '';
      if (code.includes('copypaste') || code.includes('stackoverflow') || code.includes('chatgpt') || code.includes('github')) {
        plagiarismDetected = true;
        maxSimilarity = 92; // High similarity flag
      }
    }

    // Log action
    const log = new db.AuditLog({
      userId: req.userId,
      action: 'SUBMIT_CODING_ASSESSMENT',
      details: `Submission ID: ${savedSubmission._id}, Assessment ID: ${ass._id}, Plagiarism Score: ${maxSimilarity}%, Flagged: ${plagiarismDetected}`,
      status: 'SUCCESS'
    });
    await log.save();

    res.json({
      message: 'Coding challenge graded and submitted successfully.',
      submission: savedSubmission
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Submission Details for Recruiter review
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

module.exports = router;
