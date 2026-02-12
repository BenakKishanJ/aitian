import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Award, TrendingUp, Users, Shield, Trash2, Edit3, Save, X } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/lib/AuthContext";
import { useMarks } from "@/lib/hooks/useMarks";
import { getGradeColor } from "@/lib/gradingUtils";
import { collection, query, where, getDocs, writeBatch, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/types/constants";
import type { Marks } from "@/types";

export default function AdminMarksScreen() {
  const { courseInstanceId } = useLocalSearchParams<{
    courseInstanceId: string;
  }>();
  const { role, user } = useAuth();
  const { marks, allMarks, classStats, loading, error, refresh } = useMarks(
    courseInstanceId as string
  );

  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMark, setEditingMark] = useState<Marks | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  // Edit form state
  const [editCie1, setEditCie1] = useState("");
  const [editCie2, setEditCie2] = useState("");
  const [editSee, setEditSee] = useState("");
  const [editAssignment, setEditAssignment] = useState("");
  const [editGroupActivity, setEditGroupActivity] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const openEditModal = (mark: Marks) => {
    setEditingMark(mark);
    setEditCie1(mark.cie1?.toString() || "0");
    setEditCie2(mark.cie2?.toString() || "0");
    setEditSee(mark.see?.toString() || "0");
    setEditAssignment(mark.assignment?.toString() || "");
    setEditGroupActivity(mark.groupActivity?.toString() || "");
    setShowEditModal(true);
  };

  const handleSaveMarks = async () => {
    if (!editingMark) return;

    setIsSaving(true);
    try {
      const markRef = doc(db, COLLECTIONS.MARKS, editingMark.id);
      const updates: Partial<Marks> = {
        cie1: parseFloat(editCie1) || 0,
        cie2: parseFloat(editCie2) || 0,
        see: parseFloat(editSee) || 0,
      };

      if (editAssignment !== "") {
        updates.assignment = parseFloat(editAssignment) || undefined;
      }
      if (editGroupActivity !== "") {
        updates.groupActivity = parseFloat(editGroupActivity) || undefined;
      }

      await updateDoc(markRef, updates);
      await refresh();
      setShowEditModal(false);
      Alert.alert("Success", "Marks updated successfully");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save marks");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAllMarks = async () => {
    Alert.alert(
      "Delete All Marks",
      "Are you sure you want to delete ALL marks for this course? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            setDeletingAll(true);
            try {
              const batch = writeBatch(db);
              const marksQuery = query(
                collection(db, COLLECTIONS.MARKS),
                where("courseInstanceId", "==", courseInstanceId)
              );
              const marksSnap = await getDocs(marksQuery);
              marksSnap.docs.forEach((doc) => {
                batch.delete(doc.ref);
              });
              await batch.commit();
              await refresh();
              Alert.alert("Success", "All marks deleted successfully");
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete marks");
            } finally {
              setDeletingAll(false);
            }
          },
        },
      ]
    );
  };

  const calculateGradeFromPercentage = (percentage: number): string => {
    if (percentage >= 90) return "O";
    if (percentage >= 80) return "A+";
    if (percentage >= 70) return "A";
    if (percentage >= 60) return "B+";
    if (percentage >= 50) return "B";
    return "F";
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
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
          <HStack space="sm" className="items-center">
            <Shield size={20} color="#8B5CF6" />
            <Text className="text-xl font-bold text-black">Admin: Marks</Text>
          </HStack>

          {allMarks.length > 0 && (
            <TouchableOpacity
              onPress={handleDeleteAllMarks}
              style={styles.deleteAllButton}
              disabled={deletingAll}
            >
              <Icon as={Trash2} size="md" className="text-red-600" />
            </TouchableOpacity>
          )}
        </HStack>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {classStats ? (
          <>
            {/* Class Statistics Card */}
            <View style={styles.statsCard}>
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

            {/* Student List with Edit */}
            <View style={styles.card}>
              <HStack className="justify-between items-center mb-4">
                <Text className="text-lg font-bold text-black">
                  Student Marks ({allMarks.length})
                </Text>
              </HStack>
              <VStack space="sm">
                {allMarks.map((mark) => (
                  <TouchableOpacity
                    key={mark.id}
                    style={styles.studentRow}
                    onPress={() => openEditModal(mark)}
                  >
                    <HStack className="justify-between items-center">
                      <VStack space="xs">
                        <Text className="text-sm font-semibold text-gray-700">
                          Student ID: {mark.studentId.substring(0, 8)}...
                        </Text>
                        <Text className="text-xs text-gray-500">
                          Total: {mark.total} marks
                        </Text>
                        <HStack space="sm" className="mt-1">
                          <Text className="text-xs text-gray-400">
                            CIE1: {mark.cie1}
                          </Text>
                          <Text className="text-xs text-gray-400">
                            CIE2: {mark.cie2}
                          </Text>
                          <Text className="text-xs text-gray-400">
                            SEE: {mark.see}
                          </Text>
                          {mark.assignment !== undefined && (
                            <Text className="text-xs text-gray-400">
                              Asgn: {mark.assignment}
                            </Text>
                          )}
                        </HStack>
                      </VStack>
                      <HStack space="sm" className="items-center">
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
                        <Icon as={Edit3} size="sm" className="text-gray-400" />
                      </HStack>
                    </HStack>
                  </TouchableOpacity>
                ))}
              </VStack>
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Icon as={Users} size="xl" className="text-gray-300" />
            <Text className="text-gray-500 text-lg mt-4">No marks recorded yet</Text>
            <Text className="text-gray-400 text-sm mt-2">
              Start grading students to see class statistics
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Marks Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <ScrollView contentContainerStyle={styles.editModalContent}>
              <VStack space="lg">
                <HStack className="justify-between items-center">
                  <HStack space="sm" className="items-center">
                    <Shield size={20} color="#8B5CF6" />
                    <Text className="text-xl font-bold text-black">
                      Edit Marks
                    </Text>
                  </HStack>
                  <TouchableOpacity onPress={() => setShowEditModal(false)}>
                    <Icon as={X} size="lg" className="text-gray-500" />
                  </TouchableOpacity>
                </HStack>

                {editingMark && (
                  <>
                    <View style={styles.studentInfoCard}>
                      <Text className="text-sm text-gray-500">Student ID</Text>
                      <Text className="text-base font-semibold text-black">
                        {editingMark.studentId}
                      </Text>
                    </View>

                    <VStack space="xs">
                      <Text className="text-sm font-semibold text-gray-700">
                        CIE 1 (Max: 25)
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        value={editCie1}
                        onChangeText={setEditCie1}
                        keyboardType="numeric"
                        placeholderTextColor="#9CA3AF"
                      />
                    </VStack>

                    <VStack space="xs">
                      <Text className="text-sm font-semibold text-gray-700">
                        CIE 2 (Max: 25)
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        value={editCie2}
                        onChangeText={setEditCie2}
                        keyboardType="numeric"
                        placeholderTextColor="#9CA3AF"
                      />
                    </VStack>

                    <VStack space="xs">
                      <Text className="text-sm font-semibold text-gray-700">
                        SEE - Final Exam (Max: 50)
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        value={editSee}
                        onChangeText={setEditSee}
                        keyboardType="numeric"
                        placeholderTextColor="#9CA3AF"
                      />
                    </VStack>

                    <VStack space="xs">
                      <Text className="text-sm font-semibold text-gray-700">
                        Assignment (Optional)
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Leave empty if not applicable"
                        value={editAssignment}
                        onChangeText={setEditAssignment}
                        keyboardType="numeric"
                        placeholderTextColor="#9CA3AF"
                      />
                    </VStack>

                    <VStack space="xs">
                      <Text className="text-sm font-semibold text-gray-700">
                        Group Activity (Optional)
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Leave empty if not applicable"
                        value={editGroupActivity}
                        onChangeText={setEditGroupActivity}
                        keyboardType="numeric"
                        placeholderTextColor="#9CA3AF"
                      />
                    </VStack>

                    <HStack space="sm" className="mt-4">
                      <TouchableOpacity
                        onPress={() => setShowEditModal(false)}
                        style={[styles.button, styles.buttonSecondary]}
                        disabled={isSaving}
                      >
                        <Text className="text-black font-semibold">Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleSaveMarks}
                        style={[styles.button, styles.buttonPrimary]}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <HStack space="xs" className="items-center">
                            <Icon as={Save} size="sm" className="text-white" />
                            <Text className="text-white font-semibold">Save</Text>
                          </HStack>
                        )}
                      </TouchableOpacity>
                    </HStack>
                  </>
                )}
              </VStack>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  deleteAllButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
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
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statsCard: {
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
  statsBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#8B5CF6",
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
  emptyContainer: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  editModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  editModalContent: {
    padding: 24,
  },
  studentInfoCard: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#000000",
    backgroundColor: "#F9FAFB",
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSecondary: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  buttonPrimary: {
    backgroundColor: "#8B5CF6",
  },
});
