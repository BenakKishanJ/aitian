import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { COLLECTIONS } from '@/types/constants';
import type { AttendanceRecord } from '@/types';

export function useAttendanceRecords(courseInstanceId: string, studentId?: string) {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!courseInstanceId) {
      setLoading(false);
      return;
    }

    const targetStudentId = studentId || user?.uid;
    if (!targetStudentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First get all sessions for this course
      const sessionsRef = collection(db, COLLECTIONS.ATTENDANCE_SESSIONS);
      const sessionsQuery = query(
        sessionsRef,
        where('courseInstanceId', '==', courseInstanceId)
      );
      const sessionsSnap = await getDocs(sessionsQuery);
      
      if (sessionsSnap.empty) {
        setRecords([]);
        setLoading(false);
        return;
      }

      const sessionIds = sessionsSnap.docs.map(doc => doc.id);
      
      // Then get attendance records for these sessions
      const recordsRef = collection(db, COLLECTIONS.ATTENDANCE_RECORDS);
      const recordsList: AttendanceRecord[] = [];

      // Firestore 'in' queries limited to 10 items, so batch if needed
      for (let i = 0; i < sessionIds.length; i += 10) {
        const batchIds = sessionIds.slice(i, i + 10);
        const recordsQuery = query(
          recordsRef,
          where('sessionId', 'in', batchIds),
          where('studentId', '==', targetStudentId)
        );
        const recordsSnap = await getDocs(recordsQuery);
        
        recordsSnap.docs.forEach(doc => {
          recordsList.push({ id: doc.id, ...doc.data() } as AttendanceRecord);
        });
      }

      setRecords(recordsList);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching attendance records:', err);
      setError(err.message || 'Failed to fetch attendance records');
      setLoading(false);
    }
  }, [courseInstanceId, studentId, user?.uid]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Calculate stats
  const calculateStats = useCallback(() => {
    const totalClasses = records.length;
    const attendedClasses = records.filter(r => r.status === 'present').length;
    const absentClasses = records.filter(r => r.status === 'absent').length;
    const percentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;

    return {
      totalClasses,
      attendedClasses,
      absentClasses,
      percentage,
      status: percentage >= 75 ? 'good' : percentage >= 60 ? 'warning' : 'at-risk' as const,
    };
  }, [records]);

  return {
    records,
    loading,
    error,
    refresh: fetchRecords,
    stats: calculateStats(),
  };
}

export default useAttendanceRecords;
