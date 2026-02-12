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
import { Search, Plus, X } from 'lucide-react-native';
import { useAuth } from '@/lib/AuthContext';
import { useCoursesWithEnrollments } from '@/lib/hooks/useCoursesWithEnrollments';
import { CourseCard } from '@/components/academics/CourseCard';
import { SemesterGroup } from '@/components/academics/SemesterGroup';
import { ElectiveSelectorModal } from '@/components/academics/ElectiveSelectorModal';
import { CourseRequestModal } from '@/components/academics/CourseRequestModal';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { CourseInstanceWithDetails, Enrollment, Course, ElectiveGroup } from '@/types';
import { collection, query, where, getDocs, doc, getDoc, addDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, ENROLLMENT_STATUSES } from '@/types/constants';

interface GroupedCourses {
  [semester: number]: {
    courses: CourseInstanceWithDetails[];
    enrollments: { [courseId: string]: Enrollment };
  };
}

export default function AcademicsScreen() {
  const { user, userData, role } = useAuth();
  const userSemester = userData?.role === 'student' ? userData.semester : null;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isElectiveModalOpen, setIsElectiveModalOpen] = useState(false);
  const [isCourseRequestModalOpen, setIsCourseRequestModalOpen] = useState(false);
  const [selectedElectiveGroup, setSelectedElectiveGroup] = useState<ElectiveGroup | null>(null);
  const [electiveCourses, setElectiveCourses] = useState<Course[]>([]);
  const [selectedPendingEnrollment, setSelectedPendingEnrollment] = useState<Enrollment | null>(null);
  const [loadingElectives, setLoadingElectives] = useState(false);
  const [electiveError, setElectiveError] = useState<string | null>(null);

  const router = useRouter();

  const { courses, enrollments, loading, error, refresh } = useCoursesWithEnrollments({
    searchQuery: searchQuery,
  });

  // Group courses by semester (high to low)
  const groupedCourses: GroupedCourses = useMemo(() => {
    const grouped: GroupedCourses = {};
    
    courses.forEach((course: CourseInstanceWithDetails) => {
      const semester = course.semester;
      if (!grouped[semester]) {
        grouped[semester] = { courses: [], enrollments: {} };
      }
      grouped[semester].courses.push(course);
      
      // Add enrollment info if exists
      const enrollment = enrollments[course.id];
      if (enrollment) {
        grouped[semester].enrollments[course.id] = enrollment;
      }
    });

    return grouped;
  }, [courses, enrollments]);

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
    if (!selectedPendingEnrollment || !user) return;

    try {
      // Find the course instance for the selected course
      const instancesRef = collection(db, COLLECTIONS.COURSE_INSTANCES);
      const instancesQuery = query(
        instancesRef,
        where('courseId', '==', courseId),
        where('isActive', '==', true)
      );

      const instancesSnap = await getDocs(instancesQuery);
      
      if (instancesSnap.empty) {
        setElectiveError('No active course instance found for this elective. Please contact admin.');
        return;
      }

      // Use the first available course instance
      const courseInstanceId = instancesSnap.docs[0].id;

      // Update enrollment with selected elective
      const enrollmentRef = doc(db, COLLECTIONS.ENROLLMENTS, selectedPendingEnrollment.id);
      await updateDoc(enrollmentRef, {
        courseInstanceId: courseInstanceId,
        selectedElectiveCourseId: courseId,
        enrollmentStatus: ENROLLMENT_STATUSES.ELECTIVE_ENROLLED,
        updatedAt: Timestamp.now(),
      });

      // Refresh courses
      await refresh();
      
      setIsElectiveModalOpen(false);
      setSelectedPendingEnrollment(null);
      setSelectedElectiveGroup(null);
    } catch (err: any) {
      console.error('Error selecting elective:', err);
      setElectiveError(err.message || 'Failed to select elective');
    }
  };

  // Open elective selector
  const openElectiveSelector = async (courseInstance: CourseInstanceWithDetails, enrollment: Enrollment) => {
    setSelectedPendingEnrollment(enrollment);
    setLoadingElectives(true);
    setElectiveError(null);

    try {
      // Fetch elective group and available courses
      // For now, we'll show all courses from the same department/semester that are electives
      const coursesRef = collection(db, COLLECTIONS.COURSES);
      const coursesQuery = query(
        coursesRef,
        where('departmentId', '==', courseInstance.departmentId),
        where('semester', '==', courseInstance.semester),
        where('isElective', '==', true)
      );

      const coursesSnap = await getDocs(coursesQuery);
      const electiveCoursesList: Course[] = [];

      coursesSnap.docs.forEach((doc) => {
        electiveCoursesList.push({ id: doc.id, ...doc.data() } as Course);
      });

      setElectiveCourses(electiveCoursesList);
      setSelectedElectiveGroup({
        id: 'default',
        name: 'Select Your Elective',
        departmentId: courseInstance.departmentId,
        semester: courseInstance.semester,
        courseIds: electiveCoursesList.map((c) => c.id),
        createdAt: Timestamp.now(),
      });
      setIsElectiveModalOpen(true);
    } catch (err: any) {
      console.error('Error loading electives:', err);
      setElectiveError(err.message || 'Failed to load elective options');
    } finally {
      setLoadingElectives(false);
    }
  };

  // Handle course request submission
  const handleCourseRequestSubmit = async (requests: any[]) => {
    if (!user || !userData) return;

    try {
      const requestsRef = collection(db, COLLECTIONS.COURSE_REQUESTS);
      const requestDocIds: string[] = [];

      // Create each request and collect the document IDs
      for (const request of requests) {
        const docRef = await addDoc(requestsRef, {
          ...request,
          teacherId: user.uid,
          teacherName: userData.name,
          status: 'pending',
          requestedAt: Timestamp.now(),
        });
        requestDocIds.push(docRef.id);
      }

      // Update teacher's pending course IDs with actual document IDs
      const userRef = doc(db, COLLECTIONS.USERS, user.uid);
      const currentPending = (userData as any).pendingCourseIds || [];
      await updateDoc(userRef, {
        pendingCourseIds: [...currentPending, ...requestDocIds],
        updatedAt: Timestamp.now(),
      });

      setIsCourseRequestModalOpen(false);
    } catch (err: any) {
      console.error('Error submitting course request:', err);
      throw err;
    }
  };

  const handleCreateCourse = () => {
    if (role === 'teacher') {
      setIsCourseRequestModalOpen(true);
    } else if (role === 'admin') {
      // Navigate to create course page
      console.log('Create course - admin');
    }
  };

  const handleCardPress = (courseInstance: CourseInstanceWithDetails) => {
    const enrollment = enrollments[courseInstance.id];
    
    if (role === 'student' && enrollment?.enrollmentStatus === ENROLLMENT_STATUSES.ELECTIVE_PENDING) {
      openElectiveSelector(courseInstance, enrollment);
    } else {
      // Navigate to course detail page for all other cases
      router.push(`/(tabs)/academics/${courseInstance.id}`);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <HStack className="justify-between items-center px-4 py-3">
          <VStack space="xs">
            <Text className="text-2xl font-bold text-black">Academics</Text>
            <Text className="text-sm text-gray-600">
              {role === 'student' && 'Your enrolled courses'}
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
            <Icon
              as={showSearch ? X : Search}
              size="lg"
              className="text-black"
            />
          </TouchableOpacity>
        </HStack>

        {/* Search Bar */}
        {showSearch && (
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
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon as={X} size="sm" className="text-gray-400" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Course List with Accordion */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text className="text-red-600 text-center">{error}</Text>
          </View>
        )}

        {!loading && semesterKeys.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text className="text-gray-500 text-center text-lg">
              {searchQuery ? 'No courses found' : 'No courses available'}
            </Text>
            <Text className="text-gray-400 text-center text-sm mt-2">
              {role === 'student' && "You haven't enrolled in any courses yet"}
              {role === 'teacher' && 'No courses assigned to you'}
              {role === 'parent' && 'No courses found for your child'}
              {role === 'admin' && 'Create your first course to get started'}
            </Text>
          </View>
        )}

        {/* Semester Groups */}
        {semesterKeys.map((semester) => {
          const semesterData = groupedCourses[semester];
          const isLocked = isSemesterLocked(semester);

          return (
            <SemesterGroup
              key={semester}
              semester={semester}
              courseCount={semesterData.courses.length}
              defaultExpanded={!isLocked && semester === userSemester}
              isLocked={isLocked}
            >
              <VStack space="md">
                {semesterData.courses.map((courseInstance) => {
                  const enrollment = semesterData.enrollments[courseInstance.id];
                  
                  return (
                    <CourseCard
                      key={courseInstance.id}
                      courseInstance={courseInstance}
                      role={role!}
                      enrollmentStatus={enrollment?.enrollmentStatus}
                      isLocked={isLocked}
                      onPress={() => handleCardPress(courseInstance)}
                    />
                  );
                })}
              </VStack>
            </SemesterGroup>
          );
        })}

        {/* Spacing at bottom */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB for Teachers and Admins */}
      {(role === 'teacher' || role === 'admin') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreateCourse}
          activeOpacity={0.8}
        >
          <Icon as={Plus} size="xl" className="text-white" />
        </TouchableOpacity>
      )}

      {/* Elective Selector Modal */}
      <ElectiveSelectorModal
        isOpen={isElectiveModalOpen}
        onClose={() => {
          setIsElectiveModalOpen(false);
          setSelectedPendingEnrollment(null);
          setSelectedElectiveGroup(null);
        }}
        onSelect={handleElectiveSelect}
        electiveGroup={selectedElectiveGroup}
        courses={electiveCourses}
        loading={loadingElectives}
        error={electiveError}
      />

      {/* Course Request Modal */}
      {role === 'teacher' && (
        <CourseRequestModal
          isOpen={isCourseRequestModalOpen}
          onClose={() => setIsCourseRequestModalOpen(false)}
          onSubmit={handleCourseRequestSubmit}
        />
      )}

      {/* Initial Loading */}
      {loading && semesterKeys.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7477FF" />
          <Text className="text-gray-600 mt-4">Loading courses...</Text>
        </View>
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
    borderRadius: 8,
    backgroundColor: '#F4F7F5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9F0EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#232323',
    fontFamily: 'System',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#FEF0EE',
    borderRadius: 8,
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7477FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#232323',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
});
