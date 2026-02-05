import { Timestamp } from 'firebase/firestore';
import { EventType, RecurrenceFrequency } from './constants';

/**
 * Recurrence rule for repeating events
 */
export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  days?: string[]; // ['MON', 'WED', 'FRI'] for weekly
  until?: Timestamp; // End date for recurrence
  count?: number; // Number of occurrences
}

/**
 * Calendar event
 */
export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  description?: string;
  courseInstanceId?: string;
  courseName?: string;
  createdBy: string;
  startTime: Timestamp;
  endTime: Timestamp;
  location?: string;
  recurrenceRule?: RecurrenceRule;
  isAttendanceEnabled?: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Expanded event - individual occurrence of a recurring event
 */
export interface ExpandedEvent extends CalendarEvent {
  occurrenceId: string; // Unique ID for this specific occurrence
  isRecurring: boolean;
  originalEventId: string; // ID of the parent recurring event
}

/**
 * Today's class (for home screen)
 */
export interface TodayClass {
  id: string;
  title: string;
  courseName: string;
  startTime: Timestamp;
  endTime: Timestamp;
  location?: string;
  isNext: boolean;
  isPast: boolean;
  hasAttendance: boolean;
}

/**
 * Event filter options
 */
export interface EventFilterOptions {
  types?: EventType[];
  courseInstanceId?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Event creation data
 */
export interface EventCreateData {
  title: string;
  type: EventType;
  description?: string;
  courseInstanceId?: string;
  startTime: Timestamp;
  endTime: Timestamp;
  location?: string;
  recurrenceRule?: RecurrenceRule;
  isAttendanceEnabled?: boolean;
}

/**
 * Calendar view mode
 */
export type CalendarViewMode = 'month' | 'week' | 'day';

/**
 * Calendar event form data (for UI forms)
 */
export interface EventFormData {
  title: string;
  type: EventType;
  description?: string;
  courseInstanceId?: string;
  startDate: Date;
  startTime: Date;
  endDate: Date;
  endTime: Date;
  location?: string;
  isRecurring: boolean;
  recurrenceFrequency?: RecurrenceFrequency;
  recurrenceDays?: string[];
  recurrenceUntil?: Date;
  isAttendanceEnabled: boolean;
}
