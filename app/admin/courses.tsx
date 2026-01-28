import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Plus,
  X,
  Edit,
  Trash2,
  Users,
  BookOpen,
  Search,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

interface Course {
  id: string;
  courseCode: string;
  name: string;
  departmentId: string;
  semester: number;
  credits: number;
  isElective: boolean;
  metadata?: {
    labRequired?: boolean;
    examType?: string;
  };
}

interface CourseInstance {
  id: string;
  courseId: string;
  departmentId: string;
  semester: number;
  section: string;
  teacherIds: string[];
  enrollmentType: "mandatory" | "elective";
  isActive: boolean;
}

export default function AdminCoursesScreen() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showInstanceModal, setShowInstanceModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Course form state
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [department, setDepartment] = useState("cs");
  const [semester, setSemester] = useState("1");
  const [credits, setCredits] = useState("4");
  const [isElective, setIsElective] = useState(false);
  const [labRequired, setLabRequired] = useState(false);
  const [examType, setExamType] = useState("theory");

  // Instance form state
  const [instanceSection, setInstanceSection] = useState("A");
  const [instanceTeacherId, setInstanceTeacherId] = useState("");
  const [creating, setCreating] = useState(false);
  const [autoEnrolling, setAutoEnrolling] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const coursesRef = collection(db, "courses");
      const coursesSnap = await getDocs(coursesRef);
      const fetchedCourses = coursesSnap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Course,
      );
      setCourses(fetchedCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      Alert.alert("Error", "Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!courseCode.trim() || !courseName.trim()) {
      Alert.alert("Error", "Please fill in course code and name");
      return;
    }

    setCreating(true);
    try {
      const newCourse = {
        courseCode: courseCode.trim(),
        name: courseName.trim(),
        departmentId: department,
        semester: parseInt(semester),
        credits: parseInt(credits),
        isElective,
        metadata: {
          labRequired,
          examType,
        },
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "courses"), newCourse);

      Alert.alert("Success", "Course created successfully");
      resetCourseForm();
      setShowCourseModal(false);
      fetchCourses();
    } catch (error: any) {
      console.error("Error creating course:", error);
      Alert.alert("Error", error.message || "Failed to create course");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateInstance = async () => {
    if (!selectedCourse || !instanceSection.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setCreating(true);
    try {
      const teacherIds = instanceTeacherId.trim()
        ? [instanceTeacherId.trim()]
        : [];

      const newInstance = {
        courseId: selectedCourse.id,
        departmentId: selectedCourse.departmentId,
        semester: selectedCourse.semester,
        section: instanceSection.trim(),
        teacherIds,
        enrollmentType: selectedCourse.isElective ? "elective" : "mandatory",
        isActive: true,
        createdAt: serverTimestamp(),
      };

      const instanceRef = await addDoc(
        collection(db, "courseInstances"),
        newInstance,
      );

      // Auto-enroll students if it's a mandatory course
      if (!selectedCourse.isElective) {
        setAutoEnrolling(true);
        await autoEnrollStudents(
          instanceRef.id,
          selectedCourse.departmentId,
          selectedCourse.semester,
          instanceSection.trim(),
        );
      }

      Alert.alert(
        "Success",
        selectedCourse.isElective
          ? "Course instance created. Students can now enroll manually."
          : "Course instance created and students auto-enrolled!",
      );

      resetInstanceForm();
      setShowInstanceModal(false);
      setSelectedCourse(null);
    } catch (error: any) {
      console.error("Error creating instance:", error);
      Alert.alert("Error", error.message || "Failed to create course instance");
    } finally {
      setCreating(false);
      setAutoEnrolling(false);
    }
  };

  const autoEnrollStudents = async (
    courseInstanceId: string,
    departmentId: string,
    semester: number,
    section: string,
  ) => {
    try {
      console.log("Auto-enrolling students:", {
        courseInstanceId,
        departmentId,
        semester,
        section,
      });

      // Find all students in this department, semester, and section
      const usersRef = collection(db, "users");
      const studentsQuery = query(
        usersRef,
        where("role", "==", "student"),
        where("department", "==", departmentId),
        where("semester", "==", semester),
        where("section", "==", section),
      );

      const studentsSnap = await getDocs(studentsQuery);
      console.log(`Found ${studentsSnap.size} students to enroll`);

      // Create enrollment for each student
      const enrollmentPromises = studentsSnap.docs.map((studentDoc) => {
        const enrollment = {
          studentId: studentDoc.id,
          courseInstanceId,
          type: "mandatory",
          enrolledAt: serverTimestamp(),
        };
        return addDoc(collection(db, "enrollments"), enrollment);
      });

      await Promise.all(enrollmentPromises);
      console.log(
        `Successfully enrolled ${studentsSnap.size} students automatically`,
      );
    } catch (error) {
      console.error("Error auto-enrolling students:", error);
      // Don't throw - instance creation should still succeed
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    Alert.alert(
      "Delete Course",
      `Are you sure you want to delete "${course.name}"? This will also delete all instances and enrollments.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete course instances
              const instancesRef = collection(db, "courseInstances");
              const instancesQuery = query(
                instancesRef,
                where("courseId", "==", course.id),
              );
              const instancesSnap = await getDocs(instancesQuery);

              for (const instanceDoc of instancesSnap.docs) {
                // Delete enrollments for this instance
                const enrollmentsRef = collection(db, "enrollments");
                const enrollmentsQuery = query(
                  enrollmentsRef,
                  where("courseInstanceId", "==", instanceDoc.id),
                );
                const enrollmentsSnap = await getDocs(enrollmentsQuery);

                for (const enrollDoc of enrollmentsSnap.docs) {
                  await deleteDoc(enrollDoc.ref);
                }

                // Delete instance
                await deleteDoc(instanceDoc.ref);
              }

              // Delete course
              await deleteDoc(doc(db, "courses", course.id));

              Alert.alert("Success", "Course deleted successfully");
              fetchCourses();
            } catch (error: any) {
              console.error("Error deleting course:", error);
              Alert.alert("Error", "Failed to delete course");
            }
          },
        },
      ],
    );
  };

  const resetCourseForm = () => {
    setCourseCode("");
    setCourseName("");
    setDepartment("cs");
    setSemester("1");
    setCredits("4");
    setIsElective(false);
    setLabRequired(false);
    setExamType("theory");
  };

  const resetInstanceForm = () => {
    setInstanceSection("A");
    setInstanceTeacherId("");
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.courseCode.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <VStack space="sm" className="px-4 py-3">
          <Text className="text-2xl font-bold text-black">
            Course Management
          </Text>
          <Text className="text-sm text-gray-600">
            Create and manage courses and instances
          </Text>
        </VStack>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Icon as={Search} size="md" className="text-gray-400" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon as={X} size="sm" className="text-gray-400" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Course List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text className="text-gray-600 mt-4">Loading courses...</Text>
          </View>
        ) : filteredCourses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <BookOpen size={48} color="#9CA3AF" />
            <Text className="text-gray-500 text-center text-lg mt-4">
              {searchQuery ? "No courses found" : "No courses created yet"}
            </Text>
            <Text className="text-gray-400 text-center text-sm mt-2">
              Create your first course to get started
            </Text>
          </View>
        ) : (
          filteredCourses.map((course) => (
            <View key={course.id} style={styles.courseCard}>
              <VStack space="md">
                {/* Header Row */}
                <HStack className="justify-between items-start">
                  <VStack space="xs" className="flex-1">
                    <Text className="text-lg font-bold text-black">
                      {course.name}
                    </Text>
                    <HStack space="sm" className="items-center flex-wrap">
                      <Text className="text-sm font-semibold text-gray-600">
                        {course.courseCode}
                      </Text>
                      <Text className="text-sm text-gray-400">•</Text>
                      <Text className="text-sm text-gray-600">
                        Sem {course.semester}
                      </Text>
                      <Text className="text-sm text-gray-400">•</Text>
                      <Text className="text-sm text-gray-600">
                        {course.credits} Credits
                      </Text>
                    </HStack>
                  </VStack>

                  <HStack space="sm">
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleDeleteCourse(course)}
                    >
                      <Icon as={Trash2} size="sm" className="text-red-600" />
                    </TouchableOpacity>
                  </HStack>
                </HStack>

                {/* Info Row */}
                <HStack space="md" className="flex-wrap">
                  {course.isElective ? (
                    <View style={styles.electiveBadge}>
                      <Text className="text-xs font-semibold text-blue-600">
                        ELECTIVE
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.mandatoryBadge}>
                      <Text className="text-xs font-semibold text-green-700">
                        MANDATORY
                      </Text>
                    </View>
                  )}

                  {course.metadata?.labRequired && (
                    <View style={styles.labBadge}>
                      <Text className="text-xs font-semibold text-purple-600">
                        LAB
                      </Text>
                    </View>
                  )}

                  <Text className="text-xs text-gray-500">
                    {course.departmentId.toUpperCase()} Dept
                  </Text>
                </HStack>

                {/* Action Button */}
                <TouchableOpacity
                  style={styles.createInstanceButton}
                  onPress={() => {
                    setSelectedCourse(course);
                    setShowInstanceModal(true);
                  }}
                >
                  <HStack space="xs" className="items-center justify-center">
                    <Icon as={Plus} size="sm" className="text-white" />
                    <Text className="text-white font-semibold text-sm">
                      Create Instance
                    </Text>
                  </HStack>
                </TouchableOpacity>
              </VStack>
            </View>
          ))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCourseModal(true)}
        activeOpacity={0.8}
      >
        <Icon as={Plus} size="xl" className="text-white" />
      </TouchableOpacity>

      {/* Create Course Modal */}
      <Modal
        visible={showCourseModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          resetCourseForm();
          setShowCourseModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <VStack space="lg">
                <HStack className="justify-between items-center">
                  <Text className="text-xl font-bold text-black">
                    Create New Course
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      resetCourseForm();
                      setShowCourseModal(false);
                    }}
                  >
                    <Icon as={X} size="lg" className="text-gray-500" />
                  </TouchableOpacity>
                </HStack>

                <VStack space="xs">
                  <Text className="text-sm font-semibold text-gray-700">
                    Course Code *
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 21CS51"
                    value={courseCode}
                    onChangeText={setCourseCode}
                    placeholderTextColor="#9CA3AF"
                  />
                </VStack>

                <VStack space="xs">
                  <Text className="text-sm font-semibold text-gray-700">
                    Course Name *
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Database Management Systems"
                    value={courseName}
                    onChangeText={setCourseName}
                    placeholderTextColor="#9CA3AF"
                  />
                </VStack>

                <HStack space="sm">
                  <VStack space="xs" className="flex-1">
                    <Text className="text-sm font-semibold text-gray-700">
                      Department
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="cs"
                      value={department}
                      onChangeText={setDepartment}
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="none"
                    />
                  </VStack>

                  <VStack space="xs" className="flex-1">
                    <Text className="text-sm font-semibold text-gray-700">
                      Semester
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="1-8"
                      value={semester}
                      onChangeText={setSemester}
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </VStack>

                  <VStack space="xs" className="flex-1">
                    <Text className="text-sm font-semibold text-gray-700">
                      Credits
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="4"
                      value={credits}
                      onChangeText={setCredits}
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </VStack>
                </HStack>

                <VStack space="sm">
                  <TouchableOpacity
                    onPress={() => setIsElective(!isElective)}
                    style={styles.checkboxRow}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        isElective && styles.checkboxChecked,
                      ]}
                    >
                      {isElective && <View style={styles.checkboxInner} />}
                    </View>
                    <VStack space="xs" className="flex-1">
                      <Text className="text-sm font-semibold text-black">
                        Elective Course
                      </Text>
                      <Text className="text-xs text-gray-600">
                        Students need to manually enroll
                      </Text>
                    </VStack>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setLabRequired(!labRequired)}
                    style={styles.checkboxRow}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        labRequired && styles.checkboxChecked,
                      ]}
                    >
                      {labRequired && <View style={styles.checkboxInner} />}
                    </View>
                    <Text className="text-sm font-semibold text-black">
                      Lab Component Required
                    </Text>
                  </TouchableOpacity>
                </VStack>

                <VStack space="xs">
                  <Text className="text-sm font-semibold text-gray-700">
                    Exam Type
                  </Text>
                  <HStack space="sm">
                    {["theory", "practical", "theory-practical", "project"].map(
                      (type) => (
                        <TouchableOpacity
                          key={type}
                          onPress={() => setExamType(type)}
                          style={[
                            styles.typeChip,
                            examType === type && styles.typeChipActive,
                          ]}
                        >
                          <Text
                            className={
                              examType === type
                                ? "text-white text-xs font-semibold"
                                : "text-gray-700 text-xs"
                            }
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ),
                    )}
                  </HStack>
                </VStack>

                <HStack space="sm" className="mt-4">
                  <TouchableOpacity
                    onPress={() => {
                      resetCourseForm();
                      setShowCourseModal(false);
                    }}
                    style={[styles.button, styles.buttonSecondary]}
                    disabled={creating}
                  >
                    <Text className="text-black font-semibold">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleCreateCourse}
                    style={[styles.button, styles.buttonPrimary]}
                    disabled={creating}
                  >
                    {creating ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text className="text-white font-semibold">Create</Text>
                    )}
                  </TouchableOpacity>
                </HStack>
              </VStack>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Instance Modal */}
      <Modal
        visible={showInstanceModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          resetInstanceForm();
          setShowInstanceModal(false);
          setSelectedCourse(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <VStack space="lg">
                <HStack className="justify-between items-center">
                  <Text className="text-xl font-bold text-black">
                    Create Course Instance
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      resetInstanceForm();
                      setShowInstanceModal(false);
                      setSelectedCourse(null);
                    }}
                  >
                    <Icon as={X} size="lg" className="text-gray-500" />
                  </TouchableOpacity>
                </HStack>

                {selectedCourse && (
                  <>
                    <View style={styles.infoBox}>
                      <Text className="text-base font-bold text-black">
                        {selectedCourse.name}
                      </Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        {selectedCourse.courseCode} • Sem{" "}
                        {selectedCourse.semester} •{" "}
                        {selectedCourse.departmentId.toUpperCase()}
                      </Text>
                      {selectedCourse.isElective ? (
                        <Text className="text-sm text-blue-600 mt-2">
                          ℹ️ Elective: Students will enroll manually
                        </Text>
                      ) : (
                        <Text className="text-sm text-green-700 mt-2">
                          ✅ Mandatory: Students will be auto-enrolled
                        </Text>
                      )}
                    </View>

                    <VStack space="xs">
                      <Text className="text-sm font-semibold text-gray-700">
                        Section *
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="A"
                        value={instanceSection}
                        onChangeText={setInstanceSection}
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize="characters"
                      />
                    </VStack>

                    <VStack space="xs">
                      <Text className="text-sm font-semibold text-gray-700">
                        Teacher UID (Optional)
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Paste teacher's Firebase UID"
                        value={instanceTeacherId}
                        onChangeText={setInstanceTeacherId}
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize="none"
                      />
                      <Text className="text-xs text-gray-500">
                        You can assign teachers later
                      </Text>
                    </VStack>

                    {autoEnrolling && (
                      <View style={styles.enrollingBox}>
                        <ActivityIndicator size="small" color="#10B981" />
                        <Text className="text-sm text-gray-700 ml-2">
                          Auto-enrolling students...
                        </Text>
                      </View>
                    )}

                    <HStack space="sm" className="mt-4">
                      <TouchableOpacity
                        onPress={() => {
                          resetInstanceForm();
                          setShowInstanceModal(false);
                          setSelectedCourse(null);
                        }}
                        style={[styles.button, styles.buttonSecondary]}
                        disabled={creating || autoEnrolling}
                      >
                        <Text className="text-black font-semibold">Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleCreateInstance}
                        style={[styles.button, styles.buttonPrimary]}
                        disabled={creating || autoEnrolling}
                      >
                        {creating ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text className="text-white font-semibold">
                            Create Instance
                          </Text>
                        )}
                      </TouchableOpacity>
                    </HStack>
                  </>
                )}
              </VStack>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  courseCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },
  electiveBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mandatoryBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  labBadge: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  createInstanceButton: {
    backgroundColor: "#000000",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalContent: {
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
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    borderColor: "#000000",
    backgroundColor: "#000000",
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  typeChipActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSecondary: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  buttonPrimary: {
    backgroundColor: "#000000",
  },
  infoBox: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  enrollingBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    padding: 12,
    borderRadius: 8,
  },
});
