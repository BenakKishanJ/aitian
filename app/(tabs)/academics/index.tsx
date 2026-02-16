import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Animated,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Search,
  Plus,
  X,
  Layers,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Shield,
  Heart,
  User,
} from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import { useStudentCourses } from "@/lib/hooks/useStudentCourses";
import { useCoursesWithEnrollments } from "@/lib/hooks/useCoursesWithEnrollments";
import { useLinkedStudents } from "@/lib/hooks/useLinkedStudents";
import { StudentSelector } from "@/components/parent/StudentSelector";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { StudentCourseView, CourseInstanceWithDetails, ElectiveSlot, Course, EnrollmentStatus } from "@/types";
import { collection, query, where, getDocs, getDoc, doc, addDoc, updateDoc, Timestamp, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, ENROLLMENT_STATUSES } from "@/types/constants";

interface GroupedCourses {
  [semester: number]: StudentCourseView[];
}

const profileImages: Record<string, { male: any; female: any }> = {
  student: {
    male: require("@/assets/images/profile/student_male.png"),
    female: require("@/assets/images/profile/student_female.png"),
  },
  teacher: {
    male: require("@/assets/images/profile/teacher_male.png"),
    female: require("@/assets/images/profile/teacher_female.png"),
  },
  parent: {
    male: require("@/assets/images/profile/parent_male.png"),
    female: require("@/assets/images/profile/parent_female.png"),
  },
  admin: {
    male: require("@/assets/images/profile/admin_male.png"),
    female: require("@/assets/images/profile/admin_female.png"),
  },
};

const roleConfig: Record<string, {
  color: string;
  accentColor: string;
  icon: any;
  label: string;
  bgColor: string;
  lightBg: string;
  darkBorder: string;
}> = {
  student: {
    color: "#BCF3FF",
    accentColor: "#BCF3FF",
    icon: GraduationCap,
    label: "Student",
    bgColor: "#E5FBFF",
    lightBg: "rgba(188, 243, 255, 0.25)",
    darkBorder: "#7DD3E8",
  },
  teacher: {
    color: "#F96857",
    accentColor: "#F96857",
    icon: User,
    label: "Teacher",
    bgColor: "#FDE1DD",
    lightBg: "rgba(249, 104, 87, 0.25)",
    darkBorder: "#E54D3C",
  },
  parent: {
    color: "#F9CD61",
    accentColor: "#F9CD61",
    icon: Heart,
    label: "Parent",
    bgColor: "#FDF3D1",
    lightBg: "rgba(249, 205, 97, 0.25)",
    darkBorder: "#E5B84D",
  },
  admin: {
    color: "#7477FF",
    accentColor: "#7477FF",
    icon: Shield,
    label: "Admin",
    bgColor: "#E1E3FF",
    lightBg: "rgba(116, 119, 255, 0.25)",
    darkBorder: "#5A5DE8",
  },
};

