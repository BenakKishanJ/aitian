import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  writeBatch,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import type { Submission, Assignment, UserData } from '@/types';

export interface SubmissionWithStudent extends Submission {
  studentName: string;
  studentEmail: string;
  studentRollNumber?: string;
}

export interface AssignmentWithSubmissions extends Assignment {
  submissions: SubmissionWithStudent[];
  totalStudents: number;
  submittedCount: number;
  gradedCount: number;
  averageGrade?: number;
}

interface GradeData {
  submissionId: string;
  grade: number;
  feedback?: string;
}

export function useAssignmentGrading(assignmentId: string | null) {
  const { user, role } = useAuth();
  const [assignment, setAssignment] = useState<AssignmentWithSubmissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGrading, setIsGrading] = useState(false);

  const fetchAssignmentWithSubmissions = useCallback(async () => {
    if (!assignmentId || !user) {
      setLoading(false);
      return;
    }

    if (role !== 'teacher' && role !== 'admin') {
      setError('Only teachers and admins can view submissions');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch assignment details
      const assignmentDoc = await getDoc(doc(db, 'assignments', assignmentId));
      if (!assignmentDoc.exists()) {
        setError('Assignment not found');
        setLoading(false);
        return;
      }

      const assignmentData = assignmentDoc.data() as Assignment;

      // Get course instance to find enrolled students
      const courseInstanceDoc = await getDoc(
        doc(db, 'courseInstances', assignmentData.courseInstanceId)
      );

      let enrolledStudentIds: string[] = [];
      if (courseInstanceDoc.exists()) {
        const courseData = courseInstanceDoc.data();
        enrolledStudentIds = courseData.enrolledStudents || [];
      }

      // Fetch all submissions for this assignment
      const submissionsRef = collection(db, 'submissions');
      const submissionsQuery = query(
        submissionsRef,
        where('assignmentId', '==', assignmentId),
        orderBy('submittedAt', 'desc')
      );
      const submissionsSnap = await getDocs(submissionsQuery);

      // Fetch student details for each submission
      const submissionsWithStudents: SubmissionWithStudent[] = [];
      for (const docSnapshot of submissionsSnap.docs) {
        const submissionData = docSnapshot.data() as Submission;
        const studentId = submissionData.studentId;

        // Fetch student details
        let studentName = 'Unknown Student';
        let studentEmail = '';
        let studentRollNumber = '';

        try {
          const studentDoc = await getDoc(doc(db, 'users', studentId));
          if (studentDoc.exists()) {
            const studentData = studentDoc.data() as UserData;
            studentName = studentData.name || 'Unknown Student';
            studentEmail = studentData.email || '';
            studentRollNumber = (studentData as any).rollNumber || '';
          }
        } catch (err) {
          console.error('Error fetching student:', err);
        }

        submissionsWithStudents.push({
          ...submissionData,
          id: docSnapshot.id,
          studentName,
          studentEmail,
          studentRollNumber,
        } as SubmissionWithStudent);
      }

      // Calculate statistics
      const submittedCount = submissionsWithStudents.length;
      const gradedCount = submissionsWithStudents.filter((s) => s.grade !== undefined).length;
      const gradedSubmissions = submissionsWithStudents.filter((s) => s.grade !== undefined);
      const averageGrade =
        gradedSubmissions.length > 0
          ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
          : undefined;

      setAssignment({
        ...assignmentData,
        id: assignmentId,
        submissions: submissionsWithStudents,
        totalStudents: enrolledStudentIds.length,
        submittedCount,
        gradedCount,
        averageGrade,
      } as AssignmentWithSubmissions);

      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching assignment submissions:', err);
      setError(err.message || 'Failed to fetch submissions');
      setLoading(false);
    }
  }, [assignmentId, user, role]);

  const gradeSubmission = async (
    submissionId: string,
    grade: number,
    feedback?: string
  ): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (role !== 'teacher' && role !== 'admin') {
      throw new Error('Only teachers and admins can grade submissions');
    }

    setIsGrading(true);
    try {
      await updateDoc(doc(db, 'submissions', submissionId), {
        grade,
        feedback: feedback || '',
        gradedBy: user.uid,
        gradedAt: serverTimestamp(),
      });

      // Update local state
      setAssignment((prev) => {
        if (!prev) return null;

        const updatedSubmissions = prev.submissions.map((sub) =>
          sub.id === submissionId
            ? { ...sub, grade, feedback: feedback || '', gradedBy: user.uid }
            : sub
        );

        const gradedCount = updatedSubmissions.filter((s) => s.grade !== undefined).length;
        const gradedSubmissions = updatedSubmissions.filter((s) => s.grade !== undefined);
        const averageGrade =
          gradedSubmissions.length > 0
            ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
            : undefined;

        return {
          ...prev,
          submissions: updatedSubmissions,
          gradedCount,
          averageGrade,
        };
      });
    } catch (err: any) {
      console.error('Error grading submission:', err);
      throw new Error(err.message || 'Failed to grade submission');
    } finally {
      setIsGrading(false);
    }
  };

  const gradeMultipleSubmissions = async (grades: GradeData[]): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (role !== 'teacher' && role !== 'admin') {
      throw new Error('Only teachers and admins can grade submissions');
    }

    setIsGrading(true);
    try {
      const batch = writeBatch(db);

      grades.forEach(({ submissionId, grade, feedback }) => {
        const submissionRef = doc(db, 'submissions', submissionId);
        batch.update(submissionRef, {
          grade,
          feedback: feedback || '',
          gradedBy: user.uid,
          gradedAt: serverTimestamp(),
        });
      });

      await batch.commit();

      // Refresh data
      await fetchAssignmentWithSubmissions();
    } catch (err: any) {
      console.error('Error grading multiple submissions:', err);
      throw new Error(err.message || 'Failed to grade submissions');
    } finally {
      setIsGrading(false);
    }
  };

  const refresh = useCallback(() => {
    fetchAssignmentWithSubmissions();
  }, [fetchAssignmentWithSubmissions]);

  useEffect(() => {
    fetchAssignmentWithSubmissions();
  }, [fetchAssignmentWithSubmissions]);

  return {
    assignment,
    loading,
    error,
    isGrading,
    gradeSubmission,
    gradeMultipleSubmissions,
    refresh,
  };
}
