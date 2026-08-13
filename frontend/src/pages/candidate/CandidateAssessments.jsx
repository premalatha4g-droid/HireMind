import React, { useState, useEffect } from 'react';
import apiFetch from '../../services/api';
import { 
  Award, 
  Clock, 
  Terminal, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CandidateAssessments = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAssessments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/assessments/my-applications');
      setApplications(data);
    } catch (err) {
      setError(err.message || 'Failed to load assessments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  // Filter jobs that have coding assessments
  const assessmentPipelines = applications.filter(app => app.job && app.job.assessment);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Technical Assessments</h1>
        <p className="text-sm text-slate-500">Complete coding tests and verify your capabilities against job requirements</p>
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
            <span className="text-sm text-slate-500 font-semibold">Loading your assessments...</span>
          </div>
        </div>
      ) : assessmentPipelines.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200/60 p-8 text-center shadow-xs">
          <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-3">
            <Award className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Assessments Assigned</h3>
          <p className="text-xs text-slate-450 mt-1 max-w-sm">
            Once you apply to a position that requires a coding challenge, it will appear here for you to complete.
          </p>
          <Link
            to="/candidate/jobs"
            className="mt-4 inline-flex items-center space-x-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Browse Jobs</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assessmentPipelines.map((app) => {
            const test = app.job.assessment;
            const submission = app.submissions.find(s => s.assessmentId === test.id);

            return (
              <div key={app.id} className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-6">
                
                {/* Top Header */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{test.title}</h3>
                      <span className="text-xs text-indigo-600 font-bold block">{app.job.title} ({app.job.company})</span>
                    </div>

                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      submission 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                    }`}>
                      {submission ? 'COMPLETED' : 'PENDING'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{test.description || 'Complete the coding challenges to prove your tech skills.'}</p>
                </div>

                {/* Test stats */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-500 font-semibold">
                    <Clock className="h-4 w-4 text-indigo-600" />
                    <span>Time Limit:</span>
                    <strong className="text-slate-800">{test.timeLimit} Mins</strong>
                  </div>

                  {submission && (
                    <div className="flex items-center space-x-1.5 text-slate-500 font-semibold">
                      <Terminal className="h-4 w-4 text-indigo-600" />
                      <span>Graded Score:</span>
                      <strong className="text-emerald-600 text-sm">{submission.score}%</strong>
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div className="pt-2">
                  {submission ? (
                    <div className="flex items-center space-x-1.5 text-emerald-600 font-bold text-xs">
                      <CheckCircle className="h-4 w-4" />
                      <span>Submission recorded successfully. Matches verified.</span>
                    </div>
                  ) : (
                    <Link
                      to={`/candidate/assessment/${app.job.id}`}
                      className="w-full inline-flex items-center justify-center space-x-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                    >
                      <Terminal className="h-4.5 w-4.5" />
                      <span>Start Coding Challenge</span>
                    </Link>
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

export default CandidateAssessments;
