import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import {
  getTodaysClasses,
  getAssignmentDeadlines,
  getLatestNews,
  getAttendanceAlerts,
  CalendarEvent,
  Assignment,
  NewsPost,
  AttendanceAlert
} from '@/lib/firestore/services/homeService';

interface HomeData {
  todaysClasses: CalendarEvent[];
  assignmentDeadlines: Assignment[];
  latestNews: NewsPost[];
  attendanceAlerts: AttendanceAlert[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useHomeData(): HomeData {
  const { firebaseUser, userData, role } = useAuth();
  const [todaysClasses, setTodaysClasses] = useState<CalendarEvent[]>([]);
  const [assignmentDeadlines, setAssignmentDeadlines] = useState<Assignment[]>([]);
  const [latestNews, setLatestNews] = useState<NewsPost[]>([]);
  const [attendanceAlerts, setAttendanceAlerts] = useState<AttendanceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!firebaseUser || !userData) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [
        classes,
        assignments,
        news,
        alerts
      ] = await Promise.all([
        getTodaysClasses(firebaseUser.uid, role || 'student', userData.department, userData.semester, userData.section),
        getAssignmentDeadlines(firebaseUser.uid, role || 'student'),
        getLatestNews(5),
        getAttendanceAlerts(firebaseUser.uid, role || 'student')
      ]);

      setTodaysClasses(classes);
      setAssignmentDeadlines(assignments);
      setLatestNews(news);
      setAttendanceAlerts(alerts);
    } catch (err: any) {
      console.error('Error loading home data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [firebaseUser?.uid, role]);

  return {
    todaysClasses,
    assignmentDeadlines,
    latestNews,
    attendanceAlerts,
    loading,
    error,
    refresh: loadData
  };
}
