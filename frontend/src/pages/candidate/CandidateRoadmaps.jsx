import React, { useState, useEffect } from 'react';
import apiFetch from '../../services/api';
import { 
  Map, 
  BookOpen, 
  ArrowRight, 
  AlertCircle, 
  Loader2,
  CheckCircle,
  Briefcase
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CandidateRoadmaps = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/assessments/my-applications');
      setApplications(data);
    } catch (err) {
      setError(err.message || 'Failed to load pipelines.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Personalized Upskilling Roadmaps</h1>
        <p className="text-sm text-slate-500">Track study syllabi tailored specifically to match job descriptions and close skill gaps</p>
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
            <span className="text-sm text-slate-500 font-semibold">Loading roadmap records...</span>
          </div>
        </div>
      ) : applications.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200/60 p-8 text-center shadow-xs">
          <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-3">
            <Map className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Roadmaps Available</h3>
          <p className="text-xs text-slate-455 mt-1 max-w-sm">
            Once you apply to a position, you can generate a personalized roadmap to study and bridge missing qualifications.
          </p>
          <Link
            to="/candidate/jobs"
            className="mt-4 inline-flex items-center space-x-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Explore Jobs</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {applications.map((app) => {
            return (
              <div key={app.id} className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-6">
                
                {/* Header */}
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-900 text-base">{app.job.title}</h3>
                  <span className="text-xs text-indigo-600 font-bold block">{app.job.company}</span>
                  <p className="text-xs text-slate-500">
                    Calculated Match Score: <strong className="text-slate-700">{app.matchScore || 0}%</strong>. Generate or continue studying your syllabus roadmap.
                  </p>
                </div>

                {/* Status Bar */}
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                  <span className="text-slate-450 font-bold">APPLICATION PIPELINE:</span>
                  <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-[10px] font-bold">
                    {app.status}
                  </span>
                </div>

                {/* Actions */}
                <div className="pt-2">
                  <Link
                    to={`/candidate/applications/${app.id}/roadmap`}
                    className="w-full inline-flex items-center justify-center space-x-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                  >
                    <BookOpen className="h-4.5 w-4.5" />
                    <span>Open Upskilling Roadmap</span>
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

export default CandidateRoadmaps;
