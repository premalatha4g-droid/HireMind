import React, { useState, useEffect } from 'react';
import apiFetch from '../../services/api';
import { 
  FileCheck, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  Briefcase
} from 'lucide-react';
import { Link } from 'react-router-dom';

const RecruiterOffers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOffers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/offers/my-offers');
      setOffers(data);
    } catch (err) {
      setError(err.message || 'Failed to load offer letters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Employment Offers</h1>
        <p className="text-sm text-slate-500">View and track acceptance statuses of structured offer letters issued to candidates</p>
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
            <span className="text-sm text-slate-500 font-semibold">Loading employment offers...</span>
          </div>
        </div>
      ) : offers.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200/60 p-8 text-center shadow-xs">
          <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-3">
            <FileCheck className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Offers Issued Yet</h3>
          <p className="text-xs text-slate-455 mt-1 max-w-sm">
            Offers can be generated from the Match Intelligence dashboard once candidates are short-listed.
          </p>
          <Link
            to="/recruiter/jobs"
            className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <span>View Job Openings</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offers.map((o) => {
            return (
              <div key={o.id} className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-6">
                
                {/* Header info */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{o.jobTitle || 'Role Title'}</h3>
                      <span className="text-xs text-indigo-650 font-bold block mt-0.5">{o.candidateName}</span>
                    </div>

                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      o.status === 'ACCEPTED'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                        : o.status === 'DECLINED'
                        ? 'bg-rose-50 border-rose-100 text-rose-700'
                        : 'bg-amber-50 border-amber-100 text-amber-700 animate-pulse'
                    }`}>
                      {o.status}
                    </span>
                  </div>
                </div>

                {/* Offer terms */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-slate-500 font-semibold">
                    <DollarSign className="h-4 w-4 text-indigo-600" />
                    <span>Annual Base Salary:</span>
                    <strong className="text-slate-800">${o.salary}</strong>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-500 font-semibold">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    <span>Expected Joining:</span>
                    <strong className="text-slate-800">{o.joiningDate}</strong>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-500 font-semibold">
                    <MapPin className="h-4 w-4 text-indigo-600" />
                    <span>Location Context:</span>
                    <strong className="text-slate-800">{o.location}</strong>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecruiterOffers;
