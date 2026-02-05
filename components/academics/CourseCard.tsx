import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { BookOpen, Users, Calendar, TrendingUp } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Icon } from "@/components/ui/icon";
import type { CourseInstanceWithDetails } from "@/types";

interface CourseCardProps {
  courseInstance: CourseInstanceWithDetails;
  role: "student" | "teacher" | "parent" | "admin";
}

export function CourseCard({ courseInstance, role }: CourseCardProps) {
  const { course, section, teacherNames, attendancePercentage, totalStudents } =
    courseInstance;

  const handlePress = () => {
    router.push(`/(tabs)/academics/${courseInstance.id}`);
  };

  const getAttendanceColor = (percentage?: number) => {
    if (!percentage) return "#9CA3AF";
    if (percentage >= 75) return "#10B981";
    if (percentage >= 60) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={styles.card}
    >
      <VStack space="md">
        {/* Header */}
        <View>
          <Text className="text-lg font-bold text-black">
            {course?.name || "Loading..."}
          </Text>
          <HStack space="sm" className="mt-1">
            <Text className="text-sm text-gray-500 font-medium">
              {course?.courseCode || ""}
            </Text>
            <Text className="text-sm text-gray-400">•</Text>
            <Text className="text-sm text-gray-500">Section {section}</Text>
          </HStack>
        </View>

        {/* Stats Row */}
        <HStack space="lg" className="flex-wrap">
          {/* Credits */}
          <HStack space="xs" className="items-center">
            <Icon as={BookOpen} size="sm" className="text-gray-600" />
            <Text className="text-sm text-gray-700">
              {course?.credits || 0} Credits
            </Text>
          </HStack>

          {/* Teacher Names (for students) or Total Students (for teachers) */}
          {role === "student" || role === "parent" ? (
            teacherNames && teacherNames.length > 0 && (
              <HStack space="xs" className="items-center flex-1">
                <Icon as={Users} size="sm" className="text-gray-600" />
                <Text className="text-sm text-gray-700 flex-1" numberOfLines={1}>
                  {teacherNames.join(", ")}
                </Text>
              </HStack>
            )
          ) : (
            <HStack space="xs" className="items-center">
              <Icon as={Users} size="sm" className="text-gray-600" />
              <Text className="text-sm text-gray-700">
                {totalStudents || 0} Students
              </Text>
            </HStack>
          )}
        </HStack>

        {/* Bottom Row */}
        <HStack className="justify-between items-center pt-2 border-t border-gray-200">
          {/* Semester */}
          <HStack space="xs" className="items-center">
            <Icon as={Calendar} size="sm" className="text-gray-600" />
            <Text className="text-sm text-gray-700">
              Semester {courseInstance.semester}
            </Text>
          </HStack>

          {/* Attendance (for students only) */}
          {(role === "student" || role === "parent") &&
            attendancePercentage !== undefined && (
              <HStack space="xs" className="items-center">
                <Icon
                  as={TrendingUp}
                  size="sm"
                  style={{ color: getAttendanceColor(attendancePercentage) }}
                />
                <Text
                  className="text-sm font-semibold"
                  style={{ color: getAttendanceColor(attendancePercentage) }}
                >
                  {attendancePercentage.toFixed(1)}%
                </Text>
              </HStack>
            )}

          {/* Course Type Badge */}
          {course?.isElective && (
            <View
              style={{
                backgroundColor: "#DBEAFE",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
              }}
            >
              <Text className="text-xs font-semibold text-blue-600">
                Elective
              </Text>
            </View>
          )}
        </HStack>
      </VStack>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
});
