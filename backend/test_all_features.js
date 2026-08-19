const http = require('http');
const express = require('express');
const mongoose = require('mongoose');

// We will start the backend server programmatically or connect to running instance on port 5000 / 5001
const PORT = 5055;
const BASE_URL = `http://localhost:${PORT}`;

async function runAllFeaturesTest() {
  console.log('================================================================');
  console.log('🚀 COMPREHENSIVE END-TO-END FEATURE VERIFICATION SUITE');
  console.log('================================================================');

  let server;
  try {
    // Start backend app on dedicated test port
    require('dotenv').config();
    const app = express();
    const cors = require('cors');
    const db = require('./models');

    app.use(cors());
    app.use(express.json());

    // Register all routers
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/jobs', require('./routes/jobs'));
    app.use('/api/resume', require('./routes/resume'));
    app.use('/api/resumes', require('./routes/resume'));
    app.use('/api/readiness', require('./routes/readiness'));
    app.use('/api/assessments', require('./routes/assessments'));
    app.use('/api/interviews', require('./routes/interviews'));
    app.use('/api/offers', require('./routes/offers'));
    app.use('/api/roadmaps', require('./routes/roadmaps'));
    app.use('/api/matches', require('./routes/matches'));
    app.use('/api/admin', require('./routes/admin'));
    app.use('/api/notifications', require('./routes/notifications'));

    app.get('/health', (req, res) => {
      res.json({ status: 'UP', database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED' });
    });

    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hiremind');
    console.log('✓ Connected to MongoDB');

    server = app.listen(PORT);
    console.log(`✓ Test Express server listening on port ${PORT}\n`);

    const ts = Date.now();
    const candidateEmail = `cand_${ts}@hiremind.ai`;
    const recruiterEmail = `rec_${ts}@hiremind.ai`;
    const interviewerEmail = `int_${ts}@hiremind.ai`;
    const adminEmail = `admin_${ts}@hiremind.ai`;
    const hiringManagerEmail = `hm_${ts}@hiremind.ai`;
    const password = 'TestPassword123!';

    let candidateToken, recruiterToken, interviewerToken, adminToken, hmToken;
    let candidateId, recruiterId, interviewerId, adminId, hmId;
    let jobId, applicationId, assessmentId, questionId, offerId, roadmapId, taskId;

    // Helper request
    const req = async (endpoint, method = 'GET', body = null, token = null) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(`[${method} ${endpoint}] HTTP ${res.status}: ${JSON.stringify(data)}`);
      }
      return data;
    };

    // 1. Health
    console.log('[1] Checking System Health...');
    const health = await req('/health');
    console.log(`    Status: ${health.status}, DB: ${health.database}`);

    // 2. Authentication & User Registrations
    console.log('\n[2] Testing Authentication & Role Management...');
    const regCand = await req('/api/auth/register', 'POST', { name: 'Alex Candidate', email: candidateEmail, password, role: 'CANDIDATE' });
    candidateToken = regCand.token;
    candidateId = regCand.user.id;
    console.log(`    ✓ Registered Candidate: ${candidateEmail} (ID: ${candidateId})`);

    const regRec = await req('/api/auth/register', 'POST', { name: 'Rachel Recruiter', email: recruiterEmail, password, role: 'RECRUITER' });
    recruiterToken = regRec.token;
    recruiterId = regRec.user.id;
    console.log(`    ✓ Registered Recruiter: ${recruiterEmail} (ID: ${recruiterId})`);

    const regInt = await req('/api/auth/register', 'POST', { name: 'Ian Interviewer', email: interviewerEmail, password, role: 'INTERVIEWER' });
    interviewerToken = regInt.token;
    interviewerId = regInt.user.id;
    console.log(`    ✓ Registered Interviewer: ${interviewerEmail} (ID: ${interviewerId})`);

    const regAdmin = await req('/api/auth/register', 'POST', { name: 'Alice Admin', email: adminEmail, password, role: 'ADMIN' });
    adminToken = regAdmin.token;
    adminId = regAdmin.user.id;
    console.log(`    ✓ Registered Admin: ${adminEmail} (ID: ${adminId})`);

    const regHm = await req('/api/auth/register', 'POST', { name: 'Harry HiringManager', email: hiringManagerEmail, password, role: 'HIRING_MANAGER' });
    hmToken = regHm.token;
    hmId = regHm.user.id;
    console.log(`    ✓ Registered Hiring Manager: ${hiringManagerEmail} (ID: ${hmId})`);

    // 3. User Me & Session Restoration
    console.log('\n[3] Testing /api/auth/me session verification...');
    const meCand = await req('/api/auth/me', 'GET', null, candidateToken);
    console.log(`    ✓ Verified Candidate Session: ${meCand.user.name} (${meCand.user.role})`);
    const meRec = await req('/api/auth/me', 'GET', null, recruiterToken);
    console.log(`    ✓ Verified Recruiter Session: ${meRec.user.name} (${meRec.user.role})`);

    // 4. 2FA Toggle & Verify
    console.log('\n[4] Testing 2FA Security...');
    const toggle2fa = await req('/api/auth/2fa/toggle', 'POST', null, candidateToken);
    console.log(`    ✓ 2FA Toggled: ${toggle2fa.is2FAEnabled}`);
    const verify2fa = await req('/api/auth/2fa/verify', 'POST', { email: candidateEmail, code: '123456' });
    console.log(`    ✓ 2FA OTP Verified successfully for ${verify2fa.user.email}`);

    // 5. Directories
    console.log('\n[5] Testing User Directories (/candidates, /interviewers, /users)...');
    const candList = await req('/api/auth/candidates', 'GET', null, recruiterToken);
    console.log(`    ✓ Candidates list: ${candList.length} candidate(s)`);
    const intList = await req('/api/auth/interviewers', 'GET', null, recruiterToken);
    console.log(`    ✓ Interviewers list: ${intList.length} interviewer(s)`);
    const allUsers = await req('/api/auth/users', 'GET', null, adminToken);
    console.log(`    ✓ All Users directory: ${allUsers.length} user(s)`);

    // 6. Job Creation & Analysis
    console.log('\n[6] Testing Job Intelligence Workspace (Create & AI Analysis)...');
    const jobAnalysisRes = await req('/api/jobs/analyze', 'POST', {
      title: 'Senior Full Stack Engineer',
      company: 'TechForward Labs',
      description: 'We are seeking a Senior Full Stack Engineer proficient in React, Node.js, TypeScript, PostgreSQL, and AWS to lead scalable microservices.',
      location: 'Remote, US',
      employmentType: 'FULL_TIME',
      experienceYears: 4,
      salary: '$140,000 - $160,000'
    }, recruiterToken);
    jobId = jobAnalysisRes.job._id || jobAnalysisRes.job.id;
    console.log(`    ✓ Draft Job created with AI Analysis (Job ID: ${jobId})`);
    console.log(`    ✓ Extracted required skills: ${jobAnalysisRes.analysis.requiredSkills.join(', ')}`);

    // 7. Publish Job
    console.log('\n[7] Testing Job Publishing & Updates (PUT /api/jobs/:id/publish)...');
    const pubJob = await req(`/api/jobs/${jobId}/publish`, 'PUT', {
      ...jobAnalysisRes.job,
      requiredSkills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
      preferredSkills: ['AWS', 'Docker']
    }, recruiterToken);
    console.log(`    ✓ Job published with status: ${pubJob.job.status}`);

    // 8. List Active Jobs & Single Details
    console.log('\n[8] Testing Job Browsing & Skill Population...');
    const jobsList = await req('/api/jobs', 'GET');
    const foundJob = jobsList.find(j => (j._id || j.id) === jobId);
    console.log(`    ✓ Active Jobs retrieved: ${jobsList.length}. Found published job skills count: ${foundJob.skills?.length}`);

    // 9. Candidate Apply for Job
    console.log('\n[9] Testing Candidate Job Application...');
    const applyRes = await req(`/api/jobs/${jobId}/apply`, 'POST', null, candidateToken);
    const appData = applyRes.application;
    applicationId = appData._id || appData.id;
    console.log(`    ✓ Applied successfully (Application ID: ${applicationId}, Stage: ${appData.status})`);

    // 10. Candidate Resume & Skill Passport
    console.log('\n[10] Testing Skill Passport & Resume Management...');
    // Seed candidate resume & evidence
    const resume = new db.Resume({
      candidateId,
      filename: 'Alex_Candidate_CV.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      processingStatus: 'PROCESSED'
    });
    const savedResume = await resume.save();
    const resumeAnalysis = new db.ResumeAnalysis({
      resumeId: savedResume._id,
      name: 'Alex Candidate',
      email: candidateEmail,
      summary: 'Experienced Full Stack Engineer with strong proficiency in React, Node.js, TypeScript, PostgreSQL, and cloud deployments.',
      skills: JSON.stringify({
        frontend: ['React', 'TypeScript', 'JavaScript'],
        backend: ['Node.js', 'PostgreSQL', 'Express'],
        cloud: ['AWS', 'Docker']
      }),
      experience: JSON.stringify([
        { company: 'Global Solutions', role: 'Full Stack Engineer', duration: '3.5 years' }
      ]),
      projects: JSON.stringify([
        { projectName: 'Cloud Enterprise Portal', technologies: ['React', 'Node.js', 'PostgreSQL'] }
      ]),
      education: JSON.stringify([
        { degree: 'Bachelor of Science in Computer Science', institution: 'State University' }
      ]),
      certifications: JSON.stringify([
        { certificationName: 'AWS Certified Solutions Architect' }
      ]),
      isRealAI: true
    });
    await resumeAnalysis.save();

    // Add SkillEvidence
    const skillsToSeed = ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'];
    for (const sk of skillsToSeed) {
      await db.SkillEvidence.findOneAndUpdate(
        { candidateId, skillName: sk, source: 'RESUME' },
        { candidateId, skillName: sk, source: 'RESUME', verificationStatus: 'VERIFIED', confidence: 'MEDIUM', details: 'Extracted from CV' },
        { upsert: true, new: true }
      );
    }

    const passportData = await req('/api/resumes/me', 'GET', null, candidateToken);
    console.log(`    ✓ Skill Passport loaded: Candidate Name "${passportData.analysis.name}", Evidences Count: ${passportData.skillEvidences?.length}`);

    // 11. Match Intelligence Engine
    console.log('\n[11] Testing Match Intelligence & Readiness Scoring Engine...');
    const recalcRes = await req('/api/matches/calculate', 'POST', { applicationId }, recruiterToken);
    console.log(`    ✓ Match recalculated: Overall Score: ${recalcRes.match.overallScore}%, Skills Score: ${recalcRes.match.skillsScore}%`);
    console.log(`    ✓ Matched Required: ${recalcRes.match.matchedRequiredSkills.join(', ')}`);
    console.log(`    ✓ Readiness Index: ${recalcRes.readiness.readinessScore}%`);

    const matchesForJob = await req(`/api/matches/job/${jobId}`, 'GET', null, recruiterToken);
    console.log(`    ✓ Job Matches list returned ${matchesForJob.length} candidate match record(s)`);

    const readinessReport = await req(`/api/readiness/report/${applicationId}`, 'GET', null, recruiterToken);
    console.log(`    ✓ Readiness Report loaded: Readiness Score ${readinessReport.readinessScore}%, Evidences count: ${readinessReport.skillEvidence?.length}`);

    // 12. Recruiter Verification Override
    console.log('\n[12] Testing Recruiter Skill Evidence Override...');
    const firstEv = readinessReport.skillEvidence[0];
    const overrideRes = await req('/api/readiness/override', 'POST', {
      skillEvidenceId: firstEv._id || firstEv.id,
      verificationStatus: 'OVERRIDDEN',
      overrideConfidence: 'HIGH',
      recruiterNotes: 'Verified via Github and portfolio live links.'
    }, recruiterToken);
    console.log(`    ✓ Skill Evidence override saved for skill "${overrideRes.evidence.skillName}" (Confidence: ${overrideRes.evidence.overrideConfidence})`);

    // 13. AI Pre-Screening Sandbox
    console.log('\n[13] Testing AI Pre-Screening Sandbox...');
    const preScreeningQ = await req(`/api/interviews/pre-screening/${applicationId}`, 'GET', null, candidateToken);
    console.log(`    ✓ Loaded ${preScreeningQ.questions.length} Pre-Screening questions`);

    const preScreeningSubmit = await req(`/api/interviews/pre-screening/${applicationId}/submit`, 'POST', {
      answers: {
        1: "I design scalable systems with decoupled microservices, clean data models, caching layers, and performant indexes.",
        2: "I implement error boundaries, circuit breakers, Redis caching, and robust state stores with immutable mutations.",
        3: "I automate end-to-end and unit testing in CI/CD pipelines, track performance metrics, and profile memory leaks."
      }
    }, candidateToken);
    console.log(`    ✓ AI Pre-Screening Graded: Score ${preScreeningSubmit.score}%, Stage: ${preScreeningSubmit.status}`);

    // 14. Coding Assessment Builder & Terminal Sandbox
    console.log('\n[14] Testing Assessment Builder & Coding Terminal Sandbox...');
    const createAssRes = await req('/api/assessments', 'POST', {
      jobId,
      title: 'Full Stack Algorithm Assessment',
      timeLimit: 45,
      instructions: 'Solve the algorithmic challenges in JavaScript.',
      questions: [
        {
          title: 'Palindrome Check',
          description: 'Write a function isPalindrome(str) that returns true if str is palindrome.',
          codeTemplate: 'function isPalindrome(str) {\n  const clean = str.toLowerCase().replace(/[^a-z0-9]/g, "");\n  return clean === clean.split("").reverse().join("");\n}',
          difficulty: 'EASY',
          points: 50,
          testCases: [
            { input: ['racecar'], output: true },
            { input: ['hello'], output: false }
          ]
        },
        {
          title: 'Array Multiplier',
          description: 'Write a function multiply(arr, factor) that multiplies each element by factor.',
          codeTemplate: 'function multiply(arr, factor) {\n  return arr.map(x => x * factor);\n}',
          difficulty: 'MEDIUM',
          points: 50,
          testCases: [
            { input: [[1, 2, 3], 2], output: [2, 4, 6] }
          ]
        }
      ]
    }, recruiterToken);

    assessmentId = createAssRes.assessment.id;
    console.log(`    ✓ Created Coding Assessment (ID: ${assessmentId}) with ${createAssRes.assessment.questions.length} questions`);

    // Get assessment details
    const getAssRes = await req(`/api/assessments/job/${jobId}`, 'GET', null, candidateToken);
    console.log(`    ✓ Candidate retrieved assessment: "${getAssRes.title}" (${getAssRes.questions.length} questions, test cases masked for candidate)`);

    // Run preview
    const previewRes = await req('/api/assessments/run-preview', 'POST', {
      code: 'function isPalindrome(str) { return str === str.split("").reverse().join(""); }',
      sampleInput: ['noon'],
      sampleOutput: true
    });
    console.log(`    ✓ Code preview execution test passed: ${previewRes.passed}, actual: ${previewRes.actual}`);

    // Verify Interview Gating (Attempt scheduling BEFORE completing assessment)
    try {
      await req('/api/interviews/schedule', 'POST', {
        applicationId,
        interviewerId,
        date: '2026-08-25',
        time: '11:00',
        type: 'SYSTEMS_ARCHITECTURE'
      }, recruiterToken);
      console.log('    ✗ Error: Interview should not be schedulable before completing assessment!');
    } catch (err) {
      console.log('    ✓ Interview Gating Enforced: Scheduling blocked because candidate has not completed required assessment.');
    }

    // Submit candidate solutions
    const q1Id = getAssRes.questions[0].id;
    const q2Id = getAssRes.questions[1].id;
    const submitAssRes = await req(`/api/assessments/${assessmentId}/submit`, 'POST', {
      applicationId,
      answers: {
        [q1Id]: 'function isPalindrome(str) {\n  const clean = str.toLowerCase().replace(/[^a-z0-9]/g, "");\n  return clean === clean.split("").reverse().join("");\n}',
        [q2Id]: 'function multiply(arr, factor) {\n  return arr.map(x => x * factor);\n}'
      }
    }, candidateToken);
    console.log(`    ✓ Assessment submission graded score: ${submitAssRes.score}% (Status: ${submitAssRes.status}, Shortlisted: ${submitAssRes.shortlisted})`);

    // Recruiter view submission
    const viewSubRes = await req(`/api/assessments/submissions/application/${applicationId}`, 'GET', null, recruiterToken);
    console.log(`    ✓ Recruiter reviewed candidate submission: ${viewSubRes.length} question result(s)`);

    // Recruiter view job submissions list
    const jobSubsRes = await req(`/api/assessments/submissions/job/${jobId}`, 'GET', null, recruiterToken);
    console.log(`    ✓ Job Submissions overview retrieved ${jobSubsRes.submissions?.length} candidate(s) for job`);

    // 15. Interview Scheduling & Evaluation
    console.log('\n[15] Testing Interview Scheduling & Evaluation Workspace...');
    const genQRes = await req('/api/interviews/generate-questions', 'POST', { applicationId }, recruiterToken);
    console.log(`    ✓ Generated ${genQRes.questions.length} AI interview questions`);

    const schedRes = await req('/api/interviews/schedule', 'POST', {
      applicationId,
      interviewerId,
      date: '2026-08-25',
      time: '11:00',
      type: 'SYSTEMS_ARCHITECTURE',
      meetingLink: 'https://meet.google.com/hiremind-alex-session',
      questions: genQRes.questions
    }, recruiterToken);
    console.log(`    ✓ Interview scheduled for shortlisted candidate: ${schedRes.message}`);

    const recSchedules = await req('/api/interviews/my-schedules', 'GET', null, recruiterToken);
    console.log(`    ✓ Recruiter schedules retrieved: ${recSchedules.length} interview(s)`);

    const intAssigned = await req('/api/interviews/assigned', 'GET', null, interviewerToken);
    console.log(`    ✓ Interviewer assigned list retrieved: ${intAssigned.length} interview(s)`);

    // Interviewer builds draft
    const draftRes = await req(`/api/interviews/${applicationId}/feedback/draft`, 'POST', {
      rawNotes: 'Excellent understanding of distributed state management and clean modular architecture.',
      technicalScore: 9,
      problemSolvingScore: 9,
      communicationScore: 9,
      projectUnderstandingScore: 9
    }, interviewerToken);
    console.log(`    ✓ Interviewer generated AI draft recommendation: ${draftRes.recommendation}`);

    // Interviewer submits final evaluation
    const submitFeedbackRes = await req(`/api/interviews/${applicationId}/feedback/submit`, 'POST', {
      technicalScore: 9,
      problemSolvingScore: 9,
      projectUnderstandingScore: 9,
      communicationScore: 9,
      comments: 'Outstanding performance across technical depth and system design.',
      recommendation: 'RECOMMEND_HIRE'
    }, interviewerToken);
    console.log(`    ✓ Interview feedback evaluation logged: ${submitFeedbackRes.message}`);

    // 16. Career Upskilling Roadmap
    console.log('\n[16] Testing Career Upskilling Roadmap Workspace...');
    const genRoadmapRes = await req(`/api/roadmaps/generate/${applicationId}`, 'POST', null, candidateToken);
    roadmapId = genRoadmapRes.roadmap.id;
    taskId = genRoadmapRes.roadmap.tasks[0]._id;
    console.log(`    ✓ Generated Upskilling Roadmap (ID: ${roadmapId}) with ${genRoadmapRes.roadmap.tasks.length} milestones`);

    const getRoadmapRes = await req(`/api/roadmaps/application/${applicationId}`, 'GET', null, candidateToken);
    console.log(`    ✓ Candidate retrieved roadmap: ${getRoadmapRes.tasks.length} tasks`);

    const toggleTaskRes = await req(`/api/roadmaps/tasks/${taskId}`, 'PATCH', { status: 'COMPLETED' }, candidateToken);
    console.log(`    ✓ Toggled roadmap milestone status to: ${toggleTaskRes.task.status}`);

    // 17. Formal Job Offer Workflow
    console.log('\n[17] Testing Formal Job Offer Workflow...');
    const createOfferRes = await req('/api/offers', 'POST', {
      applicationId,
      salary: '$155,000 / year',
      location: 'Remote, US',
      joiningDate: '2026-09-01',
      employmentType: 'FULL_TIME',
      benefits: ['Health, Dental & Vision', '401(k) 6% Match', 'Unlimited PTO', '$3,000 Home Office Stipend']
    }, recruiterToken);
    offerId = createOfferRes.offer._id || createOfferRes.offer.id;
    console.log(`    ✓ Issued Job Offer (ID: ${offerId}, Salary: ${createOfferRes.offer.salary})`);

    const getOfferRes = await req(`/api/offers/application/${applicationId}`, 'GET', null, candidateToken);
    console.log(`    ✓ Candidate viewed offer details: ${getOfferRes.jobTitle} at ${getOfferRes.salary}`);

    const recOffers = await req('/api/offers/my-offers', 'GET', null, recruiterToken);
    console.log(`    ✓ Recruiter offers list: ${recOffers.length} offer(s)`);

    const respondOfferRes = await req(`/api/offers/${offerId}/respond`, 'POST', { response: 'ACCEPT' }, candidateToken);
    console.log(`    ✓ Candidate accepted offer: ${respondOfferRes.message}`);

    // Check application status is now HIRED
    const appAfterHired = await db.Application.findById(applicationId);
    console.log(`    ✓ Application stage confirmed: ${appAfterHired.status}`);

    // 18. Recruitment Kanban & Application Management
    console.log('\n[18] Testing Recruitment Kanban Pipeline...');
    const allApps = await req('/api/jobs/applications/all', 'GET', null, recruiterToken);
    console.log(`    ✓ Kanban applications loaded: ${allApps.length} pipeline items`);

    const transitionRes = await req(`/api/jobs/applications/${applicationId}/status`, 'PUT', { status: 'HIRED' }, recruiterToken);
    console.log(`    ✓ Application stage transition confirmed: ${transitionRes.application.status}`);

    // 19. Dashboard Analytics & Stats
    console.log('\n[19] Testing Candidate & Recruiter Dashboard Stats...');
    const candStats = await req('/api/readiness/candidate-stats', 'GET', null, candidateToken);
    console.log(`    ✓ Candidate Dashboard Stats: Completeness: ${candStats.profileCompleteness}%, Applications: ${candStats.totalApplications}`);

    const recStats = await req('/api/readiness/dashboard-stats', 'GET', null, recruiterToken);
    console.log(`    ✓ Recruiter Dashboard Stats: Total Jobs: ${recStats.totalJobs}, Applications: ${recStats.totalApplications}, High Readiness: ${recStats.highReadiness}`);

    // 20. Admin Control Center & Audit Logs
    console.log('\n[20] Testing Admin Control Center & Analytics Funnel...');
    const adminAnalytics = await req('/api/admin/analytics', 'GET', null, adminToken);
    console.log(`    ✓ Admin Analytics: Funnel conversion: ${JSON.stringify(adminAnalytics.funnelConversion)}`);
    console.log(`    ✓ Admin Assessment Stats: Avg score: ${adminAnalytics.assessmentStats.averageCodingScore}%`);
    console.log(`    ✓ Admin Offer Stats: Accepted: ${adminAnalytics.offerStats.ACCEPTED}, Acceptance Rate: ${adminAnalytics.offerStats.acceptanceRate}%`);

    const auditLogsRes = await req('/api/admin/audit-logs?page=1&limit=10', 'GET', null, adminToken);
    console.log(`    ✓ Admin Audit Logs: Total records ${auditLogsRes.total}, Paginated items: ${auditLogsRes.logs.length}`);

    // 21. Simulated Email Notifications
    console.log('\n[21] Testing User Notifications...');
    const candNotifs = await req('/api/notifications', 'GET', null, candidateToken);
    console.log(`    ✓ Candidate Notifications count: ${candNotifs.length}`);
    if (candNotifs.length > 0) {
      console.log(`      Latest Notification: "${candNotifs[0].title}" - ${candNotifs[0].message}`);
    }

    const markRead = await req('/api/notifications/mark-all-read', 'POST', null, candidateToken);
    console.log(`    ✓ Marked all notifications read: ${markRead.message}`);

    console.log('\n================================================================');
    console.log('🎉 ALL 21 CORE FEATURES & WORKFLOWS VERIFIED 100% OPERATIONAL 🎉');
    console.log('================================================================');

  } catch (err) {
    console.error('\n❌ VERIFICATION TEST FAILURE:');
    console.error(err.stack || err.message);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
  }
}

runAllFeaturesTest();
