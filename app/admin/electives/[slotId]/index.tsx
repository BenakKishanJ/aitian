import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Save, Hash, BookOpen, Building2, Award, Check, Plus, Trash2, GraduationCap } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Button, ButtonText } from '@/components/ui/button';
import { Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectItem } from '@/components/ui/select';
import { useAuth } from '@/lib/AuthContext';
import { collection, doc, getDoc, updateDoc, serverTimestamp, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEPARTMENTS, COLLECTIONS, DepartmentId, ELECTIVE_SLOT_TYPES, ElectiveSlotType } from '@/types/constants';
import type { ElectiveSlot, ElectiveSlotMapping, Course } from '@/types';
import { getDepartmentCodeById } from '@/types/constants';

export default function ElectiveSlotDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const slotId = params.slotId as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slot, setSlot] = useState<ElectiveSlot | null>(null);
  const [mapping, setMapping] = useState<ElectiveSlotMapping | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  
  // Form state
  const [slotCode, setSlotCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assignedDepartments, setAssignedDepartments] = useState<DepartmentId[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  useEffect(() => {
    fetchSlotData();
  }, [slotId]);

  const fetchSlotData = async () => {
    try {
      setLoading(true);
      
      // Fetch slot
      const slotDoc = await getDoc(doc(db, COLLECTIONS.ELECTIVE_SLOTS, slotId));
      if (!slotDoc.exists()) {
        alert('Slot not found');
        router.back();
        return;
      }
      
      const slotData = { id: slotDoc.id, ...slotDoc.data() } as ElectiveSlot;
      setSlot(slotData);
      setSlotCode(slotData.slotCode);
      setName(slotData.name);
      setDescription(slotData.description || '');
      setAssignedDepartments(slotData.assignedDepartments || []);

      // Fetch mapping
      const mappingsRef = collection(db, COLLECTIONS.ELECTIVE_SLOT_MAPPINGS);
      const mappingsQuery = query(mappingsRef, where('slotId', '==', slotId));
      const mappingsSnap = await getDocs(mappingsQuery);
      
      let mappingData: ElectiveSlotMapping | null = null;
      if (!mappingsSnap.empty) {
        mappingData = { id: mappingsSnap.docs[0].id, ...mappingsSnap.docs[0].data() } as ElectiveSlotMapping;
        setMapping(mappingData);
        setSelectedCourseIds(mappingData.availableCourseIds || []);
      }

      // Fetch all courses for the slot's semester and type
      const coursesRef = collection(db, COLLECTIONS.COURSES);
      const coursesQuery = query(
        coursesRef,
        where('semester', '==', slotData.semester),
        where('courseType', 'in', ['open_elective', 'professional_elective'])
      );
      const coursesSnap = await getDocs(coursesQuery);
      
      const coursesList: Course[] = [];
      coursesSnap.docs.forEach(doc => {
        coursesList.push({ id: doc.id, ...doc.data() } as Course);
      });
      
      setAvailableCourses(coursesList);
      
      // Fetch details of already selected courses
      if (mappingData && mappingData.availableCourseIds && mappingData.availableCourseIds.length > 0) {
        const selectedCourses: Course[] = [];
        for (const courseId of mappingData.availableCourseIds) {
          const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, courseId));
          if (courseDoc.exists()) {
            selectedCourses.push({ id: courseDoc.id, ...courseDoc.data() } as Course);
          }
        }
        setCourses(selectedCourses);
      }
    } catch (error) {
      console.error('Error fetching slot data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!slot || !user) return;

    setSaving(true);
    try {
      // Update slot
      await updateDoc(doc(db, COLLECTIONS.ELECTIVE_SLOTS, slotId), {
        slotCode: slotCode.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || null,
        assignedDepartments,
        updatedAt: serverTimestamp(),
      });

      // Update or create mapping
      if (mapping) {
        await updateDoc(doc(db, COLLECTIONS.ELECTIVE_SLOT_MAPPINGS, mapping.id), {
          availableCourseIds: selectedCourseIds,
          updatedAt: serverTimestamp(),
        });
      } else if (selectedCourseIds.length > 0) {
        await addDoc(collection(db, COLLECTIONS.ELECTIVE_SLOT_MAPPINGS), {
          slotId,
          availableCourseIds: selectedCourseIds,
          academicYear: new Date().getFullYear().toString(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      Alert.alert('Success', 'Elective slot updated successfully!');
    } catch (error: any) {
      console.error('Error saving slot:', error);
      Alert.alert('Error', error.message || 'Failed to update slot');
    } finally {
      setSaving(false);
    }
  };

  const toggleDepartment = (deptId: DepartmentId) => {
    // Don't allow removing primary department
    if (deptId === slot?.departmentId) return;
    
    setAssignedDepartments(prev => 
      prev.includes(deptId)
        ? prev.filter(id => id !== deptId)
        : [...prev, deptId]
    );
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourseIds(prev => 
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const getSlotTypeLabel = (type: ElectiveSlotType) => {
    return type === ELECTIVE_SLOT_TYPES.OPEN ? 'Open Elective' : 'Professional Elective';
  };

  const getSlotTypeColor = (type: ElectiveSlotType) => {
    return type === ELECTIVE_SLOT_TYPES.OPEN ? '#7477FF' : '#F9CD61';
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#7477FF" />
        <Text style={styles.loadingText}>Loading slot details...</Text>
      </SafeAreaView>
    );
  }

  if (!slot) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text>Slot not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#232323" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Elective Slot</Text>
        <TouchableOpacity 
          onPress={handleSave}
          style={styles.saveButton}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#7477FF" />
          ) : (
            <Save size={24} color="#7477FF" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Slot Info Card */}
        <View style={styles.infoCard}>
          <View style={[styles.typeBadge, { backgroundColor: getSlotTypeColor(slot.slotType) }]}>
            <Text style={styles.typeText}>{getSlotTypeLabel(slot.slotType)}</Text>
          </View>
          <Text style={styles.infoText}>
            {slot.slotType === ELECTIVE_SLOT_TYPES.OPEN 
              ? 'Open electives are available to students from multiple departments.'
              : 'Professional electives are department-specific electives.'}
          </Text>
        </View>

        {/* Mapped Courses Summary Card */}
        <TouchableOpacity 
          style={styles.coursesSummaryCard}
          onPress={() => {
            // Scroll to course mapping section
            // This is a visual cue - the section is already below
          }}
        >
          <HStack space="md" style={styles.coursesSummaryContent}>
            <View style={styles.coursesSummaryIcon}>
              <BookOpen size={24} color="#FFFFFF" />
            </View>
            <VStack space="xs" style={styles.coursesSummaryInfo}>
              <Text style={styles.coursesSummaryTitle}>
                {selectedCourseIds.length} Course{selectedCourseIds.length !== 1 ? 's' : ''} Mapped
              </Text>
              <Text style={styles.coursesSummarySubtitle}>
                {selectedCourseIds.length > 0 
                  ? 'Students can select from these courses'
                  : 'No courses mapped yet. Select courses below.'}
              </Text>
            </VStack>
            <View style={styles.coursesSummaryArrow}>
              <Text style={styles.coursesSummaryArrowText}>↓</Text>
            </View>
          </HStack>
        </TouchableOpacity>

        <VStack space="lg">
          {/* Slot Code */}
          <VStack space="xs">
            <Text style={styles.label}>Slot Code</Text>
            <View style={styles.inputContainer}>
              <Hash size={20} color="#7477FF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={slotCode}
                onChangeText={setSlotCode}
                autoCapitalize="characters"
              />
            </View>
          </VStack>

          {/* Slot Name */}
          <VStack space="xs">
            <Text style={styles.label}>Slot Name</Text>
            <View style={styles.inputContainer}>
              <BookOpen size={20} color="#7477FF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
              />
            </View>
          </VStack>

          {/* Primary Department (Read-only) */}
          <VStack space="xs">
            <Text style={styles.label}>Primary Department</Text>
            <View style={[styles.inputContainer, styles.readOnlyInput]}>
              <Building2 size={20} color="#77867D" style={styles.inputIcon} />
              <Text style={styles.readOnlyText}>
                {DEPARTMENTS.find(d => d.id === slot.departmentId)?.name}
              </Text>
            </View>
          </VStack>

          {/* Semester (Read-only) */}
          <VStack space="xs">
            <Text style={styles.label}>Semester</Text>
            <View style={[styles.inputContainer, styles.readOnlyInput]}>
              <Award size={20} color="#77867D" style={styles.inputIcon} />
              <Text style={styles.readOnlyText}>Semester {slot.semester}</Text>
            </View>
          </VStack>

          {/* Assigned Departments */}
          {slot.slotType === ELECTIVE_SLOT_TYPES.OPEN && (
            <VStack space="xs">
              <Text style={styles.label}>Available To Departments</Text>
              <Text style={styles.sublabel}>
                Primary department is automatically included
              </Text>
              
              <View style={styles.departmentsContainer}>
                {DEPARTMENTS.map((dept) => {
                  const isPrimary = dept.id === slot.departmentId;
                  const isSelected = assignedDepartments.includes(dept.id as DepartmentId);
                  
                  return (
                    <TouchableOpacity
                      key={dept.id}
                      style={[
                        styles.deptItem,
                        isPrimary && styles.deptItemPrimary,
                        isSelected && !isPrimary && styles.deptItemSelected
                      ]}
                      onPress={() => !isPrimary && toggleDepartment(dept.id as DepartmentId)}
                      disabled={isPrimary}
                    >
                      <HStack space="sm" style={styles.deptContent}>
                        <Building2 
                          size={16} 
                          color={isPrimary ? "#10B981" : isSelected ? "#7477FF" : "#77867D"} 
                        />
                        <Text style={[
                          styles.deptText,
                          isPrimary && styles.deptTextPrimary,
                          isSelected && !isPrimary && styles.deptTextSelected
                        ]}>
                          {dept.code}
                        </Text>
                        {isPrimary && (
                          <Text style={styles.primaryBadge}>PRIMARY</Text>
                        )}
                      </HStack>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </VStack>
          )}

          {/* Description */}
          <VStack space="xs">
            <Text style={styles.label}>Description</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <BookOpen size={20} color="#7477FF" style={[styles.inputIcon, styles.textAreaIcon]} />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </VStack>

          {/* Course Mapping Section */}
          <VStack space="xs">
            <Text style={styles.label}>Available Courses</Text>
            <Text style={styles.sublabel}>
              Select courses that students can choose from for this slot
            </Text>

            {availableCourses.length === 0 ? (
              <View style={styles.emptyCourses}>
                <GraduationCap size={32} color="#C5D4CA" />
                <Text style={styles.emptyCoursesText}>
                  No elective courses found for Semester {slot.semester}
                </Text>
                <Text style={styles.emptyCoursesSubtext}>
                  Create elective courses first
                </Text>
              </View>
            ) : (
              <View style={styles.coursesContainer}>
                {availableCourses.map((course) => {
                  const isSelected = selectedCourseIds.includes(course.id);
                  
                  return (
                    <TouchableOpacity
                      key={course.id}
                      style={[
                        styles.courseItem,
                        isSelected && styles.courseItemSelected
                      ]}
                      onPress={() => toggleCourse(course.id)}
                    >
                      <HStack space="md" style={styles.courseContent}>
                        <View style={styles.courseInfo}>
                          <Text style={styles.courseCode}>{course.courseCode}</Text>
                          <Text style={styles.courseName}>{course.name}</Text>
                          <Text style={styles.courseDept}>
                            {getDepartmentCodeById(course.departmentId)} • {course.credits} credits
                          </Text>
                        </View>
                        {isSelected && (
                          <View style={styles.checkmark}>
                            <Check size={16} color="#FFFFFF" />
                          </View>
                        )}
                      </HStack>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </VStack>
        </VStack>

        {/* Save Button */}
        <Button
          style={styles.submitButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Save size={20} color="#FFFFFF" />
              <ButtonText style={styles.submitButtonText}>Save Changes</ButtonText>
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
    backgroundColor: '#F9FAFB',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#77867D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9F0EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#232323',
  },
  saveButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F1FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  typeBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#5A5CCC',
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#232323',
    marginBottom: 8,
  },
  sublabel: {
    fontSize: 12,
    color: '#77867D',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9F0EB',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#232323',
  },
  readOnlyInput: {
    backgroundColor: '#F9FAFB',
  },
  readOnlyText: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#77867D',
  },
  departmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deptItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9F0EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deptItemPrimary: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  deptItemSelected: {
    backgroundColor: '#F0F1FF',
    borderColor: '#7477FF',
  },
  deptContent: {
    alignItems: 'center',
  },
  deptText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#232323',
  },
  deptTextPrimary: {
    color: '#10B981',
    fontWeight: '600',
  },
  deptTextSelected: {
    color: '#7477FF',
    fontWeight: '600',
  },
  primaryBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10B981',
    marginLeft: 4,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textAreaIcon: {
    marginTop: 2,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  emptyCourses: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9F0EB',
    borderStyle: 'dashed',
  },
  emptyCoursesText: {
    fontSize: 14,
    color: '#77867D',
    marginTop: 12,
  },
  emptyCoursesSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  coursesContainer: {
    gap: 8,
  },
  courseItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9F0EB',
    padding: 16,
  },
  courseItemSelected: {
    backgroundColor: '#F0F1FF',
    borderColor: '#7477FF',
  },
  courseContent: {
    alignItems: 'flex-start',
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#232323',
  },
  courseName: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 2,
  },
  courseDept: {
    fontSize: 12,
    color: '#77867D',
    marginTop: 4,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7477FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    marginTop: 32,
    backgroundColor: '#7477FF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  coursesSummaryCard: {
    backgroundColor: '#F0F1FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  coursesSummaryContent: {
    alignItems: 'center',
  },
  coursesSummaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7477FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coursesSummaryInfo: {
    flex: 1,
  },
  coursesSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4338CA',
  },
  coursesSummarySubtitle: {
    fontSize: 13,
    color: '#6366F1',
    marginTop: 2,
  },
  coursesSummaryArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coursesSummaryArrowText: {
    fontSize: 18,
    color: '#7477FF',
    fontWeight: '700',
  },
});
