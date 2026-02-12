import React, { useState, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import {
  ArrowLeft,
  MessageSquare,
  Send,
  User,
  GraduationCap,
  Shield,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  Pin,
  ShieldAlert,
} from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import { useDiscussions } from "@/lib/hooks/useDiscussions";
import { useDiscussionReplies } from "@/lib/hooks/useDiscussionReplies";
import { DiscussionReplyCard } from "@/components/discussion/DiscussionReplyCard";
import { collection, query, where, getDocs, writeBatch, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/types/constants";

export default function AdminDiscussionDetailScreen() {
  const { courseInstanceId, discussionId } = useLocalSearchParams<{
    courseInstanceId: string;
    discussionId: string;
  }>();
  const router = useRouter();
  const { role, user, userData } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [replyContent, setReplyContent] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [deletingReplies, setDeletingReplies] = useState(false);

  const {
    discussions,
    loading: discussionsLoading,
    togglePin,
    updateDiscussion,
    deleteDiscussion,
    refresh: refreshDiscussions,
  } = useDiscussions({
    courseInstanceId: courseInstanceId as string,
  });

  const discussion = discussions.find((d) => d.id === discussionId);

  const {
    replies,
    loading: repliesLoading,
    creating,
    createReply,
    updateReply,
    deleteReply,
    refresh: refreshReplies,
  } = useDiscussionReplies({
    threadId: discussionId as string,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshDiscussions(), refreshReplies()]);
    setRefreshing(false);
  };

  const handleSendReply = async () => {
    if (!replyContent.trim()) return;

    try {
      await createReply(replyContent.trim());
      setReplyContent("");
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to send reply");
    }
  };

  const handleTogglePin = async () => {
    if (!discussion) return;
    try {
      await togglePin(discussion.id, discussion.isPinned || false);
      Alert.alert(
        "Success",
        discussion.isPinned ? "Discussion unpinned" : "Discussion pinned"
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to toggle pin");
    }
  };

  const handleDeleteDiscussion = () => {
    Alert.alert(
      "Delete Discussion",
      "Are you sure you want to delete this discussion? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDiscussion(discussionId as string);
              router.back();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete discussion");
            }
          },
        },
      ]
    );
  };

  const handleDeleteAllReplies = async () => {
    Alert.alert(
      "Delete All Replies",
      "Are you sure you want to delete ALL replies in this discussion? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            setDeletingReplies(true);
            try {
              const batch = writeBatch(db);
              const repliesQuery = query(
                collection(db, COLLECTIONS.DISCUSSION_REPLIES),
                where("threadId", "==", discussionId)
              );
              const repliesSnap = await getDocs(repliesQuery);
              repliesSnap.docs.forEach((replyDoc) => {
                batch.delete(replyDoc.ref);
              });
              await batch.commit();
              await refreshReplies();
              Alert.alert("Success", "All replies deleted successfully");
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete replies");
            } finally {
              setDeletingReplies(false);
            }
          },
        },
      ]
    );
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getRoleIcon = () => {
    if (!discussion) return null;
    switch (discussion.createdByRole) {
      case "teacher":
        return <GraduationCap size={16} color="#FFFFFF" />;
      case "admin":
        return <Shield size={16} color="#FFFFFF" />;
      default:
        return <User size={16} color="#FFFFFF" />;
    }
  };

  const getRoleColor = () => {
    if (!discussion) return "#6B7280";
    switch (discussion.createdByRole) {
      case "teacher":
        return "#3B82F6";
      case "admin":
        return "#8B5CF6";
      default:
        return "#6B7280";
    }
  };

  if (discussionsLoading || !discussion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000000" />
        </TouchableOpacity>
        
        <HStack space="sm" className="items-center flex-1 justify-center">
          <ShieldAlert size={18} color="#8B5CF6" />
          <Text style={styles.headerTitle} numberOfLines={1}>
            Admin Discussion
          </Text>
        </HStack>

        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => {
            Alert.alert("Discussion Options", "", [
              {
                text: discussion.isPinned ? "Unpin Discussion" : "Pin Discussion",
                onPress: handleTogglePin,
              },
              ...(replies.length > 0
                ? [
                    {
                      text: "Delete All Replies",
                      style: "destructive" as const,
                      onPress: handleDeleteAllReplies,
                    },
                  ]
                : []),
              {
                text: "Delete Discussion",
                style: "destructive" as const,
                onPress: handleDeleteDiscussion,
              },
              { text: "Cancel", style: "cancel" as const },
            ]);
          }}
        >
          <MoreVertical size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Original Post */}
          <View style={styles.originalPost}>
            {discussion.isPinned && (
              <View style={styles.pinnedBadge}>
                <Pin size={12} color="#FFFFFF" />
                <Text style={styles.pinnedText}>Pinned</Text>
              </View>
            )}

            <HStack space="md" style={styles.postHeader}>
              <View style={[styles.avatar, { backgroundColor: getRoleColor() }]}>
                {getRoleIcon()}
              </View>
              <VStack space="xs" style={styles.authorInfo}>
                <Text style={styles.authorName}>{discussion.createdByName}</Text>
                <HStack space="sm" style={styles.metaRow}>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleColor() + "20" }]}>
                    <Text style={[styles.roleText, { color: getRoleColor() }]}>
                      {discussion.createdByRole?.toUpperCase() || "STUDENT"}
                    </Text>
                  </View>
                  <Clock size={12} color="#9CA3AF" />
                  <Text style={styles.timeText}>
                    {formatTimeAgo(discussion.createdAt)}
                  </Text>
                </HStack>
              </VStack>
            </HStack>

            <VStack space="sm" style={styles.postContent}>
              <Text style={styles.postTitle}>{discussion.title}</Text>
              <Text style={styles.postBody}>{discussion.content}</Text>
            </VStack>
          </View>

          {/* Replies Section */}
          <View style={styles.repliesSection}>
            <HStack space="sm" style={styles.repliesHeader}>
              <MessageSquare size={18} color="#000000" />
              <Text style={styles.repliesTitle}>
                {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
              </Text>
              {replies.length > 0 && (
                <TouchableOpacity
                  style={styles.deleteAllRepliesButton}
                  onPress={handleDeleteAllReplies}
                  disabled={deletingReplies}
                >
                  <Trash2 size={14} color="#EF4444" />
                  <Text style={styles.deleteAllRepliesText}>Delete All</Text>
                </TouchableOpacity>
              )}
            </HStack>

            {repliesLoading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : replies.length === 0 ? (
              <View style={styles.noReplies}>
                <Text style={styles.noRepliesText}>
                  No replies yet. Be the first to respond!
                </Text>
              </View>
            ) : (
              <VStack space="xs">
                {replies.map((reply, index) => (
                  <DiscussionReplyCard
                    key={reply.id}
                    reply={reply}
                    isFirst={index === 0}
                    currentUserId={user?.uid}
                    onEdit={(content) => updateReply(reply.id, content)}
                    onDelete={() => deleteReply(reply.id)}
                  />
                ))}
              </VStack>
            )}
            <View style={{ height: 100 }} />
          </View>
        </ScrollView>

        {/* Reply Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Write a reply as admin..."
            value={replyContent}
            onChangeText={setReplyContent}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!replyContent.trim() || creating) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendReply}
            disabled={!replyContent.trim() || creating}
          >
            {creating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
  },
  moreButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  originalPost: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  pinnedBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#F59E0B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
    gap: 4,
  },
  pinnedText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  postHeader: {
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
  },
  metaRow: {
    alignItems: "center",
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "600",
  },
  timeText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  postContent: {
    gap: 8,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
  },
  postBody: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  repliesSection: {
    flex: 1,
  },
  repliesHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  repliesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    flex: 1,
  },
  deleteAllRepliesButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deleteAllRepliesText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "600",
    marginLeft: 4,
  },
  noReplies: {
    paddingVertical: 40,
    alignItems: "center",
  },
  noRepliesText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#000000",
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
});
