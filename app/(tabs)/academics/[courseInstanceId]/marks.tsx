import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Award, TrendingUp, Edit, Users } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/lib/AuthContext";
import { useMarks } from "@/lib/hooks/useMarks";
import { getGradeColor } from "@/lib/gradingUtils";

export default function MarksScreen() {
  const { courseInstanceId } = useLocalSearchParams<{
    courseInstanceId: string;
  }>();
  const { role, user } = useAuth();
  const { marks, allMarks, classStats, loading, error, refresh } = useMarks(
    courseInstanceId as string
  );

  const canEdit = role === "teacher" || role === "admin";

  const getPercentage = (obtained: number, max: number) => {
    if (max === 0) return "0.0";
    return ((obtained / max) * 100).toFixed(1);
  };

  const renderStudentView = () => {
    if (!marks) {
      return (
        <View style={styles.emptyState}>
          <Icon as={Award} size="xl" className="text-gray-300" />
          <Text className="text-gray-500 text-lg mt-4">No marks available yet</Text>
          <Text className="text-gray-400 text-sm mt-2">
            Marks will appear here once they are published by your teacher
          </Text>
        </View>
      );
    }

    const gradingConfig = marks.gradingConfig;

    return (
      <>
        {/* Grade Card */}
        <View style={styles.gradeCard}>
          <VStack space="lg" className="items-center">
            <View style={styles.gradeBadge}>
              <Icon as={Award} size="xl" className="text-white" />
            </View>
            <VStack space="xs" className="items-center">
              <Text
                className="text-6xl font-bold"
                style={{ color: getGradeColor(marks.grade) }}
              >
                {marks.grade}
              </Text>
              <Text className="text-gray-500 text-lg">Your Grade</Text>
            </VStack>
            <VStack space="xs" className="items-center">
              <Text className="text-4xl font-bold text-black">
                {marks.total}
              </Text>
              <Text className="text-gray-500 text-base">Total Marks</Text>
            </VStack>
          </VStack>
        </View>

        {/* Breakdown Card */}
        <View style={styles.card}>
          <Text className="text-lg font-bold text-black mb-4">
            Marks Breakdown
          </Text>

          <VStack space="md">
            {/* CIE 1 */}
            {gradingConfig?.cie1Enabled !== false && (
              <View style={styles.markRow}>
                <HStack className="justify-between items-center mb-2">
                  <Text className="text-base font-semibold text-gray-700">
                    CIE 1
                  </Text>
                  <Text className="text-base font-bold text-black">
                    {marks.cie1}/{gradingConfig?.cie1MaxMarks || 25}
                  </Text>
                </HStack>
                <View style={styles.progressBar}>
                    <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${getPercentage(marks.cie1, gradingConfig?.cie1MaxMarks || 25)}%` as any,
                        backgroundColor: "#10B981",
                      },
                    ]}
                  />
                </View>
                <Text className="text-xs text-gray-500 mt-1">
                  {getPercentage(marks.cie1, gradingConfig?.cie1MaxMarks || 25)}%
                </Text>
              </View>
            )}

            {/* CIE 2 */}
            {gradingConfig?.cie2Enabled !== false && (
              <View style={styles.markRow}>
                <HStack className="justify-between items-center mb-2">
                  <Text className="text-base font-semibold text-gray-700">
                    CIE 2
                  </Text>
                  <Text className="text-base font-bold text-black">
                    {marks.cie2}/{gradingConfig?.cie2MaxMarks || 25}
                  </Text>
                </HStack>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${getPercentage(marks.cie2, gradingConfig?.cie2MaxMarks || 25)}%`,
                        backgroundColor: "#3B82F6",
                      },
                    ]}
                  />
                </View>
                <Text className="text-xs text-gray-500 mt-1">
                  {getPercentage(marks.cie2, gradingConfig?.cie2MaxMarks || 25)}%
                </Text>
              </View>
            )}

            {/* SEE */}
            {gradingConfig?.seeEnabled !== false && (
              <View style={styles.markRow}>
                <HStack className="justify-between items-center mb-2">
                  <Text className="text-base font-semibold text-gray-700">
                    SEE (Final Exam)
                  </Text>
                  <Text className="text-base font-bold text-black">
                    {marks.see}/{gradingConfig?.seeMaxMarks || 50}
                  </Text>
                </HStack>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${getPercentage(marks.see, gradingConfig?.seeMaxMarks || 50)}%`,
                        backgroundColor: "#8B5CF6",
                      },
                    ]}
                  />
                </View>
                <Text className="text-xs text-gray-500 mt-1">
                  {getPercentage(marks.see, gradingConfig?.seeMaxMarks || 50)}%
                </Text>
              </View>
            )}

            {/* Assignment */}
            {gradingConfig?.assignmentEnabled && marks.assignment !== undefined && (
              <View style={styles.markRow}>
                <HStack className="justify-between items-center mb-2">
                  <Text className="text-base font-semibold text-gray-700">
                    Assignment
                  </Text>
                  <Text className="text-base font-bold text-black">
                    {marks.assignment}/{gradingConfig?.assignmentMaxMarks || 10}
                  </Text>
                </HStack>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${getPercentage(marks.assignment || 0, gradingConfig?.assignmentMaxMarks || 10)}%`,
                        backgroundColor: "#F59E0B",
                      },
                    ]}
                  />
                </View>
                <Text className="text-xs text-gray-500 mt-1">
                  {getPercentage(marks.assignment || 0, gradingConfig?.assignmentMaxMarks || 10)}%
                </Text>
              </View>
            )}

            {/* Group Activity */}
            {gradingConfig?.groupActivityEnabled && marks.groupActivity !== undefined && (
              <View style={styles.markRow}>
                <HStack className="justify-between items-center mb-2">
                  <Text className="text-base font-semibold text-gray-700">
                    Group Activity
                  </Text>
                  <Text className="text-base font-bold text-black">
                    {marks.groupActivity}/{gradingConfig?.groupActivityMaxMarks || 10}
                  </Text>
                </HStack>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${getPercentage(marks.groupActivity || 0, gradingConfig?.groupActivityMaxMarks || 10)}%`,
                        backgroundColor: "#EC4899",
                      },
                    ]}
                  />
                </View>
                <Text className="text-xs text-gray-500 mt-1">
                  {getPercentage(marks.groupActivity || 0, gradingConfig?.groupActivityMaxMarks || 10)}%
                </Text>
              </View>
            )}
          </VStack>
        </View>
      </>
    );
  };

  const renderTeacherView = () => {
    if (!classStats) {
      return (
        <View style={styles.emptyState}>
          <Icon as={Users} size="xl" className="text-gray-300" />
          <Text className="text-gray-500 text-lg mt-4">No marks recorded yet</Text>
          <Text className="text-gray-400 text-sm mt-2">
            Start grading students to see class statistics
          </Text>
        </View>
      );
    }

    return (
      <>
        {/* Class Statistics Card */}
        <View style={styles.gradeCard}>
          <VStack space="lg" className="items-center">
            <View style={styles.statsBadge}>
              <Icon as={TrendingUp} size="xl" className="text-white" />
            </View>
            <VStack space="xs" className="items-center">
              <Text className="text-4xl font-bold text-black">
                {classStats.averageScore.toFixed(1)}
              </Text>
              <Text className="text-gray-500 text-lg">Class Average</Text>
            </VStack>
            <HStack space="lg" className="mt-4">
              <VStack space="xs" className="items-center">
                <Text className="text-2xl font-bold text-green-600">
                  {classStats.highestScore}
                </Text>
                <Text className="text-gray-500 text-sm">Highest</Text>
              </VStack>
              <VStack space="xs" className="items-center">
                <Text className="text-2xl font-bold text-red-600">
                  {classStats.lowestScore}
                </Text>
                <Text className="text-gray-500 text-sm">Lowest</Text>
              </VStack>
              <VStack space="xs" className="items-center">
                <Text className="text-2xl font-bold text-blue-600">
                  {classStats.totalStudents}
                </Text>
                <Text className="text-gray-500 text-sm">Students</Text>
              </VStack>
            </HStack>
          </VStack>
        </View>

        {/* Grade Distribution */}
        <View style={styles.card}>
          <Text className="text-lg font-bold text-black mb-4">
            Grade Distribution
          </Text>
          <VStack space="md">
            {Object.entries(classStats.gradeDistribution)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([grade, count]) => (
                <View key={grade} style={styles.markRow}>
                  <HStack className="justify-between items-center mb-2">
                    <Text
                      className="text-base font-bold"
                      style={{ color: getGradeColor(grade) }}
                    >
                      Grade {grade}
                    </Text>
                    <Text className="text-base font-bold text-black">
                      {count} students
                    </Text>
                  </HStack>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${(count / classStats.totalStudents) * 100}%`,
                          backgroundColor: getGradeColor(grade),
                        },
                      ]}
                    />
                  </View>
                  <Text className="text-xs text-gray-500 mt-1">
                    {((count / classStats.totalStudents) * 100).toFixed(1)}%
                  </Text>
                </View>
              ))}
          </VStack>
        </View>

        {/* Student List */}
        <View style={styles.card}>
          <Text className="text-lg font-bold text-black mb-4">
            Student Marks ({allMarks.length})
          </Text>
          <VStack space="sm">
            {allMarks.map((mark) => (
              <View key={mark.id} style={styles.studentRow}>
                <HStack className="justify-between items-center">
                  <VStack space="xs">
                    <Text className="text-sm font-semibold text-gray-700">
                      Student ID: {mark.studentId.substring(0, 8)}...
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Total: {mark.total} marks
                    </Text>
                  </VStack>
                  <View
                    style={[
                      styles.gradePill,
                      { backgroundColor: getGradeColor(mark.grade) + "20" },
                    ]}
                  >
                    <Text
                      className="text-sm font-bold"
                      style={{ color: getGradeColor(mark.grade) }}
                    >
                      {mark.grade}
                    </Text>
                  </View>
                </HStack>
              </View>
            ))}
          </VStack>
        </View>
      </>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7477FF" />
          <Text className="text-gray-500 mt-4">Loading marks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text className="text-red-500 text-lg">Error loading marks</Text>
          <Text className="text-gray-500 mt-2">{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <HStack className="justify-between items-center px-4 py-3">
          <Text className="text-xl font-bold text-black">Marks & Results</Text>
          {canEdit && (
            <TouchableOpacity style={styles.iconButton}>
              <Icon as={Edit} size="md" className="text-black" />
            </TouchableOpacity>
          )}
        </HStack>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        {role === "student" || role === "parent"
          ? renderStudentView()
          : renderTeacherView()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  retryButton: {
    backgroundColor: "#7477FF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  iconButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  gradeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradeBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#7477FF",
    justifyContent: "center",
    alignItems: "center",
  },
  statsBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  markRow: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  studentRow: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  gradePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
