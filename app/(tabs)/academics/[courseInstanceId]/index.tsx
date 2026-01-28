import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
} from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import { useCourseDetails } from "@/lib/hooks/useCourseDetails";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";

export default function CourseDetailScreen() {
  const { courseInstanceId } = useLocalSearchParams<{
    courseInstanceId: string;
  }>();
  const { role } = useAuth();
  const { courseDetails, loading, error, refresh } = useCourseDetails(
    courseInstanceId as string
  );

  const sections = [
    {
      id: "materials",
      title: "Study Materials",
      icon: BookOpen,
      description: "Notes, PDFs, and resources",
      route: `/(tabs)/academics/${courseInstanceId}/materials`,
    },
    {
      id: "assignments",
      title: "Assignments",
      icon: FileText,
      description: "Submit and track assignments",
      route: `/(tabs)/academics/${courseInstanceId}/assignments`,
    },
    {
      id: "discussions",
      title: "Discussion Forum",
      icon: MessageSquare,
      description: "Ask doubts and participate",
      route: `/(tabs)/academics/${courseInstanceId}/discussions`,
    },
    {
      id: "marks",
      title: "Marks & Results",
      icon: Award,
      description: "View your performance",
      route: `/(tabs)/academics/${courseInstanceId}/marks`,
    },
    {
      id: "attendance",
      title: "Attendance",
      icon: Calendar,
      description: "Track your attendance",
      route: `/(tabs)/academics/${courseInstanceId}/attendance`,
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text className="text-gray-600 mt-4">Loading course details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !courseDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text className="text-red-600 text-center text-lg">{error}</Text>
          <TouchableOpacity onPress={refresh} style={styles.retryButton}>
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { course, semester, section, teacherNames } = courseDetails;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        {/* Course Header Card */}
        <View style={styles.headerCard}>
          <VStack space="lg">
            {/* Course Name */}
            <View>
              <Text className="text-2xl font-bold text-black">
                {course.name}
              </Text>
              <Text className="text-base text-gray-600 mt-1">
                {course.courseCode}
              </Text>
            </View>

            {/* Course Info Grid */}
            <View style={styles.infoGrid}>
              {/* Credits */}
              <View style={styles.infoItem}>
                <HStack space="xs" className="items-center">
                  <Icon as={BookOpen} size="sm" className="text-gray-600" />
                  <Text className="text-sm text-gray-500">Credits</Text>
                </HStack>
                <Text className="text-lg font-bold text-black mt-1">
                  {course.credits}
                </Text>
              </View>

              {/* Semester */}
              <View style={styles.infoItem}>
                <HStack space="xs" className="items-center">
                  <Icon as={Calendar} size="sm" className="text-gray-600" />
                  <Text className="text-sm text-gray-500">Semester</Text>
                </HStack>
                <Text className="text-lg font-bold text-black mt-1">
                  {semester}
                </Text>
              </View>

              {/* Section */}
              <View style={styles.infoItem}>
                <HStack space="xs" className="items-center">
                  <Icon as={Users} size="sm" className="text-gray-600" />
                  <Text className="text-sm text-gray-500">Section</Text>
                </HStack>
                <Text className="text-lg font-bold text-black mt-1">
                  {section}
                </Text>
              </View>

              {/* Department */}
              <View style={styles.infoItem}>
                <HStack space="xs" className="items-center">
                  <Icon as={Building} size="sm" className="text-gray-600" />
                  <Text className="text-sm text-gray-500">Department</Text>
                </HStack>
                <Text className="text-lg font-bold text-black mt-1">
                  {course.departmentId?.toUpperCase() || "N/A"}
                </Text>
              </View>
            </View>

            {/* Teachers */}
            {teacherNames && teacherNames.length > 0 && (
              <View>
                <Text className="text-sm text-gray-500 mb-2">
                  {teacherNames.length === 1 ? "Instructor" : "Instructors"}
                </Text>
                <VStack space="xs">
                  {teacherNames.map((name, index) => (
                    <HStack key={index} space="xs" className="items-center">
                      <View style={styles.bullet} />
                      <Text className="text-base text-black">{name}</Text>
                    </HStack>
                  ))}
                </VStack>
              </View>
            )}

            {/* Course Type Badge */}
            {course.isElective && (
              <View style={styles.electiveBadge}>
                <Text className="text-sm font-semibold text-blue-600">
                  📚 Elective Course
                </Text>
              </View>
            )}

            {/* Lab Required */}
            {course.metadata?.labRequired && (
              <View style={styles.labBadge}>
                <Text className="text-sm font-semibold text-purple-600">
                  🔬 Lab Component
                </Text>
              </View>
            )}
          </VStack>
        </View>

        {/* Sections List */}
        <View style={styles.sectionsContainer}>
          <Text className="text-lg font-bold text-black mb-3 px-4">
            Course Content
          </Text>

          {sections.map((section, index) => (
            <TouchableOpacity
              key={section.id}
              style={[
                styles.sectionCard,
                index === sections.length - 1 && { marginBottom: 0 },
              ]}
              onPress={() => router.push(section.route as any)}
              activeOpacity={0.7}
            >
              <HStack className="items-center justify-between">
                <HStack space="md" className="items-center flex-1">
                  <View style={styles.iconContainer}>
                    <Icon
                      as={section.icon}
                      size="md"
                      className="text-black"
                    />
                  </View>
                  <VStack space="xs" className="flex-1">
                    <Text className="text-base font-semibold text-black">
                      {section.title}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {section.description}
                    </Text>
                  </VStack>
                </HStack>
                <Icon as={ChevronRight} size="md" className="text-gray-400" />
              </HStack>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#000000",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  infoItem: {
    width: "50%",
    padding: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#9CA3AF",
  },
  electiveBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  labBadge: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  sectionsContainer: {
    marginTop: 8,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
});
