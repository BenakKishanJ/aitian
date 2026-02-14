import React from "react";
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
  Users,
  BookOpen,
  GraduationCap,
  UserCheck,
  Bell,
  TrendingUp,
  Activity,
  Calendar,
  FileText,
  Building2,
  AlertCircle,
  Settings,
  Plus,
  ChevronRight,
  ClipboardList,
  Layers,
} from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import { useAdminData } from "@/lib/hooks/useAdminData";

const { width } = Dimensions.get("window");

interface StatCardProps {
  icon: React.ElementType;
  value: number | string;
  label: string;
  color: string;
  onPress?: () => void;
}

function StatCard({ icon: Icon, value, label, color, onPress }: StatCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.statCard, { borderLeftColor: color }]}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Icon size={20} color={color} />
      </View>
      <VStack space="xs" style={styles.statContent}>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </VStack>
    </TouchableOpacity>
  );
}

interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  color: string;
  onPress: () => void;
}

function QuickAction({ icon: Icon, label, color, onPress }: QuickActionProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.quickAction, { backgroundColor: `${color}10` }]}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        <Icon size={20} color="#FFFFFF" />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function AdminHomeScreen() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const {
    stats,
    recentActivity,
    departmentStats,
    loading,
    error,
    refresh,
  } = useAdminData();

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

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <VStack space="xs">
          <Text style={styles.greeting}>
            {getGreeting()}, {userData?.name?.split(" ")[0] || "Admin"}
          </Text>
          <Text style={styles.date}>{getFormattedDate()}</Text>
        </VStack>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push("/admin/settings")}
        >
          <Settings size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* System Overview Stats */}
        <View style={styles.section}>
          <HStack space="sm" style={styles.sectionHeader}>
            <Activity size={20} color="#000000" />
            <Text style={styles.sectionTitle}>System Overview</Text>
          </HStack>
          
          <View style={styles.statsGrid}>
            <StatCard
              icon={Users}
              value={stats.totalUsers}
              label="Total Users"
              color="#000000"
              onPress={() => router.push("/admin/users")}
            />
            <StatCard
              icon={GraduationCap}
              value={stats.totalStudents}
              label="Students"
              color="#3B82F6"
              onPress={() => router.push("/admin/users")}
            />
            <StatCard
              icon={UserCheck}
              value={stats.totalTeachers}
              label="Teachers"
              color="#10B981"
              onPress={() => router.push("/admin/users")}
            />
            <StatCard
              icon={BookOpen}
              value={stats.totalCourses}
              label="Courses"
              color="#8B5CF6"
              onPress={() => router.push("/admin/academics")}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <HStack space="sm" style={styles.sectionHeader}>
            <Plus size={20} color="#000000" />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </HStack>
          
          <View style={styles.quickActionsGrid}>
            <QuickAction
              icon={Users}
              label="Manage Users"
              color="#000000"
              onPress={() => router.push("/admin/users")}
            />
            <QuickAction
              icon={BookOpen}
              label="Manage Courses"
              color="#3B82F6"
              onPress={() => router.push("/admin/academics")}
            />
            <QuickAction
              icon={Layers}
              label="Manage Electives"
              color="#EC4899"
              onPress={() => router.push("/admin/electives")}
            />
            <QuickAction
              icon={ClipboardList}
              label="Course Requests"
              color="#F59E0B"
              onPress={() => router.push("/admin/course-requests")}
            />
            <QuickAction
              icon={Bell}
              label="Announcements"
              color="#8B5CF6"
              onPress={() => router.push("/admin/news")}
            />
          </View>
        </View>

        {/* Today's Summary */}
        <View style={styles.section}>
          <HStack space="sm" style={styles.sectionHeader}>
            <TrendingUp size={20} color="#000000" />
            <Text style={styles.sectionTitle}>Today's Summary</Text>
          </HStack>
          
          <View style={styles.summaryCard}>
            <HStack space="lg" style={styles.summaryRow}>
              <VStack space="xs" style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{stats.todayClasses}</Text>
                <Text style={styles.summaryLabel}>Classes Today</Text>
              </VStack>
              <TouchableOpacity 
                style={styles.summaryItem}
                onPress={() => router.push("/admin/course-requests")}
              >
                <VStack space="xs">
                  <Text style={styles.summaryValue}>{stats.pendingApprovals}</Text>
                  <Text style={styles.summaryLabel}>Pending Approvals</Text>
                </VStack>
              </TouchableOpacity>
              <VStack space="xs" style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{stats.activeUsers}</Text>
                <Text style={styles.summaryLabel}>Active Users</Text>
              </VStack>
            </HStack>
          </View>
        </View>

        {/* Department Statistics */}
        <View style={styles.section}>
          <HStack space="sm" style={styles.sectionHeader}>
            <Building2 size={20} color="#000000" />
            <Text style={styles.sectionTitle}>Departments</Text>
          </HStack>
          
          {departmentStats.map((dept) => (
            <TouchableOpacity
              key={dept.id}
              style={styles.departmentCard}
              onPress={() => router.push(`/admin/departments/${dept.id}`)}
            >
              <VStack space="xs" style={styles.departmentContent}>
                <Text style={styles.departmentName}>{dept.name}</Text>
                <HStack space="md">
                  <Text style={styles.departmentStat}>{dept.studentCount} Students</Text>
                  <Text style={styles.departmentStat}>{dept.teacherCount} Teachers</Text>
                  <Text style={styles.departmentStat}>{dept.courseCount} Courses</Text>
                </HStack>
              </VStack>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <HStack space="sm" style={styles.sectionHeader}>
            <AlertCircle size={20} color="#000000" />
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </HStack>
          
          {recentActivity.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recent activity</Text>
            </View>
          ) : (
            recentActivity.map((activity) => (
              <View key={activity.id} style={styles.activityCard}>
                <View style={styles.activityDot} />
                <VStack space="xs" style={styles.activityContent}>
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                  <Text style={styles.activityUser}>{activity.userName}</Text>
                </VStack>
                <Text style={styles.activityTime}>{formatTimeAgo(activity.timestamp)}</Text>
              </View>
            ))
          )}
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
  },
  date: {
    fontSize: 14,
    color: "#6B7280",
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  scrollContent: {
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickAction: {
    width: (width - 52) / 2,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000000",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryRow: {
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  departmentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  departmentContent: {
    flex: 1,
  },
  departmentName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
  },
  departmentStat: {
    fontSize: 12,
    color: "#6B7280",
  },
  activityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#000000",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  activityUser: {
    fontSize: 12,
    color: "#6B7280",
  },
  activityTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
});
