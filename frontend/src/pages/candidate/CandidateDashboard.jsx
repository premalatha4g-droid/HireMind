import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiFetch from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Award, 
  Briefcase, 
  Calendar, 
  FileCheck, 
  ArrowRight, 
  Sparkles, 
  LogOut, 
  Activity, 
  TrendingUp,
  Terminal,
  Loader2,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Brain
} from 'lucide-react';

const CandidateDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [hasResume, setHasResume] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [skillsCount, setSkillsCount] = useState(0);
  
  // Dynamic Candidate Applications
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');

  const fetchDashboardDetails = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Resume info
      try {
        const resumeRes = await apiFetch('/api/resumes/me');
        if (resumeRes && resumeRes.resume) {
          setHasResume(true);
          setResumeData(resumeRes);
          setSkillsCount(resumeRes.skillEvidences?.length || 0);
        } else {
          setHasResume(false);
        }
      } catch (e) {
        setHasResume(false);
      }

      // 2. Fetch candidate applications and submissions
      try {
        const appsRes = await apiFetch('/api/assessments/my-applications');
        setApplications(Array.isArray(appsRes) ? appsRes : []);
      } catch (e) {
        setApplications([]);
      }
    } catch (err) {
      console.error('Failed to load candidate metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardDetails();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper to map application status to visual stage index
  const getStageStatusIndex = (status) => {
    const stagesList = ['APPLIED', 'SCREENING', 'ASSESSMENT', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED'];
    const idx = stagesList.indexOf(status);
    return idx !== -1 ? idx : 0;
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Loading candidate profile metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome back, {user?.name}!</h1>
          <p className="text-sm text-slate-500 font-medium">Track your credential evidence, readiness scores, and code assessments</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-xs">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-slate-200/60 p-5 flex items-center justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Job Readiness Score</span>
            <p className="text-2xl font-black text-indigo-600">
              {hasResume ? `${user?.readinessScore || 75}%` : '--'}
            </p>
            <span className="text-[10px] text-slate-400 font-semibold">
              {hasResume ? 'Audit-ready profile' : 'Upload resume to calculate'}
            </span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <TrendingUp className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/60 p-5 flex items-center justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Applications</span>
            <p className="text-2xl font-black text-slate-900">{applications.length}</p>
            <span className="text-[10px] text-slate-400 font-semibold">Submitted pipelines</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Briefcase className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/60 p-5 flex items-center justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Skills Cataloged</span>
            <p className="text-2xl font-black text-slate-900">{skillsCount}</p>
            <span className="text-[10px] text-slate-400 font-semibold">Verified on Passport</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Award className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/60 p-5 flex items-center justify-between shadow-xs hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Scheduled Interviews</span>
            <p className="text-2xl font-black text-slate-900">
              {applications.filter(a => a.status === 'INTERVIEW').length}
            </p>
            <span className="text-[10px] text-slate-400 font-semibold">Technical reviews pending</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Calendar className="h-5.5 w-5.5" />
          </div>
        </div>
      </div>

      {/* Main Split Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Applications List & Tracking */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Active Job Pipelines</h3>
              <p className="text-xs text-slate-500">Track interview progress and complete assigned coding tests</p>
            </div>

            <div className="space-y-5">
              {applications.filter(app => !!app && !!app.job).map((app) => {
                const jobHasTest = app.job?.assessment;
                const submission = (app.submissions || []).find(s => s.assessmentId === jobHasTest?.id);
                const activeStageIdx = getStageStatusIndex(app.status);

                const stagesList = [
                  { name: 'Applied', idx: 0 },
                  { name: 'AI Screening', idx: 1 },
                  { name: 'Coding Sandbox', idx: 2 },
                  { name: 'Skill Gap Healing', idx: 3 },
                  { name: 'Tech Interview', idx: 4 },
                  { name: 'Job Offer', idx: 5 }
                ];

                return (
                  <div key={app.id} className="p-5 border border-slate-200/80 rounded-2xl bg-white space-y-4 shadow-xs hover:shadow-md transition-shadow">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-sm font-black text-slate-900 tracking-tight">{app.job?.title || 'Position'}</h4>
                        <span className="text-xs text-indigo-600 font-bold block uppercase mt-0.5">{app.job?.company || 'Company'}</span>
                      </div>
                      
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        app.status === 'HIRED' || app.status === 'OFFER'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : app.status === 'SHORTLISTED'
                          ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse'
                      }`}>
                        ● {app.status}
                      </span>
                    </div>

                    {/* Progress Pipeline Stepper */}
                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center py-1 relative px-1">
                        {stagesList.map((stage) => {
                          const done = activeStageIdx >= stage.idx;
                          const current = activeStageIdx === stage.idx;
                          
                          return (
                            <div key={stage.idx} className="flex flex-col items-center z-10">
                              <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[9px] border transition-all ${
                                done 
                                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs' 
                                  : current 
                                  ? 'bg-indigo-600 border-2 border-indigo-400 text-white ring-2 ring-indigo-200' 
                                  : 'bg-white border-slate-200 text-slate-400'
                              }`}>
                                {done ? '✓' : stage.idx + 1}
                              </div>
                              <span className={`text-[9px] font-extrabold mt-1 text-center truncate max-w-[65px] ${
                                done ? 'text-emerald-700' : current ? 'text-indigo-700' : 'text-slate-400'
                              }`}>
                                {stage.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Coding assessment triggers */}
                    {jobHasTest && (
                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
                          <Terminal className="h-4 w-4 text-indigo-600" />
                          <span>Coding Challenge: <span className="font-bold text-slate-900">{jobHasTest.title}</span> ({jobHasTest.timeLimit} mins)</span>
                        </div>

                        {submission ? (
                          <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 p-1.5 px-3 rounded-lg flex items-center space-x-1 uppercase">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Submitted ({submission.score}%)</span>
                          </span>
                        ) : (
                          <Link
                            to={`/candidate/assessment/${app.job?.id || app.job?._id}`}
                            className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-1.5 px-3.5 rounded-lg text-[10px] uppercase tracking-wide transition shadow-xs cursor-pointer"
                          >
                            <span>Launch Coding Sandbox</span>
                            <ArrowRight className="h-3 w-3 text-white" />
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Skill Gap Healing & Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <Link
                        to={`/candidate/applications/${app.id}/roadmap`}
                        className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-indigo-50 to-cyan-50 border border-indigo-200/80 hover:border-indigo-300 text-indigo-700 font-bold p-2 px-3.5 rounded-xl text-[11px] transition shadow-xs cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
                        <span>⚡ Autonomous Skill-Gap Healing Track</span>
                      </Link>

                      {app.status === 'OFFER' && (
                        <Link
                          to={`/candidate/applications/${app.id}/offer`}
                          className="inline-flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black p-2 px-4 rounded-xl text-[11px] uppercase transition shadow-sm cursor-pointer"
                        >
                          <FileCheck className="h-4 w-4 mr-0.5 text-slate-950" />
                          <span>Review Formal Offer Letter</span>
                        </Link>
                      )}

                      {app.status === 'APPLIED' && (
                        <Link
                          to={`/candidate/applications/${app.id}/ai-interview`}
                          className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 px-3.5 rounded-xl text-[11px] uppercase transition shadow-sm cursor-pointer"
                        >
                          <Brain className="h-3.5 w-3.5 text-white" />
                          <span>AI Pre-Screening</span>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}

              {applications.length === 0 && (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Briefcase className="h-9 w-9 mx-auto text-slate-200" />
                  <p className="text-xs">No active applications registered. Upload a resume to begin.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI insight panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-xs flex flex-col h-full justify-between">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5 border-b border-slate-100 pb-3">
                <Sparkles className="h-4.5 w-4.5 text-indigo-600" />
                <span>Evidence Talent Insights</span>
              </h3>
              
              {hasResume ? (
                <div className="space-y-3.5 text-xs text-slate-650 leading-relaxed font-semibold">
                  <p className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800">
                    "AI Analysis: Your skill evidence shows high support for Java Backend roles based on project tags."
                  </p>
                  <p className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-800">
                    "Upskilling Draft: Completing assigned coding tests immediately boosts your Job Readiness rating by 25%."
                  </p>
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-6 italic space-y-2 font-semibold">
                  <p>Welcome to HireMind AI!</p>
                  <p>Upload your resume to calculate qualification compatibility and view customized skill timelines.</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 mt-6">
              <Link 
                to="/candidate/passport" 
                className="w-full flex items-center justify-between text-xs font-bold text-indigo-600 hover:text-indigo-800 py-1 transition-all"
              >
                <span>{hasResume ? 'Manage AI Passport' : 'Upload Resume'}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CandidateDashboard;
