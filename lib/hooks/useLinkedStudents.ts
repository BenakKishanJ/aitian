import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { COLLECTIONS } from '@/types/constants';
import type { StudentUserData, ParentUserData } from '@/types';

export interface LinkedStudent {
  uid: string;
  name: string;
  email: string;
  usn: string;
  departmentId: string;
  department?: string;
  semester: number;
  section: string;
  batch?: string;
}

export interface UseLinkedStudentsResult {
  students: LinkedStudent[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  selectedStudent: LinkedStudent | null;
  setSelectedStudent: (student: LinkedStudent | null) => void;
}

/**
 * Hook to fetch linked students for a parent user
 * Also provides functionality to select which student to view (for parents with multiple children)
 */
export function useLinkedStudents(): UseLinkedStudentsResult {
  const { user, userData, role } = useAuth();
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<LinkedStudent | null>(null);

  const fetchLinkedStudents = useCallback(async () => {
    if (!user || !userData || role !== 'parent') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const parentData = userData as ParentUserData;
      
      // Get all approved links for this parent
      const linksRef = collection(db, 'parentLinks');
      const linksQuery = query(
        linksRef,
        where('parentId', '==', user.uid),
        where('status', '==', 'approved')
      );

      const linksSnap = await getDocs(linksQuery);
      
      if (linksSnap.empty) {
        setStudents([]);
        setSelectedStudent(null);
        setLoading(false);
        return;
      }

      // Fetch student details for each link
      const linkedStudents: LinkedStudent[] = [];
      
      for (const linkDoc of linksSnap.docs) {
        const linkData = linkDoc.data();
        const studentId = linkData.studentId;
        
        if (!studentId) continue;

        try {
          const studentDoc = await getDoc(doc(db, COLLECTIONS.USERS, studentId));
          
          if (studentDoc.exists()) {
            const studentData = studentDoc.data() as StudentUserData;
            
            linkedStudents.push({
              uid: studentId,
              name: studentData.name,
              email: studentData.email,
              usn: studentData.usn,
              departmentId: studentData.departmentId || studentData.department || '',
              department: studentData.department,
              semester: studentData.semester,
              section: studentData.section,
              batch: studentData.batch,
            });
          }
        } catch (err) {
          console.error(`Error fetching student ${studentId}:`, err);
        }
      }

      setStudents(linkedStudents);
      
      // Auto-select first student if none selected or if previously selected student is no longer linked
      if (linkedStudents.length > 0) {
        const currentSelectedId = selectedStudent?.uid;
        const stillLinked = linkedStudents.find(s => s.uid === currentSelectedId);
        
        if (!stillLinked) {
          setSelectedStudent(linkedStudents[0]);
        }
      } else {
        setSelectedStudent(null);
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching linked students:', err);
      setError(err.message || 'Failed to fetch linked students');
      setLoading(false);
    }
  }, [user, userData, role, selectedStudent?.uid]);

  // Initial fetch
  useEffect(() => {
    fetchLinkedStudents();
  }, [fetchLinkedStudents]);

  // Set up real-time listener for link changes
  useEffect(() => {
    if (!user || role !== 'parent') return;

    const linksRef = collection(db, 'parentLinks');
    const linksQuery = query(
      linksRef,
      where('parentId', '==', user.uid),
      where('status', '==', 'approved')
    );

    const unsubscribe = onSnapshot(linksQuery, () => {
      // Refetch when links change
      fetchLinkedStudents();
    });

    return () => unsubscribe();
  }, [user, role, fetchLinkedStudents]);

  return {
    students,
    loading,
    error,
    refresh: fetchLinkedStudents,
    selectedStudent,
    setSelectedStudent,
  };
}

export default useLinkedStudents;
