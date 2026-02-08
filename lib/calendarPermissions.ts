/**
 * Calendar permissions utility
 * Defines what event types each role can create/view
 */

import { Role, EventType, ROLES, EVENT_TYPES } from '@/types/constants';

/**
 * Check if a role can create a specific event type
 */
export function canCreateEventType(role: Role, eventType: EventType): boolean {
  switch (role) {
    case ROLES.ADMIN:
      // Admin can create all event types
      return true;
    
    case ROLES.TEACHER:
      // Teachers can create: class, assignment, personal
      // Teachers CANNOT create: exam
      return (
        eventType === EVENT_TYPES.CLASS ||
        eventType === EVENT_TYPES.ASSIGNMENT ||
        eventType === EVENT_TYPES.PERSONAL
      );
    
    case ROLES.STUDENT:
      // Students can only create personal events
      return eventType === EVENT_TYPES.PERSONAL;
    
    case ROLES.PARENT:
      // Parents cannot create any events
      return false;
    
    default:
      return false;
  }
}

/**
 * Get available event types for a role
 */
export function getAvailableEventTypes(role: Role): EventType[] {
  switch (role) {
    case ROLES.ADMIN:
      return [
        EVENT_TYPES.CLASS,
        EVENT_TYPES.EXAM,
        EVENT_TYPES.ASSIGNMENT,
        EVENT_TYPES.PERSONAL,
      ];
    
    case ROLES.TEACHER:
      return [
        EVENT_TYPES.CLASS,
        EVENT_TYPES.ASSIGNMENT,
        EVENT_TYPES.PERSONAL,
      ];
    
    case ROLES.STUDENT:
      return [EVENT_TYPES.PERSONAL];
    
    case ROLES.PARENT:
      return [];
    
    default:
      return [];
  }
}

/**
 * Check if a user can edit/delete an event
 * Users can only edit/delete events they created (except admins who can edit all)
 */
export function canEditEvent(
  role: Role,
  eventCreatedBy: string,
  currentUserId: string
): boolean {
  // Admins can edit any event
  if (role === ROLES.ADMIN) {
    return true;
  }
  
  // Others can only edit their own events
  return eventCreatedBy === currentUserId;
}

/**
 * Check if a user can view an event
 * All authenticated users can view all events
 */
export function canViewEvent(): boolean {
  return true;
}

/**
 * Check if a teacher can view an exam event
 * Teachers can only see exams for courses they teach
 */
export function canTeacherViewExam(
  teacherId: string,
  courseInstanceId: string | undefined,
  teacherCourseIds: string[]
): boolean {
  if (!courseInstanceId) return false;
  return teacherCourseIds.includes(courseInstanceId);
}

/**
 * Get event type display name
 */
export function getEventTypeDisplayName(eventType: EventType): string {
  switch (eventType) {
    case EVENT_TYPES.CLASS:
      return 'Class';
    case EVENT_TYPES.EXAM:
      return 'Exam';
    case EVENT_TYPES.ASSIGNMENT:
      return 'Assignment';
    case EVENT_TYPES.PERSONAL:
      return 'Personal';
    default:
      return eventType;
  }
}

/**
 * Get event type color
 */
export function getEventTypeColor(eventType: EventType): string {
  switch (eventType) {
    case EVENT_TYPES.CLASS:
      return '#232323'; // Black
    case EVENT_TYPES.EXAM:
      return '#F96857'; // Red
    case EVENT_TYPES.ASSIGNMENT:
      return '#7477FF'; // Purple
    case EVENT_TYPES.PERSONAL:
      return '#5AA578'; // Green
    default:
      return '#77867D'; // Gray
  }
}

/**
 * Get event type background color (lighter)
 */
export function getEventTypeBgColor(eventType: EventType): string {
  switch (eventType) {
    case EVENT_TYPES.CLASS:
      return '#F4F7F5'; // Light gray
    case EVENT_TYPES.EXAM:
      return '#FEF0EE'; // Light red
    case EVENT_TYPES.ASSIGNMENT:
      return '#F0F1FF'; // Light purple
    case EVENT_TYPES.PERSONAL:
      return '#F0F9F4'; // Light green
    default:
      return '#F9FAFB'; // Light gray
  }
}

export default {
  canCreateEventType,
  getAvailableEventTypes,
  canEditEvent,
  canViewEvent,
  canTeacherViewExam,
  getEventTypeDisplayName,
  getEventTypeColor,
  getEventTypeBgColor,
};
