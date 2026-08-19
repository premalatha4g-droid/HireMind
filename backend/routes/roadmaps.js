const express = require('express');
const router = express.Router();
const db = require('../models');
const authMiddleware = require('../middleware/auth');
const geminiService = require('../services/geminiService');

// Get Career Roadmap by Application ID
router.get('/application/:applicationId', authMiddleware, async (req, res) => {
  try {
    const app = await db.Application.findById(req.params.applicationId);
    if (!app) {
      return res.status(404).json({ error: 'Application record not found.' });
    }

    const isOwner = app.candidateId === req.userId;
    const isStaff = ['RECRUITER', 'ADMIN', 'HIRING_MANAGER'].includes(req.userRole);

    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'Unauthorized access to roadmap details.' });
    }

    // Find existing roadmap
    let roadmap = await db.Roadmap.findOne({ candidateId: app.candidateId, jobId: app.jobId });
    if (!roadmap) {
      return res.status(404).json({ error: 'No learning roadmap found for this application.' });
    }

    const tasksList = await db.RoadmapTask.find({ roadmapId: roadmap._id }).sort({ week: 1 });
    res.json({
      id: roadmap._id,
      candidateId: roadmap.candidateId,
      jobId: roadmap.jobId,
      isRealAI: true,
      createdAt: roadmap.createdAt,
      tasks: tasksList
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Generate or Recompile Upskilling Roadmap for Application
router.post('/generate/:applicationId', authMiddleware, async (req, res) => {
  try {
    const app = await db.Application.findById(req.params.applicationId);
    if (!app) {
      return res.status(404).json({ error: 'Application record not found.' });
    }

    const isOwner = app.candidateId === req.userId;
    const isStaff = ['RECRUITER', 'ADMIN', 'HIRING_MANAGER'].includes(req.userRole);

    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'Unauthorized to generate roadmap for this application.' });
    }

    // Find existing roadmap or create
    let roadmap = await db.Roadmap.findOne({ candidateId: app.candidateId, jobId: app.jobId });
    if (roadmap) {
      await db.RoadmapTask.deleteMany({ roadmapId: roadmap._id });
    } else {
      roadmap = new db.Roadmap({
        candidateId: app.candidateId,
        jobId: app.jobId
      });
      await roadmap.save();
    }

    // Generate tasks via Gemini service
    const matchAnalysis = await db.MatchAnalysis.findOne({ applicationId: app._id });
    const gaps = matchAnalysis ? await db.SkillGap.find({ matchAnalysisId: matchAnalysis._id }) : [];
    const aiRoadmapStr = geminiService.generateRoadmap(JSON.stringify(gaps));
    const parsed = JSON.parse(aiRoadmapStr);
    const tasksData = parsed.roadmap?.tasks || [];

    const savedTasks = [];
    for (const t of tasksData) {
      const task = new db.RoadmapTask({
        roadmapId: roadmap._id,
        week: parseInt(t.week) || 1,
        title: t.title || 'Upskilling Lesson',
        description: t.description || '',
        estimatedTime: t.estimatedTime || '4 hours',
        difficulty: t.difficulty || 'MEDIUM',
        status: 'NOT_STARTED'
      });
      savedTasks.push(await task.save());
    }

    // Audit log
    const log = new db.AuditLog({
      userId: req.userId,
      action: 'CREATE_ROADMAP',
      details: `Generated upskilling roadmap for Application: ${app._id}`,
      status: 'SUCCESS'
    });
    await log.save();

    res.json({
      message: 'Roadmap generated successfully.',
      roadmap: {
        id: roadmap._id,
        candidateId: roadmap.candidateId,
        jobId: roadmap.jobId,
        isRealAI: true,
        createdAt: roadmap.createdAt,
        tasks: savedTasks
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH or PUT update task status
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await db.RoadmapTask.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Roadmap task not found.' });
    }

    const roadmap = await db.Roadmap.findById(task.roadmapId);
    if (!roadmap || (roadmap.candidateId !== req.userId && req.userRole !== 'ADMIN' && req.userRole !== 'RECRUITER')) {
      return res.status(403).json({ error: 'Unauthorized to modify this roadmap task.' });
    }

    if (status) {
      task.status = status === 'PENDING' ? 'NOT_STARTED' : status;
    } else {
      task.status = task.status === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
    }

    const savedTask = await task.save();

    // Audit log
    const log = new db.AuditLog({
      userId: req.userId,
      action: 'TOGGLE_ROADMAP_TASK',
      details: `Updated task ${task._id} status to ${task.status}`,
      status: 'SUCCESS'
    });
    await log.save();

    res.json({ message: 'Roadmap task status updated successfully.', task: savedTask });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.patch('/tasks/:taskId', authMiddleware, updateTaskStatus);
router.put('/tasks/:taskId', authMiddleware, updateTaskStatus);
router.put('/task/:taskId/toggle', authMiddleware, updateTaskStatus);

module.exports = router;
