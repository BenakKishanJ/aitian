import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { ExpandedEvent } from './useCalendarEvents';

export interface HomeStats {
  // Student stats
  attendancePercentage?: number;
  pendingAssignments?: number;
  enrolledCourses?: number;
  todayClasses?: number;

  // Teacher stats
  classesToday?: number;
  pendingGradings?: number;
  totalStudents?: number;
  activeCourses?: number;

  // Admin stats
  totalStudentsCount?: number;
  totalTeachersCount?: number;
  totalCoursesCount?: number;
  activeUsers?: number;

  // Parent stats (child's stats)
  childAttendance?: number;
  childPendingAssignments?: number;
  childTodayClasses?: number;
  childOverallPerformance?: number;
}

export interface TodayClass {
  id: string;
  title: string;
  courseName: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  isNext: boolean;
  isPast: boolean;
  hasAttendance: boolean;
}

export interface UpcomingAssignment {
  id: string;
  title: string;
  courseName: string;
  courseInstanceId: string;
  dueDate: Date;
  isOverdue: boolean;
}

export interface RecentAnnouncement {
  id: string;
  title: string;
  content: string;
  authorName: string;
  timestamp: Date;
  isPinned: boolean;
}

export interface HomeData {
  stats: HomeStats;
  todayClasses: TodayClass[];
  upcomingAssignments: UpcomingAssignment[];
  recentAnnouncements: RecentAnnouncement[];
  attendanceAlert: boolean;
  loading: boolean;
  error: string | null;
}

