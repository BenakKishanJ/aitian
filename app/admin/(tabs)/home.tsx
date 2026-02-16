import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  Image,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Bell,
  Users,
  BookOpen,
  GraduationCap,
  UserCheck,
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
  Send,
  BarChart3,
  Shield,
} from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import { useAdminData } from "@/lib/hooks/useAdminData";

import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";

const { width, height } = Dimensions.get("window");

const roleConfig = {
  color: "#7477FF",
  accentColor: "#7477FF",
  icon: Shield,
  label: "Admin",
  bgColor: "#E1E3FF",
  lightBg: "rgba(116, 119, 255, 0.25)",
  darkBorder: "#5A5DE8",
};

const quickActions = [
  { icon: Users, label: "Manage Users", color: "#BCF3FF", route: "/admin/users" },
  { icon: BookOpen, label: "Courses", color: "#F96857", route: "/admin/academics" },
  { icon: Layers, label: "Electives", color: "#F9CD61", route: "/admin/electives" },
  { icon: Send, label: "Announce", color: "#7477FF", route: "/admin/news" },
];

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

  const [refreshing, setRefreshing] = useState(false);
  const scrollY = new Animated.Value(0);
  const HEADER_MAX_HEIGHT = 320;
  const HEADER_MIN_HEIGHT = 100;
  const COLLAPSE_RANGE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, COLLAPSE_RANGE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: "clamp",
  });

  const imageScale = scrollY.interpolate({
    inputRange: [0, COLLAPSE_RANGE],
    outputRange: [1, 0.6],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, COLLAPSE_RANGE / 2, COLLAPSE_RANGE],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

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

  const getProfileImage = () => {
    const gender = userData?.gender || "male";
    return gender === "female" 
      ? require("@/assets/images/profile/admin_female.png")
      : require("@/assets/images/profile/admin_male.png");
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

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-[#1C1C1E] items-center justify-center">
        <View className="w-16 h-16 rounded-full bg-[#2A2A2D] items-center justify-center">
          <View className="w-8 h-8 rounded-full border-2 border-[#7477FF] border-t-transparent animate-spin" />
        </View>
        <Text className="text-[#C5D4CA] mt-4 text-base">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#1C1C1E]">
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated Header with home.png Illustration */}
        <Animated.View
          style={{
            height: headerHeight,
            backgroundColor: "#2A2A2D",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            minHeight: HEADER_MIN_HEIGHT,
          }}
        >
          <Animated.Image
            source={require("@/assets/images/home.png")}
            style={{
              width: "100%",
              height: "100%",
              transform: [{ scale: imageScale }],
              opacity: headerOpacity,
            }}
            resizeMode="cover"
          />
          
          {/* Header Buttons with Role-based Colors */}
          <View className="absolute top-12 left-0 right-0 px-6 flex-row justify-between items-center">
            {/* Profile Button */}
            <TouchableOpacity
              onPress={() => router.push("/admin/profile")}
              className="w-12 h-12 rounded-full items-center justify-center overflow-hidden"
              style={{
                backgroundColor: roleConfig.lightBg,
                borderWidth: 2,
                borderColor: roleConfig.darkBorder,
              }}
            >
              <Image
                source={getProfileImage()}
                style={{ width: 36, height: 36 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            
            {/* Settings Button */}
            <TouchableOpacity
              onPress={() => router.push("/admin/settings")}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{
                backgroundColor: roleConfig.lightBg,
                borderWidth: 2,
                borderColor: roleConfig.darkBorder,
              }}
            >
              <Icon as={Settings} size="md" style={{ color: roleConfig.darkBorder }} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Dark Content Card */}
        <View className="bg-[#1C1C1E] rounded-t-3xl -mt-6 px-6 pt-8 pb-6">
          {/* Greeting Section with Role-based Color */}
          <View 
            className="rounded-2xl p-5 mb-6"
            style={{ backgroundColor: roleConfig.bgColor }}
          >
            <HStack className="items-center mb-2">
              <View 
                className="rounded-full px-3 py-1 mr-3"
                style={{ backgroundColor: roleConfig.accentColor }}
              >
                <HStack className="items-center" space="xs">
                  <Icon as={roleConfig.icon} size="2xs" className="text-[#232323]" />
                  <Text className="text-[#232323] text-xs font-bold">
                    {roleConfig.label}
                  </Text>
                </HStack>
              </View>
              <Text className="text-[#232323]/70 text-sm">{getFormattedDate()}</Text>
            </HStack>
            
            <Text className="text-[#232323] text-2xl font-bold">
              {getGreeting()},
            </Text>
            <Text className="text-[#232323] text-2xl font-bold">
              {userData?.name?.split(" ")[0] || "Admin"}!
            </Text>
          </View>

          {/* System Overview Stats */}
          <View className="mb-6">
            <Text className="text-[#C5D4CA] text-xs font-semibold uppercase tracking-wide mb-4">
              System Overview
            </Text>
            <View className="flex-row flex-wrap justify-between">
              <View className="bg-[#2A2A2D] rounded-2xl p-4 w-[48%] mb-4">
                <View className="w-10 h-10 rounded-xl bg-[#BCF3FF]/20 items-center justify-center mb-3">
                  <Icon as={Users} size="sm" className="text-[#BCF3FF]" />
                </View>
                <Text className="text-white text-2xl font-bold">{stats.totalUsers}</Text>
                <Text className="text-[#6B7280] text-xs mt-1">Total Users</Text>
              </View>
              
              <View className="bg-[#2A2A2D] rounded-2xl p-4 w-[48%] mb-4">
                <View className="w-10 h-10 rounded-xl bg-[#F96857]/20 items-center justify-center mb-3">
                  <Icon as={GraduationCap} size="sm" className="text-[#F96857]" />
                </View>
                <Text className="text-white text-2xl font-bold">{stats.totalStudents}</Text>
                <Text className="text-[#6B7280] text-xs mt-1">Students</Text>
              </View>
              
              <View className="bg-[#2A2A2D] rounded-2xl p-4 w-[48%] mb-4">
                <View className="w-10 h-10 rounded-xl bg-[#F9CD61]/20 items-center justify-center mb-3">
                  <Icon as={UserCheck} size="sm" className="text-[#F9CD61]" />
                </View>
                <Text className="text-white text-2xl font-bold">{stats.totalTeachers}</Text>
                <Text className="text-[#6B7280] text-xs mt-1">Teachers</Text>
              </View>
              
              <View className="bg-[#2A2A2D] rounded-2xl p-4 w-[48%] mb-4">
                <View className="w-10 h-10 rounded-xl bg-[#7477FF]/20 items-center justify-center mb-3">
                  <Icon as={BookOpen} size="sm" className="text-[#7477FF]" />
                </View>
                <Text className="text-white text-2xl font-bold">{stats.totalCourses}</Text>
                <Text className="text-[#6B7280] text-xs mt-1">Courses</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="mb-6">
            <Text className="text-[#C5D4CA] text-xs font-semibold uppercase tracking-wide mb-4">
              Quick Actions
            </Text>
            <View className="flex-row flex-wrap justify-between">
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => router.push(action.route as any)}
                  className="mb-4 rounded-2xl p-4 w-[48%]"
                  style={{ backgroundColor: action.color }}
                >
                  <View className="mb-3">
                    <Icon as={action.icon} size="lg" className="text-black" />
                  </View>
                  <Text className="text-black font-bold text-base">
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Today's Summary */}
          <View className="mb-6">
            <Text className="text-[#C5D4CA] text-xs font-semibold uppercase tracking-wide mb-4">
              Today's Summary
            </Text>
            <View className="bg-[#2A2A2D] rounded-2xl p-5">
              <HStack className="justify-around">
                <VStack className="items-center">
                  <Text className="text-white text-2xl font-bold">{stats.todayClasses}</Text>
                  <Text className="text-[#6B7280] text-xs mt-1">Classes</Text>
                </VStack>
                <View className="w-px bg-[#3C443F]" />
                <VStack className="items-center">
                  <Text className="text-white text-2xl font-bold">{stats.pendingApprovals}</Text>
                  <Text className="text-[#6B7280] text-xs mt-1">Pending</Text>
                </VStack>
                <View className="w-px bg-[#3C443F]" />
                <VStack className="items-center">
                  <Text className="text-white text-2xl font-bold">{stats.activeUsers}</Text>
                  <Text className="text-[#6B7280] text-xs mt-1">Active</Text>
                </VStack>
              </HStack>
            </View>
          </View>

          {/* Departments */}
          <View className="mb-6">
            <HStack className="justify-between items-center mb-4">
              <Text className="text-[#C5D4CA] text-xs font-semibold uppercase tracking-wide">
                Departments
              </Text>
              <TouchableOpacity onPress={() => router.push("/admin/departments")}>
                <Text className="text-[#BCF3FF] text-sm font-semibold">See All</Text>
              </TouchableOpacity>
            </HStack>
            
            <View className="bg-[#2A2A2D] rounded-2xl p-5">
              <VStack space="md">
                {departmentStats.slice(0, 3).map((dept, index) => (
                  <TouchableOpacity
                    key={dept.id}
                    onPress={() => router.push(`/admin/departments/${dept.id}`)}
                    className={`${index !== departmentStats.length - 1 ? "pb-4 border-b border-[#3C443F]" : ""}`}
                  >
                    <HStack className="items-center justify-between">
                      <VStack className="flex-1">
                        <Text className="text-white font-semibold text-base">{dept.name}</Text>
                        <HStack className="items-center mt-1" space="md">
                          <Text className="text-[#6B7280] text-xs">{dept.studentCount} Students</Text>
                          <Text className="text-[#6B7280] text-xs">{dept.teacherCount} Teachers</Text>
                          <Text className="text-[#6B7280] text-xs">{dept.courseCount} Courses</Text>
                        </HStack>
                      </VStack>
                      <Icon as={ChevronRight} size="sm" className="text-[#3C443F]" />
                    </HStack>
                  </TouchableOpacity>
                ))}
              </VStack>
            </View>
          </View>

          {/* Recent Activity */}
          <View className="mb-6">
            <Text className="text-[#C5D4CA] text-xs font-semibold uppercase tracking-wide mb-4">
              Recent Activity
            </Text>
            
            {recentActivity.length === 0 ? (
              <View className="bg-[#2A2A2D] rounded-2xl p-6 items-center border border-dashed border-[#3C443F]">
                <Text className="text-[#6B7280] text-sm">No recent activity</Text>
              </View>
            ) : (
              <View className="bg-[#2A2A2D] rounded-2xl p-5">
                <VStack space="md">
                  {recentActivity.slice(0, 4).map((activity, index) => (
                    <View
                      key={activity.id}
                      className={`${index !== recentActivity.length - 1 ? "pb-4 border-b border-[#3C443F]" : ""}`}
                    >
                      <HStack className="items-start" space="sm">
                        <View className="w-2 h-2 rounded-full bg-[#7477FF] mt-2" />
                        <VStack className="flex-1">
                          <Text className="text-white font-medium text-sm">{activity.description}</Text>
                          <HStack className="items-center mt-1" space="sm">
                            <Text className="text-[#6B7280] text-xs">{activity.userName}</Text>
                            <Text className="text-[#3C443F]">•</Text>
                            <Text className="text-[#6B7280] text-xs">{formatTimeAgo(activity.timestamp)}</Text>
                          </HStack>
                        </VStack>
                      </HStack>
                    </View>
                  ))}
                </VStack>
              </View>
            )}
          </View>

          {/* Error State */}
          {error && (
            <View className="mb-6">
              <View className="bg-[#F96857]/10 rounded-2xl p-6 items-center">
                <Text className="text-[#C5D4CA] text-center mb-4">{error}</Text>
                <TouchableOpacity
                  onPress={handleRefresh}
                  className="bg-[#7477FF] px-6 py-3 rounded-xl"
                >
                  <Text className="text-white font-semibold">Retry</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Bottom Padding */}
          <View className="h-24" />
        </View>
      </Animated.ScrollView>
    </View>
  );
}
