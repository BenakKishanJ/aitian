/**
 * Collection names for Firestore
 * Centralized to avoid typos and enable easy refactoring
 */
export const COLLECTIONS = {
  USERS: 'users',
  DEPARTMENTS: 'departments',
  COURSES: 'courses',
  COURSE_INSTANCES: 'courseInstances',
  ENROLLMENTS: 'enrollments',
  CALENDAR_EVENTS: 'calendarEvents',
  ATTENDANCE_SESSIONS: 'attendanceSessions',
  ATTENDANCE_RECORDS: 'attendanceRecords',
  MATERIALS: 'materials',
  ASSIGNMENTS: 'assignments',
  SUBMISSIONS: 'submissions',
  MARKS: 'marks',
  DISCUSSIONS: 'discussions',
  DISCUSSION_REPLIES: 'discussionReplies',
  NEWS_POSTS: 'newsPosts',
  PARENT_LINKS: 'parentLinks',
  COURSE_REQUESTS: 'courseRequests',
  ELECTIVE_GROUPS: 'electiveGroups',
  CONFIG: 'config',
} as const;

/**
 * User roles
 */
export const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  PARENT: 'parent',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Department codes and metadata
 * This is the canonical source of truth for departments
 * IDs are lowercase for Firestore document IDs
 * Codes are uppercase for display
 */
export const DEPARTMENTS = [
  { id: 'cs', code: 'CSE', name: 'Computer Science and Engineering' },
  { id: 'ece', code: 'ECE', name: 'Electronics and Communication Engineering' },
  { id: 'eee', code: 'EEE', name: 'Electrical and Electronics Engineering' },
  { id: 'mech', code: 'MECH', name: 'Mechanical Engineering' },
  { id: 'civil', code: 'CIVIL', name: 'Civil Engineering' },
  { id: 'ise', code: 'ISE', name: 'Information Science and Engineering' },
  { id: 'aiml', code: 'AIML', name: 'Artificial Intelligence and Machine Learning' },
  { id: 'iot', code: 'IOT', name: 'Internet of Things' },
] as const;

export type DepartmentId = (typeof DEPARTMENTS)[number]['id'];
export type DepartmentCode = (typeof DEPARTMENTS)[number]['code'];

/**
 * Get department by ID
 */
export function getDepartmentById(id: string) {
  return DEPARTMENTS.find((dept) => dept.id === id.toLowerCase());
}

/**
 * Get department by code
 */
export function getDepartmentByCode(code: string) {
  return DEPARTMENTS.find((dept) => dept.code === code.toUpperCase());
}

/**
 * Get department name by ID
 */
export function getDepartmentNameById(id: string): string {
  const dept = getDepartmentById(id);
  return dept?.name ?? id;
}

/**
 * Get department code by ID
 */
export function getDepartmentCodeById(id: string): string {
  const dept = getDepartmentById(id);
  return dept?.code ?? id.toUpperCase();
}

/**
 * Event types for calendar
 */
export const EVENT_TYPES = {
  CLASS: 'class',
  EXAM: 'exam',
  ASSIGNMENT: 'assignment',
  PERSONAL: 'personal',
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

/**
 * Material types
 */
export const MATERIAL_TYPES = {
  PDF: 'pdf',
  VIDEO: 'video',
  LINK: 'link',
  DOCUMENT: 'document',
  OTHER: 'other',
} as const;

export type MaterialType = (typeof MATERIAL_TYPES)[keyof typeof MATERIAL_TYPES];

/**
 * Assignment statuses
 */
export const ASSIGNMENT_STATUSES = {
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
  OVERDUE: 'overdue',
} as const;

export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[keyof typeof ASSIGNMENT_STATUSES];

/**
 * Audience types for news posts
 */
export const AUDIENCE_TYPES = {
  ALL: 'all',
  DEPARTMENT: 'department',
  SEMESTER: 'semester',
  DEPARTMENT_SEMESTER: 'departmentSemester',
} as const;

export type AudienceType = (typeof AUDIENCE_TYPES)[keyof typeof AUDIENCE_TYPES];

/**
 * Recurrence frequencies
 */
export const RECURRENCE_FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
} as const;

export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[keyof typeof RECURRENCE_FREQUENCIES];

/**
 * Attendance statuses
 */
export const ATTENDANCE_STATUSES = {
  PRESENT: 'present',
  ABSENT: 'absent',
} as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[keyof typeof ATTENDANCE_STATUSES];

/**
 * Updated Grade letters based on new grading scale
 * O: 90-100 (9-10), A+: 80-89 (8-9), A: 70-79 (7-8), B+: 60-69 (6-7), B: 50-59 (5-6), F: <50
 */
export const GRADES = {
  O: 'O',
  A_PLUS: 'A+',
  A: 'A',
  B_PLUS: 'B+',
  B: 'B',
  F: 'F',
} as const;

export type Grade = (typeof GRADES)[keyof typeof GRADES];

/**
 * Enrollment types
 */
export const ENROLLMENT_TYPES = {
  CORE: 'core',
  ELECTIVE: 'elective',
} as const;

export type EnrollmentType = (typeof ENROLLMENT_TYPES)[keyof typeof ENROLLMENT_TYPES];

/**
 * Link statuses for parent-student links
 */
export const LINK_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REVOKED: 'revoked',
} as const;

export type LinkStatus = (typeof LINK_STATUSES)[keyof typeof LINK_STATUSES];

/**
 * Enrollment statuses for student course enrollments
 */
export const ENROLLMENT_STATUSES = {
  AUTO_ENROLLED: 'auto-enrolled',
  ELECTIVE_PENDING: 'elective-pending',
  ELECTIVE_ENROLLED: 'elective-enrolled',
  LOCKED: 'locked',
} as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[keyof typeof ENROLLMENT_STATUSES];

/**
 * Course request statuses for teacher course requests
 */
export const COURSE_REQUEST_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type CourseRequestStatus = (typeof COURSE_REQUEST_STATUSES)[keyof typeof COURSE_REQUEST_STATUSES];

/**
 * Promotion statuses for students
 */
export const PROMOTION_STATUSES = {
  CURRENT: 'current',
  PROMOTED: 'promoted',
  PENDING: 'pending',
} as const;

export type PromotionStatus = (typeof PROMOTION_STATUSES)[keyof typeof PROMOTION_STATUSES];
