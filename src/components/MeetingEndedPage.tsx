import React from 'react';
import { Power, CheckCircle, Home, RotateCcw, Shield } from 'lucide-react';
import { PageView } from '../types';

interface MeetingEndedPageProps {
  reason?: string;
  onNavigate: (page: PageView) => void;
}

export const MeetingEndedPage: React.FC<MeetingEndedPageProps> = ({
  reason = 'The meeting instructor has ended the live session.',
  onNavigate,
}) => {
  return (
    <div id="meeting-ended-page" className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-rose-500" />

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-300">
            <Power className="w-8 h-8 text-rose-400" />
          </div>

          <div>
            <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
              Session Concluded
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-3">Classroom Meeting Ended</h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {reason}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-2 text-left">
            <div className="flex items-center space-x-2 text-slate-300 font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Broadcast stream stopped cleanly</span>
            </div>
            <p className="text-[11px] text-slate-500 pl-6">
              The 6-digit meeting code was automatically invalidated and peer connections were safely closed.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              id="btn-ended-join-another"
              onClick={() => onNavigate('student-join')}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Join Another Class</span>
            </button>

            <button
              id="btn-ended-home"
              onClick={() => onNavigate('home')}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
