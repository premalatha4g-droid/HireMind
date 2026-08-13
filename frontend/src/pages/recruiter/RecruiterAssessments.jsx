import React, { useState, useEffect } from 'react';
import apiFetch from '../../services/api';
import { 
  Award, 
  Plus, 
  Edit, 
  Loader2, 
  AlertCircle,
  Briefcase,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const RecruiterAssessments = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/jobs');
      setJobs(data);
    } catch (err) {
      setError(err.message || 'Failed to load positions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Coding Assessments</h1>
          <p className="text-sm text-slate-500">Configure coding test templates, difficulty settings, and custom validation unit test cases</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center bg-white rounded-xl border border-slate-200/60 shadow-xs">
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <span className="text-sm text-slate-500 font-semibold">Loading assessment lists...</span>
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200/60 p-8 text-center shadow-xs">
          <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-3">
            <Award className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Job Positions Found</h3>
          <p className="text-xs text-slate-455 mt-1 max-w-sm">
            Create a job posting first, then attach a technical sandbox coding test.
          </p>
          <Link
            to="/recruiter/jobs/create"
            className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <span>Create New Job</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => {
            const hasTest = job.analysis; // If published/active, we can configure assessment
            return (
              <div key={job.id} className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-6">
                
                {/* Header */}
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-900 text-base">{job.title}</h3>
                  <span className="text-xs text-indigo-600 font-bold block">{job.company} ({job.location})</span>
                  <p className="text-xs text-slate-500">
                    Status: <strong className="text-slate-700">{job.status}</strong>. Configure standard Javascript challenges for applicants.
                  </p>
                </div>

                {/* Status Bar */}
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                  <span className="text-slate-450 font-bold">CODING TEST CONFIGURATION:</span>
                  <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-[10px] font-bold">
                    VALIDATED
                  </span>
                </div>

                {/* Actions */}
                <div className="pt-2">
                  <Link
                    to={`/recruiter/jobs/${job.id}/assessment/edit`}
                    className="w-full inline-flex items-center justify-center space-x-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Build / Edit Assessment</span>
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecruiterAssessments;
