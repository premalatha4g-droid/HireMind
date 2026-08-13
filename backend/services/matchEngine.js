const db = require('../models');

// Skill aliases matching rule
const SKILL_ALIASES = {
  "js": "javascript",
  "javascript": "javascript",
  "reactjs": "react",
  "react.js": "react",
  "react": "react",
  "ts": "typescript",
  "typescript": "typescript",
  "postgres": "postgresql",
  "postgresql": "postgresql",
  "aws": "aws",
  "amazon web services": "aws",
  "spring": "spring boot",
  "spring boot": "spring boot",
  "node.js": "nodejs",
  "nodejs": "nodejs",
  "node": "nodejs",
  "vuejs": "vue",
  "vue.js": "vue",
  "vue": "vue",
  "docker container": "docker",
  "docker": "docker",
  "kubernetes": "k8s",
  "k8s": "k8s"
};

const normalizeSkill = (skill) => {
  if (!skill) return "";
  const clean = skill.trim().toLowerCase().replace(/[.\-\s]+/g, " ");
  return SKILL_ALIASES[clean] || clean;
};

const getDegreeLevel = (degreeString) => {
  if (!degreeString) return 0;
  const d = degreeString.toLowerCase();
  if (d.includes("phd") || d.includes("doctor") || d.includes("doctorate")) return 3;
  if (d.includes("ms") || d.includes("master") || d.includes("mtech") || d.includes("msc")) return 2;
  if (d.includes("bs") || d.includes("bachelor") || d.includes("btech") || d.includes("be") || d.includes("bsc") || d.includes("undergraduate")) return 1;
  return 0;
};

const determineSkillConfidence = (list) => {
  if (!list || list.length === 0) return "NONE";

  const overrideEv = list.find(e => e.verificationStatus === "OVERRIDDEN" && e.overrideConfidence);
  if (overrideEv) {
    return overrideEv.overrideConfidence;
  }

  const needsVerification = list.some(e => e.verificationStatus === "NEEDS_VERIFICATION");
  const hasCert = list.some(e => e.source === "CERTIFICATION");
  const hasHighAss = list.some(e => {
    if (e.source !== "ASSESSMENT") return false;
    const match = (e.details || "").match(/(\d+)%/);
    if (match) {
      const score = parseInt(match[1]);
      return score >= 80;
    }
    return false;
  });

  const verifiedCount = list.filter(e => e.source !== "RESUME").length;

  if (verifiedCount >= 2 || hasHighAss || hasCert) {
    return needsVerification ? "MEDIUM" : "HIGH";
  }
  if (verifiedCount === 1) return "MEDIUM";
  return "LOW";
};

