import { Timestamp } from 'firebase/firestore';
import { AttendanceStatus } from './constants';

/**
 * Attendance session - represents a single class occurrence
 */
export interface AttendanceSession {
  id: string;
  calendarEventId?: string; // Optional link to calendar event
  courseInstanceId: string;
  title?: string;
  startedBy: string;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  isLocked: boolean;
  createdAt: Timestamp;
}

/**
 * Individual attendance record
 */
export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  studentName?: string;
  status: AttendanceStatus;
  markedBy: 'student' | 'teacher';
  markedAt: Timestamp;
}

/**
 * Attendance summary (for student view)
 */
export interface AttendanceSummary {
  courseInstanceId: string;
  courseName?: string;
  totalClasses: number;
  attendedClasses: number;
  absentClasses: number;
  percentage: number;
  status: 'good' | 'warning' | 'at-risk';
  requiredClassesToReach75?: number;
}

/**
 * Attendance session with records
 */
export interface AttendanceSessionWithRecords extends AttendanceSession {
  records: AttendanceRecord[];
  presentCount: number;
  absentCount: number;
}

/**
 * Attendance session creation data
 */
export interface AttendanceSessionCreateData {
  calendarEventId?: string;
  courseInstanceId: string;
  title?: string;
}

/**
 * Attendance record creation data
 */
export interface AttendanceRecordCreateData {
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  markedBy: 'student' | 'teacher';
}

/**
 * Daily attendance entry (for calendar view)
 */
export interface DailyAttendance {
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  sessionTitle?: string;
}
