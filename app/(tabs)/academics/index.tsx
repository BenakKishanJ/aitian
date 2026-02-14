import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { useLinkedStudents } from '@/lib/hooks/useLinkedStudents';
import { CourseCard } from '@/components/academics/CourseCard';
import { SemesterGroup } from '@/components/academics/SemesterGroup';
import { ElectiveSelectorModal } from '@/components/academics/ElectiveSelectorModal';
import { StudentSelector } from '@/components/parent/StudentSelector';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { StudentCourseView, CourseInstanceWithDetails, ElectiveSlot, Course, EnrollmentStatus } from '@/types';
import { collection, query, where, getDocs, getDoc, doc, addDoc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, ELECTIVE_SLOT_TYPES, ENROLLMENT_STATUSES } from '@/types/constants';

interface GroupedCourses {
  [semester: number]: StudentCourseView[];
}

export default function AcademicsScreen() {
  const { user, userData, role } = useAuth();
  const userSemester = userData?.role === 'student' ? userData.semester : null;
  // Support both departmentId (new) and department (legacy) for backward compatibility
  const userDept = userData?.role === 'student' 
    ? (userData.departmentId || userData.department) 
    : null;
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

  // For parents - fetch linked students and their courses
  const {
    students: linkedStudents,
    loading: linkedStudentsLoading,
    selectedStudent,
    setSelectedStudent,
    refresh: refreshLinkedStudents,
  } = useLinkedStudents();

  // State for parent-viewed courses
  const [parentCourses, setParentCourses] = useState<StudentCourseView[]>([]);
  const [parentCoursesLoading, setParentCoursesLoading] = useState(false);

  // Fetch courses for selected student (for parent role)
  useEffect(() => {
    if (role !== 'parent' || !selectedStudent) {
      setParentCourses([]);
      return;
    }

    const fetchParentStudentCourses = async () => {
      setParentCoursesLoading(true);
      try {
        // Fetch course instances for the selected student
        const instancesRef = collection(db, COLLECTIONS.COURSE_INSTANCES);
        const instancesQuery = query(
          instancesRef,
          where('departmentId', '==', selectedStudent.departmentId.toLowerCase()),
          where('semester', '==', selectedStudent.semester),
          where('section', '==', selectedStudent.section.toUpperCase()),
          where('isActive', '==', true)
        );

        const instancesSnap = await getDocs(instancesQuery);
        const courseViews: StudentCourseView[] = [];

        for (const instanceDoc of instancesSnap.docs) {
          const instanceData = instanceDoc.data() as CourseInstanceWithDetails;
          instanceData.id = instanceDoc.id;

          // Fetch course details
          if (instanceData.courseId) {
            const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, instanceData.courseId));
            if (courseDoc.exists()) {
              instanceData.course = { id: courseDoc.id, ...courseDoc.data() } as Course;
            }
          }

          // Fetch teacher names
          if (instanceData.teacherIds && instanceData.teacherIds.length > 0) {
            const teacherDocs = await Promise.all(
              instanceData.teacherIds.map(teacherId => 
                getDoc(doc(db, COLLECTIONS.USERS, teacherId))
              )
            );
            instanceData.teacherNames = teacherDocs
              .filter(doc => doc.exists())
              .map(doc => doc.data().name || 'Unknown');
          }

          courseViews.push({
            instance: instanceData,
            isElectiveSlot: instanceData.course?.courseType?.includes('elective') || false,
            selectionStatus: 'not_applicable' as const,
          });
        }

        setParentCourses(courseViews);
      } catch (err) {
        console.error('Error fetching parent student courses:', err);
      } finally {
        setParentCoursesLoading(false);
      }
    };

    fetchParentStudentCourses();
  }, [role, selectedStudent]);

  // Determine which data to use based on role
  const isStudent = role === 'student';
  const isTeacher = role === 'teacher';
  const isParent = role === 'parent';
  
  // For students, use the new hook with dynamic course fetching
  // For teachers, use the existing hook
  // For parents, use the fetched courses for selected student
  // For admin, we need to handle separately or use a different approach
  const courses = useMemo(() => {
    if (isStudent) {
      return studentCourses;
    } else if (isTeacher) {
      return teacherCourses.map(tc => ({
        instance: tc,
        isElectiveSlot: tc.course?.courseType?.includes('elective') || false,
        selectionStatus: 'not_applicable' as const,
      }));
    } else if (isParent) {
      return parentCourses;
    } else {
      // For admin, return empty array for now
      return [];
    }
  }, [isStudent, isTeacher, isParent, studentCourses, teacherCourses, parentCourses]);
  
  const enrollments = isStudent ? {} : teacherEnrollments;
  const loading = isStudent ? studentLoading : isParent ? (parentCoursesLoading || linkedStudentsLoading) : teacherLoading;
  const error = isStudent ? studentError : teacherError;
  const refresh = isStudent ? refreshStudent : isParent ? refreshLinkedStudents : refreshTeacher;

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
  const handleElectiveSelect = useCallback(async (courseId: string) => {
    // Capture values at function start to avoid stale closure issues
    const currentSlot = selectedSlot;
    const currentUser = user;
    const currentUserDept = userDept;
    const currentUserSection = userSection;
    
    console.log('handleElectiveSelect called with courseId:', courseId);
    console.log('currentSlot:', currentSlot?.id);
    console.log('currentUser:', currentUser?.uid);
    console.log('currentUserDept:', currentUserDept);
    console.log('currentUserSection:', currentUserSection);
    
    if (!currentSlot || !currentUser || !currentUserDept || !currentUserSection) {
      console.error('Missing required data:', { 
        currentSlot: !!currentSlot, 
        currentUser: !!currentUser, 
        currentUserDept, 
        currentUserSection 
      });
      setElectiveError('Missing required information. Please try again.');
      return;
    }

    try {
      // Check if student already has a selection for this slot
      const existingSelectionsRef = collection(db, COLLECTIONS.ELECTIVE_SELECTIONS);
      const existingQuery = query(
        existingSelectionsRef,
        where('studentId', '==', currentUser.uid),
        where('slotId', '==', currentSlot.id)
      );
      console.log('Checking existing selections...');
      const existingSnap = await getDocs(existingQuery);
      console.log('Existing selections count:', existingSnap.size);
      
      if (!existingSnap.empty) {
        // Student already selected - update the selection
        console.log('Updating existing selection...');
        const existingDoc = existingSnap.docs[0];
        await updateDoc(doc(db, COLLECTIONS.ELECTIVE_SELECTIONS, existingDoc.id), {
          selectedCourseId: courseId,
          updatedAt: serverTimestamp(),
        });
        console.log('Selection updated successfully');
      } else {
        // Create new elective selection
        console.log('Creating new selection...');
        await addDoc(collection(db, COLLECTIONS.ELECTIVE_SELECTIONS), {
          studentId: currentUser.uid,
          slotId: currentSlot.id,
          selectedCourseId: courseId,
          selectedAt: serverTimestamp(),
        });
        console.log('New selection created successfully');
      }

      // Only close modal and cleanup AFTER successful save
      console.log('Selection saved successfully, closing modal...');
      setIsElectiveModalOpen(false);
      setSelectedSlot(null);
      setSelectedCourseView(null);
      
      // Wait for Firestore to propagate, then refresh
      console.log('Waiting to refresh...');
      setTimeout(() => {
        console.log('Refreshing courses...');
        refresh();
      }, 500);
      
    } catch (err: any) {
      console.error('Error selecting elective:', err);
      console.error('Error details:', err.message, err.code);
      setElectiveError(err.message || 'Failed to select elective');
      throw err; // Re-throw so modal can catch it
    }
  }, [selectedSlot, user, userDept, userSection, refresh]);

  // Open elective selector
  const openElectiveSelector = useCallback(async (courseView: StudentCourseView) => {
    console.log('openElectiveSelector called');
    console.log('electiveSlotId:', courseView.instance.electiveSlotId);
    
    if (!courseView.instance.electiveSlotId) {
      console.log('No electiveSlotId found');
      return;
    }
    
    setSelectedCourseView(courseView);
    setLoadingElectives(true);
    setElectiveError(null);

    try {
      // Fetch the slot details
      console.log('Fetching slot details...');
      const slotDoc = await getDoc(doc(db, COLLECTIONS.ELECTIVE_SLOTS, courseView.instance.electiveSlotId));
      if (!slotDoc.exists()) {
        console.log('Slot not found');
        setElectiveError('Elective slot not found');
        return;
      }
      
      const slotData = { id: slotDoc.id, ...slotDoc.data() } as ElectiveSlot;
      console.log('Slot found:', slotData.name);
      setSelectedSlot(slotData);

      // Fetch available courses from slot mapping
      console.log('Fetching course mappings...');
      const mappingsRef = collection(db, COLLECTIONS.ELECTIVE_SLOT_MAPPINGS);
      const mappingsQuery = query(mappingsRef, where('slotId', '==', slotData.id));
      const mappingsSnap = await getDocs(mappingsQuery);
      
      console.log('Mappings found:', mappingsSnap.size);
      
      if (mappingsSnap.empty) {
        console.log('No mappings found');
        setElectiveError('No courses mapped to this slot yet. Please contact admin.');
        return;
      }

      const mapping = mappingsSnap.docs[0].data();
      const courseIds: string[] = mapping.availableCourseIds || [];
      console.log('Available course IDs:', courseIds);

      // Fetch course details
      const coursesList: Course[] = [];
      for (const courseId of courseIds) {
        const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, courseId));
        if (courseDoc.exists()) {
          coursesList.push({ id: courseDoc.id, ...courseDoc.data() } as Course);
          console.log('Loaded course:', courseDoc.data().name);
        } else {
          console.log('Course not found:', courseId);
        }
      }

      console.log('Total courses loaded:', coursesList.length);
      setElectiveCourses(coursesList);
      setIsElectiveModalOpen(true);
      console.log('Modal opened');
    } catch (err: any) {
      console.error('Error loading electives:', err);
      console.error('Error details:', err.message, err.code);
      setElectiveError(err.message || 'Failed to load elective options');
    } finally {
      setLoadingElectives(false);
    }
  }, []);

  const handleCardPress = useCallback((courseView: StudentCourseView) => {
    if (role === 'student' && courseView.isElectiveSlot && courseView.selectionStatus === 'not_selected') {
      // This is an elective slot that hasn't been selected yet
      openElectiveSelector(courseView);
    } else {
      // Navigate to course detail page
      router.push(`/(tabs)/academics/${courseView.instance.id}` as any);
    }
  }, [role, openElectiveSelector, router]);

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

      {/* Parent Student Selector */}
      {isParent && (
        <StudentSelector
          students={linkedStudents}
          selectedStudent={selectedStudent}
          onSelectStudent={setSelectedStudent}
          loading={linkedStudentsLoading}
        />
      )}

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
          key={`elective-modal-${selectedSlot?.id || 'closed'}`}
          isOpen={isElectiveModalOpen}
          onClose={() => {
            console.log('Modal onClose called');
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
