import { Timestamp } from 'firebase/firestore';
import { DepartmentId, DepartmentCode } from './constants';

/**
 * Department document interface
 */
export interface Department {
  id: DepartmentId;
  name: string;
  code: DepartmentCode;
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Department with metadata (for UI display)
 */
export interface DepartmentWithMetadata extends Department {
  courseCount?: number;
  studentCount?: number;
  teacherCount?: number;
}

/**
 * Department filter options
 */
export interface DepartmentFilterOptions {
  includeInactive?: boolean;
  searchQuery?: string;
}

/**
 * Department creation data
 */
export interface DepartmentCreateData {
  name: string;
  code: DepartmentCode;
  description?: string;
}

/**
 * Department update data
 */
export interface DepartmentUpdateData {
  name?: string;
  code?: DepartmentCode;
  description?: string;
  isActive?: boolean;
}
