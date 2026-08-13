import React, { useState, useEffect } from 'react';
import apiFetch from '../../services/api';
import { 
  Search, 
  Filter, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Clock, 
  Shield, 
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const AuditLogsTable = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 15;

  // Filters state
  const [searchEmail, setSearchEmail] = useState('');
  const [action, setAction] = useState('');
  const [role, setRole] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Expandable rows state
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchEmail && { searchEmail }),
        ...(action && { action }),
        ...(role && { role }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });

      const res = await apiFetch(`/api/admin/audit-logs?${queryParams.toString()}`);
      setLogs(res.logs || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, action, role]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSearchEmail('');
    setAction('');
    setRole('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    // Timeout to ensure state updates apply before fetching
    setTimeout(fetchLogs, 0);
  };

  const getActionBadge = (act) => {
    if (act.includes('LOGIN')) {
      return 'bg-slate-100 text-slate-700 border-slate-200';
    }
    if (act.includes('CREATE') || act.includes('ADD') || act.includes('SCHEDULE')) {
      return 'bg-blue-50 text-blue-700 border-blue-100';
    }
    if (act.includes('ACCEPT') || act.includes('SUBMIT') || act.includes('VERIFIED')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
    if (act.includes('TOGGLE')) {
      return 'bg-amber-50 text-amber-700 border-amber-100';
    }
    return 'bg-rose-50 text-rose-700 border-rose-100';
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Filters matrix */}
      <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-600">
            
            {/* Search by actor email */}
            <div className="space-y-1 md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Actor Email Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by full or partial email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Filter by Role */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Actor Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-805"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="RECRUITER">Recruiter</option>
                <option value="HIRING_MANAGER">Hiring Manager</option>
                <option value="INTERVIEWER">Interviewer</option>
                <option value="CANDIDATE">Candidate</option>
              </select>
            </div>

            {/* Action types */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Action Type</label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-805"
              >
                <option value="">All Actions</option>
                <option value="USER_LOGIN">User Login</option>
                <option value="CREATE_JOB">Create Job</option>
                <option value="CREATE_OFFER">Create Offer</option>
                <option value="ACCEPT_OFFER">Accept Offer</option>
                <option value="DECLINE_OFFER">Decline Offer</option>
                <option value="CREATE_ROADMAP">Create Roadmap</option>
                <option value="TOGGLE_ROADMAP_TASK">Toggle Roadmap Task</option>
                <option value="SCHEDULE_INTERVIEW">Schedule Interview</option>
                <option value="SUBMIT_FEEDBACK">Submit Interview Feedback</option>
              </select>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-600">
            {/* Start Date */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Start Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 rounded-lg text-slate-800"
                />
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">End Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 rounded-lg text-slate-800"
                />
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Buttons */}
            <div className="md:col-span-2 flex items-end justify-end space-x-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer"
              >
                Reset
              </button>
              <button
                type="submit"
                className="bg-indigo-650 hover:bg-indigo-755 text-white font-bold px-6 py-2 rounded-lg shadow-xs hover:shadow-md cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Streaming security logs...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 text-[10px]">
                  <th className="p-4 w-10"></th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Resource Info</th>
                  <th className="p-4">Result</th>
                  <th className="p-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-650">
                {logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const formattedTime = new Date(log.timestamp).toLocaleString();
                  const actorName = log.user ? log.user.name : 'System';
                  const actorEmail = log.user ? log.user.email : 'system@hiremind.ai';

                  return (
                    <React.Fragment key={log.id}>
                      <tr 
                        className={`hover:bg-slate-50/50 cursor-pointer ${isExpanded ? 'bg-indigo-50/10' : ''}`}
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      >
                        <td className="p-4 text-center">
                          {isExpanded ? (
                            <ChevronUp className="h-4.5 w-4.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4.5 w-4.5 text-slate-400" />
                          )}
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{actorName}</p>
                            <span className="text-[10px] text-slate-400">{actorEmail}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {log.user?.role || 'SYSTEM'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${getActionBadge(log.action)}`}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-4 truncate max-w-xs text-slate-500">
                          {log.resource}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            log.result === 'SUCCESS' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {log.result}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 font-medium">
                          <div className="flex items-center space-x-1.5 whitespace-nowrap">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{formattedTime}</span>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Raw Details */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="7" className="p-4.5 bg-slate-50 border-t border-b border-slate-150">
                            <div className="space-y-3">
                              <h4 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                                <Shield className="h-4 w-4 text-indigo-500" />
                                <span>Security Event Details</span>
                              </h4>
                              
                              <div className="bg-white rounded-lg border border-slate-200 p-4 font-mono text-[10px] text-slate-700 leading-relaxed overflow-x-auto space-y-2.5">
                                <p><span className="font-bold text-slate-500 uppercase tracking-wide mr-2">Event ID:</span> {log.id}</p>
                                <p><span className="font-bold text-slate-500 uppercase tracking-wide mr-2">Operation:</span> {log.action}</p>
                                <p><span className="font-bold text-slate-500 uppercase tracking-wide mr-2">Resource:</span> {log.resource}</p>
                                <p><span className="font-bold text-slate-500 uppercase tracking-wide mr-2">Actor UUID:</span> {log.userId || 'SYSTEM_DAEMON'}</p>
                                <p><span className="font-bold text-slate-500 uppercase tracking-wide mr-2">Audit Timestamp:</span> {log.timestamp}</p>
                                <p><span className="font-bold text-slate-500 uppercase tracking-wide mr-2">Result Metric:</span> {log.result}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {!loading && logs.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-slate-400 italic font-semibold">
                      No security audit events recorded matching current filter matrices.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {!loading && totalPages > 1 && (
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">
              Showing logs <span className="font-bold text-slate-800">{((page - 1) * limit) + 1}</span> to{' '}
              <span className="font-bold text-slate-800">{Math.min(page * limit, total)}</span> of{' '}
              <span className="font-bold text-slate-800">{total}</span> events
            </span>

            <div className="flex items-center space-x-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-650 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-slate-800">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-650 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AuditLogsTable;
