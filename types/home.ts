import { Timestamp } from 'firebase/firestore';
import { Role, DepartmentId } from './constants';

/**
 * Home screen statistics (role-based)
 */
export interface HomeStats {
  // Student stats
  attendancePercentage?: number;
  pendingAssignments?: number;
  enrolledCourses?: number;
  classesToday?: number;

  // Teacher stats
  classesTodayCount?: number;
  pendingGradings?: number;
  totalStudents?: number;
  activeCourses?: number;

  // Admin stats
  totalStudentsCount?: number;
  totalTeachersCount?: number;
  totalCoursesCount?: number;
  activeUsersCount?: number;

  // Parent stats (child's data)
  childAttendancePercentage?: number;
  childPendingAssignments?: number;
  childClassesToday?: number;
  childPerformance?: 'excellent' | 'good' | 'average' | 'needs-improvement';
}

/**
 * Combined home screen data
 */
export interface HomeData {
  userName: string;
  role: Role;
  greeting: string;
  currentDate: string;
  stats: HomeStats;
  todaysClasses: import('./calendar').TodayClass[];
  upcomingAssignments: import('./assignment').UpcomingAssignment[];
  recentAnnouncements: import('./news').RecentAnnouncement[];
  hasLowAttendance: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Quick action button data
 */
export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  route: string;
  color: string;
}

/**
 * Role-specific quick actions
 */
export interface QuickActionsByRole {
  student: QuickAction[];
  teacher: QuickAction[];
  parent: QuickAction[];
  admin: QuickAction[];
}

/**
 * Notification badge counts
 */
export interface NotificationCounts {
  total: number;
  assignments: number;
  announcements: number;
  messages: number;
}
