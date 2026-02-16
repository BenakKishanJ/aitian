import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Calendar, CheckCircle, XCircle, TrendingUp, Plus, Users, Shield, Trash2 } from "lucide-react-native";
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
import { AttendanceReport } from "@/components/attendance/AttendanceReport";
import { useCourseDetails } from "@/lib/hooks/useCourseDetails";
import { collection, query, where, getDocs, writeBatch, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/types/constants";
import { FileText } from "lucide-react-native";

export default function AdminAttendanceScreen() {
  const { courseInstanceId } = useLocalSearchParams<{
    courseInstanceId: string;
  }>();
  const { role, user } = useAuth();
  
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showStartModal, setShowStartModal] = useState(false);
  const [markingSessionId, setMarkingSessionId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

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

  // Get attendance records and stats
  const {
    stats,
    loading: recordsLoading,
    refresh: refreshRecords,
  } = useAttendanceRecords(courseInstanceId as string);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshSessions();
    await refreshRecords();
    setRefreshing(false);
  };

  const handleDeleteAllSessions = async () => {
    Alert.alert(
      "Delete All Sessions",
      "Are you sure you want to delete ALL attendance sessions and records for this course? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            setDeletingAll(true);
            try {
              const batch = writeBatch(db);

              // Delete all sessions and their records
              for (const session of sessions) {
                const recordsQuery = query(
                  collection(db, COLLECTIONS.ATTENDANCE_RECORDS),
                  where("sessionId", "==", session.id)
                );
                const recordsSnap = await getDocs(recordsQuery);
                recordsSnap.docs.forEach((recordDoc) => {
                  batch.delete(recordDoc.ref);
                });

                const sessionRef = doc(db, COLLECTIONS.ATTENDANCE_SESSIONS, session.id);
                batch.delete(sessionRef);
              }

              await batch.commit();
              await refreshSessions();
              Alert.alert("Success", "All attendance sessions deleted successfully");
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete sessions");
            } finally {
              setDeletingAll(false);
            }
          },
        },
      ]
    );
  };

  // Calculate class attendance statistics
  const getClassAverage = () => {
    if (stats.totalClasses === 0) return 0;
    return Math.round((stats.attendedClasses / stats.totalClasses) * 100);
  };

  const classAverage = getClassAverage();

  return (
    <SafeAreaView className="flex-1 bg-[#1C1C1E]">
      {/* Header */}
      <View className="px-6 pt-4 pb-4">
        <HStack className="justify-between items-center">
          <HStack space="sm" className="items-center">
            <Icon as={Shield} size="sm" className="text-[#7477FF]" />
            <Text className="text-xl font-bold text-white">Attendance</Text>
          </HStack>

          <HStack space="sm">
            <TouchableOpacity
              onPress={() => setShowReportModal(true)}
              className="w-10 h-10 rounded-xl bg-[#BCF3FF]/15 items-center justify-center"
            >
              <Icon as={FileText} size="sm" className="text-[#BCF3FF]" />
            </TouchableOpacity>
            
            {sessions.length > 0 && (
              <TouchableOpacity
                onPress={handleDeleteAllSessions}
                className="w-10 h-10 rounded-xl bg-[#F96857]/20 items-center justify-center"
                disabled={deletingAll}
              >
                <Icon as={Trash2} size="sm" className="text-[#F96857]" />
              </TouchableOpacity>
            )}
          </HStack>
        </HStack>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="pb-24"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#BCF3FF" colors={["#BCF3FF"]} />
        }
      >
        {/* Course Info */}
        <View className="bg-[#2A2A2D] rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-white">
            {courseDetails?.course?.name || "Loading..."}
          </Text>
          <Text className="text-sm text-[#6B7280]">
            {courseDetails?.course?.courseCode} | Section {courseDetails?.section}
          </Text>
        </View>

        {/* Class Attendance Summary */}
        <View className="bg-[#2A2A2D] rounded-2xl p-5 mb-4">
          <VStack space="lg">
            <View className="items-center">
              <View
                className="w-32 h-32 rounded-full items-center justify-center"
                style={{
                  borderWidth: 6,
                  borderColor: stats.percentage >= 75 ? "#5AA578" : stats.percentage >= 60 ? "#F9CD61" : "#F96857",
                }}
              >
                <Text
                  className="text-4xl font-bold"
                  style={{ color: stats.percentage >= 75 ? "#5AA578" : stats.percentage >= 60 ? "#F9CD61" : "#F96857" }}
                >
                  {stats.percentage.toFixed(0)}%
                </Text>
              </View>
            </View>

            <VStack space="xs" className="items-center">
              <Text className="text-[#C5D4CA] text-lg">Class Average Attendance</Text>
              <Text className="text-sm text-[#6B7280]">
                Based on {sessions.length} session{sessions.length !== 1 ? "s" : ""}
              </Text>
            </VStack>

            <HStack className="justify-around">
              <VStack space="xs" className="items-center">
                <Text className="text-2xl font-bold text-blue-600">
                  {sessions.length}
                </Text>
                <Text className="text-xs text-gray-500">Total Sessions</Text>
              </VStack>

              <View style={styles.divider} />

              <VStack space="xs" className="items-center">
                <Text className="text-2xl font-bold text-green-600">
                  {sessions.filter((s) => s.isLocked).length}
                </Text>
                <Text className="text-xs text-gray-500">Locked</Text>
              </VStack>

              <View style={styles.divider} />

              <VStack space="xs" className="items-center">
                <Text className="text-2xl font-bold text-orange-600">
                  {sessions.filter((s) => !s.isLocked).length}
                </Text>
                <Text className="text-xs text-gray-500">Active</Text>
              </VStack>
            </HStack>
          </VStack>
        </View>

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
          <HStack className="justify-between items-center mb-4">
            <Text className="text-lg font-bold text-black">
              Attendance Sessions
            </Text>
            <Text className="text-sm text-gray-500">
              {sessions.length} total
            </Text>
          </HStack>
          
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
            Admin Instructions
          </Text>
          <VStack space="xs">
            <Text className="text-sm text-gray-600">
              1. Tap "Start Attendance Session" to begin a new session
            </Text>
            <Text className="text-sm text-gray-600">
              2. Tap on a session to mark students present/absent
            </Text>
            <Text className="text-sm text-gray-600">
              3. Use "Mark All Present/Absent" for quick marking
            </Text>
            <Text className="text-sm text-gray-600">
              4. Lock the session when finished to prevent changes
            </Text>
            <Text className="text-sm text-gray-600">
              5. Delete individual sessions or all sessions if needed
            </Text>
          </VStack>
        </View>

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

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <SafeAreaView style={styles.markingModal}>
          <View style={styles.markingHeader}>
            <TouchableOpacity
              onPress={() => setShowReportModal(false)}
              style={styles.closeButton}
            >
              <Text className="text-base font-semibold text-gray-600">Close</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-black">Attendance Report</Text>
            <View style={{ width: 50 }} />
          </View>
          
          <View style={{ flex: 1, padding: 16 }}>
            <AttendanceReport
              courseInstanceId={courseInstanceId as string}
              courseName={courseDetails?.course?.name}
            />
          </View>
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
  },
  deleteAllButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },
  reportButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#DBEAFE",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  courseInfoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    backgroundColor: "#8B5CF6",
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
