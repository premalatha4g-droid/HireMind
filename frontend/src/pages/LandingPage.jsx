import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Brain, 
  UserCheck, 
  Compass, 
  Award, 
  ChevronRight, 
  Sparkles, 
  Users, 
  Code,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleCTA = () => {
    if (isAuthenticated) {
      if (user.role === 'CANDIDATE') navigate('/candidate');
      else if (user.role === 'RECRUITER') navigate('/recruiter');
      else if (user.role === 'INTERVIEWER') navigate('/interviewer');
      else if (user.role === 'HIRING_MANAGER') navigate('/hiring-manager');
      else if (user.role === 'ADMIN') navigate('/admin');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="landing-container">
      {/* Navigation Header */}
      <nav className="landing-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-indigo-600 rounded text-white">
              <Brain className="h-6 w-6" />
            </div>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">HireMind AI</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={handleCTA}
              className="btn btn-primary text-xs shadow-xs"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Create Account'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="landing-hero">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="landing-hero-badge">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Evidence-First Talent Intelligence</span>
          </div>
          <h1 className="landing-hero-title">
            Verifiable Talent Matching <br />
            <span className="text-indigo-600">Driven by Transparent AI.</span>
          </h1>
          <p className="landing-hero-subtitle">
            Eliminate candidate placement guess-work. Build bias-reduced recruitment pipelines backed by sandbox assessments, dynamic interviews, and personalized candidate roadmaps.
          </p>
          <div className="flex justify-center space-x-4 pt-2">
            <button
              onClick={handleCTA}
              className="btn btn-primary flex items-center space-x-1.5 shadow-xs"
            >
              <span>Explore Platform</span>
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('features');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn btn-outline"
            >
              Learn More
            </button>
          </div>
        </div>
      </header>

      {/* Product Feature Capabilities Grid */}
      <section id="features" className="bg-white border-y border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900">Platform Core Capabilities</h2>
            <p className="text-sm text-slate-500">Discover how HireMind AI coordinates every phase of talent operations seamlessly.</p>
          </div>

          <div className="landing-features-grid">
            
            {/* Box 1 */}
            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="landing-feature-title">AI Job Analysis</h3>
              <p className="landing-feature-desc">
                Parse descriptions to map required core competencies, technologies, seniority parameters, and required certifications.
              </p>
            </div>

            {/* Box 2 */}
            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <UserCheck className="h-6 w-6" />
              </div>
              <h3 className="landing-feature-title">AI Skill Passport</h3>
              <p className="landing-feature-desc">
                Consolidate verified skills, candidate experience details, portfolio evidence, and credentials in one unified profile.
              </p>
            </div>

            {/* Box 3 */}
            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="landing-feature-title">Deterministic Matching</h3>
              <p className="landing-feature-desc">
                Rank talent objectively based on qualifications, experience, and scores while keeping demographic attributes isolated.
              </p>
            </div>

            {/* Box 4 */}
            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="landing-feature-title">Evidence Verification</h3>
              <p className="landing-feature-desc">
                Track candidate proof checks with explainable confidence distributions across certifications, sandboxes, and interview answers.
              </p>
            </div>

            {/* Box 5 */}
            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <Code className="h-6 w-6" />
              </div>
              <h3 className="landing-feature-title">Coding Assessments</h3>
              <p className="landing-feature-desc">
                Assess developers in live sandbox environments with automatic code execution validation and secure grading rules.
              </p>
            </div>

            {/* Box 6 */}
            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <HelpCircle className="h-6 w-6" />
              </div>
              <h3 className="landing-feature-title">AI-Assisted Interviews</h3>
              <p className="landing-feature-desc">
                Generate custom, competency-specific question sets to evaluate candidate skill gaps and log score evaluations.
              </p>
            </div>

            {/* Box 7 */}
            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <Compass className="h-6 w-6" />
              </div>
              <h3 className="landing-feature-title">Upskilling Roadmaps</h3>
              <p className="landing-feature-desc">
                Equip candidates with structured study roadmaps to acquire missing qualifications and improve job readiness scores.
              </p>
            </div>

            {/* Box 8 */}
            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="landing-feature-title">Human-in-the-Loop</h3>
              <p className="landing-feature-desc">
                Assure compliance with human review standards. AI provides matching recommendations, while authorized humans make decisions.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Governance callout banner */}
      <section className="governance-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight mb-3">AI Assists. Humans Decide.</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">
            "Our algorithms rank candidates based strictly on professional competencies, verified sandboxes, and qualifications. Sensitive demographics are completely isolated from matching criteria. Human decisions always remain final."
          </p>
          <span className="governance-badge">
            Enterprise Compliant. Bias Reduced.
          </span>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-400">
        <p>&copy; {new Date().getFullYear()} HireMind AI Talent Operations. Designed for explainable, evidence-backed matching.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
