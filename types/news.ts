import { Timestamp } from 'firebase/firestore';
import { AudienceType, Role } from './constants';

/**
 * Target audience for a news post
 */
export interface TargetAudience {
  type: AudienceType;
  departmentId?: string;
  semester?: number;
}

/**
 * News post / announcement
 */
export interface NewsPost {
  id: string;
  title?: string;
  content: string;
  mediaUrls: string[];
  postedBy: string;
  authorName: string;
  authorRole: Role;
  isAnonymous: boolean;
  isPinned: boolean;
  targetAudience: TargetAudience;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * News post with author details
 */
export interface NewsPostWithAuthor extends NewsPost {
  authorPhotoURL?: string;
}

/**
 * Recent announcement (simplified for home screen)
 */
export interface RecentAnnouncement {
  id: string;
  title?: string;
  content: string;
  authorName: string;
  authorRole: Role;
  isPinned: boolean;
  createdAt: Timestamp;
  timeAgo: string;
}

/**
 * News filter options
 */
export interface NewsFilterOptions {
  pinnedOnly?: boolean;
  departmentId?: string;
  semester?: number;
}

/**
 * News post creation data
 */
export interface NewsPostCreateData {
  title?: string;
  content: string;
  mediaUrls?: string[];
  isAnonymous?: boolean;
  isPinned?: boolean;
  targetAudience: TargetAudience;
}

/**
 * News post update data
 */
export interface NewsPostUpdateData {
  title?: string;
  content?: string;
  mediaUrls?: string[];
  isPinned?: boolean;
}
