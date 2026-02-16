import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  TextInput,
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
import { Icon } from '@/components/ui/icon';
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

const cardColors = [
  { bg: '#2A2A2D', iconBg: 'rgba(188, 243, 255, 0.15)', iconColor: '#BCF3FF', textColor: '#FFFFFF', subTextColor: '#C5D4CA' },
  { bg: '#2A2A2D', iconBg: 'rgba(249, 104, 87, 0.15)', iconColor: '#F96857', textColor: '#FFFFFF', subTextColor: '#C5D4CA' },
  { bg: '#2A2A2D', iconBg: 'rgba(249, 205, 97, 0.15)', iconColor: '#F9CD61', textColor: '#FFFFFF', subTextColor: '#C5D4CA' },
  { bg: '#2A2A2D', iconBg: 'rgba(116, 119, 255, 0.15)', iconColor: '#7477FF', textColor: '#FFFFFF', subTextColor: '#C5D4CA' },
];

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

      if (instancesSnap.docs.length > 0) {
        setLastDoc(instancesSnap.docs[instancesSnap.docs.length - 1]);
      }
      setHasMore(instancesSnap.docs.length === pageSize);

      for (const instance of courseInstances) {
        const enrollmentsRef = collection(db, COLLECTIONS.ENROLLMENTS);
        const enrollmentsQuery = query(
          enrollmentsRef,
          where('courseInstanceId', '==', instance.id)
        );
        const enrollmentsSnap = await getDocs(enrollmentsQuery);
        instance.totalStudents = enrollmentsSnap.size;
      }

      for (const instance of courseInstances) {
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

      if (searchQuery && searchQuery.trim()) {
        const queryText = searchQuery.toLowerCase();
        courseInstances = courseInstances.filter(
          (instance) =>
            instance.course?.name?.toLowerCase().includes(queryText) ||
            instance.course?.courseCode?.toLowerCase().includes(queryText) ||
            instance.section?.toLowerCase().includes(queryText) ||
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

  useEffect(() => {
    setLastDoc(null);
    setHasMore(true);
    fetchCourses(false);
  }, [selectedDepartment, user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLastDoc(null);
      setHasMore(true);
      fetchCourses(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const semesterKeys = useMemo(() => {
    return Object.keys(groupedCourses)
      .map(Number)
      .sort((a, b) => b - a);
  }, [groupedCourses]);

  const getCardColor = (index: number) => {
    return cardColors[index % cardColors.length];
  };

  return (
    <SafeAreaView className="flex-1 bg-[#1C1C1E]">
      {/* Header */}
      <View className="px-6 pt-4 pb-4">
        <HStack className="justify-between items-center">
          <VStack space="xs">
            <Text className="text-white text-2xl font-bold">Academics</Text>
            <Text className="text-[#C5D4CA] text-sm">
              Manage all courses across departments
            </Text>
          </VStack>

          <TouchableOpacity
            className="w-10 h-10 rounded-xl bg-[#2A2A2D] items-center justify-center"
            onPress={() => setShowSearch(!showSearch)}
          >
            <Icon as={showSearch ? X : Search} size="sm" className="text-white" />
          </TouchableOpacity>
        </HStack>

        {/* Search Bar */}
        {showSearch && (
          <View className="flex-row items-center bg-[#2A2A2D] mt-4 px-4 py-3 rounded-xl border border-[#3C443F]">
            <Icon as={Search} size="sm" className="text-[#6B7280] mr-3" />
            <TextInput
              className="flex-1 text-white text-base"
              placeholder="Search courses by name, code, or section..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#6B7280"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon as={X} size="sm" className="text-[#6B7280]" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Department Filter */}
        <View className="mt-4">
          <Select
            selectedValue={selectedDepartment}
            onValueChange={(value) => setSelectedDepartment(value as DepartmentId | 'all')}
          >
            <SelectTrigger className="w-full bg-[#2A2A2D] border-[#3C443F] rounded-xl">
              <HStack space="sm" className="items-center flex-1">
                <Icon as={Building2} size="sm" className="text-[#7477FF]" />
                <SelectInput
                  placeholder="Filter by Department"
                  className="text-white flex-1"
                  placeholderTextColor="#6B7280"
                />
              </HStack>
              <SelectIcon className="mr-3" />
            </SelectTrigger>
            <SelectPortal>
              <SelectBackdrop />
              <SelectContent className="bg-[#2A2A2D]">
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
      <View className="px-6 py-3 bg-[#2A2A2D] border-b border-[#3C443F]">
        <HStack className="justify-between items-center">
          <Text className="text-sm text-[#C5D4CA]">
            <Text className="font-semibold text-white">{courses.length}</Text> courses
          </Text>
          <Text className="text-sm text-[#C5D4CA]">
            <Text className="font-semibold text-white">{semesterKeys.length}</Text> semesters
          </Text>
          {selectedDepartment !== 'all' && (
            <Text className="text-sm text-[#BCF3FF]">
              {getDepartmentNameById(selectedDepartment)}
            </Text>
          )}
        </HStack>
      </View>

      {/* Course List */}
      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="pb-24 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#BCF3FF"
            colors={["#BCF3FF"]}
          />
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
          <View className="bg-[#F96857]/10 border border-[#F96857]/30 rounded-2xl p-4 mb-4">
            <Text className="text-[#F96857] text-center">{error}</Text>
          </View>
        )}

        {!loading && semesterKeys.length === 0 && (
          <View className="items-center justify-center py-16">
            <View className="w-20 h-20 rounded-full bg-[#2A2A2D] items-center justify-center mb-4">
              <Icon as={Search} size="xl" className="text-[#3C443F]" />
            </View>
            <Text className="text-white text-lg font-semibold mb-2">No Courses Found</Text>
            <Text className="text-[#6B7280] text-sm text-center">
              {searchQuery
                ? 'No courses match your search criteria'
                : selectedDepartment !== 'all'
                ? `No courses available for ${getDepartmentNameById(selectedDepartment)}`
                : 'No courses available'}
            </Text>
          </View>
        )}

        {/* Semester Groups */}
        {semesterKeys.map((semester, semIndex) => {
          const semesterCourses = groupedCourses[semester];

          return (
            <SemesterGroup
              key={semester}
              semester={semester}
              courseCount={semesterCourses.length}
              defaultExpanded={semester === semesterKeys[0]}
            >
              <VStack space="md">
                {semesterCourses.map((courseInstance, courseIndex) => (
                  <CourseCard
                    key={courseInstance.id}
                    courseInstance={courseInstance}
                    role="admin"
                    useDarkTheme={true}
                    cardColor={getCardColor(semIndex * 10 + courseIndex)}
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
          <View className="flex-row items-center justify-center py-6 gap-2">
            <ActivityIndicator size="small" color="#BCF3FF" />
            <Text className="text-[#6B7280] text-sm">Loading more courses...</Text>
          </View>
        )}

        {/* End Message */}
        {!loading && courses.length > 0 && !hasMore && (
          <View className="py-6">
            <Text className="text-[#6B7280] text-center text-sm">
              No more courses to load
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        className="absolute right-6 bottom-24 w-14 h-14 rounded-full bg-[#BCF3FF] items-center justify-center"
        style={{
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        }}
        onPress={() => {
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
        <Icon as={Plus} size="lg" className="text-[#232323]" />
      </TouchableOpacity>

      {/* Initial Loading */}
      {loading && courses.length === 0 && (
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-[#1C1C1E] items-center justify-center">
          <ActivityIndicator size="large" color="#BCF3FF" />
          <Text className="text-[#C5D4CA] mt-4">Loading courses...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
