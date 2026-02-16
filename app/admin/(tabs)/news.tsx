import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Plus,
  Pin,
  Clock,
  Users,
  Settings,
  Search,
  Filter,
  User,
  Shield,
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit3,
  Bell,
} from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import { collection, query, orderBy, getDocs, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewsPost } from "@/types";
import { EditNewsModal } from "@/components/news/EditNewsModal";

import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";

const { width } = Dimensions.get("window");

const roleConfig = {
  color: "#7477FF",
  accentColor: "#7477FF",
  icon: Shield,
  label: "Admin",
  bgColor: "#E1E3FF",
  lightBg: "rgba(116, 119, 255, 0.25)",
  darkBorder: "#5A5DE8",
};

export default function AdminNewsScreen() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null);

  const scrollY = new Animated.Value(0);
  const HEADER_MAX_HEIGHT = 280;
  const HEADER_MIN_HEIGHT = 100;
  const COLLAPSE_RANGE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, COLLAPSE_RANGE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: "clamp",
  });

  const imageScale = scrollY.interpolate({
    inputRange: [0, COLLAPSE_RANGE],
    outputRange: [1, 0.6],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, COLLAPSE_RANGE / 2, COLLAPSE_RANGE],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

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
              Alert.alert("Error", "Failed to delete post");
            }
          },
        },
      ]
    );
  };

  const handleEdit = (post: NewsPost) => {
    setEditingPost(post);
    setShowEditModal(true);
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

  const getProfileImage = () => {
    const gender = userData?.gender || "male";
    return gender === "female" 
      ? require("@/assets/images/profile/admin_female.png")
      : require("@/assets/images/profile/admin_male.png");
  };

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
        return `${targetAudience.departmentId || "Unknown"}`;
      case "semester":
        return `Sem ${targetAudience.semester}`;
      case "departmentSemester":
        return `${targetAudience.departmentId} - Sem ${targetAudience.semester}`;
      default:
        return "Everyone";
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "A";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-[#1C1C1E] items-center justify-center">
        <View className="w-16 h-16 rounded-full bg-[#2A2A2D] items-center justify-center">
          <View className="w-8 h-8 rounded-full border-2 border-[#7477FF] border-t-transparent animate-spin" />
        </View>
        <Text className="text-[#C5D4CA] mt-4 text-base">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#1C1C1E]">
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated Header with news.png Illustration */}
        <Animated.View
          style={{
            height: headerHeight,
            backgroundColor: "#2A2A2D",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            minHeight: HEADER_MIN_HEIGHT,
          }}
        >
          <Animated.Image
            source={require("@/assets/images/news.png")}
            style={{
              width: "100%",
              height: "100%",
              transform: [{ scale: imageScale }],
              opacity: headerOpacity,
            }}
            resizeMode="cover"
          />
          
          {/* Header Buttons with Role-based Colors */}
          <View className="absolute top-12 left-0 right-0 px-6 flex-row justify-between items-center">
            <TouchableOpacity
              onPress={() => router.push("/admin/profile")}
              className="w-12 h-12 rounded-full items-center justify-center overflow-hidden"
              style={{
                backgroundColor: roleConfig.lightBg,
                borderWidth: 2,
                borderColor: roleConfig.darkBorder,
              }}
            >
              <Image
                source={getProfileImage()}
                style={{ width: 36, height: 36 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setShowPinnedOnly(!showPinnedOnly)}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{
                backgroundColor: roleConfig.lightBg,
                borderWidth: 2,
                borderColor: roleConfig.darkBorder,
              }}
            >
              <Icon 
                as={Pin} 
                size="md" 
                style={{ color: showPinnedOnly ? "#F96857" : roleConfig.darkBorder }} 
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Dark Content Card */}
        <View className="bg-[#1C1C1E] rounded-t-3xl -mt-6 px-6 pt-8 pb-6">
          {/* Header Section */}
          <HStack className="justify-between items-center mb-6">
            <VStack>
              <Text className="text-white text-2xl font-bold">News & Announcements</Text>
              <Text className="text-[#6B7280] text-sm mt-1">
                {showPinnedOnly ? "Showing pinned posts" : `${filteredPosts.length} posts`}
              </Text>
            </VStack>
            <TouchableOpacity
              onPress={() => router.push("/create-post")}
              className="bg-[#BCF3FF] px-4 py-2 rounded-full"
            >
              <HStack className="items-center" space="sm">
                <Icon as={Plus} size="sm" className="text-black" />
                <Text className="text-black font-semibold text-sm">New</Text>
              </HStack>
            </TouchableOpacity>
          </HStack>

          {/* Stats Overview */}
          <View className="bg-[#2A2A2D] rounded-2xl p-5 mb-6">
            <HStack className="justify-around">
              <VStack className="items-center">
                <Text className="text-white text-2xl font-bold">{posts.length}</Text>
                <Text className="text-[#6B7280] text-xs mt-1">Total Posts</Text>
              </VStack>
              <View className="w-px bg-[#3C443F]" />
              <VStack className="items-center">
                <Text className="text-white text-2xl font-bold">
                  {posts.filter((p) => p.isPinned).length}
                </Text>
                <Text className="text-[#6B7280] text-xs mt-1">Pinned</Text>
              </VStack>
              <View className="w-px bg-[#3C443F]" />
              <VStack className="items-center">
                <Text className="text-white text-2xl font-bold">
                  {posts.filter((p) => p.targetAudience.type === "all").length}
                </Text>
                <Text className="text-[#6B7280] text-xs mt-1">General</Text>
              </VStack>
            </HStack>
          </View>

          {/* Filter Tabs */}
          <HStack className="mb-6" space="sm">
            <TouchableOpacity
              onPress={() => setShowPinnedOnly(false)}
              className={`flex-1 py-3 rounded-xl ${
                !showPinnedOnly ? "bg-[#2A2A2D]" : "bg-transparent"
              }`}
              style={!showPinnedOnly ? { borderWidth: 1, borderColor: "#3C443F" } : {}}
            >
              <Text className={`text-center font-semibold ${!showPinnedOnly ? "text-white" : "text-[#6B7280]"}`}>
                All Posts
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowPinnedOnly(true)}
              className={`flex-1 py-3 rounded-xl ${
                showPinnedOnly ? "bg-[#F9CD61]" : "bg-transparent"
              }`}
            >
              <Text className={`text-center font-semibold ${showPinnedOnly ? "text-black" : "text-[#6B7280]"}`}>
                Pinned
              </Text>
            </TouchableOpacity>
          </HStack>

          {/* News Posts */}
          {filteredPosts.length === 0 ? (
            <View className="bg-[#2A2A2D] rounded-2xl p-8 items-center">
              <Icon as={Bell} size="xl" className="text-[#3C443F] mb-4" />
              <Text className="text-white text-lg font-semibold text-center mb-2">
                No posts found
              </Text>
              <Text className="text-[#6B7280] text-sm text-center">
                {showPinnedOnly ? "No pinned posts" : "Create your first announcement"}
              </Text>
            </View>
          ) : (
            <VStack space="md">
              {filteredPosts.map((post) => (
                <View 
                  key={post.id} 
                  className="bg-[#2A2A2D] rounded-2xl overflow-hidden"
                  style={post.isPinned ? { borderWidth: 2, borderColor: "#F9CD61" } : {}}
                >
                  {/* Pinned Badge */}
                  {post.isPinned && (
                    <View className="bg-[#F9CD61] px-4 py-2">
                      <HStack className="items-center" space="sm">
                        <Icon as={Pin} size="xs" className="text-black" />
                        <Text className="text-black text-xs font-bold">PINNED POST</Text>
                      </HStack>
                    </View>
                  )}

                  <View className="p-5">
                    {/* Author Section */}
                    <HStack className="items-center justify-between mb-4">
                      <HStack className="items-center flex-1" space="sm">
                        <Avatar 
                          size="sm" 
                          className="rounded-full bg-[#BCF3FF]"
                        >
                          <AvatarFallbackText className="text-black font-bold text-xs">
                            {post.isAnonymous ? "A" : getInitials(post.authorName)}
                          </AvatarFallbackText>
                        </Avatar>
                        <VStack className="flex-1">
                          <Text className="text-white font-semibold text-sm">
                            {post.isAnonymous ? "Anonymous" : post.authorName}
                          </Text>
                          <HStack className="items-center mt-0.5" space="xs">
                            <Text className="text-[#BCF3FF] text-xs capitalize">
                              {post.authorRole}
                            </Text>
                            <Text className="text-[#3C443F]">•</Text>
                            <Text className="text-[#6B7280] text-xs">
                              {formatTimeAgo(post.createdAt)}
                            </Text>
                          </HStack>
                        </VStack>
                      </HStack>

                      <View 
                        className="px-2 py-1 rounded-lg"
                        style={{ backgroundColor: "#1C1C1E" }}
                      >
                        <Text className="text-[#C5D4CA] text-xs">
                          {getTargetAudienceLabel(post)}
                        </Text>
                      </View>
                    </HStack>

                    {/* Title */}
                    {post.title && (
                      <Text className="text-white font-bold text-lg mb-2">
                        {post.title}
                      </Text>
                    )}

                    {/* Content */}
                    <Text className="text-[#C5D4CA] text-base leading-6 mb-4">
                      {post.content}
                    </Text>

                    {/* Media Preview */}
                    {post.mediaUrls && post.mediaUrls.length > 0 && (
                      <View className="bg-[#1C1C1E] rounded-xl p-3 mb-4">
                        <Text className="text-[#6B7280] text-xs">
                          {post.mediaUrls.length} attachment{post.mediaUrls.length > 1 ? "s" : ""}
                        </Text>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <HStack className="justify-end" space="sm">
                      <TouchableOpacity
                        onPress={() => handleEdit(post)}
                        className="flex-row items-center bg-[#BCF3FF]/10 px-4 py-2 rounded-xl"
                      >
                        <Icon as={Edit3} size="sm" className="text-[#BCF3FF] mr-2" />
                        <Text className="text-[#BCF3FF] font-semibold text-sm">Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeletePost(post.id)}
                        className="flex-row items-center bg-[#F96857]/10 px-4 py-2 rounded-xl"
                      >
                        <Icon as={Trash2} size="sm" className="text-[#F96857] mr-2" />
                        <Text className="text-[#F96857] font-semibold text-sm">Delete</Text>
                      </TouchableOpacity>
                    </HStack>
                  </View>
                </View>
              ))}
            </VStack>
          )}

          {/* Bottom Padding */}
          <View className="h-24" />
        </View>
      </Animated.ScrollView>

      {/* Edit News Modal */}
      <EditNewsModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingPost(null);
        }}
        post={editingPost}
        onPostUpdated={() => {
          fetchPosts();
        }}
      />
    </View>
  );
}
