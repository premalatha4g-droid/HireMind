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
      // Create and seed new roadmap using Gemini mock
      roadmap = new db.Roadmap({
        candidateId: app.candidateId,
        jobId: app.jobId
      });
      const savedRoadmap = await roadmap.save();

      const aiRoadmapStr = geminiService.generateRoadmap('{}');
      const parsed = JSON.parse(aiRoadmapStr);
      const tasks = parsed.roadmap?.tasks || [];

      for (const t of tasks) {
        const task = new db.RoadmapTask({
          roadmapId: savedRoadmap._id,
          week: parseInt(t.week) || 1,
          title: t.title || 'Upskilling Lesson',
          description: t.description || '',
          estimatedTime: t.estimatedTime || '4 hours',
          difficulty: t.difficulty || 'MEDIUM',
          status: 'NOT_STARTED'
        });
        await task.save();
      }
      roadmap = savedRoadmap;
    }

    const tasksList = await db.RoadmapTask.find({ roadmapId: roadmap._id }).sort({ week: 1 });
    res.json({
      id: roadmap._id,
      candidateId: roadmap.candidateId,
      jobId: roadmap.jobId,
      createdAt: roadmap.createdAt,
      tasks: tasksList
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle Roadmap Task completion status
router.put('/task/:taskId/toggle', authMiddleware, async (req, res) => {
  try {
    const task = await db.RoadmapTask.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Roadmap task not found.' });
    }

    const roadmap = await db.Roadmap.findById(task.roadmapId);
    if (!roadmap || (roadmap.candidateId !== req.userId && req.userRole !== 'ADMIN')) {
      return res.status(403).json({ error: 'Unauthorized to modify this roadmap task.' });
    }

    task.status = task.status === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
    const savedTask = await task.save();

    res.json({ message: 'Roadmap task status updated successfully.', task: savedTask });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
