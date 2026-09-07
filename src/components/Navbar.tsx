import React from 'react';
import { Video, Shield, User, LogOut, Home, KeyRound, Radio } from 'lucide-react';
import { PageView, AdminAuthSession } from '../types';

interface NavbarProps {
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;
  adminSession: AdminAuthSession | null;
  onAdminLogout: () => void;
  activeMeetingCode?: string;
  isMeetingActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  setCurrentPage,
  adminSession,
  onAdminLogout,
  activeMeetingCode,
  isMeetingActive,
}) => {
  return (
    <header id="app-header" className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          id="brand-logo-btn"
          onClick={() => {
            if (isMeetingActive) {
              if (window.confirm('You have an active meeting session. Leave this screen?')) {
                setCurrentPage('home');
              }
            } else {
              setCurrentPage('home');
            }
          }}
          className="flex items-center space-x-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-all">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Video className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                Blueflmame
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Meeting
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5">Online Classroom & Broadcast</p>
          </div>
        </div>

        {/* Live indicator if meeting is running */}
        {isMeetingActive && activeMeetingCode && (
          <div
            id="navbar-live-pill"
            className="hidden md:flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full text-xs text-emerald-400 font-medium"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>Class Live: Code <strong className="tracking-wider text-emerald-300">#{activeMeetingCode}</strong></span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {adminSession ? (
            <div className="flex items-center space-x-2">
              <button
                id="nav-admin-dashboard-btn"
                onClick={() => setCurrentPage('admin-dashboard')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentPage === 'admin-dashboard'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Admin Dashboard</span>
              </button>

              <button
                id="nav-admin-logout-btn"
                onClick={onAdminLogout}
                title="Log out of Admin"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                id="nav-join-student-btn"
                onClick={() => setCurrentPage('student-join')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentPage === 'student-join'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>Join as Student</span>
              </button>

              <button
                id="nav-admin-login-btn"
                onClick={() => setCurrentPage('admin-login')}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                  currentPage === 'admin-login'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-600/90 text-white hover:bg-blue-600'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
