import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
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
import type { Enrollment, BaseUserData } from "@/types";

interface EnrolledStudent extends Enrollment {
  studentName?: string;
  studentEmail?: string;
  studentRollNumber?: string;
  studentDepartment?: string;
  studentSemester?: number;
  status?: string;
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
  const [studentEmail, setStudentEmail] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);

  const fetchEnrolledStudents = async () => {
    if (!courseInstanceId) return;

    try {
      setLoading(true);
      
      const instanceRef = doc(db, COLLECTIONS.COURSE_INSTANCES, courseInstanceId);
      const instanceSnap = await getDoc(instanceRef);
      const instanceData = instanceSnap.data();
      const isElective = instanceData?.electiveSlotId != null;
      
      const enrolledStudents: EnrolledStudent[] = [];
      
      if (isElective) {
        const slotId = instanceData?.electiveSlotId;
        const courseId = instanceData?.courseId;
        
        if (slotId && courseId) {
          const selectionsQuery = query(
            collection(db, COLLECTIONS.ELECTIVE_SELECTIONS),
            where("slotId", "==", slotId),
            where("selectedCourseId", "==", courseId)
          );
          const selectionsSnap = await getDocs(selectionsQuery);
          
          for (const selectionDoc of selectionsSnap.docs) {
            const selectionData = selectionDoc.data();
            const studentRef = doc(db, COLLECTIONS.USERS, selectionData.studentId);
            const studentSnap = await getDoc(studentRef);
            
            if (studentSnap.exists()) {
              const studentData = studentSnap.data() as BaseUserData;
              enrolledStudents.push({
                id: selectionDoc.id,
                studentId: selectionData.studentId,
                courseInstanceId: courseInstanceId,
                studentName: studentData.name,
                studentEmail: studentData.email,
                enrollmentType: "elective",
                enrollmentStatus: "elective-enrolled",
                enrolledAt: selectionData.selectedAt,
              } as EnrolledStudent);
            }
          }
        }
      } else {
        const enrollmentsQuery = query(
          collection(db, COLLECTIONS.ENROLLMENTS),
          where("courseInstanceId", "==", courseInstanceId)
        );
        const enrollmentsSnap = await getDocs(enrollmentsQuery);
        
        for (const enrollmentDoc of enrollmentsSnap.docs) {
          const enrollmentData = enrollmentDoc.data() as Enrollment;
          const studentRef = doc(db, COLLECTIONS.USERS, enrollmentData.studentId);
          const studentSnap = await getDoc(studentRef);
          
          if (studentSnap.exists()) {
            const studentData = studentSnap.data() as BaseUserData;
            enrolledStudents.push({
              ...enrollmentData,
              id: enrollmentDoc.id,
              studentName: studentData.name,
              studentEmail: studentData.email,
            });
          } else {
            enrolledStudents.push({
              ...enrollmentData,
              id: enrollmentDoc.id,
            });
          }
        }
      }
      
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
      const studentData = studentDoc.data() as BaseUserData;

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

      setStudentEmail("");
      setShowAddModal(false);
      await fetchEnrolledStudents();
      Alert.alert("Success", `${studentData.name || studentEmail} has been enrolled successfully`);
    } catch (error) {
      console.error("Error adding student:", error);
      Alert.alert("Error", "Failed to add student");
    } finally {
      setAddingStudent(false);
    }
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
      case "auto": return "#BCF3FF";
      case "manual": return "#7477FF";
      case "elective": return "#F9CD61";
      default: return "#6B7280";
    }
  };

  const getEnrollmentTypeLabel = (type: string) => {
    switch (type) {
      case "auto": return "Auto";
      case "manual": return "Manual";
      case "elective": return "Elective";
      default: return type;
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-[#1C1C1E]">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#BCF3FF" />
          <Text className="text-[#C5D4CA] mt-4">Loading enrolled students...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#1C1C1E]">
      {/* Header */}
      <View className="px-6 pt-4 pb-4">
        <HStack className="justify-between items-center">
          <HStack space="sm" className="items-center">
            <Icon as={Shield} size="sm" className="text-[#7477FF]" />
            <Text className="text-xl font-bold text-white">Enrolled Students</Text>
          </HStack>

          <HStack space="sm">
            <TouchableOpacity
              onPress={() => setShowSearch(!showSearch)}
              className="w-10 h-10 rounded-xl bg-[#2A2A2D] items-center justify-center"
            >
              <Icon as={showSearch ? X : Search} size="sm" className="text-white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              className="w-10 h-10 rounded-xl bg-[#5AA578] items-center justify-center"
            >
              <Icon as={UserPlus} size="sm" className="text-white" />
            </TouchableOpacity>

            {students.length > 0 && (
              <TouchableOpacity
                onPress={handleRemoveAllStudents}
                className="w-10 h-10 rounded-xl bg-[#F96857]/20 items-center justify-center"
                disabled={deleting}
              >
                <Icon as={Trash2} size="sm" className="text-[#F96857]" />
              </TouchableOpacity>
            )}
          </HStack>
        </HStack>

        {showSearch && (
          <View className="flex-row items-center bg-[#2A2A2D] mt-4 px-4 py-3 rounded-xl border border-[#3C443F]">
            <Icon as={Search} size="sm" className="text-[#6B7280] mr-3" />
            <TextInput
              className="flex-1 text-white text-base"
              placeholder="Search by name, email, or roll number..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#6B7280"
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Icon as={X} size="sm" className="text-[#6B7280]" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Stats Bar */}
      <View className="px-6 py-3 bg-[#2A2A2D] border-b border-[#3C443F]">
        <HStack space="lg">
          <HStack space="xs" className="items-center">
            <Icon as={Users} size="xs" className="text-[#6B7280]" />
            <Text className="text-sm text-[#C5D4CA]">
              {students.length} {students.length === 1 ? "student" : "students"}
            </Text>
          </HStack>
          <HStack space="xs" className="items-center">
            <Icon as={CheckCircle} size="xs" className="text-[#5AA578]" />
            <Text className="text-sm text-[#C5D4CA]">
              {students.filter((s) => s.status === "enrolled" || s.status === "auto-enrolled").length} active
            </Text>
          </HStack>
        </HStack>
      </View>

      {/* Students List */}
      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="py-4 pb-24"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#BCF3FF"
            colors={["#BCF3FF"]}
          />
        }
      >
        {filteredStudents.length === 0 ? (
          <View className="items-center justify-center py-16">
            <View className="w-20 h-20 rounded-full bg-[#2A2A2D] items-center justify-center mb-4">
              <Icon as={Users} size="xl" className="text-[#3C443F]" />
            </View>
            <Text className="text-white text-lg font-semibold mb-2">
              {searchQuery ? "No students found" : "No students enrolled yet"}
            </Text>
            <Text className="text-[#6B7280] text-sm text-center px-8">
              {searchQuery
                ? "Try a different search term"
                : "Students will be automatically enrolled when they log in based on their department, semester, and section."}
            </Text>
          </View>
        ) : (
          <VStack space="sm">
            {filteredStudents.map((student) => (
              <TouchableOpacity
                key={student.id}
                className="bg-[#2A2A2D] rounded-2xl p-4"
                onPress={() => setShowStudentDetail(student)}
                activeOpacity={0.7}
              >
                <HStack space="md" className="items-start">
                  <View className="w-12 h-12 rounded-full bg-[#7477FF] items-center justify-center">
                    <Text className="text-white font-bold text-lg">
                      {student.studentName?.charAt(0).toUpperCase() || "?"}
                    </Text>
                  </View>

                  <VStack space="xs" className="flex-1">
                    <Text className="text-white font-semibold">
                      {student.studentName || "Unknown Student"}
                    </Text>
                    <Text className="text-sm text-[#6B7280]">
                      {student.studentEmail || "No email"}
                    </Text>
                    <HStack space="sm" className="items-center mt-1">
                      <View
                        className="px-2 py-0.5 rounded"
                        style={{ backgroundColor: `${getEnrollmentTypeColor(student.enrollmentType)}20` }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: getEnrollmentTypeColor(student.enrollmentType) }}
                        >
                          {getEnrollmentTypeLabel(student.enrollmentType)}
                        </Text>
                      </View>
                      <Text className="text-xs text-[#6B7280]">
                        {student.enrolledAt?.toDate?.().toLocaleDateString() || "Unknown date"}
                      </Text>
                    </HStack>
                  </VStack>

                  <TouchableOpacity
                    onPress={() => handleRemoveStudent(student.id, student.studentName || "")}
                    className="p-2"
                  >
                    <Icon as={Trash2} size="sm" className="text-[#F96857]" />
                  </TouchableOpacity>
                </HStack>
              </TouchableOpacity>
            ))}
          </VStack>
        )}
      </ScrollView>

      {/* Add Student Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-[#2A2A2D] rounded-t-3xl p-6">
            <VStack space="lg">
              <HStack className="justify-between items-center">
                <HStack space="sm" className="items-center">
                  <Icon as={Shield} size="sm" className="text-[#7477FF]" />
                  <Text className="text-xl font-bold text-white">Add Student</Text>
                </HStack>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Icon as={X} size="lg" className="text-[#6B7280]" />
                </TouchableOpacity>
              </HStack>

              <VStack space="xs">
                <Text className="text-sm font-medium text-[#C5D4CA]">Student Email</Text>
                <TextInput
                  className="bg-[#1C1C1E] border border-[#3C443F] rounded-xl p-4 text-white"
                  placeholder="student@example.com"
                  value={studentEmail}
                  onChangeText={setStudentEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#6B7280"
                />
              </VStack>

              <TouchableOpacity
                onPress={handleAddStudentByEmail}
                className="bg-[#5AA578] py-4 rounded-xl items-center"
                disabled={addingStudent}
              >
                {addingStudent ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <HStack space="sm" className="items-center">
                    <Icon as={UserPlus} size="sm" className="text-white" />
                    <Text className="text-white font-semibold">Add Student</Text>
                  </HStack>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                className="bg-[#1C1C1E] py-4 rounded-xl items-center border border-[#3C443F]"
              >
                <Text className="text-[#C5D4CA] font-semibold">Cancel</Text>
              </TouchableOpacity>
            </VStack>
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
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-[#2A2A2D] rounded-t-3xl p-6">
            {showStudentDetail && (
              <VStack space="lg">
                <HStack className="justify-between items-center">
                  <Text className="text-xl font-bold text-white">Student Details</Text>
                  <TouchableOpacity onPress={() => setShowStudentDetail(null)}>
                    <Icon as={X} size="lg" className="text-[#6B7280]" />
                  </TouchableOpacity>
                </HStack>

                <View className="w-20 h-20 rounded-full bg-[#7477FF] items-center justify-center self-center">
                  <Text className="text-white font-bold text-3xl">
                    {showStudentDetail.studentName?.charAt(0).toUpperCase() || "?"}
                  </Text>
                </View>

                <VStack space="sm" className="items-center">
                  <Text className="text-xl font-semibold text-white">
                    {showStudentDetail.studentName || "Unknown Student"}
                  </Text>
                  <Text className="text-[#6B7280]">
                    {showStudentDetail.studentEmail || "No email"}
                  </Text>
                </VStack>

                <View className="bg-[#1C1C1E] rounded-xl p-4">
                  <VStack space="md">
                    <HStack className="justify-between">
                      <Text className="text-[#6B7280]">Enrollment Type</Text>
                      <View
                        className="px-2 py-0.5 rounded"
                        style={{ backgroundColor: `${getEnrollmentTypeColor(showStudentDetail.enrollmentType)}20` }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: getEnrollmentTypeColor(showStudentDetail.enrollmentType) }}
                        >
                          {getEnrollmentTypeLabel(showStudentDetail.enrollmentType)}
                        </Text>
                      </View>
                    </HStack>
                    <HStack className="justify-between">
                      <Text className="text-[#6B7280]">Enrolled On</Text>
                      <Text className="text-white font-semibold">
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
                  className="bg-[#F96857] py-4 rounded-xl items-center"
                >
                  <HStack space="sm" className="items-center">
                    <Icon as={Trash2} size="sm" className="text-white" />
                    <Text className="text-white font-semibold">Remove from Course</Text>
                  </HStack>
                </TouchableOpacity>
              </VStack>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
