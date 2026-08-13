import React, { useState, useEffect } from 'react';
import apiFetch from '../../services/api';
import { 
  Users, 
  Mail, 
  TrendingUp, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  Award,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CandidatesList = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCandidates = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/auth/candidates');
      setCandidates(data);
    } catch (err) {
      setError(err.message || 'Failed to load candidates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Talent Pool</h1>
        <p className="text-sm text-slate-500">Search and review registered candidates and view parsed AI Skill Passport details</p>
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
            <span className="text-sm text-slate-500 font-semibold">Loading candidates...</span>
          </div>
        </div>
      ) : candidates.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200/60 p-8 text-center shadow-xs">
          <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-3">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Candidates Registered</h3>
          <p className="text-xs text-slate-450 mt-1 max-w-sm">
            Once candidates sign up, their profiles and skill passports will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((cand) => {
            return (
              <div key={cand.id} className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-6">
                
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-650 flex items-center justify-center font-bold text-base">
                      {cand.name ? cand.name.charAt(0) : 'C'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{cand.name}</h3>
                      <div className="flex items-center text-xs text-slate-450 mt-0.5 font-semibold">
                        <Mail className="h-3.5 w-3.5 mr-1" />
                        <span>{cand.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info block */}
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-500 font-semibold">
                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                    <span>Job Readiness:</span>
                  </div>
                  <strong className="text-indigo-650 text-sm">Validated</strong>
                </div>

                {/* Actions */}
                <div className="pt-2">
                  <Link
                    to="/recruiter/jobs"
                    className="w-full inline-flex items-center justify-center space-x-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                  >
                    <span>View matched jobs</span>
                    <ArrowRight className="h-4 w-4" />
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

export default CandidatesList;
