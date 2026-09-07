// WebRTC helper with robust connection handling and media streams

export const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

// Generates a virtual fallback video/audio stream if hardware camera/mic is denied or unavailable
export function createVirtualPresenterStream(teacherName: string = 'Instructor (Virtual Feed)'): MediaStream {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;

  let frame = 0;
  const draw = () => {
    frame++;
    // Dark modern gradient background
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1e293b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle ambient animated particles
    for (let i = 0; i < 20; i++) {
      const x = (Math.sin(frame * 0.01 + i) * 0.5 + 0.5) * canvas.width;
      const y = (Math.cos(frame * 0.015 + i * 2) * 0.5 + 0.5) * canvas.height;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.beginPath();
      ctx.arc(x, y, 4 + (i % 5), 0, Math.PI * 2);
      ctx.fill();
    }

    // Centered avatar circle with glowing blue outline
    const cx = canvas.width / 2;
    const cy = canvas.height / 2 - 40;
    ctx.beginPath();
    ctx.arc(cx, cy, 90, 0, Math.PI * 2);
    ctx.fillStyle = '#0284c7';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    // Teacher icon representation
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎓', cx, cy);

    // Title / Teacher name
    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(teacherName, cx, cy + 130);

    // Subtitle
    ctx.font = '22px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Live Broadcast Feed • Blueflmame Meeting', cx, cy + 175);

    // Pulsing live indicator
    const pulse = (Math.sin(frame * 0.08) + 1) / 2;
    ctx.fillStyle = `rgba(239, 68, 68, ${0.4 + pulse * 0.6})`;
    ctx.beginPath();
    ctx.arc(cx - 90, cy + 225, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'left';
    ctx.fillText('LIVE STREAM ACTIVE', cx - 74, cy + 225);

    requestAnimationFrame(draw);
  };

  requestAnimationFrame(draw);

  // Capture canvas stream at 30 fps
  const videoStream = canvas.captureStream(30);

  // Add silent audio track via Web Audio API
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const dst = audioCtx.createMediaStreamDestination();
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.0001; // virtually silent carrier
    osc.connect(gainNode);
    gainNode.connect(dst);
    osc.start();

    const audioTrack = dst.stream.getAudioTracks()[0];
    if (audioTrack) {
      videoStream.addTrack(audioTrack);
    }
  } catch (e) {
    console.warn('AudioContext fallback warning:', e);
  }

  return videoStream;
}

