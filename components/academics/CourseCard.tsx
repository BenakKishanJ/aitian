import React from 'react';
import { TouchableOpacity, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, Users, TrendingUp, Lock, AlertCircle, ChevronRight } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Icon } from '@/components/ui/icon';
import { CourseInstanceWithDetails, EnrollmentStatus } from '@/types';

interface CourseCardProps {
  courseInstance: CourseInstanceWithDetails;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  enrollmentStatus?: EnrollmentStatus;
  isLocked?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  cardColor?: { bg: string; iconBg: string; iconColor: string; textColor: string; subTextColor: string };
  useDarkTheme?: boolean;
}

export function CourseCard({
  courseInstance,
  role,
  enrollmentStatus,
  isLocked = false,
  onPress,
  onLongPress,
  cardColor,
  useDarkTheme = false,
}: CourseCardProps) {
  const router = useRouter();
  const { course, section, teacherNames, attendancePercentage, totalStudents } =
    courseInstance;

  const handlePress = () => {
    if (isLocked) return;

    if (onPress) {
      onPress();
    } else {
      const isVirtualInstance = courseInstance.id.startsWith('slot-') || 
                                courseInstance.id.startsWith('selection-');
      
      if (isVirtualInstance) {
        if (!onPress) {
          Alert.alert(
            'Elective Selection',
            'Please select an elective course from the available options.',
            [{ text: 'OK' }]
          );
        }
      } else {
        router.push({
          pathname: '/academics/[courseInstanceId]',
          params: { courseInstanceId: courseInstance.id }
        } as any);
      }
    }
  };

  const handleLongPress = () => {
    if (isLocked) return;
    if (onLongPress) {
      onLongPress();
    }
  };

  const getAttendanceColor = (percentage?: number): string => {
    if (!percentage) return '#77867D';
    if (percentage >= 75) return '#5AA578';
    if (percentage >= 60) return '#F9CD61';
    return '#F96857';
  };

  const isElectivePending = enrollmentStatus === 'elective-pending';
  const isElectiveEnrolled = enrollmentStatus === 'elective-enrolled';
  const isElectiveCourse = course?.courseType?.includes('elective') || course?.isElective;
  const showElectiveBadge = isElectiveCourse && role === 'student';

  const getCardBorderStyle = () => {
    if (isLocked) {
      return {
        borderWidth: 1,
        borderColor: '#3C443F',
        borderStyle: 'solid' as const,
        opacity: 0.6,
      };
    }
    if (isElectivePending) {
      return {
        borderWidth: 2,
        borderColor: '#7477FF',
        borderStyle: 'dashed' as const,
        borderRadius: 16,
      };
    }
    return {
      borderWidth: 0,
    };
  };

  const borderStyle = getCardBorderStyle();

  // Dark theme card (colorful)
  if (useDarkTheme && cardColor) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={500}
        activeOpacity={isLocked ? 1 : 0.7}
        disabled={isLocked}
        style={[{
          backgroundColor: cardColor.bg,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
        }, borderStyle]}
      >
        {/* Elective Pending Indicator */}
        {isElectivePending && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginBottom: 12,
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor: '#232323',
            borderRadius: 6,
            alignSelf: 'flex-start',
          }}>
            <AlertCircle size={14} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
              Select your elective course
            </Text>
          </View>
        )}

        <HStack className="items-center" space="md">
          {/* Icon */}
          <View
            className="w-12 h-12 rounded-xl items-center justify-center"
            style={{ backgroundColor: cardColor.iconBg }}
          >
            <Icon as={BookOpen} size="md" style={{ color: cardColor.iconColor }} />
          </View>

          {/* Content */}
          <VStack className="flex-1">
            <HStack space="sm" className="items-center">
              <Text
                className="text-xs font-bold px-2 py-1 rounded"
                style={{ backgroundColor: cardColor.iconBg, color: cardColor.iconColor }}
              >
                {course?.courseCode || 'N/A'}
              </Text>
              {showElectiveBadge && (
                <Text
                  className="text-xs font-bold px-2 py-1 rounded"
                  style={{ backgroundColor: '#232323', color: '#FFFFFF' }}
                >
                  {isElectivePending ? 'Elective (Pending)' : 'Elective'}
                </Text>
              )}
            </HStack>
            <Text
              className="text-base font-semibold mt-1"
              style={{ color: cardColor.textColor }}
              numberOfLines={1}
            >
              {course?.name || 'Loading...'}
            </Text>
            <Text style={{ color: cardColor.subTextColor }} className="text-sm">
              Section {section || 'N/A'} • {course?.credits || 0} credits
            </Text>
            {teacherNames && teacherNames.length > 0 && (
              <Text style={{ color: cardColor.subTextColor }} className="text-xs mt-1">
                {teacherNames.join(', ')}
              </Text>
            )}
          </VStack>

          {/* Arrow button */}
          {!isLocked && (
            <View className="w-8 h-8 rounded-lg bg-white items-center justify-center">
              <Icon as={ChevronRight} size="sm" className="text-[#232323]" />
            </View>
          )}
          {isLocked && (
            <View className="w-8 h-8 rounded-lg bg-[#3C443F] items-center justify-center">
              <Lock size={16} color="#6B7280" />
            </View>
          )}
        </HStack>
      </TouchableOpacity>
    );
  }

  // Light theme card (original)
  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={500}
      activeOpacity={isLocked ? 1 : 0.7}
      disabled={isLocked}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#232323',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
        ...borderStyle,
      }}
    >
      {/* Elective Pending Indicator */}
      {isElectivePending && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: 12,
          paddingHorizontal: 10,
          paddingVertical: 6,
          backgroundColor: '#F0F1FF',
          borderRadius: 6,
          alignSelf: 'flex-start',
        }}>
          <AlertCircle size={14} color="#7477FF" />
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#7477FF' }}>
            Select your elective course
          </Text>
        </View>
      )}

      <VStack space="md">
        {/* Header with Course Code Badge */}
        <HStack className="items-start justify-between">
          <VStack className="flex-1" space="xs">
            <HStack space="sm" className="items-center">
              <View className="bg-purple-50 px-2 py-1 rounded border border-purple-200">
                <Text className="text-xs font-semibold text-purple-600">
                  {course?.courseCode || 'N/A'}
                </Text>
              </View>
              {showElectiveBadge && (
                <View className={`px-2 py-1 rounded border ${
                  isElectivePending
                    ? 'bg-yellow-50 border-yellow-300'
                    : 'bg-cyan-50 border-cyan-200'
                }`}>
                  <Text
                    className={`text-xs font-semibold ${
                      isElectivePending ? 'text-yellow-700' : 'text-cyan-700'
                    }`}
                  >
                    {isElectivePending ? 'Elective (Pending)' : 'Elective'}
                  </Text>
                </View>
              )}
            </HStack>
            <Text className="text-lg font-bold text-black leading-tight">
              {course?.name || 'Loading...'}
            </Text>
          </VStack>

          {/* Credits Badge */}
          <View style={{ backgroundColor: '#F0F1FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' }}>
            <Text className="text-xs font-bold text-purple-600">
              {course?.credits || 0}
            </Text>
            <Text className="text-[10px] text-purple-500">credits</Text>
          </View>
        </HStack>

        {/* Section & Teachers */}
        <HStack space="lg" className="flex-wrap items-center">
          <View style={{ backgroundColor: '#F4F7F5', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text className="text-xs font-medium text-gray-600">
              Section {section || 'N/A'}
            </Text>
          </View>

          {role === 'student' || role === 'parent' ? (
            teacherNames && teacherNames.length > 0 && (
              <HStack space="xs" className="items-center flex-1">
                <Users size={14} color="#77867D" />
                <Text className="text-sm text-gray-600 flex-1" numberOfLines={1}>
                  {teacherNames.join(', ')}
                </Text>
              </HStack>
            )
          ) : (
            <HStack space="xs" className="items-center">
              <Users size={14} color="#77867D" />
              <Text className="text-sm text-gray-600">
                {totalStudents || 0} Students
              </Text>
            </HStack>
          )}
        </HStack>

        {/* Bottom Row with Stats */}
        <HStack className="justify-between items-center pt-2 border-t border-gray-100">
          <HStack space="md">
            {(role === 'student' || role === 'parent') &&
              attendancePercentage !== undefined && (
                <HStack space="xs" className="items-center">
                  <TrendingUp
                    size={16}
                    color={getAttendanceColor(attendancePercentage)}
                  />
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: getAttendanceColor(attendancePercentage) }}
                  >
                    {attendancePercentage.toFixed(0)}%
                  </Text>
                  <Text className="text-xs text-gray-400">attendance</Text>
                </HStack>
              )}
          </HStack>

          {/* Action Indicator */}
          {isLocked ? (
            <HStack space="xs" className="items-center">
              <Lock size={14} color="#77867D" />
              <Text className="text-xs text-gray-500">Locked</Text>
            </HStack>
          ) : isElectivePending ? (
            <HStack space="xs" className="items-center">
              <Text className="text-xs font-semibold text-purple-600">
                Select Course
              </Text>
              <ChevronRight size={16} color="#7477FF" />
            </HStack>
          ) : (
            <ChevronRight size={20} color="#C5D4CA" />
          )}
        </HStack>
      </VStack>
    </TouchableOpacity>
  );
}

export default CourseCard;
