import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiFetch from '../../services/api';
import { 
  ArrowLeft, 
  Sparkles, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  Video, 
  UserCheck, 
  FileText, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2,
  Brain,
  Scale
} from 'lucide-react';

const InterviewWorkspace = () => {
  const { jobId, applicationId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Info data
  const [application, setApplication] = useState(null);
  const [interviewers, setInterviewers] = useState([]);

  // Form State
  const [interviewerId, setInterviewerId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState('TECHNICAL');
  const [meetingLink, setMeetingLink] = useState('');
  
  // Questions list
  const [questions, setQuestions] = useState([]);
  const [isRealAI, setIsRealAI] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const fetchWorkspaceData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch application details
      const appData = await apiFetch(`/api/jobs/${jobId}`);
      // Find candidate details within application logic or parse manually
      // Query match rankings to get application
      const matchesData = await apiFetch(`/api/matches/job/${jobId}`);
      const appMatch = matchesData.find(m => m.applicationId === applicationId);
      if (appMatch) {
        setApplication(appMatch);
      } else {
        setError('Target application not found.');
      }

      // 2. Fetch list of eligible interviewers
      const staffList = await apiFetch('/api/auth/interviewers');
      setInterviewers(staffList);
      if (staffList.length > 0) {
        setInterviewerId(staffList[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize scheduling workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [jobId, applicationId]);

  const handleGenerateQuestions = async () => {
    setGenerating(true);
    setError('');
    try {
      const data = await apiFetch('/api/interviews/generate-questions', {
        method: 'POST',
        body: JSON.stringify({ applicationId })
      });
      setQuestions(data.questions);
      setIsRealAI(data.isRealAI);
      setHasGenerated(true);
      setSuccess('AI interview questions generated successfully based on candidate profile.');
    } catch (err) {
      setError(err.message || 'Failed to generate interview questions.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: 'Enter custom question text...',
        category: 'TECHNICAL',
        difficulty: 'MEDIUM',
        evaluationCriteria: 'Listen for: ...'
      }
    ]);
  };

  const handleRemoveQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx, field, value) => {
    const updated = [...questions];
    updated[idx][field] = value;
    setQuestions(updated);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!interviewerId || !date || !time || !type) {
      setError('Please fill in all scheduling requirements.');
      return;
    }
    if (questions.length === 0) {
      setError('Please add or generate at least one evaluation question before scheduling.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await apiFetch('/api/interviews/schedule', {
        method: 'POST',
        body: JSON.stringify({
          applicationId,
          interviewerId,
          date,
          time,
          type,
          meetingLink,
          questions
        })
      });
      alert('Interview scheduled and customized questions saved successfully!');
      navigate(`/recruiter/jobs/${jobId}/matches`);
    } catch (err) {
      setError(err.message || 'Failed to save scheduled interview.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Loading interview workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-slate-200/60 pb-5">
        <Link to={`/recruiter/jobs/${jobId}/matches`} className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Interview Workspace Planner</h1>
          <p className="text-xs text-slate-500 font-semibold tracking-wide uppercase">
            Schedule & Customize Candidate Questions
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-center space-x-2 shadow-xs font-semibold">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm flex items-center space-x-2 shadow-xs font-semibold">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Main split grid */}
      <form onSubmit={handleScheduleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: schedule card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/60 p-5 space-y-4 shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm pb-2 border-b border-slate-100 flex items-center space-x-2">
              <Calendar className="h-4.5 w-4.5 text-indigo-600" />
              <span>Schedule Details</span>
            </h3>

            {/* Candidate summary panel */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-150 text-xs space-y-2">
              <p className="font-bold text-slate-900 text-sm">{application?.application?.candidate?.name}</p>
              <span className="text-slate-500 font-semibold block">{application?.application?.candidate?.email}</span>
              <div className="flex space-x-4 pt-1.5 border-t border-slate-200 mt-1.5">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Match Score</span>
                  <span className="text-indigo-600 font-extrabold">{application?.overallScore}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Readiness</span>
                  <span className="text-emerald-600 font-extrabold">{application?.application?.readinessScore || 0}%</span>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-600 uppercase tracking-wide">Assign Evaluator / Interviewer</label>
                <select
                  value={interviewerId}
                  onChange={(e) => setInterviewerId(e.target.value)}
                  className="w-full bg-white border border-slate-250 p-2 rounded-lg font-semibold text-slate-700 focus:ring-indigo-500"
                >
                  {interviewers.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} ({staff.role.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 uppercase tracking-wide">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-250 p-2 rounded-lg font-semibold text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 uppercase tracking-wide">Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-250 p-2 rounded-lg font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600 uppercase tracking-wide">Interview Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-white border border-slate-250 p-2 rounded-lg font-semibold text-slate-700 focus:ring-indigo-500"
                >
                  <option value="TECHNICAL">TECHNICAL INTERVIEW</option>
                  <option value="PROJECT_DEEP_DIVE">PROJECT DEEP DIVE</option>
                  <option value="SYSTEM_DESIGN">SYSTEM DESIGN</option>
                  <option value="BEHAVIORAL">BEHAVIORAL</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600 uppercase tracking-wide flex items-center justify-between">
                  <span>Meeting Link</span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="w-full bg-white border border-slate-250 p-2 rounded-lg font-semibold text-slate-700 placeholder-slate-300"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition-all shadow-xs hover:shadow-md cursor-pointer text-xs uppercase tracking-wider"
            >
              Schedule Interview
            </button>
          </div>
        </div>

        {/* Right column: Questions sheets builder */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-xs space-y-6">
            
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-3.5">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-900 text-sm">Evaluation Questions Draft</h3>
                <p className="text-xs text-slate-500">Formulate and review the questions used in this interview</p>
              </div>
              
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={handleGenerateQuestions}
                  disabled={generating}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-indigo-250 hover:bg-indigo-50/40 text-indigo-600 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  {generating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                  )}
                  <span>Generate AI Questions</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Question</span>
                </button>
              </div>
            </div>

            {/* AI Generated Badge */}
            {hasGenerated && (
              <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Brain className="h-4.5 w-4.5 text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-900">
                    {isRealAI ? 'AI Generated Questions (Gemini Analysis)' : 'Demo Generated Questions (Fallback Seeds)'}
                  </span>
                </div>
                <span className="text-[9px] font-extrabold uppercase bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded">
                  {isRealAI ? 'Live AI' : 'Mock Fallback'}
                </span>
              </div>
            )}

            {/* Questions list */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {questions.map((q, idx) => (
                <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3.5 shadow-xs relative">
                  
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(idx)}
                    className="absolute top-4 right-4 p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                    title="Remove Question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-500 mb-1">CATEGORY</label>
                      <select
                        value={q.category}
                        onChange={(e) => handleQuestionChange(idx, 'category', e.target.value)}
                        className="w-full bg-white border border-slate-200 p-1.5 rounded font-semibold text-slate-700"
                      >
                        <option value="TECHNICAL">TECHNICAL</option>
                        <option value="PROJECT_DEEP_DIVE">PROJECT DEEP DIVE</option>
                        <option value="SKILL_GAP">SKILL GAP</option>
                        <option value="BEHAVIORAL">BEHAVIORAL</option>
                        <option value="SCENARIO">SCENARIO</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-500 mb-1">DIFFICULTY</label>
                      <select
                        value={q.difficulty}
                        onChange={(e) => handleQuestionChange(idx, 'difficulty', e.target.value)}
                        className="w-full bg-white border border-slate-200 p-1.5 rounded font-semibold text-slate-700"
                      >
                        <option value="EASY">EASY</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HARD">HARD</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-xs space-y-1">
                    <label className="block font-bold text-slate-600 uppercase tracking-wide">Question Text</label>
                    <textarea
                      value={q.question}
                      onChange={(e) => handleQuestionChange(idx, 'question', e.target.value)}
                      rows="2"
                      required
                      className="w-full bg-white border border-slate-250 p-2 rounded-lg font-semibold text-slate-700"
                    />
                  </div>

                  <div className="text-xs space-y-1">
                    <label className="block font-bold text-slate-600 uppercase tracking-wide">Evaluation Criteria / Expected Answer Keys</label>
                    <textarea
                      value={q.evaluationCriteria || ''}
                      onChange={(e) => handleQuestionChange(idx, 'evaluationCriteria', e.target.value)}
                      rows="2"
                      placeholder="Listen for: design patterns, key technical terms, etc."
                      className="w-full bg-white border border-slate-250 p-2 rounded-lg font-semibold text-slate-700 placeholder-slate-350"
                    />
                  </div>
                </div>
              ))}

              {questions.length === 0 && (
                <div className="text-center py-12 text-slate-400 space-y-2.5 border-2 border-dashed border-slate-100 rounded-xl">
                  <FileText className="h-10 w-10 mx-auto text-slate-300 animate-pulse" />
                  <p className="text-xs font-semibold">Evaluation question list is empty.</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Click "Generate AI Questions" to draft custom candidate-specific questions automatically, or click "Add Question" to construct yours.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default InterviewWorkspace;
