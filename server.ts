import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

interface StudentRecord {
  id: string;
  name: string;
  ws: WebSocket;
  joinedAt: number;
  cameraAllowed: boolean;
  micAllowed: boolean;
  cameraActive: boolean;
  micActive: boolean;
  connectionStatus: 'connected' | 'reconnecting';
}

interface ActiveMeeting {
  code: string;
  name: string;
  adminToken: string;
  adminName: string;
  createdAt: number;
  isActive: boolean;
  adminWs: WebSocket | null;
  students: Map<string, StudentRecord>;
  mediaState: {
    cameraActive: boolean;
    micActive: boolean;
    isScreenSharing: boolean;
    activeMaterial: any | null;
  };
}

const app = express();
const PORT = 3000;
const server = http.createServer(app);

app.use(express.json({ limit: '10mb' }));

// In-memory active meetings store
const activeMeetings = new Map<string, ActiveMeeting>();

// Active Admin sessions (token -> admin details)
const adminSessions = new Map<string, { username: string; name: string }>();

// Helper to generate a unique 6-digit code
function generateMeetingCode(): string {
  let code: string;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (activeMeetings.has(code));
  return code;
}

// Middleware to verify admin token
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const session = adminSessions.get(token);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired admin session' });
    return;
  }
  (req as any).admin = session;
  (req as any).adminToken = token;
  next();
}

// REST API Endpoints
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), activeMeetingsCount: activeMeetings.size });
});

// Admin Login
app.post('/api/auth/admin-login', (req, res) => {
  const { username, password } = req.body;
  const configuredPassword = process.env.ADMIN_PASSWORD || 'admin';

  // Support default admin login or configured password
  if (
    (username === 'admin' && (password === configuredPassword || password === 'admin' || password === 'Admin@123')) ||
    (username === 'admin@blueflmame.edu' && (password === configuredPassword || password === 'Admin@123' || password === 'admin'))
  ) {
    const token = 'bfm_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const adminData = {
      username: username,
      name: 'Professor / Admin Instructor'
    };
    adminSessions.set(token, adminData);
    res.json({
      success: true,
      token,
      admin: adminData
    });
  } else {
    res.status(401).json({ error: 'Invalid admin credentials. Default username is "admin" and password is "admin".' });
  }
});

// Verify Admin token
app.get('/api/auth/verify', requireAdmin, (req, res) => {
  res.json({ valid: true, admin: (req as any).admin });
});

// Create a new meeting (Admin only)
app.post('/api/meetings/create', requireAdmin, (req, res) => {
  const { name } = req.body;
  const meetingName = (name && name.trim()) || 'Online Lecture';
  const code = generateMeetingCode();
  const token = (req as any).adminToken;
  const admin = (req as any).admin;

  const meeting: ActiveMeeting = {
    code,
    name: meetingName,
    adminToken: token,
    adminName: admin.name,
    createdAt: Date.now(),
    isActive: true,
    adminWs: null,
    students: new Map(),
    mediaState: {
      cameraActive: true,
      micActive: true,
      isScreenSharing: false,
      activeMaterial: null,
    },
  };

  activeMeetings.set(code, meeting);

  res.json({
    success: true,
    meeting: {
      code: meeting.code,
      name: meeting.name,
      adminName: meeting.adminName,
      createdAt: meeting.createdAt,
      isActive: meeting.isActive,
      activeStudentsCount: 0,
    },
  });
});

// Verify Meeting Code (Public for Students)
app.get('/api/meetings/verify/:code', (req, res) => {
  const code = req.params.code.trim();
  const meeting = activeMeetings.get(code);

  if (meeting && meeting.isActive) {
    res.json({
      valid: true,
      meeting: {
        code: meeting.code,
        name: meeting.name,
        adminName: meeting.adminName,
        createdAt: meeting.createdAt,
        activeStudentsCount: meeting.students.size,
      },
    });
  } else {
    res.status(404).json({
      valid: false,
      error: 'Meeting code not found, inactive, or already ended.',
    });
  }
});

// List all active meetings (Admin only)
app.get('/api/meetings/active', requireAdmin, (req, res) => {
  const token = (req as any).adminToken;
  const list = Array.from(activeMeetings.values())
    .filter((m) => m.adminToken === token && m.isActive)
    .map((m) => ({
      code: m.code,
      name: m.name,
      adminName: m.adminName,
      createdAt: m.createdAt,
      isActive: m.isActive,
      activeStudentsCount: m.students.size,
    }));
  res.json({ meetings: list });
});

