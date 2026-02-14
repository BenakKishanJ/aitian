import { useCallback } from 'react';
import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  Timestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { CalendarEvent } from '@/types/calendar';

interface SoftDeleteOptions {
  deletedBy: string;
  reason?: string;
}

/**
 * Soft delete a calendar event
 * Instead of permanently deleting, we mark it as deleted
 */
export async function softDeleteEvent(
  eventId: string,
  options: SoftDeleteOptions
): Promise<void> {
  const eventRef = doc(db, 'calendarEvents', eventId);
  
  await updateDoc(eventRef, {
    isDeleted: true,
    deletedAt: Timestamp.now(),
    deletedBy: options.deletedBy,
    deletionReason: options.reason || null,
  });
}

/**
 * Permanently delete a calendar event
 * Use this when soft delete is not needed
 */
export async function permanentlyDeleteEvent(eventId: string): Promise<void> {
  await deleteDoc(doc(db, 'calendarEvents', eventId));
}

/**
 * Restore a soft-deleted event
 */
export async function restoreEvent(eventId: string): Promise<void> {
  const eventRef = doc(db, 'calendarEvents', eventId);
  
  await updateDoc(eventRef, {
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    deletionReason: null,
    restoredAt: Timestamp.now(),
  });
}

/**
 * Log event history/audit trail
 */
export async function logEventHistory(
  eventId: string,
  action: 'created' | 'updated' | 'deleted' | 'restored',
  userId: string,
  changes?: Record<string, any>
): Promise<void> {
  const historyRef = collection(db, 'calendarEventHistory');
  
  await addDoc(historyRef, {
    eventId,
    action,
    userId,
    changes: changes || null,
    timestamp: Timestamp.now(),
  });
}

/**
 * Hook for managing event deletion with audit trail
 */
export function useEventDeletion() {
  const deleteEvent = useCallback(
    async (event: CalendarEvent, userId: string, permanent: boolean = false) => {
      if (permanent) {
        await permanentlyDeleteEvent(event.id);
      } else {
        await softDeleteEvent(event.id, { deletedBy: userId });
      }
      
      await logEventHistory(event.id, 'deleted', userId, {
        permanent,
        title: event.title,
      });
    },
    []
  );

  const restoreDeletedEvent = useCallback(
    async (eventId: string, userId: string) => {
      await restoreEvent(eventId);
      await logEventHistory(eventId, 'restored', userId);
    },
    []
  );

  return {
    deleteEvent,
    restoreDeletedEvent,
  };
}

export default useEventDeletion;
