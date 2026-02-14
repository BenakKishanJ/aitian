import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Calendar, CheckCircle, XCircle, TrendingUp, Plus, Users } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/lib/AuthContext";
import { useAttendanceSession } from "@/lib/hooks/useAttendanceSession";
import { useAttendanceRecords } from "@/lib/hooks/useAttendanceRecords";
import { StartAttendanceSessionModal } from "@/components/attendance/StartAttendanceSessionModal";
import { AttendanceMarkingInterface } from "@/components/attendance/AttendanceMarkingInterface";
import { AttendanceSessionCard } from "@/components/attendance/AttendanceSessionCard";
import { AttendanceCalendar } from "@/components/attendance/AttendanceCalendar";
import { useCourseDetails } from "@/lib/hooks/useCourseDetails";
import type { ParentUserData } from "@/types";

export default function AttendanceScreen() {
  const { courseInstanceId } = useLocalSearchParams<{
    courseInstanceId: string;
  }>();
  const { role, user, userData } = useAuth();
  const isTeacherOrAdmin = role === "teacher" || role === "admin";
  
  // For parents, get the linked student's ID
  const getParentStudentId = () => {
    if (role !== 'parent' || !userData) return undefined;
    const parentData = userData as ParentUserData;
    // Support both array and single field for backward compatibility
    const linkedStudentIds = parentData.linkedStudentIds || [];
    return linkedStudentIds.length > 0 ? linkedStudentIds[0] : parentData.linkedStudentId;
  };
  
  const targetStudentId = getParentStudentId();
  
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showStartModal, setShowStartModal] = useState(false);
  const [markingSessionId, setMarkingSessionId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const {
    sessions,
    activeSession,
    loading: sessionsLoading,
    error: sessionsError,
    startSession,
    lockSession,
    unlockSession,
    deleteSession,
    refresh: refreshSessions,
  } = useAttendanceSession({
    courseInstanceId: courseInstanceId as string,
    date: selectedMonth,
  });

  const {
    courseDetails,
    loading: courseLoading,
  } = useCourseDetails(courseInstanceId as string);

  // Get attendance records and stats for students/parents
  const {
    stats,
    loading: recordsLoading,
    refresh: refreshRecords,
  } = useAttendanceRecords(courseInstanceId as string, targetStudentId);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshSessions();
    if (!isTeacherOrAdmin) {
      await refreshRecords();
    }
    setRefreshing(false);
  };

  // Student View - Calendar with attendance
  const renderStudentView = () => {
    const getAttendanceColor = (percentage: number) => {
      if (percentage >= 75) return "#10B981";
      if (percentage >= 60) return "#F59E0B";
      return "#EF4444";
    };

    const getAttendanceStatus = (percentage: number) => {
      if (percentage >= 75) return "Good Standing";
      if (percentage >= 60) return "Warning";
      return "At Risk";
    };

    const attendanceColor = getAttendanceColor(stats.percentage);
    const attendanceStatus = getAttendanceStatus(stats.percentage);

    return (
      <>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <VStack space="lg">
            <View style={styles.percentageContainer}>
              <View
                style={[
                  styles.percentageCircle,
                  { borderColor: attendanceColor },
                ]}
              >
                <Text
                  className="text-5xl font-bold"
                  style={{ color: attendanceColor }}
                >
                  {stats.percentage.toFixed(0)}%
                </Text>
              </View>
            </View>

            <VStack space="xs" className="items-center">
              <HStack space="xs" className="items-center">
                <Icon
                  as={stats.percentage >= 75 ? CheckCircle : XCircle}
                  size="md"
                  style={{ color: attendanceColor }}
                />
                <Text
                  className="text-lg font-semibold"
                  style={{ color: attendanceColor }}
                >
                  {attendanceStatus}
                </Text>
              </HStack>
              <Text className="text-sm text-gray-500">
                {stats.attendedClasses} / {stats.totalClasses} classes attended
              </Text>
            </VStack>

            <HStack className="justify-around">
              <VStack space="xs" className="items-center">
                <Text className="text-2xl font-bold text-green-600">
                  {stats.attendedClasses}
                </Text>
                <Text className="text-xs text-gray-500">Present</Text>
              </VStack>

              <View style={styles.divider} />

              <VStack space="xs" className="items-center">
                <Text className="text-2xl font-bold text-red-600">
                  {stats.totalClasses - stats.attendedClasses}
                </Text>
                <Text className="text-xs text-gray-500">Absent</Text>
              </VStack>

              <View style={styles.divider} />

              <VStack space="xs" className="items-center">
                <Text className="text-2xl font-bold text-gray-700">
                  {stats.totalClasses}
                </Text>
                <Text className="text-xs text-gray-500">Total</Text>
              </VStack>
            </HStack>
          </VStack>
        </View>

        {/* Calendar Card */}
        <View style={styles.card}>
          <Text className="text-lg font-bold text-black mb-4">
            Attendance Calendar
          </Text>
          <AttendanceCalendar
            courseInstanceId={courseInstanceId as string}
            studentId={targetStudentId || user?.uid}
          />
        </View>

        {/* Sessions List */}
        <View style={styles.card}>
          <Text className="text-lg font-bold text-black mb-4">
            Class Sessions
          </Text>
          
          {sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Sessions Yet</Text>
              <Text style={styles.emptyText}>
                No attendance sessions have been recorded for this course.
              </Text>
            </View>
          ) : (
            <VStack space="sm">
              {sessions.map((session) => (
                <AttendanceSessionCard
                  key={session.id}
                  session={session}
                  showActions={false}
                />
              ))}
            </VStack>
          )}
        </View>

        {/* Warning Message */}
        {stats.percentage < 75 && stats.totalClasses > 0 && (
          <View style={styles.warningCard}>
            <HStack space="md" className="items-start">
              <Icon as={TrendingUp} size="md" className="text-amber-600" />
              <VStack space="xs" className="flex-1">
                <Text className="text-base font-semibold text-amber-900">
                  Attendance Warning
                </Text>
                <Text className="text-sm text-amber-800">
                  Your attendance is below 75%. Please attend classes regularly.
                </Text>
              </VStack>
            </HStack>
          </View>
        )}
      </>
    );
  };

  // Teacher View - Session Management
  const renderTeacherView = () => {
    return (
      <>
        {/* Active Session Alert */}
        {activeSession && (
          <TouchableOpacity
            style={styles.activeSessionBanner}
            onPress={() => setMarkingSessionId(activeSession.id)}
          >
            <HStack space="md" className="items-center">
              <View style={styles.activeIndicator} />
              <VStack space="xs" className="flex-1">
                <Text className="text-base font-bold text-white">
                  Active Session: {activeSession.title}
                </Text>
                <Text className="text-sm text-gray-300">
                  Tap to mark attendance
                </Text>
              </VStack>
              <Icon as={Users} size="md" className="text-white" />
            </HStack>
          </TouchableOpacity>
        )}

        {/* Start New Session Button */}
        {!activeSession && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => setShowStartModal(true)}
          >
            <HStack space="sm" className="items-center justify-center">
              <Plus size={24} color="#FFFFFF" />
              <Text className="text-lg font-semibold text-white">
                Start Attendance Session
              </Text>
            </HStack>
          </TouchableOpacity>
        )}

        {/* Sessions List */}
        <View style={styles.card}>
          <Text className="text-lg font-bold text-black mb-4">
            Attendance Sessions
          </Text>
          
          {sessionsLoading ? (
            <ActivityIndicator size="large" color="#000000" />
          ) : sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Sessions Yet</Text>
              <Text style={styles.emptyText}>
                Start a new session to begin taking attendance
              </Text>
            </View>
          ) : (
            <VStack space="sm">
              {sessions.map((session) => (
                <AttendanceSessionCard
                  key={session.id}
                  session={session}
                  onPress={() => setMarkingSessionId(session.id)}
                  onLock={() => lockSession(session.id)}
                  onUnlock={() => unlockSession(session.id)}
                  onDelete={() => deleteSession(session.id)}
                  showActions={true}
                />
              ))}
            </VStack>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text className="text-base font-semibold text-gray-800 mb-2">
            How to Take Attendance
          </Text>
          <VStack space="xs">
            <Text className="text-sm text-gray-600">
              1. Tap "Start Attendance Session" to begin
            </Text>
            <Text className="text-sm text-gray-600">
              2. Tap on a session to mark students present/absent
            </Text>
            <Text className="text-sm text-gray-600">
              3. Use "Mark All Present/Absent" for quick marking
            </Text>
            <Text className="text-sm text-gray-600">
              4. Lock the session when finished
            </Text>
          </VStack>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <VStack space="xs">
          <Text className="text-xl font-bold text-black">
            Attendance
          </Text>
          <Text className="text-sm text-gray-500">
            {courseDetails?.course?.name || "Loading..."}
          </Text>
        </VStack>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {isTeacherOrAdmin ? renderTeacherView() : renderStudentView()}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Start Session Modal */}
      <StartAttendanceSessionModal
        visible={showStartModal}
        onClose={() => setShowStartModal(false)}
        courseInstanceId={courseInstanceId as string}
        courseName={courseDetails?.course?.name || "Course"}
        onSessionStarted={(sessionId) => {
          setMarkingSessionId(sessionId);
        }}
      />

      {/* Marking Interface Modal */}
      <Modal
        visible={!!markingSessionId}
        animationType="slide"
        onRequestClose={() => setMarkingSessionId(null)}
      >
        <SafeAreaView style={styles.markingModal}>
          <View style={styles.markingHeader}>
            <TouchableOpacity
              onPress={() => setMarkingSessionId(null)}
              style={styles.closeButton}
            >
              <Text className="text-base font-semibold text-gray-600">Close</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-black">Mark Attendance</Text>
            <View style={{ width: 50 }} />
          </View>
          
          {markingSessionId && (
            <AttendanceMarkingInterface
              sessionId={markingSessionId}
              courseInstanceId={courseInstanceId as string}
              onClose={() => setMarkingSessionId(null)}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  percentageContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  percentageCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  activeSessionBanner: {
    backgroundColor: "#000000",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  activeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  startButton: {
    backgroundColor: "#000000",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
    textAlign: "center",
  },
  instructionsCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  warningCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  markingModal: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  markingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  closeButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
});
