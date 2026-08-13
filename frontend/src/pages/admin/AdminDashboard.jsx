import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiFetch from '../../services/api';
import AuditLogsTable from '../../components/admin/AuditLogsTable';
import { 
  Settings, 
  LogOut, 
  Users, 
  Briefcase, 
  Award, 
  TrendingUp, 
  FileText, 
  BookOpen, 
  Activity, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  AlertCircle
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState('analytics'); // analytics or audit
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Analytics Data state
  const [stats, setStats] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/admin/analytics');
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load system analytics metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab]);

  if (loading && activeTab === 'analytics') {
    return (
      <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-650 animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Analyzing corporate hiring funnels...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7FB]">
      
      {/* Top Banner Navigation Bar */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-black uppercase tracking-wider text-white">HireMind AI</h1>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Admin Control Center</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white">{user?.name}</p>
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Super Administrator</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-lg text-xs transition-colors cursor-pointer border border-slate-700"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-250 gap-4">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeTab === 'analytics' 
                ? 'border-indigo-650 text-indigo-650' 
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Analytics Insights
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeTab === 'audit' 
                ? 'border-indigo-650 text-indigo-650' 
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Immutable Audit logs
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Pages */}
        {activeTab === 'analytics' && stats && (
          <div className="space-y-8">
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Active Roles */}
              <div className="bg-white p-5 border border-slate-200/60 rounded-xl shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase">Active Positions</p>
                  <h3 className="text-xl font-black text-slate-900">{stats.jobWiseStats?.length || 0}</h3>
                </div>
              </div>

              {/* Card 2: Hired Conversion */}
              <div className="bg-white p-5 border border-slate-200/60 rounded-xl shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase">Hiring Funnel Rate</p>
                  <h3 className="text-xl font-black text-slate-900">{stats.funnelConversion?.overallHiresConversion || 0}%</h3>
                </div>
              </div>

              {/* Card 3: Avg Coding Grade */}
              <div className="bg-white p-5 border border-slate-200/60 rounded-xl shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase">Avg Challenge Score</p>
                  <h3 className="text-xl font-black text-slate-900">{stats.assessmentStats?.averageCodingScore || 0}%</h3>
                </div>
              </div>

              {/* Card 4: Roadmap Completed Tasks */}
              <div className="bg-white p-5 border border-slate-200/60 rounded-xl shadow-xs flex items-center space-x-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase">Upskilling Completed</p>
                  <h3 className="text-xl font-black text-slate-900">{stats.roadmapStats?.completionRate || 0}%</h3>
                </div>
              </div>

            </div>

            {/* Funnel & Conversion Rates Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Funnel Graph/Bar charts */}
              <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-xs lg:col-span-2 space-y-5">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-3">
                  <Activity className="h-4.5 w-4.5 text-indigo-650" />
                  <span>Stage-to-Stage Conversion Funnel</span>
                </h3>

                <div className="space-y-4 font-semibold text-slate-650 text-xs">
                  {[
                    { label: 'Applied to Screening', val: stats.funnelConversion?.appliedToScreening, color: 'bg-indigo-500' },
                    { label: 'Screening to Shortlisted', val: stats.funnelConversion?.screeningToShortlisted, color: 'bg-blue-500' },
                    { label: 'Shortlisted to Interview', val: stats.funnelConversion?.shortlistedToInterview, color: 'bg-purple-500' },
                    { label: 'Interview to Assessment', val: stats.funnelConversion?.interviewToAssessment, color: 'bg-pink-500' },
                    { label: 'Assessment to Offer', val: stats.funnelConversion?.assessmentToOffer, color: 'bg-amber-500' },
                    { label: 'Offer to Hired', val: stats.funnelConversion?.offerToHired, color: 'bg-emerald-500' }
                  ].map((f, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span>{f.label}</span>
                        <span className="font-bold text-slate-900">{f.val}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${f.color} transition-all duration-500`}
                          style={{ width: `${f.val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Offer Acceptance & Upskilling Pie stats */}
              <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-xs space-y-6">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center space-x-1.5">
                    <FileText className="h-4.5 w-4.5 text-emerald-600" />
                    <span>Offer Acceptance Statistics</span>
                  </h3>
                  <div className="pt-3 space-y-2.5 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-500">Sent Offers:</span>
                      <span className="text-slate-800">{stats.offerStats?.SENT || 0}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-500">Accepted Offers:</span>
                      <span className="text-slate-850">{stats.offerStats?.ACCEPTED || 0}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-500">Declined Offers:</span>
                      <span className="text-slate-800">{stats.offerStats?.REJECTED || 0}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between font-black text-indigo-650">
                      <span>Acceptance Conversion:</span>
                      <span>{stats.offerStats?.acceptanceRate || 0}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center space-x-1.5">
                    <BookOpen className="h-4.5 w-4.5 text-amber-500" />
                    <span>Upskilling Timeline Stats</span>
                  </h3>
                  <div className="pt-3 space-y-2.5 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-500">Total Study Tasks:</span>
                      <span className="text-slate-850">{stats.roadmapStats?.totalTasks || 0}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-500">Tasks Completed:</span>
                      <span className="text-slate-850">{stats.roadmapStats?.completedTasks || 0}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between font-black text-indigo-650">
                      <span>Roadmap Success Rate:</span>
                      <span>{stats.roadmapStats?.completionRate || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Score Distributions comparison block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Match Score distribution */}
              <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-xs space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Candidate Match Score distribution</h4>
                <div className="space-y-2 text-xs font-semibold text-slate-650">
                  {Object.entries(stats.scoreDistribution?.match || {}).map(([bin, count]) => (
                    <div key={bin} className="flex items-center gap-3">
                      <span className="w-14 text-slate-500 font-bold">{bin.replace('_', '-')}</span>
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600" style={{ width: `${count > 0 ? (count / Math.max(1, Object.values(stats.scoreDistribution.match).reduce((a, b) => a + b, 0))) * 100 : 0}%` }} />
                      </div>
                      <span className="w-6 text-right font-bold text-slate-800">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Readiness Score distribution */}
              <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-xs space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Candidate Readiness Score distribution</h4>
                <div className="space-y-2 text-xs font-semibold text-slate-650">
                  {Object.entries(stats.scoreDistribution?.readiness || {}).map(([bin, count]) => (
                    <div key={bin} className="flex items-center gap-3">
                      <span className="w-14 text-slate-500 font-bold">{bin.replace('_', '-')}</span>
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600" style={{ width: `${count > 0 ? (count / Math.max(1, Object.values(stats.scoreDistribution.readiness).reduce((a, b) => a + b, 0))) * 100 : 0}%` }} />
                      </div>
                      <span className="w-6 text-right font-bold text-slate-800">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Jobs Performance Data Table */}
            <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Active Job Pipeline Analytics</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-150 uppercase text-[10px]">
                      <th className="p-3.5">Position</th>
                      <th className="p-3.5">Company</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-center">Applications</th>
                      <th className="p-3.5 text-center">Offers Sent</th>
                      <th className="p-3.5 text-center">Hires</th>
                      <th className="p-3.5 text-center">Avg Match</th>
                      <th className="p-3.5 text-center">Avg Readiness</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-650">
                    {stats.jobWiseStats?.map((job) => (
                      <tr key={job.jobId} className="hover:bg-slate-50/50">
                        <td className="p-3.5 font-bold text-slate-900">{job.title}</td>
                        <td className="p-3.5 text-slate-500">{job.company}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                            job.status === 'ACTIVE' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-center text-slate-900 font-black">{job.totalApplications}</td>
                        <td className="p-3.5 text-center text-slate-700">{job.offersSent}</td>
                        <td className="p-3.5 text-center text-emerald-600 font-black">{job.hiresCompleted}</td>
                        <td className="p-3.5 text-center text-indigo-650 font-black">{job.averageMatchScore}%</td>
                        <td className="p-3.5 text-center text-emerald-650 font-black">{job.averageReadinessScore}%</td>
                      </tr>
                    ))}

                    {stats.jobWiseStats?.length === 0 && (
                      <tr>
                        <td colSpan="8" className="p-8 text-center text-slate-400 italic">
                          No active positions found in database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'audit' && (
          <AuditLogsTable />
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;
