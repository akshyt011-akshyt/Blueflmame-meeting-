import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Share2,
  BookOpen,
  Users,
  Power,
  Copy,
  Check,
  Radio,
  AlertCircle,
  Sparkles,
  Upload,
  X,
  Maximize2,
  Minimize2,
  ChevronDown,
  Info
} from 'lucide-react';
import { Meeting, LearningMaterial, StudentParticipant } from '../types';
import { SignalingClient } from '../utils/signaling';
import { WebRTCManager } from '../utils/webrtc';
import { PRESET_MATERIALS } from '../data/materials';

interface AdminLiveMeetingProps {
  meeting: Meeting;
  adminToken: string;
  onEndMeeting: (code: string) => void;
  onLeaveRoom: () => void;
}

export const AdminLiveMeeting: React.FC<AdminLiveMeetingProps> = ({
  meeting,
  adminToken,
  onEndMeeting,
  onLeaveRoom,
}) => {
  // Media State
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeMaterial, setActiveMaterial] = useState<LearningMaterial | null>(null);

  // Student list & status
  const [students, setStudents] = useState<StudentParticipant[]>([]);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [showMaterialDrawer, setShowMaterialDrawer] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);

  // WebRTC & Signaling references
  const videoRef = useRef<HTMLVideoElement>(null);
  const signalingRef = useRef<SignalingClient | null>(null);
  const webrtcRef = useRef<WebRTCManager | null>(null);

  useEffect(() => {
    let isMounted = true;
    const signaling = new SignalingClient();
    signalingRef.current = signaling;

    const rtc = new WebRTCManager();
    webrtcRef.current = rtc;

    // 1. Initialize Media (Camera & Mic)
    const initMediaAndSignaling = async () => {
      const mediaResult = await rtc.startCameraAndMic();
      if (!isMounted) return;

      if (videoRef.current && mediaResult.stream) {
        videoRef.current.srcObject = mediaResult.stream;
        videoRef.current.play().catch((e) => console.warn('Local play warning:', e));
      }

      if (mediaResult.isFallback) {
        setPermissionNotice(
          'Hardware camera/mic not detected or browser permission was restricted. Active virtual educator feed is broadcasting.'
        );
      }

      // 2. Connect to Signaling Server
      try {
        await signaling.connect();
        if (!isMounted) return;

        // Join room as Admin
        signaling.send('admin:join-room', {
          code: meeting.code,
          token: adminToken,
        });

        // Broadcast initial media state
        signaling.send('admin:media-state', {
          mediaState: {
            cameraActive: true,
            micActive: true,
            isScreenSharing: false,
            activeMaterial: null,
          },
        });
      } catch (err) {
        console.error('Signaling connection error:', err);
      }
    };

    initMediaAndSignaling();

    // 3. Signaling Event Handlers
    signaling.on('admin:joined', (data) => {
      if (!isMounted) return;
      if (data.students) {
        setStudents(data.students);
      }
    });

    // When a student joins, admin initiates WebRTC connection
    signaling.on('student:joined', async (data) => {
      if (!isMounted || !webrtcRef.current) return;
      const { studentId, studentName } = data;

      setStudents((prev) => {
        if (prev.some((s) => s.id === studentId)) return prev;
        return [...prev, { id: studentId, name: studentName, joinedAt: Date.now() }];
      });

      try {
        const { offer } = await webrtcRef.current.createAdminPeerConnectionForStudent(
          studentId,
          (candidate) => {
            signaling.send('webrtc:ice-candidate', {
              targetStudentId: studentId,
              candidate,
            });
          }
        );

        signaling.send('webrtc:offer', {
          targetStudentId: studentId,
          sdp: offer,
        });
      } catch (e) {
        console.error('Error creating offer for student:', e);
      }
    });

    signaling.on('webrtc:answer', async (data) => {
      if (!isMounted || !webrtcRef.current) return;
      const { studentId, sdp } = data;
      await webrtcRef.current.handleStudentAnswer(studentId, sdp);
    });

    signaling.on('webrtc:ice-candidate', async (data) => {
      if (!isMounted || !webrtcRef.current) return;
      const { studentId, candidate } = data;
      await webrtcRef.current.handleStudentIceCandidate(studentId, candidate);
    });

    signaling.on('student:left', (data) => {
      if (!isMounted) return;
      const { studentId } = data;
      webrtcRef.current?.removeStudentPeer(studentId);
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
    });

    return () => {
      isMounted = false;
      signaling.disconnect();
      rtc.cleanup();
    };
  }, [meeting.code, adminToken]);

  // Handle Camera Toggle
  const handleToggleCamera = () => {
    if (!webrtcRef.current) return;
    const newState = webrtcRef.current.toggleCamera();
    setIsCameraOn(newState);

    signalingRef.current?.send('admin:media-state', {
      mediaState: {
        cameraActive: newState,
        micActive: isMicOn,
        isScreenSharing,
        activeMaterial,
      },
    });
  };

  // Handle Mic Toggle
  const handleToggleMic = () => {
    if (!webrtcRef.current) return;
    const newState = webrtcRef.current.toggleMicrophone();
    setIsMicOn(newState);

    signalingRef.current?.send('admin:media-state', {
      mediaState: {
        cameraActive: isCameraOn,
        micActive: newState,
        isScreenSharing,
        activeMaterial,
      },
    });
  };

  // Handle Screen Share Toggle
  const handleToggleScreenShare = async () => {
    if (!webrtcRef.current) return;

    if (!isScreenSharing) {
      try {
        const result = await webrtcRef.current.startScreenShare(meeting.adminName || 'Instructor');
        setIsScreenSharing(true);
        if (result.isFallback) {
          setPermissionNotice(
            'Broadcasting Live Interactive Presentation Board (native screen capture is restricted or unavailable in this frame).'
          );
        }
        if (videoRef.current) {
          videoRef.current.srcObject = result.stream;
        }

        signalingRef.current?.send('admin:media-state', {
          mediaState: {
            cameraActive: isCameraOn,
            micActive: isMicOn,
            isScreenSharing: true,
            activeMaterial,
          },
        });
      } catch (err) {
        console.warn('Screen share cancelled or not allowed:', err);
      }
    } else {
      webrtcRef.current.stopScreenShare();
      setIsScreenSharing(false);
      if (videoRef.current && webrtcRef.current.cameraStream) {
        videoRef.current.srcObject = webrtcRef.current.cameraStream;
      }

      signalingRef.current?.send('admin:media-state', {
        mediaState: {
          cameraActive: isCameraOn,
          micActive: isMicOn,
          isScreenSharing: false,
          activeMaterial,
        },
      });
    }
  };

  // Handle Selecting Educational Material
  const handleSelectMaterial = (material: LearningMaterial | null) => {
    setActiveMaterial(material);
    setShowMaterialDrawer(false);

    signalingRef.current?.send('admin:media-state', {
      mediaState: {
        cameraActive: isCameraOn,
        micActive: isMicOn,
        isScreenSharing,
        activeMaterial: material,
      },
    });
  };

  // Handle Custom Upload of Educational Image
  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const customMat: LearningMaterial = {
        id: 'custom-' + Date.now(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        type: 'custom',
        url: reader.result as string,
        description: 'Uploaded by Admin Instructor',
      };
      handleSelectMaterial(customMat);
    };
    reader.readAsDataURL(file);
  };

  // Handle Copy Meeting Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(meeting.code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Handle End Meeting
  const handleConfirmEndMeeting = async () => {
    if (!window.confirm(`Are you sure you want to end "${meeting.name}"? This will invalidate the 6-digit code (${meeting.code}) and disconnect all students.`)) {
      return;
    }
    setIsEnding(true);
    try {
      await onEndMeeting(meeting.code);
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <div id="admin-live-meeting-page" className="min-h-[calc(100vh-4rem)] bg-slate-950 flex flex-col justify-between text-slate-100">
      {/* Top Bar with Meeting Information & Code */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Meeting Info */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-white text-sm sm:text-base">{meeting.name}</h1>
                <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-[10px] uppercase tracking-wider">
                  LIVE BROADCAST
                </span>
              </div>
              <p className="text-xs text-slate-400">Admin Control Center • Full Authority</p>
            </div>
          </div>

          {/* Center: Meeting 6-Digit Code Badge */}
          <div className="flex items-center space-x-2 bg-slate-950 border-2 border-cyan-500/40 px-3.5 py-1.5 rounded-xl shadow-inner">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Meeting Code:</span>
            <span id="admin-meeting-code-val" className="font-mono text-cyan-300 font-extrabold text-base tracking-widest">
              {meeting.code}
            </span>
            <button
              id="admin-copy-code-btn"
              onClick={handleCopyCode}
              title="Copy code for students"
              className="ml-1 p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Right: Students Drawer Trigger & End Meeting */}
          <div className="flex items-center space-x-2">
            <button
              id="btn-show-students-modal"
              onClick={() => setShowStudentsModal(!showStudentsModal)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Students ({students.length})</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            <button
              id="admin-end-meeting-top-btn"
              onClick={handleConfirmEndMeeting}
              disabled={isEnding}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isEnding ? 'Ending...' : 'End Meeting'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Permission Warning Notice if virtual fallback was triggered */}
      {permissionNotice && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs text-amber-300 flex items-center justify-center space-x-2">
          <Info className="w-4 h-4 shrink-0" />
          <span>{permissionNotice}</span>
        </div>
      )}

      {/* Main Broadcast Stage */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Video Screen (Camera / Screen Share) */}
        <div className={`space-y-4 ${activeMaterial ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative aspect-video flex items-center justify-center group">
            {/* Live Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${!isCameraOn && !isScreenSharing ? 'opacity-0' : 'opacity-100'}`}
            />

            {/* Video Placeholder when Camera & Screen are Off */}
            {!isCameraOn && !isScreenSharing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <VideoOff className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-sm font-semibold text-slate-300">Camera Feed is Turned Off</p>
                <p className="text-xs text-slate-500">Audio and shared materials remain live for students</p>
              </div>
            )}

            {/* Overlay Badges */}
            <div className="absolute top-3 left-3 flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[11px] font-bold text-white flex items-center space-x-1.5 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>{isScreenSharing ? 'Screen Share Live' : 'Instructor Camera'}</span>
              </span>
              {!isMicOn && (
                <span className="px-2.5 py-1 rounded-md bg-rose-500/80 backdrop-blur-md text-[11px] font-bold text-white flex items-center space-x-1">
                  <MicOff className="w-3 h-3" />
                  <span>Muted</span>
                </span>
              )}
            </div>

            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[11px] text-slate-300 border border-white/10">
              WebRTC HD 720p • Real-Time Broadcast
            </div>
          </div>

          {/* Quick Status Bar below Video */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-xs text-slate-400">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <span className={`w-2 h-2 rounded-full ${isCameraOn ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                <span>Camera: {isCameraOn ? 'Active' : 'Off'}</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className={`w-2 h-2 rounded-full ${isMicOn ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                <span>Mic: {isMicOn ? 'Broadcasting' : 'Muted'}</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className={`w-2 h-2 rounded-full ${isScreenSharing ? 'bg-cyan-400' : 'bg-slate-500'}`} />
                <span>Screen: {isScreenSharing ? 'Sharing' : 'Off'}</span>
              </span>
            </div>
            <span>
              Connected Students: <strong className="text-white font-bold">{students.length}</strong>
            </span>
          </div>
        </div>

        {/* Side Panel: Active Educational Material (if chosen) */}
        {activeMaterial && (
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">{activeMaterial.title}</h3>
              </div>
              <button
                onClick={() => handleSelectMaterial(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                title="Stop sharing material"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center max-h-[380px]">
              <img
                src={activeMaterial.url}
                alt={activeMaterial.title}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {activeMaterial.description && (
              <p className="text-xs text-slate-400 leading-relaxed">{activeMaterial.description}</p>
            )}

            <div className="flex justify-end pt-1">
              <button
                onClick={() => handleSelectMaterial(null)}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
              >
                Remove from Student View
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Students Drawer / List Modal */}
      {showStudentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Connected Students ({students.length})</h3>
              </div>
              <button
                onClick={() => setShowStudentsModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Students joined with code <strong className="text-cyan-300 font-mono">#{meeting.code}</strong>. They are in
              strict View-Only mode and cannot broadcast or interfere.
            </p>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-800 pr-1">
              {students.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No students have joined yet. Share code <strong className="text-cyan-300">{meeting.code}</strong>.
                </div>
              ) : (
                students.map((student, idx) => (
                  <div key={student.id || idx} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-slate-200 font-medium">{student.name}</span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-mono">Connected (View-Only)</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Educational Material Picker Modal */}
      {showMaterialDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Educational Learning Material Library</h3>
              </div>
              <button
                onClick={() => setShowMaterialDrawer(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Select an educational visual or upload your own image/diagram. This will be displayed synchronously on all
              connected students' screens.
            </p>

            {/* Custom Upload Button */}
            <div className="mb-4">
              <label className="flex items-center justify-center space-x-2 w-full py-3 px-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-cyan-500 bg-slate-950/50 hover:bg-slate-800/40 text-xs font-semibold text-slate-300 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Upload Custom Educational Image or Slide (PNG / JPG)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCustomUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Presets Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1">
              {PRESET_MATERIALS.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectMaterial(item)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    activeMaterial?.id === item.id
                      ? 'bg-blue-600/20 border-blue-500'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="h-28 rounded-lg overflow-hidden bg-slate-900 mb-2.5">
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h4 className="text-xs font-bold text-white leading-tight mb-1">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Controls Dock */}
      <div className="bg-slate-900 border-t border-slate-800 py-3 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-3">
          {/* Camera Button */}
          <button
            id="admin-btn-toggle-camera"
            onClick={handleToggleCamera}
            className={`p-3 rounded-xl font-medium text-xs flex items-center space-x-2 transition-all cursor-pointer ${
              isCameraOn
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
            }`}
          >
            {isCameraOn ? <Video className="w-4 h-4 text-emerald-400" /> : <VideoOff className="w-4 h-4 text-rose-400" />}
            <span className="hidden sm:inline">{isCameraOn ? 'Stop Camera' : 'Start Camera'}</span>
          </button>

          {/* Microphone Button */}
          <button
            id="admin-btn-toggle-mic"
            onClick={handleToggleMic}
            className={`p-3 rounded-xl font-medium text-xs flex items-center space-x-2 transition-all cursor-pointer ${
              isMicOn
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
            }`}
          >
            {isMicOn ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-rose-400" />}
            <span className="hidden sm:inline">{isMicOn ? 'Mute Mic' : 'Start Microphone'}</span>
          </button>

          {/* Screen Share Button */}
          <button
            id="admin-btn-screen-share"
            onClick={handleToggleScreenShare}
            className={`p-3 rounded-xl font-medium text-xs flex items-center space-x-2 transition-all cursor-pointer ${
              isScreenSharing
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/25'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Share2 className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">{isScreenSharing ? 'Stop Screen Share' : 'Screen Share'}</span>
          </button>

          {/* Upload/Show Learning Material Button */}
          <button
            id="admin-btn-learning-material"
            onClick={() => setShowMaterialDrawer(true)}
            className={`p-3 rounded-xl font-medium text-xs flex items-center space-x-2 transition-all cursor-pointer ${
              activeMaterial
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">
              {activeMaterial ? 'Material Active' : 'Upload / Show Material'}
            </span>
          </button>

          {/* Active Students Counter Button */}
          <button
            id="admin-btn-students-count"
            onClick={() => setShowStudentsModal(true)}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Active Students:</span>
            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold">
              {students.length}
            </span>
          </button>

          {/* End Meeting Button */}
          <button
            id="admin-btn-end-meeting"
            onClick={handleConfirmEndMeeting}
            disabled={isEnding}
            className="p-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Power className="w-4 h-4" />
            <span>{isEnding ? 'Ending...' : 'End Meeting'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
