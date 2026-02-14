import { useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ExpandedEvent } from '@/types/calendar';
import type { AttendanceSession } from '@/types/attendance';

interface UseCalendarAttendanceOptions {
  userId?: string;
  role?: 'student' | 'teacher' | 'admin' | 'parent';
}

/**
 * Hook to integrate calendar events with attendance sessions
 */
export function useCalendarAttendance(options: UseCalendarAttendanceOptions = {}) {
  const { userId, role } = options;

  /**
   * Get or create an attendance session for a calendar event
   * This ensures that when a class event starts, an attendance session exists
   */
  const getOrCreateAttendanceSession = useCallback(
    async (calendarEvent: ExpandedEvent) => {
      if (!userId || (role !== 'teacher' && role !== 'admin')) {
        throw new Error('Only teachers and admins can manage attendance sessions');
      }

      if (!calendarEvent.courseInstanceId) {
        throw new Error('Calendar event must be linked to a course');
      }

      try {
        // Check if an attendance session already exists for this event
        const sessionsRef = collection(db, 'attendanceSessions');
        const sessionsQuery = query(
          sessionsRef,
          where('calendarEventId', '==', calendarEvent.id)
        );
        const sessionsSnap = await getDocs(sessionsQuery);

        if (!sessionsSnap.empty) {
          // Return existing session
          const session = sessionsSnap.docs[0];
          const data = session.data();
          return {
            id: session.id,
            calendarEventId: data.calendarEventId,
            courseInstanceId: data.courseInstanceId,
            title: data.title,
            startedBy: data.startedBy,
            startedAt: data.startedAt,
            endedAt: data.endedAt,
            isLocked: data.isLocked,
            createdAt: data.createdAt,
          } as AttendanceSession;
        }

        // Create new attendance session
        const newSession = {
          calendarEventId: calendarEvent.id,
          courseInstanceId: calendarEvent.courseInstanceId,
          title: calendarEvent.title,
          startedBy: userId,
          isLocked: false,
          startedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'attendanceSessions'), newSession);
        
        return {
          id: docRef.id,
          ...newSession,
        };
      } catch (error) {
        console.error('Error getting or creating attendance session:', error);
        throw error;
      }
    },
    [userId, role]
  );

  /**
   * Get attendance session for a calendar event
   */
  const getAttendanceSessionForEvent = useCallback(
    async (calendarEventId: string) => {
      try {
        const sessionsRef = collection(db, 'attendanceSessions');
        const sessionsQuery = query(
          sessionsRef,
          where('calendarEventId', '==', calendarEventId)
        );
        const sessionsSnap = await getDocs(sessionsQuery);

        if (!sessionsSnap.empty) {
          const session = sessionsSnap.docs[0];
          const data = session.data();
          return {
            id: session.id,
            calendarEventId: data.calendarEventId,
            courseInstanceId: data.courseInstanceId,
            title: data.title,
            startedBy: data.startedBy,
            startedAt: data.startedAt,
            endedAt: data.endedAt,
            isLocked: data.isLocked,
            createdAt: data.createdAt,
          } as AttendanceSession;
        }

        return null;
      } catch (error) {
        console.error('Error getting attendance session:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Check if a calendar event has an active attendance session
   */
  const hasActiveAttendanceSession = useCallback(
    async (calendarEventId: string) => {
      try {
        const session = await getAttendanceSessionForEvent(calendarEventId);
        return session && !session.isLocked;
      } catch (error) {
        console.error('Error checking attendance session:', error);
        return false;
      }
    },
    [getAttendanceSessionForEvent]
  );

  return {
    getOrCreateAttendanceSession,
    getAttendanceSessionForEvent,
    hasActiveAttendanceSession,
  };
}

export default useCalendarAttendance;