export default function AcademicsScreen() {
  const { user, userData, role } = useAuth();
  const userSemester = userData?.role === 'student' ? userData.semester : null;
  const userDept = userData?.role === 'student' 
    ? (userData.departmentId || userData.department) 
    : null;
  const userSection = userData?.role === 'student' ? userData.section : null;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();
  const scrollY = new Animated.Value(0);
  const HEADER_MAX_HEIGHT = 280;
  const HEADER_MIN_HEIGHT = 100;
  const COLLAPSE_RANGE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, COLLAPSE_RANGE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: "clamp",
  });

  const imageScale = scrollY.interpolate({
    inputRange: [0, COLLAPSE_RANGE],
    outputRange: [1, 0.6],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, COLLAPSE_RANGE / 2, COLLAPSE_RANGE],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  const userRole = role || "student";
  const gender = userData?.gender || "male";
  const config = roleConfig[userRole] || roleConfig.student;

  const getProfileImage = () => {
    const roleImages = profileImages[userRole] || profileImages.student;
    return roleImages[gender] || roleImages.male;
  };

  const { courses: studentCourses, loading: studentLoading, error: studentError, refresh: refreshStudent } = useStudentCourses();
  const { courses: teacherCourses, loading: teacherLoading, error: teacherError, refresh: refreshTeacher } = useCoursesWithEnrollments({ searchQuery });
  const { students: linkedStudents, loading: linkedStudentsLoading, selectedStudent, setSelectedStudent, refresh: refreshLinkedStudents } = useLinkedStudents();

  const [parentCourses, setParentCourses] = useState<StudentCourseView[]>([]);
  const [parentCoursesLoading, setParentCoursesLoading] = useState(false);

  useEffect(() => {
    if (role !== 'parent' || !selectedStudent) {
      setParentCourses([]);
      return;
    }

    const fetchParentStudentCourses = async () => {
      setParentCoursesLoading(true);
      try {
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

          if (instanceData.courseId) {
            const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, instanceData.courseId));
            if (courseDoc.exists()) {
              instanceData.course = { id: courseDoc.id, ...courseDoc.data() } as Course;
            }
          }

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

  const isStudent = role === 'student';
  const isTeacher = role === 'teacher';
  const isParent = role === 'parent';

  // Course card colors - vibrant solid colors
  const courseCardColors = [
    { bg: '#BCF3FF', iconBg: '#232323', iconColor: '#BCF3FF', textColor: '#232323', subTextColor: '#232323' },
    { bg: '#F96857', iconBg: '#FFFFFF', iconColor: '#F96857', textColor: '#FFFFFF', subTextColor: '#FFE5E2' },
    { bg: '#F9CD61', iconBg: '#232323', iconColor: '#F9CD61', textColor: '#232323', subTextColor: '#232323' },
    { bg: '#7477FF', iconBg: '#FFFFFF', iconColor: '#7477FF', textColor: '#FFFFFF', subTextColor: '#E1E3FF' },
    { bg: '#C5D4CA', iconBg: '#232323', iconColor: '#C5D4CA', textColor: '#232323', subTextColor: '#232323' },
    { bg: '#FF6B9D', iconBg: '#FFFFFF', iconColor: '#FF6B9D', textColor: '#FFFFFF', subTextColor: '#FFE2EC' },
  ];

  const getCourseCardColor = (index: number) => courseCardColors[index % courseCardColors.length];

  const courses = useMemo(() => {
    if (isStudent) return studentCourses;
    else if (isTeacher) {
      return teacherCourses.map(tc => ({
        instance: tc,
        isElectiveSlot: tc.course?.courseType?.includes('elective') || false,
        selectionStatus: 'not_applicable' as const,
      }));
    } else if (isParent) return parentCourses;
    else return [];
  }, [isStudent, isTeacher, isParent, studentCourses, teacherCourses, parentCourses]);
  
  const loading = isStudent ? studentLoading : isParent ? (parentCoursesLoading || linkedStudentsLoading) : teacherLoading;
  const error = isStudent ? studentError : teacherError;
  const refresh = isStudent ? refreshStudent : isParent ? refreshLinkedStudents : refreshTeacher;

  const groupedCourses: GroupedCourses = useMemo(() => {
    const grouped: GroupedCourses = {};
    courses.forEach((courseView: StudentCourseView) => {
      const semester = courseView.instance.semester;
      if (!grouped[semester]) grouped[semester] = [];
      grouped[semester].push(courseView);
    });
    return grouped;
  }, [courses]);

  const semesterKeys = useMemo(() => {
    return Object.keys(groupedCourses).map(Number).sort((a, b) => b - a);
  }, [groupedCourses]);

  const isSemesterLocked = useCallback((semester: number): boolean => {
    if (role !== 'student' || !userSemester) return false;
    return semester > userSemester;
  }, [role, userSemester]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const filteredGroupedCourses = useMemo(() => {
    if (!searchQuery.trim()) return groupedCourses;
    const filtered: GroupedCourses = {};
    const queryLower = searchQuery.toLowerCase();
    
    Object.entries(groupedCourses).forEach(([semester, courseViews]) => {
      const filteredViews = courseViews.filter((cv: StudentCourseView) => {
        const courseName = cv.instance.course?.name?.toLowerCase() || '';
        const courseCode = cv.instance.course?.courseCode?.toLowerCase() || '';
        const section = cv.instance.section?.toLowerCase() || '';
        return courseName.includes(queryLower) || courseCode.includes(queryLower) || section.includes(queryLower);
      });
      if (filteredViews.length > 0) filtered[parseInt(semester)] = filteredViews;
    });
    return filtered;
  }, [groupedCourses, searchQuery]);

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-[#1C1C1E] items-center justify-center">
        <View className="w-16 h-16 rounded-full bg-[#2A2A2D] items-center justify-center">
          <View className="w-8 h-8 rounded-full border-2 border-[#BCF3FF] border-t-transparent animate-spin" />
        </View>
        <Text className="text-[#C5D4CA] mt-4 text-base">Loading courses...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#1C1C1E]">
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#BCF3FF"
            colors={["#BCF3FF"]}
          />
        }
      >
        {/* Animated Header with academics.png Illustration */}
        <Animated.View
          style={{
            height: headerHeight,
            backgroundColor: "#2A2A2D",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            minHeight: HEADER_MIN_HEIGHT,
          }}
        >
          <Animated.Image
            source={require("@/assets/images/academics.png")}
            style={{
              width: "100%",
              height: "100%",
              transform: [{ scale: imageScale }],
              opacity: headerOpacity,
            }}
            resizeMode="cover"
          />
          
          {/* Header Buttons */}
          <View className="absolute top-12 left-0 right-0 px-6 flex-row justify-between items-center">
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/profile")}
              className="w-12 h-12 rounded-full items-center justify-center overflow-hidden"
              style={{
                backgroundColor: config.lightBg,
                borderWidth: 2,
                borderColor: config.darkBorder,
              }}
            >
              <Image
                source={getProfileImage()}
                style={{ width: 36, height: 36 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setShowSearch(!showSearch)}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{
                backgroundColor: config.lightBg,
                borderWidth: 2,
                borderColor: config.darkBorder,
              }}
            >
              <Icon as={showSearch ? X : Search} size="md" style={{ color: config.darkBorder }} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Dark Content Card */}
        <View className="bg-[#1C1C1E] rounded-t-3xl -mt-6 px-6 pt-8 pb-6">
          {/* Greeting Section */}
          <View 
            className="rounded-2xl p-5 mb-6"
            style={{ backgroundColor: config.bgColor }}
          >
            <HStack className="items-center mb-2">
              <View 
                className="rounded-full px-3 py-1 mr-3"
                style={{ backgroundColor: config.accentColor }}
              >
                <HStack className="items-center" space="xs">
                  <Icon as={config.icon} size="2xs" className="text-[#232323]" />
                  <Text className="text-[#232323] text-xs font-bold">
                    {role === 'student' ? 'My Courses' : role === 'teacher' ? 'Teaching' : 'Academics'}
                  </Text>
                </HStack>
              </View>
              <Text className="text-[#232323]/70 text-sm">{courses.length} courses</Text>
            </HStack>
            
            <Text className="text-[#232323] text-2xl font-bold">
              {role === 'student' ? 'My Courses' : role === 'teacher' ? 'Courses I Teach' : 'Academic Portal'}
            </Text>
          </View>

          {/* Search Input */}
          {showSearch && (
            <View className="bg-[#2A2A2D] rounded-2xl px-4 py-3 mb-6 flex-row items-center">
              <Icon as={Search} size="sm" className="text-[#6B7280] mr-3" />
              <TextInput
                className="flex-1 text-white text-base"
                placeholder="Search courses..."
                placeholderTextColor="#6B7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon as={X} size="sm" className="text-[#6B7280]" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Parent Student Selector */}
          {isParent && (
            <View className="mb-6">
              <StudentSelector
                students={linkedStudents}
                selectedStudent={selectedStudent}
                onSelectStudent={setSelectedStudent}
                loading={linkedStudentsLoading}
              />
            </View>
          )}

          {/* Error State */}
          {error && (
            <View className="bg-[#F96857]/10 rounded-2xl p-6 mb-6 items-center">
              <Text className="text-[#C5D4CA] text-center mb-4">{error}</Text>
              <TouchableOpacity onPress={refresh} className="bg-[#BCF3FF] px-6 py-3 rounded-xl">
                <Text className="text-black font-semibold">Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Empty State */}
          {Object.keys(filteredGroupedCourses).length === 0 && !loading && !error && (
            <View className="bg-[#2A2A2D] rounded-2xl p-8 items-center">
              <Icon as={Layers} size="xl" className="text-[#3C443F] mb-4" />
              <Text className="text-white text-lg font-semibold text-center mb-2">
                {searchQuery ? 'No courses found' : 'No courses yet'}
              </Text>
              <Text className="text-[#6B7280] text-sm text-center">
                {searchQuery 
                  ? 'Try a different search term'
                  : role === 'student' 
                    ? 'Your courses will appear here once admin creates them'
                    : role === 'teacher'
                    ? 'Your assigned courses will appear here'
                    : 'No courses available'
                }
              </Text>
            </View>
          )}

          {/* Course List by Semester */}
          <VStack space="md">
            {semesterKeys.map((semester) => {
              const semesterCourses = filteredGroupedCourses[semester];
              const locked = isSemesterLocked(semester);

              return (
                <View key={semester} className="bg-[#2A2A2D] rounded-2xl overflow-hidden">
                  {/* Semester Header */}
                  <View
                    className="px-5 py-4 border-b border-[#3C443F]"
                    style={{ backgroundColor: locked ? '#1C1C1E' : 'transparent' }}
                  >
                    <HStack className="justify-between items-center">
                      <Text className="text-white text-lg font-bold">
                        Semester {semester}
                      </Text>
                      <View className="bg-[#1C1C1E] px-3 py-1 rounded-full">
                        <Text className="text-[#C5D4CA] text-sm">
                          {semesterCourses.length} courses
                        </Text>
                      </View>
                    </HStack>
                    {locked && (
                      <Text className="text-[#6B7280] text-xs mt-1">
                        Locked - Complete previous semester first
                      </Text>
                    )}
                  </View>

                  {/* Course Cards - Colorful Solid Cards */}
                  <VStack space="sm" className="p-4">
                    {semesterCourses.map((courseView: StudentCourseView, index: number) => {
                      const isElective = courseView.isElectiveSlot;
                      const course = courseView.instance.course;
                      const colors = getCourseCardColor(index);

                      return (
                        <TouchableOpacity
                          key={courseView.instance.id}
                          onPress={() => router.push(`/(tabs)/academics/${courseView.instance.id}` as any)}
                          className="rounded-2xl p-4"
                          style={{
                            backgroundColor: colors.bg,
                            marginBottom: index !== semesterCourses.length - 1 ? 12 : 0,
                          }}
                        >
                          <HStack className="items-center" space="md">
                            <View
                              className="w-12 h-12 rounded-xl items-center justify-center"
                              style={{ backgroundColor: colors.iconBg }}
                            >
                              <Icon
                                as={BookOpen}
                                size="md"
                                style={{ color: colors.iconColor }}
                              />
                            </View>
                            <VStack className="flex-1">
                              <Text
                                className="font-semibold text-base"
                                numberOfLines={1}
                                style={{ color: colors.textColor }}
                              >
                                {course?.name || 'Unknown Course'}
                              </Text>
                              <Text style={{ color: colors.subTextColor }} className="text-sm">
                                {course?.courseCode} • Section {courseView.instance.section}
                              </Text>
                              {courseView.instance.teacherNames && (
                                <Text style={{ color: colors.subTextColor }} className="text-xs mt-1">
                                  {courseView.instance.teacherNames.join(', ')}
                                </Text>
                              )}
                            </VStack>
                            {/* White rounded square with black arrow */}
                            <View className="w-8 h-8 rounded-lg bg-white items-center justify-center">
                              <Icon as={ChevronRight} size="sm" className="text-[#232323]" />
                            </View>
                          </HStack>
                          {isElective && (
                            <View className="mt-2 bg-[#232323] self-start px-3 py-1 rounded-lg">
                              <Text className="text-white text-xs font-bold">ELECTIVE</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </VStack>
                </View>
              );
            })}
          </VStack>

          {/* Bottom Padding */}
          <View className="h-24" />
        </View>
      </Animated.ScrollView>
    </View>
  );
}
