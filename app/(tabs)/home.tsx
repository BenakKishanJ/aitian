import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Image,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Bell,
  Calendar,
  FileText,
  BookOpen,
  Users,
  TrendingUp,
  Send,
  UserCheck,
  MessageSquare,
  BarChart3,
  ClipboardCheck,
  GraduationCap,
  ChevronRight,
  AlertCircle,
  Shield,
  Heart,
  User,
} from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import { useHomeData } from "@/lib/hooks/useHomeData";

import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";

const { width, height } = Dimensions.get("window");

const profileImages: Record<string, { male: any; female: any }> = {
  student: {
    male: require("@/assets/images/profile/student_male.png"),
    female: require("@/assets/images/profile/student_female.png"),
  },
  teacher: {
    male: require("@/assets/images/profile/teacher_male.png"),
    female: require("@/assets/images/profile/teacher_female.png"),
  },
  parent: {
    male: require("@/assets/images/profile/parent_male.png"),
    female: require("@/assets/images/profile/parent_female.png"),
  },
  admin: {
    male: require("@/assets/images/profile/admin_male.png"),
    female: require("@/assets/images/profile/admin_female.png"),
  },
};

const roleConfig: Record<string, {
  color: string;
  accentColor: string;
  icon: any;
  label: string;
  bgColor: string;
  lightBg: string;
  darkBorder: string;
}> = {
  student: {
    color: "#BCF3FF",
    accentColor: "#BCF3FF",
    icon: GraduationCap,
    label: "Student",
    bgColor: "#E5FBFF",
    lightBg: "rgba(188, 243, 255, 1)",
    darkBorder: "#7DD3E8",
  },
  teacher: {
    color: "#F96857",
    accentColor: "#F96857",
    icon: User,
    label: "Teacher",
    bgColor: "#FDE1DD",
    lightBg: "rgba(249, 104, 87, 1)",
    darkBorder: "#E54D3C",
  },
  parent: {
    color: "#F9CD61",
    accentColor: "#F9CD61",
    icon: Heart,
    label: "Parent",
    bgColor: "#FDF3D1",
    lightBg: "rgba(249, 205, 97, 1)",
    darkBorder: "#E5B84D",
  },
  admin: {
    color: "#7477FF",
    accentColor: "#7477FF",
    icon: Shield,
    label: "Admin",
    bgColor: "#E1E3FF",
    lightBg: "rgba(116, 119, 255, 1)",
    darkBorder: "#5A5DE8",
  },
};

const quickActionsByRole: Record<string, Array<{ icon: any; label: string; color: string; route: string }>> = {
  student: [
    { icon: Calendar, label: "Timetable", color: "#BCF3FF", route: "/(tabs)/calendar" },
    { icon: FileText, label: "Assignments", color: "#F96857", route: "/(tabs)/academics" },
    { icon: UserCheck, label: "Attendance", color: "#F9CD61", route: "/(tabs)/academics" },
    { icon: MessageSquare, label: "News", color: "#7477FF", route: "/(tabs)/news" },
  ],
  teacher: [
    { icon: Send, label: "Create Post", color: "#BCF3FF", route: "/(tabs)/news" },
    { icon: BookOpen, label: "My Courses", color: "#F96857", route: "/(tabs)/academics" },
    { icon: UserCheck, label: "Attendance", color: "#F9CD61", route: "/(tabs)/calendar" },
    { icon: ClipboardCheck, label: "Grading", color: "#7477FF", route: "/(tabs)/academics" },
  ],
  parent: [
    { icon: TrendingUp, label: "Performance", color: "#BCF3FF", route: "/(tabs)/academics" },
    { icon: Calendar, label: "Schedule", color: "#F96857", route: "/(tabs)/calendar" },
    { icon: UserCheck, label: "Attendance", color: "#F9CD61", route: "/(tabs)/academics" },
    { icon: MessageSquare, label: "Contact", color: "#7477FF", route: "/(tabs)/news" },
  ],
  admin: [
    { icon: Users, label: "Manage Users", color: "#BCF3FF", route: "/(tabs)/profile" },
    { icon: BookOpen, label: "Courses", color: "#F96857", route: "/(tabs)/academics" },
    { icon: BarChart3, label: "Reports", color: "#F9CD61", route: "/(tabs)/profile" },
    { icon: Send, label: "Announce", color: "#7477FF", route: "/(tabs)/news" },
  ],
};

