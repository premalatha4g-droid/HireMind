import React, { useState, useEffect } from 'react';
import apiFetch from '../../services/api';
import { 
  Map, 
  BookOpen, 
  ArrowRight, 
  AlertCircle, 
  Loader2,
  CheckCircle2,
  Briefcase,
  Sparkles,
  Award,
  Clock,
  Compass,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CandidateRoadmaps = () => {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sample curated career tracks for instant exploration
  const popularTracks = [
    {
      id: 'track-fullstack',
      title: 'Full-Stack JavaScript & Cloud Architect Track',
      role: 'Senior Full-Stack Engineer',
      skills: ['React 19', 'Node.js Microservices', 'Redis Caching', 'Docker & CI/CD', 'GraphQL'],
      duration: '4 Weeks',
      matchBoost: '+22%',
      level: 'Advanced'
    },
    {
      id: 'track-ai-engineer',
      title: 'Generative AI & LLM Systems Engineering Track',
      role: 'AI / Machine Learning Engineer',
      skills: ['Python 3.12', 'LangChain & RAG', 'Vector DBs (Pinecone)', 'Gemini API', 'PyTorch'],
      duration: '4 Weeks',
      matchBoost: '+30%',
      level: 'Intermediate'
    },
    {
      id: 'track-backend-go',
      title: 'High-Concurrency Backend & Distributed Systems Track',
      role: 'Backend Systems Engineer',
      skills: ['Go (Golang)', 'gRPC & Protobuf', 'Kafka Event Streaming', 'PostgreSQL Optimization', 'Kubernetes'],
      duration: '3 Weeks',
      matchBoost: '+25%',
      level: 'Advanced'
    }
  ];

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      try {
        const appsData = await apiFetch('/api/assessments/my-applications');
        setApplications(Array.isArray(appsData) ? appsData : []);
      } catch (e) {
        setApplications([]);
      }

      try {
        const jobsData = await apiFetch('/api/jobs');
        setJobs(Array.isArray(jobsData) ? jobsData : []);
      } catch (e) {
        setJobs([]);
      }
    } catch (err) {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-[#0B1120] text-white p-7 rounded-2xl border border-indigo-800/60 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-indigo-500/20 text-cyan-400 rounded-xl border border-indigo-500/30">
                <Compass className="h-5 w-5 animate-spin" />
              </span>
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                Zero-Ghosting Talent Bridge
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Career Upskilling Roadmaps & Skill-Gap Healing</h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-medium">
              Autonomous, AI-generated structured syllabi designed around specific job requirements. Complete weekly milestones to heal candidate qualifications and qualify directly for technical interviews.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-indigo-500/40 p-4 rounded-xl text-center font-mono">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Avg Match Boost</span>
            <span className="text-2xl font-black text-emerald-400">+25% Match</span>
            <span className="text-[9px] text-cyan-300 block font-semibold mt-0.5">Verified Proof-of-Work</span>
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
            <span className="text-xs text-slate-500 font-semibold tracking-wide">Compiling personalized career roadmaps...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* Section 1: Active Application Roadmaps */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-2">
                  <BookOpen className="h-4.5 w-4.5 text-indigo-600" />
                  <span>My Job-Linked Learning Syllabi ({applications.length})</span>
                </h2>
                <p className="text-xs text-slate-500">Curated tracks generated for your active job applications</p>
              </div>
            </div>

            {applications.length === 0 ? (
              <div className="bg-white border border-slate-200/70 rounded-2xl p-7 text-center space-y-3 shadow-xs">
                <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mx-auto">
                  <Map className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">No Job-Linked Roadmaps Active Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  When you apply to an open position, an AI-tailored gap-healing roadmap is automatically generated for that role. You can also explore popular role tracks below!
                </p>
                <Link
                  to="/candidate/jobs"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>Browse Open Positions</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {applications.map((app) => {
                  return (
                    <div key={app.id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-6">
                      
                      {/* Top Header */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h3 className="font-black text-slate-900 text-base">{app.job?.title || 'Engineering Role'}</h3>
                            <span className="text-xs text-indigo-600 font-bold block uppercase">{app.job?.company || 'Company'}</span>
                          </div>

                          <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black uppercase">
                            {app.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                          Current Match Rating: <strong className="text-indigo-600 font-bold">{app.matchScore || 78}%</strong>. Complete the 4-week structured milestones to boost your score to 89% and trigger auto-shortlisting.
                        </p>
                      </div>

                      {/* Specs card */}
                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center space-x-1.5 text-slate-600">
                          <Clock className="h-4 w-4 text-indigo-600" />
                          <span>Timeline: <strong className="text-slate-900">4 Weeks</strong></span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-emerald-600 font-bold">
                          <Sparkles className="h-4 w-4 text-emerald-500" />
                          <span>Auto Gap Healing</span>
                        </div>
                      </div>

                      {/* Launch Button */}
                      <Link
                        to={`/candidate/applications/${app.id}/roadmap`}
                        className="w-full inline-flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm"
                      >
                        <BookOpen className="h-4 w-4" />
                        <span>Launch Interactive Workspace</span>
                      </Link>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Popular Role Tracks & Career Maps */}
          <div className="space-y-4 pt-4 border-t border-slate-200/60">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-2">
                  <Sparkles className="h-4.5 w-4.5 text-indigo-600" />
                  <span>Featured Career Upskilling Syllabi</span>
                </h2>
                <p className="text-xs text-slate-500">Accelerated curriculum tracks aligned with highest-paying industry demands</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {popularTracks.map((track) => (
                <div key={track.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-5">
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {track.level}
                      </span>
                      <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {track.matchBoost} Boost
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-slate-900 leading-tight">{track.title}</h3>
                    <span className="text-xs text-indigo-600 font-bold block">{track.role}</span>

                    {/* Skill Pills */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Core Syllabus Modules:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {track.skills.map((s, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 flex items-center space-x-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{track.duration}</span>
                    </span>

                    {applications.length > 0 ? (
                      <Link
                        to={`/candidate/applications/${applications[0].id}/roadmap`}
                        className="inline-flex items-center space-x-1 px-3.5 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        <span>Start Track</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <Link
                        to="/candidate/jobs"
                        className="inline-flex items-center space-x-1 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        <span>Apply & Start</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default CandidateRoadmaps;
