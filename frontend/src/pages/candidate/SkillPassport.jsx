import React, { useState, useEffect } from 'react';
import apiFetch from '../../services/api';
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  Sparkles, 
  Brain, 
  AlertTriangle,
  Award,
  Briefcase,
  Compass,
  GraduationCap,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  Loader2,
  CheckCircle,
  FileCheck
} from 'lucide-react';

const SkillPassport = () => {
  const [resume, setResume] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [evidences, setEvidences] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchResumeData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/resumes/me');
      setResume(data.resume);
      setAnalysis(data.analysis);
      setEvidences(data.skillEvidences || []);
    } catch (err) {
      if (err.message && err.message.includes('No resume uploaded')) {
        setResume(null);
        setAnalysis(null);
        setEvidences([]);
      } else {
        setError(err.message || 'Failed to load resume details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumeData();
  }, []);

  // Drag & drop logic
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragOver(true);
    } else if (e.type === "dragleave") {
      setDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndUploadFile(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndUploadFile(e.target.files[0]);
    }
  };

  const validateAndUploadFile = (file) => {
    setError('');
    setSuccess('');
    
    if (file.type !== 'application/pdf') {
      setError('Only PDF documents are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('File size exceeds the 5MB maximum limit.');
      return;
    }

    uploadFile(file);
  };

  const uploadFile = async (file) => {
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const data = await apiFetch('/api/resumes/upload', {
        method: 'POST',
        body: formData
      });
      setResume(data.resume);
      setAnalysis(data.analysis);
      setEvidences(data.skillEvidences || []);
      setSuccess('Resume uploaded and processed successfully.');
      fetchResumeData(); // reload fresh relationships
    } catch (err) {
      setError(err.message || 'Failed to upload and analyze your resume.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!resume) return;
    if (!window.confirm('Are you sure you want to delete your resume and remove your AI Skill Passport credentials?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/api/resumes/${resume.id}`, {
        method: 'DELETE'
      });
      setResume(null);
      setAnalysis(null);
      setEvidences([]);
      setSuccess('Resume profile deleted successfully.');
    } catch (err) {
      setError(err.message || 'Failed to delete resume.');
    } finally {
      setLoading(false);
    }
  };

  // Group evidence by skill name for the passport display
  const getSkillsPassport = () => {
    if (!analysis) return [];
    
    // Combine categorized skills into a flat list of names
    const skillsMap = analysis.skills || {};
    const categories = [
      { list: skillsMap.programmingLanguages, label: 'Languages' },
      { list: skillsMap.frameworks, label: 'Framework' },
      { list: skillsMap.databases, label: 'Database' },
      { list: skillsMap.cloud, label: 'Cloud' },
      { list: skillsMap.devOps, label: 'DevOps' },
      { list: skillsMap.tools, label: 'Tool' },
    ];

    const passportItems = [];

    categories.forEach(cat => {
      if (!Array.isArray(cat.list)) return;
      cat.list.forEach(skill => {
        // Find matching evidence records in database for this skill
        const skillEvs = evidences.filter(e => e.skillName.toLowerCase() === skill.toLowerCase());
        
        // Determine overall confidence
        let confidence = 'MEDIUM';
        if (skillEvs.some(e => e.confidence === 'HIGH')) {
          confidence = 'HIGH';
        } else if (skillEvs.length === 0) {
          confidence = 'LOW';
        }

        passportItems.push({
          name: skill,
          category: cat.label,
          evidenceSources: skillEvs.map(e => e.source),
          confidence
        });
      });
    });

    return passportItems;
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Loading candidate credentials...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Skill Passport</h1>
          <p className="text-sm text-slate-500">Evidence-based qualifications and parsed profile intelligence</p>
        </div>
        {resume && (
          <button
            onClick={handleDelete}
            className="inline-flex items-center space-x-2 px-3.5 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 hover:text-rose-800 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            <Trash2 className="h-4.5 w-4.5" />
            <span>Delete Resume</span>
          </button>
        )}
      </div>

      {/* Governance callout */}
      <div className="bg-indigo-900 rounded-xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-indigo-300" />
            <h3 className="font-bold text-sm tracking-wide uppercase text-indigo-300">Governance Policy</h3>
          </div>
          <p className="text-xs text-indigo-100 max-w-xl">
            "AI-assisted ranking uses job-relevant qualifications, experience, projects, certifications, and assessment evidence. Sensitive demographic attributes are excluded from ranking inputs. Final hiring decisions remain with authorized human reviewers."
          </p>
        </div>
        <span className="text-[10px] font-bold bg-indigo-800 border border-indigo-700 text-indigo-200 px-3 py-1.5 rounded-full uppercase tracking-wider whitespace-nowrap">
          AI Assists. Humans Decide.
        </span>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* STEP 1: Upload Zone (Visible if no resume exists) */}
      {!resume && (
        <div className="max-w-2xl mx-auto">
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
              dragOver 
                ? 'border-indigo-600 bg-indigo-50/50' 
                : 'border-slate-300 bg-white hover:border-slate-400'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center space-y-4 py-8">
                <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Processing Resume PDF...</h3>
                  <p className="text-xs text-slate-500 mt-1">HireMind AI is extracting skills and mapping evidence</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-indigo-50 rounded-full text-indigo-600">
                  <UploadCloud className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Upload your professional resume</h3>
                  <p className="text-sm text-slate-400 mt-1">Drag and drop your PDF file here, or click to browse</p>
                  <span className="text-[10px] text-slate-400 block mt-2">Maximum file size: 5MB (PDF format only)</span>
                </div>
                
                <div>
                  <input
                    type="file"
                    id="resume-file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="resume-file"
                    className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    Browse File
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: Resume Intelligence Dashboard (Visible once uploaded) */}
      {resume && analysis && (
        <div className="space-y-8">
          
          {/* Metadata Overview Card */}
          <div className="bg-white rounded-xl border border-slate-200/60 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <FileText className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{analysis.name || 'Candidate profile'}</h2>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400 font-semibold tracking-wide mt-1 uppercase">
                  <span>File: {resume.filename}</span>
                  <span className="h-1.5 w-1.5 bg-slate-300 rounded-full hidden sm:inline" />
                  <span>Size: {(resume.fileSize / 1024).toFixed(1)} KB</span>
                  <span className="h-1.5 w-1.5 bg-slate-300 rounded-full hidden sm:inline" />
                  <span>Uploaded: {new Date(resume.uploadedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {analysis.isRealAI ? (
                <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-xs font-bold shadow-xs">
                  <Brain className="h-3.5 w-3.5" />
                  <span>AI Analysis</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-50 border border-amber-100 rounded-full text-amber-700 text-xs font-bold shadow-xs">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Demo Analysis</span>
                </span>
              )}
              
              <input
                type="file"
                id="replace-resume"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="replace-resume"
                className="inline-flex items-center px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                Replace Resume
              </label>
            </div>
          </div>

          {/* AI Skill Passport Section (Hero UI) */}
          <div className="bg-white rounded-xl border border-slate-200/60 p-6 md:p-8 space-y-6 shadow-xs">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <FileCheck className="h-5.5 w-5.5 text-indigo-600" />
                <span>AI Skill Passport</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Cross-referenced technical qualifications verified from your uploaded credentials</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {getSkillsPassport().map((skill, idx) => (
                <div key={idx} className="border border-slate-200/60 hover:border-slate-300 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between space-y-3 transition-all hover:bg-white shadow-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{skill.name}</h4>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{skill.category}</span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      skill.confidence === 'HIGH'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : skill.confidence === 'MEDIUM'
                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {skill.confidence} CONFIDENCE
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-2.5">
                    <span className="text-[10px] text-slate-400 block font-semibold mb-1">EVIDENCE SOURCE:</span>
                    <div className="flex flex-wrap gap-1">
                      {skill.evidenceSources.includes('RESUME') && (
                        <span className="text-[9px] bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded">RESUME CLAIM</span>
                      )}
                      {skill.evidenceSources.includes('PROJECT') && (
                        <span className="text-[9px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded">PROJECT WORK</span>
                      )}
                      {skill.evidenceSources.length === 0 && (
                        <span className="text-[9px] text-slate-400 italic">Unverified Claim</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline & details grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Experience & Education timeline */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Experience */}
              <div className="bg-white rounded-xl border border-slate-200/60 p-6 md:p-8 space-y-6 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
                  <Briefcase className="h-5 w-5 text-indigo-600" />
                  <span>Work Experience</span>
                </h3>

                <div className="space-y-6 relative border-l border-slate-200/80 pl-4 ml-3">
                  {analysis.experience.map((exp, idx) => (
                    <div key={idx} className="relative space-y-2">
                      <div className="absolute -left-[25px] top-1 h-3.5 w-3.5 rounded-full border-2 border-indigo-600 bg-white" />
                      
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{exp.role}</h4>
                          <span className="text-xs text-slate-500 font-semibold">{exp.company}</span>
                        </div>
                        <div className="flex items-center text-xs text-slate-400 font-semibold gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{exp.startDate} – {exp.endDate} ({exp.duration || 'N/A'})</span>
                        </div>
                      </div>

                      <ul className="list-disc pl-4 text-xs text-slate-600 space-y-1">
                        {exp.responsibilities.map((resp, rid) => (
                          <li key={rid} className="leading-relaxed">{resp}</li>
                        ))}
                      </ul>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {exp.technologiesUsed && exp.technologiesUsed.map((t, tid) => (
                          <span key={tid} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {analysis.experience.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No professional experience parsed.</p>
                  )}
                </div>
              </div>

              {/* Projects */}
              <div className="bg-white rounded-xl border border-slate-200/60 p-6 md:p-8 space-y-6 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
                  <Layers className="h-5 w-5 text-indigo-600" />
                  <span>Projects Evidence</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.projects.map((proj, idx) => (
                    <div key={idx} className="border border-slate-200/60 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-800 text-sm">{proj.projectName}</h4>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            proj.evidenceStrength === 'HIGH' 
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {proj.evidenceStrength} EVIDENCE
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{proj.description}</p>
                      </div>

                      <div className="space-y-2 border-t border-slate-100 pt-2.5">
                        <p className="text-[10px] text-slate-600">
                          <strong className="text-slate-700">Contribution:</strong> {proj.candidateContribution}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {proj.technologies.map((t, tid) => (
                            <span key={tid} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {analysis.projects.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No projects parsed.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Right column sidebar details */}
            <div className="space-y-6">
              
              {/* Summary Card */}
              <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Professional Summary</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{analysis.summary}</p>
              </div>

              {/* Education */}
              <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <GraduationCap className="h-4.5 w-4.5 text-indigo-600" />
                  <span>Education</span>
                </h4>
                
                <div className="space-y-3">
                  {analysis.education.map((edu, idx) => (
                    <div key={idx} className="text-xs space-y-0.5">
                      <div className="font-bold text-slate-800">{edu.degree}</div>
                      <p className="text-slate-600 font-semibold">{edu.fieldOfStudy}</p>
                      <div className="text-slate-400 font-medium">
                        {edu.institution} {edu.graduationYear ? `(${edu.graduationYear})` : ''}
                      </div>
                    </div>
                  ))}
                  {analysis.education.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No education details parsed.</p>
                  )}
                </div>
              </div>

              {/* Certifications */}
              <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Award className="h-4.5 w-4.5 text-indigo-600" />
                  <span>Certifications</span>
                </h4>

                <div className="space-y-3">
                  {analysis.certifications.map((cert, idx) => (
                    <div key={idx} className="text-xs space-y-0.5">
                      <div className="font-bold text-slate-800">{cert.certificationName}</div>
                      <div className="text-slate-500 font-medium">{cert.issuingOrganization} ({cert.year || 'N/A'})</div>
                    </div>
                  ))}
                  {analysis.certifications.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No certifications listed.</p>
                  )}
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Compass className="h-4.5 w-4.5 text-indigo-600" />
                  <span>Achievements</span>
                </h4>

                <div className="space-y-3">
                  {analysis.achievements.map((ach, idx) => (
                    <div key={idx} className="text-xs">
                      <div className="font-bold text-slate-800">{ach.title}</div>
                      <p className="text-slate-500 mt-0.5 leading-relaxed">{ach.details}</p>
                    </div>
                  ))}
                  {analysis.achievements.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No achievements listed.</p>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default SkillPassport;