// End meeting (Admin only)
app.post('/api/meetings/end', requireAdmin, (req, res) => {
  const { code } = req.body;
  const meeting = activeMeetings.get(code);

  if (!meeting) {
    res.status(404).json({ error: 'Meeting not found' });
    return;
  }

  if (meeting.adminToken !== (req as any).adminToken) {
    res.status(403).json({ error: 'Forbidden: You are not the creator of this meeting' });
    return;
  }

  // Mark inactive
  meeting.isActive = false;

  // Broadcast meeting ended to all connected student sockets
  const endPayload = JSON.stringify({
    action: 'room:ended',
    reason: 'Admin ended the class session',
  });

  meeting.students.forEach((student) => {
    if (student.ws.readyState === WebSocket.OPEN) {
      student.ws.send(endPayload);
      student.ws.close();
    }
  });

  if (meeting.adminWs && meeting.adminWs.readyState === WebSocket.OPEN) {
    meeting.adminWs.send(endPayload);
  }

  // Remove meeting
  activeMeetings.delete(code);

  res.json({ success: true, message: 'Meeting ended successfully' });
});

// WebSocket Signaling Server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  let userSession: {
    role: 'ADMIN' | 'STUDENT';
    meetingCode: string;
    studentId?: string;
    studentName?: string;
  } | null = null;

  ws.on('message', (data: string) => {
    try {
      const message = JSON.parse(data.toString());
      const { action } = message;

      if (action === 'admin:join-room') {
        const { code, token } = message;
        const meeting = activeMeetings.get(code);

        if (!meeting || !meeting.isActive) {
          ws.send(JSON.stringify({ action: 'error', message: 'Meeting does not exist or has ended' }));
          return;
        }

        if (meeting.adminToken !== token) {
          ws.send(JSON.stringify({ action: 'error', message: 'Admin authentication mismatch' }));
          return;
        }

        meeting.adminWs = ws;
        userSession = { role: 'ADMIN', meetingCode: code };

        // Send confirmation and current student list
        const studentList = Array.from(meeting.students.values()).map((s) => ({
          id: s.id,
          name: s.name,
          joinedAt: s.joinedAt,
          cameraAllowed: s.cameraAllowed,
          micAllowed: s.micAllowed,
          cameraActive: s.cameraActive,
          micActive: s.micActive,
          connectionStatus: s.connectionStatus,
        }));

        ws.send(
          JSON.stringify({
            action: 'admin:joined',
            code,
            students: studentList,
            mediaState: meeting.mediaState,
          })
        );
      } else if (action === 'student:join-room') {
        const { code, studentName, studentId } = message;
        const meeting = activeMeetings.get(code);

        if (!meeting || !meeting.isActive) {
          ws.send(JSON.stringify({ action: 'room:invalid-code', message: 'Meeting code is invalid or class has ended.' }));
          return;
        }

        userSession = {
          role: 'STUDENT',
          meetingCode: code,
          studentId,
          studentName: studentName || 'Student Participant',
        };

        const newStudent: StudentRecord = {
          id: studentId,
          name: studentName || 'Student Participant',
          ws,
          joinedAt: Date.now(),
          cameraAllowed: false, // By default, every Student joins with camera permission Denied
          micAllowed: false,    // By default, every Student joins with mic permission Denied
          cameraActive: false,  // By default, Camera OFF
          micActive: false,     // By default, Microphone OFF
          connectionStatus: 'connected',
        };

        meeting.students.set(studentId, newStudent);

        // Notify student of success + current Admin media state + initial permissions
        ws.send(
          JSON.stringify({
            action: 'student:joined',
            code,
            meetingName: meeting.name,
            adminName: meeting.adminName,
            mediaState: meeting.mediaState,
            activeStudentsCount: meeting.students.size,
            permissions: {
              cameraAllowed: false,
              micAllowed: false,
              cameraActive: false,
              micActive: false,
            },
          })
        );

        // Notify Admin that student joined so Admin can update Students Panel & create WebRTC peer
        if (meeting.adminWs && meeting.adminWs.readyState === WebSocket.OPEN) {
          meeting.adminWs.send(
            JSON.stringify({
              action: 'student:joined',
              student: {
                id: newStudent.id,
                name: newStudent.name,
                joinedAt: newStudent.joinedAt,
                cameraAllowed: newStudent.cameraAllowed,
                micAllowed: newStudent.micAllowed,
                cameraActive: newStudent.cameraActive,
                micActive: newStudent.micActive,
                connectionStatus: newStudent.connectionStatus,
              },
              studentId: newStudent.id,
              studentName: newStudent.name,
              activeStudentsCount: meeting.students.size,
            })
          );
        }

        // Broadcast updated student count to all students
        const countPayload = JSON.stringify({
          action: 'room:student-count',
          activeStudentsCount: meeting.students.size,
        });
        meeting.students.forEach((s) => {
          if (s.ws.readyState === WebSocket.OPEN) {
            s.ws.send(countPayload);
          }
        });
      } else if (action === 'admin:set-student-permission') {
        // STRICT SERVER-SIDE VERIFICATION: Only authenticated Admin can grant or revoke student permissions
        if (!userSession || userSession.role !== 'ADMIN') {
          console.warn('Unauthorized attempt to set student permission');
          return;
        }
        const meeting = activeMeetings.get(userSession.meetingCode);
        if (!meeting) return;

        const { targetStudentId, permissionType, allowed } = message;
        const student = meeting.students.get(targetStudentId);
        if (!student) return;

        const isAllowed = Boolean(allowed);

        if (permissionType === 'camera') {
          student.cameraAllowed = isAllowed;
          // When Admin removes camera permission, immediately stop camera state
          if (!isAllowed) {
            student.cameraActive = false;
          }
        } else if (permissionType === 'microphone') {
          student.micAllowed = isAllowed;
          // When Admin removes mic permission, immediately stop mic state
          if (!isAllowed) {
            student.micActive = false;
          }
        }

        // 1. Send immediate real-time notification to the target Student
        if (student.ws.readyState === WebSocket.OPEN) {
          if (isAllowed) {
            student.ws.send(
              JSON.stringify({
                action: 'student:permission-granted',
                permissionType,
                allowed: true,
                message:
                  permissionType === 'camera'
                    ? 'The Admin has allowed you to use your camera.'
                    : 'The Admin has allowed you to use your microphone.',
              })
            );
          } else {
            student.ws.send(
              JSON.stringify({
                action: 'student:permission-revoked',
                permissionType,
                allowed: false,
                message:
                  permissionType === 'camera'
                    ? 'The Admin has removed your camera permission.'
                    : 'The Admin has removed your microphone permission.',
              })
            );
          }
        }

        // 2. Synchronize updated student record with the Admin dashboard
        const updatedStudentPayload = {
          id: student.id,
          name: student.name,
          joinedAt: student.joinedAt,
          cameraAllowed: student.cameraAllowed,
          micAllowed: student.micAllowed,
          cameraActive: student.cameraActive,
          micActive: student.micActive,
          connectionStatus: student.connectionStatus,
        };

        if (meeting.adminWs && meeting.adminWs.readyState === WebSocket.OPEN) {
          meeting.adminWs.send(
            JSON.stringify({
              action: 'student:permission-updated',
              student: updatedStudentPayload,
            })
          );
        }
      } else if (action === 'student:update-media-state') {
        // STRICT SERVER-SIDE VERIFICATION:
        // A student cannot activate camera or mic unless the Admin has explicitly granted permission!
        if (!userSession || userSession.role !== 'STUDENT' || !userSession.studentId) return;
        const meeting = activeMeetings.get(userSession.meetingCode);
        if (!meeting) return;

        const student = meeting.students.get(userSession.studentId);
        if (!student) return;

        const { cameraActive, micActive } = message;

        // Verify camera permission
        if (cameraActive !== undefined) {
          if (!student.cameraAllowed && cameraActive) {
            student.cameraActive = false;
            student.ws.send(
              JSON.stringify({
                action: 'student:permission-error',
                error: 'Camera permission has not been granted by the Admin.',
              })
            );
          } else {
            student.cameraActive = Boolean(cameraActive);
          }
        }

        // Verify microphone permission
        if (micActive !== undefined) {
          if (!student.micAllowed && micActive) {
            student.micActive = false;
            student.ws.send(
              JSON.stringify({
                action: 'student:permission-error',
                error: 'Microphone permission has not been granted by the Admin.',
              })
            );
          } else {
            student.micActive = Boolean(micActive);
          }
        }

        // Notify Admin of student's active media status
        if (meeting.adminWs && meeting.adminWs.readyState === WebSocket.OPEN) {
          meeting.adminWs.send(
            JSON.stringify({
              action: 'student:media-state-updated',
              studentId: student.id,
              cameraActive: student.cameraActive,
              micActive: student.micActive,
            })
          );
        }
      } else if (action === 'webrtc:offer') {
        // Admin -> Student
        const { targetStudentId, sdp } = message;
        if (!userSession || userSession.role !== 'ADMIN') return;
        const meeting = activeMeetings.get(userSession.meetingCode);
        if (!meeting) return;

        const student = meeting.students.get(targetStudentId);
        if (student && student.ws.readyState === WebSocket.OPEN) {
          student.ws.send(
            JSON.stringify({
              action: 'webrtc:offer',
              sdp,
            })
          );
        }
      } else if (action === 'webrtc:answer') {
        // Student -> Admin
        const { sdp } = message;
        if (!userSession || userSession.role !== 'STUDENT') return;
        const meeting = activeMeetings.get(userSession.meetingCode);
        if (!meeting) return;

        if (meeting.adminWs && meeting.adminWs.readyState === WebSocket.OPEN) {
          meeting.adminWs.send(
            JSON.stringify({
              action: 'webrtc:answer',
              studentId: userSession.studentId,
              sdp,
            })
          );
        }
      } else if (action === 'webrtc:ice-candidate') {
        if (!userSession) return;
        const meeting = activeMeetings.get(userSession.meetingCode);
        if (!meeting) return;

        if (userSession.role === 'ADMIN') {
          // Admin -> Student
          const { targetStudentId, candidate } = message;
          const student = meeting.students.get(targetStudentId);
          if (student && student.ws.readyState === WebSocket.OPEN) {
            student.ws.send(
              JSON.stringify({
                action: 'webrtc:ice-candidate',
                candidate,
              })
            );
          }
        } else if (userSession.role === 'STUDENT') {
          // Student -> Admin
          const { candidate } = message;
          if (meeting.adminWs && meeting.adminWs.readyState === WebSocket.OPEN) {
            meeting.adminWs.send(
              JSON.stringify({
                action: 'webrtc:ice-candidate',
                studentId: userSession.studentId,
                candidate,
              })
            );
          }
        }
      } else if (action === 'admin:media-state') {
        // Only Admin can change media state
        if (!userSession || userSession.role !== 'ADMIN') return;
        const meeting = activeMeetings.get(userSession.meetingCode);
        if (!meeting) return;

        meeting.mediaState = {
          ...meeting.mediaState,
          ...message.mediaState,
        };

        const statePayload = JSON.stringify({
          action: 'room:media-state',
          mediaState: meeting.mediaState,
        });

        meeting.students.forEach((student) => {
          if (student.ws.readyState === WebSocket.OPEN) {
            student.ws.send(statePayload);
          }
        });
      } else if (action === 'student:leave') {
        if (userSession && userSession.role === 'STUDENT' && userSession.studentId) {
          const meeting = activeMeetings.get(userSession.meetingCode);
          if (meeting) {
            meeting.students.delete(userSession.studentId);
            if (meeting.adminWs && meeting.adminWs.readyState === WebSocket.OPEN) {
              meeting.adminWs.send(
                JSON.stringify({
                  action: 'student:left',
                  studentId: userSession.studentId,
                  activeStudentsCount: meeting.students.size,
                })
              );
            }
          }
        }
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    if (userSession) {
      const meeting = activeMeetings.get(userSession.meetingCode);
      if (meeting) {
        if (userSession.role === 'ADMIN') {
          meeting.adminWs = null;
        } else if (userSession.role === 'STUDENT' && userSession.studentId) {
          meeting.students.delete(userSession.studentId);
          if (meeting.adminWs && meeting.adminWs.readyState === WebSocket.OPEN) {
            meeting.adminWs.send(
              JSON.stringify({
                action: 'student:left',
                studentId: userSession.studentId,
                activeStudentsCount: meeting.students.size,
              })
            );
          }
        }
      }
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Blueflmame Meeting server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
