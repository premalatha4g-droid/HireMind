import React, { useState, useEffect } from 'react';
import apiFetch from '../../services/api';
import { 
  Award, 
  Plus, 
  Edit, 
  Loader2, 
  AlertCircle, 
  Briefcase, 
  ArrowRight, 
  Users, 
  CheckCircle2, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  Camera,
  Check,
  X,
  FileCode
} from 'lucide-react';
import { Link } from 'react-router-dom';

const RecruiterAssessments = () => {
  const [jobs, setJobs] = useState([]);
  const [submissionsByJob, setSubmissionsByJob] = useState({});
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Proctoring audit details modal
  const [selectedSubForAudit, setSelectedSubForAudit] = useState(null);

  const fetchJobsAndSubmissions = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/jobs');
      const jobsList = Array.isArray(data) ? data : [];
      setJobs(jobsList);

      // Fetch submissions for all jobs in parallel
      const subMap = {};
      await Promise.all(
        jobsList.map(async (job) => {
          try {
            const subData = await apiFetch(`/api/assessments/submissions/job/${job.id || job._id}`);
            subMap[job.id || job._id] = subData;
          } catch (e) {
            subMap[job.id || job._id] = { submissions: [] };
          }
        })
      );
      setSubmissionsByJob(subMap);
      if (jobsList.length > 0 && !expandedJobId) {
        setExpandedJobId(jobsList[0].id || jobsList[0]._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load assessments workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobsAndSubmissions();
  }, []);

  const handleShortlistCandidate = async (appId, jobId) => {
    try {
      await apiFetch(`/api/jobs/applications/${appId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'SHORTLISTED' })
      });
      setActionSuccess('Candidate successfully shortlisted for technical interview!');
      // Update local state
      setSubmissionsByJob(prev => {
        const jobSubs = prev[jobId];
        if (!jobSubs) return prev;
        return {
          ...prev,
          [jobId]: {
            ...jobSubs,
            submissions: (jobSubs.submissions || []).map(s => s.applicationId === appId ? { ...s, applicationStatus: 'SHORTLISTED' } : s)
          }
        };
      });
      setTimeout(() => setActionSuccess(''), 3500);
    } catch (err) {
      setError(err.message || 'Failed to update candidate status.');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#0A0F1D] text-white p-7 rounded-2xl border border-indigo-800/60 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-indigo-500/20 text-cyan-400 rounded-xl border border-indigo-500/30">
                <Terminal className="h-5 w-5" />
              </span>
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                Audited Sandbox Grading
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Technical Assessment Grading & AI Proctoring Audit</h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-medium">
              Configure job-specific coding test challenges, review candidate execution scores, audit live WebCam and tab-switch integrity logs, and shortlist top performers.
            </p>
          </div>

          <Link
            to="/recruiter/jobs"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>New Job Challenge</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2 font-semibold shadow-xs">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2.5 font-semibold shadow-xs">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center bg-white rounded-2xl border border-slate-200/60 shadow-xs">
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <span className="text-xs text-slate-500 font-semibold tracking-wide">Loading assessments & candidate proctoring logs...</span>
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white border border-slate-200/70 rounded-2xl p-8 text-center space-y-3 shadow-xs">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mx-auto">
            <Award className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Job Postings Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create an active job opening first to configure coding challenges and auto-grading thresholds.
          </p>
          <Link
            to="/recruiter/jobs/create"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs"
          >
            <span>Create New Job</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => {
              const jobId = job.id || job._id;
              const jobSubData = submissionsByJob[jobId] || { submissions: [] };
              const submissionsList = jobSubData.submissions || [];
              const passCutoff = jobSubData.assessment?.passPercentage || 60;
              const passedCount = submissionsList.filter(s => s.isPassed || (s.score >= passCutoff)).length;
              const isExpanded = expandedJobId === jobId;

              return (
                <div key={jobId} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
                  
                  {/* Header */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-black text-slate-900 text-base">{job.title}</h3>
                        <span className="text-xs text-indigo-600 font-bold block uppercase mt-0.5">{job.company} ({job.location})</span>
                      </div>
                      <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md text-[10px] font-black uppercase">
                        {job.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Shortlisting Passing Threshold: <strong className="text-slate-800 font-bold">{passCutoff}%</strong>. Candidates meeting this score auto-qualify for technical interview.
                    </p>
                  </div>

                  {/* Submission Statistics Pill */}
                  <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl flex justify-between items-center text-xs font-semibold">
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Users className="h-4 w-4 text-indigo-600" />
                      <span>Submissions: <strong className="text-slate-900 font-bold">{submissionsList.length}</strong></span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Award className="h-4 w-4 text-emerald-600" />
                      <span>Qualified ($\ge{passCutoff}\%$): <strong className="text-emerald-600 font-bold">{passedCount}</strong></span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center space-x-2">
                    <Link
                      to={`/recruiter/jobs/${jobId}/assessment/edit`}
                      className="flex-1 inline-flex items-center justify-center space-x-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Configure Test Sandbox</span>
                    </Link>

                    <button
                      onClick={() => setExpandedJobId(isExpanded ? null : jobId)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide' : 'Review Candidates'}</span>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {/* Expandable Submissions Table with Proctoring Audit */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Candidate Performance & Integrity Logs</h4>
                        <span className="text-[10px] text-slate-400 font-mono">{submissionsList.length} Submissions</span>
                      </div>

                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {submissionsList.map(sub => {
                          const isShortlisted = sub.applicationStatus === 'SHORTLISTED' || sub.applicationStatus === 'INTERVIEW';
                          const integrityScore = sub.integrityScore !== undefined ? sub.integrityScore : 100;
                          const tabSwitches = sub.tabSwitches || 0;

                          return (
                            <div key={sub.id || sub._id} className="p-3.5 bg-slate-50/90 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs">
                              <div>
                                <p className="font-bold text-slate-900">{sub.candidate?.name || 'Candidate'}</p>
                                <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-medium">
                                  <span>{sub.candidate?.email || 'email@domain.com'}</span>
                                  <span>•</span>
                                  <span className={`font-bold flex items-center space-x-1 ${integrityScore >= 80 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    <ShieldCheck className="h-3 w-3" />
                                    <span>Proctor Integrity: {integrityScore}% ({tabSwitches} tabs)</span>
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                                  (sub.isPassed || sub.score >= passCutoff)
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  Score: {sub.score}%
                                </span>

                                {isShortlisted ? (
                                  <Link
                                    to={`/recruiter/jobs/${jobId}/interviews/schedule/${sub.applicationId || sub.id}`}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10px] uppercase shadow-xs inline-flex items-center space-x-1"
                                  >
                                    <Calendar className="h-3 w-3" />
                                    <span>Interview</span>
                                  </Link>
                                ) : (
                                  <button
                                    onClick={() => handleShortlistCandidate(sub.applicationId || sub.id, jobId)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] uppercase shadow-xs cursor-pointer"
                                  >
                                    Shortlist
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {submissionsList.length === 0 && (
                          <div className="text-center py-6 text-slate-400 italic text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            No candidate challenge submissions recorded yet.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default RecruiterAssessments;
