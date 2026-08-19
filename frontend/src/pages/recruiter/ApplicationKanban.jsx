import React, { useState, useEffect } from 'react';
import apiFetch from '../../services/api';
import { 
  Loader2, 
  AlertCircle, 
  Layers, 
  MapPin, 
  Clock, 
  CheckSquare, 
  MoreVertical,
  ChevronRight,
  TrendingUp,
  Brain
} from 'lucide-react';

const COLUMNS = [
  { name: 'Applied', status: 'APPLIED' },
  { name: 'Screening', status: 'SCREENING' },
  { name: 'Assessments', status: 'ASSESSMENT' },
  { name: 'Shortlisted', status: 'SHORTLISTED' },
  { name: 'Technical Interview', status: 'INTERVIEW' },
  { name: 'Offer Letter', status: 'OFFER' },
  { name: 'Hired', status: 'HIRED' },
  { name: 'Rejected', status: 'REJECTED' }
];

const ApplicationKanban = () => {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draggingId, setDraggingId] = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const apps = await apiFetch('/api/jobs/applications/all');
      setApplications(apps);

      const jobsData = await apiFetch('/api/jobs');
      setJobs(jobsData);
    } catch (err) {
      setError(err.message || 'Failed to load recruitment applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggingId(id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    
    await transitionStage(id, targetStatus);
  };

  const transitionStage = async (appId, targetStatus) => {
    try {
      const response = await apiFetch(`/api/jobs/applications/${appId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: targetStatus })
      });
      
      // Update local state
      setApplications(prev => prev.map(app => {
        if (app.id === appId) {
          return { ...app, status: targetStatus };
        }
        return app;
      }));
    } catch (err) {
      alert(err.message || 'Failed to update application stage.');
    }
  };

  const getFilteredApps = () => {
    if (selectedJobId === 'ALL') return applications;
    return applications.filter(app => app.jobId === selectedJobId);
  };

  const filteredApps = getFilteredApps();

  return (
    <div className="space-y-6">
      {/* Header & Job Filter Dropdown */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Layers className="h-6 w-6 text-indigo-650" />
            <span>Hiring Pipeline Workspace</span>
          </h1>
          <p className="text-sm text-slate-500">Drag & drop candidates between evaluation columns or use menu selectors to transition stages.</p>
        </div>

        <div className="flex items-center space-x-2.5">
          <label htmlFor="job-filter" className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Filter Job:</label>
          <select
            id="job-filter"
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="form-select text-xs font-bold bg-white border border-slate-200 rounded-lg p-2 max-w-xs focus:ring-indigo-500"
          >
            <option value="ALL">All Active Roles</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>{job.title} ({job.company})</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-250 text-rose-700 rounded-lg text-sm flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="min-h-[400px] flex items-center justify-center bg-white border border-slate-200/60 rounded-xl shadow-xs">
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <span className="text-sm text-slate-550 font-medium">Loading candidate pipelines...</span>
          </div>
        </div>
      ) : (
        /* Kanban columns horizontally scrollable board */
        <div className="kanban-board-container pb-4">
          {COLUMNS.map(col => {
            const columnApps = filteredApps.filter(app => (app.status || 'APPLIED').toUpperCase() === col.status);
            
            return (
              <div 
                key={col.status}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.status)}
                className="kanban-column"
              >
                {/* Column Title and Count */}
                <div className="kanban-column-header">
                  <span className="kanban-column-title truncate">{col.name}</span>
                  <span className="kanban-column-badge">{columnApps.length}</span>
                </div>

                {/* Cards Container wrapper */}
                <div className="kanban-cards-wrapper">
                  {columnApps.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center border border-dashed border-slate-350 rounded-xl p-4 text-center min-h-[150px]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Drop Candidates Here</span>
                    </div>
                  ) : (
                    columnApps.map(app => {
                      const isDragging = draggingId === app.id;
                      const initials = app.candidate?.name ? app.candidate.name.charAt(0) : 'C';
                      const isMenuOpen = actionMenuId === app.id;
                      
                      return (
                        <div
                          key={app.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, app.id)}
                          onDragEnd={handleDragEnd}
                          className={`kanban-card ${isDragging ? 'kanban-card-dragging' : ''}`}
                        >
                          <div className="flex justify-between items-start gap-1">
                            <div className="flex items-center space-x-2 truncate">
                              <div className="h-7 w-7 rounded-full bg-indigo-50 text-indigo-650 flex items-center justify-center text-[10px] font-bold">
                                {initials}
                              </div>
                              <div className="truncate">
                                <h4 className="font-extrabold text-slate-900 text-xs tracking-tight leading-tight">{app.candidate?.name}</h4>
                                <span className="text-[9px] text-slate-400 font-semibold">{app.candidate?.email}</span>
                              </div>
                            </div>

                            {/* Dropdown Menu actions */}
                            <div className="relative">
                              <button 
                                onClick={() => setActionMenuId(isMenuOpen ? null : app.id)}
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 bg-transparent border-0 cursor-pointer"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </button>
                              {isMenuOpen && (
                                <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-md z-40 py-1 text-[10px] font-semibold text-slate-700">
                                  <div className="px-2 py-1 text-[8px] uppercase tracking-wider text-slate-400 border-b border-slate-100">Move to column:</div>
                                  {COLUMNS.map(c => {
                                    if (c.status === app.status) return null;
                                    return (
                                      <button
                                        key={c.status}
                                        onClick={() => {
                                          transitionStage(app.id, c.status);
                                          setActionMenuId(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-650 bg-transparent border-0 cursor-pointer"
                                      >
                                        {c.name}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Info specs */}
                          <div className="mt-3.5 space-y-1.5 text-[10px] font-semibold text-slate-500">
                            <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded border border-slate-100">
                              <span className="text-slate-400 font-bold uppercase text-[8px]">Job:</span>
                              <span className="text-slate-800 truncate font-extrabold max-w-[120px]">{app.job?.title}</span>
                            </div>

                            <div className="flex justify-between items-center text-slate-600">
                              <div className="flex items-center space-x-1">
                                <Brain className="h-3 w-3 text-indigo-500" />
                                <span>Match:</span>
                              </div>
                              <span className="font-bold text-indigo-650">{app.matchScore}%</span>
                            </div>

                            <div className="flex justify-between items-center text-slate-600">
                              <div className="flex items-center space-x-1">
                                <TrendingUp className="h-3 w-3 text-emerald-500" />
                                <span>Readiness:</span>
                              </div>
                              <span className="font-bold text-emerald-600">{app.readinessScore}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApplicationKanban;
