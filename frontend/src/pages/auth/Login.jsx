import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, Shield, AlertTriangle, Eye, EyeOff, KeyRound, Sparkles } from 'lucide-react';
import apiFetch from '../../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Forgot Password / OTP Flow states
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // 2FA States
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      // Direct fetch to allow 2FA check redirection
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (data.requires2FA) {
        setRequires2FA(true);
        setSuccessMessage('Two-Factor Authentication is enabled. For simulation, enter code "123456".');
        setLoading(false);
        return;
      }

      // If no 2FA required, manually populate session token
      localStorage.setItem('hiremind_token', data.token);
      localStorage.setItem('hiremind_user', JSON.stringify(data.user));
      
      // Reload page and let restoreSession hook route user
      window.location.href = data.user.role === 'CANDIDATE' ? '/candidate' : '/recruiter';
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (e) => {
    e.preventDefault();
    if (!twoFactorCode) {
      setErrorMessage('Please enter the 2FA verification code.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const data = await apiFetch('/api/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ email, code: twoFactorCode })
      });

      localStorage.setItem('hiremind_token', data.token);
      localStorage.setItem('hiremind_user', JSON.stringify(data.user));
      
      window.location.href = data.user.role === 'CANDIDATE' ? '/candidate' : '/recruiter';
    } catch (err) {
      setErrorMessage(err.message || 'Invalid 2FA verification code. Type simulated code "123456".');
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

  // Google OAuth Simulation popup
  // Google OAuth Simulation popup
  const handleGoogleLogin = async () => {
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
        <button onclick="selectAccount('${acc.email}')" class="w-full flex items-center space-x-3 p-2 bg-white hover:bg-gray-50 border border-gray-150 rounded-lg text-left transition-colors cursor-pointer">
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
      'Google Sign-In',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    popup.document.write(`
      <html>
        <head>
          <title>Google Sign-In</title>
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
              <span class="font-bold text-gray-700">Sign in with Google</span>
            </div>
            <div class="space-y-4">
              <p class="text-sm text-gray-500 font-medium">Choose an account to continue to <strong>HireMind AI</strong></p>
              <div class="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                ${accountsHtml}
              </div>
            </div>
          </div>
          <div class="border-t pt-3 mt-3 space-y-1.5">
            <p class="text-[10px] text-gray-500 font-bold">Or enter a custom registered Google account:</p>
            <div class="flex space-x-2">
              <input id="customEmail" type="email" placeholder="name@domain.com" class="flex-1 text-[11px] p-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-800">
              <button onclick="selectCustom()" class="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold">Sign In</button>
            </div>
          </div>
          <div class="text-[9px] text-gray-400 border-t pt-2 mt-3">
            To continue, Google will share your name, email address, language preference, and profile picture with HireMind AI.
          </div>
          <script>
            function selectAccount(email) {
              window.opener.postMessage({ type: 'GOOGLE_LOGIN_SUCCESS', email }, '*');
              window.close();
            }
            function selectCustom() {
              const email = document.getElementById('customEmail').value;
              if (email && email.includes('@')) {
                selectAccount(email.trim());
              } else {
                alert('Please enter a valid Google email address.');
              }
            }
          </script>
        </body>
      </html>
    `);

    const handleMessage = async (event) => {
      if (event.data && event.data.type === 'GOOGLE_LOGIN_SUCCESS') {
        window.removeEventListener('message', handleMessage);
        try {
          // Log in with Google identity
          const user = await login(event.data.email, 'password123', true);
          routeUser(user.role);
        } catch (err) {
          setErrorMessage(err.message || 'Google account OAuth sync failed.');
        } finally {
          setLoading(false);
        }
      }
    };
    window.addEventListener('message', handleMessage);
  };

  // OTP Simulated forgot password reset handler
  const handleRequestOtp = (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }
    setErrorMessage('');
    const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedOtp(mockCode);
    setOtpSent(true);
    setSuccessMessage(`Simulated OTP code "${mockCode}" generated. Type it below to set a new password.`);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (otpInput !== simulatedOtp) {
      setErrorMessage('Invalid verification OTP code.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail, password: newPassword })
      });
      setSuccessMessage('Password reset successfully! You can now log in.');
      setIsForgotMode(false);
      setOtpSent(false);
      setEmail(forgotEmail);
      setPassword(newPassword);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        
        {/* Header */}
        <div className="auth-header">
          <div className="auth-icon-wrapper">
            <Shield className="h-8 w-8" />
          </div>
          <h2 className="auth-title">{isForgotMode ? 'Reset Password' : 'Welcome Back'}</h2>
          <p className="auth-subtitle">
            {isForgotMode ? 'Verify email with OTP check' : 'Sign in to access your HireMind AI dashboard'}
          </p>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-250 text-rose-700 rounded-xl text-xs font-semibold flex items-center space-x-2.5 mb-4">
            <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center space-x-2.5 mb-4">
            <Sparkles className="h-4.5 w-4.5 flex-shrink-0 text-emerald-650 animate-pulse" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* LOGIN MODE */}
        {!isForgotMode && !requires2FA && (
          <div className="space-y-4">
            <form className="space-y-4.5" onSubmit={handleSubmit}>
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
                    placeholder="you@company.com"
                    className="form-input pl-11"
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="password" className="form-label mb-0">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(true);
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="text-[10px] font-bold text-indigo-650 hover:underline bg-transparent border-0 cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
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

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full shadow-xs"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </div>
            </form>

            {/* Google OAuth Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center space-x-2.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          </div>
        )}

        {/* 2FA VERIFICATION MODE */}
        {!isForgotMode && requires2FA && (
          <form className="space-y-4" onSubmit={handle2FAVerify}>
            <div className="form-group text-center">
              <p className="text-xs text-slate-500 font-semibold mb-3">
                Two-Factor Authentication is enabled for this account. Enter the 6-digit OTP code to login.
              </p>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <KeyRound className="h-5 w-5 text-indigo-600" />
                </span>
                <input
                  id="twoFactorCode"
                  type="text"
                  required
                  maxLength="6"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="Type 2FA Code (123456)"
                  className="form-input pl-11 tracking-widest text-center font-extrabold text-base text-slate-800"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex-1 shadow-xs font-bold text-xs"
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRequires2FA(false);
                  setSuccessMessage('');
                  setErrorMessage('');
                }}
                className="btn btn-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD MODE */}
        {isForgotMode && (
          <div className="space-y-4">
            {!otpSent ? (
              <form className="space-y-4" onSubmit={handleRequestOtp}>
                <div className="form-group">
                  <label htmlFor="forgotEmail" className="form-label font-bold">Your Registered Email</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Mail className="h-5 w-5" />
                    </span>
                    <input
                      id="forgotEmail"
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="form-input pl-11"
                    />
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="submit"
                    className="btn btn-primary flex-1 shadow-xs"
                  >
                    Send OTP Code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(false);
                      setErrorMessage('');
                    }}
                    className="btn btn-outline"
                  >
                    Back
                  </button>
                </div>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label htmlFor="otpInput" className="form-label">Type 6-Digit OTP</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <KeyRound className="h-5 w-5" />
                    </span>
                    <input
                      id="otpInput"
                      type="text"
                      required
                      maxLength="6"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="Type Code"
                      className="form-input pl-11 tracking-widest text-center font-bold text-base"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword" className="form-label">Enter New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password (min 6 chars)"
                    className="form-input"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-success flex-1 shadow-xs"
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setSuccessMessage('');
                    }}
                    className="btn btn-outline"
                  >
                    Re-send OTP
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="auth-divider">
          <p className="text-xs text-slate-500 font-semibold">
            {isForgotMode ? (
              <span>
                Remember password?{' '}
                <button 
                  onClick={() => {
                    setIsForgotMode(false);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-indigo-650 hover:underline font-bold bg-transparent border-0 cursor-pointer"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                New to the platform?{' '}
                <Link to="/register" className="text-indigo-650 hover:underline font-bold transition-all">
                  Create an account
                </Link>
              </span>
            )}
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
