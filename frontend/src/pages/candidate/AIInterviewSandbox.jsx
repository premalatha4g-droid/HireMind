import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiFetch from '../../services/api';
import { Brain, Send, ArrowRight, CheckCircle, Award } from 'lucide-react';

const AIInterviewSandbox = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await apiFetch(`/api/interviews/pre-screening/${applicationId}`);
        setQuestions(data.questions || []);
      } catch (e) {
        console.error('Failed to load pre-screening questions:', e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [applicationId]);

  const handleNext = () => {
    if (!currentAnswer.trim()) return;
    setAnswers(prev => ({
      ...prev,
      [questions[currentIdx].id]: currentAnswer
    }));
    setCurrentAnswer('');
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handleSubmit = async () => {
    const finalAnswers = {
      ...answers,
      [questions[currentIdx].id]: currentAnswer
    };
    
    setIsSubmitting(true);
    try {
      const resp = await apiFetch(`/api/interviews/pre-screening/${applicationId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers })
      });
      setResult(resp);
    } catch (e) {
      alert('Failed to submit AI Interview feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-650" />
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto mt-10 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden text-center p-8">
        <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-5">
          <Award className="h-10 w-10 animate-bounce" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI Evaluation Complete!</h2>
        <p className="text-slate-500 text-sm mt-2">Gemini evaluation engine has analyzed your conceptual understanding and terminology mapping.</p>

        <div className="my-8 py-6 bg-slate-50 rounded-xl max-w-sm mx-auto border border-slate-100">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Automated Readiness Score</span>
          <p className="text-5xl font-black text-indigo-600 mt-1">{result.score}%</p>
          <div className="mt-3 flex items-center justify-center space-x-1.5 text-emerald-600 text-[11px] font-extrabold uppercase">
            <CheckCircle className="h-4 w-4" />
            <span>Passport Badge Verified</span>
          </div>
        </div>

        <button 
          onClick={() => navigate('/candidate')}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer text-xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIdx];

  return (
    <div className="max-w-3xl mx-auto mt-6 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[550px]">
      {/* Header bar */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-indigo-600 rounded text-white">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 leading-none">AI Pre-Screening Sandbox</h2>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Verifiable Competency check</span>
          </div>
        </div>
        <span className="text-xs font-bold text-indigo-600 px-3 py-1 rounded-full bg-indigo-50">
          Question {currentIdx + 1} of {questions.length}
        </span>
      </div>

      {/* Chat Sandbox area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-[#FAF9F6]/40">
        <div className="flex space-x-3 text-left">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold text-xs">AI</div>
          <div className="bg-white border border-slate-200/80 p-4 rounded-xl max-w-xl text-xs font-semibold text-slate-800 shadow-xs leading-relaxed">
            {currentQ?.text}
          </div>
        </div>

        {/* User answers logs */}
        {Object.keys(answers).map((qId, idx) => (
          <div key={idx} className="flex space-x-3 justify-end text-right">
            <div className="bg-indigo-600 text-white p-4 rounded-xl max-w-xl text-xs font-semibold shadow-xs leading-relaxed text-left">
              {answers[qId]}
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xs">U</div>
          </div>
        ))}
      </div>

      {/* Input textbox area */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <div className="flex items-end space-x-3">
          <textarea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Type your response detailing core concepts..."
            className="flex-1 min-h-[80px] p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-800 font-semibold"
          />
          
          {currentIdx < questions.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!currentAnswer.trim()}
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-xl shadow-md transition-colors cursor-pointer text-xs font-bold flex items-center space-x-1.5 h-10"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!currentAnswer.trim() || isSubmitting}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-755 disabled:bg-slate-200 text-white rounded-xl shadow-md transition-colors cursor-pointer text-xs font-bold flex items-center space-x-1.5 h-10"
            >
              <span>{isSubmitting ? 'Evaluating...' : 'Submit'}</span>
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIInterviewSandbox;
