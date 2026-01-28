import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'class' | 'exam' | 'assignment' | 'personal';
  startTime: Timestamp;
  endTime: Timestamp;
  courseInstanceId?: string;
}

export interface Assignment {
  id: string;
  title: string;
  dueDate: Timestamp;
  courseInstanceId: string;
  courseName?: string;
  submitted: boolean;
}

export interface NewsPost {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  postedBy: string;
  postedByName: string;
  createdAt: Timestamp;
}

export interface AttendanceAlert {
  type: 'low' | 'missed' | 'warning';
  courseName: string;
  percentage: number;
  message: string;
}

export async function getTodaysClasses(userId: string, userRole: string, department?: string, semester?: number, section?: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let eventsQuery;

    if (userRole === 'student') {
      // Students see classes for their department/semester/section
      eventsQuery = query(
        collection(db, 'calendarEvents'),
        where('type', '==', 'class'),
        where('startTime', '>=', Timestamp.fromDate(today)),
        where('startTime', '<', Timestamp.fromDate(tomorrow)),
        orderBy('startTime', 'asc')
      );
    } else if (userRole === 'teacher') {
      // Teachers see their assigned courses
      eventsQuery = query(
        collection(db, 'calendarEvents'),
        where('type', '==', 'class'),
        where('startTime', '>=', Timestamp.fromDate(today)),
        where('startTime', '<', Timestamp.fromDate(tomorrow)),
        orderBy('startTime', 'asc')
      );
    } else {
      // Parents see linked student's classes
      // We'll filter after fetching
      eventsQuery = query(
        collection(db, 'calendarEvents'),
        where('type', '==', 'class'),
        where('startTime', '>=', Timestamp.fromDate(today)),
        where('startTime', '<', Timestamp.fromDate(tomorrow)),
        orderBy('startTime', 'asc')
      );
    }

    const snapshot = await getDocs(eventsQuery);
    const events: CalendarEvent[] = [];

    snapshot.forEach(doc => {
      events.push({
        id: doc.id,
        ...doc.data()
      } as CalendarEvent);
    });

    // TODO: Filter events based on user's courses (will implement after course service)
    return events.slice(0, 5); // Return max 5 events
  } catch (error) {
    console.error('Error fetching today\'s classes:', error);
    return [];
  }
}

export async function getAssignmentDeadlines(userId: string, userRole: string) {
  try {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    let assignmentsQuery;

    if (userRole === 'student') {
      // Students see assignments for their enrolled courses
      assignmentsQuery = query(
        collection(db, 'assignments'),
        where('dueDate', '>=', Timestamp.fromDate(today)),
        where('dueDate', '<=', Timestamp.fromDate(nextWeek)),
        orderBy('dueDate', 'asc'),
        limit(10)
      );
    } else if (userRole === 'teacher') {
      // Teachers see assignments they created
      assignmentsQuery = query(
        collection(db, 'assignments'),
        where('createdBy', '==', userId),
        where('dueDate', '>=', Timestamp.fromDate(today)),
        orderBy('dueDate', 'asc'),
        limit(10)
      );
    } else {
      // Parents see assignments for linked students
      assignmentsQuery = query(
        collection(db, 'assignments'),
        where('dueDate', '>=', Timestamp.fromDate(today)),
        where('dueDate', '<=', Timestamp.fromDate(nextWeek)),
        orderBy('dueDate', 'asc'),
        limit(5)
      );
    }

    const snapshot = await getDocs(assignmentsQuery);
    const assignments: Assignment[] = [];

    snapshot.forEach(async (doc) => {
      const data = doc.data();
      const assignment: Assignment = {
        id: doc.id,
        title: data.title,
        dueDate: data.dueDate,
        courseInstanceId: data.courseInstanceId,
        submitted: false
      };

      // Check if student has submitted (for student role)
      if (userRole === 'student') {
        const submissionQuery = query(
          collection(db, 'submissions'),
          where('assignmentId', '==', doc.id),
          where('studentId', '==', userId)
        );
        const submissionSnap = await getDocs(submissionQuery);
        assignment.submitted = !submissionSnap.empty;
      }

      assignments.push(assignment);
    });

    return assignments;
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return [];
  }
}

export async function getLatestNews(limitCount: number = 5) {
  try {
    const newsQuery = query(
      collection(db, 'newsPosts'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(newsQuery);
    const news: NewsPost[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      news.push({
        id: doc.id,
        ...data
      } as NewsPost);
    });

    // Sort: pinned posts first
    return news.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

export async function getAttendanceAlerts(userId: string, userRole: string) {
  try {
    const alerts: AttendanceAlert[] = [];

    if (userRole === 'student') {
      // For students: Check attendance percentage
      // TODO: Implement attendance percentage calculation
      // Mock data for now
      alerts.push({
        type: 'warning',
        courseName: 'Database Management Systems',
        percentage: 75,
        message: 'Attendance is below 80%'
      });
    } else if (userRole === 'teacher') {
      // For teachers: Recent attendance sessions
      // TODO: Implement teacher alerts
    } else if (userRole === 'parent') {
      // For parents: Linked student alerts
      // TODO: Implement parent alerts
    }

    return alerts;
  } catch (error) {
    console.error('Error fetching attendance alerts:', error);
    return [];
  }
}
