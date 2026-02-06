import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import type { AttendanceRecord, AttendanceRecordCreateData, AttendanceStatus } from '@/types';

interface UseAttendanceMarkingOptions {
  sessionId?: string;
  courseInstanceId?: string;
}

interface StudentWithAttendance {
  id: string;
  name: string;
  usn?: string;
  status: AttendanceStatus | null;
  recordId?: string;
}

export function useAttendanceMarking(options: UseAttendanceMarkingOptions = {}) {
  const { sessionId, courseInstanceId } = options;
  const { user, userData, role } = useAuth();
  
  const [students, setStudents] = useState<StudentWithAttendance[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingInProgress, setMarkingInProgress] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    notMarked: 0,
  });

  // Fetch enrolled students and their attendance records
  const fetchData = useCallback(async () => {
    if (!sessionId || !courseInstanceId || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all enrollments for this course
      const enrollmentsRef = collection(db, 'enrollments');
      const enrollmentsQuery = query(
        enrollmentsRef,
        where('courseInstanceId', '==', courseInstanceId)
      );
      const enrollmentsSnap = await getDocs(enrollmentsQuery);

      const studentIds = enrollmentsSnap.docs.map((doc) => doc.data().studentId);

      if (studentIds.length === 0) {
        setStudents([]);
        setRecords([]);
        setLoading(false);
        return;
      }

      // Fetch student details
      const studentsData: StudentWithAttendance[] = [];
      for (const studentId of studentIds) {
        const studentDoc = await getDocs(
          query(collection(db, 'users'), where('__name__', '==', studentId))
        );
        if (!studentDoc.empty) {
          const data = studentDoc.docs[0].data();
          studentsData.push({
            id: studentId,
            name: data.name || 'Unknown',
            usn: data.usn,
            status: null,
          });
        }
      }

      // Get existing attendance records for this session
      const recordsRef = collection(db, 'attendanceRecords');
      const recordsQuery = query(
        recordsRef,
        where('sessionId', '==', sessionId)
      );
      const recordsSnap = await getDocs(recordsQuery);

      const attendanceRecords = recordsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AttendanceRecord[];

      // Merge student data with attendance records
      const studentsWithAttendance = studentsData.map((student) => {
        const record = attendanceRecords.find((r) => r.studentId === student.id);
        return {
          ...student,
          status: record?.status || null,
          recordId: record?.id,
        };
      });

      setStudents(studentsWithAttendance);
      setRecords(attendanceRecords);
      
      // Calculate stats
      const present = attendanceRecords.filter((r) => r.status === 'present').length;
      const absent = attendanceRecords.filter((r) => r.status === 'absent').length;
      setStats({
        total: studentsData.length,
        present,
        absent,
        notMarked: studentsData.length - present - absent,
      });
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching attendance data:', err);
      setError(err.message || 'Failed to fetch attendance data');
      setLoading(false);
    }
  }, [sessionId, courseInstanceId, user]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!sessionId) return;

    const recordsRef = collection(db, 'attendanceRecords');
    const recordsQuery = query(
      recordsRef,
      where('sessionId', '==', sessionId)
    );

    const unsubscribe = onSnapshot(
      recordsQuery,
      (snapshot) => {
        const updatedRecords = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as AttendanceRecord[];

        setRecords(updatedRecords);
        
        // Update students with new records
        setStudents((prev) =>
          prev.map((student) => {
            const record = updatedRecords.find((r) => r.studentId === student.id);
            return {
              ...student,
              status: record?.status || null,
              recordId: record?.id,
            };
          })
        );

        // Update stats
        const present = updatedRecords.filter((r) => r.status === 'present').length;
        const absent = updatedRecords.filter((r) => r.status === 'absent').length;
        setStats((prev) => ({
          ...prev,
          present,
          absent,
          notMarked: prev.total - present - absent,
        }));
      },
      (err) => {
        console.error('Error listening to attendance records:', err);
      }
    );

    return () => unsubscribe();
  }, [sessionId]);

  // Mark a single student's attendance
  const markAttendance = async (
    studentId: string,
    status: AttendanceStatus
  ) => {
    if (!user || (role !== 'teacher' && role !== 'admin')) {
      throw new Error('Only teachers and admins can mark attendance');
    }

    if (!sessionId) {
      throw new Error('No active session');
    }

    try {
      setMarkingInProgress(true);

      const existingRecord = records.find((r) => r.studentId === studentId);

      if (existingRecord) {
        // Update existing record
        await updateDoc(doc(db, 'attendanceRecords', existingRecord.id), {
          status,
          markedBy: 'teacher',
          markedAt: serverTimestamp(),
        });
      } else {
        // Create new record
        const recordData: AttendanceRecordCreateData = {
          sessionId,
          studentId,
          status,
          markedBy: 'teacher',
        };

        await addDoc(collection(db, 'attendanceRecords'), {
          ...recordData,
          markedAt: serverTimestamp(),
        });
      }

      setMarkingInProgress(false);
    } catch (err: any) {
      console.error('Error marking attendance:', err);
      setMarkingInProgress(false);
      throw err;
    }
  };

  // Mark all students at once
  const markAllAttendance = async (status: AttendanceStatus) => {
    if (!user || (role !== 'teacher' && role !== 'admin')) {
      throw new Error('Only teachers and admins can mark attendance');
    }

    if (!sessionId) {
      throw new Error('No active session');
    }

    try {
      setMarkingInProgress(true);

      const batch = writeBatch(db);

      for (const student of students) {
        if (student.recordId) {
          // Update existing
          const recordRef = doc(db, 'attendanceRecords', student.recordId);
          batch.update(recordRef, {
            status,
            markedBy: 'teacher',
            markedAt: serverTimestamp(),
          });
        } else {
          // Create new
          const recordsRef = collection(db, 'attendanceRecords');
          const newRecordRef = doc(recordsRef);
          batch.set(newRecordRef, {
            sessionId,
            studentId: student.id,
            status,
            markedBy: 'teacher',
            markedAt: serverTimestamp(),
          });
        }
      }

      await batch.commit();
      setMarkingInProgress(false);
    } catch (err: any) {
      console.error('Error marking all attendance:', err);
      setMarkingInProgress(false);
      throw err;
    }
  };

  // Toggle attendance (present -> absent -> not marked)
  const toggleAttendance = async (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    let newStatus: AttendanceStatus;
    if (student.status === 'present') {
      newStatus = 'absent';
    } else if (student.status === 'absent') {
      newStatus = 'present';
    } else {
      newStatus = 'present';
    }

    await markAttendance(studentId, newStatus);
  };

  // Clear a student's attendance (set to not marked)
  const clearAttendance = async (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student || !student.recordId) return;

    try {
      await deleteDoc(doc(db, 'attendanceRecords', student.recordId));
    } catch (err: any) {
      console.error('Error clearing attendance:', err);
      throw err;
    }
  };

  // Refresh data
  const refresh = async () => {
    await fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    students,
    records,
    loading,
    error,
    markingInProgress,
    stats,
    markAttendance,
    markAllAttendance,
    toggleAttendance,
    clearAttendance,
    refresh,
  };
}
