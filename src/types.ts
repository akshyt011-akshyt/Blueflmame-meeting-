export type UserRole = 'ADMIN' | 'STUDENT';

export interface Meeting {
  code: string; // 6-digit code
  name: string;
  adminName: string;
  createdAt: number;
  isActive: boolean;
  activeStudentsCount: number;
}

export interface StudentParticipant {
  id: string;
  name: string;
  joinedAt: number;
  cameraAllowed: boolean;
  micAllowed: boolean;
  cameraActive: boolean;
  micActive: boolean;
  connectionStatus: 'connected' | 'reconnecting';
}

export interface StudentPermissions {
  cameraAllowed: boolean;
  micAllowed: boolean;
  cameraActive: boolean;
  micActive: boolean;
}

export interface LearningMaterial {
  id: string;
  title: string;
  type: 'image' | 'diagram' | 'formula' | 'slide' | 'custom';
  url: string;
  description?: string;
}

export interface AdminMediaState {
  cameraActive: boolean;
  micActive: boolean;
  isScreenSharing: boolean;
  activeMaterial: LearningMaterial | null;
}

export type PageView =
  | 'home'
  | 'admin-login'
  | 'admin-dashboard'
  | 'create-meeting'
  | 'admin-live'
  | 'student-join'
  | 'student-live'
  | 'invalid-code'
  | 'meeting-ended'
  | 'connection-error';

export interface AdminAuthSession {
  token: string;
  adminId: string;
  username: string;
  name: string;
}

export interface StudentSession {
  studentId: string;
  name: string;
  meetingCode: string;
}
