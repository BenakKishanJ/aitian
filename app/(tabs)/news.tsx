import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Image,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Plus,
  Pin,
  Clock,
  Users,
  UserCircle,
  Filter,
  BookOpen,
  Calendar,
} from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/* Gluestack UI Components */
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import { Heading } from "@/components/ui/heading";

interface NewsPost {
  id: string;
  title: string;
  content: string;
  mediaUrls: string[];
  postedBy: string;
  authorName: string;
  authorRole: string;
  isAnonymous: boolean;
  isPinned: boolean;
  targetAudience: {
    type: "all" | "department" | "semester" | "departmentSemester";
    department?: string;
    semester?: number;
  };
  createdAt: Timestamp | Date;
}

const { width } = Dimensions.get("window");

export default function NewsScreen() {
  const { userData, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  useEffect(() => {
    if (!authLoading && userData) {
      fetchPosts();
    }
  }, [authLoading, userData, showPinnedOnly]);

  const fetchPosts = async () => {
    if (!userData) return;

    try {
      setLoading(true);
      const postsRef = collection(db, "newsPosts");
      let q = query(postsRef, orderBy("createdAt", "desc"), limit(50));

      const snapshot = await getDocs(q);
      const allPosts: NewsPost[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        allPosts.push({
          id: doc.id,
          title: data.title || "",
          content: data.content || "",
          mediaUrls: data.mediaUrls || [],
          postedBy: data.postedBy || "",
          authorName: data.authorName || "Unknown",
          authorRole: data.authorRole || "teacher",
          isAnonymous: data.isAnonymous || false,
          isPinned: data.isPinned || false,
          targetAudience: data.targetAudience || { type: "all" },
          createdAt: data.createdAt,
        });
      });

      // Filter posts based on user role and target audience
      const filteredPosts = filterPostsByAudience(allPosts);

      // Sort: pinned first, then by date
      const sortedPosts = filteredPosts.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const aTime =
          a.createdAt instanceof Timestamp
            ? a.createdAt.toMillis()
            : new Date(a.createdAt).getTime();
        const bTime =
          b.createdAt instanceof Timestamp
            ? b.createdAt.toMillis()
            : new Date(b.createdAt).getTime();
        return bTime - aTime;
      });

      if (showPinnedOnly) {
        setPosts(sortedPosts.filter((p) => p.isPinned));
      } else {
        setPosts(sortedPosts);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterPostsByAudience = (allPosts: NewsPost[]): NewsPost[] => {
    if (!userData) return [];

    // Admin sees all posts
    if (role === "admin") return allPosts;

    return allPosts.filter((post) => {
      const audience = post.targetAudience;

      // Everyone sees general posts
      if (audience.type === "all") return true;

      // Student filtering
      if (role === "student") {
        if (audience.type === "department") {
          return audience.department === userData.department;
        }
        if (audience.type === "semester") {
          return audience.semester === userData.semester;
        }
        if (audience.type === "departmentSemester") {
          return (
            audience.department === userData.department &&
            audience.semester === userData.semester
          );
        }
      }

      // Teacher filtering
      if (role === "teacher") {
        if (audience.type === "department") {
          return audience.department === userData.department;
        }
        // Teachers can see semester-specific posts in their department
        if (audience.type === "departmentSemester") {
          return audience.department === userData.department;
        }
      }

      // Parent filtering - see posts for linked students' departments
      if (role === "parent") {
        // For now, show all posts to parents (can be refined later)
        return true;
      }

      return false;
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, [userData, showPinnedOnly]);

  const formatTimestamp = (timestamp: Timestamp | Date) => {
    try {
      const date =
        timestamp instanceof Timestamp
          ? timestamp.toDate()
          : new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();

      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return "Just now";
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    } catch {
      return "Recently";
    }
  };

  const getAudienceBadge = (audience: NewsPost["targetAudience"]) => {
    if (audience.type === "all") return "Everyone";
    if (audience.type === "department") return `${audience.department} Dept`;
    if (audience.type === "semester") return `Semester ${audience.semester}`;
    if (audience.type === "departmentSemester") {
      return `${audience.department} - Sem ${audience.semester}`;
    }
    return "Everyone";
  };

  const getInitials = (name: string) => {
    if (!name) return "A";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const canCreatePost = role === "teacher" || role === "admin";

  const renderPostCard = ({ item }: { item: NewsPost }) => (
    <View className="bg-white mx-4 mb-4 rounded-lg border border-gray-200 overflow-hidden">
      {/* Pinned Badge */}
      {item.isPinned && (
        <View className="bg-black px-3 py-1.5">
          <HStack className="items-center" space="xs">
            <Icon as={Pin} size="xs" className="text-white" />
            <Text className="text-white text-xs font-semibold">
              PINNED POST
            </Text>
          </HStack>
        </View>
      )}

      <VStack className="p-4" space="md">
        {/* Author Section */}
        <HStack className="items-center justify-between">
          <HStack className="items-center flex-1" space="sm">
            <Avatar size="sm" className="bg-gray-200">
              <AvatarFallbackText className="text-gray-600">
                {item.isAnonymous ? "A" : getInitials(item.authorName)}
              </AvatarFallbackText>
            </Avatar>
            <VStack className="flex-1">
              <HStack className="items-center" space="xs">
                <Text className="text-black font-semibold text-sm">
                  {item.isAnonymous ? "Anonymous" : item.authorName}
                </Text>
                <Badge size="sm" variant="outline" className="border-gray-300">
                  <BadgeText className="text-gray-600 text-xs capitalize">
                    {item.authorRole}
                  </BadgeText>
                </Badge>
              </HStack>
              <HStack className="items-center mt-0.5" space="xs">
                <Icon as={Clock} size="xs" className="text-gray-400" />
                <Text className="text-gray-500 text-xs">
                  {formatTimestamp(item.createdAt)}
                </Text>
              </HStack>
            </VStack>
          </HStack>

          {/* Audience Badge */}
          <Badge size="sm" className="bg-gray-100">
            <BadgeText className="text-gray-700 text-xs">
              {getAudienceBadge(item.targetAudience)}
            </BadgeText>
          </Badge>
        </HStack>

        {/* Title */}
        {item.title && (
          <Text className="text-black font-bold text-lg">{item.title}</Text>
        )}

        {/* Content */}
        {item.content && (
          <Text className="text-gray-700 text-base leading-6">
            {item.content}
          </Text>
        )}

        {/* Media Gallery */}
        {item.mediaUrls.length > 0 && (
          <View className="mt-2">
            {item.mediaUrls.length === 1 ? (
              <Image
                source={{ uri: item.mediaUrls[0] }}
                style={{
                  width: "100%",
                  height: 200,
                  borderRadius: 8,
                }}
                resizeMode="cover"
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="gap-2"
              >
                {item.mediaUrls.map((url, index) => (
                  <Image
                    key={index}
                    source={{ uri: url }}
                    style={{
                      width: 150,
                      height: 150,
                      borderRadius: 8,
                      marginRight: 8,
                    }}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </VStack>
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <Icon as={Users} size="xl" className="text-gray-300 mb-4" />
      <Text className="text-gray-600 text-lg font-semibold text-center mb-2">
        No posts yet
      </Text>
      <Text className="text-gray-500 text-sm text-center">
        {showPinnedOnly
          ? "No pinned posts available"
          : "Check back later for updates and announcements"}
      </Text>
    </View>
  );

  if (authLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-600">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-black pt-16 pb-4 px-6">
        <HStack className="items-center justify-between mb-2">
          <Heading size="2xl" className="text-white font-bold">
            News Feed
          </Heading>
          <HStack space="sm">
            <TouchableOpacity
              onPress={() => setShowPinnedOnly(!showPinnedOnly)}
              className={`p-2 rounded-full ${
                showPinnedOnly ? "bg-white" : "bg-white/10"
              }`}
            >
              <Icon
                as={Pin}
                size="sm"
                className={showPinnedOnly ? "text-black" : "text-white"}
              />
            </TouchableOpacity>
          </HStack>
        </HStack>
        {showPinnedOnly && (
          <Text className="text-white/80 text-xs">
            Showing pinned posts only
          </Text>
        )}
      </View>

      {/* Posts List */}
      <FlatList
        data={posts}
        renderItem={renderPostCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 100,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB - Create Post (Teachers & Admins only) */}
      {canCreatePost && (
        <TouchableOpacity
          onPress={() => router.push("/create-post")}
          className="absolute bottom-8 right-6 bg-black rounded-full w-14 h-14 items-center justify-center shadow-lg"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 8,
          }}
        >
          <Icon as={Plus} size="lg" className="text-white" />
        </TouchableOpacity>
      )}
    </View>
  );
}
