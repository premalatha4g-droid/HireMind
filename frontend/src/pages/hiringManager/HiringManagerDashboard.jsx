import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiFetch from '../../services/api';
import { 
  UserCheck, 
  LogOut, 
  Briefcase, 
  Award, 
  TrendingUp, 
  Calendar, 
  FileCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Filter, 
  Loader2, 
  Brain, 
  Sparkles, 
  ChevronRight, 
  Eye, 
  Sliders, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  FileText, 
  DollarSign, 
  ArrowRight,
  MessageSquare,
  Building,
  MapPin,
  Send,
  X,
  EyeOff,
  UserX
} from 'lucide-react';

const HiringManagerDashboard = () => {
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Anti-Bias Blind Screening Mode
  const [blindMode, setBlindMode] = useState(false);

  // Data states
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [jobs, setJobs] = useState([]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobFilter, setSelectedJobFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Helper functions for candidate identification
  const getCandidateDisplayName = (app) => {
    if (!app) return '';
    if (blindMode) return `Candidate #${app.id?.substring(0, 6).toUpperCase()}`;
    return app.candidate?.name || 'Candidate';
  };

  const getCandidateDisplayEmail = (app) => {
    if (!app) return '';
    if (blindMode) return 'anonymized.talent@encrypted.id';
    return app.candidate?.email || '';
  };

  // Selected candidate detail modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [appMatchData, setAppMatchData] = useState(null);
  const [appReadinessData, setAppReadinessData] = useState(null);
  const [appSubmissions, setAppSubmissions] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, interview, assessment, skills

  // Offer letter drafting modal state
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerApp, setOfferApp] = useState(null);
  const [offerSalary, setOfferSalary] = useState('');
  const [offerJoiningDate, setOfferJoiningDate] = useState('');
  const [offerLocation, setOfferLocation] = useState('Remote');
  const [offerType, setOfferType] = useState('FULL_TIME');
  const [offerBenefits, setOfferBenefits] = useState('["Health Insurance", "401(k) Match", "15 days PTO"]');
  const [sendingOffer, setSendingOffer] = useState(false);

  // Status updating state
  const [updatingId, setUpdatingId] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch all applications
      const appsData = await apiFetch('/api/jobs/applications/all');
      setApplications(Array.isArray(appsData) ? appsData : []);

      // 2. Fetch interviews & feedback
      const interviewsData = await apiFetch('/api/interviews/my-schedules');
      setInterviews(Array.isArray(interviewsData) ? interviewsData : []);

      // 3. Fetch jobs list for filter
      const jobsData = await apiFetch('/api/jobs');
      setJobs(Array.isArray(jobsData) ? jobsData : []);
    } catch (err) {
      console.error('Failed to load hiring manager data:', err);
      setError(err.message || 'Failed to fetch executive hiring pipeline data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch full details when inspecting a candidate
  const handleInspectCandidate = async (app) => {
    setSelectedApp(app);
    setLoadingDetail(true);
    setActiveTab('overview');
    try {
      // Match Analysis
      try {
        const matches = await apiFetch(`/api/matches/job/${app.jobId}`);
        const match = Array.isArray(matches) ? matches.find(m => m.applicationId === app.id) : null;
        setAppMatchData(match || null);
      } catch (e) {
        setAppMatchData(null);
      }

      // Readiness Report
      try {
        const readiness = await apiFetch(`/api/readiness/report/${app.id}`);
        setAppReadinessData(readiness || null);
      } catch (e) {
        setAppReadinessData(null);
      }

      // Assessment submissions
      try {
        const subs = await apiFetch(`/api/assessments/submissions/application/${app.id}`);
        setAppSubmissions(subs || []);
      } catch (e) {
        setAppSubmissions([]);
      }
    } catch (err) {
      console.error('Failed to fetch candidate details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Update application status
  const handleUpdateStatus = async (appId, newStatus) => {
    setUpdatingId(appId);
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/api/jobs/applications/${appId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      setSuccess(`Application status updated to ${newStatus}.`);
      // Update local state
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp(prev => ({ ...prev, status: newStatus }));
      }
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      setError(err.message || 'Failed to update application status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Send / Authorize Offer
  const handleSendOffer = async (e) => {
    e.preventDefault();
    if (!offerApp) return;
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
          applicationId: offerApp.id,
          salary: offerSalary,
          joiningDate: offerJoiningDate,
          location: offerLocation,
          employmentType: offerType,
          benefits: parsedBenefits
        })
      });

      setSuccess(`Job offer successfully extended to ${offerApp.candidate?.name}!`);
      setShowOfferModal(false);
      setOfferSalary('');
      setOfferJoiningDate('');
      await fetchDashboardData();
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      setError(err.message || 'Failed to issue job offer.');
    } finally {
      setSendingOffer(false);
    }
  };

  // Associate interview feedback with applications
  const getInterviewForApp = (appId) => {
    return interviews.find(i => i.applicationId === appId || i.id === appId);
  };

  // Filtered applications list
  const filteredApps = applications.filter(app => {
    const candidateName = app.candidate?.name?.toLowerCase() || '';
    const candidateEmail = app.candidate?.email?.toLowerCase() || '';
    const jobTitle = app.job?.title?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    const matchesSearch = candidateName.includes(query) || candidateEmail.includes(query) || jobTitle.includes(query);
    const matchesJob = selectedJobFilter === 'ALL' || app.jobId === selectedJobFilter;
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;

    return matchesSearch && matchesJob && matchesStatus;
  });

  // Calculate high-level KPIs
  const totalApps = applications.length;
  const inReviewCount = applications.filter(a => ['SHORTLISTED', 'INTERVIEW'].includes(a.status)).length;
  const interviewedCount = applications.filter(a => {
    const interview = getInterviewForApp(a.id);
    return interview && interview.feedback;
  }).length;
  const offersCount = applications.filter(a => ['OFFER', 'HIRED'].includes(a.status)).length;
  const hiredCount = applications.filter(a => a.status === 'HIRED').length;

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      
      {/* Top Executive Navbar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-sm">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-black tracking-tight text-slate-900">Hiring Manager Portal</h1>
                <span className="text-[10px] font-extrabold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase">
                  Executive Console
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Review talent evidence, interview scorecards, and make authoritative hiring decisions</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-slate-900">{user?.name}</p>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Hiring Manager</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Governance Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-indigo-300" />
              <h3 className="font-extrabold text-sm tracking-wider uppercase text-indigo-200">
                Audited Talent Decision Workflow
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              HireMind AI assists with automated resume parsing, test case grading, and evidence verification timelines. All final employment decisions, offer approvals, and candidate status advancements remain under human authorization.
            </p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className="text-[10px] font-extrabold bg-indigo-900/80 border border-indigo-700/80 text-indigo-200 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              Human-in-the-Loop Governance ✓
            </span>
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">In Active Review</span>
              <p className="text-3xl font-black text-indigo-600">{inReviewCount}</p>
              <span className="text-[10px] text-slate-400 font-semibold">Shortlisted & interviewing</span>
            </div>
            <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Clock className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Interviews Evaluated</span>
              <p className="text-3xl font-black text-slate-900">{interviewedCount}</p>
              <span className="text-[10px] text-slate-400 font-semibold">Scorecard ready for decision</span>
            </div>
            <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl">
              <MessageSquare className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Offers Approved</span>
              <p className="text-3xl font-black text-amber-600">{offersCount}</p>
              <span className="text-[10px] text-slate-400 font-semibold">{hiredCount} Accepted & Hired</span>
            </div>
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl">
              <FileCheck className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Pipeline Pool</span>
              <p className="text-3xl font-black text-slate-900">{totalApps}</p>
              <span className="text-[10px] text-slate-400 font-semibold">Across {jobs.length} open job roles</span>
            </div>
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Briefcase className="h-6 w-6" />
            </div>
          </div>

        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidates by name, email, or job title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          {/* Filters and Blind Mode Switch */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Anti-Bias Blind Mode Toggle */}
            <button
              onClick={() => setBlindMode(!blindMode)}
              className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
                blindMode
                  ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title="Anonymize candidate names and emails to ensure unbiased evaluation"
            >
              {blindMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span>{blindMode ? 'Blind Mode ON' : 'Blind Mode'}</span>
            </button>

            <Filter className="h-4 w-4 text-slate-400 ml-1" />
            <select
              value={selectedJobFilter}
              onChange={(e) => setSelectedJobFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Job Roles ({jobs.length})</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Stages</option>
              <option value="APPLIED">Applied</option>
              <option value="SCREENING">Pre-Screening</option>
              <option value="ASSESSMENT">Assessment</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="INTERVIEW">Interview</option>
              <option value="OFFER">Offer Sent</option>
              <option value="HIRED">Hired</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

        </div>

        {/* Applications Decision Table */}
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
          
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Candidate Decision & Evaluation Pipeline</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Showing {filteredApps.length} candidates in evaluation pipeline</p>
            </div>
            {blindMode && (
              <span className="text-[10px] font-black bg-purple-100 text-purple-800 px-3 py-1 rounded-full uppercase tracking-wider">
                Anonymized Blind Screening Active ✓
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              <span className="text-xs text-slate-400 font-semibold">Loading candidate evaluation matrices...</span>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="p-16 text-center text-slate-400 space-y-2">
              <Briefcase className="h-10 w-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No candidates match your current filter</p>
              <p className="text-xs text-slate-400">Try adjusting your search keywords or filter dropdowns.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Candidate</th>
                    <th className="py-3.5 px-4">Job Role</th>
                    <th className="py-3.5 px-4 text-center">Match %</th>
                    <th className="py-3.5 px-4 text-center">Readiness %</th>
                    <th className="py-3.5 px-4 text-center">Interview Feedback</th>
                    <th className="py-3.5 px-4 text-center">Stage Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredApps.map((app) => {
                    const interview = getInterviewForApp(app.id);
                    const feedback = interview?.feedback;
                    const isUpdating = updatingId === app.id;
                    const candidateName = getCandidateDisplayName(app);
                    const candidateEmail = getCandidateDisplayEmail(app);

                    return (
                      <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                        
                        {/* Candidate Info */}
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-xs ${
                              blindMode ? 'bg-purple-100 text-purple-700' : 'bg-indigo-50 border border-indigo-100 text-indigo-700'
                            }`}>
                              {blindMode ? <UserX className="h-4 w-4" /> : candidateName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-tight">{candidateName}</p>
                              <span className="text-[10px] text-slate-400 font-medium">{candidateEmail}</span>
                            </div>
                          </div>
                        </td>

                        {/* Job Title */}
                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-800">{app.job?.title}</p>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">{app.job?.company}</span>
                        </td>

                        {/* Match Score */}
                        <td className="py-4 px-4 text-center">
                          <span className="font-black text-indigo-600 text-sm">
                            {app.matchScore || 0}%
                          </span>
                        </td>

                        {/* Readiness Score */}
                        <td className="py-4 px-4 text-center">
                          <span className="font-black text-emerald-600 text-sm">
                            {app.readinessScore || 0}%
                          </span>
                        </td>

                        {/* Interview Feedback */}
                        <td className="py-4 px-4 text-center">
                          {feedback ? (
                            <div className="inline-flex flex-col items-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                feedback.recommendation === 'PROCEED' || feedback.recommendation === 'RECOMMEND_HIRE'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : feedback.recommendation === 'HOLD'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {feedback.recommendation} ({(feedback.technicalScore + feedback.problemSolvingScore) / 2}/10)
                              </span>
                            </div>
                          ) : interview?.status === 'SCHEDULED' ? (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                              Interview Scheduled
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium italic">
                              Pending Interview
                            </span>
                          )}
                        </td>

                        {/* Application Stage */}
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                            app.status === 'HIRED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : app.status === 'OFFER'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                              : app.status === 'SHORTLISTED'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : app.status === 'INTERVIEW'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : app.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {app.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right space-x-1.5 whitespace-nowrap">
                          
                          {/* Inspect Profile Button */}
                          <button
                            onClick={() => handleInspectCandidate(app)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Review</span>
                          </button>

                          {/* Quick Decision Buttons */}
                          {app.status !== 'OFFER' && app.status !== 'HIRED' && app.status !== 'REJECTED' && (
                            <button
                              onClick={() => {
                                setOfferApp(app);
                                setOfferSalary('');
                                setOfferJoiningDate('');
                                setShowOfferModal(true);
                              }}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
                            >
                              <DollarSign className="h-3.5 w-3.5" />
                              <span>Extend Offer</span>
                            </button>
                          )}

                          {app.status === 'APPLIED' && (
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'SHORTLISTED')}
                              disabled={isUpdating}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                            >
                              <span>Shortlist</span>
                            </button>
                          )}

                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </main>

      {/* Candidate Deep Review Drawer / Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80 p-6 space-y-6">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-4">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-md font-black text-lg ${
                  blindMode ? 'bg-purple-600 text-white' : 'bg-indigo-600 text-white'
                }`}>
                  {blindMode ? <UserX className="h-6 w-6" /> : (getCandidateDisplayName(selectedApp)?.charAt(0) || 'C')}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">{getCandidateDisplayName(selectedApp)}</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    Target Role: <strong className="text-slate-700">{selectedApp.job?.title}</strong> ({selectedApp.job?.company})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Score Gauges Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl text-center">
                <span className="text-[10px] font-extrabold uppercase text-indigo-400 tracking-wider block">Qualification Match</span>
                <p className="text-3xl font-black text-indigo-600 mt-1">{selectedApp.matchScore || 0}%</p>
                <span className="text-[10px] text-slate-500 font-semibold">Job Requirements Fit</span>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl text-center">
                <span className="text-[10px] font-extrabold uppercase text-emerald-500 tracking-wider block">Job Readiness Score</span>
                <p className="text-3xl font-black text-emerald-600 mt-1">{selectedApp.readinessScore || 0}%</p>
                <span className="text-[10px] text-slate-500 font-semibold">Evidence Validation Index</span>
              </div>

              <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-2xl text-center">
                <span className="text-[10px] font-extrabold uppercase text-purple-500 tracking-wider block">Current Status</span>
                <p className="text-xl font-black text-purple-700 mt-2 uppercase tracking-wide">{selectedApp.status}</p>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-150 gap-4">
              {[
                { id: 'overview', label: 'Evaluation Overview', icon: Brain },
                { id: 'interview', label: 'Interview Feedback', icon: MessageSquare },
                { id: 'assessment', label: 'Coding Assessment', icon: Award },
                { id: 'skills', label: 'Skill Gap Analysis', icon: Sliders }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 border-b-2 cursor-pointer transition-all ${
                      activeTab === tab.id
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            {loadingDetail ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
                <span className="text-xs text-slate-400">Loading diagnostic details...</span>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* 1. Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-4 text-xs">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-2">
                      <h4 className="font-extrabold text-slate-900 uppercase text-[11px]">AI Synthesis & Hiring Summary</h4>
                      <p className="text-slate-600 font-semibold leading-relaxed">
                        {appMatchData?.matchAnalysis?.scoreExplanation || 
                         `Candidate has demonstrated strong qualification compatibility with an overall Match rating of ${selectedApp.matchScore}%. Evidence validation demonstrates active readiness index of ${selectedApp.readinessScore}%.`}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Experience Profile</span>
                        <p className="text-slate-800 font-bold">
                          {appMatchData?.matchAnalysis?.candidateExperience || 0} year(s) documented
                        </p>
                      </div>

                      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Education Verification</span>
                        <p className="text-emerald-700 font-bold">
                          {appMatchData?.matchAnalysis?.educationMatch || 'MATCHED ✓'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Interview Feedback Tab */}
                {activeTab === 'interview' && (() => {
                  const interview = getInterviewForApp(selectedApp.id);
                  const feedback = interview?.feedback;

                  if (!feedback) {
                    return (
                      <div className="p-8 text-center text-slate-400 space-y-2">
                        <MessageSquare className="h-8 w-8 mx-auto text-slate-300" />
                        <p className="text-xs font-bold text-slate-600">No technical interview evaluation submitted yet.</p>
                        <p className="text-[11px]">Once the assigned interviewer completes their scorecard, it will be detailed here.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4 text-xs">
                      {/* Metric Scores */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-indigo-50/60 rounded-xl text-center border border-indigo-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Technical</span>
                          <p className="text-xl font-black text-indigo-600">{feedback.technicalScore}/10</p>
                        </div>
                        <div className="p-3 bg-indigo-50/60 rounded-xl text-center border border-indigo-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Problem Solving</span>
                          <p className="text-xl font-black text-indigo-600">{feedback.problemSolvingScore}/10</p>
                        </div>
                        <div className="p-3 bg-indigo-50/60 rounded-xl text-center border border-indigo-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Communication</span>
                          <p className="text-xl font-black text-indigo-600">{feedback.communicationScore}/10</p>
                        </div>
                        <div className="p-3 bg-indigo-50/60 rounded-xl text-center border border-indigo-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Project Depth</span>
                          <p className="text-xl font-black text-indigo-600">{feedback.projectUnderstandingScore}/10</p>
                        </div>
                      </div>

                      {/* Comments */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Interviewer Feedback Notes</span>
                        <p className="text-slate-700 font-semibold leading-relaxed">{feedback.comments || 'No written notes.'}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Coding Assessment Tab */}
                {activeTab === 'assessment' && (
                  <div className="space-y-4 text-xs">
                    {appSubmissions.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 space-y-2">
                        <Award className="h-8 w-8 mx-auto text-slate-300" />
                        <p className="text-xs font-bold text-slate-600">No coding challenge submissions on file.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {appSubmissions.map((sub, idx) => (
                          <div key={idx} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-800 uppercase">{sub.question?.title || `Coding Challenge #${idx + 1}`}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                sub.isCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {sub.isCorrect ? 'PASSED ✓' : 'FAILED ✖'} ({sub.scoreObtained} pts)
                              </span>
                            </div>
                            <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto">
                              {sub.codeSubmitted || '// No code submitted'}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Skills Tab */}
                {activeTab === 'skills' && (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl space-y-2">
                        <span className="text-[10px] font-extrabold uppercase text-emerald-700">Matched Required Skills</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {(appMatchData?.matchAnalysis?.matchedRequiredSkills || []).map((s, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-emerald-100/80 text-emerald-800 font-bold rounded-md text-[10px]">
                              {s}
                            </span>
                          ))}
                          {(appMatchData?.matchAnalysis?.matchedRequiredSkills || []).length === 0 && (
                            <span className="text-slate-400 text-xs">None cataloged</span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 bg-rose-50/40 border border-rose-100 rounded-2xl space-y-2">
                        <span className="text-[10px] font-extrabold uppercase text-rose-700">Missing Required Skills</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {(appMatchData?.matchAnalysis?.missingRequiredSkills || []).map((s, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-rose-100/80 text-rose-800 font-bold rounded-md text-[10px]">
                              {s}
                            </span>
                          ))}
                          {(appMatchData?.matchAnalysis?.missingRequiredSkills || []).length === 0 && (
                            <span className="text-emerald-700 font-bold text-xs">All required skills matched ✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Decision Action Buttons Footer */}
            <div className="pt-4 border-t border-slate-150 flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleUpdateStatus(selectedApp.id, 'REJECTED')}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Decline Application
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedApp.id, 'SHORTLISTED')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Hold / Shortlist
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setOfferApp(selectedApp);
                    setShowOfferModal(true);
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center space-x-1.5 uppercase tracking-wide"
                >
                  <DollarSign className="h-4 w-4" />
                  <span>Authorize & Issue Offer</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Offer Letter Drafting Modal */}
      {showOfferModal && offerApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-200">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Extend Formal Offer</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Candidate: <strong className="text-slate-700">{getCandidateDisplayName(offerApp)}</strong></p>
              </div>
              <button
                onClick={() => setShowOfferModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSendOffer} className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Base Salary Package</label>
                  <input
                    type="text"
                    required
                    value={offerSalary}
                    onChange={(e) => setOfferSalary(e.target.value)}
                    placeholder="e.g. $135,000 / year"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Target Start Date</label>
                  <input
                    type="date"
                    required
                    value={offerJoiningDate}
                    onChange={(e) => setOfferJoiningDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Location / Mode</label>
                  <input
                    type="text"
                    required
                    value={offerLocation}
                    onChange={(e) => setOfferLocation(e.target.value)}
                    placeholder="e.g. Remote / San Francisco"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Employment Type</label>
                  <select
                    value={offerType}
                    onChange={(e) => setOfferType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-800 font-bold"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="INTERN">Internship</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Assigned Benefits & Perks</label>
                <textarea
                  required
                  rows="3"
                  value={offerBenefits}
                  onChange={(e) => setOfferBenefits(e.target.value)}
                  placeholder='["Health Insurance", "401(k) Match", "Stock Options"]'
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-800 font-mono text-[11px]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingOffer}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2 rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  {sendingOffer && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                  <span>Issue Formal Offer</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default HiringManagerDashboard;
