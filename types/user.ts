import { Timestamp } from 'firebase/firestore';
import { Role, DepartmentId, LinkStatus } from './constants';

/**
 * Base user data interface
 * Core fields that all users have
 */
export interface BaseUserData {
  uid: string;
  email: string;
  name: string;
  role: Role;
  photoURL?: string | null;
  isActive: boolean;
  profileComplete: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Student-specific user data
 */
export interface StudentUserData extends BaseUserData {
  role: 'student';
  departmentId: DepartmentId;
  /** @deprecated Use departmentId instead - kept for backward compatibility */
  department?: string;
  semester: number;
  section: string;
  usn: string;
  batch: string;
  linkedParentIds?: string[];
}

/**
 * Teacher-specific user data
 */
export interface TeacherUserData extends BaseUserData {
  role: 'teacher';
  departmentId: DepartmentId;
  /** @deprecated Use departmentId instead - kept for backward compatibility */
  department?: string;
  teacherCode: string;
}

/**
 * Parent-specific user data
 */
export interface ParentUserData extends BaseUserData {
  role: 'parent';
  linkedStudentId?: string;
}

/**
 * Admin-specific user data
 */
export interface AdminUserData extends BaseUserData {
  role: 'admin';
}

/**
 * Union type for all user data variants
 */
export type UserData =
  | StudentUserData
  | TeacherUserData
  | ParentUserData
  | AdminUserData;

/**
 * Base user data with optional parent/student link fields
 * Used when you need to access linkedStudentId without type guards
 */
export interface UserDataWithLinks extends BaseUserData {
  linkedStudentId?: string;
  linkedParentIds?: string[];
}

/**
 * Type guard to check if user is a student
 */
export function isStudent(user: UserData): user is StudentUserData {
  return user.role === 'student';
}

/**
 * Type guard to check if user is a teacher
 */
export function isTeacher(user: UserData): user is TeacherUserData {
  return user.role === 'teacher';
}

/**
 * Type guard to check if user is a parent
 */
export function isParent(user: UserData): user is ParentUserData {
  return user.role === 'parent';
}

/**
 * Type guard to check if user is an admin
 */
export function isAdmin(user: UserData): user is AdminUserData {
  return user.role === 'admin';
}

/**
 * Auth state interface for hooks
 */
export interface AuthState {
  user: UserData | null;
  firebaseUser: import('firebase/auth').User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

/**
 * Auth context type
 */
export interface AuthContextType extends AuthState {
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

/**
 * Parent-student link interface
 */
export interface ParentLink {
  id: string;
  parentId: string;
  studentId: string;
  status: LinkStatus;
  requestedAt: Timestamp;
  approvedAt?: Timestamp | null;
  revokedAt?: Timestamp | null;
  requestedBy: 'parent' | 'student';
}

/**
 * Linked user info (for display in profile)
 */
export interface LinkedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  // For linked students
  departmentId?: DepartmentId;
  semester?: number;
  section?: string;
  usn?: string;
  // For linked parents
  linkedStudentId?: string;
}

/**
 * User creation data (for registration)
 */
export interface UserRegistrationData {
  email: string;
  name: string;
  role: Role;
  departmentId?: DepartmentId;
  semester?: number;
  section?: string;
  usn?: string;
  batch?: string;
  teacherCode?: string;
}
