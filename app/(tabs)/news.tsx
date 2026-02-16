import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Image,
  Dimensions,
  Alert,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Plus,
  Pin,
  Clock,
  Users,
  Bell,
  Filter,
  BookOpen,
  Calendar,
  FileText,
  Image as ImageIcon,
  Video,
  ExternalLink,
  Shield,
  Heart,
  User,
  GraduationCap,
  ChevronRight,
  MoreVertical,
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

import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import type { MediaAttachment, TargetAudience } from "@/types";

const { width } = Dimensions.get("window");

const profileImages: Record<string, { male: any; female: any }> = {
  student: {
    male: require("@/assets/images/profile/student_male.png"),
    female: require("@/assets/images/profile/student_female.png"),
  },
  teacher: {
    male: require("@/assets/images/profile/teacher_male.png"),
    female: require("@/assets/images/profile/teacher_female.png"),
  },
  parent: {
    male: require("@/assets/images/profile/parent_male.png"),
    female: require("@/assets/images/profile/parent_female.png"),
  },
  admin: {
    male: require("@/assets/images/profile/admin_male.png"),
    female: require("@/assets/images/profile/admin_female.png"),
  },
};

const roleConfig: Record<string, {
  color: string;
  accentColor: string;
  icon: any;
  label: string;
  bgColor: string;
  lightBg: string;
  darkBorder: string;
}> = {
  student: {
    color: "#BCF3FF",
    accentColor: "#BCF3FF",
    icon: GraduationCap,
    label: "Student",
    bgColor: "#E5FBFF",
    lightBg: "rgba(188, 243, 255, 0.25)",
    darkBorder: "#7DD3E8",
  },
  teacher: {
    color: "#F96857",
    accentColor: "#F96857",
    icon: User,
    label: "Teacher",
    bgColor: "#FDE1DD",
    lightBg: "rgba(249, 104, 87, 0.25)",
    darkBorder: "#E54D3C",
  },
  parent: {
    color: "#F9CD61",
    accentColor: "#F9CD61",
    icon: Heart,
    label: "Parent",
    bgColor: "#FDF3D1",
    lightBg: "rgba(249, 205, 97, 0.25)",
    darkBorder: "#E5B84D",
  },
  admin: {
    color: "#7477FF",
    accentColor: "#7477FF",
    icon: Shield,
    label: "Admin",
    bgColor: "#E1E3FF",
    lightBg: "rgba(116, 119, 255, 0.25)",
    darkBorder: "#5A5DE8",
  },
};

interface NewsPost {
  id: string;
  title: string;
  content: string;
  mediaUrls?: string[];
  media?: MediaAttachment[];
  postedBy: string;
  authorName: string;
  authorRole: string;
  isAnonymous: boolean;
  isPinned: boolean;
  targetAudience: TargetAudience;
  createdAt: Timestamp | Date;
}

