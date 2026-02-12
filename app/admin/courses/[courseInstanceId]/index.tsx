import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
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
    },
    {
      id: "assignments",
      title: "Assignments",
      icon: FileText,
      description: "Create and manage assignments",
      route: `/admin/courses/${courseInstanceId}/assignments`,
      adminOnly: false,
    },
    {
      id: "discussions",
      title: "Discussion Forum",
      icon: MessageSquare,
      description: "Moderate discussions and Q&A",
      route: `/admin/courses/${courseInstanceId}/discussions`,
      adminOnly: false,
    },
    {
      id: "marks",
      title: "Marks & Results",
      icon: Award,
      description: "View and manage student grades",
      route: `/admin/courses/${courseInstanceId}/marks`,
      adminOnly: false,
    },
    {
      id: "attendance",
      title: "Attendance",
      icon: Calendar,
      description: "Track and manage attendance records",
      route: `/admin/courses/${courseInstanceId}/attendance`,
      adminOnly: false,
    },
    {
      id: "enrollments",
      title: "Enrolled Students",
      icon: Users,
      description: "View and manage student enrollments",
      route: `/admin/courses/${courseInstanceId}/enrollments`,
      adminOnly: true,
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
              // Delete all related data
              const batch = writeBatch(db);

              // Delete enrollments
              const enrollmentsQuery = query(
                collection(db, COLLECTIONS.ENROLLMENTS),
                where("courseInstanceId", "==", courseInstanceId)
              );
              const enrollmentsSnap = await getDocs(enrollmentsQuery);
              enrollmentsSnap.docs.forEach((doc) => {
                batch.delete(doc.ref);
              });

              // Delete materials
              const materialsQuery = query(
                collection(db, COLLECTIONS.MATERIALS),
                where("courseInstanceId", "==", courseInstanceId)
              );
              const materialsSnap = await getDocs(materialsQuery);
              materialsSnap.docs.forEach((doc) => {
                batch.delete(doc.ref);
              });

              // Delete assignments and submissions
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

              // Delete discussions and replies
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

              // Delete attendance sessions and records
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

              // Delete marks
              const marksQuery = query(
                collection(db, COLLECTIONS.MARKS),
                where("courseInstanceId", "==", courseInstanceId)
              );
              const marksSnap = await getDocs(marksQuery);
              marksSnap.docs.forEach((doc) => {
                batch.delete(doc.ref);
              });

              // Finally delete the course instance
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
      {/* Header */}
      <View style={styles.header}>
        <HStack className="justify-between items-center px-4 py-3">
          <Text className="text-xl font-bold text-black">Course Details</Text>
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
            <Icon as={MoreVertical} size="md" className="text-black" />
          </TouchableOpacity>
        </HStack>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
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
                      <Icon as={GraduationCap} size="sm" className="text-gray-600" />
                      <Text className="text-base text-black">{name}</Text>
                    </HStack>
                  ))}
                </VStack>
              </View>
            )}

            {/* Course Type Badges */}
            <HStack space="sm">
              {course.isElective && (
                <View style={styles.electiveBadge}>
                  <Text className="text-sm font-semibold text-blue-600">
                    Elective
                  </Text>
                </View>
              )}
              {course.metadata?.labRequired && (
                <View style={styles.labBadge}>
                  <Text className="text-sm font-semibold text-purple-600">
                    Lab Required
                  </Text>
                </View>
              )}
            </HStack>

            {/* Instance ID */}
            <View style={styles.instanceIdContainer}>
              <Text className="text-xs text-gray-400">
                Instance ID: {courseInstanceId}
              </Text>
            </View>
          </VStack>
        </View>

        {/* Admin Actions Card */}
        <View style={styles.adminCard}>
          <Text className="text-lg font-bold text-black mb-3 px-4">
            Admin Actions
          </Text>
          <HStack space="sm" className="px-4">
            <TouchableOpacity
              style={styles.adminActionButton}
              onPress={() => router.push(`/admin/courses/edit?courseId=${course.id}`)}
            >
              <Icon as={Edit3} size="md" className="text-white" />
              <Text className="text-white font-semibold ml-2">Edit Course</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.adminActionButton, styles.deleteButton]}
              onPress={handleDeleteCourse}
              disabled={deleting}
            >
              <Icon as={Trash2} size="md" className="text-white" />
              <Text className="text-white font-semibold ml-2">
                {deleting ? "Deleting..." : "Delete"}
              </Text>
            </TouchableOpacity>
          </HStack>
        </View>

        {/* Sections List */}
        <View style={styles.sectionsContainer}>
          <Text className="text-lg font-bold text-black mb-3 px-4">
            Course Management
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
                    <HStack space="sm" className="items-center">
                      <Text className="text-base font-semibold text-black">
                        {section.title}
                      </Text>
                      {section.adminOnly && (
                        <View style={styles.adminBadge}>
                          <Text className="text-xs font-semibold text-purple-700">
                            Admin
                          </Text>
                        </View>
                      )}
                    </HStack>
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
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
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
  electiveBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  labBadge: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  instanceIdContainer: {
    backgroundColor: "#F9FAFB",
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  adminCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
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
  adminActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  deleteButton: {
    backgroundColor: "#EF4444",
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
  adminBadge: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
