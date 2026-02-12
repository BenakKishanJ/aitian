import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import type {
  Course,
  CourseInstance,
  CourseInstanceWithDetails,
  CourseFilterOptions,
  ParentUserData,
  Enrollment,
} from '@/types';
import { COLLECTIONS, PROMOTION_STATUSES, ENROLLMENT_STATUSES } from '@/types/constants';

export type { Course, CourseInstance, CourseInstanceWithDetails, CourseFilterOptions };

export interface UseCourseWithEnrollmentsOptions extends CourseFilterOptions {}

interface EnrollmentMap {
  [courseInstanceId: string]: Enrollment;
}

export function useCoursesWithEnrollments(options: UseCourseWithEnrollmentsOptions = {}) {
  const { user, userData, role } = useAuth();
  const { searchQuery } = options;

  const [courses, setCourses] = useState<CourseInstanceWithDetails[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track and cancel in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);

  // Fetch courses based on role
  const fetchCourses = useCallback(async () => {
    if (!user || !userData || !role) {
      setLoading(false);
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    // Generate unique request ID
    const currentRequestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError(null);

      let courseInstances: CourseInstanceWithDetails[] = [];
      let enrollmentMap: EnrollmentMap = {};

      if (role === 'student') {
        // Fetch student's enrollments
        const enrollmentsRef = collection(db, COLLECTIONS.ENROLLMENTS);
        const enrollmentsQuery = query(
          enrollmentsRef,
          where('studentId', '==', user.uid)
        );

        const enrollmentsSnap = await getDocs(enrollmentsQuery);
        const enrollmentsList: Enrollment[] = [];
        const courseInstanceIds: string[] = [];

        enrollmentsSnap.docs.forEach((doc) => {
          const enrollment = { id: doc.id, ...doc.data() } as Enrollment;
          enrollmentsList.push(enrollment);
          courseInstanceIds.push(enrollment.courseInstanceId);
          enrollmentMap[enrollment.courseInstanceId] = enrollment;
        });

        // Filter out locked courses (semester > student's current semester)
        const studentSemester = (userData as any).semester || 1;
        
        if (courseInstanceIds.length === 0) {
          setCourses([]);
          setEnrollments({});
          setLoading(false);
          return;
        }

        // Fetch course instances in batches
        const batches: Promise<QuerySnapshot<DocumentData>>[] = [];
        for (let i = 0; i < courseInstanceIds.length; i += 10) {
          const batch = courseInstanceIds.slice(i, i + 10);
          const instancesRef = collection(db, COLLECTIONS.COURSE_INSTANCES);
          const instancesQuery = query(
            instancesRef,
            where('__name__', 'in', batch)
          );
          batches.push(getDocs(instancesQuery));
        }

        const batchResults = await Promise.all(batches);
        const allInstances: CourseInstanceWithDetails[] = [];

        batchResults.forEach((snap) => {
          snap.docs.forEach((doc) => {
            const instance = { id: doc.id, ...doc.data() } as CourseInstanceWithDetails;
            // Only include courses up to student's semester
            if (instance.semester <= studentSemester) {
              allInstances.push(instance);
            }
          });
        });

        courseInstances = allInstances;

        // Fetch attendance percentages for all courses in batch
        if (courseInstances.length > 0) {
          try {
            const instanceIds = courseInstances.map(inst => inst.id);
            
            // Get all attendance sessions for these courses
            const sessionsRef = collection(db, COLLECTIONS.ATTENDANCE_SESSIONS);
            const sessionBatches: Promise<QuerySnapshot<DocumentData>>[] = [];
            
            for (let i = 0; i < instanceIds.length; i += 10) {
              const batchIds = instanceIds.slice(i, i + 10);
              const sessionsQuery = query(
                sessionsRef,
                where('courseInstanceId', 'in', batchIds)
              );
              sessionBatches.push(getDocs(sessionsQuery));
            }
            
            const sessionResults = await Promise.all(sessionBatches);
            const allSessions = sessionResults.flatMap(snap => snap.docs);
            
            // Group sessions by courseInstanceId
            const sessionsByCourse: { [courseId: string]: string[] } = {};
            allSessions.forEach(doc => {
              const data = doc.data();
              const courseId = data.courseInstanceId;
              if (!sessionsByCourse[courseId]) sessionsByCourse[courseId] = [];
              sessionsByCourse[courseId].push(doc.id);
            });
            
            // Get all attendance records for these sessions
            const allSessionIds = allSessions.map(doc => doc.id);
            const attendanceCounts: { [courseId: string]: number } = {};
            
            for (let i = 0; i < allSessionIds.length; i += 10) {
              const batchIds = allSessionIds.slice(i, i + 10);
              const recordsRef = collection(db, COLLECTIONS.ATTENDANCE_RECORDS);
              const recordsQuery = query(
                recordsRef,
                where('sessionId', 'in', batchIds),
                where('studentId', '==', user.uid),
                where('status', '==', 'present')
              );
              const recordsSnap = await getDocs(recordsQuery);
              
              // Count by course
              recordsSnap.docs.forEach(doc => {
                const sessionId = doc.data().sessionId;
                const courseId = allSessions.find(s => s.id === sessionId)?.data().courseInstanceId;
                if (courseId) {
                  attendanceCounts[courseId] = (attendanceCounts[courseId] || 0) + 1;
                }
              });
            }
            
            // Apply attendance percentages
            courseInstances.forEach(instance => {
              const sessions = sessionsByCourse[instance.id] || [];
              const attended = attendanceCounts[instance.id] || 0;
              instance.attendancePercentage = sessions.length > 0 
                ? (attended / sessions.length) * 100 
                : 0;
            });
          } catch (err) {
            console.error('Error fetching attendance:', err);
            courseInstances.forEach(instance => instance.attendancePercentage = 0);
          }
        }
      } else if (role === 'teacher') {
        // Fetch courses taught by teacher
        const instancesRef = collection(db, COLLECTIONS.COURSE_INSTANCES);
        const instancesQuery = query(
          instancesRef,
          where('teacherIds', 'array-contains', user.uid),
          where('isActive', '==', true)
        );

        const instancesSnap = await getDocs(instancesQuery);
        courseInstances = instancesSnap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as CourseInstanceWithDetails
        );

        // Get total students for all courses in batch
        if (courseInstances.length > 0) {
          const instanceIds = courseInstances.map(inst => inst.id);
          const enrollmentCounts: { [courseId: string]: number } = {};
          
          for (let i = 0; i < instanceIds.length; i += 10) {
            const batchIds = instanceIds.slice(i, i + 10);
            const enrollmentsRef = collection(db, COLLECTIONS.ENROLLMENTS);
            const enrollmentsQuery = query(
              enrollmentsRef,
              where('courseInstanceId', 'in', batchIds)
            );
            const enrollmentsSnap = await getDocs(enrollmentsQuery);
            
            enrollmentsSnap.docs.forEach(doc => {
              const courseId = doc.data().courseInstanceId;
              enrollmentCounts[courseId] = (enrollmentCounts[courseId] || 0) + 1;
            });
          }
          
          courseInstances.forEach(instance => {
            instance.totalStudents = enrollmentCounts[instance.id] || 0;
          });
        }
      } else if (role === 'parent') {
        // Fetch linked student's courses
        const parentData = userData as ParentUserData;
        if (!parentData.linkedStudentId) {
          setCourses([]);
          setEnrollments({});
          setLoading(false);
          return;
        }

        const enrollmentsRef = collection(db, COLLECTIONS.ENROLLMENTS);
        const enrollmentsQuery = query(
          enrollmentsRef,
          where('studentId', '==', parentData.linkedStudentId)
        );

        const enrollmentsSnap = await getDocs(enrollmentsQuery);
        const courseInstanceIds: string[] = [];

        enrollmentsSnap.docs.forEach((doc) => {
          const enrollment = { id: doc.id, ...doc.data() } as Enrollment;
          courseInstanceIds.push(enrollment.courseInstanceId);
          enrollmentMap[enrollment.courseInstanceId] = enrollment;
        });

        if (courseInstanceIds.length === 0) {
          setCourses([]);
          setEnrollments({});
          setLoading(false);
          return;
        }

        // Fetch course instances in batches
        const batches: Promise<QuerySnapshot<DocumentData>>[] = [];
        for (let i = 0; i < courseInstanceIds.length; i += 10) {
          const batch = courseInstanceIds.slice(i, i + 10);
          const instancesRef = collection(db, COLLECTIONS.COURSE_INSTANCES);
          const instancesQuery = query(
            instancesRef,
            where('__name__', 'in', batch)
          );
          batches.push(getDocs(instancesQuery));
        }

        const batchResults = await Promise.all(batches);
        courseInstances = batchResults.flatMap((snap) =>
          snap.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as CourseInstanceWithDetails
          )
        );
      } else if (role === 'admin') {
        // Admins can see all course instances
        const instancesRef = collection(db, COLLECTIONS.COURSE_INSTANCES);
        const instancesQuery = query(
          instancesRef,
          where('isActive', '==', true)
        );

        const instancesSnap = await getDocs(instancesQuery);
        courseInstances = instancesSnap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as CourseInstanceWithDetails
        );

        // Get total students for all courses in batch
        if (courseInstances.length > 0) {
          const instanceIds = courseInstances.map(inst => inst.id);
          const enrollmentCounts: { [courseId: string]: number } = {};
          
          for (let i = 0; i < instanceIds.length; i += 10) {
            const batchIds = instanceIds.slice(i, i + 10);
            const enrollmentsRef = collection(db, COLLECTIONS.ENROLLMENTS);
            const enrollmentsQuery = query(
              enrollmentsRef,
              where('courseInstanceId', 'in', batchIds)
            );
            const enrollmentsSnap = await getDocs(enrollmentsQuery);
            
            enrollmentsSnap.docs.forEach(doc => {
              const courseId = doc.data().courseInstanceId;
              enrollmentCounts[courseId] = (enrollmentCounts[courseId] || 0) + 1;
            });
          }
          
          courseInstances.forEach(instance => {
            instance.totalStudents = enrollmentCounts[instance.id] || 0;
          });
        }
      }

      // Fetch course details and teacher names in batch
      if (courseInstances.length > 0) {
        // Collect all unique courseIds and teacherIds
        const courseIds = [...new Set(courseInstances.map(inst => inst.courseId).filter(Boolean))];
        const teacherIds = [...new Set(courseInstances.flatMap(inst => inst.teacherIds || []))];
        
        // Fetch all courses in batch
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
          courseResults.flatMap(snap => snap.docs).forEach(doc => {
            courseData[doc.id] = { id: doc.id, ...doc.data() } as Course;
          });
        }
        
        // Fetch all teacher names in batch
        const teacherData: { [id: string]: string } = {};
        if (teacherIds.length > 0) {
          const teacherBatches: Promise<QuerySnapshot<DocumentData>>[] = [];
          for (let i = 0; i < teacherIds.length; i += 10) {
            const batchIds = teacherIds.slice(i, i + 10);
            const usersRef = collection(db, COLLECTIONS.USERS);
            const usersQuery = query(usersRef, where('__name__', 'in', batchIds));
            teacherBatches.push(getDocs(usersQuery));
          }
          
          const teacherResults = await Promise.all(teacherBatches);
          teacherResults.flatMap(snap => snap.docs).forEach(doc => {
            teacherData[doc.id] = doc.data().name || 'Unknown';
          });
        }
        
        // Apply data to instances
        courseInstances.forEach(instance => {
          if (instance.courseId && courseData[instance.courseId]) {
            instance.course = courseData[instance.courseId];
          }
          if (instance.teacherIds && instance.teacherIds.length > 0) {
            instance.teacherNames = instance.teacherIds.map(id => teacherData[id] || 'Unknown');
          }
        });
      }

      // Apply search filter if provided
      let filteredCourses = courseInstances;
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredCourses = courseInstances.filter(
          (instance) =>
            instance.course?.name.toLowerCase().includes(query) ||
            instance.course?.courseCode.toLowerCase().includes(query) ||
            instance.section.toLowerCase().includes(query)
        );
      }

      // Only update state if this is still the latest request and not aborted
      if (currentRequestId === requestIdRef.current && !abortController.signal.aborted) {
        setCourses(filteredCourses);
        setEnrollments(enrollmentMap);
        setLoading(false);
      }
    } catch (err: any) {
      // Don't update error state if request was aborted
      if (err.name === 'AbortError' || abortController.signal.aborted) {
        return;
      }
      console.error('Error fetching courses:', err);
      // Only update state if this is still the latest request
      if (currentRequestId === requestIdRef.current) {
        setError(err.message || 'Failed to fetch courses');
        setLoading(false);
      }
    }
  }, [user, userData, role, searchQuery]);

  const refresh = useCallback(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchCourses();
    
    // Cleanup: abort in-flight requests when dependencies change or component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchCourses]);

  return {
    courses,
    enrollments,
    loading,
    error,
    refresh,
  };
}
