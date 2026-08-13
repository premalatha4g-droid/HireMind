import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, UserCheck } from 'lucide-react';

const HiringManagerDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#F6F7FB] p-6">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-xs border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-full">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Welcome, {user?.name}!</h1>
              <p className="text-xs text-slate-500 font-semibold tracking-wide uppercase">Hiring Manager Portal</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-950 font-semibold rounded-lg text-sm transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
        <p className="text-sm text-slate-500">
          This is a placeholder for candidate profiles, overall match evidence reviews, and hiring approvals.
        </p>
      </div>
    </div>
  );
};

export default HiringManagerDashboard;