export function useHomeData() {
  const { user, userData, role } = useAuth();
  const [data, setData] = useState<HomeData>({
    stats: {},
    todayClasses: [],
    upcomingAssignments: [],
    recentAnnouncements: [],
    attendanceAlert: false,
    loading: true,
    error: null,
  });

  const fetchStudentData = async () => {
    if (!user || !userData) return;

    try {
      const stats: HomeStats = {};

      // Get enrolled courses
      const enrollmentsRef = collection(db, 'enrollments');
      const enrollmentsQuery = query(
        enrollmentsRef,
        where('studentId', '==', user.uid)
      );
      const enrollmentsSnap = await getDocs(enrollmentsQuery);
      const courseInstanceIds = enrollmentsSnap.docs.map(
        (doc) => doc.data().courseInstanceId
      );
      stats.enrolledCourses = courseInstanceIds.length;

      // Get today's classes
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const eventsRef = collection(db, 'calendarEvents');
      const eventsQuery = query(
        eventsRef,
        where('type', '==', 'class'),
        where('startTime', '>=', Timestamp.fromDate(today)),
        where('startTime', '<', Timestamp.fromDate(tomorrow)),
        orderBy('startTime', 'asc')
      );
      const eventsSnap = await getDocs(eventsQuery);

      const now = new Date();
      const todayClasses: TodayClass[] = [];
      let nextClassFound = false;

      eventsSnap.forEach((doc) => {
        const eventData = doc.data();
        const startTime = eventData.startTime.toDate();
        const endTime = eventData.endTime.toDate();
        const isPast = endTime < now;
        const isNext = !isPast && !nextClassFound;

        if (isNext) nextClassFound = true;

        todayClasses.push({
          id: doc.id,
          title: eventData.title,
          courseName: eventData.courseName || 'Course',
          startTime,
          endTime,
          location: eventData.location,
          isNext,
          isPast,
          hasAttendance: eventData.isAttendanceEnabled || false,
        });
      });

      stats.todayClasses = todayClasses.length;

      // Get pending assignments
      const assignmentsRef = collection(db, 'assignments');
      const assignmentsQuery = query(
        assignmentsRef,
        where('dueDate', '>=', Timestamp.now()),
        orderBy('dueDate', 'asc'),
        limit(10)
      );
      const assignmentsSnap = await getDocs(assignmentsQuery);

      const upcomingAssignments: UpcomingAssignment[] = [];
      let pendingCount = 0;

      for (const doc of assignmentsSnap.docs) {
        const assignmentData = doc.data();

        // Check if student has submitted
        const submissionsRef = collection(db, 'submissions');
        const submissionQuery = query(
          submissionsRef,
          where('assignmentId', '==', doc.id),
          where('studentId', '==', user.uid)
        );
        const submissionSnap = await getDocs(submissionQuery);

        if (submissionSnap.empty) {
          pendingCount++;
          const dueDate = assignmentData.dueDate.toDate();

          if (upcomingAssignments.length < 5) {
            upcomingAssignments.push({
              id: doc.id,
              title: assignmentData.title,
              courseName: assignmentData.courseName || 'Course',
              courseInstanceId: assignmentData.courseInstanceId,
              dueDate,
              isOverdue: dueDate < now,
            });
          }
        }
      }

      stats.pendingAssignments = pendingCount;

      // Calculate attendance percentage
      const attendanceRef = collection(db, 'attendanceRecords');
      const attendanceQuery = query(
        attendanceRef,
        where('studentId', '==', user.uid)
      );
      const attendanceSnap = await getDocs(attendanceQuery);

      let presentCount = 0;
      let totalCount = attendanceSnap.size;

      attendanceSnap.forEach((doc) => {
        if (doc.data().status === 'present') {
          presentCount++;
        }
      });

      const attendancePercentage =
        totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 100;
      stats.attendancePercentage = attendancePercentage;

      // Get recent announcements
      const recentAnnouncements = await fetchAnnouncements();

      setData({
        stats,
        todayClasses,
        upcomingAssignments,
        recentAnnouncements,
        attendanceAlert: attendancePercentage < 75,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching student data:', error);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load data',
      }));
    }
  };

  const fetchTeacherData = async () => {
    if (!user || !userData) return;

    try {
      const stats: HomeStats = {};

      // Get courses taught
      const courseInstancesRef = collection(db, 'courseInstances');
      const coursesQuery = query(
        courseInstancesRef,
        where('teacherIds', 'array-contains', user.uid),
        where('isActive', '==', true)
      );
      const coursesSnap = await getDocs(coursesQuery);
      stats.activeCourses = coursesSnap.size;

      // Get today's classes
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const eventsRef = collection(db, 'calendarEvents');
      const eventsQuery = query(
        eventsRef,
        where('type', '==', 'class'),
        where('createdBy', '==', user.uid),
        where('startTime', '>=', Timestamp.fromDate(today)),
        where('startTime', '<', Timestamp.fromDate(tomorrow)),
        orderBy('startTime', 'asc')
      );
      const eventsSnap = await getDocs(eventsQuery);

      const now = new Date();
      const todayClasses: TodayClass[] = [];
      let nextClassFound = false;

      eventsSnap.forEach((doc) => {
        const eventData = doc.data();
        const startTime = eventData.startTime.toDate();
        const endTime = eventData.endTime.toDate();
        const isPast = endTime < now;
        const isNext = !isPast && !nextClassFound;

        if (isNext) nextClassFound = true;

        todayClasses.push({
          id: doc.id,
          title: eventData.title,
          courseName: eventData.courseName || 'Course',
          startTime,
          endTime,
          location: eventData.location,
          isNext,
          isPast,
          hasAttendance: eventData.isAttendanceEnabled || false,
        });
      });

      stats.classesToday = todayClasses.length;

      // Get pending gradings count
      const submissionsRef = collection(db, 'submissions');
      const submissionsQuery = query(
        submissionsRef,
        where('grade', '==', null)
      );
      const submissionsSnap = await getDocs(submissionsQuery);

      // Filter by teacher's courses
      let pendingGradings = 0;
      const courseInstanceIds = coursesSnap.docs.map((doc) => doc.id);

      for (const submissionDoc of submissionsSnap.docs) {
        const assignmentId = submissionDoc.data().assignmentId;
        const assignmentDoc = await getDocs(
          query(
            collection(db, 'assignments'),
            where('__name__', '==', assignmentId),
            where('createdBy', '==', user.uid)
          )
        );
        if (!assignmentDoc.empty) {
          pendingGradings++;
        }
      }

      stats.pendingGradings = pendingGradings;

      // Get total students count
      const enrollmentsRef = collection(db, 'enrollments');
      const enrollmentsQuery = query(
        enrollmentsRef,
        where('courseInstanceId', 'in', courseInstanceIds.slice(0, 10))
      );
      const enrollmentsSnap = await getDocs(enrollmentsQuery);
      const uniqueStudents = new Set(
        enrollmentsSnap.docs.map((doc) => doc.data().studentId)
      );
      stats.totalStudents = uniqueStudents.size;

      // Get recent announcements
      const recentAnnouncements = await fetchAnnouncements();

      setData({
        stats,
        todayClasses,
        upcomingAssignments: [],
        recentAnnouncements,
        attendanceAlert: false,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching teacher data:', error);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load data',
      }));
    }
  };

  const fetchAdminData = async () => {
    if (!user || !userData) return;

    try {
      const stats: HomeStats = {};

      // Get total students
      const studentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        where('isActive', '==', true)
      );
      const studentsSnap = await getDocs(studentsQuery);
      stats.totalStudentsCount = studentsSnap.size;

      // Get total teachers
      const teachersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'teacher'),
        where('isActive', '==', true)
      );
      const teachersSnap = await getDocs(teachersQuery);
      stats.totalTeachersCount = teachersSnap.size;

      // Get active courses
      const coursesQuery = query(
        collection(db, 'courseInstances'),
        where('isActive', '==', true)
      );
      const coursesSnap = await getDocs(coursesQuery);
      stats.totalCoursesCount = coursesSnap.size;

      // Get active users (logged in recently)
      stats.activeUsers =
        stats.totalStudentsCount! + stats.totalTeachersCount!;

      // Get recent announcements
      const recentAnnouncements = await fetchAnnouncements();

      setData({
        stats,
        todayClasses: [],
        upcomingAssignments: [],
        recentAnnouncements,
        attendanceAlert: false,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load data',
      }));
    }
  };

  const fetchParentData = async () => {
    if (!user || !userData || !userData.linkedStudentId) return;

    try {
      const studentId = userData.linkedStudentId;
      const stats: HomeStats = {};

      // Get child's attendance
      const attendanceRef = collection(db, 'attendanceRecords');
      const attendanceQuery = query(
        attendanceRef,
        where('studentId', '==', studentId)
      );
      const attendanceSnap = await getDocs(attendanceQuery);

      let presentCount = 0;
      let totalCount = attendanceSnap.size;

      attendanceSnap.forEach((doc) => {
        if (doc.data().status === 'present') {
          presentCount++;
        }
      });

      const attendancePercentage =
        totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 100;
      stats.childAttendance = attendancePercentage;

      // Get child's pending assignments
      const assignmentsRef = collection(db, 'assignments');
      const assignmentsQuery = query(
        assignmentsRef,
        where('dueDate', '>=', Timestamp.now())
      );
      const assignmentsSnap = await getDocs(assignmentsQuery);

      let pendingCount = 0;
      for (const doc of assignmentsSnap.docs) {
        const submissionsRef = collection(db, 'submissions');
        const submissionQuery = query(
          submissionsRef,
          where('assignmentId', '==', doc.id),
          where('studentId', '==', studentId)
        );
        const submissionSnap = await getDocs(submissionQuery);

        if (submissionSnap.empty) {
          pendingCount++;
        }
      }

      stats.childPendingAssignments = pendingCount;

      // Get child's today classes
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const eventsRef = collection(db, 'calendarEvents');
      const eventsQuery = query(
        eventsRef,
        where('type', '==', 'class'),
        where('startTime', '>=', Timestamp.fromDate(today)),
        where('startTime', '<', Timestamp.fromDate(tomorrow))
      );
      const eventsSnap = await getDocs(eventsQuery);

      const todayClasses: TodayClass[] = [];
      const now = new Date();
      let nextClassFound = false;

      eventsSnap.forEach((doc) => {
        const eventData = doc.data();
        const startTime = eventData.startTime.toDate();
        const endTime = eventData.endTime.toDate();
        const isPast = endTime < now;
        const isNext = !isPast && !nextClassFound;

        if (isNext) nextClassFound = true;

        todayClasses.push({
          id: doc.id,
          title: eventData.title,
          courseName: eventData.courseName || 'Course',
          startTime,
          endTime,
          location: eventData.location,
          isNext,
          isPast,
          hasAttendance: eventData.isAttendanceEnabled || false,
        });
      });

      stats.childTodayClasses = todayClasses.length;

      // Get recent announcements
      const recentAnnouncements = await fetchAnnouncements();

      setData({
        stats,
        todayClasses,
        upcomingAssignments: [],
        recentAnnouncements,
        attendanceAlert: attendancePercentage < 75,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching parent data:', error);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load data',
      }));
    }
  };

  const fetchAnnouncements = async (): Promise<RecentAnnouncement[]> => {
    try {
      const postsRef = collection(db, 'newsPosts');
      const postsQuery = query(
        postsRef,
        orderBy('isPinned', 'desc'),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      const postsSnap = await getDocs(postsQuery);

      const announcements: RecentAnnouncement[] = [];
      postsSnap.forEach((doc) => {
        const data = doc.data();
        announcements.push({
          id: doc.id,
          title: data.title || 'Announcement',
          content: data.content || '',
          authorName: data.authorName || 'Admin',
          timestamp: data.createdAt?.toDate() || new Date(),
          isPinned: data.isPinned || false,
        });
      });

      return announcements;
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }
  };

  const refresh = async () => {
    setData((prev) => ({ ...prev, loading: true, error: null }));
    await fetchData();
  };

  const fetchData = async () => {
    if (!user || !role) {
      setData((prev) => ({ ...prev, loading: false }));
      return;
    }

    switch (role) {
      case 'student':
        await fetchStudentData();
        break;
      case 'teacher':
        await fetchTeacherData();
        break;
      case 'admin':
        await fetchAdminData();
        break;
      case 'parent':
        await fetchParentData();
        break;
      default:
        setData((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, role]);

  return { ...data, refresh };
}
