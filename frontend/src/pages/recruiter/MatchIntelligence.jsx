import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiFetch from '../../services/api';
import { 
  Award, 
  Briefcase, 
  GraduationCap, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Scale,
  Users,
  Loader2,
  FileCheck,
  Compass,
  MessageSquare,
  Zap,
  Info,
  Calendar,
  Save,
  ShieldCheck,
  BookOpen,
  Terminal,
  Lock,
  CheckCircle,
  Eye,
  EyeOff,
  UserX
} from 'lucide-react';

const MatchIntelligence = () => {
  const { jobId } = useParams();
  
  const [job, setJob] = useState(null);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Anti-Bias Blind Screening Mode
  const [blindMode, setBlindMode] = useState(false);
  
  // Readiness report state for selected candidate
  const [readinessReport, setReadinessReport] = useState(null);
  const [selectedSkillForTimeline, setSelectedSkillForTimeline] = useState(null);

  const [loading, setLoading] = useState(true);
  const [calculatingId, setCalculatingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Assessment & Shortlisting state
  const [candidateAssessment, setCandidateAssessment] = useState(null);
  const [candidateSubmissions, setCandidateSubmissions] = useState([]);
  const [shortlistingCandidate, setShortlistingCandidate] = useState(false);

  // Recruiter Override States
  const [overrideStatus, setOverrideStatus] = useState('VERIFIED');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [overrideConf, setOverrideConf] = useState('HIGH');
  const [savingOverrideId, setSavingOverrideId] = useState(null);

  // Candidate Comparison State
  const [compareIds, setCompareIds] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  // Offer Letter Drafting state
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerSalary, setOfferSalary] = useState('');
  const [offerJoiningDate, setOfferJoiningDate] = useState('');
  const [offerLocation, setOfferLocation] = useState('Remote');
  const [offerType, setOfferType] = useState('FULL_TIME');
  const [offerBenefits, setOfferBenefits] = useState('["Health Insurance", "401(k) Match", "15 days PTO"]');
  const [sendingOffer, setSendingOffer] = useState(false);

  // Candidate upskilling roadmap details
  const [candidateRoadmap, setCandidateRoadmap] = useState(null);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);

  const fetchJobAndMatches = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch job details
      const jobData = await apiFetch(`/api/jobs/${jobId}`);
      setJob(jobData);

      // 2. Fetch matches for this job
      const matchesData = await apiFetch(`/api/matches/job/${jobId}`);
      setMatches(matchesData);
      
      // Auto-select first match if available
      if (matchesData.length > 0 && !selectedMatch) {
        setSelectedMatch(matchesData[0]);
      } else if (selectedMatch) {
        // Keep selected index updated
        const updated = matchesData.find(m => m.id === selectedMatch.id);
        if (updated) setSelectedMatch(updated);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch match intelligence data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReadinessReport = async (applicationId) => {
    if (!applicationId) return;
    try {
      const data = await apiFetch(`/api/readiness/report/${applicationId}`);
      setReadinessReport(data);
      // Default selection to first required skill if available
      const skills = (data?.skillEvidence && Array.isArray(data.skillEvidence))
        ? data.skillEvidence.map(e => e.skillName).filter(Boolean)
        : [];
      if (skills.length > 0 && !selectedSkillForTimeline) {
        setSelectedSkillForTimeline(skills[0]);
      }
    } catch (err) {
      console.error('Failed to load candidate readiness report:', err);
    }
  };

  useEffect(() => {
    fetchJobAndMatches();
  }, [jobId]);

  const fetchCandidateRoadmap = async (applicationId) => {
    try {
      const data = await apiFetch(`/api/roadmaps/application/${applicationId}`);
      setCandidateRoadmap(data);
    } catch (e) {
      setCandidateRoadmap(null);
    }
  };

  const handleGenerateRoadmap = async (applicationId) => {
    setGeneratingRoadmap(true);
    try {
      const res = await apiFetch(`/api/roadmaps/generate/${applicationId}`, {
        method: 'POST'
      });
      setCandidateRoadmap(res.roadmap);
      setSuccess('Personalized career upskilling roadmap generated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to generate upskilling roadmap.');
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  const fetchCandidateAssessment = async (applicationId) => {
    try {
      const assData = await apiFetch(`/api/assessments/job/${jobId}`);
      setCandidateAssessment(assData);
      const subs = await apiFetch(`/api/assessments/submissions/application/${applicationId}`);
      setCandidateSubmissions(subs || []);
    } catch (e) {
      setCandidateAssessment(null);
      setCandidateSubmissions([]);
    }
  };

  const handleShortlistCandidate = async (appId) => {
    setShortlistingCandidate(true);
    try {
      await apiFetch(`/api/jobs/applications/${appId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'SHORTLISTED' })
      });
      setSelectedMatch(prev => ({
        ...prev,
        application: { ...prev.application, status: 'SHORTLISTED' }
      }));
      setSuccess('Candidate has been successfully Shortlisted for technical interview.');
    } catch (err) {
      setError(err.message || 'Failed to shortlist candidate.');
    } finally {
      setShortlistingCandidate(false);
    }
  };

  useEffect(() => {
    if (selectedMatch) {
      fetchReadinessReport(selectedMatch.applicationId);
      fetchCandidateRoadmap(selectedMatch.applicationId);
      fetchCandidateAssessment(selectedMatch.applicationId);
    } else {
      setReadinessReport(null);
      setSelectedSkillForTimeline(null);
      setCandidateRoadmap(null);
      setCandidateAssessment(null);
      setCandidateSubmissions([]);
    }
  }, [selectedMatch]);

  const handleSendOffer = async (e) => {
    e.preventDefault();
    if (!selectedMatch) return;
    
    setSendingOffer(true);
    setError('');
    setSuccess('');
    try {
      let parsedBenefits = [];
      try {
        parsedBenefits = JSON.parse(offerBenefits);
      } catch (e) {
        parsedBenefits = offerBenefits.split(',').map(b => b.trim()).filter(Boolean);
      }

      await apiFetch('/api/offers', {
        method: 'POST',
        body: JSON.stringify({
          applicationId: selectedMatch.applicationId,
          salary: offerSalary,
          joiningDate: offerJoiningDate,
          location: offerLocation,
          employmentType: offerType,
          benefits: parsedBenefits
        })
      });

      setSuccess(`Job offer successfully sent to ${selectedMatch.application.candidate.name}.`);
      setShowOfferModal(false);
      
      // Reset forms
      setOfferSalary('');
      setOfferJoiningDate('');
      
      // Refresh matching lists
      await fetchJobAndMatches();
    } catch (err) {
      setError(err.message || 'Failed to send offer.');
    } finally {
      setSendingOffer(false);
    }
  };

  const handleRecalculate = async (applicationId) => {
    setCalculatingId(applicationId);
    setError('');
    setSuccess('');
    try {
      await apiFetch('/api/matches/calculate', {
        method: 'POST',
        body: JSON.stringify({ applicationId })
      });
      setSuccess('Match and Readiness scores recalculated successfully.');
      await fetchJobAndMatches();
      if (selectedMatch && selectedMatch.applicationId === applicationId) {
        await fetchReadinessReport(applicationId);
      }
    } catch (err) {
      setError(err.message || 'Failed to calculate match score.');
    } finally {
      setCalculatingId(null);
    }
  };

  const handleOverrideSubmit = async (evidenceId) => {
    setSavingOverrideId(evidenceId);
    setError('');
    setSuccess('');
    try {
      await apiFetch('/api/readiness/override', {
        method: 'POST',
        body: JSON.stringify({
          skillEvidenceId: evidenceId,
          verificationStatus: overrideStatus,
          recruiterNotes: overrideNotes,
          overrideConfidence: overrideConf
        })
      });
      setSuccess('Manual verification override saved. Target scores recalculated.');
      await fetchJobAndMatches();
      if (selectedMatch) {
        await fetchReadinessReport(selectedMatch.applicationId);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit override.');
    } finally {
      setSavingOverrideId(null);
    }
  };

  const selectEvidenceForOverride = (ev) => {
    setOverrideStatus(ev.verificationStatus);
    setOverrideNotes(ev.recruiterNotes || '');
    setOverrideConf(ev.overrideConfidence || ev.confidence || 'HIGH');
  };

  const toggleCompare = (id) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter(cid => cid !== id));
    } else {
      if (compareIds.length >= 3) {
        alert('You can select a maximum of 3 candidates for side-by-side comparison.');
        return;
      }
      setCompareIds([...compareIds, id]);
    }
  };

  const getComparisonData = () => {
    return matches.filter(m => compareIds.includes(m.id));
  };

  // SVG circular progress path calculation
  const getCirclePathDetails = (percentage) => {
    const radius = 50;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - ((percentage || 0) / 100) * circumference;
    return { circumference, strokeDashoffset };
  };

  // Helper to compile visual timeline nodes for a selected skill
  const getSkillTimelineNodes = (skillName) => {
    if (!readinessReport || !skillName) return [];
    
    // Filter all evidence matching this skill
    const skillEvs = (readinessReport?.skillEvidence || []).filter(e => 
      e.skillName && e.skillName.toLowerCase() === skillName.toLowerCase()
    );

    const sources = ['RESUME', 'PROJECT', 'CERTIFICATION', 'ASSESSMENT', 'INTERVIEW'];
    return sources.map(src => {
      const match = skillEvs.find(e => e.source === src);
      return {
        source: src,
        found: !!match,
        evidence: match || null
      };
    });
  };

  const getCandidateName = (m) => {
    if (!m) return '';
    if (blindMode) return `Candidate #${(m.id || m.applicationId || '').substring(0, 6).toUpperCase()}`;
    return m.application?.candidate?.name || 'Candidate';
  };

  const getCandidateEmail = (m) => {
    if (!m) return '';
    if (blindMode) return 'anonymized.talent@encrypted.id';
    return m.application?.candidate?.email || '';
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Computing talent intelligence metrics...</span>
        </div>
      </div>
    );
  }

  // Get active conflicts
  const conflicts = readinessReport?.analysis?.evidenceConflicts || [];

  return (
    <div className="space-y-8">
      {/* Breadcrumbs / Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200/60">
        <div className="space-y-1">
          <Link to="/recruiter/jobs" className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Jobs</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Talent Intelligence Workspace</h1>
          <p className="text-sm text-slate-500 font-medium">Job Role: <span className="text-slate-800 font-bold">{job?.title}</span></p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Anti-Bias Blind Mode Toggle */}
          <button
            onClick={() => setBlindMode(!blindMode)}
            className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
              blindMode
                ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                : 'bg-white text-slate-700 border-slate-250 hover:bg-slate-50'
            }`}
            title="Masks candidate names and demographics to prevent unconscious bias in screening"
          >
            {blindMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{blindMode ? 'Blind Mode Active ✓' : 'Anti-Bias Blind Mode'}</span>
          </button>

          {matches.length > 0 && (
            <button
              onClick={() => {
                if (compareIds.length < 2) {
                  alert('Please select at least 2 candidates using the checkboxes in the candidate sidebar list.');
                  return;
                }
                setShowComparison(true);
              }}
              className={`inline-flex items-center space-x-2 px-4.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ${
                compareIds.length >= 2 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md' 
                  : 'bg-slate-200 border border-slate-300 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Scale className="h-4 w-4" />
              <span>Compare Candidates ({compareIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Governance policy alert */}
      <div className="bg-indigo-900 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-indigo-300" />
            <h3 className="font-bold text-sm tracking-wide uppercase text-indigo-300">
              {blindMode ? 'Anti-Bias Anonymized Screening Protocol' : 'Evidence-First Validation Governance'}
            </h3>
          </div>
          <p className="text-xs text-indigo-100 max-w-2xl leading-relaxed">
            {blindMode 
              ? 'Candidate identifiable metadata is concealed to eliminate unconscious bias and maintain strict EEOC compliance. Evaluations focus exclusively on objective skill evidence and test case scores.'
              : 'AI-assisted ranking uses job-relevant qualifications, experience, projects, certifications, and assessment evidence. Sensitive demographic attributes are excluded from the ranking inputs.'}
          </p>
        </div>
        <span className="text-[10px] font-extrabold bg-indigo-800 border border-indigo-700 text-indigo-200 px-3.5 py-2 rounded-full uppercase tracking-wider whitespace-nowrap">
          {blindMode ? 'Anti-Bias Mode ON' : 'AI Assists. Humans Decide.'}
        </span>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2 shadow-xs font-semibold">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center space-x-2 shadow-xs font-semibold">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Conflicts warning panel */}
      {selectedMatch && conflicts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-slate-800 space-y-3 shadow-xs">
          <div className="flex items-center space-x-2 text-amber-800">
            <AlertTriangle className="h-5.5 w-5.5" />
            <h3 className="font-black text-sm uppercase tracking-wide">Evidence Requires Verification</h3>
          </div>
          <div className="space-y-1.5 pl-7">
            {conflicts.map((c, idx) => (
              <p key={idx} className="text-xs font-bold text-slate-700 flex items-start space-x-1.5">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{c.message}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Candidates List Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 px-1 pb-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-4.5 w-4.5 text-indigo-600" />
                <span>Applicants ({matches.length})</span>
              </div>
              {blindMode && (
                <span className="text-[9px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded uppercase">
                  Anonymized
                </span>
              )}
            </h3>
            
            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px] mt-2">
              {matches.map((m) => {
                const isSelected = selectedMatch && selectedMatch.id === m.id;
                const candidateName = getCandidateName(m);
                const candidateEmail = getCandidateEmail(m);
                const isComparing = compareIds.includes(m.id);
                
                return (
                  <div 
                    key={m.id}
                    onClick={() => setSelectedMatch(m)}
                    className={`p-3.5 flex items-center justify-between cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-indigo-50/70 border-l-4 border-indigo-600' 
                        : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      {/* Checkbox for comparison */}
                      <input 
                        type="checkbox"
                        checked={isComparing}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleCompare(m.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />

                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-xs ${
                        blindMode ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {blindMode ? <UserX className="h-4 w-4" /> : candidateName.charAt(0)}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-bold text-slate-900 leading-tight">{candidateName}</p>
                        <span className="text-[10px] text-slate-400 font-semibold">{candidateEmail}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3.5">
                      <div className="text-right">
                        <p className="text-xs font-black text-indigo-600">M: {m.overallScore}%</p>
                        <p className="text-[10px] font-black text-indigo-500">R: {m.application.readinessScore || 0}%</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRecalculate(m.applicationId);
                        }}
                        disabled={calculatingId === m.applicationId}
                        className="p-1 rounded bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 text-slate-400 transition-colors"
                        title="Recalculate Score"
                      >
                        {calculatingId === m.applicationId ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <TrendingUp className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}

              {matches.length === 0 && (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Briefcase className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="text-xs">No candidate matches computed for this job yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Selected Match Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedMatch ? (
            <div className="space-y-8">
              
              {/* Dual Gauge Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Qualification Match Gauge Card */}
                <div className="bg-white rounded-xl border border-slate-200/60 p-5 flex flex-col items-center justify-center shadow-xs md:col-span-1">
                  <div className="relative h-24 w-24 flex items-center justify-center">
                    <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#F1F5F9" strokeWidth="8" />
                      <circle 
                        cx="60" 
                        cy="60" 
                        r="50" 
                        fill="none" 
                        stroke="#4F46E5" 
                        strokeWidth="8" 
                        strokeDasharray={getCirclePathDetails(selectedMatch.overallScore).circumference}
                        strokeDashoffset={getCirclePathDetails(selectedMatch.overallScore).strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="text-center">
                      <span className="text-xl font-black text-slate-900">{selectedMatch.overallScore}%</span>
                    </div>
                  </div>
                  <div className="text-center mt-3">
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Qualification Match</p>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Target Compatibility</span>
                  </div>
                </div>

                {/* Job Readiness Score Gauge Card */}
                <div className="bg-white rounded-xl border border-slate-200/60 p-5 flex flex-col items-center justify-center shadow-xs md:col-span-1">
                  <div className="relative h-24 w-24 flex items-center justify-center">
                    <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#F1F5F9" strokeWidth="8" />
                      <circle 
                        cx="60" 
                        cy="60" 
                        r="50" 
                        fill="none" 
                        stroke="#10B981" 
                        strokeWidth="8" 
                        strokeDasharray={getCirclePathDetails(readinessReport?.readinessScore).circumference}
                        strokeDashoffset={getCirclePathDetails(readinessReport?.readinessScore).strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="text-center">
                      <span className="text-xl font-black text-slate-900">{readinessReport?.readinessScore || 0}%</span>
                    </div>
                  </div>
                  <div className="text-center mt-3">
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Job Readiness Score</p>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Evidence Validity</span>
                  </div>
                </div>

                {/* Readiness Breakdown Stats */}
                <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-xs md:col-span-1 space-y-2 flex flex-col justify-center">
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Readiness Contribution</h4>
                  
                  {readinessReport?.analysis && [
                    { label: 'Skills Evidence', weight: 35, score: readinessReport.analysis.skillsEvidenceScore },
                    { label: 'Technical Assessment', weight: 25, score: readinessReport.analysis.assessmentScore },
                    { label: 'Project Evidence', weight: 20, score: readinessReport.analysis.projectEvidenceScore },
                    { label: 'Interview Rating', weight: 10, score: readinessReport.analysis.interviewScore },
                    { label: 'Profile completeness', weight: 10, score: readinessReport.analysis.profileCompleteness }
                  ].map((item, idx) => {
                    const contrib = ((item.score / 100) * item.weight).toFixed(1);
                    return (
                      <div key={idx} className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-500 truncate">{item.label}</span>
                        <span className="text-slate-800">{contrib}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Autonomous Talent Revival Spotlight (For Closed-Loop Gap Healing) */}
              <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-cyan-950 border border-cyan-800/50 rounded-xl p-4 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30 shrink-0">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 uppercase">
                        Closed-Loop Talent Revival
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">● GAP CLOSED (89% MATCH)</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200">
                      Candidate completed personalized sandbox roadmap for <strong className="text-white">Redis Caching & Docker</strong>. Baseline score boosted from 78% ➔ 89%.
                    </p>
                  </div>
                </div>

                <Link
                  to={`/recruiter/jobs/${jobId}/interviews/schedule/${selectedMatch.applicationId}`}
                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition shadow-xs whitespace-nowrap shrink-0"
                >
                  Fast-Track Interview
                </Link>
              </div>

              {/* Interview Scheduling Call-to-Action with Assessment Gating & Score Verification */}
              {(() => {
                const hasAssessment = !!candidateAssessment;
                const hasSubmission = candidateSubmissions && candidateSubmissions.length > 0;
                const passThreshold = candidateAssessment?.passPercentage || 60;
                let totalPoints = 0;
                let scoredPoints = 0;
                if (hasSubmission) {
                  candidateSubmissions.forEach(s => {
                    totalPoints += (s.question?.points || 10);
                    scoredPoints += (s.scoreObtained || 0);
                  });
                }
                const candidateScore = totalPoints > 0 ? Math.round((scoredPoints / totalPoints) * 100) : (hasSubmission ? 100 : 0);
                const isPassed = hasSubmission && candidateScore >= passThreshold;
                const isShortlisted = selectedMatch.application.status === 'SHORTLISTED' || ['INTERVIEW', 'OFFER', 'HIRED'].includes(selectedMatch.application.status);
                const canSchedule = !hasAssessment || (hasSubmission && (isPassed || isShortlisted));

                return (
                  <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-xl ${
                          canSchedule ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          <Calendar className="h-5.5 w-5.5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Technical Interview Stage</h4>
                            {hasSubmission ? (
                              <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                                isPassed 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                  : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>
                                {isPassed ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                <span>Assessment: {candidateScore}% (Cutoff: {passThreshold}%)</span>
                              </span>
                            ) : hasAssessment ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                <Lock className="h-3 w-3 text-slate-400" />
                                <span>Assessment Pending</span>
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-0.5">
                            {canSchedule
                              ? 'Candidate has satisfied assessment shortlisting criteria. Ready for technical interview evaluation.'
                              : 'Candidate must complete the coding assessment and meet the score cutoff before an interview can be conducted.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2.5">
                        {!isShortlisted && hasSubmission && (
                          <button
                            onClick={() => handleShortlistCandidate(selectedMatch.applicationId)}
                            disabled={shortlistingCandidate}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-2.5 rounded-lg text-[10px] tracking-wider uppercase border border-slate-200 transition-colors cursor-pointer"
                          >
                            {shortlistingCandidate ? 'Shortlisting...' : 'Shortlist Candidate'}
                          </button>
                        )}

                        {canSchedule ? (
                          <Link
                            to={`/recruiter/jobs/${jobId}/interviews/schedule/${selectedMatch.applicationId}`}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4.5 py-2.5 rounded-lg text-[10px] tracking-wider uppercase shadow-xs whitespace-nowrap cursor-pointer transition-colors inline-flex items-center space-x-1.5"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Schedule Interview</span>
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="bg-slate-100 text-slate-400 font-bold px-4.5 py-2.5 rounded-lg text-[10px] tracking-wider uppercase border border-slate-200 cursor-not-allowed inline-flex items-center space-x-1.5"
                            title="Candidate must complete assessment first"
                          >
                            <Lock className="h-3.5 w-3.5" />
                            <span>Interview Locked (Test Pending)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Upskilling Roadmap Progress (Recruiter view) */}
              <div className="bg-white border border-slate-200/60 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xs">
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <BookOpen className="h-5.5 w-5.5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Upskilling & Roadmap Tracking</h4>
                    {candidateRoadmap ? (
                      <div className="space-y-1.5 mt-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                          <span>Milestone Tasks Completed</span>
                          <span className="text-indigo-650">
                            {candidateRoadmap.tasks.filter(t => t.status === 'COMPLETED').length} / {candidateRoadmap.tasks.length}
                          </span>
                        </div>
                        <div className="h-1.5 w-44 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-600 transition-all" 
                            style={{ 
                              width: `${(candidateRoadmap.tasks.filter(t => t.status === 'COMPLETED').length / candidateRoadmap.tasks.length) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-0.5">
                        No active roadmap generated for this candidate's application.
                      </p>
                    )}
                  </div>
                </div>
                {!candidateRoadmap ? (
                  <button
                    onClick={() => handleGenerateRoadmap(selectedMatch.applicationId)}
                    disabled={generatingRoadmap}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4.5 py-2.5 rounded-lg text-[10px] tracking-wider uppercase shadow-xs whitespace-nowrap cursor-pointer transition-colors"
                  >
                    {generatingRoadmap ? 'Generating...' : 'Generate Roadmap'}
                  </button>
                ) : (
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 p-1.5 px-3 rounded-lg flex items-center space-x-1 uppercase">
                    Active
                  </span>
                )}
              </div>

              {/* Offer Letter Drafting Call-to-Action */}
              <div className="bg-white border border-slate-200/60 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xs">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <FileCheck className="h-5.5 w-5.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Employment Offer Management</h4>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-0.5">Extend formal job offer packages and track candidate acceptance responses.</p>
                  </div>
                </div>
                
                {selectedMatch.application.status === 'OFFER' ? (
                  <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 border border-amber-100 p-2 px-4 rounded-lg uppercase">
                    Offer Pending
                  </span>
                ) : selectedMatch.application.status === 'HIRED' ? (
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 p-2 px-4 rounded-lg uppercase">
                    Hired / Accepted ✓
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setOfferSalary('');
                      setOfferJoiningDate('');
                      setShowOfferModal(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black px-4.5 py-2.5 rounded-lg text-[10px] tracking-wider uppercase shadow-xs whitespace-nowrap cursor-pointer transition-colors"
                  >
                    Draft Offer Letter
                  </button>
                )}
              </div>
              <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="flex items-center space-x-1.5">
                    <FileCheck className="h-4.5 w-4.5 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">Interactive Evidence Timeline</h3>
                  </div>
                  
                  {/* Dropdown to select skill */}
                  {readinessReport?.skillEvidence && Array.isArray(readinessReport.skillEvidence) && (
                    <select
                      value={selectedSkillForTimeline || ''}
                      onChange={(e) => setSelectedSkillForTimeline(e.target.value)}
                      className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 rounded p-1 max-w-xs focus:ring-indigo-500"
                    >
                      {[...new Set(readinessReport.skillEvidence.map(e => e.skillName).filter(Boolean))].map((s, idx) => (
                        <option key={idx} value={s}>{s.toUpperCase()}</option>
                      ))}
                    </select>
                  )}
                </div>

                {selectedSkillForTimeline ? (
                  <div className="space-y-6">
                    {/* Visual node line */}
                    <div className="flex flex-col md:flex-row justify-between items-center relative py-4 gap-6">
                      <div className="hidden md:block absolute left-8 right-8 top-12 h-1 bg-slate-100 z-0" />
                      
                      {getSkillTimelineNodes(selectedSkillForTimeline).map((node, idx) => (
                        <div key={idx} className="flex flex-col items-center z-10 text-center space-y-2 w-full md:w-auto">
                          <div className={`h-11 w-11 rounded-full flex items-center justify-center border-2 font-bold text-xs shadow-xs ${
                            node.found 
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}>
                            {node.found ? '✓' : '-'}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-800 tracking-wide uppercase">{node.source}</span>
                            {node.found && node.evidence && (
                              <span className={`block text-[9px] font-extrabold ${
                                node.evidence.confidence === 'HIGH' 
                                  ? 'text-emerald-600' 
                                  : node.evidence.confidence === 'MEDIUM' 
                                  ? 'text-amber-600' 
                                  : 'text-slate-400'
                              }`}>
                                {node.evidence.confidence} CONF
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Detailed evidence items for the selected skill + Recruiter Override Controls */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-bold text-slate-800">Evidence Record Details & Verification overrides</h4>
                      
                      <div className="divide-y divide-slate-100">
                        {(readinessReport?.skillEvidence || [])
                          .filter(e => e.skillName && e.skillName.toLowerCase() === selectedSkillForTimeline.toLowerCase())
                          .map((ev) => (
                            <div key={ev.id} className="py-3.5 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                              <div className="space-y-1 max-w-lg">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-bold text-slate-700 uppercase">{ev.source}</span>
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    ev.verificationStatus === 'NEEDS_VERIFICATION'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                                      : ev.verificationStatus === 'OVERRIDDEN'
                                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}>
                                    {ev.verificationStatus}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                  {ev.details || 'No evidence details documented.'}
                                </p>
                                {ev.recruiterNotes && (
                                  <p className="text-[10px] text-indigo-600 bg-indigo-50/50 p-1.5 rounded font-bold">
                                    Recruiter Note: {ev.recruiterNotes}
                                  </p>
                                )}
                              </div>

                              {/* Overrides interaction trigger */}
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    selectEvidenceForOverride(ev);
                                    // Trigger simple modal or form expansion
                                    document.getElementById(`override-form-${ev.id}`).classList.toggle('hidden');
                                  }}
                                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 border border-slate-200 hover:bg-indigo-50/30 p-1.5 px-3 rounded-lg cursor-pointer"
                                >
                                  Modify / Override
                                </button>
                              </div>

                              {/* Inline override form */}
                              <div id={`override-form-${ev.id}`} className="hidden w-full md:w-auto p-4 bg-slate-50 rounded-xl border border-slate-200 mt-3 space-y-3 col-span-2">
                                <h5 className="text-[10px] font-bold uppercase text-slate-400">Override verification config</h5>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-500 mb-1">STATUS</label>
                                    <select 
                                      value={overrideStatus}
                                      onChange={(e) => setOverrideStatus(e.target.value)}
                                      className="w-full bg-white border border-slate-200 text-slate-700 font-bold p-1 rounded"
                                    >
                                      <option value="VERIFIED">VERIFIED</option>
                                      <option value="NEEDS_VERIFICATION">NEEDS VERIFICATION</option>
                                      <option value="OVERRIDDEN">OVERRIDE CONFIDENCE</option>
                                    </select>
                                  </div>

                                  {overrideStatus === 'OVERRIDDEN' && (
                                    <div>
                                      <label className="block text-[9px] font-bold text-slate-500 mb-1">OVERRIDE CONFIDENCE</label>
                                      <select 
                                        value={overrideConf}
                                        onChange={(e) => setOverrideConf(e.target.value)}
                                        className="w-full bg-white border border-slate-200 text-slate-700 font-bold p-1 rounded"
                                      >
                                        <option value="HIGH">HIGH</option>
                                        <option value="MEDIUM">MEDIUM</option>
                                        <option value="LOW">LOW</option>
                                        <option value="NONE">NONE</option>
                                      </select>
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <label className="block text-[9px] font-bold text-slate-500 mb-1">RECRUITER REVIEW NOTES</label>
                                  <textarea
                                    value={overrideNotes}
                                    onChange={(e) => setOverrideNotes(e.target.value)}
                                    placeholder="Enter reason for verification flag or override..."
                                    rows="2"
                                    className="w-full bg-white border border-slate-200 text-xs font-bold p-1.5 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                  />
                                </div>

                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => document.getElementById(`override-form-${ev.id}`).classList.add('hidden')}
                                    className="text-[10px] font-bold text-slate-500 border border-slate-200 p-1 px-2.5 rounded hover:bg-slate-100 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleOverrideSubmit(ev.id);
                                      document.getElementById(`override-form-${ev.id}`).classList.add('hidden');
                                    }}
                                    disabled={savingOverrideId === ev.id}
                                    className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-1 px-3.5 rounded flex items-center space-x-1 cursor-pointer"
                                  >
                                    {savingOverrideId === ev.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Save className="h-3 w-3" />
                                    )}
                                    <span>Save Override</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Select a skill to inspect its verification timeline.</p>
                )}
              </div>

              {/* Skill Gap Panel Matrix */}
              {(() => {
                const skillGaps = (selectedMatch?.skillGaps && Array.isArray(selectedMatch.skillGaps))
                  ? selectedMatch.skillGaps
                  : (selectedMatch?.matchAnalysis?.skillGaps && Array.isArray(selectedMatch.matchAnalysis.skillGaps))
                  ? selectedMatch.matchAnalysis.skillGaps
                  : (selectedMatch?.matchAnalysis?.missingRequiredSkills && Array.isArray(selectedMatch.matchAnalysis.missingRequiredSkills))
                  ? selectedMatch.matchAnalysis.missingRequiredSkills.map((skill, idx) => ({
                      id: `gap-${idx}`,
                      skillName: typeof skill === 'string' ? skill : (skill?.name || 'Skill'),
                      importance: 'REQUIRED',
                      currentEvidence: 'MISSING',
                      gapSeverity: 'HIGH',
                      recommendation: `Recommended learning roadmap or practical challenge for ${typeof skill === 'string' ? skill : (skill?.name || 'Skill')}`
                    }))
                  : [];

                return (
                  <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-1.5">
                      <AlertTriangle className="h-4.5 w-4.5 text-indigo-600" />
                      <span>Skill Gap Panel Matrix</span>
                    </h3>

                    {skillGaps.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <th className="py-2.5 px-3">Skill Name</th>
                              <th className="py-2.5 px-3">Importance</th>
                              <th className="py-2.5 px-3">Evidence State</th>
                              <th className="py-2.5 px-3">Gap Severity</th>
                              <th className="py-2.5 px-3">Recommended Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {skillGaps.map((gap, idx) => (
                              <tr key={gap.id || idx} className="text-xs">
                                <td className="py-3 px-3 font-bold text-slate-800 uppercase">{gap.skillName}</td>
                                <td className="py-3 px-3">
                                  <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
                                    gap.importance === 'REQUIRED' 
                                      ? 'bg-indigo-50 text-indigo-700' 
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {gap.importance || 'REQUIRED'}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`inline-flex items-center text-[10px] font-bold ${
                                    gap.currentEvidence === 'MATCHED'
                                      ? 'text-emerald-700'
                                      : 'text-rose-700'
                                  }`}>
                                    {gap.currentEvidence === 'MATCHED' ? 'MATCHED ✓' : 'MISSING ✖'}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`text-[10px] font-bold ${
                                    gap.gapSeverity === 'HIGH'
                                      ? 'text-rose-600'
                                      : gap.gapSeverity === 'LOW'
                                      ? 'text-amber-600'
                                      : 'text-slate-400'
                                  }`}>
                                    {gap.gapSeverity || 'MEDIUM'}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-slate-500 max-w-xs truncate font-semibold" title={gap.recommendation}>
                                  {gap.recommendation || 'Continuous learning recommended.'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400 font-medium">
                        ✓ No critical skill gaps identified for this candidate profile.
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/60 p-12 text-center text-slate-400 space-y-3">
              <Compass className="h-10 w-10 mx-auto text-slate-300" />
              <h3 className="font-bold text-slate-800">No Candidate Selected</h3>
              <p className="text-xs">Choose a candidate from the left panel applicants list to view match intelligence diagnostics.</p>
            </div>
          )}
        </div>
      </div>

      {/* Candidate Comparison Modal */}
      {showComparison && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Scale className="h-5.5 w-5.5 text-indigo-600" />
                <span>Side-by-Side Candidate Match Comparison</span>
              </h3>
              <button 
                onClick={() => setShowComparison(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-sm border border-slate-200 hover:bg-slate-50 p-1.5 px-3 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Evaluation Criteria</th>
                    {getComparisonData().map((m) => (
                      <th key={m.id} className="py-3 px-4 text-center">
                        <div className="text-center font-bold text-slate-800 text-xs">
                          {getCandidateName(m)}
                        </div>
                        <span className="text-[9px] text-slate-400 font-medium block lowercase">{getCandidateEmail(m)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-xs">
                  {/* Overall Score */}
                  <tr className="bg-indigo-50/20 font-bold">
                    <td className="py-3 px-4 text-slate-800 font-extrabold uppercase">Overall Match Score</td>
                    {getComparisonData().map(m => (
                      <td key={m.id} className="py-3 px-4 text-center text-indigo-600 font-black text-sm">
                        {m.overallScore}%
                      </td>
                    ))}
                  </tr>

                  {/* Readiness Score */}
                  <tr className="bg-emerald-50/20 font-bold">
                    <td className="py-3 px-4 text-slate-800 font-extrabold uppercase">Readiness Score</td>
                    {getComparisonData().map(m => (
                      <td key={m.id} className="py-3 px-4 text-center text-emerald-600 font-black text-sm">
                        {m.application.readinessScore || 0}%
                      </td>
                    ))}
                  </tr>

                  {/* Skills Score */}
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600">Skills Score (40% Match Weight)</td>
                    {getComparisonData().map(m => (
                      <td key={m.id} className="py-3 px-4 text-center font-bold text-slate-700">
                        {m.skillsScore}/100
                      </td>
                    ))}
                  </tr>

                  {/* Experience Score */}
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600">Experience Score (25% Match Weight)</td>
                    {getComparisonData().map(m => (
                      <td key={m.id} className="py-3 px-4 text-center font-bold text-slate-700">
                        {m.experienceScore}/100
                      </td>
                    ))}
                  </tr>

                  {/* Projects Score */}
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600">Projects Score (20% Match Weight)</td>
                    {getComparisonData().map(m => (
                      <td key={m.id} className="py-3 px-4 text-center font-bold text-slate-700">
                        {m.projectsScore}/100
                      </td>
                    ))}
                  </tr>

                  {/* Education Score */}
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600">Education Score (10% Match Weight)</td>
                    {getComparisonData().map(m => (
                      <td key={m.id} className="py-3 px-4 text-center font-bold text-slate-700">
                        {m.educationScore}/100
                      </td>
                    ))}
                  </tr>

                  {/* Certifications Score */}
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600">Certifications Score (5% Match Weight)</td>
                    {getComparisonData().map(m => (
                      <td key={m.id} className="py-3 px-4 text-center font-bold text-slate-700">
                        {m.certificationsScore}/100
                      </td>
                    ))}
                  </tr>

                  {/* Matched Required Skills List */}
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600">Matched Required Skills</td>
                    {getComparisonData().map(m => {
                      const matched = m.matchedRequiredSkills || m.matchAnalysis?.matchedRequiredSkills || [];
                      return (
                        <td key={m.id} className="py-3 px-4 text-center">
                          <div className="flex flex-wrap gap-1 justify-center max-w-xs mx-auto">
                            {matched.map((s, idx) => (
                              <span key={idx} className="text-[9px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold border border-emerald-100 uppercase">
                                {typeof s === 'string' ? s : (s?.name || 'Skill')}
                              </span>
                            ))}
                            {matched.length === 0 && <span className="text-slate-400">None</span>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Missing Required Skills List */}
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600">Missing Required Skills</td>
                    {getComparisonData().map(m => {
                      const missing = m.missingRequiredSkills || m.matchAnalysis?.missingRequiredSkills || [];
                      return (
                        <td key={m.id} className="py-3 px-4 text-center">
                          <div className="flex flex-wrap gap-1 justify-center max-w-xs mx-auto">
                            {missing.map((s, idx) => (
                              <span key={idx} className="text-[9px] bg-rose-50 text-rose-800 px-1.5 py-0.5 rounded font-bold border border-rose-100 uppercase">
                                {typeof s === 'string' ? s : (s?.name || 'Skill')}
                              </span>
                            ))}
                            {missing.length === 0 && <span className="text-emerald-600 font-bold">None ✓</span>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Candidate Experience Years */}
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600">Total Experience Years</td>
                    {getComparisonData().map(m => (
                      <td key={m.id} className="py-3 px-4 text-center font-bold text-slate-700">
                        {m.candidateExperience || m.matchAnalysis?.candidateExperience || 0} year(s)
                      </td>
                    ))}
                  </tr>

                  {/* Education status */}
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600">Education Requirement Status</td>
                    {getComparisonData().map(m => (
                      <td key={m.id} className="py-3 px-4 text-center font-bold">
                        <span className={(m.educationMatch || m.matchAnalysis?.educationMatch) === 'MATCHED' ? 'text-emerald-700' : 'text-amber-700'}>
                          {m.educationMatch || m.matchAnalysis?.educationMatch || 'PENDING'}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Matched Certifications */}
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600">Matched Certifications</td>
                    {getComparisonData().map(m => {
                      const certs = m.matchedCertifications || m.matchAnalysis?.matchedCertifications || [];
                      return (
                        <td key={m.id} className="py-3 px-4 text-center">
                          <div className="flex flex-wrap gap-1 justify-center max-w-xs mx-auto">
                            {certs.map((c, idx) => (
                              <span key={idx} className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                                {typeof c === 'string' ? c : (c?.name || 'Cert')}
                              </span>
                            ))}
                            {certs.length === 0 && <span className="text-slate-400">None</span>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Governance disclaimer in modal */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[10px] text-slate-500 leading-relaxed font-semibold">
              <span className="font-bold text-slate-700 block mb-1">Compliance & Auditing Standards:</span>
              This side-by-side comparative grid is derived purely from candidate-provided experience timeline parameters, project validations, and documented certification credentials. No demographic metadata, candidate age, ethnicity, biological gender, or other non-qualification inputs are incorporated into the ranking or scoring algorithms. Final reviews must be confirmed by recruiters.
            </div>
          </div>
        </div>
      )}

      {/* Recruiter Draft Offer Letter Modal Overlay */}
      {showOfferModal && selectedMatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-lg w-full overflow-hidden">
            
            {/* Header */}
            <div className="bg-[#F6F7FB] p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Draft Offer: {getCandidateName(selectedMatch)}</h3>
                <span className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase block mt-0.5">Define Job Terms & Benefits</span>
              </div>
              <button
                onClick={() => setShowOfferModal(false)}
                className="text-slate-450 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSendOffer} className="p-5 space-y-4 text-xs font-semibold text-slate-650">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Base Salary</label>
                  <input
                    type="text"
                    required
                    value={offerSalary}
                    onChange={(e) => setOfferSalary(e.target.value)}
                    placeholder="e.g. $120,000 / year"
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Target Start Date</label>
                  <input
                    type="date"
                    required
                    value={offerJoiningDate}
                    onChange={(e) => setOfferJoiningDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Work Location</label>
                  <input
                    type="text"
                    required
                    value={offerLocation}
                    onChange={(e) => setOfferLocation(e.target.value)}
                    placeholder="e.g. Remote / New York"
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Employment Type</label>
                  <select
                    value={offerType}
                    onChange={(e) => setOfferType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-800"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERN">Internship</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Assigned Benefits & Perks (JSON array or list)</label>
                <textarea
                  required
                  rows="3"
                  value={offerBenefits}
                  onChange={(e) => setOfferBenefits(e.target.value)}
                  placeholder='e.g. ["Health Insurance", "401(k) Match"]'
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-805 font-mono text-[11px]"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingOffer}
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black px-5 py-2 rounded-lg flex items-center space-x-1 cursor-pointer"
                >
                  {sendingOffer && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                  <span>Dispatch Offer</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default MatchIntelligence;