export default function HomeScreen() {
  const { user, userData, role } = useAuth();
  const router = useRouter();
  const {
    stats,
    todayClasses,
    recentAnnouncements,
    attendanceAlert,
    loading,
    error,
    refresh,
  } = useHomeData();

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

  const userRole = role || "student";
  const gender = userData?.gender || "male";
  const config = roleConfig[userRole] || roleConfig.student;
  const quickActions = quickActionsByRole[userRole] || quickActionsByRole.student;

  const getProfileImage = () => {
    const roleImages = profileImages[userRole] || profileImages.student;
    return roleImages[gender] || roleImages.male;
  };

  const getWeekDays = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const weekDays = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      weekDays.push({
        day: days[date.getDay()],
        date: date.getDate(),
        isToday: i === 0,
      });
    }
    return weekDays;
  };

  const weekDays = getWeekDays();

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-[#1C1C1E] items-center justify-center">
        <View className="w-16 h-16 rounded-full bg-[#2A2A2D] items-center justify-center">
          <View className="w-8 h-8 rounded-full border-2 border-[#BCF3FF] border-t-transparent animate-spin" />
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#BCF3FF"
            colors={["#BCF3FF"]}
          />
        }
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
              onPress={() => router.push("/(tabs)/profile")}
              className="w-12 h-12 rounded-full items-center justify-center overflow-hidden"
              style={{
                backgroundColor: config.lightBg,
                borderWidth: 2,
                borderColor: config.darkBorder,
              }}
            >
              <Image
                source={getProfileImage()}
                style={{ width: 36, height: 36 }}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* Notification Button */}
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/news")}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{
                backgroundColor: config.lightBg,
                borderWidth: 2,
                borderColor: config.darkBorder,
              }}
            >
              <Icon as={Bell} size="md" style={{ color: config.darkBorder }} />
              {(stats.pendingAssignments || 0) > 0 && (
                <View className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#F96857] items-center justify-center">
                  <Text className="text-white text-xs font-bold">
                    {(stats.pendingAssignments || 0) > 9 ? "9+" : stats.pendingAssignments}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Dark Content Card - Same as Profile Page */}
        <View className="bg-[#1C1C1E] rounded-t-3xl -mt-6 px-6 pt-8 pb-6">
          {/* Greeting Section with Role-based Color */}
          <View
            className="rounded-2xl p-5 mb-6"
            style={{ backgroundColor: config.bgColor }}
          >
            <HStack className="items-center mb-2">
              <View
                className="rounded-full px-3 py-1 mr-3"
                style={{ backgroundColor: config.accentColor }}
              >
                <HStack className="items-center" space="xs">
                  <Icon as={config.icon} size="2xs" className="text-[#232323]" />
                  <Text className="text-[#232323] text-xs font-bold">
                    {config.label}
                  </Text>
                </HStack>
              </View>
              <Text className="text-[#232323]/70 text-sm">{getFormattedDate()}</Text>
            </HStack>

            <Text className="text-[#232323] text-2xl font-bold">
              {getGreeting()},
            </Text>
            <Text className="text-[#232323] text-2xl font-bold">
              {userData?.name?.split(" ")[0] || "User"}!
            </Text>
          </View>

          {/* Week View - Events Overview */}
          <View className="mb-6">
            <Text className="text-[#C5D4CA] text-xs font-semibold uppercase tracking-wide mb-4">
              This Week
            </Text>
            <View className="bg-[#2A2A2D] rounded-2xl p-4">
              <HStack className="justify-between">
                {weekDays.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    className={`items-center justify-center w-10 h-14 rounded-xl ${day.isToday
                      ? "bg-[#BCF3FF]"
                      : "bg-transparent"
                      }`}
                  >
                    <Text
                      className={`text-xs mb-1 ${day.isToday ? "text-[#232323]" : "text-[#6B7280]"
                        }`}
                    >
                      {day.day}
                    </Text>
                    <Text
                      className={`text-lg font-bold ${day.isToday ? "text-[#232323]" : "text-white"
                        }`}
                    >
                      {day.date}
                    </Text>
                  </TouchableOpacity>
                ))}
              </HStack>
            </View>
          </View>

          {/* Today's Schedule */}
          {todayClasses.length > 0 && (
            <View className="mb-6">
              <HStack className="justify-between items-center mb-4">
                <Text className="text-[#C5D4CA] text-xs font-semibold uppercase tracking-wide">
                  Today's Schedule
                </Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/calendar")}>
                  <Text className="text-[#BCF3FF] text-sm font-semibold">See All</Text>
                </TouchableOpacity>
              </HStack>

              <View className="bg-[#2A2A2D] rounded-2xl p-5">
                <VStack space="md">
                  {todayClasses.slice(0, 3).map((classItem, index) => (
                    <TouchableOpacity
                      key={classItem.id}
                      onPress={() => router.push("/(tabs)/calendar")}
                      className={`${index !== todayClasses.length - 1 ? "pb-4 border-b border-[#3C443F]" : ""}`}
                    >
                      <HStack className="items-center" space="md">
                        <View className="items-center w-14">
                          <Text className="text-white font-bold text-sm">
                            {classItem.startTime.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </Text>
                          <Text className="text-[#6B7280] text-xs">
                            {classItem.endTime.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </Text>
                        </View>

                        <View className="flex-1">
                          <HStack className="items-center" space="sm">
                            <Text className="text-white font-semibold text-base flex-1" numberOfLines={1}>
                              {classItem.title}
                            </Text>
                            {classItem.isNext && (
                              <View className="bg-[#BCF3FF] px-2 py-0.5 rounded">
                                <Text className="text-[#232323] text-xs font-bold">Next</Text>
                              </View>
                            )}
                          </HStack>
                          {classItem.courseName && (
                            <Text className="text-[#C5D4CA] text-sm mt-0.5" numberOfLines={1}>
                              {classItem.courseName}
                            </Text>
                          )}
                        </View>

                        <View
                          className={`w-1.5 h-12 rounded-full ${classItem.isNext
                            ? "bg-[#BCF3FF]"
                            : classItem.isPast
                              ? "bg-[#3C443F]"
                              : "bg-[#7477FF]"
                            }`}
                        />
                      </HStack>
                    </TouchableOpacity>
                  ))}
                </VStack>
              </View>
            </View>
          )}

          {/* Quick Actions - Colorful Cards */}
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

          {/* Stats Overview */}
          <View className="mb-6">
            <Text className="text-[#C5D4CA] text-xs font-semibold uppercase tracking-wide mb-4">
              Overview
            </Text>
            <View className="bg-[#2A2A2D] rounded-2xl p-5">
              <HStack className="justify-between">
                {userRole === "student" && (
                  <>
                    <VStack className="items-center">
                      <Text className="text-white text-2xl font-bold">
                        {stats.attendancePercentage || 0}%
                      </Text>
                      <Text className="text-[#6B7280] text-xs mt-1">Attendance</Text>
                    </VStack>
                    <View className="w-px bg-[#3C443F]" />
                    <VStack className="items-center">
                      <Text className="text-white text-2xl font-bold">
                        {stats.pendingAssignments || 0}
                      </Text>
                      <Text className="text-[#6B7280] text-xs mt-1">Pending</Text>
                    </VStack>
                    <View className="w-px bg-[#3C443F]" />
                    <VStack className="items-center">
                      <Text className="text-white text-2xl font-bold">
                        {stats.enrolledCourses || 0}
                      </Text>
                      <Text className="text-[#6B7280] text-xs mt-1">Courses</Text>
                    </VStack>
                  </>
                )}
                {userRole === "teacher" && (
                  <>
                    <VStack className="items-center">
                      <Text className="text-white text-2xl font-bold">
                        {stats.classesToday || 0}
                      </Text>
                      <Text className="text-[#6B7280] text-xs mt-1">Classes</Text>
                    </VStack>
                    <View className="w-px bg-[#3C443F]" />
                    <VStack className="items-center">
                      <Text className="text-white text-2xl font-bold">
                        {stats.pendingGradings || 0}
                      </Text>
                      <Text className="text-[#6B7280] text-xs mt-1">To Grade</Text>
                    </VStack>
                    <View className="w-px bg-[#3C443F]" />
                    <VStack className="items-center">
                      <Text className="text-white text-2xl font-bold">
                        {stats.totalStudents || 0}
                      </Text>
                      <Text className="text-[#6B7280] text-xs mt-1">Students</Text>
                    </VStack>
                  </>
                )}
                {userRole === "admin" && (
                  <>
                    <VStack className="items-center">
                      <Text className="text-white text-2xl font-bold">
                        {stats.totalStudentsCount || 0}
                      </Text>
                      <Text className="text-[#6B7280] text-xs mt-1">Students</Text>
                    </VStack>
                    <View className="w-px bg-[#3C443F]" />
                    <VStack className="items-center">
                      <Text className="text-white text-2xl font-bold">
                        {stats.totalTeachersCount || 0}
                      </Text>
                      <Text className="text-[#6B7280] text-xs mt-1">Teachers</Text>
                    </VStack>
                    <View className="w-px bg-[#3C443F]" />
                    <VStack className="items-center">
                      <Text className="text-white text-2xl font-bold">
                        {stats.totalCoursesCount || 0}
                      </Text>
                      <Text className="text-[#6B7280] text-xs mt-1">Courses</Text>
                    </VStack>
                  </>
                )}
                {userRole === "parent" && (
                  <>
                    <VStack className="items-center">
                      <Text className="text-white text-2xl font-bold">
                        {stats.childAttendance || 0}%
                      </Text>
                      <Text className="text-[#6B7280] text-xs mt-1">Attendance</Text>
                    </VStack>
                    <View className="w-px bg-[#3C443F]" />
                    <VStack className="items-center">
                      <Text className="text-white text-2xl font-bold">
                        {stats.childPendingAssignments || 0}
                      </Text>
                      <Text className="text-[#6B7280] text-xs mt-1">Pending</Text>
                    </VStack>
                    <View className="w-px bg-[#3C443F]" />
                    <VStack className="items-center">
                      <Text className="text-white text-2xl font-bold">
                        {stats.childTodayClasses || 0}
                      </Text>
                      <Text className="text-[#6B7280] text-xs mt-1">Classes</Text>
                    </VStack>
                  </>
                )}
              </HStack>
            </View>
          </View>

          {/* Recent Announcements */}
          {recentAnnouncements.length > 0 && (
            <View className="mb-6">
              <HStack className="justify-between items-center mb-4">
                <Text className="text-[#C5D4CA] text-xs font-semibold uppercase tracking-wide">
                  Recent News
                </Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/news")}>
                  <Text className="text-[#BCF3FF] text-sm font-semibold">See All</Text>
                </TouchableOpacity>
              </HStack>

              <View className="bg-[#2A2A2D] rounded-2xl p-5">
                <VStack space="md">
                  {recentAnnouncements.slice(0, 3).map((announcement, index) => (
                    <TouchableOpacity
                      key={announcement.id}
                      onPress={() => router.push("/(tabs)/news")}
                      className={`${index !== recentAnnouncements.length - 1 ? "pb-4 border-b border-[#3C443F]" : ""}`}
                    >
                      <HStack className="items-start" space="sm">
                        {announcement.isPinned && (
                          <View className="bg-[#F9CD61] px-2 py-0.5 rounded mt-0.5">
                            <Text className="text-[#232323] text-xs font-bold">PINNED</Text>
                          </View>
                        )}
                        <VStack className="flex-1">
                          <Text className="text-white font-semibold text-base" numberOfLines={1}>
                            {announcement.title}
                          </Text>
                          <Text className="text-[#C5D4CA] text-sm mt-1" numberOfLines={2}>
                            {announcement.content}
                          </Text>
                          <HStack className="items-center mt-2" space="sm">
                            <Text className="text-[#6B7280] text-xs">by {announcement.authorName}</Text>
                            <Text className="text-[#3C443F]">•</Text>
                            <Text className="text-[#6B7280] text-xs">
                              {announcement.timestamp.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </Text>
                          </HStack>
                        </VStack>
                        <Icon as={ChevronRight} size="sm" className="text-[#3C443F] mt-1" />
                      </HStack>
                    </TouchableOpacity>
                  ))}
                </VStack>
              </View>
            </View>
          )}

          {/* Attendance Alert */}
          {attendanceAlert && (userRole === "student" || userRole === "parent") && (
            <View className="mb-6">
              <View className="bg-[#F96857]/10 border border-[#F96857]/30 rounded-2xl p-4">
                <HStack className="items-start" space="sm">
                  <View className="w-10 h-10 rounded-xl bg-[#F96857]/20 items-center justify-center">
                    <Icon as={AlertCircle} size="sm" className="text-[#F96857]" />
                  </View>
                  <VStack className="flex-1">
                    <Text className="text-white font-semibold text-base">Attendance Alert</Text>
                    <Text className="text-[#C5D4CA] text-sm mt-1">
                      {userRole === "student"
                        ? "Your attendance is below 75%. Please attend classes regularly."
                        : "Your child's attendance is below 75%. Please ensure regular attendance."}
                    </Text>
                  </VStack>
                </HStack>
              </View>
            </View>
          )}

          {/* Error State */}
          {error && (
            <View className="mb-6">
              <View className="bg-[#F96857]/10 rounded-2xl p-6 items-center">
                <Text className="text-[#C5D4CA] text-center mb-4">{error}</Text>
                <TouchableOpacity
                  onPress={handleRefresh}
                  className="bg-[#BCF3FF] px-6 py-3 rounded-xl"
                >
                  <Text className="text-black font-semibold">Retry</Text>
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
