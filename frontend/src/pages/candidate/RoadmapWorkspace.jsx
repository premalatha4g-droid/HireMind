import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiFetch from '../../services/api';
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Loader2, 
  Sparkles, 
  AlertCircle,
  Award,
  ChevronRight
} from 'lucide-react';

const RoadmapWorkspace = () => {
  const { applicationId } = useParams();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [roadmap, setRoadmap] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeWeek, setActiveWeek] = useState(1);

  const fetchRoadmap = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/api/roadmaps/application/${applicationId}`);
      setRoadmap(data);
      setTasks(data.tasks || []);
    } catch (err) {
      if (err.message.includes('No learning roadmap')) {
        setRoadmap(null); // not generated yet
      } else {
        setError(err.message || 'Failed to load career upskilling roadmap.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, [applicationId]);

  const handleGenerateRoadmap = async () => {
    setGenerating(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch(`/api/roadmaps/generate/${applicationId}`, {
        method: 'POST'
      });
      setSuccess('Your personalized upskilling roadmap has been successfully compiled!');
      setRoadmap(res.roadmap);
      setTasks(res.roadmap.tasks || []);
    } catch (err) {
      setError(err.message || 'Roadmap compilation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    
    // Optimistic UI update
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));

    try {
      await apiFetch(`/api/roadmaps/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });
    } catch (err) {
      // rollback on error
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: currentStatus } : t));
      alert('Failed to update task status. Try again.');
    }
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'EASY': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'MEDIUM': return 'bg-amber-50 text-amber-750 border-amber-100';
      case 'HARD': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Resolving your upskilling track...</span>
        </div>
      </div>
    );
  }

  // Pre-generation workspace
  if (!roadmap) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pt-8">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <Link to="/candidate" className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Career Upskilling Track</h1>
            <p className="text-xs text-slate-500 font-medium">Personalized study roadmaps designed around profile skill gaps</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 p-8 text-center space-y-6 shadow-xs">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full w-fit mx-auto">
            <BookOpen className="h-10 w-10" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">No Learning Roadmap Found</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Generate a weekly structured roadmap custom-fit to close the gap between your skill set and this specific job's qualifications.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleGenerateRoadmap}
            disabled={generating}
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Compiling Syllabus...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Career Roadmap</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const weeks = [1, 2, 3, 4];
  const activeTasks = tasks.filter(t => t.week === activeWeek);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200/60 pb-5">
        <div className="flex items-center space-x-3">
          <Link to="/candidate" className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Career Upskilling Workspace</h1>
            <p className="text-xs text-slate-500 font-medium">Bridge your profile credentials to match role requirements</p>
          </div>
        </div>

        {/* AI verification badge */}
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100 w-fit">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
          <span>{roadmap.isRealAI !== false ? 'AI Generated Roadmap' : 'Demo Upskilling Template'}</span>
        </span>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Stats and Tabs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Left pane: Progress summary */}
        <div className="bg-white rounded-xl border border-slate-200/60 p-5 space-y-4 shadow-xs">
          <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5 border-b border-slate-100 pb-2">
            <Award className="h-4.5 w-4.5 text-indigo-600" />
            <span>Upskilling Progress</span>
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
              <span>Overall Completion</span>
              <span className="text-indigo-600">{progressPercent}%</span>
            </div>
            
            {/* Progress bar */}
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-550" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="text-[10px] text-slate-400 font-semibold pt-1">
              {completedTasks} of {totalTasks} milestones achieved
            </div>
          </div>

          {/* Week Selector buttons */}
          <div className="space-y-1.5 pt-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Course Timeline</label>
            <div className="flex flex-col gap-1.5">
              {weeks.map((wk) => {
                const wkTasks = tasks.filter(t => t.week === wk);
                const wkDone = wkTasks.filter(t => t.status === 'COMPLETED').length;
                const wkProgress = wkTasks.length > 0 ? Math.round((wkDone / wkTasks.length) * 100) : 0;

                return (
                  <button
                    key={wk}
                    onClick={() => setActiveWeek(wk)}
                    className={`w-full flex justify-between items-center p-2.5 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer ${
                      activeWeek === wk 
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs' 
                        : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                    }`}
                  >
                    <span>Week {wk}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${activeWeek === wk ? 'bg-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
                      {wkProgress}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right pane: Task Checklist details */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200/60 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Week {activeWeek} Syllabus</h3>
            <p className="text-xs text-slate-500">Complete the target study sessions and check off boxes</p>
          </div>

          <div className="space-y-4">
            {activeTasks.map((task) => (
              <div 
                key={task.id} 
                className={`p-4 border rounded-xl flex items-start gap-4 transition-all ${
                  task.status === 'COMPLETED' 
                    ? 'bg-slate-50/50 border-slate-150' 
                    : 'bg-white border-slate-200 hover:shadow-xs'
                }`}
              >
                {/* Custom Checkbox */}
                <button
                  onClick={() => handleToggleTask(task.id, task.status)}
                  className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center cursor-pointer transition-all ${
                    task.status === 'COMPLETED' 
                      ? 'bg-emerald-600 border-emerald-500 text-white' 
                      : 'border-slate-300 hover:border-slate-500 bg-white'
                  }`}
                >
                  {task.status === 'COMPLETED' && <CheckCircle2 className="h-3.5 w-3.5 stroke-[3px]" />}
                </button>

                {/* Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <h4 className={`text-xs font-black uppercase tracking-wide ${task.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-950'}`}>
                      {task.title}
                    </h4>
                    
                    {/* Badges */}
                    <div className="flex items-center space-x-2 text-[9px] font-extrabold uppercase">
                      <span className={`px-2 py-0.5 rounded border ${getDifficultyColor(task.difficulty)}`}>
                        {task.difficulty}
                      </span>
                      <span className="inline-flex items-center text-slate-400 font-bold">
                        <Clock className="h-3 w-3 mr-0.5" />
                        <span>{task.estimatedTime}</span>
                      </span>
                    </div>
                  </div>

                  <p className={`text-xs leading-relaxed font-semibold ${task.status === 'COMPLETED' ? 'text-slate-400' : 'text-slate-650'}`}>
                    {task.description}
                  </p>
                </div>
              </div>
            ))}

            {activeTasks.length === 0 && (
              <div className="text-center py-12 text-slate-400 italic text-xs">
                No upskilling milestones assigned for this week.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default RoadmapWorkspace;
