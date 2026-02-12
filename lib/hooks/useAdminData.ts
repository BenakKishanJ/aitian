import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';

export interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  activeUsers: number;
  totalCourses: number;
  totalCourseInstances: number;
  totalDepartments: number;
  pendingApprovals: number;
  totalAssignments: number;
  todayClasses: number;
  recentLogins: number;
}

export interface RecentActivity {
  id: string;
  type: 'user_registered' | 'course_created' | 'assignment_submitted' | 'attendance_marked' | 'announcement_posted';
  description: string;
  userName: string;
  timestamp: Timestamp;
}

export interface DepartmentStats {
  id: string;
  name: string;
  studentCount: number;
  teacherCount: number;
  courseCount: number;
}

export function useAdminData() {
  const { user, userData, role } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    activeUsers: 0,
    totalCourses: 0,
    totalCourseInstances: 0,
    totalDepartments: 0,
    pendingApprovals: 0,
    totalAssignments: 0,
    todayClasses: 0,
    recentLogins: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    if (!user || role !== 'admin') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get user counts by role
      const usersRef = collection(db, 'users');
      
      const [studentsSnap, teachersSnap, parentsSnap, adminsSnap] = await Promise.all([
        getCountFromServer(query(usersRef, where('role', '==', 'student'))),
        getCountFromServer(query(usersRef, where('role', '==', 'teacher'))),
        getCountFromServer(query(usersRef, where('role', '==', 'parent'))),
        getCountFromServer(query(usersRef, where('role', '==', 'admin'))),
      ]);

      const totalStudents = studentsSnap.data().count;
      const totalTeachers = teachersSnap.data().count;
      const totalParents = parentsSnap.data().count;
      const totalAdmins = adminsSnap.data().count;

      // Get active users (isActive: true)
      const activeUsersSnap = await getCountFromServer(
        query(usersRef, where('isActive', '==', true))
      );

      // Get courses count
      const coursesSnap = await getCountFromServer(collection(db, 'courses'));

      // Get course instances count
      const courseInstancesSnap = await getCountFromServer(
        query(collection(db, 'courseInstances'), where('isActive', '==', true))
      );

      // Get departments count
      const departmentsSnap = await getCountFromServer(collection(db, 'departments'));

      // Get pending approvals (parent links + course requests with status pending)
      const pendingParentLinksSnap = await getCountFromServer(
        query(collection(db, 'parentLinks'), where('status', '==', 'pending'))
      );

      const pendingCourseRequestsSnap = await getCountFromServer(
        query(collection(db, 'courseRequests'), where('status', '==', 'pending'))
      );

      const totalPendingApprovals = pendingParentLinksSnap.data().count + pendingCourseRequestsSnap.data().count;

      // Get total assignments
      const assignmentsSnap = await getCountFromServer(collection(db, 'assignments'));

      // Get today's classes
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayClassesSnap = await getCountFromServer(
        query(
          collection(db, 'calendarEvents'),
          where('type', '==', 'class'),
          where('startTime', '>=', Timestamp.fromDate(today)),
          where('startTime', '<', Timestamp.fromDate(tomorrow))
        )
      );

      // Get recent logins (users who logged in within last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      setStats({
        totalUsers: totalStudents + totalTeachers + totalParents + totalAdmins,
        totalStudents,
        totalTeachers,
        totalParents,
        activeUsers: activeUsersSnap.data().count,
        totalCourses: coursesSnap.data().count,
        totalCourseInstances: courseInstancesSnap.data().count,
        totalDepartments: departmentsSnap.data().count,
        pendingApprovals: totalPendingApprovals,
        totalAssignments: assignmentsSnap.data().count,
        todayClasses: todayClassesSnap.data().count,
        recentLogins: 0, // Would need lastLogin field
      });

      // Fetch department stats
      const departmentsRef = collection(db, 'departments');
      const departmentsQuery = query(departmentsRef, where('isActive', '==', true));
      const departmentsData = await getDocs(departmentsQuery);

      const deptStats: DepartmentStats[] = [];
      for (const deptDoc of departmentsData.docs) {
        const deptData = deptDoc.data();
        
        // Count students in department
        const deptStudentsSnap = await getCountFromServer(
          query(usersRef, where('role', '==', 'student'), where('departmentId', '==', deptDoc.id))
        );

        // Count teachers in department
        const deptTeachersSnap = await getCountFromServer(
          query(usersRef, where('role', '==', 'teacher'), where('departmentId', '==', deptDoc.id))
        );

        // Count courses in department
        const deptCoursesSnap = await getCountFromServer(
          query(collection(db, 'courses'), where('departmentId', '==', deptDoc.id))
        );

        deptStats.push({
          id: deptDoc.id,
          name: deptData.name,
          studentCount: deptStudentsSnap.data().count,
          teacherCount: deptTeachersSnap.data().count,
          courseCount: deptCoursesSnap.data().count,
        });
      }

      setDepartmentStats(deptStats);

      // Fetch recent activity
      // For now, we'll use recent user registrations and course creations
      const recentUsersQuery = query(usersRef, where('createdAt', '>=', Timestamp.fromDate(yesterday)));
      const recentUsersSnap = await getDocs(recentUsersQuery);

      const activity: RecentActivity[] = recentUsersSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: `user_${doc.id}`,
          type: 'user_registered',
          description: `New ${data.role} registered`,
          userName: data.name,
          timestamp: data.createdAt,
        };
      });

      setRecentActivity(activity.slice(0, 10));
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setError(err.message || 'Failed to fetch admin data');
      setLoading(false);
    }
  };

  const refresh = async () => {
    await fetchAdminData();
  };

  useEffect(() => {
    fetchAdminData();
  }, [user, role]);

  return {
    stats,
    recentActivity,
    departmentStats,
    loading,
    error,
    refresh,
  };
}
