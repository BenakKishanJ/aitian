import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Plus, X, Building2 } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { useAuth } from '@/lib/AuthContext';
import { CourseCard } from '@/components/academics/CourseCard';
import { SemesterGroup } from '@/components/academics/SemesterGroup';
import { Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectItem } from '@/components/ui/select';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit, startAfter, DocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course, CourseInstance, CourseInstanceWithDetails, DepartmentId } from '@/types';
import { DEPARTMENTS, COLLECTIONS } from '@/types/constants';
import { getDepartmentNameById } from '@/types/constants';

interface GroupedCourses {
  [semester: number]: CourseInstanceWithDetails[];
}

export default function AdminAcademicsScreen() {
  const { user, userData, role } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentId | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState<CourseInstanceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);

  const pageSize = 50;

  // Fetch courses based on filters
  const fetchCourses = async (loadMore = false, refresh = false) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const instancesRef = collection(db, COLLECTIONS.COURSE_INSTANCES);
      let instancesQuery = query(
        instancesRef,
        where('isActive', '==', true),
        orderBy('semester', 'desc'),
        orderBy('section'),
        limit(pageSize)
      );

      // Filter by department if selected
      if (selectedDepartment !== 'all') {
        instancesQuery = query(
          instancesRef,
          where('departmentId', '==', selectedDepartment),
          where('isActive', '==', true),
          orderBy('semester', 'desc'),
          orderBy('section'),
          limit(pageSize)
        );
      }

      // Handle pagination
      if (loadMore && lastDoc) {
        instancesQuery = query(
          instancesRef,
          where('isActive', '==', true),
          orderBy('semester', 'desc'),
          orderBy('section'),
          startAfter(lastDoc),
          limit(pageSize)
        );

        if (selectedDepartment !== 'all') {
          instancesQuery = query(
            instancesRef,
            where('departmentId', '==', selectedDepartment),
            where('isActive', '==', true),
            orderBy('semester', 'desc'),
            orderBy('section'),
            startAfter(lastDoc),
            limit(pageSize)
          );
        }
      }

      const instancesSnap = await getDocs(instancesQuery);
      let courseInstances = instancesSnap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as CourseInstanceWithDetails
      );

      // Update pagination state
      if (instancesSnap.docs.length > 0) {
        setLastDoc(instancesSnap.docs[instancesSnap.docs.length - 1]);
      }
      setHasMore(instancesSnap.docs.length === pageSize);

      // Get total students for each course
      for (const instance of courseInstances) {
        const enrollmentsRef = collection(db, COLLECTIONS.ENROLLMENTS);
        const enrollmentsQuery = query(
          enrollmentsRef,
          where('courseInstanceId', '==', instance.id)
        );
        const enrollmentsSnap = await getDocs(enrollmentsQuery);
        instance.totalStudents = enrollmentsSnap.size;
      }

      // Fetch course details for all instances
      for (const instance of courseInstances) {
        // Check if courseId exists before fetching
        if (instance.courseId) {
          try {
            const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, instance.courseId));
            if (courseDoc.exists()) {
              instance.course = { id: courseDoc.id, ...courseDoc.data() } as Course;
            }
          } catch (err) {
            console.error('Error fetching course details:', err);
          }
        }

        // Fetch teacher names
        if (instance.teacherIds && instance.teacherIds.length > 0) {
          const teacherNames: string[] = [];
          for (const teacherId of instance.teacherIds) {
            try {
              const teacherDoc = await getDoc(doc(db, COLLECTIONS.USERS, teacherId));
              if (teacherDoc.exists()) {
                teacherNames.push(teacherDoc.data().name || 'Unknown');
              }
            } catch (err) {
              console.error('Error fetching teacher:', err);
            }
          }
          instance.teacherNames = teacherNames;
        }
      }

      // Apply search filter if provided
      if (searchQuery && searchQuery.trim()) {
        const queryText = searchQuery.toLowerCase();
        courseInstances = courseInstances.filter(
          (instance) =>
            instance.course?.name.toLowerCase().includes(queryText) ||
            instance.course?.courseCode.toLowerCase().includes(queryText) ||
            instance.section.toLowerCase().includes(queryText) ||
            getDepartmentNameById(instance.departmentId).toLowerCase().includes(queryText)
        );
      }

      if (loadMore) {
        setCourses((prev) => [...prev, ...courseInstances]);
      } else {
        setCourses(courseInstances);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching courses:', err);
      setError(err.message || 'Failed to fetch courses');
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setLastDoc(null);
    setHasMore(true);
    await fetchCourses(false, true);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchCourses(true);
    }
  };

  // Fetch courses when department changes
  useEffect(() => {
    setLastDoc(null);
    setHasMore(true);
    fetchCourses(false);
  }, [selectedDepartment, user]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setLastDoc(null);
      setHasMore(true);
      fetchCourses(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Group courses by semester (high to low)
  const groupedCourses: GroupedCourses = useMemo(() => {
    const grouped: GroupedCourses = {};
    
    courses.forEach((course) => {
      const semester = course.semester;
      if (!grouped[semester]) {
        grouped[semester] = [];
      }
      grouped[semester].push(course);
    });

    return grouped;
  }, [courses]);

  // Get sorted semester keys (descending)
  const semesterKeys = useMemo(() => {
    return Object.keys(groupedCourses)
      .map(Number)
      .sort((a, b) => b - a);
  }, [groupedCourses]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <HStack className="justify-between items-center px-4 py-3">
          <VStack space="xs">
            <Text className="text-2xl font-bold text-black">Academics</Text>
            <Text className="text-sm text-gray-600">
              Manage all courses across departments
            </Text>
          </VStack>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            {showSearch ? (
              <X size={20} color="#232323" />
            ) : (
              <Search size={20} color="#232323" />
            )}
          </TouchableOpacity>
        </HStack>

        {/* Search Bar */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <Search size={16} color="#77867D" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search courses by name, code, or section..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#77867D"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#77867D" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Department Filter */}
        <View className="px-4 pb-4">
          <Select
            selectedValue={selectedDepartment}
            onValueChange={(value) => setSelectedDepartment(value as DepartmentId | 'all')}
          >
            <SelectTrigger className="w-full bg-white border-gray-200">
              <HStack space="sm" className="items-center flex-1">
                <Building2 size={18} color="#7477FF" />
                <SelectInput
                  placeholder="Filter by Department"
                  className="flex-1"
                />
              </HStack>
              <SelectIcon className="mr-3" />
            </SelectTrigger>
            <SelectPortal>
              <SelectBackdrop />
              <SelectContent>
                <SelectDragIndicatorWrapper>
                  <SelectDragIndicator />
                </SelectDragIndicatorWrapper>
                <SelectItem label="All Departments" value="all" />
                {DEPARTMENTS.map((dept) => (
                  <SelectItem
                    key={dept.id}
                    label={dept.name}
                    value={dept.id}
                  />
                ))}
              </SelectContent>
            </SelectPortal>
          </Select>
        </View>
      </View>

      {/* Stats Summary */}
      <View className="px-4 py-3 bg-purple-50 border-b border-purple-100">
        <HStack className="justify-between items-center">
          <Text className="text-sm text-purple-700">
            <Text className="font-semibold">{courses.length}</Text> courses
          </Text>
          <Text className="text-sm text-purple-700">
            <Text className="font-semibold">{semesterKeys.length}</Text> semesters
          </Text>
          {selectedDepartment !== 'all' && (
            <Text className="text-sm text-purple-700">
              {getDepartmentNameById(selectedDepartment)}
            </Text>
          )}
        </HStack>
      </View>

      {/* Course List with Accordion */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 50;
          if (isCloseToBottom && hasMore && !loading) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text className="text-red-600 text-center">{error}</Text>
          </View>
        )}

        {!loading && semesterKeys.length === 0 && (
          <View style={styles.emptyState}>
            <Search size={48} color="#C5D4CA" />
            <Text style={styles.emptyStateTitle}>No Courses Found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? 'No courses match your search criteria'
                : selectedDepartment !== 'all'
                ? `No courses available for ${getDepartmentNameById(selectedDepartment)}`
                : 'No courses available'}
            </Text>
          </View>
        )}

        {/* Semester Groups */}
        {semesterKeys.map((semester) => {
          const semesterCourses = groupedCourses[semester];

          return (
            <SemesterGroup
              key={semester}
              semester={semester}
              courseCount={semesterCourses.length}
              defaultExpanded={semester === semesterKeys[0]}
            >
              <VStack space="md">
                {semesterCourses.map((courseInstance) => (
                  <CourseCard
                    key={courseInstance.id}
                    courseInstance={courseInstance}
                    role="admin"
                    onPress={() => {
                      router.push(`/admin/courses/${courseInstance.id}` as any);
                    }}
                    onLongPress={() => {
                      Alert.alert(
                        'Course Options',
                        `${courseInstance.course?.name || 'Course'}`,
                        [
                          {
                            text: 'Edit Course',
                            onPress: () => {
                              if (courseInstance.course?.id) {
                                router.push(`/admin/courses/edit?courseId=${courseInstance.course.id}`);
                              }
                            },
                          },
                          {
                            text: 'View Details',
                            onPress: () => {
                              router.push(`/admin/courses/${courseInstance.id}` as any);
                            },
                          },
                          {
                            text: 'Cancel',
                            style: 'cancel',
                          },
                        ]
                      );
                    }}
                  />
                ))}
              </VStack>
            </SemesterGroup>
          );
        })}

        {/* Loading More */}
        {loading && courses.length > 0 && (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color="#7477FF" />
            <Text style={styles.loadingText}>Loading more courses...</Text>
          </View>
        )}

        {/* End Message */}
        {!loading && courses.length > 0 && !hasMore && (
          <View style={styles.endMessage}>
            <Text className="text-gray-400 text-center text-sm">
              No more courses to load
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          // Show options to create course or assign course
          Alert.alert(
            'Create New',
            'What would you like to create?',
            [
              {
                text: 'New Course',
                onPress: () => router.push('/admin/courses/create'),
              },
              {
                text: 'Assign Course',
                onPress: () => router.push('/admin/courses/create-instance'),
              },
              {
                text: 'Cancel',
                style: 'cancel',
              },
            ]
          );
        }}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Initial Loading */}
      {loading && courses.length === 0 && (
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#77867D',
  },
  endMessage: {
    paddingVertical: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7477FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#232323',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
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
});
