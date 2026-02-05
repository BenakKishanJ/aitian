import { Timestamp } from 'firebase/firestore';
import { DepartmentId, EnrollmentType } from './constants';

/**
 * Course metadata
 */
export interface CourseMetadata {
  labRequired?: boolean;
  examType?: 'theory' | 'practical' | 'theory-practical';
  syllabusUrl?: string;
  description?: string;
}

/**
 * Base course definition (template)
 * This is the abstract course that can be instantiated multiple times
 */
export interface Course {
  id: string;
  courseCode: string;
  name: string;
  departmentId: DepartmentId;
  semester: number;
  credits: number;
  isElective: boolean;
  metadata?: CourseMetadata;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Course instance - a specific running course
 * One course can have multiple instances (different sections, semesters, years)
 */
export interface CourseInstance {
  id: string;
  courseId: string;
  departmentId: DepartmentId;
  semester: number;
  section: string;
  teacherIds: string[];
  enrollmentType: EnrollmentType;
  isActive: boolean;
  academicYear?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Course instance with joined data
 * Used when fetching course with its details
 */
export interface CourseInstanceWithDetails extends CourseInstance {
  course?: Course;
  teacherNames?: string[];
  studentCount?: number;
  totalStudents?: number; // Alias for studentCount
  attendancePercentage?: number; // For student view
}

/**
 * Enrollment - student to course instance mapping
 */
export interface Enrollment {
  id: string;
  studentId: string;
  courseInstanceId: string;
  enrollmentType: EnrollmentType;
  enrolledAt: Timestamp;
}

/**
 * Course filter options
 */
export interface CourseFilterOptions {
  semester?: number | null;
  departmentId?: DepartmentId;
  section?: string;
  searchQuery?: string;
  includeInactive?: boolean;
}

/**
 * Course creation data
 */
export interface CourseCreateData {
  courseCode: string;
  name: string;
  departmentId: DepartmentId;
  semester: number;
  credits: number;
  isElective: boolean;
  metadata?: CourseMetadata;
}

/**
 * Course instance creation data
 */
export interface CourseInstanceCreateData {
  courseId: string;
  departmentId: DepartmentId;
  semester: number;
  section: string;
  teacherIds: string[];
  enrollmentType: EnrollmentType;
  academicYear?: string;
}

/**
 * Course statistics (for teacher/admin view)
 */
export interface CourseStatistics {
  totalStudents: number;
  averageAttendance: number;
  pendingAssignments: number;
  totalMaterials: number;
}
