import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiFetch from '../../services/api';
import { 
  ArrowLeft, 
  Check, 
  X, 
  Loader2, 
  Briefcase, 
  MapPin, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  FileText,
  Gift
} from 'lucide-react';

const OfferLetterView = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState('');
  
  const [offer, setOffer] = useState(null);
  const [parsedBenefits, setParsedBenefits] = useState([]);

  const fetchOffer = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/api/offers/application/${applicationId}`);
      setOffer(data);
      
      // Parse benefits
      try {
        const benefitsList = JSON.parse(data.benefits || '[]');
        setParsedBenefits(Array.isArray(benefitsList) ? benefitsList : [data.benefits]);
      } catch (e) {
        setParsedBenefits([data.benefits]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load offer letter details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffer();
  }, [applicationId]);

  const handleResponse = async (decision) => {
    const actionText = decision === 'ACCEPT' ? 'accept' : 'decline';
    if (!window.confirm(`Are you sure you want to ${actionText} this employment offer? This decision is final.`)) {
      return;
    }

    setResponding(true);
    setError('');
    try {
      await apiFetch(`/api/offers/${offer.id}/respond`, {
        method: 'POST',
        body: JSON.stringify({ response: decision })
      });
      alert(`You have successfully ${decision.toLowerCase()}ed the offer.`);
      navigate('/candidate');
    } catch (err) {
      setError(err.message || `Failed to submit response.`);
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Loading formal offer terms...</span>
        </div>
      </div>
    );
  }

  if (error && !offer) {
    return (
      <div className="max-w-md mx-auto space-y-6 pt-12 text-center">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-xs">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
        <Link to="/candidate" className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-650 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4">
      {/* Back button */}
      <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
        <Link to="/candidate" className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-slate-950">Official Employment Offer</h1>
          <p className="text-xs text-slate-500 font-medium">Review the formal compensation and employment terms</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center space-x-2">
          <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Styled Offer Letter paper */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-md space-y-6 relative overflow-hidden">
        
        {/* Ribbon for status */}
        <div className="absolute top-0 right-0 p-4">
          <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
            offer.status === 'SENT' 
              ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
              : offer.status === 'ACCEPTED'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : 'bg-rose-50 text-rose-700 border-rose-100'
          }`}>
            Offer {offer.status}
          </span>
        </div>

        {/* Letter Head */}
        <div className="space-y-1.5 pb-6 border-b border-slate-100">
          <h2 className="text-sm font-black text-indigo-650 uppercase tracking-widest flex items-center space-x-1">
            <FileText className="h-4.5 w-4.5 text-indigo-500" />
            <span>HireMind AI Talent Network</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Official Offer Document</p>
        </div>

        {/* Introduction text */}
        <div className="text-xs text-slate-650 leading-relaxed font-semibold space-y-3">
          <p>Dear Candidate,</p>
          <p>
            On behalf of our hiring committee, we are absolutely thrilled to extend this formal offer of employment. Our evaluations have highlighted your strong compatibility, problem solving logic, and technical capability.
          </p>
          <p>Below are the specific terms and agreements of your compensation packages:</p>
        </div>

        {/* Compensation and job details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4.5 border border-slate-150 rounded-xl text-xs font-semibold text-slate-600">
          
          <div className="flex items-center space-x-2">
            <Briefcase className="h-4.5 w-4.5 text-slate-400" />
            <span>Contract Type: <span className="text-slate-900 font-bold uppercase">{offer.employmentType.replace('_', ' ')}</span></span>
          </div>

          <div className="flex items-center space-x-2">
            <DollarSign className="h-4.5 w-4.5 text-slate-400" />
            <span>Base Compensation: <span className="text-slate-900 font-bold">{offer.salary}</span></span>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="h-4.5 w-4.5 text-slate-400" />
            <span>Target Starting Date: <span className="text-slate-900 font-bold">{offer.joiningDate}</span></span>
          </div>

          <div className="flex items-center space-x-2">
            <MapPin className="h-4.5 w-4.5 text-slate-400" />
            <span>Location Designation: <span className="text-slate-900 font-bold">{offer.location}</span></span>
          </div>
        </div>

        {/* Benefits list */}
        {parsedBenefits.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <Gift className="h-4.5 w-4.5 text-indigo-500" />
              <span>Assigned Benefits & Perks:</span>
            </h4>
            <ul className="text-xs font-semibold text-slate-600 space-y-1.5 pl-6 list-disc">
              {parsedBenefits.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Sign-off text */}
        <div className="text-xs text-slate-600 leading-relaxed font-semibold pt-4">
          <p>Sincerely,</p>
          <p className="font-bold text-slate-900 mt-2">HireMind Recruiter Operations</p>
        </div>

        {/* Decision buttons */}
        {offer.status === 'SENT' && (
          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row justify-end items-center gap-4">
            
            <button
              onClick={() => handleResponse('DECLINE')}
              disabled={responding}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-6 py-2.5 border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
              <span>Decline Offer</span>
            </button>

            <button
              onClick={() => handleResponse('ACCEPT')}
              disabled={responding}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs hover:shadow-md cursor-pointer"
            >
              {responding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4 stroke-[3px]" />
              )}
              <span>Accept Offer & Sign</span>
            </button>

          </div>
        )}

      </div>
    </div>
  );
};

export default OfferLetterView;
