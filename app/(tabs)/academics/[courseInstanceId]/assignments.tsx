import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Search, Plus, X, Filter, FileText } from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import { useAssignments } from "@/lib/hooks/useAssignments";
import type { AssignmentWithStatus } from "@/types";
import { AssignmentCard } from "@/components/academics/AssignmentCard";
import type { AssignmentStatus } from "@/types";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";

export default function AssignmentsScreen() {
  const { courseInstanceId } = useLocalSearchParams<{
    courseInstanceId: string;
  }>();
  const { role } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | "all" | null>("all");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithStatus | null>(null);

  // Create form state
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createDueDate, setCreateDueDate] = useState("");
  const [createMaxScore, setCreateMaxScore] = useState("");
  const [createAttachmentUrl, setCreateAttachmentUrl] = useState("");
  const [creating, setCreating] = useState(false);

  // Submit form state
  const [submitUrl, setSubmitUrl] = useState("");
  const [submitText, setSubmitText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    assignments,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    createAssignment,
    deleteAssignment,
    submitAssignment,
  } = useAssignments({
    courseInstanceId: courseInstanceId as string,
    searchQuery,
    status: role === "student" ? statusFilter : null,
  });

  const canCreate = role === "teacher" || role === "admin";
  const canSubmit = role === "student";

  const statusFilters: { value: AssignmentStatus | "all"; label: string }[] = [
    { value: "all", label: "All Assignments" },
    { value: "pending", label: "Pending" },
    { value: "submitted", label: "Submitted" },
    { value: "graded", label: "Graded" },
    { value: "overdue", label: "Overdue" },
  ];

  const handleEndReached = () => {
    if (hasMore && !loading) {
      loadMore();
    }
  };

  const isScrollable = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    return (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom
    );
  };

  const handleDelete = async (assignmentId: string) => {
    try {
      await deleteAssignment(assignmentId);
      Alert.alert("Success", "Assignment deleted successfully");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to delete assignment");
    }
  };

  const handleCreate = async () => {
    if (!createTitle.trim() || !createDescription.trim() || !createDueDate.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const dueDate = new Date(createDueDate);
    if (isNaN(dueDate.getTime())) {
      Alert.alert("Error", "Invalid due date format");
      return;
    }

    setCreating(true);
    try {
      await createAssignment({
        title: createTitle,
        description: createDescription,
        dueDate,
        maxScore: createMaxScore ? parseInt(createMaxScore) : undefined,
        attachmentUrl: createAttachmentUrl.trim() || undefined,
      });

      // Reset form
      resetCreateForm();
      Alert.alert("Success", "Assignment created successfully");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create assignment");
    } finally {
      setCreating(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAssignment || (!submitUrl.trim() && !submitText.trim())) {
      Alert.alert("Error", "Please provide a submission URL or text");
      return;
    }

    setSubmitting(true);
    try {
      await submitAssignment(selectedAssignment.id, {
        submissionUrl: submitUrl.trim() || undefined,
        submissionText: submitText.trim() || undefined,
      });

      // Reset form
      setSubmitUrl("");
      setSubmitText("");
      setShowDetailModal(false);
      setSelectedAssignment(null);

      Alert.alert("Success", "Assignment submitted successfully");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setCreateTitle("");
    setCreateDescription("");
    setCreateDueDate("");
    setCreateMaxScore("");
    setCreateAttachmentUrl("");
    setShowCreateModal(false);
  };

  const handleAssignmentPress = (assignment: AssignmentWithStatus) => {
    setSelectedAssignment(assignment);
    setShowDetailModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <HStack className="justify-between items-center px-4 py-3">
          <Text className="text-xl font-bold text-black">Assignments</Text>

          <HStack space="sm">
            {/* Search Icon */}
            <TouchableOpacity
              onPress={() => setShowSearch(!showSearch)}
              style={styles.iconButton}
            >
              <Icon
                as={showSearch ? X : Search}
                size="md"
                className="text-black"
              />
            </TouchableOpacity>

            {/* Filter Icon (Students only) */}
            {canSubmit && (
              <TouchableOpacity
                onPress={() => setShowFilterModal(true)}
                style={[
                  styles.iconButton,
                  statusFilter !== "all" && styles.iconButtonActive,
                ]}
              >
                <Icon as={Filter} size="md" className="text-black" />
              </TouchableOpacity>
            )}
          </HStack>
        </HStack>

        {/* Search Bar */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <Icon as={Search} size="md" className="text-gray-400" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search assignments..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Icon as={X} size="sm" className="text-gray-400" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Active Filter Indicator */}
        {statusFilter !== "all" && canSubmit && (
          <View style={styles.activeFilter}>
            <Text className="text-sm text-gray-700">
              Filter: {statusFilters.find((f) => f.value === statusFilter)?.label}
            </Text>
            <TouchableOpacity onPress={() => setStatusFilter("all")}>
              <Icon as={X} size="xs" className="text-gray-500 ml-2" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Assignments List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading && assignments.length === 0}
            onRefresh={refresh}
          />
        }
        onScroll={({ nativeEvent }) => {
          if (isScrollable({ nativeEvent })) {
            handleEndReached();
          }
        }}
        scrollEventThrottle={400}
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text className="text-red-600 text-center">{error}</Text>
          </View>
        )}

        {!loading && assignments.length === 0 && (
          <View style={styles.emptyContainer}>
            <FileText size={48} color="#9CA3AF" />
            <Text className="text-gray-500 text-center text-lg mt-4">
              {searchQuery ? "No assignments found" : "No assignments yet"}
            </Text>
            <Text className="text-gray-400 text-center text-sm mt-2">
              {canCreate
                ? "Create your first assignment to get started"
                : "Assignments will appear here once created"}
            </Text>
          </View>
        )}

        {assignments.map((assignment) => (
          <AssignmentCard
            key={assignment.id}
            assignment={assignment}
            role={role!}
            onPress={handleAssignmentPress}
            onDelete={canCreate ? handleDelete : undefined}
          />
        ))}

        {loading && assignments.length > 0 && (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color="#000000" />
            <Text className="text-gray-600 ml-2">Loading more...</Text>
          </View>
        )}

        {!loading && assignments.length > 0 && !hasMore && (
          <View style={styles.endMessage}>
            <Text className="text-gray-400 text-center text-sm">
              No more assignments to load
            </Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB for Create */}
      {canCreate && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.8}
        >
          <Icon as={Plus} size="xl" className="text-white" />
        </TouchableOpacity>
      )}

      {/* Initial Loading */}
      {loading && assignments.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text className="text-gray-600 mt-4">Loading assignments...</Text>
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.filterModal}>
            <TouchableOpacity activeOpacity={1}>
              <VStack space="md">
                <Text className="text-lg font-bold text-black">
                  Filter by Status
                </Text>

                {statusFilters.map((filter) => (
                  <TouchableOpacity
                    key={filter.value}
                    onPress={() => {
                      setStatusFilter(filter.value);
                      setShowFilterModal(false);
                    }}
                    style={[
                      styles.filterOption,
                      statusFilter === filter.value && styles.filterOptionActive,
                    ]}
                  >
                    <Text
                      className={
                        statusFilter === filter.value
                          ? "text-white font-semibold"
                          : "text-black"
                      }
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </VStack>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Create Assignment Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={resetCreateForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createModal}>
            <ScrollView contentContainerStyle={styles.createModalContent}>
              <VStack space="lg">
                <HStack className="justify-between items-center">
                  <Text className="text-xl font-bold text-black">
                    Create Assignment
                  </Text>
                  <TouchableOpacity onPress={resetCreateForm}>
                    <Icon as={X} size="lg" className="text-gray-500" />
                  </TouchableOpacity>
                </HStack>

                <VStack space="xs">
                  <Text className="text-sm font-semibold text-gray-700">
                    Title *
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Assignment title"
                    value={createTitle}
                    onChangeText={setCreateTitle}
                    placeholderTextColor="#9CA3AF"
                  />
                </VStack>

                <VStack space="xs">
                  <Text className="text-sm font-semibold text-gray-700">
                    Description *
                  </Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe the assignment"
                    value={createDescription}
                    onChangeText={setCreateDescription}
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                  />
                </VStack>

                <VStack space="xs">
                  <Text className="text-sm font-semibold text-gray-700">
                    Due Date * (YYYY-MM-DD HH:MM)
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="2024-12-31 23:59"
                    value={createDueDate}
                    onChangeText={setCreateDueDate}
                    placeholderTextColor="#9CA3AF"
                  />
                </VStack>

                <VStack space="xs">
                  <Text className="text-sm font-semibold text-gray-700">
                    Max Score
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="100"
                    value={createMaxScore}
                    onChangeText={setCreateMaxScore}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </VStack>

                <VStack space="xs">
                  <Text className="text-sm font-semibold text-gray-700">
                    Attachment URL
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="https://example.com/file.pdf"
                    value={createAttachmentUrl}
                    onChangeText={setCreateAttachmentUrl}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </VStack>

                <HStack space="sm" className="mt-4">
                  <TouchableOpacity
                    onPress={resetCreateForm}
                    style={[styles.button, styles.buttonSecondary]}
                    disabled={creating}
                  >
                    <Text className="text-black font-semibold">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleCreate}
                    style={[styles.button, styles.buttonPrimary]}
                    disabled={creating || !createTitle.trim() || !createDescription.trim()}
                  >
                    {creating ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text className="text-white font-semibold">Create</Text>
                    )}
                  </TouchableOpacity>
                </HStack>
              </VStack>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Assignment Detail/Submit Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowDetailModal(false);
          setSelectedAssignment(null);
          setSubmitUrl("");
          setSubmitText("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            <ScrollView contentContainerStyle={styles.detailModalContent}>
              {selectedAssignment && (
                <VStack space="lg">
                  <HStack className="justify-between items-center">
                    <Text className="text-xl font-bold text-black">
                      {selectedAssignment.title}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShowDetailModal(false);
                        setSelectedAssignment(null);
                      }}
                    >
                      <Icon as={X} size="lg" className="text-gray-500" />
                    </TouchableOpacity>
                  </HStack>

                  <VStack space="sm">
                    <Text className="text-sm font-semibold text-gray-700">
                      Description
                    </Text>
                    <Text className="text-base text-gray-900">
                      {selectedAssignment.description}
                    </Text>
                  </VStack>

                  {selectedAssignment.maxScore && (
                    <Text className="text-sm text-gray-600">
                      Max Score: {selectedAssignment.maxScore}
                    </Text>
                  )}

                  {selectedAssignment.attachmentUrl && (
                    <TouchableOpacity
                      onPress={() => {
                        // Open attachment
                      }}
                    >
                      <Text className="text-sm text-blue-600 underline">
                        View Attachment
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Submit Section (for students who haven't submitted) */}
                  {canSubmit && selectedAssignment.submissionStatus === "pending" && (
                    <VStack space="md" className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <Text className="text-base font-bold text-black">
                        Submit Assignment
                      </Text>

                      <VStack space="xs">
                        <Text className="text-sm font-semibold text-gray-700">
                          Submission URL
                        </Text>
                        <TextInput
                          style={styles.input}
                          placeholder="https://example.com/submission.pdf"
                          value={submitUrl}
                          onChangeText={setSubmitUrl}
                          placeholderTextColor="#9CA3AF"
                          keyboardType="url"
                          autoCapitalize="none"
                        />
                      </VStack>

                      <VStack space="xs">
                        <Text className="text-sm font-semibold text-gray-700">
                          Or Write Text
                        </Text>
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          placeholder="Write your submission here..."
                          value={submitText}
                          onChangeText={setSubmitText}
                          placeholderTextColor="#9CA3AF"
                          multiline
                          numberOfLines={6}
                        />
                      </VStack>

                      <TouchableOpacity
                        onPress={handleSubmit}
                        style={[styles.button, styles.buttonPrimary]}
                        disabled={submitting || (!submitUrl.trim() && !submitText.trim())}
                      >
                        {submitting ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text className="text-white font-semibold">Submit</Text>
                        )}
                      </TouchableOpacity>
                    </VStack>
                  )}

                  {/* Submission Info (if already submitted) */}
                  {selectedAssignment.submission && (
                    <VStack space="sm" className="mt-4 p-4 bg-green-50 rounded-lg">
                      <Text className="text-base font-bold text-green-900">
                        Your Submission
                      </Text>

                      {selectedAssignment.submission.submissionUrl && (
                        <Text className="text-sm text-gray-700">
                          URL: {selectedAssignment.submission.submissionUrl}
                        </Text>
                      )}

                      {selectedAssignment.submission.submissionText && (
                        <Text className="text-sm text-gray-700">
                          {selectedAssignment.submission.submissionText}
                        </Text>
                      )}

                      {selectedAssignment.submission.grade !== undefined && (
                        <VStack space="xs" className="mt-2">
                          <Text className="text-lg font-bold text-green-700">
                            Grade: {selectedAssignment.submission.grade}
                            {selectedAssignment.maxScore && `/${selectedAssignment.maxScore}`}
                          </Text>

                          {selectedAssignment.submission.feedback && (
                            <VStack space="xs">
                              <Text className="text-sm font-semibold text-gray-700">
                                Feedback:
                              </Text>
                              <Text className="text-sm text-gray-700">
                                {selectedAssignment.submission.feedback}
                              </Text>
                            </VStack>
                          )}
                        </VStack>
                      )}
                    </VStack>
                  )}
                </VStack>
              )}
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
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  iconButtonActive: {
    backgroundColor: "#000000",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    marginHorizontal: 16,
    marginBottom: 12,
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
  activeFilter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingMore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  endMessage: {
    paddingVertical: 16,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  filterModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  filterOption: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterOptionActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  createModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  createModalContent: {
    padding: 24,
  },
  detailModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  detailModalContent: {
    padding: 24,
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
  textArea: {
    height: 100,
    textAlignVertical: "top",
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
    backgroundColor: "#000000",
  },
});
