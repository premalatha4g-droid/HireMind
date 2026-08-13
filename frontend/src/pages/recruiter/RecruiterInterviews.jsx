import React, { useState, useEffect } from 'react';
import apiFetch from '../../services/api';
import { 
  Calendar, 
  Clock, 
  Video, 
  User, 
  Briefcase, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

const RecruiterInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInterviews = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/interviews/my-schedules');
      setInterviews(data);
    } catch (err) {
      setError(err.message || 'Failed to load interviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Technical Interviews</h1>
        <p className="text-sm text-slate-500">Track interview schedules, assign interviewers, and view evaluation feedback</p>
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
            <span className="text-sm text-slate-500 font-semibold">Loading technical interviews...</span>
          </div>
        </div>
      ) : interviews.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200/60 p-8 text-center shadow-xs">
          <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-3">
            <Calendar className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Scheduled Interviews</h3>
          <p className="text-xs text-slate-455 mt-1 max-w-sm">
            Once you schedule an interview session for candidate pipelines, it will be listed here.
          </p>
          <Link
            to="/recruiter/jobs"
            className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <span>View Job Applications</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {interviews.map((val) => {
            const hasFeedback = val.feedback;
            return (
              <div key={val.id} className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-6">
                
                {/* Header info */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{val.application?.candidate?.name || 'Candidate'}</h3>
                      <span className="text-xs text-slate-450 font-bold block mt-0.5">{val.application?.candidate?.email}</span>
                    </div>

                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      val.status === 'COMPLETED'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                        : 'bg-amber-50 border-amber-100 text-amber-700 animate-pulse'
                    }`}>
                      {val.status}
                    </span>
                  </div>
                </div>

                {/* Meet specs */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-slate-500 font-semibold">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    <span>Schedule Date:</span>
                    <strong className="text-slate-800">{val.date} @ {val.time}</strong>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-500 font-semibold">
                    <Video className="h-4 w-4 text-indigo-600" />
                    <span>Session Type:</span>
                    <strong className="text-slate-800">{val.type}</strong>
                  </div>

                  {val.meetingLink && (
                    <div className="flex items-center space-x-2 text-slate-500 font-semibold pt-1 border-t border-slate-200/60">
                      <ExternalLink className="h-4 w-4 text-indigo-600" />
                      <a href={val.meetingLink} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                        Join Call Link
                      </a>
                    </div>
                  )}
                </div>

                {/* Feedback notes */}
                {hasFeedback && (
                  <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
                    <span className="font-bold text-slate-700 block">Feedback Evaluation:</span>
                    <p className="text-slate-500 italic">"Recommendation: {val.feedback.recommendation}. Technical Rating: {val.feedback.technicalScore}/10."</p>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecruiterInterviews;
