import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiFetch from '../../services/api';
import { Plus, Trash2, Edit, ExternalLink, Calendar, Briefcase, MapPin, Loader2, AlertCircle, Terminal } from 'lucide-react';

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/jobs');
      setJobs(data);
    } catch (err) {
      setError(err.message || 'Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the job listing for "${title}"?`)) {
      return;
    }
    
    try {
      await apiFetch(`/api/jobs/${id}`, {
        method: 'DELETE'
      });
      setJobs(jobs.filter(job => job.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete job.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job Listings</h1>
          <p className="text-sm text-slate-500">Create, analyze, and manage active and draft job descriptions</p>
        </div>
        <Link
          to="/recruiter/jobs/create"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Create New Job</span>
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="min-h-[250px] flex items-center justify-center bg-white rounded-xl border border-slate-100 shadow-xs">
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <span className="text-sm text-slate-500 font-medium">Fetching job listings...</span>
          </div>
        </div>
      ) : jobs.length === 0 ? (
        /* Empty state */
        <div className="min-h-[250px] flex flex-col items-center justify-center bg-white rounded-xl border border-slate-100 p-8 text-center shadow-xs">
          <div className="p-3 bg-slate-50 text-slate-400 rounded-full mb-3">
            <Briefcase className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Job Listings Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            Get started by creating a job listing and analyzing it with HireMind AI.
          </p>
          <Link
            to="/recruiter/jobs/create"
            className="mt-4 inline-flex items-center space-x-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Job</span>
          </Link>
        </div>
      ) : (
        /* Table / Cards Grid */
        <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Role & Company
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Location & Type
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Skills Required
                  </th>
                  <th scope="col" className="px-6 py-3.5 scope text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100 text-sm">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{job.title}</div>
                      <div className="text-xs text-slate-500 font-medium">{job.company}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-slate-600 text-xs gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span>{job.location}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                        {job.employmentType.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {job.skills && job.skills.length > 0 ? (
                          job.skills.map((skill, idx) => (
                            <span 
                              key={idx}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                skill.isRequired 
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {skill.skillName}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No skills mapped</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        job.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {job.status === 'ACTIVE' ? 'Active / Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap text-slate-500 font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        {job.status === 'ACTIVE' && (
                          <Link 
                            to={`/recruiter/jobs/${job.id}/matches`}
                            className="text-indigo-600 hover:text-indigo-800 p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
                            title="Match Intelligence"
                          >
                            <ExternalLink className="h-4.5 w-4.5" />
                          </Link>
                        )}
                        {job.status === 'ACTIVE' && (
                          <Link 
                            to={`/recruiter/jobs/${job.id}/assessment/edit`}
                            className="text-slate-600 hover:text-indigo-600 p-1.5 rounded-md hover:bg-slate-150 transition-colors"
                            title="Configure Coding Assessment"
                          >
                            <Terminal className="h-4.5 w-4.5" />
                          </Link>
                        )}
                        <Link 
                          to={`/recruiter/jobs/edit/${job.id}`}
                          className="text-slate-600 hover:text-indigo-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                          title="Edit Job"
                        >
                          <Edit className="h-4.5 w-4.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(job.id, job.title)}
                          className="text-slate-600 hover:text-rose-600 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Delete Job"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobList;
