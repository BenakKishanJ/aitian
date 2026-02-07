import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Plus, MessageSquare, Search, Pin } from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import { useDiscussions } from "@/lib/hooks/useDiscussions";
import { DiscussionThreadCard } from "@/components/discussion/DiscussionThreadCard";
import { CreateDiscussionModal } from "@/components/discussion/CreateDiscussionModal";
import { EditDiscussionModal } from "@/components/discussion/EditDiscussionModal";
import { useCourseDetails } from "@/lib/hooks/useCourseDetails";
import type { Discussion } from "@/types";

export default function DiscussionsScreen() {
  const { courseInstanceId } = useLocalSearchParams<{
    courseInstanceId: string;
  }>();
  const router = useRouter();
  const { role, user } = useAuth();
  const isTeacherOrAdmin = role === "teacher" || role === "admin";
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDiscussion, setEditingDiscussion] = useState<Discussion | null>(null);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    courseDetails,
  } = useCourseDetails(courseInstanceId as string);

  const {
    discussions,
    loading,
    error,
    creating,
    createDiscussion,
    togglePin,
    deleteDiscussion,
    refresh,
  } = useDiscussions({
    courseInstanceId: courseInstanceId as string,
    pinnedOnly: showPinnedOnly,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleTogglePin = async (discussionId: string, currentPinned: boolean) => {
    try {
      await togglePin(discussionId, currentPinned);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to toggle pin");
    }
  };

  const handleDelete = async (discussionId: string) => {
    Alert.alert(
      "Delete Discussion",
      "Are you sure you want to delete this discussion? This will also delete all replies.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDiscussion(discussionId);
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete discussion");
            }
          },
        },
      ]
    );
  };

  const handleEdit = (discussion: Discussion) => {
    setEditingDiscussion(discussion);
    setShowEditModal(true);
  };

  const pinnedCount = discussions.filter((d) => d.isPinned).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <VStack space="xs">
          <Text style={styles.headerTitle}>Discussions</Text>
          <Text style={styles.courseName}>
            {courseDetails?.course?.name || "Loading..."}
          </Text>
        </VStack>

        {isTeacherOrAdmin && (
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowPinnedOnly(!showPinnedOnly)}
          >
            <Pin
              size={20}
              color={showPinnedOnly ? "#F59E0B" : "#6B7280"}
              fill={showPinnedOnly ? "#F59E0B" : "transparent"}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <HStack space="lg">
          <HStack space="xs" style={styles.statItem}>
            <MessageSquare size={16} color="#6B7280" />
            <Text style={styles.statText}>
              {discussions.length} {discussions.length === 1 ? "topic" : "topics"}
            </Text>
          </HStack>
          {pinnedCount > 0 && (
            <HStack space="xs" style={styles.statItem}>
              <Pin size={16} color="#F59E0B" />
              <Text style={[styles.statText, { color: "#F59E0B" }]}>
                {pinnedCount} pinned
              </Text>
            </HStack>
          )}
        </HStack>
      </View>

      {/* Discussion List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading discussions...</Text>
          </View>
        ) : discussions.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageSquare size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>
              {showPinnedOnly ? "No Pinned Discussions" : "No Discussions Yet"}
            </Text>
            <Text style={styles.emptyText}>
              {showPinnedOnly
                ? "There are no pinned discussions in this course."
                : "Be the first to start a discussion!"}
            </Text>
          </View>
        ) : (
          <VStack space="sm">
            {discussions.map((discussion) => (
              <DiscussionThreadCard
                key={discussion.id}
                discussion={discussion}
                onPress={() =>
                  router.push(
                    `/(tabs)/academics/${courseInstanceId}/discussion/${discussion.id}`
                  )
                }
                onTogglePin={() => handleTogglePin(discussion.id, discussion.isPinned || false)}
                onDelete={() => handleDelete(discussion.id)}
                onEdit={() => handleEdit(discussion)}
                showActions={isTeacherOrAdmin || discussion.createdBy === user?.uid}
              />
            ))}
          </VStack>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB for Create */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Create Discussion Modal */}
      <CreateDiscussionModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        courseInstanceId={courseInstanceId as string}
        courseName={courseDetails?.course?.name || "Course"}
        onDiscussionCreated={(discussionId) => {
          router.push(
            `/(tabs)/academics/${courseInstanceId}/discussion/${discussionId}`
          );
        }}
      />

      {/* Edit Discussion Modal */}
      <EditDiscussionModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingDiscussion(null);
        }}
        discussion={editingDiscussion}
        courseInstanceId={courseInstanceId as string}
        courseName={courseDetails?.course?.name || "Course"}
        onDiscussionUpdated={() => {
          refresh();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
  },
  courseName: {
    fontSize: 14,
    color: "#6B7280",
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  statsBar: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  statItem: {
    alignItems: "center",
  },
  statText: {
    fontSize: 14,
    color: "#6B7280",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});
