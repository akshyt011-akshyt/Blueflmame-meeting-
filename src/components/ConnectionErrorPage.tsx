import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { PageView } from '../types';

interface ConnectionErrorPageProps {
  errorMessage: string;
  onRetry: () => void;
  onNavigate: (page: PageView) => void;
}

export const ConnectionErrorPage: React.FC<ConnectionErrorPageProps> = ({
  errorMessage,
  onRetry,
  onNavigate,
}) => {
  const [countdown, setCountdown] = useState(10);
  const [autoRetry, setAutoRetry] = useState(true);

  useEffect(() => {
    if (!autoRetry) return;
    if (countdown <= 0) {
      onRetry();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, autoRetry, onRetry]);

  return (
    <div id="connection-error-page" className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <WifiOff className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Connection Interrupted</h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              We lost the real-time signaling connection to the meeting room.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-rose-300 text-left font-mono">
            {errorMessage || 'WebSocket or WebRTC peer stream timed out or disconnected.'}
          </div>

          <div className="text-xs text-slate-400">
            {autoRetry ? (
              <p>
                Auto-reconnecting in <strong className="text-cyan-400 font-mono">{countdown}s</strong>...
              </p>
            ) : (
              <p>Auto-reconnect paused.</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              id="btn-retry-connection"
              onClick={() => {
                setAutoRetry(false);
                onRetry();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Now</span>
            </button>

            <button
              id="btn-connection-home"
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
