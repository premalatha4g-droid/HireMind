import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import apiFetch from '../../services/api';
import { 
  Briefcase, 
  Users, 
  Calendar, 
  FileCheck, 
  Plus, 
  TrendingUp, 
  Shield, 
  ArrowRight,
  Loader2,
  AlertTriangle,
  Award,
  Zap,
  Sparkles
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

const RecruiterDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [jobs, setJobs] = useState([]);
  const [dbStats, setDbStats] = useState({
    totalJobs: 0,
    totalApplications: 0,
    strongMatches: 0,
    highReadiness: 0,
    needsVerification: 0,
    pipeline: {
      APPLIED: 0,
      SCREENING: 0,
      SHORTLISTED: 0,
      INTERVIEW: 0,
      ASSESSMENT: 0,
      OFFER: 0,
      HIRED: 0,
      REJECTED: 0
    },
    confidenceDist: {
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    }
  });

  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch recent jobs
      const jobsData = await apiFetch('/api/jobs');
      setJobs(jobsData.slice(0, 3)); // Top 3 recent jobs

      // 2. Fetch dashboard stats
      const statsData = await apiFetch('/api/readiness/dashboard-stats');
      setDbStats(statsData);

      // 3. Load user 2FA state from backend fresh check
      const freshUser = await apiFetch('/api/auth/me');
      setIs2FAEnabled(!!freshUser.user?.is2FAEnabled);
      localStorage.setItem('hiremind_user', JSON.stringify(freshUser.user));
    } catch (err) {
      console.error('Failed to load recruiter analytics:', err);
      setError('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggle2FA = async () => {
    try {
      const res = await apiFetch('/api/auth/2fa/toggle', { method: 'POST' });
      setIs2FAEnabled(res.is2FAEnabled);
      alert(`Two-Factor Authentication ${res.is2FAEnabled ? 'ENABLED' : 'DISABLED'} successfully.`);
    } catch (e) {
      alert('Failed to toggle 2FA settings.');
    }
  };

  // Format Recharts Pipeline Funnel Data
  const funnelData = [
    { name: 'Applied', count: dbStats.pipeline.APPLIED || 0, fill: '#6366f1' },
    { name: 'Screening', count: dbStats.pipeline.SCREENING || 0, fill: '#4f46e5' },
    { name: 'Shortlisted', count: dbStats.pipeline.SHORTLISTED || 0, fill: '#4338ca' },
    { name: 'Interview', count: dbStats.pipeline.INTERVIEW || 0, fill: '#3730a3' },
    { name: 'Assessment', count: dbStats.pipeline.ASSESSMENT || 0, fill: '#312e81' },
    { name: 'Offer', count: dbStats.pipeline.OFFER || 0, fill: '#10b981' },
    { name: 'Hired', count: dbStats.pipeline.HIRED || 0, fill: '#059669' }
  ];

  // Format Confidence Pie Chart Data
  const confidenceData = [
    { name: 'High Confidence', value: dbStats.confidenceDist.HIGH || 0, color: '#10b981' },
    { name: 'Medium Confidence', value: dbStats.confidenceDist.MEDIUM || 0, color: '#f59e0b' },
    { name: 'Low Confidence (Claims)', value: dbStats.confidenceDist.LOW || 0, color: '#ef4444' }
  ].filter(item => item.value > 0);

  const cardData = [
    { 
      title: 'Active Jobs', 
      value: dbStats.totalJobs, 
      subtitle: 'Published descriptions', 
      icon: Briefcase, 
      color: 'text-indigo-600 bg-indigo-50' 
    },
    { 
      title: 'Strong Matches', 
      value: dbStats.strongMatches, 
      subtitle: 'Match Score ≥ 80%', 
      icon: Award, 
      color: 'text-emerald-600 bg-emerald-50' 
    },
    { 
      title: 'High Readiness', 
      value: dbStats.highReadiness, 
      subtitle: 'Evidence Score ≥ 75%', 
      icon: Zap, 
      color: 'text-indigo-500 bg-indigo-50' 
    },
    { 
      title: 'Needs Verification', 
      value: dbStats.needsVerification, 
      subtitle: 'Claims requiring human-audit', 
      icon: AlertTriangle, 
      color: dbStats.needsVerification > 0 ? 'text-amber-600 bg-amber-50 animate-pulse' : 'text-slate-400 bg-slate-50' 
    }
  ];

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Aggregating platform intelligence metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Talent Intelligence Dashboard</h1>
          <p className="text-sm text-slate-500 font-medium">Evidence-first candidate tracking and qualification verification metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <RouterLink
            to="/recruiter/jobs/create"
            className="inline-flex items-center space-x-2 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Create New Job</span>
          </RouterLink>
        </div>
      </div>

      {/* Philosophy Banner */}
      <div className="bg-indigo-900 rounded-xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-indigo-300" />
            <h3 className="font-bold text-sm tracking-wide uppercase text-indigo-300">Responsible AI Engine Governance</h3>
          </div>
          <p className="text-xs text-indigo-100 max-w-xl leading-relaxed">
            AI-assisted ranking uses job-relevant qualifications, experience, projects, certifications, and assessment evidence. Sensitive demographic attributes are excluded from ranking inputs. Final hiring decisions remain with authorized human reviewers.
          </p>
        </div>
        <span className="text-[10px] font-extrabold bg-indigo-800 border border-indigo-700 text-indigo-200 px-3.5 py-2 rounded-full uppercase tracking-wider whitespace-nowrap">
          AI Assists. Humans Decide.
        </span>
      </div>

      {/* 2FA Settings Card Banner */}
      <div className="bg-white rounded-xl border border-slate-200/60 p-5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Shield className="h-5.5 w-5.5 text-indigo-600" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Two-Factor Authentication (2FA)</h4>
            <p className="text-xs text-slate-500">Enable OTP-based logins for enhanced Recruiter dashboard protection.</p>
          </div>
        </div>
        <button
          onClick={handleToggle2FA}
          className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
            is2FAEnabled 
              ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
          }`}
        >
          {is2FAEnabled ? 'Disable 2FA Session' : 'Enable 2FA Protection'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-center space-x-2 shadow-xs">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardData.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className="bg-white rounded-tr-2xl rounded-bl-2xl rounded-tl-lg rounded-br-lg border border-slate-200/65 p-5 flex flex-col justify-between min-h-[145px] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
            >
              {/* Handcrafted background offset circle indicator */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-full translate-x-4 -translate-y-4 group-hover:scale-125 transition-transform duration-300 z-0" />
              
              <div className="flex justify-between items-start z-10">
                <div className="space-y-1 truncate pr-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{card.title}</span>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">{card.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${card.color} flex-shrink-0 z-10`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 z-10 flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                <span>{card.subtitle}</span>
                {/* Visual arrow indicating custom design */}
                <span className="text-indigo-600 group-hover:translate-x-1.5 transition-transform duration-200">➔</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline conversion */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/60 p-6 shadow-xs">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Active Candidate Pipeline</h3>
              <p className="text-xs text-slate-500">Recruiter status stages breakdown</p>
            </div>
            <span className="inline-flex items-center space-x-1 text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-md">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Real-Time Audits</span>
            </span>
          </div>
          <div className="h-64">
            {dbStats.totalApplications === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                No active candidates registered in the pipeline.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={80} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ background: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Evidence Confidence Pie Chart */}
        <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-xs flex flex-col">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Evidence Confidence Distribution</h3>
            <p className="text-xs text-slate-500">Audit-readiness of claimed skills</p>
          </div>
          <div className="h-56 flex items-center justify-center relative">
            {confidenceData.length === 0 ? (
              <div className="text-xs text-slate-400 italic text-center">
                No verified skills cataloged.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={confidenceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {confidenceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          
          <div className="flex flex-col space-y-1.5 mt-auto pt-3 border-t border-slate-50 text-[10px]">
            {confidenceData.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center font-semibold text-slate-600">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <span className="font-extrabold text-slate-800">{item.value} evidence tags</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Jobs list */}
      <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-xs">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Recent Active Jobs</h3>
            <p className="text-xs text-slate-500">Pipeline match controls</p>
          </div>
          <RouterLink 
            to="/recruiter/jobs" 
            className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <span>Manage listings</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </RouterLink>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 italic text-xs">
            No job descriptions created yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div key={job.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col justify-between space-y-4 hover:shadow-xs transition-shadow">
                <div>
                  <h4 className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">{job.title}</h4>
                  <span className="text-[10px] text-slate-400 font-bold tracking-wide uppercase mt-0.5 block">{job.company}</span>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${
                    job.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {job.status === 'ACTIVE' ? 'Active' : 'Draft'}
                  </span>
                  
                  {job.status === 'ACTIVE' && (
                    <RouterLink
                      to={`/recruiter/jobs/${job.id}/matches`}
                      className="inline-flex items-center space-x-1 text-[10px] font-extrabold text-indigo-600 hover:text-indigo-800"
                    >
                      <span>Verify Matches</span>
                      <ArrowRight className="h-3 w-3" />
                    </RouterLink>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterDashboard;
