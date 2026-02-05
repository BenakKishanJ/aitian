import { Timestamp } from 'firebase/firestore';

/**
 * Discussion thread
 */
export interface Discussion {
  id: string;
  courseInstanceId: string;
  title: string;
  content: string;
  createdBy: string;
  createdByName?: string;
  createdByRole?: string;
  isPinned?: boolean;
  replyCount: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Discussion reply
 */
export interface DiscussionReply {
  id: string;
  threadId: string;
  content: string;
  createdBy: string;
  createdByName?: string;
  createdByRole?: string;
  isTeacherReply: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Discussion thread with replies
 */
export interface DiscussionWithReplies extends Discussion {
  replies: DiscussionReply[];
}

/**
 * Discussion creation data
 */
export interface DiscussionCreateData {
  courseInstanceId: string;
  title: string;
  content: string;
}

/**
 * Discussion reply creation data
 */
export interface DiscussionReplyCreateData {
  threadId: string;
  content: string;
}

/**
 * Discussion filter options
 */
export interface DiscussionFilterOptions {
  courseInstanceId?: string;
  searchQuery?: string;
  pinnedOnly?: boolean;
}
