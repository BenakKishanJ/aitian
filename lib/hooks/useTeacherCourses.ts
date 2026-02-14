import { useState, useEffect, useCallback, useRef } from 'react';
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
import type {
  Course,
  CourseInstance,
  CourseInstanceWithDetails,
  TeacherCourseView,
} from '@/types';
import { COLLECTIONS } from '@/types/constants';

export interface UseTeacherCoursesResult {
  courses: TeacherCourseView[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useTeacherCourses(): UseTeacherCoursesResult {
  const { user, role, authInitialized } = useAuth();

  const [courses, setCourses] = useState<TeacherCourseView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);

  const fetchTeacherCourses = useCallback(async () => {
    // Wait for auth to initialize
    if (!authInitialized) {
      return;
    }

    if (!user || role !== 'teacher') {
      setLoading(false);
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const currentRequestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError(null);

      // ============================================
      // 1. FETCH COURSE INSTANCES WHERE TEACHER IS ASSIGNED
      // ============================================
      const instancesRef = collection(db, COLLECTIONS.COURSE_INSTANCES);
      const instancesQuery = query(
        instancesRef,
        where('teacherIds', 'array-contains', user.uid),
        where('isActive', '==', true)
      );

      const instancesSnap = await getDocs(instancesQuery);
      const instances: CourseInstanceWithDetails[] = [];
      const instanceIds: string[] = [];

      instancesSnap.docs.forEach((docSnap) => {
        const instance = { id: docSnap.id, ...docSnap.data() } as CourseInstanceWithDetails;
        instances.push(instance);
        instanceIds.push(docSnap.id);
      });

      if (instances.length === 0) {
        if (currentRequestId === requestIdRef.current && !abortController.signal.aborted) {
          setCourses([]);
          setLoading(false);
        }
        return;
      }

      // ============================================
      // 2. FETCH COURSE DETAILS
      // ============================================
      const courseIds = [...new Set(instances.map(inst => inst.courseId).filter(Boolean))];
      const courseData: { [id: string]: Course } = {};

      if (courseIds.length > 0) {
        const courseBatches: Promise<QuerySnapshot<DocumentData>>[] = [];
        for (let i = 0; i < courseIds.length; i += 10) {
          const batchIds = courseIds.slice(i, i + 10);
          const coursesRef = collection(db, COLLECTIONS.COURSES);
          const coursesQuery = query(coursesRef, where('__name__', 'in', batchIds));
          courseBatches.push(getDocs(coursesQuery));
        }
        
        const courseResults = await Promise.all(courseBatches);
        courseResults.flatMap(snap => snap.docs).forEach(docSnap => {
          courseData[docSnap.id] = { id: docSnap.id, ...docSnap.data() } as Course;
        });
      }

      // ============================================
      // 3. FETCH OTHER TEACHER NAMES FOR EACH INSTANCE
      // ============================================
      const allTeacherIds = [...new Set(instances.flatMap(inst => inst.teacherIds || []))];
      const teacherData: { [id: string]: string } = {};

      if (allTeacherIds.length > 0) {
        const teacherBatches: Promise<QuerySnapshot<DocumentData>>[] = [];
        for (let i = 0; i < allTeacherIds.length; i += 10) {
          const batchIds = allTeacherIds.slice(i, i + 10);
          const usersRef = collection(db, COLLECTIONS.USERS);
          const usersQuery = query(usersRef, where('__name__', 'in', batchIds));
          teacherBatches.push(getDocs(usersQuery));
        }
        
        const teacherResults = await Promise.all(teacherBatches);
        teacherResults.flatMap(snap => snap.docs).forEach(docSnap => {
          teacherData[docSnap.id] = docSnap.data().name || 'Unknown';
        });
      }

      // ============================================
      // 4. CALCULATE STUDENT COUNTS
      // ============================================
      // For elective courses, count is based on selections
      // For core courses, we need to count eligible students
      const studentCounts: { [instanceId: string]: number } = {};

      // For now, we'll get student counts from a simple query
      // In a production app, you might want to cache this or use Cloud Functions
      for (const instance of instances) {
        if (instance.electiveSlotId) {
          // Elective course - count selections
          const selectionsRef = collection(db, COLLECTIONS.ELECTIVE_SELECTIONS);
          const selectionsQuery = query(
            selectionsRef,
            where('instanceId', '==', instance.id)
          );
          const selectionsSnap = await getDocs(selectionsQuery);
          studentCounts[instance.id] = selectionsSnap.size;
        } else {
          // Core course - count eligible students
          const usersRef = collection(db, COLLECTIONS.USERS);
          const usersQuery = query(
            usersRef,
            where('role', '==', 'student'),
            where('departmentId', '==', instance.departmentId),
            where('semester', '==', instance.semester),
            where('section', '==', instance.section)
          );
          const usersSnap = await getDocs(usersQuery);
          studentCounts[instance.id] = usersSnap.size;
        }
      }

      // ============================================
      // 5. FETCH PENDING ASSIGNMENTS COUNT
      // ============================================
      const pendingAssignments: { [instanceId: string]: number } = {};
      
      for (const instance of instances) {
        const assignmentsRef = collection(db, COLLECTIONS.ASSIGNMENTS);
        const assignmentsQuery = query(
          assignmentsRef,
          where('courseInstanceId', '==', instance.id),
          where('status', '==', 'active')
        );
        const assignmentsSnap = await getDocs(assignmentsQuery);
        pendingAssignments[instance.id] = assignmentsSnap.size;
      }

      // ============================================
      // 6. BUILD TEACHER COURSE VIEWS
      // ============================================
      const teacherCourseViews: TeacherCourseView[] = instances.map(instance => {
        // Attach course details
        if (instance.courseId && courseData[instance.courseId]) {
          instance.course = courseData[instance.courseId];
        }

        // Attach teacher names
        if (instance.teacherIds && instance.teacherIds.length > 0) {
          instance.teacherNames = instance.teacherIds.map(id => teacherData[id] || 'Unknown');
        }

        return {
          instance,
          studentCount: studentCounts[instance.id] || 0,
          pendingAssignments: pendingAssignments[instance.id] || 0,
        };
      });

      // Sort by course code
      teacherCourseViews.sort((a, b) => {
        const codeA = a.instance.course?.courseCode || '';
        const codeB = b.instance.course?.courseCode || '';
        return codeA.localeCompare(codeB);
      });

      if (currentRequestId === requestIdRef.current && !abortController.signal.aborted) {
        setCourses(teacherCourseViews);
        setLoading(false);
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || abortController.signal.aborted) {
        return;
      }

      // Handle Firebase index errors
      if (err.code === 'failed-precondition') {
        console.error('Missing Firebase index:', err.message);
        if (currentRequestId === requestIdRef.current) {
          setError('Database configuration error. Please contact support.');
          setLoading(false);
        }
        return;
      }

      console.error('Error fetching teacher courses:', err);
      if (currentRequestId === requestIdRef.current) {
        setError(err.message || 'Failed to fetch courses');
        setLoading(false);
      }
    }
  }, [user?.uid, role, authInitialized]);

  const refresh = useCallback(() => {
    fetchTeacherCourses();
  }, [fetchTeacherCourses]);

  useEffect(() => {
    fetchTeacherCourses();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchTeacherCourses]);

  return {
    courses,
    loading,
    error,
    refresh,
  };
}

export default useTeacherCourses;
