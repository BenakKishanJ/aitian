import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  BookOpen,
  FileText,
  MessageSquare,
  Award,
  Calendar,
  Users,
  ChevronRight,
  Building,
  Shield,
  Heart,
  User,
  GraduationCap,
  ArrowLeft,
} from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import { useCourseDetails } from "@/lib/hooks/useCourseDetails";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";

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
    lightBg: "rgba(188, 243, 255, 0.25)",
    darkBorder: "#7DD3E8",
  },
  teacher: {
    color: "#F96857",
    accentColor: "#F96857",
    icon: User,
    label: "Teacher",
    bgColor: "#FDE1DD",
    lightBg: "rgba(249, 104, 87, 0.25)",
    darkBorder: "#E54D3C",
  },
  parent: {
    color: "#F9CD61",
    accentColor: "#F9CD61",
    icon: Heart,
    label: "Parent",
    bgColor: "#FDF3D1",
    lightBg: "rgba(249, 205, 97, 0.25)",
    darkBorder: "#E5B84D",
  },
  admin: {
    color: "#7477FF",
    accentColor: "#7477FF",
    icon: Shield,
    label: "Admin",
    bgColor: "#E1E3FF",
    lightBg: "rgba(116, 119, 255, 0.25)",
    darkBorder: "#5A5DE8",
  },
};

