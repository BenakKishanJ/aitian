import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import type {
  Course,
  CourseInstance,
  CourseInstanceWithDetails,
  CourseFilterOptions,
  ParentUserData,
} from "@/types";

export type { Course, CourseInstance, CourseInstanceWithDetails, CourseFilterOptions };

export interface UseCourseOptions extends CourseFilterOptions {
  pageSize?: number;
}

export function useCourses(options: UseCourseOptions = {}) {
  const { user, userData, role } = useAuth();
  const { semester, searchQuery, pageSize = 20 } = options;

  const [courses, setCourses] = useState<CourseInstanceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);

  // Fetch courses based on role
  const fetchCourses = async (loadMore = false) => {
    if (!user || !userData || !role) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let courseInstances: CourseInstanceWithDetails[] = [];

      if (role === "student") {
        // Fetch student's enrollments
        const enrollmentsRef = collection(db, "enrollments");
        let enrollmentsQuery = query(
          enrollmentsRef,
          where("studentId", "==", user.uid),
        );

        // Filter by semester if specified
        if (semester !== null && semester !== undefined) {
          // We need to get courseInstance first to filter by semester
          // So we'll fetch all enrollments and filter after joining
        }

        const enrollmentsSnap = await getDocs(enrollmentsQuery);

        const courseInstanceIds = enrollmentsSnap.docs.map(
          (doc) => doc.data().courseInstanceId,
        );

        if (courseInstanceIds.length === 0) {
          setCourses([]);
          setLoading(false);
          setHasMore(false);
          return;
        }

        // Fetch course instances
        // Note: Firestore 'in' queries have a limit of 10 items
        const batches = [];
        for (let i = 0; i < courseInstanceIds.length; i += 10) {
          const batch = courseInstanceIds.slice(i, i + 10);
          const instancesRef = collection(db, "courseInstances");
          const instancesQuery = query(
            instancesRef,
            where("__name__", "in", batch),
          );
          batches.push(getDocs(instancesQuery));
        }

        const batchResults = await Promise.all(batches);
        const allInstances = batchResults.flatMap((snap) =>
          snap.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as CourseInstanceWithDetails,
          ),
        );

        // Filter by semester if specified
        courseInstances = allInstances.filter((instance) => {
          if (semester !== null && semester !== undefined) {
            return instance.semester === semester;
          }
          return true;
        });

        // Fetch attendance percentages for each course
        for (const instance of courseInstances) {
          try {
            // Get total sessions
            const sessionsRef = collection(db, "attendanceSessions");
            const sessionsQuery = query(
              sessionsRef,
              where("courseInstanceId", "==", instance.id),
            );
            const sessionsSnap = await getDocs(sessionsQuery);
            const totalClasses = sessionsSnap.size;

            if (totalClasses > 0) {
              // Get attended sessions
              const sessionIds = sessionsSnap.docs.map((doc) => doc.id);
              let attendedCount = 0;

              // Batch check attendance records
              for (let i = 0; i < sessionIds.length; i += 10) {
                const batchIds = sessionIds.slice(i, i + 10);
                const recordsRef = collection(db, "attendanceRecords");
                const recordsQuery = query(
                  recordsRef,
                  where("sessionId", "in", batchIds),
                  where("studentId", "==", user.uid),
                  where("status", "==", "present"),
                );
                const recordsSnap = await getDocs(recordsQuery);
                attendedCount += recordsSnap.size;
              }

              instance.attendancePercentage =
                totalClasses > 0 ? (attendedCount / totalClasses) * 100 : 0;
            }
          } catch (err) {
            console.error("Error fetching attendance:", err);
            instance.attendancePercentage = 0;
          }
        }
      } else if (role === "teacher") {
        // Fetch courses taught by teacher
        const instancesRef = collection(db, "courseInstances");
        let instancesQuery = query(
          instancesRef,
          where("teacherIds", "array-contains", user.uid),
          where("isActive", "==", true),
          orderBy("semester"),
          orderBy("section"),
        );

        if (semester !== null && semester !== undefined) {
          instancesQuery = query(
            instancesRef,
            where("teacherIds", "array-contains", user.uid),
            where("semester", "==", semester),
            where("isActive", "==", true),
            orderBy("section"),
          );
        }

        const instancesSnap = await getDocs(instancesQuery);
        courseInstances = instancesSnap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as CourseInstanceWithDetails,
        );

        // Get total students for each course
        for (const instance of courseInstances) {
          const enrollmentsRef = collection(db, "enrollments");
          const enrollmentsQuery = query(
            enrollmentsRef,
            where("courseInstanceId", "==", instance.id),
          );
          const enrollmentsSnap = await getDocs(enrollmentsQuery);
          instance.totalStudents = enrollmentsSnap.size;
        }
      } else if (role === "parent") {
        // Fetch linked student's courses
        // Cast to ParentUserData to access linkedStudentId
        const parentData = userData as ParentUserData;
        if (!parentData.linkedStudentId) {
          setCourses([]);
          setLoading(false);
          setHasMore(false);
          return;
        }

        const enrollmentsRef = collection(db, "enrollments");
        const enrollmentsQuery = query(
          enrollmentsRef,
          where("studentId", "==", parentData.linkedStudentId),
        );

        const enrollmentsSnap = await getDocs(enrollmentsQuery);
        const courseInstanceIds = enrollmentsSnap.docs.map(
          (doc) => doc.data().courseInstanceId,
        );

        if (courseInstanceIds.length === 0) {
          setCourses([]);
          setLoading(false);
          setHasMore(false);
          return;
        }

        // Fetch course instances in batches
        const batches = [];
        for (let i = 0; i < courseInstanceIds.length; i += 10) {
          const batch = courseInstanceIds.slice(i, i + 10);
          const instancesRef = collection(db, "courseInstances");
          const instancesQuery = query(
            instancesRef,
            where("__name__", "in", batch),
          );
          batches.push(getDocs(instancesQuery));
        }

        const batchResults = await Promise.all(batches);
        const allInstances = batchResults.flatMap((snap) =>
          snap.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as CourseInstanceWithDetails,
          ),
        );

        courseInstances = allInstances.filter((instance) => {
          if (semester !== null && semester !== undefined) {
            return instance.semester === semester;
          }
          return true;
        });
      } else if (role === "admin") {
        // Admins can see all course instances
        const instancesRef = collection(db, "courseInstances");
        let instancesQuery = query(
          instancesRef,
          where("isActive", "==", true),
          orderBy("semester"),
          orderBy("section"),
          limit(pageSize),
        );

        if (semester !== null && semester !== undefined) {
          instancesQuery = query(
            instancesRef,
            where("semester", "==", semester),
            where("isActive", "==", true),
            orderBy("section"),
            limit(pageSize),
          );
        }

        if (loadMore && lastDoc) {
          instancesQuery = query(
            instancesRef,
            where("isActive", "==", true),
            orderBy("semester"),
            orderBy("section"),
            startAfter(lastDoc),
            limit(pageSize),
          );

          if (semester !== null && semester !== undefined) {
            instancesQuery = query(
              instancesRef,
              where("semester", "==", semester),
              where("isActive", "==", true),
              orderBy("section"),
              startAfter(lastDoc),
              limit(pageSize),
            );
          }
        }

        const instancesSnap = await getDocs(instancesQuery);
        courseInstances = instancesSnap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as CourseInstanceWithDetails,
        );

        if (instancesSnap.docs.length > 0) {
          setLastDoc(instancesSnap.docs[instancesSnap.docs.length - 1]);
        }
        setHasMore(instancesSnap.docs.length === pageSize);

        // Get total students for each course
        for (const instance of courseInstances) {
          const enrollmentsRef = collection(db, "enrollments");
          const enrollmentsQuery = query(
            enrollmentsRef,
            where("courseInstanceId", "==", instance.id),
          );
          const enrollmentsSnap = await getDocs(enrollmentsQuery);
          instance.totalStudents = enrollmentsSnap.size;
        }
      }

      // Fetch course details for all instances
      for (const instance of courseInstances) {
        const courseDoc = await getDoc(doc(db, "courses", instance.courseId));
        if (courseDoc.exists()) {
          instance.course = { id: courseDoc.id, ...courseDoc.data() } as Course;
        }

        // Fetch teacher names
        if (instance.teacherIds && instance.teacherIds.length > 0) {
          const teacherNames = [];
          for (const teacherId of instance.teacherIds) {
            try {
              const teacherDoc = await getDoc(doc(db, "users", teacherId));
              if (teacherDoc.exists()) {
                teacherNames.push(teacherDoc.data().name || "Unknown");
              }
            } catch (err) {
              console.error("Error fetching teacher:", err);
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
            instance.section.toLowerCase().includes(query),
        );
      }

      if (loadMore) {
        setCourses((prev) => [...prev, ...filteredCourses]);
      } else {
        setCourses(filteredCourses);
      }

      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching courses:", err);
      setError(err.message || "Failed to fetch courses");
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading && role === "admin") {
      fetchCourses(true);
    }
  };

  const refresh = () => {
    setLastDoc(null);
    setHasMore(true);
    fetchCourses(false);
  };

  useEffect(() => {
    fetchCourses(false);
  }, [user, userData, role, semester, searchQuery]);

  return {
    courses,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
