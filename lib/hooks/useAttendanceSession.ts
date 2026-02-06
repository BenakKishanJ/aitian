import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import type { AttendanceSession, AttendanceSessionCreateData } from '@/types';

interface UseAttendanceSessionOptions {
  courseInstanceId?: string;
  date?: Date;
}

export function useAttendanceSession(options: UseAttendanceSessionOptions = {}) {
  const { courseInstanceId, date } = options;
  const { user, userData, role } = useAuth();
  
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Fetch sessions for a course
  const fetchSessions = useCallback(async () => {
    if (!courseInstanceId || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const sessionsRef = collection(db, 'attendanceSessions');
      let sessionsQuery = query(
        sessionsRef,
        where('courseInstanceId', '==', courseInstanceId),
        orderBy('startedAt', 'desc')
      );

      // Filter by date if provided
      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        sessionsQuery = query(
          sessionsRef,
          where('courseInstanceId', '==', courseInstanceId),
          where('startedAt', '>=', Timestamp.fromDate(startOfDay)),
          where('startedAt', '<=', Timestamp.fromDate(endOfDay)),
          orderBy('startedAt', 'desc')
        );
      }

      const snapshot = await getDocs(sessionsQuery);
      const fetchedSessions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AttendanceSession[];

      setSessions(fetchedSessions);
      
      // Find active (unlocked) session
      const active = fetchedSessions.find((s) => !s.isLocked);
      setActiveSession(active || null);
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching attendance sessions:', err);
      setError(err.message || 'Failed to fetch sessions');
      setLoading(false);
    }
  }, [courseInstanceId, user, date]);

  // Subscribe to real-time updates for active session
  useEffect(() => {
    if (!activeSession?.id) return;

    const unsubscribe = onSnapshot(
      doc(db, 'attendanceSessions', activeSession.id),
      (docSnap) => {
        if (docSnap.exists()) {
          setActiveSession({
            id: docSnap.id,
            ...docSnap.data(),
          } as AttendanceSession);
        }
      },
      (err) => {
        console.error('Error listening to session:', err);
      }
    );

    return () => unsubscribe();
  }, [activeSession?.id]);

  // Start a new attendance session
  const startSession = async (data: Omit<AttendanceSessionCreateData, 'startedBy'>) => {
    if (!user || (role !== 'teacher' && role !== 'admin')) {
      throw new Error('Only teachers and admins can start attendance sessions');
    }

    try {
      setCreating(true);

      // Check if there's already an active session for this course
      const activeSession = sessions.find((s) => !s.isLocked);
      if (activeSession) {
        throw new Error('An active session already exists for this course. Please lock it first.');
      }

      const docRef = await addDoc(collection(db, 'attendanceSessions'), {
        ...data,
        startedBy: user.uid,
        isLocked: false,
        startedAt: serverTimestamp(),
      });

      await fetchSessions();
      setCreating(false);
      return docRef.id;
    } catch (err: any) {
      console.error('Error starting attendance session:', err);
      setCreating(false);
      throw err;
    }
  };

  // Lock a session (prevent further marking)
  const lockSession = async (sessionId: string) => {
    if (!user || (role !== 'teacher' && role !== 'admin')) {
      throw new Error('Only teachers and admins can lock sessions');
    }

    try {
      await updateDoc(doc(db, 'attendanceSessions', sessionId), {
        isLocked: true,
        endedAt: serverTimestamp(),
      });

      await fetchSessions();
    } catch (err: any) {
      console.error('Error locking session:', err);
      throw err;
    }
  };

  // Unlock a session (allow marking again)
  const unlockSession = async (sessionId: string) => {
    if (!user || (role !== 'teacher' && role !== 'admin')) {
      throw new Error('Only teachers and admins can unlock sessions');
    }

    try {
      await updateDoc(doc(db, 'attendanceSessions', sessionId), {
        isLocked: false,
        endedAt: null,
      });

      await fetchSessions();
    } catch (err: any) {
      console.error('Error unlocking session:', err);
      throw err;
    }
  };

  // End a session (lock it)
  const endSession = lockSession;

  // Delete a session
  const deleteSession = async (sessionId: string) => {
    if (!user || (role !== 'teacher' && role !== 'admin')) {
      throw new Error('Only teachers and admins can delete sessions');
    }

    try {
      // First delete all attendance records for this session
      const recordsRef = collection(db, 'attendanceRecords');
      const recordsQuery = query(recordsRef, where('sessionId', '==', sessionId));
      const recordsSnap = await getDocs(recordsQuery);
      
      const deletePromises = recordsSnap.docs.map((recordDoc) =>
        deleteDoc(doc(db, 'attendanceRecords', recordDoc.id))
      );
      await Promise.all(deletePromises);

      // Then delete the session
      await deleteDoc(doc(db, 'attendanceSessions', sessionId));
      await fetchSessions();
    } catch (err: any) {
      console.error('Error deleting session:', err);
      throw err;
    }
  };

  // Refresh sessions
  const refresh = async () => {
    await fetchSessions();
  };

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    activeSession,
    loading,
    error,
    creating,
    startSession,
    lockSession,
    unlockSession,
    endSession,
    deleteSession,
    refresh,
  };
}
