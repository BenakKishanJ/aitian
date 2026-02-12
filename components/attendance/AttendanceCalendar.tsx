import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, getAttendanceStatusInfo } from '@/types/constants';
import type { AttendanceStatus } from '@/types';

interface AttendanceCalendarProps {
  courseInstanceId: string;
  studentId?: string;
}

interface DailyAttendance {
  date: string;
  status: AttendanceStatus | null;
  sessionTitle?: string;
}

export function AttendanceCalendar({ courseInstanceId, studentId }: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<Map<string, DailyAttendance>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceData();
  }, [courseInstanceId, studentId, currentMonth]);

  const fetchAttendanceData = async () => {
    if (!courseInstanceId || !studentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get first and last day of current month
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

      // Fetch sessions for this course in the current month
      const sessionsRef = collection(db, COLLECTIONS.ATTENDANCE_SESSIONS);
      const sessionsQuery = query(
        sessionsRef,
        where('courseInstanceId', '==', courseInstanceId),
        where('startedAt', '>=', Timestamp.fromDate(startOfMonth)),
        where('startedAt', '<=', Timestamp.fromDate(endOfMonth))
      );

      const sessionsSnap = await getDocs(sessionsQuery);
      const sessions = sessionsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          startedAt: data.startedAt as Timestamp,
        };
      });

      if (sessions.length === 0) {
        setAttendanceData(new Map());
        setLoading(false);
        return;
      }

      // Fetch attendance records for these sessions
      const sessionIds = sessions.map(s => s.id);
      const recordsRef = collection(db, COLLECTIONS.ATTENDANCE_RECORDS);
      const recordsList: any[] = [];

      // Batch queries (Firestore 'in' limit is 10)
      for (let i = 0; i < sessionIds.length; i += 10) {
        const batchIds = sessionIds.slice(i, i + 10);
        const recordsQuery = query(
          recordsRef,
          where('sessionId', 'in', batchIds),
          where('studentId', '==', studentId)
        );
        const recordsSnap = await getDocs(recordsQuery);
        recordsSnap.docs.forEach(doc => {
          recordsList.push({ id: doc.id, ...doc.data() });
        });
      }

      // Create a map of date -> attendance status
      const attendanceMap = new Map<string, DailyAttendance>();
      
      sessions.forEach(session => {
        const sessionDate = session.startedAt.toDate();
        const dateKey = sessionDate.toISOString().split('T')[0];
        const record = recordsList.find(r => r.sessionId === session.id);
        
        attendanceMap.set(dateKey, {
          date: dateKey,
          status: record?.status || null,
          sessionTitle: session.title || 'Class Session',
        });
      });

      setAttendanceData(attendanceMap);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching attendance calendar data:', err);
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getAttendanceForDate = (day: number): DailyAttendance | null => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateKey = date.toISOString().split('T')[0];
    return attendanceData.get(dateKey) || null;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#6B7280" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Month Navigation */}
      <HStack style={styles.header}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{monthName}</Text>
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <ChevronRight size={24} color="#374151" />
        </TouchableOpacity>
      </HStack>

      {/* Week Days Header */}
      <HStack style={styles.weekDaysHeader}>
        {weekDays.map(day => (
          <View key={day} style={styles.weekDayCell}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </HStack>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {/* Empty cells for days before the first of the month */}
        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
          <View key={`empty-${index}`} style={styles.dayCell} />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const attendance = getAttendanceForDate(day);
          const statusInfo = attendance ? getAttendanceStatusInfo(attendance.status) : null;

          return (
            <View key={`day-${day}`} style={styles.dayCell}>
              <View
                style={[
                  styles.dayContent,
                  attendance?.status && {
                    backgroundColor: statusInfo?.bgColor,
                    borderColor: statusInfo?.color,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    attendance?.status && { color: statusInfo?.color },
                  ]}
                >
                  {day}
                </Text>
                {attendance?.status && (
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: statusInfo?.color },
                    ]}
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <HStack space="md" style={styles.legendRow}>
          {['present', 'absent', 'late', 'excused'].map((status) => {
            const info = getAttendanceStatusInfo(status as AttendanceStatus);
            return (
              <HStack key={status} space="xs" style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: info.color }]} />
                <Text style={styles.legendText}>{info.label}</Text>
              </HStack>
            );
          })}
        </HStack>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  weekDaysHeader: {
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  dayContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  dayText: {
    fontSize: 14,
    color: '#374151',
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  legend: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendRow: {
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  legendItem: {
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
  },
});
