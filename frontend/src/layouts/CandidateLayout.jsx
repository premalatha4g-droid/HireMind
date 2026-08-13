import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Briefcase, 
  Calendar, 
  Award, 
  Map, 
  FileCheck, 
  LogOut, 
  Menu, 
  X, 
  Brain,
  LayoutDashboard,
  Bell
} from 'lucide-react';
import apiFetch from '../services/api';

const CandidateLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch('/api/notifications');
      setNotifications(data || []);
    } catch(e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/api/notifications/mark-all-read', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // poll notifications every 10s
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { label: 'Dashboard', path: '/candidate', icon: LayoutDashboard },
    { label: 'AI Skill Passport', path: '/candidate/passport', icon: User },
    { label: 'Browse Jobs', path: '/candidate/jobs', icon: Briefcase },
    { label: 'Assessments', path: '/candidate/assessments', icon: Award },
    { label: 'Career Roadmap', path: '/candidate/roadmap', icon: Map },
    { label: 'Offers', path: '/candidate/offers', icon: FileCheck },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200 shadow-sm text-slate-700">
        <div className="flex items-center space-x-2 px-6 py-5 border-b border-slate-100">
          <div className="p-1 bg-indigo-600 rounded text-white">
            <Brain className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">HireMind AI</span>
        </div>
        <div className="flex-1 flex flex-col justify-between py-4 overflow-y-auto">
          <nav className="px-4 space-y-1">
            {menuItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                               (item.path !== '/candidate' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={idx}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-600 shadow-xs' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          
          <div className="px-4 pt-4 border-t border-slate-100">
            <div className="flex items-center space-x-3 px-3 py-2 mb-3">
              <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-sm text-indigo-600">
                {user?.name?.charAt(0)}
              </div>
              <div className="truncate">
                <p className="text-sm font-bold text-slate-900 leading-none">{user?.name}</p>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Candidate</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between w-full h-16 px-4 bg-white border-b border-slate-200 text-slate-800 fixed top-0 left-0 z-40 shadow-xs">
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-indigo-600 rounded text-white">
            <Brain className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-slate-900">HireMind AI</span>
        </div>
        <div className="flex items-center space-x-2">
          {/* Mobile Bell Indicator */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) fetchNotifications();
              }}
              className="relative p-1.5 text-slate-400 hover:text-indigo-650 bg-transparent border-0 cursor-pointer"
            >
              <Bell className="h-5.5 w-5.5" />
              {notifications.some(n => !n.isRead) && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-rose-600 rounded-full animate-ping" />
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-4 text-[10px] font-semibold text-slate-700">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                  <span className="font-extrabold text-slate-900">Simulated Emails</span>
                  {notifications.some(n => !n.isRead) && (
                    <button onClick={handleMarkAllRead} className="text-[9px] text-indigo-600 font-bold bg-transparent border-0 cursor-pointer">Clear</button>
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {notifications.map((notif, index) => (
                    <div key={index} className={`p-2 rounded-lg border text-left ${notif.isRead ? 'bg-slate-50 border-slate-100' : 'bg-indigo-50/40 border-indigo-100'}`}>
                      <p className="font-bold text-slate-800 text-[9px]">{notif.title}</p>
                      <p className="text-slate-500 font-medium text-[8px] mt-0.5">{notif.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={toggleSidebar}
            className="p-1.5 rounded-md hover:bg-slate-100 focus:outline-none text-slate-500 hover:text-slate-800"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div 
          onClick={toggleSidebar} 
          className="fixed inset-0 z-30 bg-black/40 md:hidden transition-opacity"
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 text-slate-700 transform transition-transform duration-300 md:hidden flex flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-indigo-600 rounded text-white">
              <Brain className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-slate-900">HireMind AI</span>
          </div>
          <button onClick={toggleSidebar} className="text-slate-500 hover:text-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col justify-between py-4 overflow-y-auto">
          <nav className="px-4 space-y-1">
            {menuItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={idx}
                  to={item.path}
                  onClick={toggleSidebar}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-600' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="px-4 pt-4 border-t border-slate-100">
            <div className="flex items-center space-x-3 px-3 py-2 mb-3">
              <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-sm text-indigo-600">
                {user?.name?.charAt(0)}
              </div>
              <div className="truncate">
                <p className="text-sm font-bold text-slate-900 leading-none">{user?.name}</p>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider">CANDIDATE</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 pt-16 md:pt-0">
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200/80 items-center justify-end px-8 fixed top-0 right-0 left-64 z-30 shadow-xs">
          <div className="flex items-center space-x-4">
            
            {/* Bell Notifications Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) fetchNotifications();
                }}
                className="relative p-1.5 text-slate-400 hover:text-indigo-650 bg-transparent border-0 cursor-pointer"
                title="Simulated Email Logs"
              >
                <Bell className="h-5 w-5" />
                {notifications.some(n => !n.isRead) && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-rose-600 rounded-full animate-ping" />
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-4 text-[10px] font-semibold text-slate-700">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                    <span className="font-extrabold text-slate-900">Simulated Email Notifications</span>
                    {notifications.some(n => !n.isRead) && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-[9px] text-indigo-600 hover:underline font-bold bg-transparent border-0 cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {notifications.map((notif, index) => (
                      <div key={index} className={`p-2.5 rounded-lg border text-left ${notif.isRead ? 'bg-slate-50 border-slate-100' : 'bg-indigo-50/40 border-indigo-100'}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-extrabold text-indigo-650 uppercase text-[8px] tracking-wider">{notif.type} AUTO-EMAIL</span>
                          <span className="text-[8px] text-slate-400 font-semibold">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="font-bold text-slate-800 text-[9px]">{notif.title}</p>
                        <p className="text-slate-500 font-medium text-[8px] leading-relaxed mt-0.5">{notif.message}</p>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <p className="p-4 text-[9px] text-slate-400 font-bold text-center italic">No notifications generated yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-slate-200" />
            <div className="text-right">
              <p className="text-xs font-bold text-slate-855 leading-none">{user?.name}</p>
              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Candidate</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto md:mt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CandidateLayout;