export default function NewsScreen() {
  const { userData, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

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

  const userRole = role || "student";
  const gender = userData?.gender || "male";
  const config = roleConfig[userRole] || roleConfig.student;

  const getProfileImage = () => {
    const roleImages = profileImages[userRole] || profileImages.student;
    return roleImages[gender] || roleImages.male;
  };

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
          media: data.media || [],
          postedBy: data.postedBy || "",
          authorName: data.authorName || "Unknown",
          authorRole: data.authorRole || "teacher",
          isAnonymous: data.isAnonymous || false,
          isPinned: data.isPinned || false,
          targetAudience: data.targetAudience || { type: "all" },
          createdAt: data.createdAt,
        });
      });

      const filteredPosts = filterPostsByAudience(allPosts);

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
    if (role === "admin") return allPosts;

    return allPosts.filter((post) => {
      const audience = post.targetAudience;
      if (audience.type === "all") return true;

      if (role === "student" && userData.role === "student") {
        if (audience.type === "department") {
          return audience.departmentId === userData.departmentId;
        }
        if (audience.type === "semester") {
          return audience.semester === userData.semester;
        }
        if (audience.type === "departmentSemester") {
          return (
            audience.departmentId === userData.departmentId &&
            audience.semester === userData.semester
          );
        }
      }

      if (role === "teacher" && userData.role === "teacher") {
        if (audience.type === "department") {
          return audience.departmentId === userData.departmentId;
        }
        if (audience.type === "departmentSemester") {
          return audience.departmentId === userData.departmentId;
        }
      }

      if (role === "parent") {
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
    if (audience.type === "department") return `${audience.departmentId}`;
    if (audience.type === "semester") return `Sem ${audience.semester}`;
    if (audience.type === "departmentSemester") {
      return `${audience.departmentId} - Sem ${audience.semester}`;
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

  const getMediaList = (post: NewsPost): MediaAttachment[] => {
    if (post.media && post.media.length > 0) {
      return post.media;
    }
    if (post.mediaUrls && post.mediaUrls.length > 0) {
      return post.mediaUrls.map((url) => ({
        url,
        storagePath: "",
        fileName: "Attachment",
        mimeType: url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
          ? "image/jpeg"
          : "application/octet-stream",
        fileSize: 0,
      }));
    }
    return [];
  };

  const isImageFile = (mimeType: string) => {
    return mimeType.startsWith("image/");
  };

  const handleFilePress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open this file type");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open file");
    }
  };

  const canCreatePost = role === "teacher" || role === "admin";

  const getAuthorColor = (authorRole: string) => {
    switch (authorRole) {
      case "admin":
        return "#7477FF";
      case "teacher":
        return "#F96857";
      default:
        return "#BCF3FF";
    }
  };

  if (authLoading || (loading && !refreshing)) {
    return (
      <View className="flex-1 bg-[#1C1C1E] items-center justify-center">
        <View className="w-16 h-16 rounded-full bg-[#2A2A2D] items-center justify-center">
          <View className="w-8 h-8 rounded-full border-2 border-[#BCF3FF] border-t-transparent animate-spin" />
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#BCF3FF"
            colors={["#BCF3FF"]}
          />
        }
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
              onPress={() => router.push("/(tabs)/profile")}
              className="w-12 h-12 rounded-full items-center justify-center overflow-hidden"
              style={{
                backgroundColor: config.lightBg,
                borderWidth: 2,
                borderColor: config.darkBorder,
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
                backgroundColor: config.lightBg,
                borderWidth: 2,
                borderColor: config.darkBorder,
              }}
            >
              <Icon 
                as={Pin} 
                size="md" 
                style={{ color: showPinnedOnly ? "#F96857" : config.darkBorder }} 
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Dark Content Card */}
        <View className="bg-[#1C1C1E] rounded-t-3xl -mt-6 px-6 pt-8 pb-6">
          {/* Header Section */}
          <HStack className="justify-between items-center mb-6">
            <VStack>
              <Text className="text-white text-2xl font-bold">News & Updates</Text>
              <Text className="text-[#6B7280] text-sm mt-1">
                {showPinnedOnly ? "Showing pinned posts" : `${posts.length} posts available`}
              </Text>
            </VStack>
            {canCreatePost && (
              <TouchableOpacity
                onPress={() => router.push("/create-post")}
                className="bg-[#BCF3FF] px-4 py-2 rounded-full"
              >
                <HStack className="items-center" space="sm">
                  <Icon as={Plus} size="sm" className="text-black" />
                  <Text className="text-black font-semibold text-sm">Post</Text>
                </HStack>
              </TouchableOpacity>
            )}
          </HStack>

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
          {posts.length === 0 ? (
            <View className="bg-[#2A2A2D] rounded-2xl p-8 items-center">
              <Icon as={Bell} size="xl" className="text-[#3C443F] mb-4" />
              <Text className="text-white text-lg font-semibold text-center mb-2">
                No posts yet
              </Text>
              <Text className="text-[#6B7280] text-sm text-center">
                {showPinnedOnly
                  ? "No pinned posts available"
                  : "Check back later for updates and announcements"}
              </Text>
            </View>
          ) : (
            <VStack space="md">
              {posts.map((post, index) => {
                const media = getMediaList(post);
                const images = media.filter((m) => isImageFile(m.mimeType));
                const authorColor = getAuthorColor(post.authorRole);

                return (
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
                            className="rounded-full"
                            style={{ backgroundColor: authorColor }}
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
                              <View 
                                className="px-2 py-0.5 rounded"
                                style={{ backgroundColor: `${authorColor}30` }}
                              >
                                <Text 
                                  className="text-xs font-semibold capitalize"
                                  style={{ color: authorColor }}
                                >
                                  {post.authorRole}
                                </Text>
                              </View>
                              <Icon as={Clock} size="2xs" className="text-[#6B7280]" />
                              <Text className="text-[#6B7280] text-xs">
                                {formatTimestamp(post.createdAt)}
                              </Text>
                            </HStack>
                          </VStack>
                        </HStack>

                        <View 
                          className="px-2 py-1 rounded-lg"
                          style={{ backgroundColor: "#1C1C1E" }}
                        >
                          <Text className="text-[#C5D4CA] text-xs">
                            {getAudienceBadge(post.targetAudience)}
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

                      {/* Image Gallery */}
                      {images.length > 0 && (
                        <View className="mb-4">
                          {images.length === 1 ? (
                            <TouchableOpacity
                              onPress={() => handleFilePress(images[0].url)}
                              activeOpacity={0.9}
                            >
                              <Image
                                source={{ uri: images[0].url }}
                                style={{
                                  width: "100%",
                                  height: 200,
                                  borderRadius: 12,
                                }}
                                resizeMode="cover"
                              />
                            </TouchableOpacity>
                          ) : (
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                            >
                              {images.map((item, idx) => (
                                <TouchableOpacity
                                  key={idx}
                                  onPress={() => handleFilePress(item.url)}
                                  activeOpacity={0.9}
                                >
                                  <Image
                                    source={{ uri: item.url }}
                                    style={{
                                      width: 150,
                                      height: 150,
                                      borderRadius: 12,
                                      marginRight: 8,
                                    }}
                                    resizeMode="cover"
                                  />
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          )}
                        </View>
                      )}

                      {/* Attachments */}
                      {media.length > images.length && (
                        <View className="bg-[#1C1C1E] rounded-xl p-3">
                          <Text className="text-[#6B7280] text-xs mb-2">
                            {media.length - images.length} attachment{media.length - images.length > 1 ? "s" : ""}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </VStack>
          )}

          {/* Bottom Padding */}
          <View className="h-24" />
        </View>
      </Animated.ScrollView>
    </View>
  );
}
