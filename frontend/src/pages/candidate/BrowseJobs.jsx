import React, { useState, useEffect } from 'react';
import apiFetch from '../../services/api';
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Search, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight,
  BookOpen,
  Award,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

const BrowseJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const jobsData = await apiFetch('/api/jobs');
      setJobs(Array.isArray(jobsData) ? jobsData.filter(j => j.status === 'ACTIVE') : []);
      
      try {
        const appsData = await apiFetch('/api/assessments/my-applications');
        setApplications(Array.isArray(appsData) ? appsData : []);
      } catch (e) {
        setApplications([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (jobId) => {
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch(`/api/jobs/${jobId}/apply`, {
        method: 'POST'
      });
      setSuccess(res.message || 'Applied successfully!');
      fetchData(); // Refresh list to update apply status
      // Automatically highlight/select the applied job to view update
      if (selectedJob && selectedJob.id === jobId) {
        const updatedJobs = await apiFetch('/api/jobs');
        const refreshedJob = updatedJobs.find(j => j.id === jobId);
        setSelectedJob(refreshedJob);
      }
    } catch (err) {
      setError(err.message || 'Application submission failed.');
    }
  };

  const isApplied = (jobId) => {
    return applications.some(app => 
      (app.jobId && app.jobId.toString() === jobId.toString()) || 
      (app.job && (app.job.id === jobId || app.job._id === jobId))
    );
  };

  const getApplication = (jobId) => {
    return applications.find(app => 
      (app.jobId && app.jobId.toString() === jobId.toString()) || 
      (app.job && (app.job.id === jobId || app.job._id === jobId))
    );
  };

  const filteredJobs = jobs.filter(job => {
    const query = searchQuery.toLowerCase();
    return (
      job.title?.toLowerCase().includes(query) ||
      job.company?.toLowerCase().includes(query) ||
      job.location?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Browse Active Positions</h1>
        <p className="text-sm text-slate-500">Explore parsed career opportunities and view real-time match compatibility intelligence</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          placeholder="Search by role, company, or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-xs"
        />
      </div>

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center bg-white rounded-xl border border-slate-200/60 shadow-xs">
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <span className="text-sm text-slate-500 font-semibold">Loading job listings...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* JobList Pane */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Positions Available ({filteredJobs.length})</h3>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredJobs.map((job) => {
                const applied = isApplied(job.id);
                const app = getApplication(job.id);
                const isSelected = selectedJob && selectedJob.id === job.id;

                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`p-4 border rounded-xl bg-white shadow-xs hover:shadow-md transition-all cursor-pointer ${
                      isSelected ? 'border-indigo-600 ring-2 ring-indigo-50/50' : 'border-slate-200/60'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{job.title}</h4>
                        <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block mt-0.5">{job.company}</span>
                      </div>
                      
                      {applied && (
                        <span className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                          Applied
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center space-x-3 text-xs text-slate-400 font-semibold">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>{job.salary}</span>
                      </div>
                    </div>

                    {applied && app && app.matchScore > 0 && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-400">Match score:</span>
                        <span className="text-indigo-600">{app.matchScore}%</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredJobs.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200/60 p-6 text-slate-400 space-y-2">
                  <Briefcase className="h-8 w-8 mx-auto text-slate-200" />
                  <p className="text-xs">No active positions matching search query.</p>
                </div>
              )}
            </div>
          </div>

          {/* Job Details / Analysis Panel */}
          <div className="lg:col-span-2">
            {selectedJob ? (
              <div className="bg-white rounded-xl border border-slate-200/60 p-6 space-y-6 shadow-xs">
                
                {/* Header */}
                <div className="flex justify-between items-start flex-wrap gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedJob.title}</h2>
                    <span className="text-sm text-indigo-600 font-bold">{selectedJob.company}</span>
                  </div>
                  
                  {isApplied(selectedJob.id) ? (
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center space-x-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg">
                        <CheckCircle className="h-4 w-4" />
                        <span>Applied ({getApplication(selectedJob.id).status})</span>
                      </span>
                      <Link
                        to="/candidate"
                        className="inline-flex items-center space-x-1 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                      >
                        <span>View Pipeline</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleApply(selectedJob.id)}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      Apply for Position
                    </button>
                  )}
                </div>

                {/* Job Specs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block font-semibold">Location</span>
                    <strong className="text-slate-800 text-sm mt-0.5 block">{selectedJob.location}</strong>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block font-semibold">Employment Type</span>
                    <strong className="text-slate-800 text-sm mt-0.5 block">{selectedJob.employmentType || 'Full-time'}</strong>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block font-semibold">Experience Required</span>
                    <strong className="text-slate-800 text-sm mt-0.5 block">{selectedJob.experienceYears} Years</strong>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block font-semibold">Compensation</span>
                    <strong className="text-slate-800 text-sm mt-0.5 block">{selectedJob.salary}</strong>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 text-sm">Description</h4>
                  <p className="text-xs text-slate-500 leading-relaxed white-space-pre-wrap">{selectedJob.description}</p>
                </div>

                {/* AI Requirement analysis (only if available) */}
                {selectedJob.analysis && (
                  <div className="border-t border-slate-150 pt-5 space-y-5">
                    <div className="flex items-center space-x-1.5">
                      <Sparkles className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
                      <h4 className="font-bold text-slate-800 text-sm">Explainable AI Analysis Summary</h4>
                    </div>

                    <p className="p-3 bg-indigo-50 text-indigo-800 rounded-lg text-xs leading-relaxed">
                      {selectedJob.analysis.summary}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Required skills */}
                      <div className="space-y-2.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Required Skills</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedJob.analysis.requiredSkills && selectedJob.analysis.requiredSkills.map((s, idx) => (
                            <span key={idx} className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-md">
                              <Award className="h-3.5 w-3.5 text-indigo-500" />
                              <span>{s}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Technologies */}
                      <div className="space-y-2.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Technologies</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedJob.analysis.technologies && selectedJob.analysis.technologies.map((t, idx) => (
                            <span key={idx} className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-md">
                              <span>{t}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="min-h-[400px] flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200/60 p-8 text-center shadow-xs">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full mb-3">
                  <Briefcase className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Select a position</h3>
                <p className="text-xs text-slate-450 mt-1 max-w-xs">
                  Click on any active position in the left list panel to review detailed requirements and AI matchmaking criteria.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseJobs;
