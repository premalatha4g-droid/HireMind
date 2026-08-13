import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import apiFetch from '../../services/api';
import { 
  Sparkles, 
  ArrowLeft, 
  Save, 
  UploadCloud, 
  Plus, 
  X, 
  Brain, 
  AlertTriangle, 
  CheckCircle,
  HelpCircle,
  Briefcase,
  MapPin,
  DollarSign
} from 'lucide-react';

const parseArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return [val];
  }
};

const JobIntelligenceWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Form Step 1: Input details
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    employmentType: 'FULL_TIME',
    salary: '',
    experienceYears: 2,
    description: '',
  });

  // Form Step 2: AI extraction review
  const [analysisResult, setAnalysisResult] = useState({
    id: '',
    summary: '',
    responsibilities: [],
    requiredSkills: [],
    preferredSkills: [],
    education: '',
    certifications: [],
    technologies: [],
    seniorityLevel: '',
    isRealAI: false,
  });

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');

  // Skill input helper states
  const [newRequiredSkill, setNewRequiredSkill] = useState('');
  const [newPreferredSkill, setNewPreferredSkill] = useState('');
  const [newTech, setNewTech] = useState('');

  useEffect(() => {
    if (isEditMode) {
      // Load existing job details for editing
      const fetchJobDetails = async () => {
        setLoading(true);
        setError('');
        try {
          const job = await apiFetch(`/api/jobs/${id}`);
          setFormData({
            title: job.title,
            company: job.company,
            location: job.location,
            employmentType: job.employmentType,
            salary: job.salary,
            experienceYears: job.experienceYears,
            description: job.description,
          });

          if (job.analysis) {
            const analysis = job.analysis;
            setAnalysisResult({
              id: job.id,
              summary: analysis.summary || '',
              responsibilities: parseArray(analysis.responsibilities),
              requiredSkills: parseArray(analysis.requiredSkills),
              preferredSkills: parseArray(analysis.preferredSkills),
              education: analysis.education || '',
              certifications: parseArray(analysis.certifications),
              technologies: parseArray(analysis.technologies),
              seniorityLevel: analysis.seniorityLevel || 'MID',
              isRealAI: !!analysis.isRealAI,
            });
            setStep(2);
          }
        } catch (err) {
          setError(err.message || 'Failed to load job details.');
        } finally {
          setLoading(false);
        }
      };

      fetchJobDetails();
    }
  }, [id, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'experienceYears' ? parseInt(value) || 0 : value
    }));
  };

  const handleTriggerAnalysis = async (e) => {
    e.preventDefault();
    if (formData.description.length < 15) {
      setError('Please provide a more detailed job description (minimum 15 characters).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiFetch('/api/jobs/analyze', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const savedJob = data.job;
      const analysis = data.analysis || savedJob.analysis;

      setAnalysisResult({
        id: savedJob.id,
        summary: analysis ? (analysis.summary || '') : '',
        responsibilities: analysis ? parseArray(analysis.responsibilities) : [],
        requiredSkills: analysis ? parseArray(analysis.requiredSkills) : [],
        preferredSkills: analysis ? parseArray(analysis.preferredSkills) : [],
        education: analysis ? (analysis.education || '') : '',
        certifications: analysis ? parseArray(analysis.certifications) : [],
        technologies: analysis ? parseArray(analysis.technologies) : [],
        seniorityLevel: analysis ? (analysis.seniorityLevel || 'MID') : 'MID',
        isRealAI: analysis ? !!analysis.isRealAI : false,
      });

      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to analyze job description.');
    } finally {
      setLoading(false);
    }
  };

  // Tag modifiers
  const removeSkill = (type, index) => {
    setAnalysisResult(prev => {
      const updated = { ...prev };
      if (type === 'required') {
        updated.requiredSkills.splice(index, 1);
      } else {
        updated.preferredSkills.splice(index, 1);
      }
      return updated;
    });
  };

  const addSkill = (type) => {
    const val = type === 'required' ? newRequiredSkill.trim() : newPreferredSkill.trim();
    if (!val) return;

    setAnalysisResult(prev => {
      const updated = { ...prev };
      if (type === 'required') {
        if (!updated.requiredSkills.includes(val)) {
          updated.requiredSkills.push(val);
        }
        setNewRequiredSkill('');
      } else {
        if (!updated.preferredSkills.includes(val)) {
          updated.preferredSkills.push(val);
        }
        setNewPreferredSkill('');
      }
      return updated;
    });
  };

  const removeTech = (index) => {
    setAnalysisResult(prev => {
      const updated = { ...prev };
      updated.technologies.splice(index, 1);
      return updated;
    });
  };

  const addTech = () => {
    const val = newTech.trim();
    if (!val) return;
    setAnalysisResult(prev => {
      const updated = { ...prev };
      if (!updated.technologies.includes(val)) {
        updated.technologies.push(val);
      }
      return updated;
    });
    setNewTech('');
  };

  const handlePublishJob = async (publishStatus = 'ACTIVE') => {
    setSaveLoading(true);
    setError('');
    
    const jobId = isEditMode ? id : analysisResult.id;
    if (!jobId) {
      setError('Job ID is missing. Re-analyze and try again.');
      setSaveLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        ...analysisResult,
      };

      await apiFetch(`/api/jobs/${jobId}/publish`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      navigate('/recruiter/jobs');
    } catch (err) {
      setError(err.message || 'Failed to publish job listing.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex items-center space-x-3">
        <Link 
          to="/recruiter/jobs" 
          className="p-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEditMode ? 'Edit Job Intelligence' : 'Job Intelligence Workspace'}
          </h1>
          <p className="text-sm text-slate-500">
            {step === 1 ? 'Enter manual job postings for AI parsing' : 'Review and optimize AI extracted talent parameters'}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Input Job Info */}
      {step === 1 && (
        <form onSubmit={handleTriggerAnalysis} className="bg-white rounded-xl border border-slate-200/60 p-6 md:p-8 space-y-6 shadow-xs">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center space-x-2">
            <Briefcase className="h-5 w-5 text-indigo-600" />
            <span>Job Details</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Job Title *
              </label>
              <input
                id="title"
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. Java Backend Engineer"
                className="block w-full border border-slate-200 rounded-lg py-2.5 px-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Company Name *
              </label>
              <input
                id="company"
                type="text"
                name="company"
                required
                value={formData.company}
                onChange={handleInputChange}
                placeholder="e.g. TechCorp Solutions"
                className="block w-full border border-slate-200 rounded-lg py-2.5 px-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Location *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <MapPin className="h-4.5 w-4.5" />
                </span>
                <input
                  id="location"
                  type="text"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. San Francisco, CA (Hybrid)"
                  className="pl-9 block w-full border border-slate-200 rounded-lg py-2.5 px-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="employmentType" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Employment Type
              </label>
              <select
                id="employmentType"
                name="employmentType"
                value={formData.employmentType}
                onChange={handleInputChange}
                className="block w-full border border-slate-200 rounded-lg py-2.5 px-3 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Internship</option>
              </select>
            </div>

            <div>
              <label htmlFor="salary" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Salary Range *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <DollarSign className="h-4.5 w-4.5" />
                </span>
                <input
                  id="salary"
                  type="text"
                  name="salary"
                  required
                  value={formData.salary}
                  onChange={handleInputChange}
                  placeholder="e.g. $110,000 - $140,000"
                  className="pl-9 block w-full border border-slate-200 rounded-lg py-2.5 px-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="experienceYears" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Preferred Experience (Years)
              </label>
              <input
                id="experienceYears"
                type="number"
                name="experienceYears"
                min="0"
                value={formData.experienceYears}
                onChange={handleInputChange}
                className="block w-full border border-slate-200 rounded-lg py-2.5 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Job Description *
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows="8"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Paste the full job requirements and role description here. AI will extract skills, experience levels, education, and responsibilities."
              className="block w-full border border-slate-200 rounded-lg py-2.5 px-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm leading-relaxed"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2Spinner className="h-4.5 w-4.5 animate-spin" />
                  <span>AI Analyzing Description...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4.5 w-4.5" />
                  <span>Analyze with AI</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Review AI Extraction Results */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Review Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200/60 p-6 md:p-8 space-y-6 shadow-xs">
              
              {/* Header with Source Label */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-800">Review Extracted Criteria</h2>
                {analysisResult.isRealAI ? (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-xs font-semibold">
                    <Brain className="h-3.5 w-3.5" />
                    <span>AI Analysis</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-amber-700 text-xs font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Demo Analysis</span>
                  </span>
                )}
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    AI-Generated Summary
                  </label>
                  <textarea
                    rows="3"
                    value={analysisResult.summary}
                    onChange={(e) => setAnalysisResult({ ...analysisResult, summary: e.target.value })}
                    className="block w-full border border-slate-200 rounded-lg py-2.5 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Seniority Level
                    </label>
                    <input
                      type="text"
                      value={analysisResult.seniorityLevel}
                      onChange={(e) => setAnalysisResult({ ...analysisResult, seniorityLevel: e.target.value })}
                      className="block w-full border border-slate-200 rounded-lg py-2.5 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Experience Years Required
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={analysisResult.experienceYears}
                      onChange={(e) => setAnalysisResult({ ...analysisResult, experienceYears: parseInt(e.target.value) || 0 })}
                      className="block w-full border border-slate-200 rounded-lg py-2.5 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Education Required
                    </label>
                    <input
                      type="text"
                      value={analysisResult.education}
                      onChange={(e) => setAnalysisResult({ ...analysisResult, education: e.target.value })}
                      className="block w-full border border-slate-200 rounded-lg py-2.5 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                </div>

                {/* Skills Management */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Required Skills (Used by Match Engine - 40% weight)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    {analysisResult.requiredSkills.map((skill, index) => (
                      <span key={index} className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                        <span>{skill}</span>
                        <button type="button" onClick={() => removeSkill('required', index)} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {analysisResult.requiredSkills.length === 0 && (
                      <span className="text-xs text-slate-400 italic">No required skills added.</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newRequiredSkill}
                      onChange={(e) => setNewRequiredSkill(e.target.value)}
                      placeholder="Add required skill..."
                      className="flex-1 border border-slate-200 rounded-lg py-1.5 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill('required'))}
                    />
                    <button
                      type="button"
                      onClick={() => addSkill('required')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Preferred Skills
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    {analysisResult.preferredSkills.map((skill, index) => (
                      <span key={index} className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-50 border border-amber-100 text-amber-800 font-bold text-xs rounded-full">
                        <span>{skill}</span>
                        <button type="button" onClick={() => removeSkill('preferred', index)} className="text-amber-600 hover:text-amber-900 cursor-pointer">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {analysisResult.preferredSkills.length === 0 && (
                      <span className="text-xs text-slate-400 italic">No preferred skills added.</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newPreferredSkill}
                      onChange={(e) => setNewPreferredSkill(e.target.value)}
                      placeholder="Add preferred skill..."
                      className="flex-1 border border-slate-200 rounded-lg py-1.5 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill('preferred'))}
                    />
                    <button
                      type="button"
                      onClick={() => addSkill('preferred')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Technologies List */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Technologies / Stack
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    {analysisResult.technologies.map((tech, index) => (
                      <span key={index} className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs rounded-full">
                        <span>{tech}</span>
                        <button type="button" onClick={() => removeTech(index)} className="text-slate-500 hover:text-slate-800 cursor-pointer">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {analysisResult.technologies.length === 0 && (
                      <span className="text-xs text-slate-400 italic">No tech stack listed.</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTech}
                      onChange={(e) => setNewTech(e.target.value)}
                      placeholder="Add technology..."
                      className="flex-1 border border-slate-200 rounded-lg py-1.5 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTech())}
                    />
                    <button
                      type="button"
                      onClick={addTech}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  Edit Description
                </button>
                <button
                  type="button"
                  onClick={() => handlePublishJob()}
                  disabled={saveLoading}
                  className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition-colors cursor-pointer shadow-xs"
                >
                  {saveLoading ? (
                    <>
                      <Loader2Spinner className="h-4.5 w-4.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4.5 w-4.5" />
                      <span>Publish & Save Job</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* Right column: Original Info Preview */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-xs">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Original Specifications</h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <span className="block text-xs font-semibold text-slate-400 mb-0.5">Role / Company</span>
                  <div className="font-bold text-slate-800">{formData.title}</div>
                  <div className="text-slate-500 font-semibold text-xs">{formData.company}</div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-slate-400 mb-0.5">Location & Type</span>
                  <div className="text-slate-700">{formData.location}</div>
                  <div className="text-slate-500 font-semibold text-xs uppercase tracking-wider mt-0.5">
                    {formData.employmentType.replace('_', ' ')}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-slate-400 mb-0.5">Salary Range</span>
                  <div className="font-semibold text-slate-700">{formData.salary}</div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <span className="block text-xs font-bold text-indigo-600 mb-2 uppercase tracking-wide">
                    Human-in-the-loop Rule
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    AI extracts qualifications to build evidence criteria, but a human recruiter must review and approve this setup before publishing.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
};

// Simple spinner component
const Loader2Spinner = ({ className }) => (
  <svg 
    className={className} 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24"
  >
    <circle 
      className="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="4"
    />
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export default JobIntelligenceWorkspace;
