import React, { useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import {
  BookOpen,
  Calendar,
  CheckCircle,
  FileText,
  Users,
  TrendingUp,
  Bell,
  Send,
  BarChart3,
  ClipboardCheck,
  GraduationCap,
  UserCheck,
  Activity,
  MessageSquare,
  Settings,
  AlertCircle,
} from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import { useHomeData } from "@/lib/hooks/useHomeData";
import { StatCard } from "@/components/home/StatCard";
import { TodayClassCard } from "@/components/home/TodayClassCard";
import { AssignmentPreview } from "@/components/home/AssignmentPreview";
import { QuickActionButton } from "@/components/home/QuickActionButton";
import { AnnouncementPreview } from "@/components/home/AnnouncementPreview";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const { user, userData, role } = useAuth();
  const router = useRouter();
  const {
    stats,
    todayClasses,
    upcomingAssignments,
    recentAnnouncements,
    attendanceAlert,
    loading,
    error,
    refresh,
  } = useHomeData();

  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const renderStudentStats = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.statsScroll}
      contentContainerStyle={styles.statsContent}
    >
      <StatCard
        icon={CheckCircle}
        value={`${stats.attendancePercentage || 0}%`}
        label="Attendance"
        color={(stats.attendancePercentage || 0) >= 75 ? "#10B981" : "#EF4444"}
        onPress={() => router.push("/(tabs)/academics")}
      />
      <StatCard
        icon={FileText}
        value={stats.pendingAssignments || 0}
        label="Pending Assignments"
        color="#3B82F6"
        onPress={() => router.push("/(tabs)/academics")}
      />
      <StatCard
        icon={BookOpen}
        value={stats.enrolledCourses || 0}
        label="Enrolled Courses"
        color="#8B5CF6"
        onPress={() => router.push("/(tabs)/academics")}
      />
      <StatCard
        icon={Calendar}
        value={stats.todayClasses || 0}
        label="Classes Today"
        color="#F59E0B"
        onPress={() => router.push("/(tabs)/calendar")}
      />
    </ScrollView>
  );

  const renderTeacherStats = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.statsScroll}
      contentContainerStyle={styles.statsContent}
    >
      <StatCard
        icon={Calendar}
        value={stats.classesToday || 0}
        label="Classes Today"
        color="#000000"
        onPress={() => router.push("/(tabs)/calendar")}
      />
      <StatCard
        icon={ClipboardCheck}
        value={stats.pendingGradings || 0}
        label="Pending Gradings"
        color="#EF4444"
        onPress={() => router.push("/(tabs)/academics")}
      />
      <StatCard
        icon={Users}
        value={stats.totalStudents || 0}
        label="Total Students"
        color="#3B82F6"
      />
      <StatCard
        icon={BookOpen}
        value={stats.activeCourses || 0}
        label="Active Courses"
        color="#10B981"
        onPress={() => router.push("/(tabs)/academics")}
      />
    </ScrollView>
  );

  const renderAdminStats = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.statsScroll}
      contentContainerStyle={styles.statsContent}
    >
      <StatCard
        icon={GraduationCap}
        value={stats.totalStudentsCount || 0}
        label="Total Students"
        color="#3B82F6"
        onPress={() => router.push("/(tabs)/profile")}
      />
      <StatCard
        icon={Users}
        value={stats.totalTeachersCount || 0}
        label="Total Teachers"
        color="#10B981"
        onPress={() => router.push("/(tabs)/profile")}
      />
      <StatCard
        icon={BookOpen}
        value={stats.totalCoursesCount || 0}
        label="Active Courses"
        color="#8B5CF6"
        onPress={() => router.push("/(tabs)/academics")}
      />
      <StatCard
        icon={Activity}
        value={stats.activeUsers || 0}
        label="Active Users"
        color="#F59E0B"
      />
    </ScrollView>
  );

  const renderParentStats = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.statsScroll}
      contentContainerStyle={styles.statsContent}
    >
      <StatCard
        icon={CheckCircle}
        value={`${stats.childAttendance || 0}%`}
        label="Child's Attendance"
        color={(stats.childAttendance || 0) >= 75 ? "#10B981" : "#EF4444"}
      />
      <StatCard
        icon={FileText}
        value={stats.childPendingAssignments || 0}
        label="Pending Assignments"
        color="#3B82F6"
      />
      <StatCard
        icon={Calendar}
        value={stats.childTodayClasses || 0}
        label="Classes Today"
        color="#8B5CF6"
        onPress={() => router.push("/(tabs)/calendar")}
      />
      <StatCard
        icon={TrendingUp}
        value={stats.childOverallPerformance || "-"}
        label="Performance"
        color="#10B981"
      />
    </ScrollView>
  );

  const renderStats = () => {
    switch (role) {
      case "student":
        return renderStudentStats();
      case "teacher":
        return renderTeacherStats();
      case "admin":
        return renderAdminStats();
      case "parent":
        return renderParentStats();
      default:
        return null;
    }
  };

  const renderStudentActions = () => (
    <View style={styles.actionsGrid}>
      <QuickActionButton
        icon={Calendar}
        label="View Timetable"
        color="#000000"
        onPress={() => router.push("/(tabs)/calendar")}
      />
      <QuickActionButton
        icon={FileText}
        label="Assignments"
        color="#3B82F6"
        onPress={() => router.push("/(tabs)/academics")}
      />
      <QuickActionButton
        icon={UserCheck}
        label="Check Attendance"
        color="#10B981"
        onPress={() => router.push("/(tabs)/academics")}
      />
      <QuickActionButton
        icon={MessageSquare}
        label="Announcements"
        color="#8B5CF6"
        onPress={() => router.push("/(tabs)/news")}
      />
    </View>
  );

  const renderTeacherActions = () => (
    <View style={styles.actionsGrid}>
      <QuickActionButton
        icon={Send}
        label="Create Post"
        color="#000000"
        onPress={() => router.push("/(tabs)/news")}
      />
      <QuickActionButton
        icon={BookOpen}
        label="My Courses"
        color="#3B82F6"
        onPress={() => router.push("/(tabs)/academics")}
      />
      <QuickActionButton
        icon={UserCheck}
        label="Mark Attendance"
        color="#10B981"
        onPress={() => router.push("/(tabs)/calendar")}
      />
      <QuickActionButton
        icon={ClipboardCheck}
        label="Grade Assignments"
        color="#EF4444"
        onPress={() => router.push("/(tabs)/academics")}
      />
    </View>
  );

  const renderAdminActions = () => (
    <View style={styles.actionsGrid}>
      <QuickActionButton
        icon={Users}
        label="Manage Users"
        color="#000000"
        onPress={() => router.push("/(tabs)/profile")}
      />
      <QuickActionButton
        icon={BookOpen}
        label="Manage Courses"
        color="#3B82F6"
        onPress={() => router.push("/(tabs)/academics")}
      />
      <QuickActionButton
        icon={BarChart3}
        label="View Reports"
        color="#10B981"
        onPress={() => router.push("/(tabs)/profile")}
      />
      <QuickActionButton
        icon={Send}
        label="Send Announcement"
        color="#8B5CF6"
        onPress={() => router.push("/(tabs)/news")}
      />
    </View>
  );

  const renderParentActions = () => (
    <View style={styles.actionsGrid}>
      <QuickActionButton
        icon={TrendingUp}
        label="Performance"
        color="#000000"
        onPress={() => router.push("/(tabs)/academics")}
      />
      <QuickActionButton
        icon={Calendar}
        label="View Schedule"
        color="#3B82F6"
        onPress={() => router.push("/(tabs)/calendar")}
      />
      <QuickActionButton
        icon={UserCheck}
        label="Attendance"
        color="#10B981"
        onPress={() => router.push("/(tabs)/academics")}
      />
      <QuickActionButton
        icon={MessageSquare}
        label="Contact Teacher"
        color="#8B5CF6"
        onPress={() => router.push("/(tabs)/news")}
      />
    </View>
  );

  const renderQuickActions = () => {
    switch (role) {
      case "student":
        return renderStudentActions();
      case "teacher":
        return renderTeacherActions();
      case "admin":
        return renderAdminActions();
      case "parent":
        return renderParentActions();
      default:
        return null;
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <VStack space="xs">
            <HStack className="justify-between items-start">
              <VStack space="xs" style={{ flex: 1 }}>
                <Text style={styles.greeting}>
                  {getGreeting()},{" "}
                  {role === "parent"
                    ? userData?.name?.split(" ")[0] || "Parent"
                    : userData?.name?.split(" ")[0] || "User"}
                  !
                </Text>
                <Text style={styles.date}>{getFormattedDate()}</Text>
              </VStack>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => router.push("/(tabs)/news")}
              >
                <Bell size={22} color="#374151" strokeWidth={2} />
                {(stats.pendingAssignments || 0) > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {stats.pendingAssignments}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </HStack>
          </VStack>
        </View>

        {/* Stats Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          {renderStats()}
        </View>

        {/* Parent Link Prompt */}
        {role === "parent" && stats.childAttendance === undefined && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.alertCard, { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }]}
              onPress={() => router.push("/(auth)/parent-link")}
            >
              <HStack space="md" className="items-center">
                <View style={[styles.alertIcon, { backgroundColor: "#DBEAFE" }]}>
                  <Users size={24} color="#3B82F6" strokeWidth={2} />
                </View>
                <VStack space="xs" style={{ flex: 1 }}>
                  <Text style={[styles.alertTitle, { color: "#1E40AF" }]}>
                    Link to Your Child
                  </Text>
                  <Text style={[styles.alertText, { color: "#3B82F6" }]}>
                    Link to your child's account to view their academic progress, attendance, and schedule.
                  </Text>
                </VStack>
                <Text style={[styles.alertArrow, { color: "#93C5FD" }]}>›</Text>
              </HStack>
            </TouchableOpacity>
          </View>
        )}

        {/* Attendance Alert (Students & Parents) */}
        {attendanceAlert && (role === "student" || role === "parent") && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.alertCard}
              onPress={() => router.push("/(tabs)/academics")}
            >
              <HStack space="md" className="items-center">
                <View style={styles.alertIcon}>
                  <AlertCircle size={24} color="#EF4444" strokeWidth={2} />
                </View>
                <VStack space="xs" style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>Attendance Alert</Text>
                  <Text style={styles.alertText}>
                    {role === "student"
                      ? "Your attendance is below 75%. Please attend classes regularly."
                      : "Your child's attendance is below 75%. Please ensure regular attendance."}
                  </Text>
                </VStack>
                <Text style={styles.alertArrow}>›</Text>
              </HStack>
            </TouchableOpacity>
          </View>
        )}

        {/* Today's Schedule */}
        {todayClasses.length > 0 && (
          <View style={styles.section}>
            <HStack className="justify-between items-center mb-3">
              <Text style={styles.sectionTitle}>
                {role === "parent" ? "Child's Schedule" : "Today's Schedule"}
              </Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/calendar")}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </HStack>
            <VStack space="md">
              {todayClasses.slice(0, 4).map((classItem) => (
                <TodayClassCard
                  key={classItem.id}
                  title={classItem.title}
                  courseName={classItem.courseName}
                  startTime={classItem.startTime}
                  endTime={classItem.endTime}
                  location={classItem.location}
                  isNext={classItem.isNext}
                  isPast={classItem.isPast}
                  hasAttendance={classItem.hasAttendance}
                  onPress={() => router.push("/(tabs)/calendar")}
                />
              ))}
            </VStack>
          </View>
        )}

        {todayClasses.length === 0 &&
          (role === "student" || role === "teacher" || role === "parent") && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {role === "parent" ? "Child's Schedule" : "Today's Schedule"}
              </Text>
              <View style={styles.emptyState}>
                <Calendar size={48} color="#D1D5DB" strokeWidth={1.5} />
                <Text style={styles.emptyStateText}>
                  No classes scheduled for today
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Enjoy your free day!
                </Text>
              </View>
            </View>
          )}

        {/* Upcoming Assignments */}
        {upcomingAssignments.length > 0 && role === "student" && (
          <View style={styles.section}>
            <HStack className="justify-between items-center mb-3">
              <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/academics")}
              >
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </HStack>
            <VStack space="md">
              {upcomingAssignments.map((assignment) => (
                <AssignmentPreview
                  key={assignment.id}
                  title={assignment.title}
                  courseName={assignment.courseName}
                  dueDate={assignment.dueDate}
                  isOverdue={assignment.isOverdue}
                  onPress={() =>
                    router.push(
                      `/(tabs)/academics/${assignment.courseInstanceId}/assignments`,
                    )
                  }
                />
              ))}
            </VStack>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          {renderQuickActions()}
        </View>

        {/* Recent Announcements */}
        {recentAnnouncements.length > 0 && (
          <View style={styles.section}>
            <HStack className="justify-between items-center mb-3">
              <Text style={styles.sectionTitle}>Recent Announcements</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/news")}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </HStack>
            <VStack space="md">
              {recentAnnouncements.map((announcement) => (
                <AnnouncementPreview
                  key={announcement.id}
                  title={announcement.title}
                  content={announcement.content}
                  authorName={announcement.authorName}
                  timestamp={announcement.timestamp}
                  isPinned={announcement.isPinned}
                  onPress={() => router.push("/(tabs)/news")}
                />
              ))}
            </VStack>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.section}>
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRefresh}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom Padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 36,
  },
  date: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  statsScroll: {
    marginHorizontal: -20,
  },
  statsContent: {
    paddingHorizontal: 20,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  alertCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#991B1B",
    marginBottom: 4,
  },
  alertText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#DC2626",
    lineHeight: 18,
  },
  alertArrow: {
    fontSize: 28,
    color: "#FCA5A5",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
  },
  errorCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#000000",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
