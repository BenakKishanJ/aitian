import { Timestamp } from 'firebase/firestore';
import { AudienceType, Role } from './constants';

/**
 * Media attachment for posts
 * Supports both images and documents
 */
export interface MediaAttachment {
  /** Download URL from Firebase Storage */
  url: string;
  /** Storage path for deletion/management */
  storagePath: string;
  /** Original filename */
  fileName: string;
  /** MIME type of the file */
  mimeType: string;
  /** File size in bytes */
  fileSize: number;
  /** Display name (optional, defaults to fileName) */
  displayName?: string;
}

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
  /** Legacy field - kept for backward compatibility */
  mediaUrls?: string[];
  /** New rich media field with metadata */
  media?: MediaAttachment[];
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
  /** Whether post has any media */
  hasMedia?: boolean;
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
  /** Legacy field - kept for backward compatibility */
  mediaUrls?: string[];
  /** New rich media field with metadata */
  media?: MediaAttachment[];
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
  /** Legacy field - kept for backward compatibility */
  mediaUrls?: string[];
  /** New rich media field with metadata */
  media?: MediaAttachment[];
  isPinned?: boolean;
}
