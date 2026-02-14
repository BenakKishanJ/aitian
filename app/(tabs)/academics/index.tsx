import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Plus, X, Layers } from 'lucide-react-native';
import { useAuth } from '@/lib/AuthContext';
import { useStudentCourses } from '@/lib/hooks/useStudentCourses';
import { useCoursesWithEnrollments } from '@/lib/hooks/useCoursesWithEnrollments';
import { CourseCard } from '@/components/academics/CourseCard';
import { SemesterGroup } from '@/components/academics/SemesterGroup';
import { ElectiveSelectorModal } from '@/components/academics/ElectiveSelectorModal';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { StudentCourseView, CourseInstanceWithDetails, ElectiveSlot, Course, EnrollmentStatus } from '@/types';
import { collection, query, where, getDocs, getDoc, doc, addDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, ELECTIVE_SLOT_TYPES, ENROLLMENT_STATUSES } from '@/types/constants';

interface GroupedCourses {
  [semester: number]: StudentCourseView[];
}

export default function AcademicsScreen() {
  const { user, userData, role } = useAuth();
  const userSemester = userData?.role === 'student' ? userData.semester : null;
  const userDept = userData?.role === 'student' ? userData.departmentId : null;
  const userSection = userData?.role === 'student' ? userData.section : null;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isElectiveModalOpen, setIsElectiveModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ElectiveSlot | null>(null);
  const [electiveCourses, setElectiveCourses] = useState<Course[]>([]);
  const [selectedCourseView, setSelectedCourseView] = useState<StudentCourseView | null>(null);
  const [loadingElectives, setLoadingElectives] = useState(false);
  const [electiveError, setElectiveError] = useState<string | null>(null);

  const router = useRouter();

  // Use new hook for students, old hook for others
  const { 
    courses: studentCourses, 
    loading: studentLoading, 
    error: studentError, 
    refresh: refreshStudent 
  } = useStudentCourses();

  const { 
    courses: teacherCourses, 
    enrollments: teacherEnrollments,
    loading: teacherLoading, 
    error: teacherError, 
    refresh: refreshTeacher 
  } = useCoursesWithEnrollments({
    searchQuery: searchQuery,
  });

  // Determine which data to use based on role
  const isStudent = role === 'student';
  const isTeacher = role === 'teacher';
  
  // For students, use the new hook with dynamic course fetching
  // For teachers, use the existing hook
  // For admin/parent, we need to handle separately or use a different approach
  const courses = useMemo(() => {
    if (isStudent) {
      return studentCourses;
    } else if (isTeacher) {
      return teacherCourses.map(tc => ({
        instance: tc,
        isElectiveSlot: tc.course?.courseType?.includes('elective') || false,
        selectionStatus: 'not_applicable' as const,
      }));
    } else {
      // For admin and parent roles, return empty array for now
      // These roles should use different data fetching logic
      return [];
    }
  }, [isStudent, isTeacher, studentCourses, teacherCourses]);
  
  const enrollments = isStudent ? {} : teacherEnrollments;
  const loading = isStudent ? studentLoading : teacherLoading;
  const error = isStudent ? studentError : teacherError;
  const refresh = isStudent ? refreshStudent : refreshTeacher;

  // Group courses by semester (high to low)
  const groupedCourses: GroupedCourses = useMemo(() => {
    const grouped: GroupedCourses = {};
    
    courses.forEach((courseView: StudentCourseView) => {
      const semester = courseView.instance.semester;
      if (!grouped[semester]) {
        grouped[semester] = [];
      }
      grouped[semester].push(courseView);
    });

    return grouped;
  }, [courses]);

  // Get sorted semester keys (descending)
  const semesterKeys = useMemo(() => {
    return Object.keys(groupedCourses)
      .map(Number)
      .sort((a, b) => b - a);
  }, [groupedCourses]);

  // Check if semester is locked for student
  const isSemesterLocked = useCallback((semester: number): boolean => {
    if (role !== 'student' || !userSemester) return false;
    return semester > userSemester;
  }, [role, userSemester]);

  // Handle elective course selection
  const handleElectiveSelect = async (courseId: string) => {
    if (!selectedSlot || !user || !userDept || !userSection) return;

    try {
      // Find the course instance for this slot and student's section
      const instancesRef = collection(db, COLLECTIONS.COURSE_INSTANCES);
      const instancesQuery = query(
        instancesRef,
        where('electiveSlotId', '==', selectedSlot.id),
        where('departmentId', '==', userDept),
        where('semester', '==', selectedSlot.semester),
        where('section', '==', userSection),
        where('isActive', '==', true)
      );

      const instancesSnap = await getDocs(instancesQuery);
      
      let instanceId: string;
      
      if (instancesSnap.empty) {
        // No instance exists yet for this section - we need to find an instance and use it
        const fallbackQuery = query(
          instancesRef,
          where('electiveSlotId', '==', selectedSlot.id),
          where('departmentId', '==', userDept),
          where('semester', '==', selectedSlot.semester),
          where('isActive', '==', true)
        );
        const fallbackSnap = await getDocs(fallbackQuery);
        
        if (fallbackSnap.empty) {
          setElectiveError('No course instance found for this elective. Please contact admin.');
          return;
        }
        
        instanceId = fallbackSnap.docs[0].id;
      } else {
        instanceId = instancesSnap.docs[0].id;
      }
      
      // Create elective selection
      await addDoc(collection(db, COLLECTIONS.ELECTIVE_SELECTIONS), {
        studentId: user.uid,
        slotId: selectedSlot.id,
        selectedCourseId: courseId,
        instanceId: instanceId,
        selectedAt: serverTimestamp(),
      });

      // Refresh courses
      await refresh();
      
      setIsElectiveModalOpen(false);
      setSelectedSlot(null);
      setSelectedCourseView(null);
    } catch (err: any) {
      console.error('Error selecting elective:', err);
      setElectiveError(err.message || 'Failed to select elective');
    }
  };

  // Open elective selector
  const openElectiveSelector = async (courseView: StudentCourseView) => {
    if (!courseView.instance.electiveSlotId) return;
    
    setSelectedCourseView(courseView);
    setLoadingElectives(true);
    setElectiveError(null);

    try {
      // Fetch the slot details
      const slotDoc = await getDoc(doc(db, COLLECTIONS.ELECTIVE_SLOTS, courseView.instance.electiveSlotId));
      if (!slotDoc.exists()) {
        setElectiveError('Elective slot not found');
        return;
      }
      
      const slotData = { id: slotDoc.id, ...slotDoc.data() } as ElectiveSlot;
      setSelectedSlot(slotData);

      // Fetch available courses from slot mapping
      const mappingsRef = collection(db, COLLECTIONS.ELECTIVE_SLOT_MAPPINGS);
      const mappingsQuery = query(mappingsRef, where('slotId', '==', slotData.id));
      const mappingsSnap = await getDocs(mappingsQuery);
      
      if (mappingsSnap.empty) {
        setElectiveError('No courses mapped to this slot yet. Please contact admin.');
        return;
      }

      const mapping = mappingsSnap.docs[0].data();
      const courseIds: string[] = mapping.availableCourseIds || [];

      // Fetch course details
      const coursesList: Course[] = [];
      for (const courseId of courseIds) {
        const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, courseId));
        if (courseDoc.exists()) {
          coursesList.push({ id: courseDoc.id, ...courseDoc.data() } as Course);
        }
      }

      setElectiveCourses(coursesList);
      setIsElectiveModalOpen(true);
    } catch (err: any) {
      console.error('Error loading electives:', err);
      setElectiveError(err.message || 'Failed to load elective options');
    } finally {
      setLoadingElectives(false);
    }
  };

  const handleCardPress = (courseView: StudentCourseView) => {
    if (role === 'student' && courseView.isElectiveSlot && courseView.selectionStatus === 'not_selected') {
      // This is an elective slot that hasn't been selected yet
      openElectiveSelector(courseView);
    } else {
      // Navigate to course detail page
      router.push(`/(tabs)/academics/${courseView.instance.id}` as any);
    }
  };

  // Filter courses based on search
  const filteredGroupedCourses = useMemo(() => {
    if (!searchQuery.trim()) return groupedCourses;
    
    const filtered: GroupedCourses = {};
    const queryLower = searchQuery.toLowerCase();
    
    Object.entries(groupedCourses).forEach(([semester, courseViews]) => {
      const filteredViews = courseViews.filter((cv: StudentCourseView) => {
        const courseName = cv.instance.course?.name?.toLowerCase() || '';
        const courseCode = cv.instance.course?.courseCode?.toLowerCase() || '';
        const section = cv.instance.section?.toLowerCase() || '';
        
        return courseName.includes(queryLower) ||
               courseCode.includes(queryLower) ||
               section.includes(queryLower);
      });
      
      if (filteredViews.length > 0) {
        filtered[parseInt(semester)] = filteredViews;
      }
    });
    
    return filtered;
  }, [groupedCourses, searchQuery]);

  // Get enrollment status for a course
  const getEnrollmentStatus = (courseView: StudentCourseView): EnrollmentStatus | undefined => {
    if (!isStudent) return undefined;
    
    if (courseView.isElectiveSlot) {
      if (courseView.selectionStatus === 'not_selected') {
        return ENROLLMENT_STATUSES.ELECTIVE_PENDING;
      } else if (courseView.selectionStatus === 'selected') {
        return ENROLLMENT_STATUSES.ELECTIVE_ENROLLED;
      }
    }
    
    // For core courses or when using old system
    return enrollments[courseView.instance.id]?.enrollmentStatus;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <HStack className="justify-between items-center px-4 py-3">
          <VStack space="xs">
            <Text className="text-2xl font-bold text-black">Academics</Text>
            <Text className="text-sm text-gray-600">
              {role === 'student' && 'Your courses'}
              {role === 'teacher' && 'Courses you teach'}
              {role === 'parent' && "Your child's courses"}
              {role === 'admin' && 'All courses'}
            </Text>
          </VStack>

          {/* Search Icon */}
          <TouchableOpacity
            onPress={() => setShowSearch(!showSearch)}
            style={styles.iconButton}
          >
            <Icon as={showSearch ? X : Search} size="md" className="text-gray-700" />
          </TouchableOpacity>
        </HStack>

        {/* Search Input */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <Icon as={Search} size="sm" className="text-gray-400 ml-3" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search courses..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Icon as={X} size="sm" className="text-gray-400" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#7477FF" />
          <Text className="mt-4 text-gray-600">Loading courses...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text className="text-red-500">{error}</Text>
          <TouchableOpacity onPress={refresh} style={styles.retryButton}>
            <Text className="text-blue-500">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} />
          }
        >
          {Object.keys(filteredGroupedCourses).length === 0 ? (
            <View style={styles.emptyState}>
              <Layers size={48} color="#C5D4CA" />
              <Text className="text-lg font-semibold text-gray-700 mt-4">
                {searchQuery ? 'No courses found' : 'No courses yet'}
              </Text>
              <Text className="text-sm text-gray-500 text-center mt-2 px-8">
                {searchQuery 
                  ? 'Try a different search term'
                  : role === 'student' 
                    ? 'Your courses will appear here once admin creates them'
                    : role === 'teacher'
                    ? 'Your assigned courses will appear here'
                    : role === 'parent'
                    ? "Your child's courses will appear here"
                    : role === 'admin'
                    ? 'Create courses to get started'
                    : 'No courses available'
                }
              </Text>
            </View>
          ) : (
            <VStack space="lg" className="px-4 py-4">
              {semesterKeys.map((semester) => {
                const semesterCourses = filteredGroupedCourses[semester];
                const locked = isSemesterLocked(semester);
                
                return (
                  <SemesterGroup
                    key={semester}
                    semester={semester}
                    courseCount={semesterCourses.length}
                    isLocked={locked}
                    defaultExpanded={!locked}
                  >
                    <VStack space="sm">
                      {semesterCourses.map((courseView: StudentCourseView) => (
                        <CourseCard
                          key={courseView.instance.id}
                          courseInstance={courseView.instance}
                          role={role || 'student'}
                          enrollmentStatus={getEnrollmentStatus(courseView)}
                          isLocked={locked}
                          onPress={() => handleCardPress(courseView)}
                        />
                      ))}
                    </VStack>
                  </SemesterGroup>
                );
              })}
            </VStack>
          )}
        </ScrollView>
      )}

      {/* Elective Selector Modal */}
      {role === 'student' && (
        <ElectiveSelectorModal
          isOpen={isElectiveModalOpen}
          onClose={() => {
            setIsElectiveModalOpen(false);
            setSelectedSlot(null);
            setElectiveError(null);
          }}
          onSelect={handleElectiveSelect}
          electiveGroup={selectedSlot ? {
            id: selectedSlot.id,
            name: selectedSlot.name,
            departmentId: selectedSlot.departmentId,
            semester: selectedSlot.semester,
            courseIds: electiveCourses.map(c => c.id),
            createdAt: Timestamp.now(),
          } : null}
          courses={electiveCourses}
          loading={loadingElectives}
          error={electiveError}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9F0EB',
  },
  iconButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: {
    marginTop: 12,
    padding: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
});
