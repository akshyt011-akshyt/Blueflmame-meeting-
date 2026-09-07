import React from 'react';
import { AlertTriangle, KeyRound, ArrowLeft, RotateCcw, Home } from 'lucide-react';
import { PageView } from '../types';

interface InvalidCodePageProps {
  attemptedCode: string;
  reason?: string;
  onRetry: () => void;
  onNavigate: (page: PageView) => void;
}

export const InvalidCodePage: React.FC<InvalidCodePageProps> = ({
  attemptedCode,
  reason,
  onRetry,
  onNavigate,
}) => {
  return (
    <div id="invalid-code-page" className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Invalid Meeting Code</h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {reason || 'The 6-digit meeting code you entered was not found, has expired, or the class has already concluded.'}
            </p>
          </div>

          {/* Attempted Code Badge */}
          {attemptedCode && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 inline-block w-full">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 block mb-1">Code Entered:</span>
              <span className="font-mono text-2xl font-bold tracking-widest text-rose-400">{attemptedCode}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-left text-xs text-slate-400 space-y-1.5">
            <p className="font-semibold text-slate-300">💡 Why did this happen?</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Meeting codes are temporary and only exist while the Admin is broadcasting.</li>
              <li>The instructor may have already clicked "End Meeting".</li>
              <li>There may be a typo in the 6 digits.</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              id="btn-retry-join"
              onClick={onRetry}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Re-enter Code</span>
            </button>

            <button
              id="btn-invalid-code-home"
              onClick={() => onNavigate('home')}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Return Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
