import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import {
  Users,
  Search,
  X,
  Shield,
  Trash2,
  UserPlus,
  Mail,
  GraduationCap,
  CheckCircle,
  AlertCircle,
  Download,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/lib/AuthContext";
import { useCourseDetails } from "@/lib/hooks/useCourseDetails";
import { collection, query, where, getDocs, writeBatch, deleteDoc, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/types/constants";
import type { Enrollment, UserProfile } from "@/types";

interface EnrolledStudent extends Enrollment {
  studentName?: string;
  studentEmail?: string;
  studentRollNumber?: string;
  studentDepartment?: string;
  studentSemester?: number;
}

export default function AdminEnrolledStudentsScreen() {
  const { courseInstanceId } = useLocalSearchParams<{
    courseInstanceId: string;
  }>();
  const { user, userData } = useAuth();
  const { courseDetails, loading: courseLoading } = useCourseDetails(courseInstanceId as string);

  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStudentDetail, setShowStudentDetail] = useState<EnrolledStudent | null>(null);

  // Add student form state
  const [studentEmail, setStudentEmail] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);

  const fetchEnrolledStudents = async () => {
    if (!courseInstanceId) return;

    try {
      setLoading(true);
      
      // Get all enrollments for this course
      const enrollmentsQuery = query(
        collection(db, COLLECTIONS.ENROLLMENTS),
        where("courseInstanceId", "==", courseInstanceId)
      );
      const enrollmentsSnap = await getDocs(enrollmentsQuery);
      
      const enrolledStudents: EnrolledStudent[] = [];
      
      for (const enrollmentDoc of enrollmentsSnap.docs) {
        const enrollmentData = enrollmentDoc.data() as Enrollment;
        
        // Get student details
        const studentRef = doc(db, COLLECTIONS.USERS, enrollmentData.studentId);
        const studentSnap = await getDoc(studentRef);
        
        if (studentSnap.exists()) {
          const studentData = studentSnap.data() as UserProfile;
          enrolledStudents.push({
            ...enrollmentData,
            id: enrollmentDoc.id,
            studentName: studentData.displayName || studentData.name,
            studentEmail: studentData.email,
            studentRollNumber: studentData.rollNumber,
            studentDepartment: studentData.departmentId,
            studentSemester: studentData.semester,
          });
        } else {
          enrolledStudents.push({
            ...enrollmentData,
            id: enrollmentDoc.id,
          });
        }
      }
      
      // Sort by student name
      enrolledStudents.sort((a, b) => {
        const nameA = a.studentName || "";
        const nameB = b.studentName || "";
        return nameA.localeCompare(nameB);
      });
      
      setStudents(enrolledStudents);
    } catch (error) {
      console.error("Error fetching enrolled students:", error);
      Alert.alert("Error", "Failed to load enrolled students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrolledStudents();
  }, [courseInstanceId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEnrolledStudents();
    setRefreshing(false);
  };

  const handleRemoveStudent = async (enrollmentId: string, studentName: string) => {
    Alert.alert(
      "Remove Student",
      `Are you sure you want to remove ${studentName || "this student"} from the course?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, COLLECTIONS.ENROLLMENTS, enrollmentId));
              await fetchEnrolledStudents();
              Alert.alert("Success", "Student removed successfully");
            } catch (error) {
              console.error("Error removing student:", error);
              Alert.alert("Error", "Failed to remove student");
            }
          },
        },
      ]
    );
  };

  const handleRemoveAllStudents = async () => {
    Alert.alert(
      "Remove All Students",
      "Are you sure you want to remove ALL students from this course? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove All",
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
              
              await batch.commit();
              await fetchEnrolledStudents();
              Alert.alert("Success", "All students removed successfully");
            } catch (error) {
              console.error("Error removing all students:", error);
              Alert.alert("Error", "Failed to remove students");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleAddStudentByEmail = async () => {
    if (!studentEmail.trim()) {
      Alert.alert("Error", "Please enter a student email");
      return;
    }

    setAddingStudent(true);
    try {
      // Find student by email
      const usersQuery = query(
        collection(db, COLLECTIONS.USERS),
        where("email", "==", studentEmail.trim().toLowerCase()),
        where("role", "==", "student")
      );
      const usersSnap = await getDocs(usersQuery);

      if (usersSnap.empty) {
        Alert.alert("Error", "No student found with this email");
        return;
      }

      const studentDoc = usersSnap.docs[0];
      const studentId = studentDoc.id;
      const studentData = studentDoc.data() as UserProfile;

      // Check if already enrolled
      const existingEnrollmentQuery = query(
        collection(db, COLLECTIONS.ENROLLMENTS),
        where("courseInstanceId", "==", courseInstanceId),
        where("studentId", "==", studentId)
      );
      const existingEnrollmentSnap = await getDocs(existingEnrollmentQuery);

      if (!existingEnrollmentSnap.empty) {
        Alert.alert("Error", "Student is already enrolled in this course");
        return;
      }

      // Create enrollment
      const enrollmentRef = doc(collection(db, COLLECTIONS.ENROLLMENTS));
      await setDoc(enrollmentRef, {
        studentId: studentId,
        courseInstanceId: courseInstanceId,
        courseId: courseDetails?.course?.id,
        enrollmentType: "manual",
        status: "enrolled",
        enrolledAt: new Date(),
        enrolledBy: user?.uid,
      });

      // Reset form and refresh
      setStudentEmail("");
      setShowAddModal(false);
      await fetchEnrolledStudents();
      Alert.alert("Success", `${studentData.displayName || studentData.name || studentEmail} has been enrolled successfully`);
    } catch (error) {
      console.error("Error adding student:", error);
      Alert.alert("Error", "Failed to add student");
    } finally {
      setAddingStudent(false);
    }
  };

  const handleAutoEnroll = async () => {
    if (!courseDetails?.course) {
      Alert.alert("Error", "Course details not available");
      return;
    }

    Alert.alert(
      "Auto-Enroll Students",
      `This will enroll all students from ${courseDetails.course.departmentId?.toUpperCase()} department, Semester ${courseDetails.semester}, Section ${courseDetails.section} who are not already enrolled. Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Auto-Enroll",
          onPress: async () => {
            setAddingStudent(true);
            try {
              // Find all students matching department, semester, and section
              const studentsQuery = query(
                collection(db, COLLECTIONS.USERS),
                where("role", "==", "student"),
                where("departmentId", "==", courseDetails.course.departmentId),
                where("semester", "==", courseDetails.semester),
                where("section", "==", courseDetails.section)
              );
              const studentsSnap = await getDocs(studentsQuery);

              let enrolledCount = 0;
              const batch = writeBatch(db);

              for (const studentDoc of studentsSnap.docs) {
                const studentId = studentDoc.id;

                // Check if already enrolled
                const existingEnrollmentQuery = query(
                  collection(db, COLLECTIONS.ENROLLMENTS),
                  where("courseInstanceId", "==", courseInstanceId),
                  where("studentId", "==", studentId)
                );
                const existingEnrollmentSnap = await getDocs(existingEnrollmentQuery);

                if (existingEnrollmentSnap.empty) {
                  // Create enrollment
                  const enrollmentRef = doc(collection(db, COLLECTIONS.ENROLLMENTS));
                  batch.set(enrollmentRef, {
                    studentId: studentId,
                    courseInstanceId: courseInstanceId,
                    courseId: courseDetails.course?.id,
                    enrollmentType: "auto",
                    status: "auto-enrolled",
                    enrolledAt: new Date(),
                    enrolledBy: user?.uid,
                  });
                  enrolledCount++;
                }
              }

              await batch.commit();
              await fetchEnrolledStudents();
              Alert.alert("Success", `${enrolledCount} students have been auto-enrolled`);
            } catch (error) {
              console.error("Error auto-enrolling students:", error);
              Alert.alert("Error", "Failed to auto-enroll students");
            } finally {
              setAddingStudent(false);
            }
          },
        },
      ]
    );
  };

  const filteredStudents = students.filter((student) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      student.studentName?.toLowerCase().includes(query) ||
      student.studentEmail?.toLowerCase().includes(query) ||
      student.studentRollNumber?.toLowerCase().includes(query)
    );
  });

  const getEnrollmentTypeColor = (type: string) => {
    switch (type) {
      case "auto":
        return "#3B82F6";
      case "manual":
        return "#8B5CF6";
      case "elective":
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  const getEnrollmentTypeLabel = (type: string) => {
    switch (type) {
      case "auto":
        return "Auto";
      case "manual":
        return "Manual";
      case "elective":
        return "Elective";
      default:
        return type;
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text className="text-gray-600 mt-4">Loading enrolled students...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <HStack className="justify-between items-center px-4 py-3">
          <HStack space="sm" className="items-center">
            <Shield size={20} color="#8B5CF6" />
            <Text className="text-xl font-bold text-black">Enrolled Students</Text>
          </HStack>

          <HStack space="sm">
            {/* Search Icon */}
            <TouchableOpacity
              onPress={() => setShowSearch(!showSearch)}
              style={styles.iconButton}
            >
              <Icon
                as={showSearch ? X : Search}
                size="md"
                className="text-black"
              />
            </TouchableOpacity>

            {/* Add Student Icon */}
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              style={[styles.iconButton, styles.addButton]}
            >
              <Icon as={UserPlus} size="md" className="text-white" />
            </TouchableOpacity>

            {/* Remove All Icon */}
            {students.length > 0 && (
              <TouchableOpacity
                onPress={handleRemoveAllStudents}
                style={[styles.iconButton, styles.deleteButton]}
                disabled={deleting}
              >
                <Icon as={Trash2} size="md" className="text-red-600" />
              </TouchableOpacity>
            )}
          </HStack>
        </HStack>

        {/* Search Bar */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <Icon as={Search} size="md" className="text-gray-400" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, email, or roll number..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Icon as={X} size="sm" className="text-gray-400" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <HStack space="lg">
          <HStack space="xs" className="items-center">
            <Users size={18} color="#6B7280" />
            <Text style={styles.statText}>
              {students.length} {students.length === 1 ? "student" : "students"} enrolled
            </Text>
          </HStack>
          <HStack space="xs" className="items-center">
            <CheckCircle size={18} color="#10B981" />
            <Text style={styles.statText}>
              {students.filter((s) => s.status === "enrolled" || s.status === "auto-enrolled").length} active
            </Text>
          </HStack>
        </HStack>
      </View>

      {/* Students List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredStudents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users size={64} color="#D1D5DB" />
            <Text className="text-gray-500 text-lg mt-4 text-center">
              {searchQuery ? "No students found" : "No students enrolled yet"}
            </Text>
            <Text className="text-gray-400 text-sm mt-2 text-center px-8">
              {searchQuery
                ? "Try a different search term"
                : "Add students manually or use auto-enroll to add students from this department/semester/section"}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.autoEnrollButton}
                onPress={handleAutoEnroll}
              >
                <HStack space="sm" className="items-center">
                  <GraduationCap size={20} color="#FFFFFF" />
                  <Text className="text-white font-semibold">Auto-Enroll Students</Text>
                </HStack>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <VStack space="sm">
            {filteredStudents.map((student) => (
              <TouchableOpacity
                key={student.id}
                style={styles.studentCard}
                onPress={() => setShowStudentDetail(student)}
                activeOpacity={0.7}
              >
                <HStack space="md" className="items-start">
                  {/* Avatar */}
                  <View style={styles.avatar}>
                    <Text className="text-white font-bold text-lg">
                      {student.studentName?.charAt(0).toUpperCase() || "?"}
                    </Text>
                  </View>

                  {/* Student Info */}
                  <VStack space="xs" className="flex-1">
                    <Text className="text-base font-semibold text-black">
                      {student.studentName || "Unknown Student"}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {student.studentEmail || "No email"}
                    </Text>
                    {student.studentRollNumber && (
                      <Text className="text-xs text-gray-400">
                        Roll: {student.studentRollNumber}
                      </Text>
                    )}
                    <HStack space="sm" className="items-center mt-1">
                      <View
                        style={[
                          styles.enrollmentTypeBadge,
                          { backgroundColor: getEnrollmentTypeColor(student.enrollmentType) + "20" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.enrollmentTypeText,
                            { color: getEnrollmentTypeColor(student.enrollmentType) },
                          ]}
                        >
                          {getEnrollmentTypeLabel(student.enrollmentType)}
                        </Text>
                      </View>
                      <Text className="text-xs text-gray-400">
                        {student.enrolledAt?.toDate?.().toLocaleDateString() || "Unknown date"}
                      </Text>
                    </HStack>
                  </VStack>

                  {/* Remove Button */}
                  <TouchableOpacity
                    onPress={() => handleRemoveStudent(student.id, student.studentName || "")}
                    style={styles.removeButton}
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </HStack>
              </TouchableOpacity>
            ))}
          </VStack>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Student Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addModal}>
            <ScrollView contentContainerStyle={styles.addModalContent}>
              <VStack space="lg">
                <HStack className="justify-between items-center">
                  <HStack space="sm" className="items-center">
                    <Shield size={20} color="#8B5CF6" />
                    <Text className="text-xl font-bold text-black">
                      Add Student
                    </Text>
                  </HStack>
                  <TouchableOpacity onPress={() => setShowAddModal(false)}>
                    <Icon as={X} size="lg" className="text-gray-500" />
                  </TouchableOpacity>
                </HStack>

                {/* Manual Add */}
                <VStack space="xs">
                  <Text className="text-sm font-semibold text-gray-700">
                    Student Email
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="student@example.com"
                    value={studentEmail}
                    onChangeText={setStudentEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#9CA3AF"
                  />
                </VStack>

                <TouchableOpacity
                  onPress={handleAddStudentByEmail}
                  style={[styles.actionButton, styles.addActionButton]}
                  disabled={addingStudent}
                >
                  {addingStudent ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <HStack space="sm" className="items-center">
                      <UserPlus size={20} color="#FFFFFF" />
                      <Text className="text-white font-semibold">Add Student</Text>
                    </HStack>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <Text className="text-gray-400 text-sm bg-white px-2">OR</Text>
                </View>

                {/* Auto Enroll */}
                <TouchableOpacity
                  onPress={handleAutoEnroll}
                  style={[styles.actionButton, styles.autoEnrollActionButton]}
                  disabled={addingStudent}
                >
                  {addingStudent ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <HStack space="sm" className="items-center">
                      <GraduationCap size={20} color="#FFFFFF" />
                      <VStack space="xs">
                        <Text className="text-white font-semibold">Auto-Enroll by Section</Text>
                        <Text className="text-white text-xs opacity-80">
                          Enroll all students from {courseDetails?.course?.departmentId?.toUpperCase() || ""} Dept, Sem {courseDetails?.semester || ""}, Sec {courseDetails?.section || ""}
                        </Text>
                      </VStack>
                    </HStack>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowAddModal(false)}
                  style={[styles.actionButton, styles.cancelButton]}
                >
                  <Text className="text-gray-700 font-semibold">Cancel</Text>
                </TouchableOpacity>
              </VStack>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Student Detail Modal */}
      <Modal
        visible={!!showStudentDetail}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStudentDetail(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            <ScrollView contentContainerStyle={styles.detailModalContent}>
              {showStudentDetail && (
                <VStack space="lg">
                  <HStack className="justify-between items-center">
                    <Text className="text-xl font-bold text-black">
                      Student Details
                    </Text>
                    <TouchableOpacity onPress={() => setShowStudentDetail(null)}>
                      <Icon as={X} size="lg" className="text-gray-500" />
                    </TouchableOpacity>
                  </HStack>

                  <View style={styles.detailAvatar}>
                    <Text className="text-white font-bold text-3xl">
                      {showStudentDetail.studentName?.charAt(0).toUpperCase() || "?"}
                    </Text>
                  </View>

                  <VStack space="sm" className="items-center">
                    <Text className="text-xl font-semibold text-black">
                      {showStudentDetail.studentName || "Unknown Student"}
                    </Text>
                    <Text className="text-gray-500">
                      {showStudentDetail.studentEmail || "No email"}
                    </Text>
                  </VStack>

                  <View style={styles.infoCard}>
                    <VStack space="md">
                      {showStudentDetail.studentRollNumber && (
                        <HStack className="justify-between">
                          <Text className="text-gray-500">Roll Number</Text>
                          <Text className="font-semibold text-black">
                            {showStudentDetail.studentRollNumber}
                          </Text>
                        </HStack>
                      )}
                      {showStudentDetail.studentDepartment && (
                        <HStack className="justify-between">
                          <Text className="text-gray-500">Department</Text>
                          <Text className="font-semibold text-black">
                            {showStudentDetail.studentDepartment.toUpperCase()}
                          </Text>
                        </HStack>
                      )}
                      {showStudentDetail.studentSemester && (
                        <HStack className="justify-between">
                          <Text className="text-gray-500">Semester</Text>
                          <Text className="font-semibold text-black">
                            {showStudentDetail.studentSemester}
                          </Text>
                        </HStack>
                      )}
                      <HStack className="justify-between">
                        <Text className="text-gray-500">Enrollment Type</Text>
                        <View
                          style={[
                            styles.enrollmentTypeBadge,
                            { backgroundColor: getEnrollmentTypeColor(showStudentDetail.enrollmentType) + "20" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.enrollmentTypeText,
                              { color: getEnrollmentTypeColor(showStudentDetail.enrollmentType) },
                            ]}
                          >
                            {getEnrollmentTypeLabel(showStudentDetail.enrollmentType)}
                          </Text>
                        </View>
                      </HStack>
                      <HStack className="justify-between">
                        <Text className="text-gray-500">Enrolled On</Text>
                        <Text className="font-semibold text-black">
                          {showStudentDetail.enrolledAt?.toDate?.().toLocaleDateString() || "Unknown"}
                        </Text>
                      </HStack>
                    </VStack>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      setShowStudentDetail(null);
                      handleRemoveStudent(
                        showStudentDetail.id,
                        showStudentDetail.studentName || ""
                      );
                    }}
                    style={[styles.actionButton, styles.removeActionButton]}
                  >
                    <HStack space="sm" className="items-center">
                      <Trash2 size={20} color="#FFFFFF" />
                      <Text className="text-white font-semibold">Remove from Course</Text>
                    </HStack>
                  </TouchableOpacity>
                </VStack>
              )}
            </ScrollView>
          </View>
        </View>
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
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  addButton: {
    backgroundColor: "#10B981",
  },
  deleteButton: {
    backgroundColor: "#FEE2E2",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#000000",
  },
  statsBar: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  statText: {
    fontSize: 14,
    color: "#6B7280",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  autoEnrollButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  studentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
  },
  enrollmentTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  enrollmentTypeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  removeButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  addModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  addModalContent: {
    padding: 24,
  },
  detailModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  detailModalContent: {
    padding: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#000000",
    backgroundColor: "#F9FAFB",
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addActionButton: {
    backgroundColor: "#10B981",
  },
  autoEnrollActionButton: {
    backgroundColor: "#8B5CF6",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  removeActionButton: {
    backgroundColor: "#EF4444",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  detailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  infoCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
  },
});
