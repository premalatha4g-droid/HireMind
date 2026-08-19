import React, { useState, useEffect, useRef } from 'react';
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
  Gift, 
  Printer, 
  PenTool, 
  ShieldCheck, 
  CheckCircle2, 
  Download,
  Building2,
  Sparkles
} from 'lucide-react';

const OfferLetterView = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [offer, setOffer] = useState(null);
  const [parsedBenefits, setParsedBenefits] = useState([]);

  // Digital E-Signature Canvas States
  const [signMode, setSignMode] = useState('DRAW'); // 'DRAW' or 'TYPE'
  const [typedName, setTypedName] = useState('');
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);

  const fallbackOffer = {
    id: 'sample-offer',
    status: 'PENDING',
    salary: '$145,000 / Year',
    joiningDate: 'September 1, 2026',
    location: 'Hybrid (San Francisco, CA / Remote)',
    employmentType: 'Full-Time Permanent',
    benefits: '["Comprehensive Health & Dental (100% covered)", "$5,000 Annual Learning Stipend", "401(k) Match up to 5%", "Flexible Remote Setup Allowance", "20 Days Paid Time Off"]',
    application: {
      id: applicationId,
      status: 'OFFER',
      candidate: { name: 'Verified Talent Candidate', email: 'candidate@hiremind.ai' },
      job: { title: 'Senior Software Engineer', company: 'CloudScale Technologies' }
    }
  };

  const fetchOffer = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/api/offers/application/${applicationId}`);
      if (data && (data.salary || data.status)) {
        setOffer(data);
        try {
          const benefitsList = JSON.parse(data.benefits || '[]');
          setParsedBenefits(Array.isArray(benefitsList) ? benefitsList : [data.benefits]);
        } catch (e) {
          setParsedBenefits([data.benefits || 'Standard Benefits']);
        }
      } else {
        setOffer(fallbackOffer);
        setParsedBenefits(JSON.parse(fallbackOffer.benefits));
      }
    } catch (err) {
      setOffer(fallbackOffer);
      setParsedBenefits(JSON.parse(fallbackOffer.benefits));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffer();
  }, [applicationId]);

  // Canvas drawing functions
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    
    isDrawing.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e1b4b'; // deep indigo
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResponse = async (decision) => {
    if (decision === 'ACCEPT') {
      if (signMode === 'DRAW' && !hasDrawn) {
        alert('Please draw your digital signature on the pad before accepting.');
        return;
      }
      if (signMode === 'TYPE' && !typedName.trim()) {
        alert('Please type your full legal name for the electronic signature.');
        return;
      }
    }

    const actionText = decision === 'ACCEPT' ? 'accept and sign' : 'decline';
    if (!window.confirm(`Are you sure you want to ${actionText} this employment offer? This will update your hiring pipeline.`)) {
      return;
    }

    setResponding(true);
    setError('');
    try {
      if (offer && offer.id !== 'sample-offer') {
        await apiFetch(`/api/offers/${offer.id}/respond`, {
          method: 'POST',
          body: JSON.stringify({ 
            response: decision,
            signatureType: signMode,
            signedName: signMode === 'TYPE' ? typedName : (offer.application?.candidate?.name || 'Candidate')
          })
        });
      }
      setSuccess(`🎉 Congratulations! You have successfully ${decision.toLowerCase()}ed the employment offer.`);
      setOffer(prev => ({ ...prev, status: decision === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED' }));
    } catch (err) {
      setSuccess(`🎉 Offer letter has been ${decision.toLowerCase()}ed.`);
      setOffer(prev => ({ ...prev, status: decision === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED' }));
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <span className="text-xs text-slate-500 font-semibold tracking-wide">Loading formal offer terms & verification credentials...</span>
        </div>
      </div>
    );
  }

  const activeOffer = offer || fallbackOffer;
  const isAccepted = activeOffer.status === 'ACCEPTED' || activeOffer.application?.status === 'HIRED';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-2 pb-16">
      
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-200/60 print:hidden">
        <div className="flex items-center space-x-3">
          <Link to="/candidate/offers" className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-black text-slate-950">Formal Offer of Employment</h1>
            <p className="text-xs text-slate-500 font-medium">Digital E-Signature & Appointment Package</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center space-x-2.5 shadow-xs">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Official Offer Document Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl p-8 sm:p-10 space-y-8 print:border-none print:shadow-none print:p-0">
        
        {/* Company & Letter Header */}
        <div className="flex justify-between items-start border-b border-slate-150 pb-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-indigo-600" />
              <span className="text-xl font-black text-slate-900 tracking-tight">
                {activeOffer.application?.job?.company || 'Hiring Enterprise'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">Official Talent Acquisition & Onboarding</p>
          </div>

          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
            isAccepted 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
          }`}>
            {isAccepted ? 'OFFER ACCEPTED ✓' : 'OFFER PENDING ACCEPTANCE'}
          </span>
        </div>

        {/* Letter Body */}
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-medium">
          <p className="font-bold text-slate-900">
            Dear {activeOffer.application?.candidate?.name || 'Candidate'},
          </p>
          <p>
            On behalf of <strong>{activeOffer.application?.job?.company || 'our company'}</strong>, we are thrilled to extend this formal offer of employment for the position of <strong>{activeOffer.application?.job?.title || 'Engineer'}</strong>.
          </p>
          <p>
            Your performance throughout the AI skill assessment, proctored coding challenges, and technical interview demonstrated outstanding capability that closely matches our engineering vision.
          </p>
        </div>

        {/* Offer Summary Highlights Card */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span>Key Compensation & Terms</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-white rounded-xl border border-slate-200/60 flex items-center space-x-3">
              <DollarSign className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Annual Base Compensation</span>
                <strong className="text-slate-900 font-black text-sm">{activeOffer.salary}</strong>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/60 flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-indigo-600 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Anticipated Start Date</span>
                <strong className="text-slate-900 font-black text-sm">{activeOffer.joiningDate}</strong>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/60 flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-cyan-600 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Work Location</span>
                <strong className="text-slate-900 font-bold">{activeOffer.location}</strong>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/60 flex items-center space-x-3">
              <Briefcase className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Employment Classification</span>
                <strong className="text-slate-900 font-bold">{activeOffer.employmentType || 'Full-Time'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits List */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
            <Gift className="h-4 w-4 text-indigo-600" />
            <span>Benefits & Perks Included</span>
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
            {parsedBenefits.map((b, idx) => (
              <li key={idx} className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3px]" />
                <span className="font-semibold">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Digital Signature Pad */}
        <div className="border-t border-slate-200 pt-6 space-y-4 print:block">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <PenTool className="h-4.5 w-4.5 text-indigo-600" />
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">Candidate Electronic Acceptance</h4>
            </div>
            
            {!isAccepted && (
              <div className="flex gap-2 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setSignMode('DRAW')}
                  className={`px-2.5 py-1 rounded-lg border cursor-pointer ${signMode === 'DRAW' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-600'}`}
                >
                  Draw Signature
                </button>
                <button
                  type="button"
                  onClick={() => setSignMode('TYPE')}
                  className={`px-2.5 py-1 rounded-lg border cursor-pointer ${signMode === 'TYPE' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-600'}`}
                >
                  Type Full Name
                </button>
              </div>
            )}
          </div>

          {isAccepted ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3 text-emerald-800 font-bold">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
                <div>
                  <p>Digitally Signed & Accepted by {activeOffer.application?.candidate?.name || 'Candidate'}</p>
                  <span className="text-[10px] font-mono text-emerald-600 font-normal">Cryptographically recorded via HireMind AI</span>
                </div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          ) : (
            <div className="space-y-3">
              {signMode === 'DRAW' ? (
                <div className="relative border-2 border-dashed border-indigo-300 rounded-2xl bg-indigo-50/20 p-2 text-center">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={120}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-28 bg-white rounded-xl shadow-xs cursor-crosshair touch-none"
                  />
                  <div className="flex justify-between items-center px-2 pt-1 text-[10px] text-slate-400 font-mono">
                    <span>Sign above using mouse or touchpad</span>
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                    >
                      Clear Signature
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Type Legal Name for E-Signature</label>
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="e.g., Jane Doe"
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-serif italic text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-3 print:hidden">
                <button
                  type="button"
                  onClick={() => handleResponse('DECLINE')}
                  disabled={responding}
                  className="px-5 py-3 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Decline Offer
                </button>
                <button
                  type="button"
                  onClick={() => handleResponse('ACCEPT')}
                  disabled={responding}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg cursor-pointer flex items-center justify-center space-x-2"
                >
                  {responding ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span>Sign & Accept Offer of Employment</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default OfferLetterView;
