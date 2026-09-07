import React, { useState, useEffect } from 'react';
import { PageView, Meeting, AdminAuthSession, StudentSession } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { CreateMeetingModal } from './components/CreateMeetingModal';
import { AdminLiveMeeting } from './components/AdminLiveMeeting';
import { StudentJoin } from './components/StudentJoin';
import { StudentLiveClassroom } from './components/StudentLiveClassroom';
import { InvalidCodePage } from './components/InvalidCodePage';
import { MeetingEndedPage } from './components/MeetingEndedPage';
import { ConnectionErrorPage } from './components/ConnectionErrorPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('home');
  const [adminSession, setAdminSession] = useState<AdminAuthSession | null>(() => {
    try {
      const saved = sessionStorage.getItem('bfm_admin_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [studentSession, setStudentSession] = useState<StudentSession | null>(null);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Error / Ended state storage
  const [invalidCodeAttempt, setInvalidCodeAttempt] = useState<{ code: string; reason?: string }>({
    code: '',
    reason: '',
  });
  const [meetingEndedReason, setMeetingEndedReason] = useState<string>('The instructor ended the session.');
  const [connectionErrorMessage, setConnectionErrorMessage] = useState<string>('');
  const [prefillJoinCode, setPrefillJoinCode] = useState<string>('');

  // Save admin session to sessionStorage for persistence on refresh
  const handleAdminLoginSuccess = (session: AdminAuthSession) => {
    setAdminSession(session);
    try {
      sessionStorage.setItem('bfm_admin_session', JSON.stringify(session));
    } catch (e) {
      console.warn(e);
    }
    setCurrentPage('admin-dashboard');
  };

  const handleAdminLogout = () => {
    setAdminSession(null);
    setActiveMeeting(null);
    try {
      sessionStorage.removeItem('bfm_admin_session');
    } catch (e) {
      console.warn(e);
    }
    setCurrentPage('home');
  };

  // End meeting handler
  const handleEndMeeting = async (code: string) => {
    if (!adminSession) return;
    try {
      await fetch('/api/meetings/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminSession.token}`,
        },
        body: JSON.stringify({ code }),
      });
    } catch (e) {
      console.warn('Error ending meeting:', e);
    }
    setActiveMeeting(null);
    setCurrentPage('admin-dashboard');
  };

  // Student Handlers
  const handleStudentJoinSuccess = (session: StudentSession) => {
    setStudentSession(session);
    setCurrentPage('student-live');
  };

  const handleInvalidCode = (code: string, reason?: string) => {
    setInvalidCodeAttempt({ code, reason });
    setCurrentPage('invalid-code');
  };

  const handleMeetingEnded = (reason?: string) => {
    if (reason) setMeetingEndedReason(reason);
    setStudentSession(null);
    setCurrentPage('meeting-ended');
  };

  const handleConnectionError = (error: string) => {
    setConnectionErrorMessage(error);
    setCurrentPage('connection-error');
  };

  // Protected Routes Guard
  // Student cannot access Admin Dashboard or Live Admin room
  useEffect(() => {
    if ((currentPage === 'admin-dashboard' || currentPage === 'admin-live' || currentPage === 'create-meeting') && !adminSession) {
      setCurrentPage('admin-login');
    }
    if (currentPage === 'student-live' && !studentSession) {
      setCurrentPage('student-join');
    }
  }, [currentPage, adminSession, studentSession]);

  return (
    <div id="blueflmame-app-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        adminSession={adminSession}
        onAdminLogout={handleAdminLogout}
        activeMeetingCode={activeMeeting?.code}
        isMeetingActive={!!activeMeeting}
      />

      <div className="flex-1">
        {/* Page 1: Home Landing Page */}
        {currentPage === 'home' && (
          <LandingPage
            onNavigate={setCurrentPage}
            onQuickJoin={(code) => {
              setPrefillJoinCode(code);
              setCurrentPage('student-join');
            }}
          />
        )}

        {/* Page 2: Admin Login */}
        {currentPage === 'admin-login' && (
          <AdminLogin
            onLoginSuccess={handleAdminLoginSuccess}
            onNavigate={setCurrentPage}
          />
        )}

        {/* Page 3: Admin Dashboard */}
        {currentPage === 'admin-dashboard' && adminSession && (
          <AdminDashboard
            adminSession={adminSession}
            onNavigate={setCurrentPage}
            activeMeeting={activeMeeting}
            onStartMeeting={(m) => {
              setActiveMeeting(m);
              setCurrentPage('admin-live');
            }}
            onEndMeeting={handleEndMeeting}
          />
        )}

        {/* Page 4: Create Meeting Modal / Flow */}
        {currentPage === 'create-meeting' && adminSession && (
          <CreateMeetingModal
            isOpen={true}
            onClose={() => setCurrentPage('admin-dashboard')}
            onStartLive={(m) => {
              setActiveMeeting(m);
              setCurrentPage('admin-live');
            }}
            adminToken={adminSession.token}
          />
        )}

        {/* Page 5: Admin Live Meeting */}
        {currentPage === 'admin-live' && adminSession && activeMeeting && (
          <AdminLiveMeeting
            meeting={activeMeeting}
            adminToken={adminSession.token}
            onEndMeeting={handleEndMeeting}
            onLeaveRoom={() => setCurrentPage('admin-dashboard')}
          />
        )}

        {/* Page 6: Student Join Meeting */}
        {currentPage === 'student-join' && (
          <StudentJoin
            onJoinSuccess={handleStudentJoinSuccess}
            onInvalidCode={handleInvalidCode}
            onNavigate={setCurrentPage}
            prefillCode={prefillJoinCode}
          />
        )}

        {/* Page 7: Student Live Classroom */}
        {currentPage === 'student-live' && studentSession && (
          <StudentLiveClassroom
            session={studentSession}
            onLeaveMeeting={() => {
              setStudentSession(null);
              setCurrentPage('home');
            }}
            onMeetingEnded={handleMeetingEnded}
            onConnectionError={handleConnectionError}
            onInvalidCode={(code) => handleInvalidCode(code)}
          />
        )}

        {/* Page 8: Invalid Meeting Code */}
        {currentPage === 'invalid-code' && (
          <InvalidCodePage
            attemptedCode={invalidCodeAttempt.code}
            reason={invalidCodeAttempt.reason}
            onRetry={() => {
              setPrefillJoinCode(invalidCodeAttempt.code);
              setCurrentPage('student-join');
            }}
            onNavigate={setCurrentPage}
          />
        )}

        {/* Page 9: Meeting Ended */}
        {currentPage === 'meeting-ended' && (
          <MeetingEndedPage
            reason={meetingEndedReason}
            onNavigate={setCurrentPage}
          />
        )}

        {/* Page 10: Connection Error */}
        {currentPage === 'connection-error' && (
          <ConnectionErrorPage
            errorMessage={connectionErrorMessage}
            onRetry={() => {
              if (studentSession) {
                setCurrentPage('student-live');
              } else if (activeMeeting) {
                setCurrentPage('admin-live');
              } else {
                setCurrentPage('home');
              }
            }}
            onNavigate={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
