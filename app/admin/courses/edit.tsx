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
import { ChevronLeft, Save, BookOpen, Building2, Hash, Award, ToggleLeft, ToggleRight, FileText, Trash2 } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Button, ButtonText } from '@/components/ui/button';
import { Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectItem } from '@/components/ui/select';
import { useAuth } from '@/lib/AuthContext';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEPARTMENTS, SEMESTERS, COLLECTIONS, DepartmentId, Course } from '@/types/constants';
import { getDepartmentNameById } from '@/types/constants';

export default function EditCourseScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const courseId = params.courseId as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  
  // Course form state
  const [courseCode, setCourseCode] = useState('');
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState<DepartmentId | ''>('');
  const [semester, setSemester] = useState<string>('');
  const [credits, setCredits] = useState<string>('');
  const [isElective, setIsElective] = useState(false);
  const [description, setDescription] = useState('');

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        Alert.alert('Error', 'Course ID not provided');
        router.back();
        return;
      }

      try {
        setLoading(true);
        const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, courseId));
        
        if (!courseDoc.exists()) {
          Alert.alert('Error', 'Course not found');
          router.back();
          return;
        }

        const courseData = { id: courseDoc.id, ...courseDoc.data() } as Course;
        setCourse(courseData);
        
        // Populate form
        setCourseCode(courseData.courseCode);
        setName(courseData.name);
        setDepartmentId(courseData.departmentId);
        setSemester(courseData.semester.toString());
        setCredits(courseData.credits.toString());
        setIsElective(courseData.isElective);
        setDescription(courseData.metadata?.description || '');
      } catch (error) {
        console.error('Error fetching course:', error);
        Alert.alert('Error', 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const validateForm = (): boolean => {
    if (!courseCode.trim()) {
      Alert.alert('Error', 'Course code is required');
      return false;
    }
    if (!name.trim()) {
      Alert.alert('Error', 'Course name is required');
      return false;
    }
    if (!departmentId) {
      Alert.alert('Error', 'Department is required');
      return false;
    }
    if (!semester) {
      Alert.alert('Error', 'Semester is required');
      return false;
    }
    if (!credits || parseInt(credits) <= 0) {
      Alert.alert('Error', 'Valid credits are required');
      return false;
    }
    return true;
  };

  const handleUpdateCourse = async () => {
    if (!validateForm() || !user || !courseId) return;

    setSaving(true);
    try {
      const updateData = {
        courseCode: courseCode.trim().toUpperCase(),
        name: name.trim(),
        departmentId,
        semester: parseInt(semester),
        credits: parseInt(credits),
        isElective,
        metadata: {
          description: description.trim() || undefined,
        },
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, COLLECTIONS.COURSES, courseId), updateData);

      Alert.alert('Success', 'Course updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Error updating course:', error);
      Alert.alert('Error', error.message || 'Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = () => {
    Alert.alert(
      'Delete Course',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, COLLECTIONS.COURSES, courseId));
              Alert.alert('Success', 'Course deleted successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error: any) {
              console.error('Error deleting course:', error);
              Alert.alert('Error', error.message || 'Failed to delete course');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#7477FF" />
        <Text style={styles.loadingText}>Loading course...</Text>
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
        <Text style={styles.headerTitle}>Edit Course</Text>
        <TouchableOpacity onPress={handleDeleteCourse} style={styles.deleteButton}>
          <Trash2 size={20} color="#F96857" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <VStack space="lg">
          {/* Course Code */}
          <VStack space="xs">
            <Text style={styles.label}>Course Code *</Text>
            <View style={styles.inputContainer}>
              <Hash size={20} color="#7477FF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., CS101"
                value={courseCode}
                onChangeText={setCourseCode}
                autoCapitalize="characters"
              />
            </View>
          </VStack>

          {/* Course Name */}
          <VStack space="xs">
            <Text style={styles.label}>Course Name *</Text>
            <View style={styles.inputContainer}>
              <BookOpen size={20} color="#7477FF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., Introduction to Computer Science"
                value={name}
                onChangeText={setName}
              />
            </View>
          </VStack>

          {/* Department */}
          <VStack space="xs">
            <Text style={styles.label}>Department *</Text>
            <Select
              selectedValue={departmentId}
              onValueChange={(value) => setDepartmentId(value as DepartmentId)}
            >
              <SelectTrigger style={styles.selectTrigger}>
                <HStack space="sm" style={styles.selectContent}>
                  <Building2 size={20} color="#7477FF" />
                  <SelectInput 
                    placeholder="Select department" 
                    style={styles.selectInput}
                    value={departmentId ? getDepartmentNameById(departmentId) : ''}
                  />
                </HStack>
                <SelectIcon />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept.id} label={dept.name} value={dept.id} />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          </VStack>

          {/* Semester */}
          <VStack space="xs">
            <Text style={styles.label}>Semester *</Text>
            <Select
              selectedValue={semester}
              onValueChange={(value) => setSemester(value)}
            >
              <SelectTrigger style={styles.selectTrigger}>
                <HStack space="sm" style={styles.selectContent}>
                  <Award size={20} color="#7477FF" />
                  <SelectInput 
                    placeholder="Select semester" 
                    style={styles.selectInput}
                    value={semester ? `Semester ${semester}` : ''}
                  />
                </HStack>
                <SelectIcon />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  {SEMESTERS.map((sem) => (
                    <SelectItem key={sem} label={`Semester ${sem}`} value={sem.toString()} />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          </VStack>

          {/* Credits */}
          <VStack space="xs">
            <Text style={styles.label}>Credits *</Text>
            <View style={styles.inputContainer}>
              <Award size={20} color="#7477FF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., 4"
                value={credits}
                onChangeText={setCredits}
                keyboardType="numeric"
                maxLength={1}
              />
            </View>
          </VStack>

          {/* Elective Toggle */}
          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={() => setIsElective(!isElective)}
          >
            <HStack space="md" style={styles.toggleContent}>
              {isElective ? (
                <ToggleRight size={28} color="#7477FF" />
              ) : (
                <ToggleLeft size={28} color="#C5D4CA" />
              )}
              <VStack space="xs">
                <Text style={styles.toggleLabel}>Elective Course</Text>
                <Text style={styles.toggleDescription}>
                  {isElective 
                    ? 'Students will choose this from elective options' 
                    : 'This is a core/mandatory course'}
                </Text>
              </VStack>
            </HStack>
          </TouchableOpacity>

          {/* Description */}
          <VStack space="xs">
            <Text style={styles.label}>Description (Optional)</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <FileText size={20} color="#7477FF" style={[styles.inputIcon, styles.textAreaIcon]} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter course description..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </VStack>
        </VStack>

        {/* Submit Button */}
        <Button
          style={styles.submitButton}
          onPress={handleUpdateCourse}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Save size={20} color="#FFFFFF" />
              <ButtonText style={styles.submitButtonText}>Update Course</ButtonText>
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
  deleteButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#232323',
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
  toggleContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9F0EB',
    padding: 16,
    marginTop: 8,
  },
  toggleContent: {
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#232323',
  },
  toggleDescription: {
    fontSize: 13,
    color: '#77867D',
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textAreaIcon: {
    marginTop: 2,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
