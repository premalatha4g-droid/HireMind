import React, { useState, useEffect } from 'react';
import apiFetch from '../../services/api';
import { 
  Award, 
  Clock, 
  Terminal, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Code2,
  Brain,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CandidateAssessments = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sample practice challenges ready to launch anytime
  const practiceChallenges = [
    {
      id: 'practice-algo-1',
      title: 'Algorithmic Optimization & Two-Pointer Sandbox',
      difficulty: 'MEDIUM',
      timeLimit: 45,
      description: 'Practice array traversal, time complexity optimization, and memory management under live proctored conditions.',
      topics: ['Arrays', 'Hash Maps', 'Time Complexity']
    },
    {
      id: 'practice-system-2',
      title: 'Full-Stack Async Concurrency & Data Structures',
      difficulty: 'HARD',
      timeLimit: 60,
      description: 'Solve real-world distributed system edge cases, promise race conditions, and LRU cache structures.',
      topics: ['Microtasks', 'Caching', 'Concurrency']
    }
  ];

  const fetchAssessments = async () => {
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
    fetchAssessments();
  }, []);

  // Filter jobs that have coding assessments
  const assessmentPipelines = applications.filter(app => app.job && (app.job.assessment || app.job.id));

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#0A0F1D] text-white p-7 rounded-2xl border border-indigo-800/60 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                Verifiable Competency Proof
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Technical Coding Assessments & AI Proctoring</h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-medium">
              Complete automated sandbox coding tests. All assessments run with Live WebCam AI Face Verification, Audio Monitoring, and instant autograding to grant verified skill credentials on your Skill Passport.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-emerald-500/40 p-4 rounded-xl text-center font-mono">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Standard Passing Cutoff</span>
            <span className="text-2xl font-black text-emerald-400">60% Score</span>
            <span className="text-[9px] text-cyan-300 block font-semibold mt-0.5">Instant Shortlisting</span>
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
            <span className="text-xs text-slate-500 font-semibold tracking-wide">Loading your technical assessments...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* Section 1: Assigned Job Assessments */}
          <div className="space-y-4">
            <div className="border-b border-slate-200/60 pb-3">
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <Terminal className="h-4.5 w-4.5 text-indigo-600" />
                <span>Job Position Coding Challenges ({assessmentPipelines.length})</span>
              </h2>
              <p className="text-xs text-slate-500">Challenges linked to your applied job openings</p>
            </div>

            {assessmentPipelines.length === 0 ? (
              <div className="bg-white border border-slate-200/70 rounded-2xl p-7 text-center space-y-3 shadow-xs">
                <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mx-auto">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">No Job-Assigned Tests Right Now</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  When you apply to technical positions, the linked coding challenge will appear here. In the meantime, you can launch a practice proctored challenge below!
                </p>
                <Link
                  to="/candidate/jobs"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  <span>Explore Jobs</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assessmentPipelines.map((app) => {
                  const test = app.job?.assessment || {
                    id: app.job?.id,
                    title: `${app.job?.title || 'Technical'} Coding Challenge`,
                    timeLimit: 45,
                    description: 'Demonstrate algorithmic problem solving and clean code practices.'
                  };
                  const submission = (app.submissions || []).find(s => s.assessmentId === test.id || s.assessmentId === app.job?.id);

                  return (
                    <div key={app.id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-6">
                      
                      {/* Header */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h3 className="font-black text-slate-900 text-base">{test.title}</h3>
                            <span className="text-xs text-indigo-600 font-bold block uppercase mt-0.5">{app.job?.title || 'Job'} ({app.job?.company || 'Company'})</span>
                          </div>

                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                            submission 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                          }`}>
                            {submission ? 'COMPLETED ✓' : 'PENDING ACTION'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {test.description || 'Complete the coding challenge in Node.js / JavaScript to verify your technical profile.'}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex justify-between items-center text-xs font-semibold">
                        <div className="flex items-center space-x-1.5 text-slate-600">
                          <Clock className="h-4 w-4 text-indigo-600" />
                          <span>Duration: <strong className="text-slate-900">{test.timeLimit || 45} Mins</strong></span>
                        </div>

                        {submission && (
                          <div className="flex items-center space-x-1.5 text-slate-600">
                            <Terminal className="h-4 w-4 text-emerald-600" />
                            <span>Grade: <strong className="text-emerald-600 font-black text-sm">{submission.score}%</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Action button */}
                      <div>
                        {submission ? (
                          <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                            <CheckCircle className="h-4 w-4 flex-shrink-0" />
                            <span>Graded & Verified. Passport badge awarded!</span>
                          </div>
                        ) : (
                          <Link
                            to={`/candidate/assessment/${app.job?.id || app.id}`}
                            className="w-full inline-flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
                          >
                            <Terminal className="h-4 w-4" />
                            <span>Launch Proctored Sandbox</span>
                          </Link>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Proctored Practice Coding Challenges */}
          <div className="space-y-4 pt-4 border-t border-slate-200/60">
            <div className="pb-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <Code2 className="h-4.5 w-4.5 text-indigo-600" />
                <span>On-Demand Practice Sandboxes (Live AI Proctoring)</span>
              </h2>
              <p className="text-xs text-slate-500">Test your webcam, microphone, and coding speed in an untracked practice sandbox</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {practiceChallenges.map((prac) => (
                <div key={prac.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-5">
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {prac.difficulty}
                      </span>
                      <span className="text-slate-500 font-bold flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{prac.timeLimit} Mins</span>
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-slate-900">{prac.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {prac.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {prac.topics.map((t, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-100 text-slate-650 font-bold px-2 py-0.5 rounded-md">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    to={`/candidate/assessment/${prac.id}`}
                    className="w-full inline-flex items-center justify-center space-x-2 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    <Zap className="h-3.5 w-3.5 fill-white" />
                    <span>Launch Practice Sandbox</span>
                  </Link>

                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default CandidateAssessments;
