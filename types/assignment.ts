import { Timestamp } from 'firebase/firestore';
import { AssignmentStatus } from './constants';

/**
 * Assignment - created by teachers
 */
export interface Assignment {
  id: string;
  courseInstanceId: string;
  title: string;
  description: string;
  dueDate: Timestamp;
  maxScore?: number;
  attachmentUrl?: string;
  attachmentName?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Assignment with status (for student view)
 */
export interface AssignmentWithStatus extends Assignment {
  submissionStatus: AssignmentStatus;
  submission?: Submission;
}

/**
 * Student submission for an assignment
 */
export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  submissionUrl?: string;
  submissionText?: string;
  submittedAt: Timestamp;
  grade?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: Timestamp;
}

/**
 * Submission with assignment details (for teacher grading view)
 */
export interface SubmissionWithAssignment extends Submission {
  assignment?: Assignment;
}

/**
 * Assignment filter options
 */
export interface AssignmentFilterOptions {
  courseInstanceId?: string;
  status?: AssignmentStatus;
  searchQuery?: string;
}

/**
 * Assignment creation data
 */
export interface AssignmentCreateData {
  courseInstanceId: string;
  title: string;
  description: string;
  dueDate: Timestamp;
  maxScore?: number;
  attachmentUrl?: string;
  attachmentName?: string;
}

/**
 * Submission creation data
 */
export interface SubmissionCreateData {
  assignmentId: string;
  submissionUrl?: string;
  submissionText?: string;
}

/**
 * Grade submission data
 */
export interface GradeSubmissionData {
  submissionId: string;
  grade: number;
  feedback?: string;
}

/**
 * Upcoming assignment (for home screen)
 */
export interface UpcomingAssignment {
  id: string;
  title: string;
  courseName: string;
  courseInstanceId: string;
  dueDate: Timestamp;
  isOverdue: boolean;
  daysRemaining: number;
  submissionStatus: AssignmentStatus;
}
