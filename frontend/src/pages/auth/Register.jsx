import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, Shield, User, AlertTriangle, Briefcase, Globe, Award, Eye, EyeOff, Sparkles, KeyRound } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('CANDIDATE'); // 'CANDIDATE' or 'RECRUITER'
  
  // Candidate-specific fields
  const [title, setTitle] = useState('');
  const [skills, setSkills] = useState('');

  // Recruiter-specific fields
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Email verification workflow states
  const [needsVerification, setNeedsVerification] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [verificationInput, setVerificationInput] = useState('');

  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMessage('Please fill in all basic fields.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    // Trigger simulated verification OTP step
    const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(mockCode);
    setNeedsVerification(true);
    setSuccessMessage(`Simulated verification code "${mockCode}" sent to ${email}. Please enter it below to confirm.`);
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (verificationInput !== generatedCode) {
      setErrorMessage('Invalid verification OTP code. Please check your simulated code.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const user = await register(name, email, password, role);
      setSuccessMessage('Email verified successfully! Creating account...');
      
      // Seed details database simulation logic can occur here
      routeUser(user.role);
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
      setNeedsVerification(false);
    } finally {
      setLoading(false);
    }
  };

  const routeUser = (role) => {
    if (role === 'CANDIDATE') navigate('/candidate');
    else if (role === 'RECRUITER') navigate('/recruiter');
    else if (role === 'INTERVIEWER') navigate('/interviewer');
    else if (role === 'HIRING_MANAGER') navigate('/hiring-manager');
    else if (role === 'ADMIN') navigate('/admin');
    else navigate('/');
  };

  // Google OAuth Simulation
  // Google OAuth Simulation
  const handleGoogleSignup = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    let dbAccounts = [];
    try {
      const response = await fetch('http://localhost:5000/api/auth/google-accounts');
      if (response.ok) {
        dbAccounts = await response.json();
      }
    } catch (e) {
      console.warn('Failed to fetch dynamic Google accounts:', e);
    }

    if (dbAccounts.length === 0) {
      dbAccounts = [
        { name: 'Sarah Recruiter', email: 'recruiter@hiremind.ai', role: 'RECRUITER' },
        { name: 'John Doe', email: 'candidate@hiremind.ai', role: 'CANDIDATE' },
        { name: 'Alex Interviewer', email: 'alex.demo@hiremind.ai', role: 'INTERVIEWER' }
      ];
    }

    const accountsHtml = dbAccounts.map(acc => {
      let bgColor = 'bg-blue-100 text-blue-600';
      if (acc.role === 'CANDIDATE') bgColor = 'bg-indigo-100 text-indigo-600';
      if (acc.role === 'INTERVIEWER') bgColor = 'bg-yellow-100 text-yellow-600';
      const initial = acc.name ? acc.name.charAt(0).toUpperCase() : 'U';
      return `
        <button onclick="selectAccount('${acc.name}', '${acc.email}')" class="w-full flex items-center space-x-3 p-2 bg-white hover:bg-gray-50 border border-gray-150 rounded-lg text-left transition-colors cursor-pointer">
          <div class="h-8 w-8 rounded-full ${bgColor} flex items-center justify-center font-bold text-xs shrink-0">${initial}</div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold text-gray-800 truncate">${acc.name}</p>
            <p class="text-[9px] text-gray-400 flex items-center justify-between">
              <span class="truncate pr-1">${acc.email}</span>
              <span class="px-1 text-[7px] font-extrabold uppercase bg-gray-100 text-gray-600 rounded shrink-0">${acc.role}</span>
            </p>
          </div>
        </button>
      `;
    }).join('\n');

    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
      '',
      'Google Sign-Up',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    popup.document.write(`
      <html>
        <head>
          <title>Google Sign-Up</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body class="bg-gray-50 flex flex-col justify-between h-screen p-6 font-sans">
          <div class="space-y-6">
            <div class="flex items-center space-x-2 border-b pb-4">
              <svg class="h-6 w-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span class="font-bold text-gray-700">Sign up with Google</span>
            </div>
            <div class="space-y-4">
              <p class="text-sm text-gray-500 font-medium">Create a new HireMind account with Google:</p>
              <div class="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                ${accountsHtml}
              </div>
            </div>
          </div>
          <div class="border-t pt-3 mt-3 space-y-1.5">
            <p class="text-[10px] text-gray-500 font-bold">Or register a custom Google account:</p>
            <div class="flex space-x-2">
              <input id="customEmail" type="email" placeholder="name@domain.com" class="flex-1 text-[11px] p-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-800">
              <button onclick="selectCustom()" class="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold">Sign Up</button>
            </div>
          </div>
          <div class="text-[9px] text-gray-400 border-t pt-2 mt-3">
            To continue, Google will share your name, email address, language preference, and profile picture with HireMind AI.
          </div>
          <script>
            function selectAccount(name, email) {
              window.opener.postMessage({ type: 'GOOGLE_SIGNUP_SUCCESS', name, email }, '*');
              window.close();
            }
            function selectCustom() {
              const email = document.getElementById('customEmail').value;
              if (email && email.includes('@')) {
                const name = email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase());
                selectAccount(name, email.trim());
              } else {
                alert('Please enter a valid Google email address.');
              }
            }
          </script>
        </body>
      </html>
    `);

    const handleMessage = async (event) => {
      if (event.data && event.data.type === 'GOOGLE_SIGNUP_SUCCESS') {
        window.removeEventListener('message', handleMessage);
        try {
          // Complete mock oauth register and autologin
          const user = await register(event.data.name, event.data.email, 'password123', role);
          routeUser(user.role);
        } catch (err) {
          setErrorMessage(err.message || 'Google signup synchronization failed.');
        } finally {
          setLoading(false);
        }
      }
    };
    window.addEventListener('message', handleMessage);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        
        {/* Header */}
        <div className="auth-header">
          <div className="auth-icon-wrapper">
            <Shield className="h-8 w-8" />
          </div>
          <h2 className="auth-title">{needsVerification ? 'Verify Your Email' : 'Create Account'}</h2>
          <p className="auth-subtitle">
            {needsVerification ? 'Enter the security code' : 'Join the HireMind AI Talent Platform'}
          </p>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-250 text-rose-700 rounded-xl text-xs font-semibold flex items-center space-x-2.5 mb-4">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center space-x-2.5 mb-4">
            <Sparkles className="h-4.5 w-4.5 flex-shrink-0 text-emerald-650 animate-pulse" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* REGISTRATION FORM */}
        {!needsVerification ? (
          <>
            {/* Role Selection */}
            <div className="mb-4">
              <label className="form-label">I want to register as:</label>
              <div className="auth-role-tabs flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setRole('CANDIDATE')}
                  className={`auth-role-btn flex-1 min-w-[120px] ${role === 'CANDIDATE' ? 'auth-role-btn-active' : ''}`}
                >
                  <User className="auth-role-icon" />
                  <span className="auth-role-label text-[10px]">Candidate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('RECRUITER')}
                  className={`auth-role-btn flex-1 min-w-[120px] ${role === 'RECRUITER' ? 'auth-role-btn-active' : ''}`}
                >
                  <Briefcase className="auth-role-icon" />
                  <span className="auth-role-label text-[10px]">Recruiter</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('INTERVIEWER')}
                  className={`auth-role-btn flex-1 min-w-[120px] ${role === 'INTERVIEWER' ? 'auth-role-btn-active' : ''}`}
                >
                  <Award className="auth-role-icon" />
                  <span className="auth-role-label text-[10px]">Interviewer</span>
                </button>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label htmlFor="name" className="form-label">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <User className="h-5 w-5" />
                  </span>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="form-input pl-11"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="form-input pl-11"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input pl-11 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-650 focus:outline-none cursor-pointer bg-transparent border-0"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Candidate dynamic fields */}
              {role === 'CANDIDATE' && (
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <div className="form-group">
                    <label htmlFor="title" className="form-label">Current Title / Objective</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Award className="h-5 w-5" />
                      </span>
                      <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="React Developer"
                        className="form-input pl-11"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="skills" className="form-label">Professional Skills (comma separated)</label>
                    <input
                      id="skills"
                      type="text"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="React, Node.js, MongoDB"
                      className="form-input"
                    />
                  </div>
                </div>
              )}

              {/* Recruiter dynamic fields */}
              {role === 'RECRUITER' && (
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <div className="form-group">
                    <label htmlFor="company" className="form-label">Company Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Briefcase className="h-5 w-5" />
                      </span>
                      <input
                        id="company"
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Acme Corp"
                        className="form-input pl-11"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="industry" className="form-label">Industry Focus</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Globe className="h-5 w-5" />
                      </span>
                      <input
                        id="industry"
                        type="text"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        placeholder="Information Technology"
                        className="form-input pl-11"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full shadow-xs"
                >
                  Sign Up
                </button>
              </div>
            </form>

            <div className="pt-1">
              <button
                type="button"
                onClick={handleGoogleSignup}
                className="w-full flex items-center justify-center space-x-2.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Sign up with Google</span>
              </button>
            </div>
          </>
        ) : (
          /* Email Verification Pending view */
          <form className="space-y-5" onSubmit={handleVerifyEmail}>
            <div className="form-group text-center">
              <p className="text-xs text-slate-500 font-semibold mb-3">
                We've sent a 6-digit confirmation security verification OTP code to your registered email address.
              </p>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <KeyRound className="h-5 w-5" />
                </span>
                <input
                  id="verificationInput"
                  type="text"
                  required
                  maxLength="6"
                  value={verificationInput}
                  onChange={(e) => setVerificationInput(e.target.value)}
                  placeholder="Type Verification Code"
                  className="form-input pl-11 tracking-widest text-center font-extrabold text-base"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-success flex-1 shadow-xs font-bold text-xs"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
              <button
                type="button"
                onClick={() => setNeedsVerification(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="auth-divider">
          <p className="text-xs text-slate-500 font-semibold">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-650 hover:underline font-bold transition-all">
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;
