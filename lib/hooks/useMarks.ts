import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import type { Marks, MarksUpdateData, ClassStatistics, StudentMarksView } from '@/types';
import { COLLECTIONS } from '@/types/constants';
import { calculateGrade, getDefaultGradingConfig } from '@/lib/gradingUtils';
import type { ParentUserData } from '@/types';

export function useMarks(courseInstanceId: string) {
  const { user, userData, role } = useAuth();
  const [marks, setMarks] = useState<Marks | null>(null);
  const [allMarks, setAllMarks] = useState<Marks[]>([]);
  const [classStats, setClassStats] = useState<ClassStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarks = useCallback(async () => {
    if (!user || !courseInstanceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const marksRef = collection(db, COLLECTIONS.MARKS);

      // Determine the target student ID (for parents, use linked student's ID)
      let targetStudentId = user.uid;
      if (role === 'parent' && userData) {
        const parentData = userData as ParentUserData;
        if (parentData.linkedStudentId) {
          targetStudentId = parentData.linkedStudentId;
        } else {
          setMarks(null);
          setLoading(false);
          return;
        }
      }

      if (role === 'student' || role === 'parent') {
        // Fetch student's own marks (or linked student's marks for parents)
        const marksQuery = query(
          marksRef,
          where('courseInstanceId', '==', courseInstanceId),
          where('studentId', '==', targetStudentId)
        );

        const marksSnap = await getDocs(marksQuery);

        if (!marksSnap.empty) {
          const marksData = { id: marksSnap.docs[0].id, ...marksSnap.docs[0].data() } as Marks;
          setMarks(marksData);
        } else {
          setMarks(null);
        }
      } else if (role === 'teacher' || role === 'admin') {
        // Fetch all marks for this course (for teacher/admin)
        const marksQuery = query(
          marksRef,
          where('courseInstanceId', '==', courseInstanceId)
        );

        const marksSnap = await getDocs(marksQuery);
        const marksList: Marks[] = [];

        marksSnap.docs.forEach((doc) => {
          marksList.push({ id: doc.id, ...doc.data() } as Marks);
        });

        setAllMarks(marksList);

        // Calculate class statistics
        if (marksList.length > 0) {
          const scores = marksList.map((m) => m.total);
          const totalStudents = marksList.length;
          const averageScore = scores.reduce((a, b) => a + b, 0) / totalStudents;
          const highestScore = Math.max(...scores);
          const lowestScore = Math.min(...scores);

          // Calculate grade distribution
          const gradeDistribution: Record<string, number> = {};
          marksList.forEach((m) => {
            gradeDistribution[m.grade] = (gradeDistribution[m.grade] || 0) + 1;
          });

          setClassStats({
            courseInstanceId,
            totalStudents,
            averageScore,
            highestScore,
            lowestScore,
            gradeDistribution,
          });
        }
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching marks:', err);
      setError(err.message || 'Failed to fetch marks');
      setLoading(false);
    }
  }, [user, role, courseInstanceId]);

  const updateMarks = async (marksData: MarksUpdateData) => {
    if (!user) return;

    try {
      // Calculate grade
      const gradingConfig = marksData.gradingConfig || getDefaultGradingConfig();
      const { grade, percentage, total } = calculateGrade(
        {
          cie1: marksData.cie1 || 0,
          cie2: marksData.cie2 || 0,
          see: marksData.see || 0,
          assignment: marksData.assignment,
          groupActivity: marksData.groupActivity,
        },
        gradingConfig
      );

      const marksRef = collection(db, COLLECTIONS.MARKS);
      const marksQuery = query(
        marksRef,
        where('courseInstanceId', '==', marksData.courseInstanceId),
        where('studentId', '==', marksData.studentId)
      );

      const marksSnap = await getDocs(marksQuery);

      const updateData = {
        cie1: marksData.cie1 || 0,
        cie2: marksData.cie2 || 0,
        see: marksData.see || 0,
        assignment: marksData.assignment,
        groupActivity: marksData.groupActivity,
        total,
        grade,
        gradingConfig,
        updatedBy: user.uid,
        updatedAt: Timestamp.now(),
      };

      if (marksSnap.empty) {
        // Create new marks document
        await addDoc(marksRef, {
          ...updateData,
          courseInstanceId: marksData.courseInstanceId,
          studentId: marksData.studentId,
          createdAt: Timestamp.now(),
        });
      } else {
        // Update existing marks
        const marksDoc = marksSnap.docs[0];
        await updateDoc(doc(db, COLLECTIONS.MARKS, marksDoc.id), updateData);
      }

      // Refresh marks
      await fetchMarks();

      return { success: true };
    } catch (err: any) {
      console.error('Error updating marks:', err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchMarks();
  }, [fetchMarks]);

  return {
    marks,
    allMarks,
    classStats,
    loading,
    error,
    refresh: fetchMarks,
    updateMarks,
  };
}

export default useMarks;
