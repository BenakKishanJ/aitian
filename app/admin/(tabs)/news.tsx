import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import {
  Bell,
  Plus,
  Search,
  Filter,
  Pin,
  MoreVertical,
  Trash2,
  Edit3,
  User,
} from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import { collection, query, orderBy, getDocs, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewsPost } from "@/types";

export default function AdminNewsScreen() {
  const { user, userData, role } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const postsRef = collection(db, "newsPosts");
      const postsQuery = query(postsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(postsQuery);

      const fetchedPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as NewsPost[];

      setPosts(fetchedPosts);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const handleDeletePost = async (postId: string) => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "newsPosts", postId));
              fetchPosts();
            } catch (error) {
              console.error("Error deleting post:", error);
              Alert.alert("Error", "Failed to delete post");
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter((post) => {
    if (showPinnedOnly && !post.isPinned) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        post.title?.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const formatTimeAgo = (timestamp: Timestamp | Date) => {
    if (!timestamp) return "";
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getTargetAudienceLabel = (post: NewsPost) => {
    const { targetAudience } = post;
    switch (targetAudience.type) {
      case "all":
        return "Everyone";
      case "department":
        return `Dept: ${targetAudience.departmentId || "Unknown"}`;
      case "semester":
        return `Semester ${targetAudience.semester}`;
      case "departmentSemester":
        return `${targetAudience.departmentId} - Sem ${targetAudience.semester}`;
      default:
        return "Everyone";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <HStack space="md" style={styles.headerTop}>
          <Text style={styles.headerTitle}>News & Announcements</Text>
          <HStack space="sm">
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Search size={20} color="#000000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.iconButton,
                showPinnedOnly && styles.iconButtonActive,
              ]}
              onPress={() => setShowPinnedOnly(!showPinnedOnly)}
            >
              <Pin size={20} color={showPinnedOnly ? "#FFFFFF" : "#000000"} />
            </TouchableOpacity>
          </HStack>
        </HStack>

        {showSearch && (
          <View style={styles.searchContainer}>
            <Search size={16} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search posts..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        )}

        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <HStack space="lg">
            <VStack space="xs" style={styles.statItem}>
              <Text style={styles.statValue}>{posts.length}</Text>
              <Text style={styles.statLabel}>Total Posts</Text>
            </VStack>
            <VStack space="xs" style={styles.statItem}>
              <Text style={styles.statValue}>
                {posts.filter((p) => p.isPinned).length}
              </Text>
              <Text style={styles.statLabel}>Pinned</Text>
            </VStack>
          </HStack>
        </View>
      </View>

      {/* Posts List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {filteredPosts.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No Posts Found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? "No posts match your search"
                : showPinnedOnly
                ? "No pinned posts"
                : "No announcements yet"}
            </Text>
          </View>
        ) : (
          filteredPosts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              {post.isPinned && (
                <View style={styles.pinnedBadge}>
                  <Pin size={12} color="#FFFFFF" />
                  <Text style={styles.pinnedText}>Pinned</Text>
                </View>
              )}
              
              <HStack space="sm" style={styles.postHeader}>
                <View style={styles.avatar}>
                  <User size={20} color="#FFFFFF" />
                </View>
                <VStack space="xs" style={styles.authorInfo}>
                  <Text style={styles.authorName}>
                    {post.isAnonymous ? "Anonymous" : post.authorName}
                  </Text>
                  <HStack space="sm">
                    <Text style={styles.authorRole}>
                      {post.authorRole.charAt(0).toUpperCase() +
                        post.authorRole.slice(1)}
                    </Text>
                    <Text style={styles.timeAgo}>
                      {formatTimeAgo(post.createdAt)}
                    </Text>
                  </HStack>
                </VStack>
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={() => {
                    Alert.alert("Post Options", "", [
                      {
                        text: "Edit",
                        onPress: () => {
                          // TODO: Navigate to edit post
                        },
                      },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => handleDeletePost(post.id),
                      },
                      { text: "Cancel", style: "cancel" },
                    ]);
                  }}
                >
                  <MoreVertical size={20} color="#6B7280" />
                </TouchableOpacity>
              </HStack>

              <View style={styles.postContent}>
                {post.title && (
                  <Text style={styles.postTitle}>{post.title}</Text>
                )}
                <Text style={styles.postText}>{post.content}</Text>
              </View>

              <View style={styles.postFooter}>
                <View style={styles.audienceBadge}>
                  <Text style={styles.audienceText}>
                    {getTargetAudienceLabel(post)}
                  </Text>
                </View>
                {post.mediaUrls && post.mediaUrls.length > 0 && (
                  <Text style={styles.mediaText}>
                    {post.mediaUrls.length} image
                    {post.mediaUrls.length > 1 ? "s" : ""}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/create-post")}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTop: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
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
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#000000",
  },
  statsContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pinnedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000000",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  pinnedText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  postHeader: {
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  authorRole: {
    fontSize: 12,
    color: "#6B7280",
  },
  timeAgo: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  moreButton: {
    padding: 4,
  },
  postContent: {
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  postText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  audienceBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  audienceText: {
    fontSize: 11,
    color: "#6B7280",
  },
  mediaText: {
    fontSize: 12,
    color: "#9CA3AF",
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