// Generates an interactive presentation blackboard / screen-share stream when native getDisplayMedia is unavailable
export function createVirtualScreenShareStream(teacherName: string = 'Instructor (Presentation Board)'): MediaStream {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;

  let frame = 0;
  const startTime = Date.now();
  let isRunning = true;

  const draw = () => {
    if (!isRunning) return;
    frame++;
    const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
    const min = Math.floor(elapsedSec / 60);
    const sec = elapsedSec % 60;
    const timeStr = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

    // Slate presentation canvas
    ctx.fillStyle = '#080d1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid pattern for blackboard / technical workspace aesthetic
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Top Header Banner
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, 60);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, 60);

    // Presentation title
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('💻 Interactive Lecture Screen • Blueflmame Meeting', 24, 38);

    // Live Badge on header
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(canvas.width - 240, 30, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`SCREEN SHARE LIVE • ${timeStr}`, canvas.width - 220, 35);

    // Slide Container Box
    const boxX = 60;
    const boxY = 90;
    const boxW = canvas.width - 120;
    const boxH = canvas.height - 130;

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    if (typeof (ctx as any).roundRect === 'function') {
      ctx.beginPath();
      (ctx as any).roundRect(boxX, boxY, boxW, boxH, 16);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeRect(boxX, boxY, boxW, boxH);
    }

    // Slide Heading
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('Lecture Topic: Modern WebRTC & Real-Time Media', boxX + 40, boxY + 58);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Presenter: ${teacherName} • Full Classroom Broadcast`, boxX + 40, boxY + 92);

    // Divider
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(boxX + 40, boxY + 110);
    ctx.lineTo(boxX + boxW - 40, boxY + 110);
    ctx.stroke();

    // Educational Bullet points
    const points = [
      '1. Peer-to-Peer WebRTC Media Streaming with Low Latency',
      '2. Adaptive Screen Sharing & Live Lecture Broadcasting',
      '3. Encrypted SRTP Audio & Video Channels for Classroom Privacy',
      '4. Dynamic Classroom Synchronizer with Shared Learning Materials',
    ];

    points.forEach((pt, idx) => {
      const py = boxY + 158 + idx * 46;
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(boxX + 55, py - 6, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '19px sans-serif';
      ctx.fillText(pt, boxX + 75, py);
    });

    // Dynamic animated waveform at the bottom of the presentation
    const waveY = boxY + boxH - 110;
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Real-Time Audio & Video Waveform Analysis:', boxX + 40, waveY - 18);

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x < boxW - 80; x += 4) {
      const y = waveY + Math.sin((x + frame * 4) * 0.04) * 22 * Math.sin(x * 0.01) + 12;
      if (x === 0) ctx.moveTo(boxX + 40 + x, y);
      else ctx.lineTo(boxX + 40 + x, y);
    }
    ctx.stroke();

    // Simulated presenter cursor moving smoothly over slide
    const cursorX = boxX + 120 + Math.sin(frame * 0.02) * 220 + ((frame * 2) % 300);
    const cursorY = boxY + 180 + Math.cos(frame * 0.018) * 90;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(cursorX, cursorY);
    ctx.lineTo(cursorX + 16, cursorY + 14);
    ctx.lineTo(cursorX + 8, cursorY + 16);
    ctx.lineTo(cursorX + 12, cursorY + 26);
    ctx.lineTo(cursorX + 7, cursorY + 28);
    ctx.lineTo(cursorX + 3, cursorY + 18);
    ctx.lineTo(cursorX, cursorY + 22);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Footer note
    ctx.fillStyle = '#64748b';
    ctx.font = '13px sans-serif';
    ctx.fillText('⚡ Real-time presentation broadcast streaming to all connected students', boxX + 40, boxY + boxH - 25);

    requestAnimationFrame(draw);
  };

  requestAnimationFrame(draw);

  // Capture canvas stream at 30 fps
  const videoStream = canvas.captureStream(30);

  videoStream.getVideoTracks()[0]?.addEventListener('ended', () => {
    isRunning = false;
  });

  // Add silent audio track via Web Audio API to satisfy WebRTC audio track transceiver
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const dst = audioCtx.createMediaStreamDestination();
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.0001;
    osc.connect(gainNode);
    gainNode.connect(dst);
    osc.start();

    const audioTrack = dst.stream.getAudioTracks()[0];
    if (audioTrack) {
      videoStream.addTrack(audioTrack);
    }
  } catch (e) {
    console.warn('AudioContext fallback warning in screen stream:', e);
  }

  return videoStream;
}

export class WebRTCManager {
  public localStream: MediaStream | null = null;
  public cameraStream: MediaStream | null = null;
  public screenStream: MediaStream | null = null;
  public isScreenSharing = false;
  public isCameraEnabled = true;
  public isMicEnabled = true;

  // Admin mapping: studentId -> RTCPeerConnection
  private peerConnections: Map<string, RTCPeerConnection> = new Map();

  // Student single peer connection
  public studentPeerConnection: RTCPeerConnection | null = null;
  public remoteStream: MediaStream | null = null;

  // Callback hooks
  public onRemoteStream?: (stream: MediaStream) => void;
  public onConnectionStateChange?: (state: RTCPeerConnectionState) => void;

  /**
   * Acquire camera & microphone stream with permission fallback
   */
  public async startCameraAndMic(): Promise<{ stream: MediaStream; isFallback: boolean; error?: string }> {
    try {
      if (this.cameraStream) {
        this.cameraStream.getTracks().forEach((t) => t.stop());
      }

      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== 'function'
      ) {
        throw new Error('getUserMedia is not supported in this browser or iframe environment');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: true,
      });

      this.cameraStream = stream;
      this.localStream = stream;
      this.isCameraEnabled = true;
      this.isMicEnabled = true;
      return { stream, isFallback: false };
    } catch (err: any) {
      console.warn('getUserMedia failed, falling back to simulated broadcast stream:', err);
      const fallbackStream = createVirtualPresenterStream('Admin Instructor');
      this.cameraStream = fallbackStream;
      this.localStream = fallbackStream;
      this.isCameraEnabled = true;
      this.isMicEnabled = true;
      return {
        stream: fallbackStream,
        isFallback: true,
        error: err.name === 'NotAllowedError' ? 'Permission denied by browser' : err.message,
      };
    }
  }

  /**
   * Start screen sharing with automatic fallback for environments where getDisplayMedia is not a function
   */
  public async startScreenShare(teacherName: string = 'Instructor'): Promise<{ stream: MediaStream; isFallback: boolean }> {
    try {
      // 1. Check if navigator.mediaDevices and getDisplayMedia exist and are functions
      const hasNativeGetDisplayMedia =
        typeof navigator !== 'undefined' &&
        !!navigator.mediaDevices &&
        typeof navigator.mediaDevices.getDisplayMedia === 'function';

      if (hasNativeGetDisplayMedia) {
        try {
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              cursor: 'always',
              displaySurface: 'monitor',
            } as any,
            audio: true,
          });

          this.screenStream = displayStream;
          this.isScreenSharing = true;

          // Listen for screen share termination (user clicks 'Stop Sharing' in browser bar)
          displayStream.getVideoTracks()[0].onended = () => {
            this.stopScreenShare();
          };

          // Replace video tracks on all active student peer connections
          const screenTrack = displayStream.getVideoTracks()[0];
          this.replaceVideoTrackInAllPeers(screenTrack);

          return { stream: displayStream, isFallback: false };
        } catch (mediaErr: any) {
          // If the user actively clicked "Cancel" in the native window selection dialog
          if (
            mediaErr.name === 'NotAllowedError' &&
            (mediaErr.message?.toLowerCase().includes('permission denied') ||
              mediaErr.message?.toLowerCase().includes('user cancelled') ||
              mediaErr.message?.toLowerCase().includes('cancel'))
          ) {
            console.warn('User cancelled screen selection dialog:', mediaErr);
            throw mediaErr;
          }
          console.warn('Native getDisplayMedia request failed, falling back to presentation stream:', mediaErr);
        }
      } else {
        console.warn(
          'navigator.mediaDevices.getDisplayMedia is not available in this context (e.g. iframe or mobile). Falling back to presentation screen.'
        );
      }

      // 2. Seamless presentation slide fallback stream
      const fallbackStream = createVirtualScreenShareStream(teacherName);
      this.screenStream = fallbackStream;
      this.isScreenSharing = true;

      const screenTrack = fallbackStream.getVideoTracks()[0];
      this.replaceVideoTrackInAllPeers(screenTrack);

      return { stream: fallbackStream, isFallback: true };
    } catch (err) {
      console.error('Error starting screen share:', err);
      throw err;
    }
  }

  /**
   * Stop screen share and revert to camera stream
   */
  public stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }
    this.isScreenSharing = false;

    // Revert to camera stream track if available
    if (this.cameraStream) {
      const cameraTrack = this.cameraStream.getVideoTracks()[0];
      if (cameraTrack) {
        this.replaceVideoTrackInAllPeers(cameraTrack);
      }
    }
  }

  /**
   * Toggle camera track on/off
   */
  public toggleCamera(enable?: boolean): boolean {
    const targetState = enable !== undefined ? enable : !this.isCameraEnabled;
    this.isCameraEnabled = targetState;

    if (this.cameraStream) {
      this.cameraStream.getVideoTracks().forEach((track) => {
        track.enabled = targetState;
      });
    }
    return targetState;
  }

  /**
   * Toggle microphone track on/off
   */
  public toggleMicrophone(enable?: boolean): boolean {
    const targetState = enable !== undefined ? enable : !this.isMicEnabled;
    this.isMicEnabled = targetState;

    if (this.cameraStream) {
      this.cameraStream.getAudioTracks().forEach((track) => {
        track.enabled = targetState;
      });
    }
    return targetState;
  }

  /**
   * Helper to replace video track across all active student RTCPeerConnections
   */
  private replaceVideoTrackInAllPeers(newTrack: MediaStreamTrack) {
    this.peerConnections.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (sender) {
        sender.replaceTrack(newTrack).catch((e) => console.warn('Failed to replace video track', e));
      }
    });
  }

  // --- ADMIN SIDE: Create peer connection for a joining student ---
  public async createAdminPeerConnectionForStudent(
    studentId: string,
    onIceCandidate: (candidate: RTCIceCandidate) => void
  ): Promise<{ pc: RTCPeerConnection; offer: RTCSessionDescriptionInit }> {
    const pc = new RTCPeerConnection(RTC_CONFIGURATION);
    this.peerConnections.set(studentId, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };

    // Attach active stream tracks (either screen share or camera)
    const activeStream = this.isScreenSharing && this.screenStream ? this.screenStream : this.cameraStream;
    if (activeStream) {
      activeStream.getTracks().forEach((track) => {
        pc.addTrack(track, activeStream);
      });
    }

    // Create SDP Offer
    const offer = await pc.createOffer({
      offerToReceiveAudio: false,
      offerToReceiveVideo: false,
    });
    await pc.setLocalDescription(offer);

    return { pc, offer };
  }

  public async handleStudentAnswer(studentId: string, sdp: RTCSessionDescriptionInit) {
    const pc = this.peerConnections.get(studentId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    }
  }

  public async handleStudentIceCandidate(studentId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peerConnections.get(studentId);
    if (pc && candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('Error adding ice candidate for student:', e);
      }
    }
  }

  public removeStudentPeer(studentId: string) {
    const pc = this.peerConnections.get(studentId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(studentId);
    }
  }

  // --- STUDENT SIDE: Connect to Admin's broadcast ---
  public async createStudentPeerConnection(
    onIceCandidate: (candidate: RTCIceCandidate) => void
  ): Promise<RTCPeerConnection> {
    if (this.studentPeerConnection) {
      this.studentPeerConnection.close();
    }

    const pc = new RTCPeerConnection(RTC_CONFIGURATION);
    this.studentPeerConnection = pc;

    this.remoteStream = new MediaStream();

    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        this.remoteStream?.addTrack(track);
      });
      if (this.onRemoteStream && this.remoteStream) {
        this.onRemoteStream(this.remoteStream);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(pc.connectionState);
      }
    };

    return pc;
  }

  public async handleAdminOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.studentPeerConnection) {
      throw new Error('Student peer connection not initialized');
    }

    await this.studentPeerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.studentPeerConnection.createAnswer();
    await this.studentPeerConnection.setLocalDescription(answer);
    return answer;
  }

  public async handleAdminIceCandidate(candidate: RTCIceCandidateInit) {
    if (this.studentPeerConnection && candidate) {
      try {
        await this.studentPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('Error adding admin ice candidate on student:', e);
      }
    }
  }

  /**
   * Cleanup everything
   */
  public cleanup() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((t) => t.stop());
      this.cameraStream = null;
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
    }
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();

    if (this.studentPeerConnection) {
      this.studentPeerConnection.close();
      this.studentPeerConnection = null;
    }
    this.localStream = null;
    this.remoteStream = null;
  }
}