const calculateMatch = async (applicationId) => {
  const application = await db.Application.findById(applicationId);
  if (!application) throw new Error("Application record not found.");

  const job = await db.Job.findById(application.jobId);
  if (!job) throw new Error("Job listing not found.");

  const resume = await db.Resume.findOne({ candidateId: application.candidateId });
  if (!resume) throw new Error("Resume record not found.");

  const resumeAnalysis = await db.ResumeAnalysis.findOne({ resumeId: resume._id });
  if (!resumeAnalysis) throw new Error("Resume analysis not found.");

  // 1. Gather Candidate Skills
  let candidateSkills = [];
  try {
    const skillsObj = JSON.parse(resumeAnalysis.skills || '{}');
    Object.values(skillsObj).forEach(val => {
      if (Array.isArray(val)) {
        candidateSkills = candidateSkills.concat(val);
      }
    });
  } catch (e) {}

  // 2. Gather Job Required and Preferred Skills
  const jobSkills = await db.JobSkill.find({ jobId: job._id });
  const requiredSkills = [];
  const preferredSkills = [];
  jobSkills.forEach(js => {
    if (js.isRequired) {
      requiredSkills.push(js.skillName);
    } else {
      preferredSkills.push(js.skillName);
    }
  });

  // 3. Compute Skills Score
  const normalizedRequired = new Set();
  requiredSkills.forEach(s => {
    const norm = normalizeSkill(s);
    if (norm) normalizedRequired.add(norm);
  });

  const normalizedCandidate = new Set();
  candidateSkills.forEach(s => {
    const norm = normalizeSkill(s);
    if (norm) normalizedCandidate.add(norm);
  });

  const matchedRequired = [];
  const missingRequired = [];
  normalizedRequired.forEach(reqSkill => {
    if (normalizedCandidate.has(reqSkill)) {
      matchedRequired.push(reqSkill);
    } else {
      missingRequired.push(reqSkill);
    }
  });

  const normalizedPreferred = new Set();
  preferredSkills.forEach(s => {
    const norm = normalizeSkill(s);
    if (norm) normalizedPreferred.add(norm);
  });

  const matchedPreferred = [];
  normalizedPreferred.forEach(prefSkill => {
    if (normalizedCandidate.has(prefSkill)) {
      matchedPreferred.push(prefSkill);
    }
  });

  let skillsScore = normalizedRequired.size === 0 ? 100 : Math.round((matchedRequired.length / normalizedRequired.size) * 100);
  skillsScore = Math.max(0, Math.min(100, skillsScore));

  // 4. Compute Experience Score
  let candidateExperience = 0.0;
  try {
    const expArray = JSON.parse(resumeAnalysis.experience || '[]');
    let totalMonths = 0;
    if (Array.isArray(expArray)) {
      expArray.forEach(exp => {
        const durationStr = (exp.duration || "").toLowerCase();
        if (durationStr) {
          const match = durationStr.match(/(\d+(\.\d+)?)/);
          if (match) {
            const num = parseFloat(match[1]);
            if (durationStr.includes("year")) {
              totalMonths += Math.round(num * 12);
            } else if (durationStr.includes("month")) {
              totalMonths += Math.round(num);
            }
          }
        }
      });
    }
    candidateExperience = Math.round((totalMonths / 12.0) * 10) / 10;
  } catch (e) {}

  const requiredExperience = job.experienceYears || 0.0;
  const experienceScore = requiredExperience <= 0.0 ? 100 : Math.round(Math.min(1.0, candidateExperience / requiredExperience) * 100);

  // 5. Compute Projects Score
  const matchedProjectsList = [];
  const missingProjectTechs = [];
  let projectsScore = 100;
  try {
    const projectsArray = JSON.parse(resumeAnalysis.projects || '[]');
    const matchedTechs = new Set();

    normalizedRequired.forEach(reqSkill => {
      let hasProof = false;
      if (Array.isArray(projectsArray)) {
        projectsArray.forEach(p => {
          const techs = p.technologies || [];
          const pTechs = Array.isArray(techs) ? techs.map(t => normalizeSkill(t)) : [];
          if (pTechs.includes(reqSkill)) {
            hasProof = true;
            let projMatch = matchedProjectsList.find(item => item.projectName === p.projectName);
            if (!projMatch) {
              projMatch = { projectName: p.projectName, matchedTechs: [] };
              matchedProjectsList.push(projMatch);
            }
            if (!projMatch.matchedTechs.includes(reqSkill)) {
              projMatch.matchedTechs.push(reqSkill);
            }
          }
        });
      }
      if (hasProof) {
        matchedTechs.add(reqSkill);
      } else {
        missingProjectTechs.push(reqSkill);
      }
    });
    projectsScore = normalizedRequired.size === 0 ? 100 : Math.round((matchedTechs.size / normalizedRequired.size) * 100);
  } catch (e) {}

  // 6. Compute Education Score
  let educationScore = 100;
  let educationMatch = "MATCHED";
  const eduReq = job.education || "";
  if (eduReq && !eduReq.toLowerCase().includes("any")) {
    const reqLvl = getDegreeLevel(eduReq);
    let highestLvl = 0;
    try {
      const eduArray = JSON.parse(resumeAnalysis.education || '[]');
      if (Array.isArray(eduArray)) {
        eduArray.forEach(edu => {
          const lvl = getDegreeLevel((edu.degree || "") + " " + (edu.fieldOfStudy || ""));
          if (lvl > highestLvl) highestLvl = lvl;
        });
      }
    } catch (e) {}

    if (highestLvl >= reqLvl) {
      educationScore = 100;
      educationMatch = "MATCHED";
    } else if (highestLvl > 0) {
      educationScore = 50;
      educationMatch = "PARTIAL";
    } else {
      educationScore = 0;
      educationMatch = "MISSING";
    }
  }

  // 7. Compute Certifications Score
  const matchedCerts = [];
  const missingCerts = [];
  let certificationsScore = 100;
  const certReqStr = job.certifications || "";
  if (certReqStr) {
    const requiredCerts = certReqStr.split(",").map(c => c.trim()).filter(Boolean);
    let candCerts = [];
    try {
      const certsArray = JSON.parse(resumeAnalysis.certifications || '[]');
      if (Array.isArray(certsArray)) {
        candCerts = certsArray.map(c => ((c.certificationName || "") + " " + (c.name || "")).toLowerCase().trim());
      }
    } catch (e) {}

    requiredCerts.forEach(reqCert => {
      const cleanReq = reqCert.toLowerCase();
      const found = candCerts.some(c => c.includes(cleanReq) || cleanReq.includes(c));
      if (found) {
        matchedCerts.push(reqCert);
      } else {
        missingCerts.push(reqCert);
      }
    });
    certificationsScore = requiredCerts.length === 0 ? 100 : Math.round((matchedCerts.length / requiredCerts.length) * 100);
  }

  // 8. Compute Overall Match Score
  let overallScore = Math.round(
    (skillsScore * 0.40) +
    (experienceScore * 0.25) +
    (projectsScore * 0.20) +
    (educationScore * 0.10) +
    (certificationsScore * 0.05)
  );
  overallScore = Math.max(0, Math.min(100, overallScore));

  const scoreExplanation = `Match analysis computed: Overall alignment is ${overallScore}%. `
    + `Skills match is ${skillsScore}% with ${matchedRequired.length} of ${normalizedRequired.size} required capabilities. `
    + `Professional experience matches at ${experienceScore}% (Candidate: ${candidateExperience} years, Required: ${requiredExperience} years). `
    + `Practical project proof matches at ${projectsScore}%.`;

  // Find or create MatchAnalysis
  let match = await db.MatchAnalysis.findOne({ applicationId });
  if (!match) {
    match = new db.MatchAnalysis({ applicationId });
  } else {
    await db.SkillGap.deleteMany({ matchAnalysisId: match._id });
  }

  match.overallScore = overallScore;
  match.skillsScore = skillsScore;
  match.experienceScore = experienceScore;
  match.projectsScore = projectsScore;
  match.educationScore = educationScore;
  match.certificationsScore = certificationsScore;
  match.matchedRequiredSkills = JSON.stringify(matchedRequired);
  match.missingRequiredSkills = JSON.stringify(missingRequired);
  match.matchedPreferredSkills = JSON.stringify(matchedPreferred);
  match.candidateExperience = candidateExperience;
  match.requiredExperience = requiredExperience;
  match.matchedProjects = JSON.stringify(matchedProjectsList);
  match.missingProjectTechnologies = JSON.stringify(missingProjectTechs);
  match.educationMatch = educationMatch;
  match.matchedCertifications = JSON.stringify(matchedCerts);
  match.missingCertifications = JSON.stringify(missingCerts);
  match.scoreExplanation = scoreExplanation;
  match.calculatedAt = new Date();

  const savedMatch = await match.save();

  // Populate SkillGaps
  for (const s of missingRequired) {
    const gap = new db.SkillGap({
      matchAnalysisId: savedMatch._id,
      skillName: s,
      importance: "REQUIRED",
      currentEvidence: "MISSING",
      targetRequirement: "Job required skill",
      gapSeverity: "HIGH",
      recommendation: "Take technical learning roadmap module for " + s
    });
    await gap.save();
  }

  // Calculate Readiness
  await calculateReadiness(applicationId);
  application.matchScore = overallScore;
  await application.save();

  return savedMatch;
};

