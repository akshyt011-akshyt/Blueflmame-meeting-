import React, { useState, useEffect } from 'react';
import { User, KeyRound, ArrowRight, ArrowLeft, AlertCircle, Sparkles, Radio, CheckCircle2 } from 'lucide-react';
import { PageView, StudentSession } from '../types';

interface StudentJoinProps {
  onJoinSuccess: (session: StudentSession) => void;
  onInvalidCode: (code: string, reason?: string) => void;
  onNavigate: (page: PageView) => void;
  prefillCode?: string;
}

export const StudentJoin: React.FC<StudentJoinProps> = ({
  onJoinSuccess,
  onInvalidCode,
  onNavigate,
  prefillCode = '',
}) => {
  const [studentName, setStudentName] = useState('');
  const [meetingCode, setMeetingCode] = useState(prefillCode);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeMeetings, setActiveMeetings] = useState<any[]>([]);

  useEffect(() => {
    if (prefillCode) {
      setMeetingCode(prefillCode);
    }
  }, [prefillCode]);

  // Check health and quick active meeting hint
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .catch(() => ({}));
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = meetingCode.trim();
    const cleanName = studentName.trim();

    if (!cleanName) {
      setErrorMessage('Please enter your student name.');
      return;
    }

    if (cleanCode.length !== 6) {
      setErrorMessage('Meeting code must be exactly 6 digits.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/meetings/verify/${cleanCode}`);
      const data = await res.json();

      if (res.ok && data.valid) {
        const studentId = 'stu_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
        onJoinSuccess({
          studentId,
          name: cleanName,
          meetingCode: cleanCode,
        });
      } else {
        // Code invalid or meeting ended
        onInvalidCode(cleanCode, data.error || 'Meeting code is invalid, inactive, or class has concluded.');
      }
    } catch (err) {
      setErrorMessage('Network error while validating meeting code. Please verify your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="student-join-page" className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <button
          id="student-join-back-home"
          onClick={() => onNavigate('home')}
          className="mb-6 inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600" />

          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mx-auto shadow-inner">
              <User className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Join Live Classroom</h1>
            <p className="text-xs text-slate-400">
              Enter your name and the 6-digit meeting code provided by your instructor.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div id="student-join-error" className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="student-name-input">
                Student Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="student-name-input"
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="student-code-input">
                Meeting Code (6 Digits)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="student-code-input"
                  type="text"
                  maxLength={6}
                  required
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="482731"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm text-white placeholder-slate-500 outline-none transition-all font-mono tracking-widest text-center"
                />
              </div>
            </div>

            {/* View-Only Mode Reminder */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-cyan-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Student Mode: View & Listen Only</span>
              </p>
              <p>You will watch and hear your instructor's live lecture without distracting controls.</p>
            </div>

            <button
              type="submit"
              id="student-join-submit-btn"
              disabled={isLoading || !studentName.trim() || meetingCode.trim().length !== 6}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Join Meeting</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo names helper */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 font-medium mb-2 flex items-center justify-center space-x-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Sample Student Names:</span>
            </p>
            <div className="flex justify-center gap-1.5 flex-wrap">
              {['Sarah Jenkins', 'Alex Rivera', 'Maya Lin', 'David Chen'].map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setStudentName(name)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700 transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
