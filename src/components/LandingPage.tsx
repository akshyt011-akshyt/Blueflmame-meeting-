import React, { useEffect, useState } from 'react';
import {
  Video,
  Shield,
  User,
  Radio,
  Share2,
  BookOpen,
  ArrowRight,
  Sparkles,
  Lock,
  Clock,
  Eye,
  CheckCircle2,
  Users
} from 'lucide-react';
import { PageView } from '../types';

interface LandingPageProps {
  onNavigate: (page: PageView) => void;
  onQuickJoin?: (code: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onQuickJoin }) => {
  const [activeCodeInput, setActiveCodeInput] = useState('');
  const [activeMeetings, setActiveMeetings] = useState<any[]>([]);

  useEffect(() => {
    // Check if there are active meetings for instant testing
    fetch('/api/health')
      .then((res) => res.json())
      .catch(() => ({}));
  }, []);

  const handleQuickJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeCodeInput.trim().length === 6) {
      if (onQuickJoin) {
        onQuickJoin(activeCodeInput.trim());
      } else {
        onNavigate('student-join');
      }
    } else {
      onNavigate('student-join');
    }
  };

  return (
    <div id="landing-page-root" className="min-h-[calc(100vh-4rem)] flex flex-col justify-between bg-slate-950 text-slate-100">
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 w-full">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Next-Gen WebRTC Classroom</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            High-Definition Classroom Meetings with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400">Blueflmame</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 font-normal leading-relaxed">
            The modern interactive classroom platform designed with strict role-based control. Instructors broadcast live video, audio, and educational materials—students participate in a focused, view-only learning space.
          </p>

          {/* TWO MAIN REQUIRED BUTTONS */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              id="landing-admin-login-btn"
              onClick={() => onNavigate('admin-login')}
              className="w-full sm:w-1/2 py-4 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-600/25 transition-all flex items-center justify-center space-x-2.5 group cursor-pointer"
            >
              <Shield className="w-5 h-5 text-cyan-300 group-hover:scale-110 transition-transform" />
              <span className="text-base">Admin Login</span>
            </button>

            <button
              id="landing-join-student-btn"
              onClick={() => onNavigate('student-join')}
              className="w-full sm:w-1/2 py-4 px-6 rounded-xl font-bold text-slate-100 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 hover:border-slate-600 shadow-lg transition-all flex items-center justify-center space-x-2.5 group cursor-pointer"
            >
              <User className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-base">Join as Student</span>
            </button>
          </div>

          {/* Fast 6-Digit Code Direct Entry Bar */}
          <div className="pt-6 max-w-sm mx-auto">
            <form onSubmit={handleQuickJoinSubmit} className="relative flex items-center">
              <input
                id="landing-code-input"
                type="text"
                maxLength={6}
                value={activeCodeInput}
                onChange={(e) => setActiveCodeInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Have a 6-digit code? e.g. 482731"
                className="w-full py-3 pl-4 pr-24 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm text-white placeholder-slate-500 outline-none transition-all tracking-wider font-mono text-center sm:text-left"
              />
              <button
                type="submit"
                id="landing-quick-join-submit"
                className="absolute right-1.5 py-1.5 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all flex items-center space-x-1"
              >
                <span>Join</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* System Role Architecture Diagram */}
        <div className="mt-16 pt-12 border-t border-slate-800/80">
          <div className="text-center mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Two Dedicated Roles • Zero Distraction</h2>
            <p className="text-xl font-bold text-white mt-1">Built Specifically for Educational Clarity</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Admin Box */}
            <div id="role-admin-card" className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-blue-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">1. Admin / Instructor</h3>
                  <p className="text-xs text-blue-400 font-medium">Complete Broadcast & Session Authority</p>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Starts meeting with unique temporary 6-digit code</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Broadcasts live HD camera and crystal-clear microphone audio</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Shares screen and displays high-res educational materials</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Monitors real-time student count and ends meeting anytime</span>
                </li>
              </ul>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                  id="card-admin-action-btn"
                  onClick={() => onNavigate('admin-login')}
                  className="w-full py-2.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-semibold text-xs transition-all flex items-center justify-center space-x-1.5"
                >
                  <span>Go to Admin Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Student Box */}
            <div id="role-student-card" className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-cyan-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">2. Student Participant</h3>
                  <p className="text-xs text-cyan-400 font-medium">Strict View-Only & Listen-Only Environment</p>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Joins instantly with Student Name + 6-digit Code</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Watches instructor's live camera and hears live audio</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Views shared screen and learning diagrams in full detail</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Cannot turn on mic, camera, or interrupt instructor</span>
                </li>
              </ul>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                  id="card-student-action-btn"
                  onClick={() => onNavigate('student-join')}
                  className="w-full py-2.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-semibold text-xs transition-all flex items-center justify-center space-x-1.5"
                >
                  <span>Enter Student Classroom</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <Radio className="w-6 h-6 text-blue-400 mb-3" />
            <h4 className="font-semibold text-white text-sm">Ultra Low-Latency WebRTC</h4>
            <p className="text-xs text-slate-400 mt-1">
              Direct peer-to-peer media pipeline powered by modern WebRTC standard for seamless synchronization.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <Clock className="w-6 h-6 text-indigo-400 mb-3" />
            <h4 className="font-semibold text-white text-sm">Temporary 6-Digit Codes</h4>
            <p className="text-xs text-slate-400 mt-1">
              Session codes remain valid strictly during the live meeting. Once ended, codes immediately expire.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <BookOpen className="w-6 h-6 text-cyan-400 mb-3" />
            <h4 className="font-semibold text-white text-sm">Educational Material Sharing</h4>
            <p className="text-xs text-slate-400 mt-1">
              Broadcast high-resolution diagrams, formulas, anatomy charts, and custom educational slides seamlessly.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-400">
        <p>© 2026 Blueflmame Meeting • Real-time WebRTC Classroom & Lecture Platform</p>
      </footer>
    </div>
  );
};
