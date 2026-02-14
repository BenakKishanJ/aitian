import { Timestamp } from 'firebase/firestore';
import { DepartmentId, EnrollmentType, EnrollmentStatus, CourseType, ElectiveSlotType } from './constants';

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
  courseType: CourseType;
  metadata?: CourseMetadata;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  
  // Legacy field - deprecated, use courseType instead
  isElective?: boolean;
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
  section?: string;  // Optional for multi-section courses
  teacherIds: string[];
  isActive: boolean;
  academicYear?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  
  // Elective slot reference (for elective courses)
  electiveSlotId?: string;
  
  // Legacy fields - deprecated
  enrollmentType?: EnrollmentType;
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
 * Now only used for elective selections
 */
export interface Enrollment {
  id: string;
  studentId: string;
  courseInstanceId: string;
  enrollmentType: EnrollmentType;
  enrollmentStatus: EnrollmentStatus;
  electiveGroupId?: string;
  selectedElectiveCourseId?: string;
  enrolledAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Elective Slot - represents an elective placeholder (e.g., 22XXT705X)
 * Students see this slot and select from available courses
 */
export interface ElectiveSlot {
  id: string;
  slotCode: string;             // e.g., "22XXT705X" (open) or "22CST7051" (professional)
  name: string;                 // Display name
  slotType: ElectiveSlotType;   // 'open' or 'professional'
  
  // Primary assignment (where slot was created)
  departmentId: DepartmentId;
  semester: number;
  
  // Multi-department assignment (for open electives)
  assignedDepartments: DepartmentId[];
  
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Elective Slot Mapping - links slots to available courses
 * Students can only select from these courses for this slot
 */
export interface ElectiveSlotMapping {
  id: string;
  slotId: string;
  availableCourseIds: string[];
  academicYear: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Elective Selection - student's choice for an elective slot
 */
export interface ElectiveSelection {
  id: string;
  studentId: string;
  slotId: string;
  selectedCourseId: string;
  selectedAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Elective Slot Assignment - tracks which department/section/semester combos a slot is assigned to
 * This determines which students see the elective slot
 */
export interface ElectiveSlotAssignment {
  id: string;
  slotId: string;
  departmentId: DepartmentId;
  semester: number;
  sections: string[];  // e.g., ['A', 'B', 'C', 'D']
  academicYear: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Legacy: Elective Group - groups elective courses together
 * @deprecated Use ElectiveSlot instead
 */
export interface ElectiveGroup {
  id: string;
  name: string;
  departmentId: DepartmentId;
  semester: number;
  courseIds: string[];
  description?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Course Request - teacher request to teach a course
 */
export interface CourseRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  courseName: string;
  departmentId: DepartmentId;
  semester: number;
  section: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  rejectionReason?: string;
  createdCourseInstanceId?: string;
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
  courseType?: CourseType;
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
  courseType: CourseType;
  metadata?: CourseMetadata;
  
  // Legacy
  isElective?: boolean;
}

/**
 * Course instance creation data
 */
export interface CourseInstanceCreateData {
  courseId: string;
  departmentId: DepartmentId;
  semester: number;
  section?: string;
  teacherIds: string[];
  academicYear?: string;
  electiveSlotId?: string;
  
  // Legacy
  enrollmentType?: EnrollmentType;
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

/**
 * Student course view - combines instance, course, and enrollment data
 */
export interface StudentCourseView {
  instance: CourseInstanceWithDetails;
  enrollment?: Enrollment;
  electiveSelection?: ElectiveSelection;
  isElectiveSlot: boolean;
  selectionStatus: 'not_selected' | 'selected' | 'not_applicable';
  availableCourseIds?: string[]; // For elective slots, the courses students can choose from
}

/**
 * Teacher course view - instance with course details
 */
export interface TeacherCourseView {
  instance: CourseInstanceWithDetails;
  studentCount: number;
  pendingAssignments: number;
  nextClass?: string;
}