export default function CourseDetailScreen() {
  const { courseInstanceId } = useLocalSearchParams<{ courseInstanceId: string }>();
  const { role, userData } = useAuth();
  const { courseDetails, loading, error, refresh } = useCourseDetails(courseInstanceId as string);

  const scrollY = new Animated.Value(0);
  const HEADER_MAX_HEIGHT = 300;
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

  const userRole = role || "student";
  const gender = userData?.gender || "male";
  const config = roleConfig[userRole] || roleConfig.student;

  const getProfileImage = () => {
    const roleImages = profileImages[userRole] || profileImages.student;
    return roleImages[gender] || roleImages.male;
  };

  const sections = [
    {
      id: "materials",
      title: "Study Materials",
      icon: BookOpen,
      description: "Notes, PDFs, and resources",
      bgColor: "#BCF3FF",
      iconBg: "#232323",
      iconColor: "#BCF3FF",
      textColor: "#232323",
      subTextColor: "#232323",
      route: `/(tabs)/academics/${courseInstanceId}/materials`,
    },
    {
      id: "assignments",
      title: "Assignments",
      icon: FileText,
      description: "Submit and track assignments",
      bgColor: "#F96857",
      iconBg: "#FFFFFF",
      iconColor: "#F96857",
      textColor: "#FFFFFF",
      subTextColor: "#FFE5E2",
      route: `/(tabs)/academics/${courseInstanceId}/assignments`,
    },
    {
      id: "discussions",
      title: "Discussion Forum",
      icon: MessageSquare,
      description: "Ask doubts and participate",
      bgColor: "#F9CD61",
      iconBg: "#232323",
      iconColor: "#F9CD61",
      textColor: "#232323",
      subTextColor: "#232323",
      route: `/(tabs)/academics/${courseInstanceId}/discussions`,
    },
    {
      id: "marks",
      title: "Marks & Results",
      icon: Award,
      description: "View your performance",
      bgColor: "#7477FF",
      iconBg: "#FFFFFF",
      iconColor: "#7477FF",
      textColor: "#FFFFFF",
      subTextColor: "#E1E3FF",
      route: `/(tabs)/academics/${courseInstanceId}/marks`,
    },
    {
      id: "attendance",
      title: "Attendance",
      icon: Calendar,
      description: "Track your attendance",
      bgColor: "#C5D4CA",
      iconBg: "#232323",
      iconColor: "#C5D4CA",
      textColor: "#232323",
      subTextColor: "#232323",
      route: `/(tabs)/academics/${courseInstanceId}/attendance`,
    },
  ];

  if (loading) {
    return (
      <View className="flex-1 bg-[#1C1C1E] items-center justify-center">
        <View className="w-16 h-16 rounded-full bg-[#2A2A2D] items-center justify-center">
          <ActivityIndicator size="large" color="#BCF3FF" />
        </View>
        <Text className="text-[#C5D4CA] mt-4 text-base">Loading course details...</Text>
      </View>
    );
  }

  if (error || !courseDetails) {
    return (
      <View className="flex-1 bg-[#1C1C1E] items-center justify-center px-6">
        <Text className="text-[#C5D4CA] text-center text-lg mb-4">{error}</Text>
        <TouchableOpacity onPress={refresh} className="bg-[#BCF3FF] px-6 py-3 rounded-xl">
          <Text className="text-black font-semibold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { course, semester, section, teacherNames } = courseDetails;

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
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#BCF3FF" />
        }
      >
        {/* Animated Header with course.png Illustration */}
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
            source={require("@/assets/images/course.png")}
            style={{
              width: "100%",
              height: "100%",
              transform: [{ scale: imageScale }],
              opacity: headerOpacity,
            }}
            resizeMode="cover"
          />
          
          {/* Header Buttons */}
          <View className="absolute top-12 left-0 right-0 px-6 flex-row justify-between items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{
                backgroundColor: config.lightBg,
                borderWidth: 2,
                borderColor: config.darkBorder,
              }}
            >
              <Icon as={ArrowLeft} size="md" style={{ color: config.darkBorder }} />
            </TouchableOpacity>
            
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
          </View>
        </Animated.View>

        {/* Dark Content Card */}
        <View className="bg-[#1C1C1E] rounded-t-3xl -mt-6 px-6 pt-8 pb-6">
          {/* Course Header Card */}
          <View className="bg-[#2A2A2D] rounded-2xl p-5 mb-6">
            <VStack space="md">
              {/* Course Name */}
              <View>
                <Text className="text-white text-2xl font-bold">
                  {course.name}
                </Text>
                <Text className="text-[#BCF3FF] text-base mt-1">
                  {course.courseCode}
                </Text>
              </View>

              {/* Info Grid */}
              <View className="flex-row flex-wrap">
                <View className="w-1/2 mb-4">
                  <HStack className="items-center" space="xs">
                    <Icon as={BookOpen} size="sm" className="text-[#6B7280]" />
                    <Text className="text-[#6B7280] text-sm">Credits</Text>
                  </HStack>
                  <Text className="text-white text-xl font-bold mt-1">
                    {course.credits}
                  </Text>
                </View>

                <View className="w-1/2 mb-4">
                  <HStack className="items-center" space="xs">
                    <Icon as={Calendar} size="sm" className="text-[#6B7280]" />
                    <Text className="text-[#6B7280] text-sm">Semester</Text>
                  </HStack>
                  <Text className="text-white text-xl font-bold mt-1">
                    {semester}
                  </Text>
                </View>

                <View className="w-1/2">
                  <HStack className="items-center" space="xs">
                    <Icon as={Users} size="sm" className="text-[#6B7280]" />
                    <Text className="text-[#6B7280] text-sm">Section</Text>
                  </HStack>
                  <Text className="text-white text-xl font-bold mt-1">
                    {section}
                  </Text>
                </View>

                <View className="w-1/2">
                  <HStack className="items-center" space="xs">
                    <Icon as={Building} size="sm" className="text-[#6B7280]" />
                    <Text className="text-[#6B7280] text-sm">Department</Text>
                  </HStack>
                  <Text className="text-white text-xl font-bold mt-1">
                    {course.departmentId?.toUpperCase() || "N/A"}
                  </Text>
                </View>
              </View>

              {/* Teachers */}
              {teacherNames && teacherNames.length > 0 && (
                <View className="pt-4 border-t border-[#3C443F]">
                  <Text className="text-[#6B7280] text-sm mb-2">
                    {teacherNames.length === 1 ? "Instructor" : "Instructors"}
                  </Text>
                  <VStack space="xs">
                    {teacherNames.map((name, index) => (
                      <HStack key={index} className="items-center" space="xs">
                        <View className="w-2 h-2 rounded-full bg-[#BCF3FF]" />
                        <Text className="text-white text-base">{name}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </View>
              )}

              {/* Course Type Badge */}
              {course.isElective && (
                <View className="bg-[#BCF3FF] self-start px-3 py-2 rounded-lg">
                  <Text className="text-black text-sm font-bold">📚 Elective Course</Text>
                </View>
              )}
            </VStack>
          </View>

          {/* Course Content Sections */}
          <Text className="text-[#C5D4CA] text-xs font-semibold uppercase tracking-wide mb-4">
            Course Content
          </Text>

          <VStack space="md">
            {sections.map((section, index) => (
              <TouchableOpacity
                key={section.id}
                onPress={() => router.push(section.route as any)}
                className="rounded-2xl p-4"
                style={{ backgroundColor: section.bgColor }}
              >
                <HStack className="items-center justify-between">
                  <HStack className="items-center flex-1" space="md">
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center"
                      style={{ backgroundColor: section.iconBg }}
                    >
                      <Icon as={section.icon} size="md" style={{ color: section.iconColor }} />
                    </View>
                    <VStack className="flex-1">
                      <Text
                        className="text-base font-semibold"
                        style={{ color: section.textColor }}
                      >
                        {section.title}
                      </Text>
                      <Text style={{ color: section.subTextColor }} className="text-sm">
                        {section.description}
                      </Text>
                    </VStack>
                  </HStack>
                  {/* White rounded square with black arrow */}
                  <View className="w-8 h-8 rounded-lg bg-white items-center justify-center">
                    <Icon as={ChevronRight} size="md" className="text-[#232323]" />
                  </View>
                </HStack>
              </TouchableOpacity>
            ))}
          </VStack>

          {/* Bottom Padding */}
          <View className="h-24" />
        </View>
      </Animated.ScrollView>
    </View>
  );
}
