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
  Briefcase,
  Sparkles,
  Building,
  Calendar
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
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Filter positions where status is OFFER or HIRED or any active application
  const offerPipelines = applications.filter(app => 
    app.status === 'OFFER' || app.status === 'HIRED' || app.status === 'SHORTLISTED'
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#0A0F1D] text-white p-7 rounded-2xl border border-indigo-800/60 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <FileCheck className="h-5 w-5" />
              </span>
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                Formal Employment Offers
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Employment Offers & Digital Signature Hub</h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-medium">
              Review, negotiate, and digitally sign formal appointment packages issued by hiring managers with legally compliant audit tracking.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-indigo-500/40 p-4 rounded-xl text-center font-mono">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Active Offers</span>
            <span className="text-2xl font-black text-emerald-400">{offerPipelines.length} Available</span>
            <span className="text-[9px] text-cyan-300 block font-semibold mt-0.5">E-Sign Ready</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2 font-semibold shadow-xs">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center bg-white rounded-2xl border border-slate-200/60 shadow-xs">
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <span className="text-xs text-slate-500 font-semibold tracking-wide">Loading offer records...</span>
          </div>
        </div>
      ) : offerPipelines.length === 0 ? (
        <div className="bg-white border border-slate-200/70 rounded-2xl p-8 text-center space-y-4 shadow-xs">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mx-auto">
            <FileCheck className="h-8 w-8" />
          </div>
          <h3 className="text-base font-black text-slate-900">No Pending Offer Letters Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
            Once you pass your technical coding assessment and interviewer rounds, recruiters will extend formal compensation packages here for electronic signing.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/candidate/assessments"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              <span>Take Technical Assessments</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/candidate/applications/demo-sample/offer"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200"
            >
              <span>Preview E-Sign Template</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offerPipelines.map((app) => {
            return (
              <div key={app.id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-6">
                
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-black text-slate-900 text-base">{app.job?.title || 'Engineering Role'}</h3>
                      <span className="text-xs text-indigo-600 font-bold block uppercase mt-0.5">{app.job?.company || 'Company'}</span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                      app.status === 'HIRED'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse'
                    }`}>
                      {app.status === 'HIRED' ? 'OFFER ACCEPTED ✓' : 'READY FOR SIGNATURE'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Your hiring pipeline has advanced! Review formal salary, start date, equity, health benefits, and draw your electronic signature.
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-2">
                  <Link
                    to={`/candidate/applications/${app.id}/offer`}
                    className="w-full inline-flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
                  >
                    <FileCheck className="h-4 w-4" />
                    <span>Review & E-Sign Offer Package</span>
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
