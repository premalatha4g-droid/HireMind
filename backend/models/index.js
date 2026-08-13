const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Configure schemas to use custom UUIDs as _id to match SQL setup
const uuidField = {
  type: String,
  default: () => uuidv4()
};

// 1. User Schema
const UserSchema = new mongoose.Schema({
  _id: uuidField,
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true }, // CANDIDATE, RECRUITER, INTERVIEWER, HIRING_MANAGER, ADMIN
  is2FAEnabled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// 2. Job Schema
const JobSchema = new mongoose.Schema({
  _id: uuidField,
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  experienceYears: { type: Number, default: 0 },
  education: { type: String, default: '' },
  certifications: { type: String, default: '' },
  salary: { type: String, default: '' },
  employmentType: { type: String, default: 'FULL_TIME' },
  status: { type: String, default: 'DRAFT' }, // DRAFT, ACTIVE, CLOSED
  description: { type: String, required: true },
  createdById: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// 3. JobAnalysis Schema
const JobAnalysisSchema = new mongoose.Schema({
  _id: uuidField,
  jobId: { type: String, required: true, unique: true },
  summary: { type: String, default: '' },
  responsibilities: { type: String, default: '[]' },
  requiredSkills: { type: String, default: '[]' },
  preferredSkills: { type: String, default: '[]' },
  experienceYears: { type: Number, default: 0 },
  education: { type: String, default: '' },
  certifications: { type: String, default: '[]' },
  technologies: { type: String, default: '[]' },
  seniorityLevel: { type: String, default: 'MID' },
  isRealAI: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// 4. JobSkill Schema
const JobSkillSchema = new mongoose.Schema({
  _id: uuidField,
  jobId: { type: String, required: true },
  skillName: { type: String, required: true },
  isRequired: { type: Boolean, default: true }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// 5. Application Schema
const ApplicationSchema = new mongoose.Schema({
  _id: uuidField,
  candidateId: { type: String, required: true },
  jobId: { type: String, required: true },
  status: { type: String, default: 'APPLIED' }, // APPLIED, SCREENING, SHORTLISTED, INTERVIEW, ASSESSMENT, OFFER, HIRED, REJECTED
  matchScore: { type: Number, default: 0 },
  readinessScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// 6. Resume Schema
const ResumeSchema = new mongoose.Schema({
  _id: uuidField,
  candidateId: { type: String, required: true, unique: true },
  filename: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  processingStatus: { type: String, default: 'PROCESSED' }, // PROCESSING, PROCESSED, FAILED
  uploadedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// 7. ResumeAnalysis Schema
const ResumeAnalysisSchema = new mongoose.Schema({
  _id: uuidField,
  resumeId: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  summary: { type: String, default: '' },
  skills: { type: String, default: '{}' },
  experience: { type: String, default: '[]' },
  projects: { type: String, default: '[]' },
  education: { type: String, default: '[]' },
  certifications: { type: String, default: '[]' },
  achievements: { type: String, default: '[]' },
  isRealAI: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// 8. SkillEvidence Schema
const SkillEvidenceSchema = new mongoose.Schema({
  _id: uuidField,
  candidateId: { type: String, required: true },
  skillName: { type: String, required: true },
  source: { type: String, required: true }, // RESUME, PROJECT, CERTIFICATION, ASSESSMENT, INTERVIEW
  verificationStatus: { type: String, default: 'VERIFIED' }, // NEEDS_VERIFICATION, VERIFIED, OVERRIDDEN
  details: { type: String, default: '' },
  confidence: { type: String, default: 'MEDIUM' }, // HIGH, MEDIUM, LOW, NONE
  overrideConfidence: { type: String, default: null },
  recruiterNotes: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });
// Compound index to prevent duplicate evidence for same candidate-skill-source combo
SkillEvidenceSchema.index({ candidateId: 1, skillName: 1, source: 1 }, { unique: true });

// 9. ReadinessAnalysis Schema
const ReadinessAnalysisSchema = new mongoose.Schema({
  _id: uuidField,
  applicationId: { type: String, required: true, unique: true },
  readinessScore: { type: Number, default: 0 },
  skillsEvidenceScore: { type: Number, default: 0 },
  assessmentScore: { type: Number, default: 0 },
  projectEvidenceScore: { type: Number, default: 0 },
  interviewScore: { type: Number, default: 0 },
  profileCompleteness: { type: Number, default: 0 },
  evidenceConflicts: { type: String, default: '[]' },
  calculatedAt: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// 10. MatchAnalysis Schema
const MatchAnalysisSchema = new mongoose.Schema({
  _id: uuidField,
  applicationId: { type: String, required: true, unique: true },
  overallScore: { type: Number, default: 0 },
  skillsScore: { type: Number, default: 0 },
  experienceScore: { type: Number, default: 0 },
  projectsScore: { type: Number, default: 0 },
  educationScore: { type: Number, default: 0 },
  certificationsScore: { type: Number, default: 0 },
  matchedRequiredSkills: { type: String, default: '[]' },
  missingRequiredSkills: { type: String, default: '[]' },
  matchedPreferredSkills: { type: String, default: '[]' },
  candidateExperience: { type: Number, default: 0 },
  requiredExperience: { type: Number, default: 0 },
  matchedProjects: { type: String, default: '[]' },
  missingProjectTechnologies: { type: String, default: '[]' },
  educationMatch: { type: String, default: 'MATCHED' },
  matchedCertifications: { type: String, default: '[]' },
  missingCertifications: { type: String, default: '[]' },
  scoreExplanation: { type: String, default: '' },
  calculatedAt: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// 11. SkillGap Schema
const SkillGapSchema = new mongoose.Schema({
  _id: uuidField,
  matchAnalysisId: { type: String, required: true },
  skillName: { type: String, required: true },
  importance: { type: String, default: 'REQUIRED' },
  currentEvidence: { type: String, default: 'MISSING' },
  targetRequirement: { type: String, default: '' },
  gapSeverity: { type: String, default: 'HIGH' },
  recommendation: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// 12. Assessment Schema
const AssessmentSchema = new mongoose.Schema({
  _id: uuidField,
  jobId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  durationMinutes: { type: Number, default: 30 },
  passPercentage: { type: Number, default: 60 },
  createdAt: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// 13. Question Schema
const QuestionSchema = new mongoose.Schema({
  _id: uuidField,
  assessmentId: { type: String, required: true },
  questionText: { type: String, required: true },
  type: { type: String, default: 'CODING' }, // MCQ, CODING, SQL, DEBUGGING
  difficulty: { type: String, default: 'MEDIUM' },
  points: { type: Number, default: 10 },
  codeTemplate: { type: String, default: '' },
  options: { type: String, default: '[]' },
  sampleSolution: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// 14. TestCase Schema
const TestCaseSchema = new mongoose.Schema({
  _id: uuidField,
  questionId: { type: String, required: true },
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// 15. Submission Schema
const SubmissionSchema = new mongoose.Schema({
  _id: uuidField,
  candidateId: { type: String, required: true },
  assessmentId: { type: String, required: true },
  score: { type: Number, default: 0 },
  completedAt: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// 16. QuestionSubmission Schema
const QuestionSubmissionSchema = new mongoose.Schema({
  _id: uuidField,
  submissionId: { type: String, required: true },
  questionId: { type: String, required: true },
  codeSubmitted: { type: String, default: '' },
  scoreObtained: { type: Number, default: 0 },
  isCorrect: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// 17. Roadmap Schema
const RoadmapSchema = new mongoose.Schema({
  _id: uuidField,
  candidateId: { type: String, required: true },
  jobId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// 18. RoadmapTask Schema
const RoadmapTaskSchema = new mongoose.Schema({
  _id: uuidField,
  roadmapId: { type: String, required: true },
  week: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  estimatedTime: { type: String, default: '' },
  difficulty: { type: String, default: 'MEDIUM' },
  status: { type: String, default: 'NOT_STARTED' } // NOT_STARTED, IN_PROGRESS, COMPLETED
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// 19. Offer Schema
const OfferSchema = new mongoose.Schema({
  _id: uuidField,
  applicationId: { type: String, required: true, unique: true },
  salary: { type: String, required: true },
  location: { type: String, required: true },
  joiningDate: { type: String, required: true },
  employmentType: { type: String, default: 'FULL_TIME' },
  benefits: { type: String, default: '[]' },
  status: { type: String, default: 'DRAFT' }, // DRAFT, SENT, ACCEPTED, REJECTED
  createdAt: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// 20. InterviewFeedback Schema
const InterviewFeedbackSchema = new mongoose.Schema({
  _id: uuidField,
  interviewId: { type: String, required: true, unique: true },
  technicalScore: { type: Number, default: 0 },
  problemSolvingScore: { type: Number, default: 0 },
  projectUnderstandingScore: { type: Number, default: 0 },
  communicationScore: { type: Number, default: 0 },
  comments: { type: String, default: '' },
  recommendation: { type: String, default: 'HOLD' }, // RECOMMEND_HIRE, HOLD, REJECT
  createdAt: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// 21. AuditLog Schema
const AuditLogSchema = new mongoose.Schema({
  _id: uuidField,
  userId: { type: String, required: true },
  action: { type: String, required: true }, // ANALYZE_JOB, APPLY_JOB, EVALUATE_INTERVIEW, ACCEPT_OFFER, etc.
  details: { type: String, default: '' },
  status: { type: String, default: 'SUCCESS' }, // SUCCESS, FAILURE
  createdAt: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// 22. Notification Schema
const NotificationSchema = new mongoose.Schema({
  _id: uuidField,
  userId: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'EMAIL' }, // EMAIL, SYSTEM
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Add custom index virtual alias for Mongoose _id mapping
const configureVirtualId = (schema) => {
  schema.virtual('id').get(function() {
    return this._id;
  });
};

[
  UserSchema, JobSchema, JobAnalysisSchema, JobSkillSchema, ApplicationSchema,
  ResumeSchema, ResumeAnalysisSchema, SkillEvidenceSchema, ReadinessAnalysisSchema,
  MatchAnalysisSchema, SkillGapSchema, AssessmentSchema, QuestionSchema, TestCaseSchema,
  SubmissionSchema, QuestionSubmissionSchema, RoadmapSchema, RoadmapTaskSchema,
  OfferSchema, InterviewFeedbackSchema, AuditLogSchema, NotificationSchema
].forEach(configureVirtualId);

// Export compiled models
module.exports = {
  User: mongoose.model('User', UserSchema),
  Job: mongoose.model('Job', JobSchema),
  JobAnalysis: mongoose.model('JobAnalysis', JobAnalysisSchema),
  JobSkill: mongoose.model('JobSkill', JobSkillSchema),
  Application: mongoose.model('Application', ApplicationSchema),
  Resume: mongoose.model('Resume', ResumeSchema),
  ResumeAnalysis: mongoose.model('ResumeAnalysis', ResumeAnalysisSchema),
  SkillEvidence: mongoose.model('SkillEvidence', SkillEvidenceSchema),
  ReadinessAnalysis: mongoose.model('ReadinessAnalysis', ReadinessAnalysisSchema),
  MatchAnalysis: mongoose.model('MatchAnalysis', MatchAnalysisSchema),
  SkillGap: mongoose.model('SkillGap', SkillGapSchema),
  Assessment: mongoose.model('Assessment', AssessmentSchema),
  Question: mongoose.model('Question', QuestionSchema),
  TestCase: mongoose.model('TestCase', TestCaseSchema),
  Submission: mongoose.model('Submission', SubmissionSchema),
  QuestionSubmission: mongoose.model('QuestionSubmission', QuestionSubmissionSchema),
  Roadmap: mongoose.model('Roadmap', RoadmapSchema),
  RoadmapTask: mongoose.model('RoadmapTask', RoadmapTaskSchema),
  Offer: mongoose.model('Offer', OfferSchema),
  InterviewFeedback: mongoose.model('InterviewFeedback', InterviewFeedbackSchema),
  AuditLog: mongoose.model('AuditLog', AuditLogSchema),
  Notification: mongoose.model('Notification', NotificationSchema)
};
