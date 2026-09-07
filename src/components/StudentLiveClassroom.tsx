import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  LogOut,
  Radio,
  BookOpen,
  Users,
  Shield,
  Maximize2,
  Minimize2,
  AlertCircle,
  Eye,
  CheckCircle2,
  Share2,
  Lock
} from 'lucide-react';
import { StudentSession, LearningMaterial, AdminMediaState, PageView } from '../types';
import { SignalingClient } from '../utils/signaling';
import { WebRTCManager } from '../utils/webrtc';

interface StudentLiveClassroomProps {
  session: StudentSession;
  onLeaveMeeting: () => void;
  onMeetingEnded: (reason?: string) => void;
  onConnectionError: (error: string) => void;
  onInvalidCode: (code: string) => void;
}

export const StudentLiveClassroom: React.FC<StudentLiveClassroomProps> = ({
  session,
  onLeaveMeeting,
  onMeetingEnded,
  onConnectionError,
  onInvalidCode,
}) => {
  const [meetingName, setMeetingName] = useState('Online Classroom');
  const [adminName, setAdminName] = useState('Instructor');
  const [activeStudentsCount, setActiveStudentsCount] = useState(1);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'reconnecting'>('connecting');
  const [adminMediaState, setAdminMediaState] = useState<AdminMediaState>({
    cameraActive: true,
    micActive: true,
    isScreenSharing: false,
    activeMaterial: null,
  });

  // Local audio speaker mute control (listening only)
  const [isAudioMutedByStudent, setIsAudioMutedByStudent] = useState(false);
  const [audioAutoplayBlocked, setAudioAutoplayBlocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // References
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const signalingRef = useRef<SignalingClient | null>(null);
  const webrtcRef = useRef<WebRTCManager | null>(null);

  useEffect(() => {
    let isMounted = true;
    const signaling = new SignalingClient();
    signalingRef.current = signaling;

    const rtc = new WebRTCManager();
    webrtcRef.current = rtc;

    // Attach remote stream to video element
    rtc.onRemoteStream = (stream) => {
      if (!isMounted) return;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current
          .play()
          .then(() => {
            setAudioAutoplayBlocked(false);
          })
          .catch((err) => {
            console.warn('Student video autoplay with audio policy restricted:', err);
            setAudioAutoplayBlocked(true);
          });
      }
      setConnectionStatus('connected');
    };

    rtc.onConnectionStateChange = (state) => {
      if (!isMounted) return;
      if (state === 'connected') {
        setConnectionStatus('connected');
      } else if (state === 'disconnected' || state === 'failed') {
        setConnectionStatus('reconnecting');
      }
    };

    // Setup WebRTC and connect to Signaling Server
    const initConnection = async () => {
      try {
        await rtc.createStudentPeerConnection((candidate) => {
          signaling.send('webrtc:ice-candidate', { candidate });
        });

        await signaling.connect();
        if (!isMounted) return;

        // Join room as Student
        signaling.send('student:join-room', {
          code: session.meetingCode,
          studentName: session.name,
          studentId: session.studentId,
        });
      } catch (err: any) {
        console.error('Student signaling initialization error:', err);
        if (isMounted) {
          onConnectionError(err.message || 'Failed to establish connection to classroom server');
        }
      }
    };

    initConnection();

    // Signaling Listeners
    signaling.on('student:joined', (data) => {
      if (!isMounted) return;
      setMeetingName(data.meetingName || 'Online Classroom');
      setAdminName(data.adminName || 'Instructor');
      if (data.mediaState) {
        setAdminMediaState(data.mediaState);
      }
      if (data.activeStudentsCount) {
        setActiveStudentsCount(data.activeStudentsCount);
      }
      setConnectionStatus('connected');
    });

    signaling.on('room:invalid-code', () => {
      if (!isMounted) return;
      onInvalidCode(session.meetingCode);
    });

    // Handle incoming WebRTC Offer from Admin
    signaling.on('webrtc:offer', async (data) => {
      if (!isMounted || !webrtcRef.current) return;
      try {
        const answer = await webrtcRef.current.handleAdminOffer(data.sdp);
        signaling.send('webrtc:answer', { sdp: answer });
      } catch (e) {
        console.error('Error handling admin offer on student:', e);
      }
    });

    // Handle incoming ICE candidate from Admin
    signaling.on('webrtc:ice-candidate', async (data) => {
      if (!isMounted || !webrtcRef.current) return;
      await webrtcRef.current.handleAdminIceCandidate(data.candidate);
    });

    // Handle Admin updating camera, mic, screen share, or educational materials
    signaling.on('room:media-state', (data) => {
      if (!isMounted) return;
      if (data.mediaState) {
        setAdminMediaState(data.mediaState);
      }
    });

    // Handle student count update
    signaling.on('room:student-count', (data) => {
      if (!isMounted) return;
      if (data.activeStudentsCount) {
        setActiveStudentsCount(data.activeStudentsCount);
      }
    });

    // Handle Admin ending the meeting
    signaling.on('room:ended', (data) => {
      if (!isMounted) return;
      onMeetingEnded(data.reason || 'The instructor has ended this classroom session.');
    });

    signaling.on('connection:close', () => {
      if (!isMounted) return;
      setConnectionStatus('reconnecting');
    });

    return () => {
      isMounted = false;
      signaling.send('student:leave', {
        code: session.meetingCode,
        studentId: session.studentId,
      });
      signaling.disconnect();
      rtc.cleanup();
    };
  }, [session.meetingCode, session.name, session.studentId]);

  // Handle student clicking to unmute audio if browser blocked autoplay audio
  const handleUnmuteAudio = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play();
      setAudioAutoplayBlocked(false);
      setIsAudioMutedByStudent(false);
    }
  };

  // Toggle local speaker mute
  const handleToggleSpeaker = () => {
    if (videoRef.current) {
      const nextMute = !isAudioMutedByStudent;
      videoRef.current.muted = nextMute;
      setIsAudioMutedByStudent(nextMute);
    }
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => ({}));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => ({}));
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      id="student-live-classroom-page"
      className="min-h-[calc(100vh-4rem)] bg-slate-950 flex flex-col justify-between text-slate-100"
    >
      {/* Top Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Meeting Info */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-white text-sm sm:text-base">{meetingName}</h1>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold text-[10px] uppercase tracking-wider">
                  VIEW-ONLY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Instructor: <span className="text-slate-200 font-medium">{adminName}</span> • Meeting Code:{' '}
                <strong className="font-mono text-cyan-300">#{session.meetingCode}</strong>
              </p>
            </div>
          </div>

          {/* Center: Connection Status Pill */}
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <div
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-400'
                  : connectionStatus === 'connecting'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-300 capitalize font-medium">
              {connectionStatus === 'connected'
                ? 'WebRTC Live • Connected'
                : connectionStatus === 'connecting'
                ? 'Connecting to Stream...'
                : 'Reconnecting...'}
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center space-x-1 text-slate-400">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>{activeStudentsCount} Participants</span>
            </span>
          </div>

          {/* Right: Participant Badge & Leave Meeting Button */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>{session.name} (Student)</span>
            </div>

            <button
              id="student-leave-meeting-btn"
              onClick={() => {
                if (window.confirm('Leave this live classroom session?')) {
                  onLeaveMeeting();
                }
              }}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave Class</span>
            </button>
          </div>
        </div>
      </div>

      {/* Autoplay Audio Unmute Prompt if blocked by browser policy */}
      {audioAutoplayBlocked && (
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-center text-xs font-semibold text-white flex items-center justify-center space-x-3 shadow-md">
          <span>🔊 Your browser paused lecture audio. Click to enable instructor's live audio:</span>
          <button
            onClick={handleUnmuteAudio}
            className="px-3 py-1 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Enable Audio Now
          </button>
        </div>
      )}

      {/* Main Student Stage */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Video Broadcast Player */}
        <div className={`space-y-3 ${adminMediaState.activeMaterial ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative aspect-video flex items-center justify-center group">
            {/* Live WebRTC Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                !adminMediaState.cameraActive && !adminMediaState.isScreenSharing ? 'opacity-0' : 'opacity-100'
              }`}
            />

            {/* Teacher Camera Off Indicator */}
            {!adminMediaState.cameraActive && !adminMediaState.isScreenSharing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <VideoOff className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-sm font-semibold text-slate-300">Instructor Has Paused Video Feed</p>
                <p className="text-xs text-slate-500">Audio and educational materials remain active</p>
              </div>
            )}

            {/* Overlays */}
            <div className="absolute top-3 left-3 flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[11px] font-bold text-white flex items-center space-x-1.5 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>
                  {adminMediaState.isScreenSharing
                    ? 'Instructor Screen Share'
                    : `Instructor: ${adminName}`}
                </span>
              </span>

              {!adminMediaState.micActive && (
                <span className="px-2.5 py-1 rounded-md bg-rose-500/80 backdrop-blur-md text-[11px] font-bold text-white flex items-center space-x-1">
                  <MicOff className="w-3 h-3" />
                  <span>Instructor Muted</span>
                </span>
              )}
            </div>

            {/* Bottom Right Player Controls (Mute/Fullscreen strictly for student's local view) */}
            <div className="absolute bottom-3 right-3 flex items-center space-x-2">
              <button
                onClick={handleToggleSpeaker}
                className="p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white hover:bg-black/80 border border-white/10 transition-colors"
                title={isAudioMutedByStudent ? 'Unmute audio' : 'Mute audio'}
              >
                {isAudioMutedByStudent ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-white" />}
              </button>

              <button
                onClick={handleToggleFullscreen}
                className="p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white hover:bg-black/80 border border-white/10 transition-colors"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Student Information Strip (No Admin Controls) */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-slate-300">View-Only Student Mode Active</span>
              <span className="text-slate-500">•</span>
              <span>Camera & mic controls reserved for Instructor</span>
            </div>

            <div className="flex items-center space-x-3 font-mono text-[11px]">
              <span className="text-slate-400">Audio: {adminMediaState.micActive ? 'Live' : 'Muted'}</span>
              <span className="text-slate-400">Stream: WebRTC</span>
            </div>
          </div>
        </div>

        {/* Side Panel: Shared Educational Material (Synchronously pushed by Admin) */}
        {adminMediaState.activeMaterial && (
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">{adminMediaState.activeMaterial.title}</h3>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Shared by Instructor
              </span>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center max-h-[420px]">
              <img
                src={adminMediaState.activeMaterial.url}
                alt={adminMediaState.activeMaterial.title}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {adminMediaState.activeMaterial.description && (
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                {adminMediaState.activeMaterial.description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer Information */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-3 px-4 text-center text-xs text-slate-500">
        Blueflmame Meeting • Participating as <strong className="text-slate-300">{session.name}</strong> • Meeting Code #{session.meetingCode}
      </footer>
    </div>
  );
};
