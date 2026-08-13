import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiFetch from '../../services/api';
import { 
  LogOut, 
  Calendar, 
  Clock, 
  Video, 
  User, 
  Briefcase, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  Loader2, 
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Brain,
  Sliders,
  Plus,
  Trash2,
  Save,
  CheckCircle2
} from 'lucide-react';

const InterviewerDashboard = () => {
  const { user, logout } = useAuth();
  
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected interview for active evaluation
  const [activeInterview, setActiveInterview] = useState(null);
  
  // Evaluation Form State
  const [technicalScore, setTechnicalScore] = useState(5);
  const [problemSolvingScore, setProblemSolvingScore] = useState(5);
  const [communicationScore, setCommunicationScore] = useState(5);
  const [projectUnderstandingScore, setProjectUnderstandingScore] = useState(5);
  const [rawNotes, setRawNotes] = useState('');
  
  // AI draft states
  const [drafting, setDrafting] = useState(false);
  const [aiDraftReceived, setAiDraftReceived] = useState(false);
  const [isRealAI, setIsRealAI] = useState(false);
  
  // Handlers for editable summary
  const [comments, setComments] = useState('');
  const [strengths, setStrengths] = useState([]);
  const [weaknesses, setWeaknesses] = useState([]);
  const [recommendation, setRecommendation] = useState('PROCEED');
  
  // UI Custom adding inputs for arrays
  const [newStrength, setNewStrength] = useState('');
  const [newWeakness, setNewWeakness] = useState('');

  // Fetch interviewer's schedule
  const fetchSchedule = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/interviews/assigned');
      setInterviews(data);
    } catch (err) {
      setError('Failed to fetch assigned interviews schedule.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleStartEvaluation = (interview) => {
    setActiveInterview(interview);
    setTechnicalScore(7);
    setProblemSolvingScore(7);
    setCommunicationScore(7);
    setProjectUnderstandingScore(7);
    setRawNotes('');
    setComments('');
    setStrengths([]);
    setWeaknesses([]);
    setRecommendation('PROCEED');
    setAiDraftReceived(false);
    setSuccess('');
    setError('');
  };

  const handleBuildAIDraft = async () => {
    if (!rawNotes.trim()) {
      setError('Please write some raw notes during the interview to generate the AI draft.');
      return;
    }
    setDrafting(true);
    setError('');
    try {
      const data = await apiFetch(`/api/interviews/${activeInterview.id}/feedback/draft`, {
        method: 'POST',
        body: JSON.stringify({
          rawNotes,
          technicalScore,
          problemSolvingScore,
          communicationScore,
          projectUnderstandingScore
        })
      });

      setComments(data.comments);
      setStrengths(data.strengths);
      setWeaknesses(data.weaknesses);
      setRecommendation(data.recommendation);
      setIsRealAI(data.isRealAI);
      setAiDraftReceived(true);
      setSuccess('AI Feedback draft suggested based on your score metrics and raw notes.');
    } catch (err) {
      setError(err.message || 'Failed to generate AI feedback draft.');
    } finally {
      setDrafting(false);
    }
  };

  const handleAddStrength = () => {
    if (newStrength.trim()) {
      setStrengths([...strengths, newStrength.trim()]);
      setNewStrength('');
    }
  };

  const handleRemoveStrength = (idx) => {
    setStrengths(strengths.filter((_, i) => i !== idx));
  };

  const handleAddWeakness = () => {
    if (newWeakness.trim()) {
      setWeaknesses([...weaknesses, newWeakness.trim()]);
      setNewWeakness('');
    }
  };

  const handleRemoveWeakness = (idx) => {
    setWeaknesses(weaknesses.filter((_, i) => i !== idx));
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    if (!comments.trim()) {
      setError('Please provide comments/evaluation notes before submitting.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/api/interviews/${activeInterview.id}/feedback/submit`, {
        method: 'POST',
        body: JSON.stringify({
          technicalScore,
          problemSolvingScore,
          communicationScore,
          projectUnderstandingScore,
          comments,
          strengths,
          weaknesses,
          recommendation
        })
      });
      alert('Evaluation submitted successfully. Match scores recalculated.');
      setActiveInterview(null);
      await fetchSchedule();
    } catch (err) {
      setError(err.message || 'Failed to submit final evaluation.');
      setLoading(false);
    }
  };

  if (loading && interviews.length === 0) {
    return (
      <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Loading evaluation schedule...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7FB] p-6">
      
      {/* Top Navbar */}
      <div className="max-w-6xl mx-auto bg-white p-5 rounded-xl border border-slate-200/60 flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-full">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Welcome, {user?.name}!</h1>
            <span className="text-[10px] text-slate-400 font-extrabold tracking-wide uppercase">Evaluation Panel (Interviewer Portal)</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center space-x-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {error && (
        <div className="max-w-6xl mx-auto p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center space-x-2 shadow-xs font-semibold mb-4">
          <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="max-w-6xl mx-auto p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs flex items-center space-x-2 shadow-xs font-semibold mb-4">
          <CheckCircle2 className="h-4.5 w-4.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Workspace toggle */}
      <div className="max-w-6xl mx-auto">
        {!activeInterview ? (
          
          /* Dashboard List View */
          <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Your Interview Schedule</h3>
              <p className="text-xs text-slate-500">Monitor and evaluate assigned candidate workflows</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Candidate</th>
                    <th className="py-2.5 px-3">Job Listing</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Evaluation Type</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {interviews.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900">{item.application.candidate.name}</div>
                        <span className="text-[10px] text-slate-400 font-medium block">{item.application.candidate.email}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900">{item.application.job.title}</div>
                        <span className="text-[10px] text-slate-400 font-medium block uppercase">{item.application.job.company}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{item.date}</span>
                          <span className="text-slate-300">|</span>
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{item.time}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                          {item.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700 animate-pulse'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        {item.status === 'SCHEDULED' ? (
                          <button
                            onClick={() => handleStartEvaluation(item)}
                            className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] shadow-xs cursor-pointer"
                          >
                            <span>Evaluate</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">Evaluation Recorded</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {interviews.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-400 space-y-2.5">
                        <Calendar className="h-8 w-8 mx-auto text-slate-200" />
                        <p className="text-xs">No candidate evaluations scheduled in your timeline.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          
          /* Active Evaluation Workspace Split View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Questions List */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-xs">
                <button
                  onClick={() => setActiveInterview(null)}
                  className="flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors pb-3 border-b border-slate-100 w-full text-left"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Exit Workspace</span>
                </button>

                <div className="mt-4 space-y-2.5">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <p className="font-bold text-slate-800 text-xs uppercase">Evaluation Target</p>
                    <p className="text-sm font-extrabold text-indigo-600 mt-1">{activeInterview.application.candidate.name}</p>
                    <span className="text-slate-400 font-semibold">{activeInterview.application.job.title}</span>
                  </div>

                  <h4 className="font-bold text-slate-700 text-xs pt-2">Scheduled Question Sheet ({activeInterview.questions.length})</h4>
                  <div className="space-y-3.5 overflow-y-auto max-h-[400px] mt-1 pr-1">
                    {activeInterview.questions.map((q, idx) => (
                      <div key={q.id} className="p-3 border border-slate-150 rounded-lg bg-white space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-black tracking-wide uppercase">
                          <span className="text-indigo-600">{q.category}</span>
                          <span className="text-slate-400">{q.difficulty}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 leading-relaxed">{q.question}</p>
                        {q.evaluationCriteria && (
                          <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 font-semibold">
                            <span className="font-bold text-slate-600 block mb-0.5">Expectations:</span>
                            {q.evaluationCriteria}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Feedback Scores, Notes, and AI assistance */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-xs space-y-6">
                
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm">Evaluation Sheet</h3>
                  <p className="text-xs text-slate-500">Record scores and process candidate feedback</p>
                </div>

                <form onSubmit={handleSubmitEvaluation} className="space-y-6 text-xs">
                  
                  {/* Category Scores Sliders */}
                  <div className="bg-slate-50/50 p-4 border border-slate-150 rounded-xl space-y-4">
                    <h4 className="font-bold text-slate-800 flex items-center space-x-1.5 pb-2 border-b border-slate-200">
                      <Sliders className="h-4 w-4 text-indigo-600" />
                      <span>Category Metrics (1 - 10 rating)</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: 'Technical Capability', val: technicalScore, set: setTechnicalScore },
                        { label: 'Problem Solving', val: problemSolvingScore, set: setProblemSolvingScore },
                        { label: 'Communication Style', val: communicationScore, set: setCommunicationScore },
                        { label: 'Project Understanding', val: projectUnderstandingScore, set: setProjectUnderstandingScore }
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between font-bold text-slate-700">
                            <span>{item.label}</span>
                            <span className="text-indigo-600 font-extrabold">{item.val}/10</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={item.val}
                            onChange={(e) => item.set(parseInt(e.target.value, 10))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Raw Notes Area */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 uppercase tracking-wide">Raw Interview Notes & Comments</label>
                    <textarea
                      value={rawNotes}
                      onChange={(e) => setRawNotes(e.target.value)}
                      rows="4"
                      required
                      placeholder="Record interview notes here. AI will structure these comments to draft strengths and weaknesses."
                      className="w-full bg-white border border-slate-250 p-2.5 rounded-lg font-semibold text-slate-700 placeholder-slate-350"
                    />
                  </div>

                  {/* Trigger AI Suggestion */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleBuildAIDraft}
                      disabled={drafting}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      {drafting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      <span>Build AI Draft Summary</span>
                    </button>
                  </div>

                  {/* Draft Work Area */}
                  <div className="border border-indigo-100 rounded-xl bg-indigo-50/20 p-5 space-y-4">
                    
                    {/* Title & Badge */}
                    <div className="flex justify-between items-center border-b border-indigo-100/50 pb-2">
                      <div className="flex items-center space-x-2">
                        <Brain className="h-4.5 w-4.5 text-indigo-600" />
                        <h4 className="font-extrabold text-indigo-900 text-xs">
                          {isRealAI ? 'AI Feedback Draft Suggested' : 'Feedback Draft'}
                        </h4>
                      </div>
                      <span className="text-[9px] font-extrabold uppercase bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded">
                        Evaluation Form
                      </span>
                    </div>

                    {/* Narrative Comments */}
                    <div className="space-y-1">
                      <label className="block font-bold text-indigo-950 uppercase tracking-wide">Narrative Evaluation Comments</label>
                      <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        rows="4"
                        required
                        className="w-full bg-white border border-slate-200 p-2 rounded-lg font-semibold text-slate-700"
                      />
                    </div>

                    {/* Strengths Arrays */}
                    <div className="space-y-2">
                      <label className="block font-bold text-indigo-950 uppercase tracking-wide">Extracted Strengths</label>
                      <div className="space-y-1.5">
                        {strengths.map((s, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-lg">
                            <span className="font-semibold text-slate-700 pr-2">{s}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveStrength(idx)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add Strength input */}
                      <div className="flex space-x-2 pt-1">
                        <input
                          type="text"
                          placeholder="Add another strength..."
                          value={newStrength}
                          onChange={(e) => setNewStrength(e.target.value)}
                          className="bg-white border border-slate-200 rounded p-1 text-xs w-full font-semibold"
                        />
                        <button
                          type="button"
                          onClick={handleAddStrength}
                          className="p-1 px-3 border border-slate-200 hover:bg-slate-150 text-slate-700 rounded cursor-pointer font-bold"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Weaknesses Arrays */}
                    <div className="space-y-2">
                      <label className="block font-bold text-indigo-950 uppercase tracking-wide">Areas of Concern / Weaknesses</label>
                      <div className="space-y-1.5">
                        {weaknesses.map((w, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-lg">
                            <span className="font-semibold text-slate-700 pr-2">{w}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveWeakness(idx)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add Weakness input */}
                      <div className="flex space-x-2 pt-1">
                        <input
                          type="text"
                          placeholder="Add area of concern..."
                          value={newWeakness}
                          onChange={(e) => setNewWeakness(e.target.value)}
                          className="bg-white border border-slate-200 rounded p-1 text-xs w-full font-semibold"
                        />
                        <button
                          type="button"
                          onClick={handleAddWeakness}
                          className="p-1 px-3 border border-slate-200 hover:bg-slate-150 text-slate-700 rounded cursor-pointer font-bold"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Decision Suggestion */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block font-bold text-indigo-950 uppercase tracking-wide mb-1">Human Hiring Decision Recommendation</label>
                        <select
                          value={recommendation}
                          onChange={(e) => setRecommendation(e.target.value)}
                          className="w-full bg-white border border-slate-200 p-2 rounded-lg font-bold text-slate-700 focus:ring-indigo-500"
                        >
                          <option value="PROCEED">PROCEED TO NEXT STAGE</option>
                          <option value="HOLD">HOLD CANDIDATE</option>
                          <option value="REJECT">REJECT APPLICATION</option>
                        </select>
                      </div>
                    </div>

                    <div className="text-[10px] text-indigo-650 bg-indigo-100/30 p-3 rounded-lg leading-relaxed font-semibold">
                      <span className="font-bold block mb-0.5">Governance Compliance:</span>
                      This feedback profile is manually audited, edited, and approved. Hiring recommendations are decided by authorized human reviewers.
                    </div>
                  </div>

                  {/* Submit buttons */}
                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg transition-all shadow-xs hover:shadow-md cursor-pointer uppercase tracking-wider"
                    >
                      Submit Final Evaluation
                    </button>
                  </div>
                </form>

              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};

export default InterviewerDashboard;
