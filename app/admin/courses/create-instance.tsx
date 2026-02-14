import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ChevronLeft,
  Save,
  Users,
  Building2,
  Hash,
  Award,
  Calendar,
  BookOpen,
  Check,
  Layers,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectItem,
} from "@/components/ui/select";
import { useAuth } from "@/lib/AuthContext";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  DEPARTMENTS,
  SEMESTERS,
  COLLECTIONS,
  SECTIONS,
  COURSE_TYPES,
  DepartmentId,
  Course,
  TeacherUserData,
  CourseType,
  ElectiveSlot,
} from "@/types";
import { getDepartmentNameById } from "@/types/constants";

export default function CreateCourseInstanceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const preselectedCourseId = params.courseId as string | undefined;

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<TeacherUserData[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    preselectedCourseId || "",
  );
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<
    DepartmentId[]
  >([]);
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [academicYear, setAcademicYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [selectedElectiveSlotId, setSelectedElectiveSlotId] =
    useState<string>("");
  const [electiveSlots, setElectiveSlots] = useState<ElectiveSlot[]>([]);

  // Fetch courses and teachers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);

        // Fetch all courses
        const coursesRef = collection(db, COLLECTIONS.COURSES);
        const coursesSnap = await getDocs(coursesRef);
        const coursesList = coursesSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Course[];
        setCourses(coursesList);

        // Fetch all teachers
        const usersRef = collection(db, COLLECTIONS.USERS);
        const teachersQuery = query(usersRef, where("role", "==", "teacher"));
        const teachersSnap = await getDocs(teachersQuery);
        const teachersList = teachersSnap.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        })) as TeacherUserData[];
        setTeachers(teachersList);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  // Fetch elective slots when an elective course is selected
  useEffect(() => {
    const fetchElectiveSlots = async () => {
      if (!selectedCourse || !selectedCourse.courseType?.includes("elective")) {
        setElectiveSlots([]);
        setSelectedElectiveSlotId("");
        return;
      }

      try {
        const slotsRef = collection(db, COLLECTIONS.ELECTIVE_SLOTS);
        const slotsQuery = query(
          slotsRef,
          where("semester", "==", selectedCourse.semester),
          where("isActive", "==", true),
        );

        const slotsSnap = await getDocs(slotsQuery);
        const slotsList: ElectiveSlot[] = [];
        slotsSnap.docs.forEach((doc) => {
          slotsList.push({ id: doc.id, ...doc.data() } as ElectiveSlot);
        });

        // Filter slots based on course type
        const filteredSlots = slotsList.filter((slot) => {
          if (selectedCourse.courseType === "open_elective") {
            return slot.slotType === "open";
          } else if (selectedCourse.courseType === "professional_elective") {
            return (
              slot.slotType === "professional" &&
              slot.departmentId === selectedCourse.departmentId
            );
          }
          return false;
        });

        setElectiveSlots(filteredSlots);

        // Auto-select if only one slot available
        if (filteredSlots.length === 1) {
          setSelectedElectiveSlotId(filteredSlots[0].id);
        }
      } catch (error) {
        console.error("Error fetching elective slots:", error);
      }
    };

    fetchElectiveSlots();
  }, [selectedCourse]);

  // Calculate how many instances will be created
  const getInstanceCount = () => {
    if (!selectedCourse) return 0;

    if (selectedCourse.courseType === "open_elective") {
      // Open elective: departments × sections
      const depts =
        selectedDepartments.length > 0 ? selectedDepartments.length : 1;
      const sections =
        selectedSections.length > 0 ? selectedSections.length : 1;
      return depts * sections;
    } else {
      // Core or professional elective: just sections (single dept)
      return selectedSections.length > 0 ? selectedSections.length : 1;
    }
  };

  const validateForm = (): boolean => {
    if (!selectedCourseId) {
      Alert.alert("Error", "Please select a course");
      return false;
    }
    if (selectedSections.length === 0) {
      Alert.alert("Error", "Please select at least one section");
      return false;
    }
    if (
      selectedCourse?.courseType === "open_elective" &&
      selectedDepartments.length === 0
    ) {
      Alert.alert(
        "Error",
        "Please select at least one department for open elective",
      );
      return false;
    }
    if (
      selectedCourse?.courseType?.includes("elective") &&
      !selectedElectiveSlotId
    ) {
      Alert.alert(
        "Error",
        "Please select an elective slot for this elective course",
      );
      return false;
    }
    if (teacherIds.length === 0) {
      Alert.alert("Error", "Please select at least one teacher");
      return false;
    }
    if (!academicYear.trim()) {
      Alert.alert("Error", "Academic year is required");
      return false;
    }
    return true;
  };

  const handleCreateInstance = async () => {
    if (!validateForm() || !user || !selectedCourse) return;

    setLoading(true);
    try {
      // Determine departments and sections to create instances for
      let departments: DepartmentId[];
      let sections: string[];

      if (selectedCourse.courseType === "open_elective") {
        departments = selectedDepartments;
        sections = selectedSections;
      } else {
        departments = [selectedCourse.departmentId];
        sections = selectedSections;
      }

      // Check for existing instances to prevent duplicates
      const instancesRef = collection(db, COLLECTIONS.COURSE_INSTANCES);
      const duplicates: string[] = [];
      const newInstances: { dept: DepartmentId; section: string }[] = [];

      for (const dept of departments) {
        for (const section of sections) {
          // Check if instance already exists
          const existingQuery = query(
            instancesRef,
            where("courseId", "==", selectedCourseId),
            where("departmentId", "==", dept),
            where("semester", "==", selectedCourse.semester),
            where("section", "==", section),
            where("isActive", "==", true),
          );

          const existingSnap = await getDocs(existingQuery);

          if (!existingSnap.empty) {
            duplicates.push(`${dept.toUpperCase()} - Section ${section}`);
          } else {
            newInstances.push({ dept, section });
          }
        }
      }

      // If there are duplicates, show warning and stop
      if (duplicates.length > 0) {
        Alert.alert(
          "Duplicate Instances Found",
          `The following instances already exist:\n${duplicates.join("\n")}\n\nPlease remove the existing instances first or select different sections/departments.`,
          [{ text: "OK" }],
        );
        setLoading(false);
        return;
      }

      // Confirm before creating many instances
      if (newInstances.length > 4) {
        Alert.alert(
          "Confirm Bulk Creation",
          `You are about to create ${newInstances.length} course instances. Continue?`,
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                setLoading(false);
                return;
              },
            },
            { text: "Create", onPress: () => createInstances(newInstances) },
          ],
        );
      } else {
        await createInstances(newInstances);
      }
    } catch (error: any) {
      console.error("Error creating course instance:", error);
      Alert.alert("Error", error.message || "Failed to create course instance");
      setLoading(false);
    }
  };

  const createInstances = async (
    instances: { dept: DepartmentId; section: string }[],
  ) => {
    try {
      const batch = writeBatch(db);
      const instancesRef = collection(db, COLLECTIONS.COURSE_INSTANCES);

      for (const { dept, section } of instances) {
        const instanceData: any = {
          courseId: selectedCourseId,
          departmentId: dept,
          semester: selectedCourse!.semester,
          section: section.toUpperCase(),
          teacherIds: teacherIds,
          isActive: true,
          academicYear: academicYear.trim(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // Add elective slot linkage for elective courses
        if (
          selectedCourse!.courseType?.includes("elective") &&
          selectedElectiveSlotId
        ) {
          instanceData.electiveSlotId = selectedElectiveSlotId;
        }

        const newInstanceRef = doc(instancesRef);
        batch.set(newInstanceRef, instanceData);
      }

      await batch.commit();

      Alert.alert(
        "Success",
        `${instances.length} course instance(s) created successfully!`,
        [
          {
            text: "Create Another",
            onPress: () => {
              setSelectedCourseId("");
              setSelectedSections([]);
              setSelectedDepartments([]);
              setTeacherIds([]);
              setAcademicYear(new Date().getFullYear().toString());
            },
          },
          {
            text: "Go Back",
            onPress: () => router.back(),
            style: "cancel",
          },
        ],
      );
    } catch (error: any) {
      console.error("Error creating course instance:", error);
      Alert.alert("Error", error.message || "Failed to create course instance");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setSelectedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const toggleDepartment = (deptId: DepartmentId) => {
    setSelectedDepartments((prev) =>
      prev.includes(deptId)
        ? prev.filter((id) => id !== deptId)
        : [...prev, deptId],
    );
  };

  const toggleTeacher = (teacherId: string) => {
    setTeacherIds((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId],
    );
  };

  const getCourseTypeLabel = (type: CourseType) => {
    switch (type) {
      case "core":
        return "Core (Mandatory)";
      case "professional_elective":
        return "Professional Elective";
      case "open_elective":
        return "Open Elective";
      default:
        return type;
    }
  };

  if (loadingData) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#7477FF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#232323" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Course Instance</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <VStack space="lg">
          {/* Course Selection */}
          <VStack space="xs">
            <Text style={styles.label}>Select Course *</Text>
            <Select
              selectedValue={selectedCourseId}
              onValueChange={(value) => {
                setSelectedCourseId(value);
                setSelectedSections([]);
                setSelectedDepartments([]);
              }}
            >
              <SelectTrigger style={styles.selectTrigger}>
                <HStack space="sm" style={styles.selectContent}>
                  <BookOpen size={20} color="#7477FF" />
                  <SelectInput
                    placeholder="Choose a course"
                    style={styles.selectInput}
                    value={
                      selectedCourse
                        ? `${selectedCourse.courseCode} - ${selectedCourse.name}`
                        : ""
                    }
                  />
                </HStack>
                <SelectIcon />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent style={styles.courseSelectContent}>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  {courses.map((course) => (
                    <SelectItem
                      key={course.id}
                      label={`${course.courseCode} - ${course.name} (${getDepartmentNameById(course.departmentId)}, Sem ${course.semester})`}
                      value={course.id}
                    />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          </VStack>

          {/* Course Info Card (if selected) */}
          {selectedCourse && (
            <View style={styles.courseInfoCard}>
              <Text style={styles.courseInfoTitle}>{selectedCourse.name}</Text>
              <HStack space="md" style={styles.courseInfoRow}>
                <Text style={styles.courseInfoText}>
                  Code: {selectedCourse.courseCode}
                </Text>
                <Text style={styles.courseInfoText}>
                  Credits: {selectedCourse.credits}
                </Text>
              </HStack>
              <HStack space="md" style={styles.courseInfoRow}>
                <Text style={styles.courseInfoText}>
                  Dept: {getDepartmentNameById(selectedCourse.departmentId)}
                </Text>
                <Text style={styles.courseInfoText}>
                  Semester: {selectedCourse.semester}
                </Text>
              </HStack>
              <View
                style={[
                  styles.typeBadge,
                  selectedCourse.courseType === "core" && styles.coreBadge,
                  selectedCourse.courseType === "professional_elective" &&
                    styles.professionalBadge,
                  selectedCourse.courseType === "open_elective" &&
                    styles.openBadge,
                ]}
              >
                <Text style={styles.typeText}>
                  {getCourseTypeLabel(selectedCourse.courseType)}
                </Text>
              </View>
            </View>
          )}

          {/* Sections Selection */}
          <VStack space="xs">
            <Text style={styles.label}>Sections *</Text>
            <Text style={styles.sublabel}>Select one or more sections</Text>

            <HStack space="sm" style={styles.sectionsContainer}>
              {SECTIONS.map((section) => (
                <TouchableOpacity
                  key={section}
                  style={[
                    styles.sectionChip,
                    selectedSections.includes(section) &&
                      styles.sectionChipSelected,
                  ]}
                  onPress={() => toggleSection(section)}
                >
                  <Text
                    style={[
                      styles.sectionChipText,
                      selectedSections.includes(section) &&
                        styles.sectionChipTextSelected,
                    ]}
                  >
                    {section}
                  </Text>
                  {selectedSections.includes(section) && (
                    <Check
                      size={14}
                      color="#FFFFFF"
                      style={styles.sectionCheck}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </HStack>
          </VStack>

          {/* Departments Selection (only for open electives) */}
          {selectedCourse?.courseType === "open_elective" && (
            <VStack space="xs">
              <Text style={styles.label}>Departments *</Text>
              <Text style={styles.sublabel}>
                Select departments that can take this open elective
              </Text>

              <View style={styles.departmentsContainer}>
                {DEPARTMENTS.map((dept) => (
                  <TouchableOpacity
                    key={dept.id}
                    style={[
                      styles.deptItem,
                      selectedDepartments.includes(dept.id as DepartmentId) &&
                        styles.deptItemSelected,
                    ]}
                    onPress={() => toggleDepartment(dept.id as DepartmentId)}
                  >
                    <HStack space="sm" style={styles.deptContent}>
                      <Building2
                        size={16}
                        color={
                          selectedDepartments.includes(dept.id as DepartmentId)
                            ? "#7477FF"
                            : "#77867D"
                        }
                      />
                      <Text
                        style={[
                          styles.deptText,
                          selectedDepartments.includes(
                            dept.id as DepartmentId,
                          ) && styles.deptTextSelected,
                        ]}
                      >
                        {dept.code}
                      </Text>
                      {selectedDepartments.includes(
                        dept.id as DepartmentId,
                      ) && <Check size={14} color="#7477FF" />}
                    </HStack>
                  </TouchableOpacity>
                ))}
              </View>
            </VStack>
          )}

          {/* Elective Slot Selection (for elective courses) */}
          {selectedCourse?.courseType?.includes("elective") && (
            <VStack space="xs">
              <Text style={styles.label}>Elective Slot *</Text>
              <Text style={styles.sublabel}>
                Select the elective slot this course belongs to
              </Text>

              {electiveSlots.length === 0 ? (
                <View style={styles.noSlotsWarning}>
                  <Text style={styles.noSlotsText}>
                    No elective slots found for Semester{" "}
                    {selectedCourse.semester}. Please create an elective slot
                    first.
                  </Text>
                </View>
              ) : (
                <View style={styles.slotsContainer}>
                  {electiveSlots.map((slot) => (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.slotItem,
                        selectedElectiveSlotId === slot.id &&
                          styles.slotItemSelected,
                      ]}
                      onPress={() => setSelectedElectiveSlotId(slot.id)}
                    >
                      <HStack space="sm" style={styles.slotContent}>
                        <View
                          style={[
                            styles.slotTypeBadge,
                            slot.slotType === "open"
                              ? styles.openBadge
                              : styles.professionalBadge,
                          ]}
                        >
                          <Text style={styles.slotTypeText}>
                            {slot.slotType === "open" ? "OPEN" : "PROF"}
                          </Text>
                        </View>
                        <VStack space="xs" style={styles.slotInfo}>
                          <Text style={styles.slotCode}>{slot.slotCode}</Text>
                          <Text style={styles.slotName}>{slot.name}</Text>
                        </VStack>
                        {selectedElectiveSlotId === slot.id && (
                          <View style={styles.checkmark}>
                            <Check size={16} color="#FFFFFF" />
                          </View>
                        )}
                      </HStack>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </VStack>
          )}

          {/* Academic Year */}
          <VStack space="xs">
            <Text style={styles.label}>Academic Year *</Text>
            <View style={styles.inputContainer}>
              <Calendar size={20} color="#7477FF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., 2025"
                value={academicYear}
                onChangeText={setAcademicYear}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
          </VStack>

          {/* Teachers Selection */}
          <VStack space="xs">
            <Text style={styles.label}>Assign Teachers *</Text>
            <Text style={styles.sublabel}>
              Select one or more teachers (will be assigned to all instances)
            </Text>

            <View style={styles.teachersContainer}>
              {teachers.map((teacher) => (
                <TouchableOpacity
                  key={teacher.uid}
                  style={[
                    styles.teacherItem,
                    teacherIds.includes(teacher.uid) &&
                      styles.teacherItemSelected,
                  ]}
                  onPress={() => toggleTeacher(teacher.uid)}
                >
                  <HStack space="sm" style={styles.teacherContent}>
                    <View style={styles.teacherAvatar}>
                      <Users size={18} color="#7477FF" />
                    </View>
                    <VStack space="xs" style={styles.teacherInfo}>
                      <Text style={styles.teacherName}>{teacher.name}</Text>
                      <Text style={styles.teacherDept}>
                        {getDepartmentNameById(teacher.departmentId)}
                      </Text>
                    </VStack>
                    {teacherIds.includes(teacher.uid) && (
                      <View style={styles.checkmark}>
                        <Check size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </HStack>
                </TouchableOpacity>
              ))}
            </View>
          </VStack>

          {/* Instance Count Preview */}
          {selectedCourse && (
            <View style={styles.previewCard}>
              <HStack space="sm" style={styles.previewHeader}>
                <Layers size={20} color="#7477FF" />
                <Text style={styles.previewTitle}>Instances to Create</Text>
              </HStack>
              <Text style={styles.previewCount}>{getInstanceCount()}</Text>
              <Text style={styles.previewDescription}>
                {selectedCourse.courseType === "open_elective"
                  ? `${selectedDepartments.length || 0} department(s) × ${selectedSections.length || 0} section(s)`
                  : `1 department × ${selectedSections.length || 0} section(s)`}
              </Text>
            </View>
          )}
        </VStack>

        {/* Submit Button */}
        <Button
          style={styles.submitButton}
          onPress={handleCreateInstance}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Save size={20} color="#FFFFFF" />
              <ButtonText style={styles.submitButtonText}>
                Create{" "}
                {getInstanceCount() > 1
                  ? `${getInstanceCount()} Instances`
                  : "Instance"}
              </ButtonText>
            </>
          )}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#77867D",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E9F0EB",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#232323",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#232323",
    marginBottom: 8,
  },
  sublabel: {
    fontSize: 12,
    color: "#77867D",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E9F0EB",
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#232323",
  },
  selectTrigger: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E9F0EB",
  },
  selectContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  selectInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  courseSelectContent: {
    maxHeight: 400,
  },
  courseInfoCard: {
    backgroundColor: "#F0F1FF",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  courseInfoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#232323",
    marginBottom: 8,
  },
  courseInfoRow: {
    marginTop: 4,
  },
  courseInfoText: {
    fontSize: 13,
    color: "#5A5CCC",
  },
  typeBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  coreBadge: {
    backgroundColor: "#10B981",
  },
  professionalBadge: {
    backgroundColor: "#F9CD61",
  },
  openBadge: {
    backgroundColor: "#7477FF",
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  sectionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sectionChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9F0EB",
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 60,
    justifyContent: "center",
  },
  sectionChipSelected: {
    backgroundColor: "#7477FF",
    borderColor: "#7477FF",
  },
  sectionChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#232323",
  },
  sectionChipTextSelected: {
    color: "#FFFFFF",
  },
  sectionCheck: {
    marginLeft: 6,
  },
  departmentsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  deptItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9F0EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deptItemSelected: {
    backgroundColor: "#F0F1FF",
    borderColor: "#7477FF",
  },
  deptContent: {
    alignItems: "center",
  },
  deptText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#232323",
  },
  deptTextSelected: {
    color: "#7477FF",
    fontWeight: "600",
  },
  teachersContainer: {
    marginTop: 8,
  },
  teacherItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E9F0EB",
    padding: 12,
    marginBottom: 8,
  },
  teacherItemSelected: {
    backgroundColor: "#F0F1FF",
    borderColor: "#7477FF",
  },
  teacherContent: {
    alignItems: "center",
  },
  teacherAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#232323",
  },
  teacherDept: {
    fontSize: 13,
    color: "#77867D",
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#7477FF",
    alignItems: "center",
    justifyContent: "center",
  },
  previewCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  previewHeader: {
    alignItems: "center",
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4338CA",
  },
  previewCount: {
    fontSize: 32,
    fontWeight: "700",
    color: "#4338CA",
    textAlign: "center",
  },
  previewDescription: {
    fontSize: 12,
    color: "#6366F1",
    textAlign: "center",
    marginTop: 4,
  },
  submitButton: {
    marginTop: 32,
    backgroundColor: "#7477FF",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  noSlotsWarning: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  noSlotsText: {
    fontSize: 14,
    color: "#92400E",
    textAlign: "center",
  },
  slotsContainer: {
    gap: 8,
  },
  slotItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E9F0EB",
    padding: 16,
  },
  slotItemSelected: {
    backgroundColor: "#F0F1FF",
    borderColor: "#7477FF",
  },
  slotContent: {
    alignItems: "center",
  },
  slotTypeBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
  },
  slotTypeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  slotInfo: {
    flex: 1,
  },
  slotCode: {
    fontSize: 15,
    fontWeight: "700",
    color: "#232323",
  },
  slotName: {
    fontSize: 13,
    color: "#77867D",
    marginTop: 2,
  },
});
