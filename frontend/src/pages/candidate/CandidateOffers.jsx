import React, { useState, useEffect } from 'react';
import apiFetch from '../../services/api';
import { 
  FileCheck, 
  MapPin, 
  DollarSign, 
  ArrowRight, 
  AlertCircle, 
  Loader2,
  CheckCircle,
  Briefcase
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CandidateOffers = () => {
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

  // Filter positions where status is OFFER, HIRED, or SHORTLISTED (to see if an offer exists)
  const offerPipelines = applications.filter(app => 
    app.status === 'OFFER' || app.status === 'HIRED'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Employment Offers</h1>
        <p className="text-sm text-slate-500">Review, accept, or decline formal offer letters issued by recruiters</p>
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
            <span className="text-sm text-slate-500 font-semibold">Loading offer records...</span>
          </div>
        </div>
      ) : offerPipelines.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200/60 p-8 text-center shadow-xs">
          <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-3">
            <FileCheck className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Offers Issued</h3>
          <p className="text-xs text-slate-455 mt-1 max-w-sm">
            You do not have any pending offer letters. Once a recruiter issues an offer, it will appear here.
          </p>
          <Link
            to="/candidate"
            className="mt-4 inline-flex items-center space-x-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offerPipelines.map((app) => {
            return (
              <div key={app.id} className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-6">
                
                {/* Header */}
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-900 text-base">{app.job.title}</h3>
                  <span className="text-xs text-indigo-600 font-bold block">{app.job.company}</span>
                  <p className="text-xs text-slate-550">
                    Your pipeline has progressed to the offer phase! Click review to view salary, joining date, and benefits.
                  </p>
                </div>

                {/* Offer Status */}
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                  <span className="text-slate-450 font-bold">STATUS:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    app.status === 'HIRED'
                      ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                      : 'bg-amber-50 border border-amber-100 text-amber-700 animate-pulse'
                  }`}>
                    {app.status === 'HIRED' ? 'ACCEPTED' : 'PENDING REVIEW'}
                  </span>
                </div>

                {/* Actions */}
                <div className="pt-2">
                  <Link
                    to={`/candidate/applications/${app.id}/offer`}
                    className="w-full inline-flex items-center justify-center space-x-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                  >
                    <FileCheck className="h-4.5 w-4.5" />
                    <span>Review Offer Details</span>
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

export default CandidateOffers;
