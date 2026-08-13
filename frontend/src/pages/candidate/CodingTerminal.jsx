import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiFetch from '../../services/api';
import { 
  Terminal, 
  Clock, 
  HelpCircle, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
  Brain,
  Layers
} from 'lucide-react';

const CodingTerminal = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Assessment & Questions
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [activeQIdx, setActiveQIdx] = useState(0);

  // Candidate Code answers state: questionId -> code string
  const [answers, setAnswers] = useState({});
  const [testRunInputs, setTestRunInputs] = useState({}); // questionId -> sample input
  const [testRunOutputs, setTestRunOutputs] = useState({}); // questionId -> sample output
  
  // Code Preview state
  const [previewRunning, setPreviewRunning] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);

  // Timer Ticking state
  const [testStarted, setTestStarted] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const fetchAssessment = async () => {
    setLoading(true);
    setError('');
    try {
      const rawData = await apiFetch(`/api/assessments/job/${assessmentId}`); 
      const data = rawData.assessment || rawData;
      setAssessment(data);
      setQuestions(data.questions || []);
      setSecondsRemaining((data.timeLimit || 45) * 60);

      // Prepopulate boilerplate answers
      const initialAnswers = {};
      const inputs = {};
      const outputs = {};
      
      if (data.questions && Array.isArray(data.questions)) {
        data.questions.forEach(q => {
          initialAnswers[q.id] = q.codeTemplate || q.template || '';
          inputs[q.id] = q.sampleInput || '[]';
          outputs[q.id] = q.sampleExpectedOutput || '""';
        });
      }
      setAnswers(initialAnswers);
      setTestRunInputs(inputs);
      setTestRunOutputs(outputs);

      if (data.alreadySubmitted) {
        setError('You have already completed this coding test. Submissions are limited to exactly 1 attempt per candidate.');
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize coding assessment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessment();
  }, [assessmentId]);

  // Timer Tick implementation
  useEffect(() => {
    if (!testStarted || secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [testStarted, secondsRemaining]);

  const handleStartTest = () => {
    if (assessment?.alreadySubmitted) return;
    setTestStarted(true);
  };

  const handleCodeChange = (code) => {
    const activeQ = questions[activeQIdx];
    setAnswers({
      ...answers,
      [activeQ.id]: code
    });
  };

  const handleRunPreview = async () => {
    const activeQ = questions[activeQIdx];
    const code = answers[activeQ.id];
    const rawInput = testRunInputs[activeQ.id];
    const rawOutput = testRunOutputs[activeQ.id];

    if (!code || !rawInput || !rawOutput) {
      alert('Please write code and supply sample inputs/outputs to run.');
      return;
    }

    setPreviewRunning(true);
    setPreviewResult(null);
    try {
      let parsedInput, parsedOutput;
      try {
        parsedInput = JSON.parse(rawInput);
        parsedOutput = JSON.parse(rawOutput);
      } catch (e) {
        // Fallback to raw string
        parsedInput = rawInput;
        parsedOutput = rawOutput;
      }

      const res = await apiFetch('/api/assessments/run-preview', {
        method: 'POST',
        body: JSON.stringify({
          code,
          sampleInput: parsedInput,
          sampleOutput: parsedOutput
        })
      });

      setPreviewResult(res);
    } catch (err) {
      setPreviewResult({
        passed: false,
        error: err.message || 'Syntax or runtime execution error.'
      });
    } finally {
      setPreviewRunning(false);
    }
  };

  const handleAutoSubmit = () => {
    alert('Time limit expired! Submitting your answers automatically.');
    submitFinalAnswers(true);
  };

  const submitFinalAnswers = async (force = false) => {
    if (!force && !window.confirm('Are you sure you want to finalize your assessment? You cannot modify answers after submission.')) {
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await apiFetch(`/api/assessments/${assessment.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers })
      });
      alert(`Coding assessment submitted! Grade Score: ${res.score}%`);
      navigate('/candidate');
    } catch (err) {
      setError(err.message || 'Failed to submit code solutions.');
      setSubmitting(false);
    }
  };

  // Helper to format remaining time
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-100">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
          <span className="text-sm font-semibold tracking-wide">Loading secure coding sandbox environment...</span>
        </div>
      </div>
    );
  }

  // Pre-test instructions view
  if (!testStarted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-200">
        <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-6">
          <div className="flex items-center space-x-3.5 pb-4 border-b border-slate-850">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Terminal className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">{assessment?.title}</h1>
              <span className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Stateless Code Sandbox Terminal</span>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start space-x-2 font-semibold">
              <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="text-xs space-y-3.5 leading-relaxed text-slate-400">
            <h3 className="font-bold text-white uppercase text-[10px] tracking-wider">Evaluation Rules & Constraints:</h3>
            <p>1. **Deterministic Testing:** Your code is executed against rigorous hidden test suites. Scoring is 100% test-case-based. LLMs or AI assistants play zero role in evaluating code output.</p>
            <p>2. **Stateless Sandbox Limits:** Script executions run inside CPU-capped Worker Threads with a **1000ms timeout threshold** to prevent infinite loops. Network interfaces, filesystem access, and system calls are strictly blocked.</p>
            <p>3. **Submission Lockout:** You are granted exactly **1 final attempt** to compile and grade your sheets. Duplicate submits or concurrent tabs will fail and lock attempts.</p>
            <p>4. **Auto-Submit:** If the ticking clock reaches 0, your current buffer is submitted and graded automatically.</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-xl border border-slate-850 text-xs">
            <div className="flex items-center space-x-2 text-slate-300 font-bold">
              <Clock className="h-4.5 w-4.5 text-emerald-400" />
              <span>Duration: {assessment?.timeLimit} Minutes</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-300 font-bold">
              <Layers className="h-4.5 w-4.5 text-indigo-400" />
              <span>Questions: {questions.length} Items</span>
            </div>
          </div>

          <button
            onClick={handleStartTest}
            disabled={!!assessment?.alreadySubmitted}
            className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              assessment?.alreadySubmitted 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-850'
                : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 hover:shadow-emerald-950/20 hover:shadow-lg'
            }`}
          >
            <span>Start Coding Assessment</span>
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    );
  }

  const activeQ = questions[activeQIdx];

  // Coding Terminal Active IDE View
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 font-sans">
      
      {/* IDE Top Bar */}
      <header className="bg-slate-900 border-b border-slate-850 p-4.5 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-3">
          <Terminal className="h-5 w-5 text-emerald-400" />
          <h1 className="text-sm font-bold tracking-tight text-white">{assessment?.title}</h1>
        </div>

        {/* Dynamic ticking clock */}
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border font-mono text-xs font-black ${
          secondsRemaining <= 180 
            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse' 
            : 'bg-slate-950 border-slate-800 text-emerald-400'
        }`}>
          <Clock className="h-4 w-4" />
          <span>{formatTime(secondsRemaining)}</span>
        </div>

        <button
          onClick={() => submitFinalAnswers(false)}
          disabled={submitting}
          className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black px-4 py-2 rounded-lg text-xs uppercase tracking-wider shadow-md hover:shadow-emerald-950/10 cursor-pointer"
        >
          {submitting ? 'Grading...' : 'Finalize & Submit'}
        </button>
      </header>

      {/* Split Workspace Editor Pane */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Side: Question selector details */}
        <section className="w-full lg:w-96 bg-slate-900 border-r border-slate-850 flex flex-col overflow-y-auto p-5 space-y-5">
          
          {/* Question selection navigator */}
          <div className="grid grid-cols-4 gap-2 pb-4 border-b border-slate-850">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => {
                  setActiveQIdx(idx);
                  setPreviewResult(null);
                }}
                className={`py-2 rounded-lg font-black text-xs transition-colors cursor-pointer border ${
                  activeQIdx === idx 
                    ? 'bg-indigo-600 text-white border-indigo-500' 
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-850'
                }`}
              >
                Q{idx + 1}
              </button>
            ))}
          </div>

          {/* Question Text */}
          {activeQ && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">{activeQ.difficulty}</span>
                <span className="text-emerald-400">{activeQ.points} Points</span>
              </div>
              <h2 className="text-sm font-bold text-white">{activeQ.title}</h2>
              <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line font-semibold">
                {activeQ.description}
              </p>
            </div>
          )}
        </section>

        {/* Center: Sandboxed Code Editor & Previewer */}
        <section className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          
          {/* Editor Header */}
          <div className="bg-slate-900 border-b border-slate-850 p-3 px-4.5 flex justify-between items-center text-xs text-slate-400">
            <span className="font-mono tracking-wider font-bold">JavaScript Sandbox Editor (Node.js 18)</span>
            <button
              onClick={() => handleCodeChange(activeQ.template || '')}
              className="text-[10px] hover:text-white border border-slate-800 hover:bg-slate-800 p-1 px-2.5 rounded transition-colors font-bold cursor-pointer"
            >
              Reset to Boilerplate Template
            </button>
          </div>

          {/* Monospace Code Editor Area */}
          <div className="flex-1 p-4 flex">
            <textarea
              value={answers[activeQ?.id] || ''}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full h-full bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded-xl border border-slate-850 focus:border-emerald-500/50 focus:ring-0 resize-none outline-none leading-relaxed"
              style={{ tabSize: 2 }}
              placeholder="// Write your Javascript function here..."
            />
          </div>

          {/* Footer Preview Panel */}
          <div className="bg-slate-900 border-t border-slate-850 p-4.5 space-y-4.5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs">
              
              {/* Sample parameters inputs */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Input</span>
                  <input
                    type="text"
                    value={testRunInputs[activeQ?.id] || ''}
                    onChange={(e) => setTestRunInputs({ ...testRunInputs, [activeQ.id]: e.target.value })}
                    placeholder="e.g. [2, 3]"
                    className="bg-slate-950 border border-slate-800 rounded p-1 text-[11px] font-mono text-emerald-400 w-32 focus:ring-0"
                  />
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Expected</span>
                  <input
                    type="text"
                    value={testRunOutputs[activeQ?.id] || ''}
                    onChange={(e) => setTestRunOutputs({ ...testRunOutputs, [activeQ.id]: e.target.value })}
                    placeholder="e.g. 5"
                    className="bg-slate-950 border border-slate-800 rounded p-1 text-[11px] font-mono text-emerald-400 w-32 focus:ring-0"
                  />
                </div>
              </div>

              {/* Run button */}
              <button
                onClick={handleRunPreview}
                disabled={previewRunning}
                className="inline-flex items-center space-x-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-indigo-400 font-bold px-4 py-2 rounded-lg text-xs tracking-wide uppercase transition-colors cursor-pointer"
              >
                {previewRunning ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5 text-indigo-400" />
                )}
                <span>Run Sandbox Preview</span>
              </button>
            </div>

            {/* Run output display */}
            {previewResult && (
              <div className={`p-4 rounded-xl border text-xs font-mono space-y-1.5 ${
                previewResult.error 
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                  : previewResult.passed 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}>
                <div className="flex justify-between items-center font-bold font-sans">
                  <span>Sandbox Run Output:</span>
                  <span className="uppercase text-[9px] px-2 py-0.5 rounded bg-slate-950">
                    {previewResult.error ? 'Compile Error' : previewResult.passed ? 'Passed ✓' : 'Failed ✖'}
                  </span>
                </div>
                {previewResult.error ? (
                  <p className="text-[11px] leading-relaxed font-bold">{previewResult.error}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-[11px] pt-1">
                    <p>Expected Output: <span className="font-bold font-mono">{JSON.stringify(previewResult.actual) === JSON.stringify(testRunOutputs[activeQ?.id]) ? 'matched' : JSON.stringify(testRunOutputs[activeQ?.id])}</span></p>
                    <p>Actual Output: <span className="font-bold font-mono">{JSON.stringify(previewResult.actual)}</span></p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
};

export default CodingTerminal;
