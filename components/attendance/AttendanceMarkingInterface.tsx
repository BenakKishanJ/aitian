import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Check, X, Users, CheckCircle2, XCircle, MinusCircle } from 'lucide-react-native';
import { useAttendanceMarking } from '@/lib/hooks/useAttendanceMarking';
import type { AttendanceStatus } from '@/types';

interface AttendanceMarkingInterfaceProps {
  sessionId: string;
  courseInstanceId: string;
  onClose?: () => void;
}

interface StudentCardProps {
  studentId: string;
  name: string;
  usn?: string;
  status: AttendanceStatus | null;
  onToggle: () => void;
  disabled?: boolean;
}

function StudentCard({
  studentId,
  name,
  usn,
  status,
  onToggle,
  disabled,
}: StudentCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'present':
        return { bg: '#D1FAE5', border: '#10B981', text: '#059669' };
      case 'absent':
        return { bg: '#FEE2E2', border: '#EF4444', text: '#DC2626' };
      default:
        return { bg: '#F3F4F6', border: '#E5E7EB', text: '#9CA3AF' };
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'present':
        return <CheckCircle2 size={24} color="#10B981" />;
      case 'absent':
        return <XCircle size={24} color="#EF4444" />;
      default:
        return <MinusCircle size={24} color="#9CA3AF" />;
    }
  };

  const colors = getStatusColor();

  return (
    <TouchableOpacity
      style={[
        styles.studentCard,
        { backgroundColor: colors.bg, borderColor: colors.border },
        disabled && styles.studentCardDisabled,
      ]}
      onPress={onToggle}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <HStack space="md" style={styles.studentContent}>
        <View style={styles.statusIcon}>{getStatusIcon()}</View>
        
        <VStack space="xs" style={styles.studentInfo}>
          <Text style={styles.studentName}>{name}</Text>
          {usn && <Text style={styles.studentUsn}>{usn}</Text>}
        </VStack>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: colors.border },
          ]}
        >
          <Text style={[styles.statusText, { color: '#FFFFFF' }]}>
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Not Marked'}
          </Text>
        </View>
      </HStack>
    </TouchableOpacity>
  );
}

export function AttendanceMarkingInterface({
  sessionId,
  courseInstanceId,
  onClose,
}: AttendanceMarkingInterfaceProps) {
  const {
    students,
    loading,
    error,
    markingInProgress,
    stats,
    toggleAttendance,
    markAllAttendance,
  } = useAttendanceMarking({
    sessionId,
    courseInstanceId,
  });

  const handleMarkAll = (status: AttendanceStatus) => {
    Alert.alert(
      `Mark All ${status === 'present' ? 'Present' : 'Absent'}`,
      `Are you sure you want to mark all students as ${status}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => markAllAttendance(status),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Loading students...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <HStack space="lg" style={styles.statsContent}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.present}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.absent}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#9CA3AF' }]}>{stats.notMarked}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </HStack>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <HStack space="sm">
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#D1FAE5' }]}
            onPress={() => handleMarkAll('present')}
            disabled={markingInProgress}
          >
            <Check size={18} color="#059669" />
            <Text style={[styles.actionButtonText, { color: '#059669' }]}>
              Mark All Present
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FEE2E2' }]}
            onPress={() => handleMarkAll('absent')}
            disabled={markingInProgress}
          >
            <X size={18} color="#DC2626" />
            <Text style={[styles.actionButtonText, { color: '#DC2626' }]}>
              Mark All Absent
            </Text>
          </TouchableOpacity>
        </HStack>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          Tap on a student to toggle attendance (Present → Absent → Not Marked)
        </Text>
      </View>

      {/* Student List */}
      <ScrollView
        style={styles.studentList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.studentListContent}
      >
        {students.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Students Found</Text>
            <Text style={styles.emptyText}>
              There are no students enrolled in this course.
            </Text>
          </View>
        ) : (
          students.map((student) => (
            <StudentCard
              key={student.id}
              studentId={student.id}
              name={student.name}
              usn={student.usn}
              status={student.status}
              onToggle={() => toggleAttendance(student.id)}
              disabled={markingInProgress}
            />
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  statsBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statsContent: {
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  quickActions: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  instructions: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  instructionsText: {
    fontSize: 12,
    color: '#3B82F6',
    textAlign: 'center',
  },
  studentList: {
    flex: 1,
  },
  studentListContent: {
    padding: 16,
  },
  studentCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
  },
  studentCardDisabled: {
    opacity: 0.6,
  },
  studentContent: {
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 4,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  studentUsn: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
});
