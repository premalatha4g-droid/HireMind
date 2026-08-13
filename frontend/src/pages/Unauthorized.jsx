import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Route appropriately based on role
    if (user.role === 'CANDIDATE') navigate('/candidate');
    else if (user.role === 'RECRUITER') navigate('/recruiter');
    else if (user.role === 'INTERVIEWER') navigate('/interviewer');
    else if (user.role === 'HIRING_MANAGER') navigate('/hiring-manager');
    else if (user.role === 'ADMIN') navigate('/admin');
    else navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F7FB] px-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-xl shadow-sm border border-slate-100">
        <div className="inline-flex items-center justify-center p-3 bg-rose-50 rounded-full text-rose-600">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
        <p className="text-sm text-slate-500">
          Your current account role does not have permission to view this section of the HireMind AI platform.
        </p>
        <div>
          <button
            onClick={handleGoBack}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
