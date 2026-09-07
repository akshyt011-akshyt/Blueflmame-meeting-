import React, { useState, useEffect } from 'react';
import {
  Video,
  Mic,
  Share2,
  BookOpen,
  Users,
  Power,
  Play,
  Plus,
  Shield,
  Clock,
  Sparkles,
  Copy,
  Check,
  AlertTriangle,
  Radio,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { PageView, Meeting, AdminAuthSession } from '../types';
import { CreateMeetingModal } from './CreateMeetingModal';

interface AdminDashboardProps {
  adminSession: AdminAuthSession;
  onNavigate: (page: PageView) => void;
  activeMeeting: Meeting | null;
  onStartMeeting: (meeting: Meeting) => void;
  onEndMeeting: (code: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminSession,
  onNavigate,
  activeMeeting,
  onStartMeeting,
  onEndMeeting,
}) => {
  const [quickMeetingName, setQuickMeetingName] = useState('Advanced Calculus & Vectors');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingQuick, setIsCreatingQuick] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeMeetingsList, setActiveMeetingsList] = useState<Meeting[]>([]);
  const [activeStudentsCount, setActiveStudentsCount] = useState(activeMeeting?.activeStudentsCount || 0);

  // Poll active meetings from server
  const fetchActiveMeetings = async () => {
    try {
      const res = await fetch('/api/meetings/active', {
        headers: { Authorization: `Bearer ${adminSession.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveMeetingsList(data.meetings || []);
        if (activeMeeting) {
          const current = (data.meetings || []).find((m: Meeting) => m.code === activeMeeting.code);
          if (current) {
            setActiveStudentsCount(current.activeStudentsCount);
          }
        }
      }
    } catch (e) {
      console.warn('Error fetching active meetings:', e);
    }
  };

  useEffect(() => {
    fetchActiveMeetings();
    const interval = setInterval(fetchActiveMeetings, 4000);
    return () => clearInterval(interval);
  }, [adminSession.token, activeMeeting]);

  const handleStartQuickMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMeetingName.trim()) return;
    setIsCreatingQuick(true);

    try {
      const res = await fetch('/api/meetings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminSession.token}`,
        },
        body: JSON.stringify({ name: quickMeetingName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onStartMeeting(data.meeting);
        onNavigate('admin-live');
      }
    } catch (err) {
      console.error('Failed to create quick meeting', err);
    } finally {
      setIsCreatingQuick(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div id="admin-dashboard-page" className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 pb-16">
      {/* Top Banner */}
      <div className="bg-slate-900 border-b border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white">Admin Instructor Console</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  AUTHENTICATED
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Logged in as: <span className="text-slate-200 font-medium">{adminSession.username}</span> ({adminSession.name})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              id="dash-start-new-meeting-top-btn"
              onClick={() => setIsModalOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Meeting</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* ACTIVE MEETING ALERT / BANNER IF ONE IS RUNNING */}
        {activeMeeting && (
          <div
            id="active-meeting-banner"
            className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-900 border-2 border-cyan-500/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Live Class In Session</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">{activeMeeting.name}</h3>
                <div className="flex items-center space-x-3 text-xs text-slate-300 mt-1">
                  <span>
                    Meeting Code: <strong className="font-mono text-cyan-300 tracking-wider text-sm">{activeMeeting.code}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1 text-slate-300">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{activeStudentsCount} Connected Students</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto">
              <button
                id="dash-copy-live-code"
                onClick={() => handleCopy(activeMeeting.code)}
                className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>

              <button
                id="dash-reenter-live-btn"
                onClick={() => onNavigate('admin-live')}
                className="py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/30 transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Enter Live Room</span>
              </button>

              <button
                id="dash-end-meeting-banner-btn"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to end "${activeMeeting.name}"? All students will be disconnected.`)) {
                    onEndMeeting(activeMeeting.code);
                  }
                }}
                className="py-2.5 px-3.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Power className="w-4 h-4" />
                <span>End Meeting</span>
              </button>
            </div>
          </div>
        )}

        {/* Start Meeting Box & Required Dashboard Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Fast Start Meeting Form */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Video className="w-5 h-5 text-blue-400" />
                <h2 className="font-bold text-base text-white">Start New Classroom Session</h2>
              </div>
              <span className="text-xs text-slate-400">Generates 6-Digit Code</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Name your session and start immediately. A temporary 6-digit meeting code will be generated for your students to join.
            </p>

            <form onSubmit={handleStartQuickMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="dash-meeting-name-input">
                  Meeting Name
                </label>
                <input
                  id="dash-meeting-name-input"
                  type="text"
                  required
                  value={quickMeetingName}
                  onChange={(e) => setQuickMeetingName(e.target.value)}
                  placeholder="e.g. Linear Algebra: Matrix Operations"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {['Calculus & Trigonometry', 'Biochemistry Seminar', 'World Geography & Maps', 'Computer Science 101'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuickMeetingName(preset)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="submit"
                  id="dash-start-meeting-btn"
                  disabled={isCreatingQuick || !quickMeetingName.trim()}
                  className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {isCreatingQuick ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start New Meeting</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  id="dash-open-modal-flow"
                  onClick={() => setIsModalOpen(true)}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Customize & Preview Code</span>
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Required Admin Capabilities Overview */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center space-x-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Admin Meeting Controls</span>
            </h3>
            <p className="text-xs text-slate-400">
              Inside the live room, you have full control over all media and participant states:
            </p>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <div className="flex items-center space-x-2.5">
                  <Video className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-medium text-slate-200">Start Camera</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">HD User Feed</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <div className="flex items-center space-x-2.5">
                  <Mic className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-medium text-slate-200">Start Microphone</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">Real-time Audio</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <div className="flex items-center space-x-2.5">
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-medium text-slate-200">Screen Share</span>
                </div>
                <span className="text-[11px] text-cyan-400 font-mono">Screen / Tab</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <div className="flex items-center space-x-2.5">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium text-slate-200">Upload Learning Material</span>
                </div>
                <span className="text-[11px] text-amber-400 font-mono">Images & Slides</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <div className="flex items-center space-x-2.5">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-medium text-slate-200">Active Students Count</span>
                </div>
                <span className="text-[11px] text-purple-400 font-mono">{activeStudentsCount} Connected</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <div className="flex items-center space-x-2.5">
                  <Power className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-medium text-slate-200">End Meeting</span>
                </div>
                <span className="text-[11px] text-rose-400 font-mono">Immediate Kill</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Classrooms Table / History */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-white">Your Running Classrooms</h3>
              <p className="text-xs text-slate-400">All live meetings under your instructor account</p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {activeMeetingsList.length} Active {activeMeetingsList.length === 1 ? 'Session' : 'Sessions'}
            </span>
          </div>

          {activeMeetingsList.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
              <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-300">No active meetings right now</p>
              <p className="text-xs text-slate-500 mt-1">Click "Start New Meeting" to launch a live classroom session.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {activeMeetingsList.map((m) => (
                <div key={m.code} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">{m.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ACTIVE
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-slate-400 mt-1 font-mono">
                      <span>Code: <strong className="text-cyan-300 font-bold tracking-wider">{m.code}</strong></span>
                      <span>Students: {m.activeStudentsCount}</span>
                      <span>Started: {new Date(m.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopy(m.code)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition-colors flex items-center space-x-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </button>
                    <button
                      onClick={() => {
                        onStartMeeting(m);
                        onNavigate('admin-live');
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all flex items-center space-x-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Enter</span>
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`End meeting "${m.name}"?`)) {
                          onEndMeeting(m.code);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium border border-rose-500/30 transition-colors flex items-center space-x-1"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>End</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for creating a meeting */}
      <CreateMeetingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStartLive={(m) => {
          setIsModalOpen(false);
          onStartMeeting(m);
          onNavigate('admin-live');
        }}
        adminToken={adminSession.token}
      />
    </div>
  );
};
