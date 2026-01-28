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
import { Award, TrendingUp, Edit } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/lib/AuthContext";

export default function MarksScreen() {
  const { courseInstanceId } = useLocalSearchParams<{
    courseInstanceId: string;
  }>();
  const { role, user } = useAuth();

  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual hook
  const marksData = {
    cie1: 20,
    cie2: 18,
    assignment: 9,
    finalExam: 45,
    total: 92,
    grade: "A+",
    maxCIE1: 20,
    maxCIE2: 20,
    maxAssignment: 10,
    maxFinalExam: 50,
    maxTotal: 100,
  };

  const canEdit = role === "teacher" || role === "admin";

  const getGradeColor = (grade: string) => {
    if (grade === "A+" || grade === "A") return "#10B981";
    if (grade === "B+" || grade === "B") return "#3B82F6";
    if (grade === "C+" || grade === "C") return "#F59E0B";
    if (grade === "D" || grade === "E") return "#EF4444";
    return "#6B7280";
  };

  const getPercentage = (obtained: number, max: number) => {
    return ((obtained / max) * 100).toFixed(1);
  };

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
          <RefreshControl refreshing={loading} onRefresh={() => {}} />
        }
      >
        {role === "student" || role === "parent" ? (
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
                    style={{ color: getGradeColor(marksData.grade) }}
                  >
                    {marksData.grade}
                  </Text>
                  <Text className="text-gray-500 text-lg">Your Grade</Text>
                </VStack>
                <VStack space="xs" className="items-center">
                  <Text className="text-4xl font-bold text-black">
                    {marksData.total}/{marksData.maxTotal}
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
                <View style={styles.markRow}>
                  <HStack className="justify-between items-center mb-2">
                    <Text className="text-base font-semibold text-gray-700">
                      CIE 1
                    </Text>
                    <Text className="text-base font-bold text-black">
                      {marksData.cie1}/{marksData.maxCIE1}
                    </Text>
                  </HStack>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width:
                            `${getPercentage(marksData.cie1, marksData.maxCIE1)}%` as any,
                          backgroundColor: "#10B981",
                        },
                      ]}
                    />
                  </View>
                  <Text className="text-xs text-gray-500 mt-1">
                    {getPercentage(marksData.cie1, marksData.maxCIE1)}%
                  </Text>
                </View>

                {/* CIE 2 */}
                <View style={styles.markRow}>
                  <HStack className="justify-between items-center mb-2">
                    <Text className="text-base font-semibold text-gray-700">
                      CIE 2
                    </Text>
                    <Text className="text-base font-bold text-black">
                      {marksData.cie2}/{marksData.maxCIE2}
                    </Text>
                  </HStack>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width:
                            `${getPercentage(marksData.cie2, marksData.maxCIE2)}%` as any,
                          backgroundColor: "#3B82F6",
                        },
                      ]}
                    />
                  </View>
                  <Text className="text-xs text-gray-500 mt-1">
                    {getPercentage(marksData.cie2, marksData.maxCIE2)}%
                  </Text>
                </View>

                {/* Assignment */}
                <View style={styles.markRow}>
                  <HStack className="justify-between items-center mb-2">
                    <Text className="text-base font-semibold text-gray-700">
                      Assignment
                    </Text>
                    <Text className="text-base font-bold text-black">
                      {marksData.assignment}/{marksData.maxAssignment}
                    </Text>
                  </HStack>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width:
                            `${getPercentage(marksData.assignment, marksData.maxAssignment)}%` as any,
                          backgroundColor: "#8B5CF6",
                        },
                      ]}
                    />
                  </View>
                  <Text className="text-xs text-gray-500 mt-1">
                    {getPercentage(
                      marksData.assignment,
                      marksData.maxAssignment,
                    )}
                    %
                  </Text>
                </View>

                {/* Final Exam */}
                <View style={styles.markRow}>
                  <HStack className="justify-between items-center mb-2">
                    <Text className="text-base font-semibold text-gray-700">
                      Final Exam
                    </Text>
                    <Text className="text-base font-bold text-black">
                      {marksData.finalExam}/{marksData.maxFinalExam}
                    </Text>
                  </HStack>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width:
                            `${getPercentage(marksData.finalExam, marksData.maxFinalExam)}%` as any,
                          backgroundColor: "#F59E0B",
                        },
                      ]}
                    />
                  </View>
                  <Text className="text-xs text-gray-500 mt-1">
                    {getPercentage(marksData.finalExam, marksData.maxFinalExam)}
                    %
                  </Text>
                </View>
              </VStack>
            </View>

            {/* Performance Indicator */}
            <View style={styles.card}>
              <HStack space="md" className="items-center">
                <View style={styles.performanceIcon}>
                  <Icon as={TrendingUp} size="lg" className="text-green-600" />
                </View>
                <VStack space="xs" className="flex-1">
                  <Text className="text-base font-semibold text-black">
                    Excellent Performance!
                  </Text>
                  <Text className="text-sm text-gray-600">
                    You scored{" "}
                    {getPercentage(marksData.total, marksData.maxTotal)}% in
                    this course
                  </Text>
                </VStack>
              </HStack>
            </View>
          </>
        ) : (
          // Teacher/Admin view - show class statistics
          <View style={styles.emptyContainer}>
            <Award size={48} color="#9CA3AF" />
            <Text className="text-gray-500 text-center text-lg mt-4">
              Marks Management
            </Text>
            <Text className="text-gray-400 text-center text-sm mt-2">
              View and edit student marks for this course
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, { marginTop: 24 }]}
            >
              <Text className="text-white font-semibold">
                View All Students
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
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
    padding: 32,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  gradeBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  markRow: {
    paddingVertical: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  performanceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimary: {
    backgroundColor: "#000000",
  },
});
