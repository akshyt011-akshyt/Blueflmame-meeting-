import React, { useState } from 'react';
import { Video, Copy, Check, ArrowRight, X, Sparkles, Shield, Users } from 'lucide-react';
import { Meeting } from '../types';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartLive: (meeting: Meeting) => void;
  adminToken: string;
}

export const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({
  isOpen,
  onClose,
  onStartLive,
  adminToken,
}) => {
  const [meetingName, setMeetingName] = useState('Interactive Physics & Optics');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedMeeting, setGeneratedMeeting] = useState<Meeting | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/meetings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: meetingName }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedMeeting(data.meeting);
      } else {
        setError(data.error || 'Failed to create meeting session');
      }
    } catch (err: any) {
      setError('Network error while generating meeting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (generatedMeeting?.code) {
      navigator.clipboard.writeText(generatedMeeting.code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  return (
    <div id="create-meeting-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!generatedMeeting ? (
          <div>
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Create New Live Class</h2>
                <p className="text-xs text-slate-400">Generate a unique temporary 6-digit meeting code for students.</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="create-meeting-name">
                  Meeting / Class Name
                </label>
                <input
                  id="create-meeting-name"
                  type="text"
                  required
                  value={meetingName}
                  onChange={(e) => setMeetingName(e.target.value)}
                  placeholder="e.g. Organic Chemistry Lecture 4"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>

              {/* Suggestions */}
              <div className="space-y-1.5">
                <p className="text-[11px] text-slate-400 font-medium">Quick Suggestions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Calculus III: Vectors', 'Modern World History', 'Cellular Biology Lab', 'CS101: Data Structures'].map(
                    (item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setMeetingName(item)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  id="btn-confirm-generate-code"
                  disabled={isLoading || !meetingName.trim()}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-cyan-300" />
                      <span>Generate 6-Digit Meeting Code</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Step 2: Code Generated Successfully */
          <div className="text-center space-y-6 py-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>Meeting Code Created & Active</span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">{generatedMeeting.name}</h3>
              <p className="text-xs text-slate-400 mt-1">Share this 6-digit code with your students to let them join:</p>
            </div>

            {/* 6-Digit Code Display */}
            <div className="bg-slate-950 border-2 border-blue-500/40 rounded-2xl p-6 shadow-inner relative group">
              <span className="text-xs uppercase tracking-widest text-slate-500 block mb-1">
                Blueflmame Meeting Code
              </span>
              <div
                id="generated-meeting-code-display"
                className="text-4xl sm:text-5xl font-mono font-extrabold tracking-[0.25em] text-cyan-300 pl-4"
              >
                {generatedMeeting.code}
              </div>

              <div className="mt-4 flex justify-center">
                <button
                  id="btn-copy-meeting-code"
                  onClick={handleCopyCode}
                  className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white border border-slate-700 transition-all active:scale-95 cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied Code to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>Copy 6-Digit Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-slate-300 text-left">
              <p className="font-semibold text-blue-400 mb-0.5">⚠️ Security Note:</p>
              <p>
                This code remains valid <strong>strictly while this meeting is running</strong>. When you click "End
                Meeting", the code expires immediately and all students are disconnected.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                id="btn-enter-admin-live"
                onClick={() => onStartLive(generatedMeeting)}
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Enter Live Meeting Room</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
