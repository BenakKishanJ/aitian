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
import { ChevronLeft, Save, Users, Building2, Hash, Award, Calendar, BookOpen, Check } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Button, ButtonText } from '@/components/ui/button';
import { Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectItem } from '@/components/ui/select';
import { useAuth } from '@/lib/AuthContext';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEPARTMENTS, SEMESTERS, COLLECTIONS, ENROLLMENT_TYPES, DepartmentId, Course, TeacherUserData } from '@/types';
import { getDepartmentNameById } from '@/types/constants';

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
  const [selectedCourseId, setSelectedCourseId] = useState<string>(preselectedCourseId || '');
  const [section, setSection] = useState('');
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());

  // Fetch courses and teachers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        
        // Fetch all courses
        const coursesRef = collection(db, COLLECTIONS.COURSES);
        const coursesSnap = await getDocs(coursesRef);
        const coursesList = coursesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Course[];
        setCourses(coursesList);

        // Fetch all teachers
        const usersRef = collection(db, COLLECTIONS.USERS);
        const teachersQuery = query(usersRef, where('role', '==', 'teacher'));
        const teachersSnap = await getDocs(teachersQuery);
        const teachersList = teachersSnap.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as TeacherUserData[];
        setTeachers(teachersList);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  const validateForm = (): boolean => {
    if (!selectedCourseId) {
      Alert.alert('Error', 'Please select a course');
      return false;
    }
    if (!section.trim()) {
      Alert.alert('Error', 'Section is required');
      return false;
    }
    if (teacherIds.length === 0) {
      Alert.alert('Error', 'Please select at least one teacher');
      return false;
    }
    if (!academicYear.trim()) {
      Alert.alert('Error', 'Academic year is required');
      return false;
    }
    return true;
  };

  const handleCreateInstance = async () => {
    if (!validateForm() || !user || !selectedCourse) return;

    setLoading(true);
    try {
      const instanceData = {
        courseId: selectedCourseId,
        departmentId: selectedCourse.departmentId,
        semester: selectedCourse.semester,
        section: section.trim().toUpperCase(),
        teacherIds: teacherIds,
        enrollmentType: selectedCourse.isElective ? 'elective' : 'core',
        isActive: true,
        academicYear: academicYear.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, COLLECTIONS.COURSE_INSTANCES), instanceData);

      Alert.alert(
        'Success',
        'Course instance created successfully!',
        [
          {
            text: 'Create Another',
            onPress: () => {
              setSelectedCourseId('');
              setSection('');
              setTeacherIds([]);
              setAcademicYear(new Date().getFullYear().toString());
            },
          },
          {
            text: 'Go Back',
            onPress: () => router.back(),
            style: 'cancel',
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating course instance:', error);
      Alert.alert('Error', error.message || 'Failed to create course instance');
    } finally {
      setLoading(false);
    }
  };

  const toggleTeacher = (teacherId: string) => {
    setTeacherIds(prev => 
      prev.includes(teacherId)
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#232323" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assign Course</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <VStack space="lg">
          {/* Course Selection */}
          <VStack space="xs">
            <Text style={styles.label}>Select Course *</Text>
            <Select
              selectedValue={selectedCourseId}
              onValueChange={(value) => setSelectedCourseId(value)}
            >
              <SelectTrigger style={styles.selectTrigger}>
                <HStack space="sm" style={styles.selectContent}>
                  <BookOpen size={20} color="#7477FF" />
                  <SelectInput 
                    placeholder="Choose a course" 
                    style={styles.selectInput}
                    value={selectedCourse ? `${selectedCourse.courseCode} - ${selectedCourse.name}` : ''}
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
                <Text style={styles.courseInfoText}>Code: {selectedCourse.courseCode}</Text>
                <Text style={styles.courseInfoText}>Credits: {selectedCourse.credits}</Text>
              </HStack>
              <HStack space="md" style={styles.courseInfoRow}>
                <Text style={styles.courseInfoText}>Dept: {getDepartmentNameById(selectedCourse.departmentId)}</Text>
                <Text style={styles.courseInfoText}>Semester: {selectedCourse.semester}</Text>
              </HStack>
              {selectedCourse.isElective && (
                <View style={styles.electiveBadge}>
                  <Text style={styles.electiveText}>Elective Course</Text>
                </View>
              )}
            </View>
          )}

          {/* Section */}
          <VStack space="xs">
            <Text style={styles.label}>Section *</Text>
            <View style={styles.inputContainer}>
              <Hash size={20} color="#7477FF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., A, B, C"
                value={section}
                onChangeText={setSection}
                autoCapitalize="characters"
                maxLength={2}
              />
            </View>
          </VStack>

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
            <Text style={styles.sublabel}>Select one or more teachers</Text>
            
            <View style={styles.teachersContainer}>
              {teachers.map((teacher) => (
                <TouchableOpacity
                  key={teacher.uid}
                  style={[
                    styles.teacherItem,
                    teacherIds.includes(teacher.uid) && styles.teacherItemSelected
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
              <ButtonText style={styles.submitButtonText}>Create Assignment</ButtonText>
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
  selectTrigger: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9F0EB',
  },
  selectContent: {
    flex: 1,
    alignItems: 'center',
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
    backgroundColor: '#F0F1FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  courseInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#232323',
    marginBottom: 8,
  },
  courseInfoRow: {
    marginTop: 4,
  },
  courseInfoText: {
    fontSize: 13,
    color: '#5A5CCC',
  },
  electiveBadge: {
    backgroundColor: '#F9CD61',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  electiveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#232323',
  },
  teachersContainer: {
    marginTop: 8,
  },
  teacherItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9F0EB',
    padding: 12,
    marginBottom: 8,
  },
  teacherItemSelected: {
    backgroundColor: '#F0F1FF',
    borderColor: '#7477FF',
  },
  teacherContent: {
    alignItems: 'center',
  },
  teacherAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#232323',
  },
  teacherDept: {
    fontSize: 13,
    color: '#77867D',
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
});
