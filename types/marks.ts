import { Timestamp } from 'firebase/firestore';
import { Grade } from './constants';

/**
 * Marks/grades for a student in a course
 */
export interface Marks {
  id: string;
  courseInstanceId: string;
  studentId: string;
  cie1: number;
  cie2: number;
  assignment: number;
  finalExam: number;
  total: number;
  grade: Grade;
  updatedBy: string;
  updatedAt: Timestamp;
  createdAt: Timestamp;
}

/**
 * Marks with grade boundaries
 */
export interface MarksWithDetails extends Marks {
  maxCie1?: number;
  maxCie2?: number;
  maxAssignment?: number;
  maxFinalExam?: number;
  maxTotal?: number;
}

/**
 * Individual grade component
 */
export interface GradeComponent {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  weight?: number;
}

/**
 * Student marks view (for display)
 */
export interface StudentMarksView {
  courseInstanceId: string;
  courseName?: string;
  courseCode?: string;
  components: GradeComponent[];
  total: number;
  maxTotal: number;
  percentage: number;
  grade: Grade;
}

/**
 * Marks creation/update data
 */
export interface MarksUpdateData {
  courseInstanceId: string;
  studentId: string;
  cie1?: number;
  cie2?: number;
  assignment?: number;
  finalExam?: number;
}

/**
 * Class statistics (for teacher view)
 */
export interface ClassStatistics {
  courseInstanceId: string;
  totalStudents: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  gradeDistribution: Record<Grade, number>;
}