const calculateReadiness = async (applicationId) => {
  const application = await db.Application.findById(applicationId);
  if (!application) throw new Error("Application not found.");

  const candidate = await db.User.findById(application.candidateId);
  if (!candidate) throw new Error("Candidate not found.");

  const job = await db.Job.findById(application.jobId);
  if (!job) throw new Error("Job not found.");

  const resume = await db.Resume.findOne({ candidateId: candidate._id });

  // 1. Profile Completeness Score
  let resumePoints = resume ? 25 : 0;
  let expPoints = 0;
  let projPoints = 0;
  let eduPoints = 0;

  if (resume) {
    const analysis = await db.ResumeAnalysis.findOne({ resumeId: resume._id });
    if (analysis) {
      try {
        if (JSON.parse(analysis.experience || '[]').length > 0) expPoints = 25;
        if (JSON.parse(analysis.projects || '[]').length > 0) projPoints = 25;
        if (JSON.parse(analysis.education || '[]').length > 0) eduPoints = 25;
      } catch (e) {}
    }
  }
  const profileCompleteness = resumePoints + expPoints + projPoints + eduPoints;

  // Query Candidate's Skill Evidence
  const skillEvidenceList = await db.SkillEvidence.find({ candidateId: candidate._id });
  const jobSkills = await db.JobSkill.find({ jobId: job._id });
  const requiredSkills = jobSkills.filter(js => js.isRequired).map(js => js.skillName);

  // Group evidence
  const evidenceMap = {};
  skillEvidenceList.forEach(se => {
    const norm = normalizeSkill(se.skillName);
    if (!evidenceMap[norm]) evidenceMap[norm] = [];
    evidenceMap[norm].push(se);
  });

  // 2. Skill Evidence Score
  let verifiedSkillsCount = 0;
  requiredSkills.forEach(reqSkill => {
    const norm = normalizeSkill(reqSkill);
    const list = evidenceMap[norm] || [];
    const confidence = determineSkillConfidence(list);
    if (confidence === "HIGH" || confidence === "MEDIUM") {
      verifiedSkillsCount++;
    }
  });
  const skillsEvidenceScore = requiredSkills.length === 0 ? 100 : Math.round((verifiedSkillsCount / requiredSkills.length) * 100);

  // 3. Technical Assessment Score
  let assessmentScore = 100;
  const submissions = await db.Submission.find({ candidateId: candidate._id });
  if (submissions.length > 0) {
    let sum = 0;
    submissions.forEach(s => sum += s.score);
    assessmentScore = Math.round(sum / submissions.length);
  } else {
    const assessmentEvs = skillEvidenceList.filter(se => se.source === "ASSESSMENT");
    if (assessmentEvs.length > 0) {
      let scoreSum = 0;
      let scoreCount = 0;
      assessmentEvs.forEach(ev => {
        const match = (ev.details || "").match(/(\d+)%/);
        if (match) {
          scoreSum += parseInt(match[1]);
          scoreCount++;
        }
      });
      assessmentScore = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0;
    } else {
      const totalAssessments = await db.Assessment.countDocuments();
      assessmentScore = totalAssessments > 0 ? 0 : 100;
    }
  }

  // 4. Project Evidence Score
  let projectVerifiedCount = 0;
  requiredSkills.forEach(reqSkill => {
    const norm = normalizeSkill(reqSkill);
    const list = evidenceMap[norm] || [];
    const hasProj = list.some(ev => ev.source === "PROJECT" && ev.verificationStatus !== "NEEDS_VERIFICATION");
    if (hasProj) projectVerifiedCount++;
  });
  const projectEvidenceScore = requiredSkills.length === 0 ? 100 : Math.round((projectVerifiedCount / requiredSkills.length) * 100);

  // 5. Interview Evidence Score
  let interviewScore = 100;
  const appFeedbacks = await db.InterviewFeedback.find(); // Replicating basic calculation
  if (appFeedbacks.length > 0) {
    let scoreSum = 0.0;
    appFeedbacks.forEach(f => {
      const avg = (f.technicalScore + f.problemSolvingScore + f.projectUnderstandingScore + f.communicationScore) / 4.0;
      scoreSum += (avg / 10.0) * 100;
    });
    interviewScore = Math.round(scoreSum / appFeedbacks.length);
  }

  // 6. Overall Readiness Score
  let readinessScore = Math.round(
    (skillsEvidenceScore * 0.35) +
    (assessmentScore * 0.25) +
    (projectEvidenceScore * 0.20) +
    (interviewScore * 0.10) +
    (profileCompleteness * 0.10)
  );
  readinessScore = Math.max(0, Math.min(100, readinessScore));

  // 7. Evidence Conflict Detection
  const evidenceConflicts = [];
  requiredSkills.forEach(reqSkill => {
    const norm = normalizeSkill(reqSkill);
    const list = evidenceMap[norm] || [];
    const hasResume = list.some(e => e.source === "RESUME");
    const hasOthers = list.some(e => e.source !== "RESUME");
    if (hasResume && !hasOthers) {
      evidenceConflicts.push({
        type: "UNSUPPORTED_CLAIM",
        skillName: reqSkill,
        severity: "MEDIUM",
        message: `Candidate claims required skill "${reqSkill}" in resume, but lacks verified project, certification, assessment, or interview evidence.`
      });
    }
  });

  let readiness = await db.ReadinessAnalysis.findOne({ applicationId });
  if (!readiness) {
    readiness = new db.ReadinessAnalysis({ applicationId });
  }

  readiness.readinessScore = readinessScore;
  readiness.skillsEvidenceScore = skillsEvidenceScore;
  readiness.assessmentScore = assessmentScore;
  readiness.projectEvidenceScore = projectEvidenceScore;
  readiness.interviewScore = interviewScore;
  readiness.profileCompleteness = profileCompleteness;
  readiness.evidenceConflicts = JSON.stringify(evidenceConflicts);
  readiness.calculatedAt = new Date();

  await readiness.save();

  // Update application
  application.readinessScore = readinessScore;
  await application.save();

  return readiness;
};

module.exports = {
  calculateMatch,
  calculateReadiness
};
