import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { ChevronLeft, Save, BookOpen, Building2, Hash, Award, ToggleLeft, ToggleRight, FileText } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Button, ButtonText } from '@/components/ui/button';
import { Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectItem } from '@/components/ui/select';
import { useAuth } from '@/lib/AuthContext';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEPARTMENTS, SEMESTERS, COLLECTIONS, DepartmentId } from '@/types/constants';
import { validateCourseCode, validateCourseName, validateCredits } from '@/lib/validation';

export default function CreateCourseScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Course form state
  const [courseCode, setCourseCode] = useState('');
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState<DepartmentId | ''>('');
  const [semester, setSemester] = useState<string>('');
  const [credits, setCredits] = useState<string>('');
  const [isElective, setIsElective] = useState(false);
  const [description, setDescription] = useState('');

  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  const validateForm = async (): Promise<boolean> => {
    const errors: {[key: string]: string} = {};
    
    // Validate course code format
    const codeValidation = validateCourseCode(courseCode);
    if (!codeValidation.isValid) {
      errors.courseCode = codeValidation.error || 'Invalid course code';
    }
    
    // Validate course name
    const nameValidation = validateCourseName(name);
    if (!nameValidation.isValid) {
      errors.name = nameValidation.error || 'Invalid course name';
    }
    
    // Check required fields
    if (!departmentId) {
      errors.departmentId = 'Department is required';
    }
    if (!semester) {
      errors.semester = 'Semester is required';
    }
    
    // Validate credits
    const creditsValidation = validateCredits(credits);
    if (!creditsValidation.isValid) {
      errors.credits = creditsValidation.error || 'Invalid credits';
    }
    
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return false;
    }
    
    // Check for duplicate course code
    try {
      const coursesRef = collection(db, COLLECTIONS.COURSES);
      const duplicateQuery = query(
        coursesRef,
        where('courseCode', '==', courseCode.trim().toUpperCase())
      );
      const duplicateSnap = await getDocs(duplicateQuery);
      
      if (!duplicateSnap.empty) {
        setFieldErrors({ courseCode: 'A course with this code already exists' });
        return false;
      }
    } catch (err) {
      console.error('Error checking for duplicates:', err);
    }
    
    return true;
  };

  const handleCreateCourse = async () => {
    const isValid = await validateForm();
    if (!isValid || !user) return;

    setLoading(true);
    setFieldErrors({});
    try {
      const courseData = {
        courseCode: courseCode.trim().toUpperCase(),
        name: name.trim(),
        departmentId,
        semester: parseInt(semester),
        credits: parseInt(credits),
        isElective,
        metadata: {
          description: description.trim() || undefined,
        },
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, COLLECTIONS.COURSES), courseData);

      Alert.alert(
        'Success',
        'Course created successfully!',
        [
          {
            text: 'Create Another',
            onPress: () => {
              // Reset form
              setCourseCode('');
              setName('');
              setDepartmentId('');
              setSemester('');
              setCredits('');
              setIsElective(false);
              setDescription('');
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
      console.error('Error creating course:', error);
      Alert.alert('Error', error.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#232323" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Course</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <VStack space="lg">
          {/* Course Code */}
          <VStack space="xs">
            <Text style={styles.label}>Course Code *</Text>
            <View style={[styles.inputContainer, fieldErrors.courseCode && styles.inputError]}>
              <Hash size={20} color="#7477FF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., CS101"
                value={courseCode}
                onChangeText={(text) => {
                  setCourseCode(text);
                  if (fieldErrors.courseCode) {
                    setFieldErrors(prev => ({ ...prev, courseCode: '' }));
                  }
                }}
                autoCapitalize="characters"
              />
            </View>
            {fieldErrors.courseCode && (
              <Text style={styles.errorText}>{fieldErrors.courseCode}</Text>
            )}
          </VStack>

          {/* Course Name */}
          <VStack space="xs">
            <Text style={styles.label}>Course Name *</Text>
            <View style={[styles.inputContainer, fieldErrors.name && styles.inputError]}>
              <BookOpen size={20} color="#7477FF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., Introduction to Computer Science"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (fieldErrors.name) {
                    setFieldErrors(prev => ({ ...prev, name: '' }));
                  }
                }}
              />
            </View>
            {fieldErrors.name && (
              <Text style={styles.errorText}>{fieldErrors.name}</Text>
            )}
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
                  <SelectInput placeholder="Select department" style={styles.selectInput} />
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
                  <SelectInput placeholder="Select semester" style={styles.selectInput} />
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
          onPress={handleCreateCourse}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Save size={20} color="#FFFFFF" />
              <ButtonText style={styles.submitButtonText}>Create Course</ButtonText>
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
  inputError: {
    borderColor: '#F96857',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#F96857',
    marginTop: 4,
  },
});
