import { Timestamp } from 'firebase/firestore';
import { MaterialType } from './constants';

/**
 * Course material
 */
export interface Material {
  id: string;
  courseInstanceId: string;
  title: string;
  type: MaterialType;
  url: string;
  description?: string;
  fileSize?: string;
  tags?: string[];
  uploadedBy: string;
  uploadedByName?: string;
  uploadedAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Material with course details
 */
export interface MaterialWithCourse extends Material {
  courseName?: string;
  courseCode?: string;
}

/**
 * Material filter options
 */
export interface MaterialFilterOptions {
  courseInstanceId?: string;
  type?: MaterialType;
  searchQuery?: string;
  tags?: string[];
}

/**
 * Material creation data
 */
export interface MaterialCreateData {
  courseInstanceId: string;
  title: string;
  type: MaterialType;
  url: string;
  description?: string;
  fileSize?: string;
  tags?: string[];
}

/**
 * Material update data
 */
export interface MaterialUpdateData {
  title?: string;
  description?: string;
  tags?: string[];
}

/**
 * Material metadata (for stats)
 */
export interface MaterialMetadata {
  type: MaterialType;
  count: number;
  totalSize?: string;
}
