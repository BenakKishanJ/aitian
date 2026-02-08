import { useState, useEffect, useCallback } from 'react';
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

  // Fetch courses based on role
  const fetchCourses = useCallback(async () => {
    if (!user || !userData || !role) {
      setLoading(false);
      return;
    }

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

        // Fetch attendance percentages for each course
        for (const instance of courseInstances) {
          try {
            const sessionsRef = collection(db, COLLECTIONS.ATTENDANCE_SESSIONS);
            const sessionsQuery = query(
              sessionsRef,
              where('courseInstanceId', '==', instance.id)
            );
            const sessionsSnap = await getDocs(sessionsQuery);
            const totalClasses = sessionsSnap.size;

            if (totalClasses > 0) {
              const sessionIds = sessionsSnap.docs.map((doc) => doc.id);
              let attendedCount = 0;

              for (let i = 0; i < sessionIds.length; i += 10) {
                const batchIds = sessionIds.slice(i, i + 10);
                const recordsRef = collection(db, COLLECTIONS.ATTENDANCE_RECORDS);
                const recordsQuery = query(
                  recordsRef,
                  where('sessionId', 'in', batchIds),
                  where('studentId', '==', user.uid),
                  where('status', '==', 'present')
                );
                const recordsSnap = await getDocs(recordsQuery);
                attendedCount += recordsSnap.size;
              }

              instance.attendancePercentage =
                totalClasses > 0 ? (attendedCount / totalClasses) * 100 : 0;
            }
          } catch (err) {
            console.error('Error fetching attendance:', err);
            instance.attendancePercentage = 0;
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

        // Get total students for each course
        for (const instance of courseInstances) {
          const enrollmentsRef = collection(db, COLLECTIONS.ENROLLMENTS);
          const enrollmentsQuery = query(
            enrollmentsRef,
            where('courseInstanceId', '==', instance.id)
          );
          const enrollmentsSnap = await getDocs(enrollmentsQuery);
          instance.totalStudents = enrollmentsSnap.size;
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

        // Get total students for each course
        for (const instance of courseInstances) {
          const enrollmentsRef = collection(db, COLLECTIONS.ENROLLMENTS);
          const enrollmentsQuery = query(
            enrollmentsRef,
            where('courseInstanceId', '==', instance.id)
          );
          const enrollmentsSnap = await getDocs(enrollmentsQuery);
          instance.totalStudents = enrollmentsSnap.size;
        }
      }

      // Fetch course details for all instances
      for (const instance of courseInstances) {
        const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, instance.courseId));
        if (courseDoc.exists()) {
          instance.course = { id: courseDoc.id, ...courseDoc.data() } as Course;
        }

        // Fetch teacher names
        if (instance.teacherIds && instance.teacherIds.length > 0) {
          const teacherNames: string[] = [];
          for (const teacherId of instance.teacherIds) {
            try {
              const teacherDoc = await getDoc(doc(db, COLLECTIONS.USERS, teacherId));
              if (teacherDoc.exists()) {
                teacherNames.push(teacherDoc.data().name || 'Unknown');
              }
            } catch (err) {
              console.error('Error fetching teacher:', err);
            }
          }
          instance.teacherNames = teacherNames;
        }
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

      setCourses(filteredCourses);
      setEnrollments(enrollmentMap);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching courses:', err);
      setError(err.message || 'Failed to fetch courses');
      setLoading(false);
    }
  }, [user, userData, role, searchQuery]);

  const refresh = useCallback(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return {
    courses,
    enrollments,
    loading,
    error,
    refresh,
  };
}
