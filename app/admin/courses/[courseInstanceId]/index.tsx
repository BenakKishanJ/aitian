import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
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
  GraduationCap,
  Edit3,
  Trash2,
  MoreVertical,
} from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import { useCourseDetails } from "@/lib/hooks/useCourseDetails";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { doc, deleteDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Course } from "@/types";
import { COLLECTIONS } from "@/types/constants";

export default function AdminCourseDetailScreen() {
  const { courseInstanceId } = useLocalSearchParams<{
    courseInstanceId: string;
  }>();
  const { role } = useAuth();
  const { courseDetails, loading, error, refresh } = useCourseDetails(
    courseInstanceId as string
  );
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const sections = [
    {
      id: "materials",
      title: "Study Materials",
      icon: BookOpen,
      description: "Manage course notes, PDFs, and resources",
      route: `/admin/courses/${courseInstanceId}/materials`,
      adminOnly: false,
      color: "#BCF3FF",
    },
    {
      id: "assignments",
      title: "Assignments",
      icon: FileText,
      description: "Create and manage assignments",
      route: `/admin/courses/${courseInstanceId}/assignments`,
      adminOnly: false,
      color: "#F96857",
    },
    {
      id: "discussions",
      title: "Discussion Forum",
      icon: MessageSquare,
      description: "Moderate discussions and Q&A",
      route: `/admin/courses/${courseInstanceId}/discussions`,
      adminOnly: false,
      color: "#F9CD61",
    },
    {
      id: "marks",
      title: "Marks & Results",
      icon: Award,
      description: "View and manage student grades",
      route: `/admin/courses/${courseInstanceId}/marks`,
      adminOnly: false,
      color: "#7477FF",
    },
    {
      id: "attendance",
      title: "Attendance",
      icon: Calendar,
      description: "Track and manage attendance records",
      route: `/admin/courses/${courseInstanceId}/attendance`,
      adminOnly: false,
      color: "#5AA578",
    },
    {
      id: "enrollments",
      title: "Enrolled Students",
      icon: Users,
      description: "View and manage student enrollments",
      route: `/admin/courses/${courseInstanceId}/enrollments`,
      adminOnly: true,
      color: "#BCF3FF",
    },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleDeleteCourse = async () => {
    Alert.alert(
      "Delete Course Instance",
      "Are you sure you want to delete this course instance? This will also delete all related data (enrollments, materials, assignments, discussions, attendance, and marks). This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const batch = writeBatch(db);

              const enrollmentsQuery = query(
                collection(db, COLLECTIONS.ENROLLMENTS),
                where("courseInstanceId", "==", courseInstanceId)
              );
              const enrollmentsSnap = await getDocs(enrollmentsQuery);
              enrollmentsSnap.docs.forEach((doc) => {
                batch.delete(doc.ref);
              });

              const materialsQuery = query(
                collection(db, COLLECTIONS.MATERIALS),
                where("courseInstanceId", "==", courseInstanceId)
              );
              const materialsSnap = await getDocs(materialsQuery);
              materialsSnap.docs.forEach((doc) => {
                batch.delete(doc.ref);
              });

              const assignmentsQuery = query(
                collection(db, COLLECTIONS.ASSIGNMENTS),
                where("courseInstanceId", "==", courseInstanceId)
              );
              const assignmentsSnap = await getDocs(assignmentsQuery);
              for (const assignmentDoc of assignmentsSnap.docs) {
                const submissionsQuery = query(
                  collection(db, COLLECTIONS.SUBMISSIONS),
                  where("assignmentId", "==", assignmentDoc.id)
                );
                const submissionsSnap = await getDocs(submissionsQuery);
                submissionsSnap.docs.forEach((subDoc) => {
                  batch.delete(subDoc.ref);
                });
                batch.delete(assignmentDoc.ref);
              }

              const discussionsQuery = query(
                collection(db, COLLECTIONS.DISCUSSIONS),
                where("courseInstanceId", "==", courseInstanceId)
              );
              const discussionsSnap = await getDocs(discussionsQuery);
              for (const discussionDoc of discussionsSnap.docs) {
                const repliesQuery = query(
                  collection(db, COLLECTIONS.DISCUSSION_REPLIES),
                  where("threadId", "==", discussionDoc.id)
                );
                const repliesSnap = await getDocs(repliesQuery);
                repliesSnap.docs.forEach((replyDoc) => {
                  batch.delete(replyDoc.ref);
                });
                batch.delete(discussionDoc.ref);
              }

              const sessionsQuery = query(
                collection(db, COLLECTIONS.ATTENDANCE_SESSIONS),
                where("courseInstanceId", "==", courseInstanceId)
              );
              const sessionsSnap = await getDocs(sessionsQuery);
              for (const sessionDoc of sessionsSnap.docs) {
                const recordsQuery = query(
                  collection(db, COLLECTIONS.ATTENDANCE_RECORDS),
                  where("sessionId", "==", sessionDoc.id)
                );
                const recordsSnap = await getDocs(recordsQuery);
                recordsSnap.docs.forEach((recordDoc) => {
                  batch.delete(recordDoc.ref);
                });
                batch.delete(sessionDoc.ref);
              }

              const marksQuery = query(
                collection(db, COLLECTIONS.MARKS),
                where("courseInstanceId", "==", courseInstanceId)
              );
              const marksSnap = await getDocs(marksQuery);
              marksSnap.docs.forEach((doc) => {
                batch.delete(doc.ref);
              });

              const courseInstanceRef = doc(db, COLLECTIONS.COURSE_INSTANCES, courseInstanceId as string);
              const courseRef = doc(db, COLLECTIONS.COURSES, course.id);
              batch.delete(courseInstanceRef);

              await batch.commit();

              Alert.alert("Success", "Course instance deleted successfully", [
                { text: "OK", onPress: () => router.replace("/admin/(tabs)/academics") },
              ]);
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete course instance");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-[#1C1C1E]">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#BCF3FF" />
          <Text className="text-[#C5D4CA] mt-4">Loading course details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !courseDetails) {
    return (
      <SafeAreaView className="flex-1 bg-[#1C1C1E]">
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-[#F96857] text-lg text-center mb-4">{error}</Text>
          <TouchableOpacity onPress={refresh} className="bg-[#BCF3FF] px-6 py-3 rounded-xl">
            <Text className="text-[#232323] font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { course, semester, section, teacherNames } = courseDetails;

  return (
    <SafeAreaView className="flex-1 bg-[#1C1C1E]">
      {/* Header */}
      <View className="px-6 pt-4 pb-4">
        <HStack className="justify-between items-center">
          <Text className="text-xl font-bold text-white">Course Details</Text>
          <TouchableOpacity
            onPress={() => {
              Alert.alert("Course Options", "", [
                {
                  text: "Edit Course",
                  onPress: () => router.push(`/admin/courses/edit?courseId=${course.id}`),
                },
                {
                  text: "Delete Course",
                  style: "destructive",
                  onPress: handleDeleteCourse,
                },
                { text: "Cancel", style: "cancel" },
              ]);
            }}
            disabled={deleting}
          >
            <Icon as={MoreVertical} size="md" className="text-white" />
          </TouchableOpacity>
        </HStack>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="pb-8"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#BCF3FF"
            colors={["#BCF3FF"]}
          />
        }
      >
        {/* Course Header Card */}
        <View className="bg-[#2A2A2D] rounded-2xl p-5 mb-4">
          <VStack space="lg">
            {/* Course Name */}
            <View>
              <Text className="text-2xl font-bold text-white">
                {course.name}
              </Text>
              <Text className="text-base text-[#6B7280] mt-1">
                {course.courseCode}
              </Text>
            </View>

            {/* Course Info Grid */}
            <View className="flex-row flex-wrap -mx-2">
              {/* Credits */}
              <View className="w-1/2 px-2 mb-4">
                <HStack space="xs" className="items-center mb-1">
                  <Icon as={BookOpen} size="xs" className="text-[#6B7280]" />
                  <Text className="text-xs text-[#6B7280]">Credits</Text>
                </HStack>
                <Text className="text-lg font-bold text-white">
                  {course.credits}
                </Text>
              </View>

              {/* Semester */}
              <View className="w-1/2 px-2 mb-4">
                <HStack space="xs" className="items-center mb-1">
                  <Icon as={Calendar} size="xs" className="text-[#6B7280]" />
                  <Text className="text-xs text-[#6B7280]">Semester</Text>
                </HStack>
                <Text className="text-lg font-bold text-white">
                  {semester}
                </Text>
              </View>

              {/* Section */}
              <View className="w-1/2 px-2 mb-4">
                <HStack space="xs" className="items-center mb-1">
                  <Icon as={Users} size="xs" className="text-[#6B7280]" />
                  <Text className="text-xs text-[#6B7280]">Section</Text>
                </HStack>
                <Text className="text-lg font-bold text-white">
                  {section}
                </Text>
              </View>

              {/* Department */}
              <View className="w-1/2 px-2 mb-4">
                <HStack space="xs" className="items-center mb-1">
                  <Icon as={Building} size="xs" className="text-[#6B7280]" />
                  <Text className="text-xs text-[#6B7280]">Department</Text>
                </HStack>
                <Text className="text-lg font-bold text-white">
                  {course.departmentId?.toUpperCase() || "N/A"}
                </Text>
              </View>
            </View>

            {/* Teachers */}
            {teacherNames && teacherNames.length > 0 && (
              <View>
                <Text className="text-xs text-[#6B7280] mb-2">
                  {teacherNames.length === 1 ? "Instructor" : "Instructors"}
                </Text>
                <VStack space="xs">
                  {teacherNames.map((name, index) => (
                    <HStack key={index} space="xs" className="items-center">
                      <Icon as={GraduationCap} size="sm" className="text-[#BCF3FF]" />
                      <Text className="text-base text-white">{name}</Text>
                    </HStack>
                  ))}
                </VStack>
              </View>
            )}

            {/* Course Type Badges */}
            <HStack space="sm">
              {course.isElective && (
                <View className="bg-[#7477FF]/15 px-3 py-1.5 rounded-lg">
                  <Text className="text-xs font-semibold text-[#7477FF]">
                    Elective
                  </Text>
                </View>
              )}
              {course.metadata?.labRequired && (
                <View className="bg-[#F9CD61]/15 px-3 py-1.5 rounded-lg">
                  <Text className="text-xs font-semibold text-[#F9CD61]">
                    Lab Required
                  </Text>
                </View>
              )}
            </HStack>
          </VStack>
        </View>

        {/* Admin Actions Card */}
        <View className="bg-[#2A2A2D] rounded-2xl p-4 mb-4">
          <Text className="text-lg font-bold text-white mb-3">
            Admin Actions
          </Text>
          <HStack space="sm">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center bg-[#BCF3FF] py-3 px-4 rounded-xl"
              onPress={() => router.push(`/admin/courses/edit?courseId=${course.id}`)}
            >
              <Icon as={Edit3} size="sm" className="text-[#232323]" />
              <Text className="text-[#232323] font-semibold ml-2">Edit Course</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center bg-[#F96857] py-3 px-4 rounded-xl"
              onPress={handleDeleteCourse}
              disabled={deleting}
            >
              <Icon as={Trash2} size="sm" className="text-white" />
              <Text className="text-white font-semibold ml-2">
                {deleting ? "Deleting..." : "Delete"}
              </Text>
            </TouchableOpacity>
          </HStack>
        </View>

        {/* Sections List */}
        <View>
          <Text className="text-lg font-bold text-white mb-3">
            Course Management
          </Text>

          {sections.map((sectionItem, index) => (
            <TouchableOpacity
              key={sectionItem.id}
              className={`bg-[#2A2A2D] rounded-2xl p-4 mb-3 ${
                index === sections.length - 1 ? 'mb-0' : ''
              }`}
              onPress={() => router.push(sectionItem.route as any)}
              activeOpacity={0.7}
            >
              <HStack className="items-center justify-between">
                <HStack space="md" className="items-center flex-1">
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center"
                    style={{ backgroundColor: `${sectionItem.color}15` }}
                  >
                    <Icon
                      as={sectionItem.icon}
                      size="md"
                      style={{ color: sectionItem.color }}
                    />
                  </View>
                  <VStack space="xs" className="flex-1">
                    <HStack space="sm" className="items-center">
                      <Text className="text-base font-semibold text-white">
                        {sectionItem.title}
                      </Text>
                      {sectionItem.adminOnly && (
                        <View className="bg-[#7477FF]/15 px-2 py-0.5 rounded">
                          <Text className="text-xs font-semibold text-[#7477FF]">
                            Admin
                          </Text>
                        </View>
                      )}
                    </HStack>
                    <Text className="text-sm text-[#6B7280]">
                      {sectionItem.description}
                    </Text>
                  </VStack>
                </HStack>
                <Icon as={ChevronRight} size="sm" className="text-[#6B7280]" />
              </HStack>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
