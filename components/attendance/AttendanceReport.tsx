import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { 
  Download, 
  FileText, 
  Users, 
  TrendingUp, 
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, getAttendanceStatusInfo } from '@/types/constants';
import type { AttendanceSession, AttendanceRecord, AttendanceStatus } from '@/types';

interface AttendanceReportProps {
  courseInstanceId: string;
  courseName?: string;
}

interface StudentAttendanceReport {
  studentId: string;
  studentName: string;
  usn?: string;
  totalSessions: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
  status: 'good' | 'warning' | 'critical';
}

export function AttendanceReport({ courseInstanceId, courseName }: AttendanceReportProps) {
  const [report, setReport] = useState<StudentAttendanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);

  useEffect(() => {
    generateReport();
  }, [courseInstanceId]);

  const generateReport = async () => {
    if (!courseInstanceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch all sessions for this course
      const sessionsRef = collection(db, COLLECTIONS.ATTENDANCE_SESSIONS);
      const sessionsQuery = query(
        sessionsRef,
        where('courseInstanceId', '==', courseInstanceId)
      );
      const sessionsSnap = await getDocs(sessionsQuery);
      const sessionsList = sessionsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AttendanceSession[];
      
      setSessions(sessionsList);

      if (sessionsList.length === 0) {
        setReport([]);
        setLoading(false);
        return;
      }

      // Fetch enrolled students
      const enrollmentsRef = collection(db, 'enrollments');
      const enrollmentsQuery = query(
        enrollmentsRef,
        where('courseInstanceId', '==', courseInstanceId)
      );
      const enrollmentsSnap = await getDocs(enrollmentsQuery);
      const studentIds = enrollmentsSnap.docs.map(doc => doc.data().studentId);

      if (studentIds.length === 0) {
        setReport([]);
        setLoading(false);
        return;
      }

      // Fetch student details in batches
      const studentsMap = new Map<string, { name: string; usn?: string }>();
      for (let i = 0; i < studentIds.length; i += 10) {
        const batchIds = studentIds.slice(i, i + 10);
        const usersRef = collection(db, 'users');
        const usersQuery = query(usersRef, where('__name__', 'in', batchIds));
        const usersSnap = await getDocs(usersQuery);
        
        usersSnap.docs.forEach(doc => {
          const data = doc.data();
          studentsMap.set(doc.id, { name: data.name || 'Unknown', usn: data.usn });
        });
      }

      // Fetch all attendance records for these sessions
      const sessionIds = sessionsList.map(s => s.id);
      const recordsRef = collection(db, COLLECTIONS.ATTENDANCE_RECORDS);
      const allRecords: AttendanceRecord[] = [];

      for (let i = 0; i < sessionIds.length; i += 10) {
        const batchIds = sessionIds.slice(i, i + 10);
        const recordsQuery = query(recordsRef, where('sessionId', 'in', batchIds));
        const recordsSnap = await getDocs(recordsQuery);
        recordsSnap.docs.forEach(doc => {
          allRecords.push({ id: doc.id, ...doc.data() } as AttendanceRecord);
        });
      }

      // Generate report for each student
      const studentReports: StudentAttendanceReport[] = [];
      
      for (const studentId of studentIds) {
        const studentData = studentsMap.get(studentId);
        const studentRecords = allRecords.filter(r => r.studentId === studentId);
        
        const present = studentRecords.filter(r => r.status === 'present').length;
        const absent = studentRecords.filter(r => r.status === 'absent').length;
        const late = studentRecords.filter(r => r.status === 'late').length;
        const excused = studentRecords.filter(r => r.status === 'excused').length;
        
        // Calculate percentage (excluding excused from total)
        const effectiveTotal = sessionsList.length - excused;
        const percentage = effectiveTotal > 0 
          ? ((present + late) / effectiveTotal) * 100 
          : 0;

        let status: 'good' | 'warning' | 'critical' = 'good';
        if (percentage < 60) {
          status = 'critical';
        } else if (percentage < 75) {
          status = 'warning';
        }

        studentReports.push({
          studentId,
          studentName: studentData?.name || 'Unknown',
          usn: studentData?.usn,
          totalSessions: sessionsList.length,
          present,
          absent,
          late,
          excused,
          percentage,
          status,
        });
      }

      // Sort by percentage (lowest first)
      studentReports.sort((a, b) => a.percentage - b.percentage);

      setReport(studentReports);
      setLoading(false);
    } catch (err) {
      console.error('Error generating attendance report:', err);
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    if (report.length === 0) {
      Alert.alert('No Data', 'No attendance data to export');
      return;
    }

    const headers = ['Student Name', 'USN', 'Total Sessions', 'Present', 'Absent', 'Late', 'Excused', 'Percentage', 'Status'];
    const rows = report.map(student => [
      student.studentName,
      student.usn || 'N/A',
      student.totalSessions.toString(),
      student.present.toString(),
      student.absent.toString(),
      student.late.toString(),
      student.excused.toString(),
      `${student.percentage.toFixed(2)}%`,
      student.status.toUpperCase(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const fileName = `attendance_report_${courseName?.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;

    try {
      await Share.share({
        message: csvContent,
        title: fileName,
      });
    } catch (err) {
      console.error('Error sharing report:', err);
      Alert.alert('Error', 'Failed to export report');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'critical':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Generating report...</Text>
      </View>
    );
  }

  if (report.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <FileText size={48} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>No Data Available</Text>
        <Text style={styles.emptyText}>
          No attendance records found for this course.
        </Text>
      </View>
    );
  }

  const classAverage = report.length > 0 
    ? report.reduce((sum, s) => sum + s.percentage, 0) / report.length 
    : 0;

  const atRiskStudents = report.filter(s => s.status === 'critical').length;
  const warningStudents = report.filter(s => s.status === 'warning').length;

  return (
    <View style={styles.container}>
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <HStack space="sm" style={styles.summaryItem}>
            <Users size={20} color="#6B7280" />
            <VStack>
              <Text style={styles.summaryValue}>{report.length}</Text>
              <Text style={styles.summaryLabel}>Total Students</Text>
            </VStack>
          </HStack>
        </View>

        <View style={styles.summaryCard}>
          <HStack space="sm" style={styles.summaryItem}>
            <TrendingUp size={20} color="#6B7280" />
            <VStack>
              <Text style={styles.summaryValue}>{classAverage.toFixed(1)}%</Text>
              <Text style={styles.summaryLabel}>Class Average</Text>
            </VStack>
          </HStack>
        </View>

        <View style={styles.summaryCard}>
          <HStack space="sm" style={styles.summaryItem}>
            <Calendar size={20} color="#6B7280" />
            <VStack>
              <Text style={styles.summaryValue}>{sessions.length}</Text>
              <Text style={styles.summaryLabel}>Total Sessions</Text>
            </VStack>
          </HStack>
        </View>
      </View>

      {/* At Risk Alert */}
      {(atRiskStudents > 0 || warningStudents > 0) && (
        <View style={styles.alertContainer}>
          <Text style={styles.alertTitle}>Attendance Alerts</Text>
          {atRiskStudents > 0 && (
            <Text style={styles.alertText}>
              {atRiskStudents} student{atRiskStudents !== 1 ? 's' : ''} with attendance below 60%
            </Text>
          )}
          {warningStudents > 0 && (
            <Text style={styles.alertText}>
              {warningStudents} student{warningStudents !== 1 ? 's' : ''} with attendance below 75%
            </Text>
          )}
        </View>
      )}

      {/* Export Button */}
      <TouchableOpacity style={styles.exportButton} onPress={exportToCSV}>
        <HStack space="sm" style={styles.exportButtonContent}>
          <Download size={20} color="#FFFFFF" />
          <Text style={styles.exportButtonText}>Export to CSV</Text>
        </HStack>
      </TouchableOpacity>

      {/* Student List */}
      <ScrollView style={styles.studentList}>
        <Text style={styles.sectionTitle}>Student Attendance</Text>
        
        {report.map((student) => (
          <TouchableOpacity
            key={student.studentId}
            style={styles.studentCard}
            onPress={() => setExpandedStudent(
              expandedStudent === student.studentId ? null : student.studentId
            )}
          >
            <HStack style={styles.studentHeader}>
              <VStack style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.studentName}</Text>
                {student.usn && (
                  <Text style={styles.studentUsn}>{student.usn}</Text>
                )}
              </VStack>
              
              <View style={styles.percentageContainer}>
                <Text 
                  style={[
                    styles.percentageText, 
                    { color: getStatusColor(student.status) }
                  ]}
                >
                  {student.percentage.toFixed(1)}%
                </Text>
                {expandedStudent === student.studentId ? (
                  <ChevronUp size={16} color="#6B7280" />
                ) : (
                  <ChevronDown size={16} color="#6B7280" />
                )}
              </View>
            </HStack>

            {expandedStudent === student.studentId && (
              <View style={styles.detailsContainer}>
                <HStack style={styles.statsRow}>
                  <View style={[styles.statBox, { backgroundColor: '#D1FAE5' }]}>
                    <Text style={[styles.statValue, { color: '#059669' }]}>
                      {student.present}
                    </Text>
                    <Text style={[styles.statLabel, { color: '#059669' }]}>Present</Text>
                  </View>
                  
                  <View style={[styles.statBox, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={[styles.statValue, { color: '#DC2626' }]}>
                      {student.absent}
                    </Text>
                    <Text style={[styles.statLabel, { color: '#DC2626' }]}>Absent</Text>
                  </View>
                  
                  <View style={[styles.statBox, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.statValue, { color: '#D97706' }]}>
                      {student.late}
                    </Text>
                    <Text style={[styles.statLabel, { color: '#D97706' }]}>Late</Text>
                  </View>
                  
                  <View style={[styles.statBox, { backgroundColor: '#EDE9FE' }]}>
                    <Text style={[styles.statValue, { color: '#7C3AED' }]}>
                      {student.excused}
                    </Text>
                    <Text style={[styles.statLabel, { color: '#7C3AED' }]}>Excused</Text>
                  </View>
                </HStack>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Sessions:</Text>
                  <Text style={styles.totalValue}>{student.totalSessions}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  alertContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 12,
    color: '#B45309',
  },
  exportButton: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  exportButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  studentList: {
    flex: 1,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  studentHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  studentUsn: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '700',
  },
  detailsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statsRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  totalLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
});
