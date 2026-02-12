import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import {
  ChevronLeft,
  Search,
  FileText,
  Link,
  CheckCircle,
  Circle,
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  ExternalLink,
  MessageSquare,
  Save,
  Shield,
  Trash2,
} from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import { useAssignmentGrading, SubmissionWithStudent } from "@/lib/hooks/useAssignmentGrading";
import { useNotificationService } from "@/lib/hooks/useNotificationService";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { collection, query, where, getDocs, writeBatch, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/types/constants";

export default function AdminAssignmentGradingScreen() {
  const { courseInstanceId, assignmentId } = useLocalSearchParams<{
    courseInstanceId: string;
    assignmentId: string;
  }>();
  const { role, userData } = useAuth();

  const { notifyAssignmentGraded } = useNotificationService();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "graded" | "ungraded">("all");
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithStudent | null>(null);
  const [gradeInput, setGradeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [deletingAll, setDeletingAll] = useState(false);

  const { assignment, loading, error, isGrading, gradeSubmission, refresh } = useAssignmentGrading(
    assignmentId as string
  );

  // Filter submissions based on search and status
  const filteredSubmissions = assignment?.submissions.filter((submission) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        submission.studentName.toLowerCase().includes(query) ||
        submission.studentEmail.toLowerCase().includes(query) ||
        (submission.studentRollNumber && submission.studentRollNumber.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filterStatus === "graded" && submission.grade === undefined) return false;
    if (filterStatus === "ungraded" && submission.grade !== undefined) return false;

    return true;
  }) || [];

  const handleOpenSubmission = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert("Error", "Could not open the submission link");
      });
    }
  };

  const openGradeModal = (submission: SubmissionWithStudent) => {
    setSelectedSubmission(submission);
    setGradeInput(submission.grade?.toString() || "");
    setFeedbackInput(submission.feedback || "");
    setShowGradeModal(true);
  };

  const handleGradeSubmit = async () => {
    if (!selectedSubmission || !assignment) return;

    const grade = parseFloat(gradeInput);
    const maxScore = assignment.maxScore || 100;
    if (isNaN(grade) || grade < 0 || grade > maxScore) {
      Alert.alert(
        "Invalid Grade",
        `Please enter a valid grade between 0 and ${maxScore}`
      );
      return;
    }

    try {
      await gradeSubmission(selectedSubmission.id, grade, feedbackInput);

      // Send push notification to student
      await notifyAssignmentGraded(
        selectedSubmission.studentId,
        assignment.title,
        grade,
        assignment.maxScore || 100
      );

      setShowGradeModal(false);
      setSelectedSubmission(null);
      Alert.alert("Success", "Grade saved successfully");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save grade");
    }
  };

  const handleDeleteAllSubmissions = async () => {
    Alert.alert(
      "Delete All Submissions",
      "Are you sure you want to delete ALL submissions for this assignment? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            setDeletingAll(true);
            try {
              const batch = writeBatch(db);
              const submissionsQuery = query(
                collection(db, COLLECTIONS.SUBMISSIONS),
                where("assignmentId", "==", assignmentId)
              );
              const submissionsSnap = await getDocs(submissionsQuery);
              submissionsSnap.docs.forEach((doc) => {
                batch.delete(doc.ref);
              });
              await batch.commit();
              await refresh();
              Alert.alert("Success", "All submissions deleted successfully");
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete submissions");
            } finally {
              setDeletingAll(false);
            }
          },
        },
      ]
    );
  };

  const getSubmissionType = (submission: SubmissionWithStudent) => {
    if (submission.storagePath) return "file";
    if (submission.submissionUrl) return "url";
    if (submission.submissionText) return "text";
    return "unknown";
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text className="text-gray-600 mt-4">Loading submissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !assignment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text className="text-red-600 text-center">{error || "Assignment not found"}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const progressPercentage =
    assignment.totalStudents > 0
      ? Math.round((assignment.submittedCount / assignment.totalStudents) * 100)
      : 0;

  const gradedPercentage =
    assignment.submittedCount > 0
      ? Math.round((assignment.gradedCount / assignment.submittedCount) * 100)
      : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <HStack className="justify-between items-center px-4 py-3">
          <TouchableOpacity onPress={() => router.back()} style={styles.backIconButton}>
            <Icon as={ChevronLeft} size="lg" className="text-black" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <HStack space="sm" className="items-center justify-center">
              <Shield size={16} color="#8B5CF6" />
              <Text className="text-lg font-bold text-black" numberOfLines={1}>
                {assignment.title}
              </Text>
            </HStack>
            <Text className="text-sm text-gray-500">Admin Grading</Text>
          </View>

          <TouchableOpacity onPress={refresh} style={styles.refreshButton}>
            <Text className="text-sm font-semibold text-black">Refresh</Text>
          </TouchableOpacity>
        </HStack>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <HStack space="md">
            <View style={[styles.statCard, styles.statCardPrimary]}>
              <Icon as={Users} size="md" className="text-white mb-2" />
              <Text className="text-2xl font-bold text-white">
                {assignment.submittedCount}/{assignment.totalStudents}
              </Text>
              <Text className="text-sm text-white opacity-80">Submitted</Text>
            </View>

            <View style={[styles.statCard, styles.statCardSecondary]}>
              <Icon as={CheckCircle} size="md" className="text-black mb-2" />
              <Text className="text-2xl font-bold text-black">
                {assignment.gradedCount}/{assignment.submittedCount}
              </Text>
              <Text className="text-sm text-gray-600">Graded</Text>
            </View>

            <View style={[styles.statCard, styles.statCardTertiary]}>
              <Icon as={TrendingUp} size="md" className="text-black mb-2" />
              <Text className="text-2xl font-bold text-black">
                {assignment.averageGrade?.toFixed(1) || "-"}
              </Text>
              <Text className="text-sm text-gray-600">Average</Text>
            </View>
          </HStack>

          {/* Progress Bars */}
          <VStack space="sm" className="mt-4">
            <View>
              <HStack className="justify-between mb-1">
                <Text className="text-sm text-gray-600">Submission Progress</Text>
                <Text className="text-sm font-semibold text-black">{progressPercentage}%</Text>
              </HStack>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
              </View>
            </View>

            <View>
              <HStack className="justify-between mb-1">
                <Text className="text-sm text-gray-600">Grading Progress</Text>
                <Text className="text-sm font-semibold text-black">{gradedPercentage}%</Text>
              </HStack>
              <View style={styles.progressBarBg}>
                <View
                  style={[styles.progressBarFill, styles.progressBarSecondary, { width: `${gradedPercentage}%` }]}
                />
              </View>
            </View>
          </VStack>
        </View>

        {/* Search and Filter */}
        <View style={styles.filterSection}>
          <View style={styles.searchContainer}>
            <Icon as={Search} size="md" className="text-gray-400" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by student name or email..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Icon as={Circle} size="sm" className="text-gray-400" />
              </TouchableOpacity>
            )}
          </View>

          <HStack space="sm" className="mt-3">
            {(["all", "graded", "ungraded"] as const).map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setFilterStatus(status)}
                style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
              >
                <Text
                  className={
                    filterStatus === status ? "text-white font-semibold text-sm" : "text-gray-700 text-sm"
                  }
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}

            {assignment.submissions.length > 0 && (
              <TouchableOpacity
                onPress={handleDeleteAllSubmissions}
                style={[styles.filterChip, styles.deleteChip]}
                disabled={deletingAll}
              >
                <Icon as={Trash2} size="xs" className="text-red-600" />
                <Text className="text-red-600 text-sm ml-1">Delete All</Text>
              </TouchableOpacity>
            )}
          </HStack>
        </View>

        {/* Assignment Info */}
        <View style={styles.assignmentInfoCard}>
          <Text className="text-base font-semibold text-black mb-2">Assignment Details</Text>
          <Text className="text-sm text-gray-600 mb-3">{assignment.description}</Text>
          <HStack space="sm">
            <View style={styles.infoBadge}>
              <Text className="text-xs font-semibold text-gray-700">
                Max Score: {assignment.maxScore}
              </Text>
            </View>
            <View style={styles.infoBadge}>
              <Text className="text-xs font-semibold text-gray-700">
                Due: {assignment.dueDate.toDate().toLocaleDateString()}
              </Text>
            </View>
          </HStack>
        </View>

        {/* Submissions List */}
        <View style={styles.submissionsSection}>
          <Text className="text-lg font-bold text-black mb-4">
            Submissions ({filteredSubmissions.length})
          </Text>

          {filteredSubmissions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FileText size={48} color="#9CA3AF" />
              <Text className="text-gray-500 text-center text-lg mt-4">
                {searchQuery ? "No submissions found" : "No submissions yet"}
              </Text>
            </View>
          ) : (
            <VStack space="md">
              {filteredSubmissions.map((submission) => {
                const isGraded = submission.grade !== undefined;
                const submissionType = getSubmissionType(submission);

                return (
                  <View key={submission.id} style={styles.submissionCard}>
                    <HStack className="justify-between items-start">
                      <View style={styles.studentInfo}>
                        <Text className="text-base font-semibold text-black">
                          {submission.studentName}
                        </Text>
                        <Text className="text-sm text-gray-500">{submission.studentEmail}</Text>
                        {submission.studentRollNumber && (
                          <Text className="text-xs text-gray-400 mt-1">
                            Roll: {submission.studentRollNumber}
                          </Text>
                        )}
                      </View>

                      <View style={[styles.statusBadge, isGraded ? styles.statusGraded : styles.statusPending]}>
                        <Text className={`text-xs font-semibold ${isGraded ? "text-green-700" : "text-orange-700"}`}>
                          {isGraded ? `Grade: ${submission.grade}` : "Ungraded"}
                        </Text>
                      </View>
                    </HStack>

                    <View style={styles.submissionDetails}>
                      <HStack space="sm" className="items-center">
                        <Icon as={Clock} size="xs" className="text-gray-400" />
                        <Text className="text-xs text-gray-500">
                          Submitted: {formatDate(submission.submittedAt)}
                        </Text>
                      </HStack>

                      {submissionType === "file" && (
                        <HStack space="sm" className="items-center mt-1">
                          <Icon as={FileText} size="xs" className="text-gray-400" />
                          <Text className="text-xs text-gray-500">
                            File: {submission.fileName} ({submission.fileSize})
                          </Text>
                        </HStack>
                      )}

                      {submissionType === "url" && (
                        <TouchableOpacity
                          onPress={() => handleOpenSubmission(submission.submissionUrl)}
                          style={styles.linkContainer}
                        >
                          <HStack space="sm" className="items-center">
                            <Icon as={Link} size="xs" className="text-blue-500" />
                            <Text className="text-xs text-blue-500 underline" numberOfLines={1}>
                              {submission.submissionUrl}
                            </Text>
                            <Icon as={ExternalLink} size="xs" className="text-blue-500" />
                          </HStack>
                        </TouchableOpacity>
                      )}

                      {submission.submissionText && (
                        <View style={styles.textPreview}>
                          <Text className="text-xs text-gray-600" numberOfLines={2}>
                            {submission.submissionText}
                          </Text>
                        </View>
                      )}

                      {submission.feedback && (
                        <View style={styles.feedbackPreview}>
                          <HStack space="xs" className="items-center mb-1">
                            <Icon as={MessageSquare} size="xs" className="text-gray-400" />
                            <Text className="text-xs font-semibold text-gray-600">Feedback:</Text>
                          </HStack>
                          <Text className="text-xs text-gray-600">{submission.feedback}</Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() => openGradeModal(submission)}
                      style={[styles.gradeButton, isGraded && styles.gradeButtonGraded]}
                    >
                      <HStack space="xs" className="items-center justify-center">
                        <Icon as={isGraded ? Save : BarChart3} size="sm" className="text-white" />
                        <Text className="text-white font-semibold">
                          {isGraded ? "Update Grade" : "Grade Submission"}
                        </Text>
                      </HStack>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </VStack>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Grade Modal */}
      <Modal
        visible={showGradeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGradeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.gradeModal}>
            <ScrollView contentContainerStyle={styles.gradeModalContent}>
              <VStack space="lg">
                <HStack className="justify-between items-center">
                  <Text className="text-xl font-bold text-black">
                    {selectedSubmission?.grade !== undefined ? "Update Grade" : "Grade Submission"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowGradeModal(false)}
                    disabled={isGrading}
                  >
                    <Text className="text-gray-500 text-lg">✕</Text>
                  </TouchableOpacity>
                </HStack>

                {selectedSubmission && (
                  <>
                    <View style={styles.studentInfoCard}>
                      <Text className="text-lg font-semibold text-black">
                        {selectedSubmission.studentName}
                      </Text>
                      <Text className="text-sm text-gray-500">{selectedSubmission.studentEmail}</Text>
                    </View>

                    <VStack space="xs">
                      <Text className="text-sm font-semibold text-gray-700">
                        Grade (out of {assignment.maxScore || 100}) *
                      </Text>
                      <TextInput
                        style={styles.gradeInput}
                        placeholder="Enter grade"
                        value={gradeInput}
                        onChangeText={setGradeInput}
                        keyboardType="numeric"
                        placeholderTextColor="#9CA3AF"
                      />
                    </VStack>

                    <VStack space="xs">
                      <Text className="text-sm font-semibold text-gray-700">Feedback</Text>
                      <TextInput
                        style={[styles.gradeInput, styles.feedbackInput]}
                        placeholder="Enter feedback (optional)"
                        value={feedbackInput}
                        onChangeText={setFeedbackInput}
                        multiline
                        numberOfLines={4}
                        placeholderTextColor="#9CA3AF"
                      />
                    </VStack>

                    <HStack space="sm" className="mt-4">
                      <TouchableOpacity
                        onPress={() => setShowGradeModal(false)}
                        style={[styles.modalButton, styles.modalButtonSecondary]}
                        disabled={isGrading}
                      >
                        <Text className="text-black font-semibold">Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleGradeSubmit}
                        style={[styles.modalButton, styles.modalButtonPrimary]}
                        disabled={isGrading || !gradeInput.trim()}
                      >
                        {isGrading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text className="text-white font-semibold">Save Grade</Text>
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
  backIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#000000",
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  statCardPrimary: {
    backgroundColor: "#8B5CF6",
  },
  statCardSecondary: {
    backgroundColor: "#F3F4F6",
  },
  statCardTertiary: {
    backgroundColor: "#E5E7EB",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#8B5CF6",
    borderRadius: 4,
  },
  progressBarSecondary: {
    backgroundColor: "#10B981",
  },
  filterSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#000000",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
  },
  filterChipActive: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  deleteChip: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
  },
  assignmentInfoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  submissionsSection: {
    flex: 1,
  },
  emptyContainer: {
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
  },
  submissionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  studentInfo: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusGraded: {
    backgroundColor: "#D1FAE5",
  },
  statusPending: {
    backgroundColor: "#FEF3C7",
  },
  submissionDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  linkContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
  },
  textPreview: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  feedbackPreview: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
  },
  gradeButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    alignItems: "center",
  },
  gradeButtonGraded: {
    backgroundColor: "#10B981",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  gradeModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  gradeModalContent: {
    padding: 24,
  },
  studentInfoCard: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
  },
  gradeInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#000000",
    backgroundColor: "#F9FAFB",
  },
  feedbackInput: {
    height: 100,
    textAlignVertical: "top",
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonSecondary: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalButtonPrimary: {
    backgroundColor: "#8B5CF6",
  },
});
