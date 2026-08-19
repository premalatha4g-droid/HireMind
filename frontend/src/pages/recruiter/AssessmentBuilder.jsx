import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiFetch from '../../services/api';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2,
  Terminal,
  Clock,
  Layers,
  HelpCircle,
  FileCode,
  Award
} from 'lucide-react';

const AssessmentBuilder = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [job, setJob] = useState(null);
  
  // Assessment fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState(45);
  const [passPercentage, setPassPercentage] = useState(60);
  const [questions, setQuestions] = useState([]);

  const fetchAssessmentData = async () => {
    setLoading(true);
    setError('');
    try {
      const jobData = await apiFetch(`/api/jobs/${jobId}`);
      setJob(jobData);

      // Try loading existing assessment
      try {
        const assessment = await apiFetch(`/api/assessments/job/${jobId}`);
        setTitle(assessment.title);
        setDescription(assessment.description);
        setTimeLimit(assessment.timeLimit);
        setPassPercentage(assessment.passPercentage !== undefined ? assessment.passPercentage : 60);
        
        // Parse test cases JSON string back to arrays
        const parsedQuestions = assessment.questions.map(q => ({
          ...q,
          testCases: JSON.parse(q.testCases || '[]')
        }));
        setQuestions(parsedQuestions);
      } catch (e) {
        // No assessment exists yet, pre-populate default layout
        setTitle(`${jobData.title} Coding Assessment`);
        setDescription('Please complete the following coding challenges. Ensure you declare your answers in functions.');
        setTimeLimit(45);
        setQuestions([
          {
            title: 'Sum of Two Numbers',
            description: 'Write a function add(a, b) that returns the sum of a and b.',
            difficulty: 'EASY',
            points: 10,
            template: `function add(a, b) {\n  // Write your code here\n  return a + b;\n}`,
            testCases: [
              { input: [2, 3], output: 5 },
              { input: [10, -5], output: 5 }
            ]
          }
        ]);
      }
    } catch (err) {
      setError('Failed to load job workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessmentData();
  }, [jobId]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        title: 'New Coding Challenge',
        description: 'Describe problem requirements and constraints.',
        difficulty: 'MEDIUM',
        points: 20,
        template: `function solve(input) {\n  // Write your code here\n  return input;\n}`,
        testCases: [
          { input: ['sample'], output: 'sample' }
        ]
      }
    ]);
  };

  const handleRemoveQuestion = (qIdx) => {
    setQuestions(questions.filter((_, idx) => idx !== qIdx));
  };

  const handleQuestionChange = (qIdx, field, value) => {
    const updated = [...questions];
    updated[qIdx][field] = value;
    setQuestions(updated);
  };

  // Test Case sub-handlers
  const handleAddTestCase = (qIdx) => {
    const updated = [...questions];
    updated[qIdx].testCases.push({ input: [], output: '' });
    setQuestions(updated);
  };

  const handleRemoveTestCase = (qIdx, tcIdx) => {
    const updated = [...questions];
    updated[qIdx].testCases = updated[qIdx].testCases.filter((_, idx) => idx !== tcIdx);
    setQuestions(updated);
  };

  const handleTestCaseChange = (qIdx, tcIdx, field, rawValue) => {
    const updated = [...questions];
    let parsedVal = rawValue;
    
    // Attempt parsing as JSON for inputs/outputs to handle numbers, arrays, or booleans correctly
    if (field === 'input' || field === 'output') {
      try {
        parsedVal = JSON.parse(rawValue);
      } catch (e) {
        parsedVal = rawValue; // fallback to string
      }
    }
    
    updated[qIdx].testCases[tcIdx][field] = parsedVal;
    setQuestions(updated);
  };

  const handleSaveAssessment = async (e) => {
    e.preventDefault();
    if (!title || !timeLimit) {
      setError('Please fill in all assessment metadata.');
      return;
    }
    if (questions.length === 0) {
      setError('Please add at least one coding question.');
      return;
    }

    // Verify all questions have test cases
    for (let i = 0; i < questions.length; i++) {
      if (questions[i].testCases.length === 0) {
        setError(`Question "${questions[i].title}" must have at least one test case.`);
        return;
      }
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await apiFetch('/api/assessments', {
        method: 'POST',
        body: JSON.stringify({
          jobId,
          title,
          description,
          timeLimit: parseInt(timeLimit, 10),
          passPercentage: parseInt(passPercentage, 10) || 60,
          questions
        })
      });
      setSuccess('Coding assessment and test suites saved successfully.');
      setTimeout(() => {
        navigate('/recruiter/jobs');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to save coding assessment.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Loading coding workspace details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-slate-200/60 pb-5">
        <Link to="/recruiter/jobs" className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Coding Test Configurator</h1>
          <p className="text-xs text-slate-500 font-semibold tracking-wide uppercase">
            Define Sandbox Coding Questions & Test Suites
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

      {/* Main Workspace split */}
      <form onSubmit={handleSaveAssessment} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: metadata settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/60 p-5 space-y-4 shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm pb-2 border-b border-slate-100 flex items-center space-x-2">
              <Terminal className="h-4.5 w-4.5 text-indigo-600" />
              <span>Assessment settings</span>
            </h3>

            <div className="text-xs space-y-3.5">
              <div className="space-y-1">
                <label className="block font-bold text-slate-600 uppercase tracking-wide">Test Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Frontend React Code Test"
                  className="w-full bg-white border border-slate-250 p-2 rounded-lg font-semibold text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 uppercase tracking-wide flex items-center space-x-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Time Limit (Mins)</span>
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-250 p-2 rounded-lg font-semibold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 uppercase tracking-wide flex items-center space-x-1">
                    <Award className="h-3.5 w-3.5 text-slate-400" />
                    <span>Pass Cutoff (%)</span>
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={passPercentage}
                    onChange={(e) => setPassPercentage(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-250 p-2 rounded-lg font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600 uppercase tracking-wide">Candidate Instructions</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="4"
                  placeholder="Provide instructions, execution notes, and constraints..."
                  className="w-full bg-white border border-slate-250 p-2.5 rounded-lg font-semibold text-slate-700"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition-all shadow-xs hover:shadow-md cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>Save Coding Test</span>
            </button>
          </div>
        </div>

        {/* Right column: Questions matrix editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-xs space-y-6">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-900 text-sm">Coding Challenges Editor</h3>
                <p className="text-xs text-slate-500">Configure questions, expected templates, and test validations</p>
              </div>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-indigo-250 hover:bg-indigo-50/40 text-indigo-600 font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Coding Question</span>
              </button>
            </div>

            {/* Questions list */}
            <div className="space-y-6 max-h-[650px] overflow-y-auto pr-1">
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4 shadow-xs relative">
                  
                  {/* Remove question */}
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    className="absolute top-5 right-5 p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                    title="Remove Question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  {/* Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="md:col-span-2 space-y-1">
                      <label className="block font-bold text-slate-500">QUESTION TITLE</label>
                      <input
                        type="text"
                        value={q.title}
                        onChange={(e) => handleQuestionChange(qIdx, 'title', e.target.value)}
                        required
                        className="w-full bg-white border border-slate-200 p-1.5 rounded font-semibold text-slate-700"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-500">POINTS</label>
                        <input
                          type="number"
                          value={q.points}
                          onChange={(e) => handleQuestionChange(qIdx, 'points', e.target.value)}
                          required
                          className="w-full bg-white border border-slate-200 p-1.5 rounded font-semibold text-slate-700"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-500">DIFFICULTY</label>
                        <select
                          value={q.difficulty}
                          onChange={(e) => handleQuestionChange(qIdx, 'difficulty', e.target.value)}
                          className="w-full bg-white border border-slate-200 p-1.5 rounded font-semibold text-slate-700"
                        >
                          <option value="EASY">EASY</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HARD">HARD</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs space-y-1">
                    <label className="block font-bold text-slate-600 uppercase tracking-wide">Question Description</label>
                    <textarea
                      value={q.description}
                      onChange={(e) => handleQuestionChange(qIdx, 'description', e.target.value)}
                      rows="3"
                      required
                      className="w-full bg-white border border-slate-250 p-2.5 rounded-lg font-semibold text-slate-700"
                    />
                  </div>

                  <div className="text-xs space-y-1">
                    <label className="block font-bold text-slate-600 uppercase tracking-wide flex items-center space-x-1">
                      <FileCode className="h-3.5 w-3.5 text-slate-400" />
                      <span>Boilerplate Code Template</span>
                    </label>
                    <textarea
                      value={q.template}
                      onChange={(e) => handleQuestionChange(qIdx, 'template', e.target.value)}
                      rows="4"
                      className="w-full bg-slate-900 border border-slate-800 text-emerald-400 p-2.5 rounded-lg font-mono text-xs focus:ring-emerald-500"
                    />
                  </div>

                  {/* Test Cases Sub-matrix */}
                  <div className="space-y-3 pt-3 border-t border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700">Test Cases Suite ({q.testCases.length})</span>
                      <button
                        type="button"
                        onClick={() => handleAddTestCase(qIdx)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded text-[10px] cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Test Case</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {q.testCases.map((tc, tcIdx) => (
                        <div key={tcIdx} className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-white p-2.5 border border-slate-200 rounded-lg text-xs items-center">
                          
                          <div className="md:col-span-2 space-y-0.5">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase">Input args (JSON format)</label>
                            <input
                              type="text"
                              value={JSON.stringify(tc.input)}
                              onChange={(e) => handleTestCaseChange(qIdx, tcIdx, 'input', e.target.value)}
                              placeholder='e.g. [2, 3] or ["word"]'
                              required
                              className="w-full bg-slate-50 border border-slate-200 p-1.5 rounded text-[11px] font-mono text-slate-700"
                            />
                          </div>

                          <div className="md:col-span-2 space-y-0.5">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase">Expected Output (JSON format)</label>
                            <input
                              type="text"
                              value={JSON.stringify(tc.output)}
                              onChange={(e) => handleTestCaseChange(qIdx, tcIdx, 'output', e.target.value)}
                              placeholder='e.g. 5 or "drow"'
                              required
                              className="w-full bg-slate-50 border border-slate-200 p-1.5 rounded text-[11px] font-mono text-slate-700"
                            />
                          </div>

                          <div className="flex justify-end pt-3 md:pt-0">
                            <button
                              type="button"
                              onClick={() => handleRemoveTestCase(qIdx, tcIdx)}
                              className="text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded cursor-pointer"
                              title="Remove Test Case"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ))}

              {questions.length === 0 && (
                <div className="text-center py-12 text-slate-400 space-y-2 border-2 border-dashed border-slate-100 rounded-xl">
                  <Terminal className="h-10 w-10 mx-auto text-slate-200" />
                  <p className="text-xs">No coding challenges added yet.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </form>
    </div>
  );
};

export default AssessmentBuilder;
