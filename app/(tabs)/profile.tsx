import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import {
  User,
  Mail,
  BookOpen,
  Calendar,
  Hash,
  Users,
  LogOut,
  Edit2,
  Save,
  X,
  UserCircle,
  UserCheck,
  ChevronRight,
  Shield,
  GraduationCap,
  Heart,
  UserIcon,
} from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import {
  Avatar,
  AvatarImage,
  AvatarFallbackText,
} from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Heading } from "@/components/ui/heading";

interface LinkedUser {
  uid: string;
  name: string;
  email: string;
  usn?: string;
  departmentId?: string;
  department?: string;
  semester?: number;
  section?: string;
}

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
}> = {
  student: {
    color: "#BCF3FF",
    accentColor: "#BCF3FF",
    icon: GraduationCap,
    label: "Student",
    bgColor: "#E5FBFF",
  },
  teacher: {
    color: "#F96857",
    accentColor: "#F96857",
    icon: User,
    label: "Teacher",
    bgColor: "#FDE1DD",
  },
  parent: {
    color: "#F9CD61",
    accentColor: "#F9CD61",
    icon: Heart,
    label: "Parent",
    bgColor: "#FDF3D1",
  },
  admin: {
    color: "#7477FF",
    accentColor: "#7477FF",
    icon: Shield,
    label: "Admin",
    bgColor: "#E1E3FF",
  },
};

export default function ProfileScreen() {
  const { userData, user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedGender, setEditedGender] = useState<"male" | "female">("male");
  const [saving, setSaving] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);

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

  const role = userData?.role || "student";
  const gender = userData?.gender || "male";
  const config = roleConfig[role] || roleConfig.student;
  
  const getProfileImage = () => {
    const roleImages = profileImages[role] || profileImages.student;
    return roleImages[gender] || roleImages.male;
  };

  const fetchLinkedUsers = async () => {
    if (!userData) return;

    setLoadingLinks(true);
    try {
      const linksRef = collection(db, "parentLinks");
      let q;

      if (userData.role === "parent") {
        q = query(
          linksRef,
          where("parentId", "==", userData.uid),
          where("status", "==", "approved")
        );
      } else if (userData.role === "student") {
        q = query(
          linksRef,
          where("studentId", "==", userData.uid),
          where("status", "==", "approved")
        );
      } else {
        setLoadingLinks(false);
        return;
      }

      const snapshot = await getDocs(q);
      const userIds: string[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (userData.role === "parent") {
          userIds.push(data.studentId);
        } else {
          userIds.push(data.parentId);
        }
      });

      const users: LinkedUser[] = [];
      for (const uid of userIds) {
        const userDoc = await getDocs(
          query(collection(db, "users"), where("uid", "==", uid))
        );
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          users.push({
            uid: userData.uid,
            name: userData.name,
            email: userData.email,
            usn: userData.usn,
            departmentId: userData.departmentId || userData.department,
            semester: userData.semester,
            section: userData.section,
          });
        }
      }

      setLinkedUsers(users);
    } catch (error) {
      console.error("Error fetching linked users:", error);
      Alert.alert("Error", "Failed to load linked users");
    } finally {
      setLoadingLinks(false);
    }
  };

  const fetchPendingRequests = async () => {
    if (!userData || userData.role !== "student") return;

    setLoadingPending(true);
    try {
      const linksRef = collection(db, "parentLinks");
      const q = query(
        linksRef,
        where("studentId", "==", userData.uid),
        where("status", "==", "pending")
      );

      const snapshot = await getDocs(q);
      const requests: any[] = [];

      snapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setPendingRequests(requests);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    } finally {
      setLoadingPending(false);
    }
  };

  const handleAcceptRequest = async (requestId: string, parentName: string) => {
    try {
      const linkRef = doc(db, "parentLinks", requestId);
      await updateDoc(linkRef, {
        status: "approved",
        approvedAt: serverTimestamp(),
      });

      setPendingRequests((prev) => prev.filter((req) => req.id !== requestId));
      await fetchLinkedUsers();

      Alert.alert("Success", `You are now linked with ${parentName}`);
    } catch (error) {
      console.error("Error accepting request:", error);
      Alert.alert("Error", "Failed to accept request. Please try again.");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    Alert.alert(
      "Reject Request",
      "Are you sure you want to reject this parent link request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              const linkRef = doc(db, "parentLinks", requestId);
              await deleteDoc(linkRef);

              setPendingRequests((prev) =>
                prev.filter((req) => req.id !== requestId)
              );

              Alert.alert("Success", "Request rejected");
            } catch (error) {
              console.error("Error rejecting request:", error);
              Alert.alert("Error", "Failed to reject request. Please try again.");
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (userData?.name) {
      setEditedName(userData.name);
    }
    if (userData?.gender) {
      setEditedGender(userData.gender);
    } else {
      setEditedGender("male");
    }
  }, [userData?.name, userData?.gender]);

  useEffect(() => {
    if (
      userData &&
      (userData.role === "parent" || userData.role === "student")
    ) {
      fetchLinkedUsers();
    }
    if (userData?.role === "student") {
      fetchPendingRequests();
    }
  }, [userData]);

  const handleSaveProfile = async () => {
    if (!editedName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    if (!user) return;

    setSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        name: editedName.trim(),
        gender: editedGender,
      });

      Alert.alert("Success", "Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Error logging out:", error);
      Alert.alert("Error", "Failed to logout");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (
      userData &&
      (userData.role === "parent" || userData.role === "student")
    ) {
      await fetchLinkedUsers();
    }
    if (userData?.role === "student") {
      await fetchPendingRequests();
    }
    setRefreshing(false);
  };

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  if (authLoading) {
    return (
      <View className="flex-1 bg-[#1C1C1E] items-center justify-center">
        <View className="w-16 h-16 rounded-full bg-[#2A2A2D] items-center justify-center">
          <View className="w-8 h-8 rounded-full border-2 border-[#BCF3FF] border-t-transparent animate-spin" />
        </View>
        <Text className="text-[#C5D4CA] mt-4 text-base">Loading profile...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View className="flex-1 bg-[#1C1C1E] items-center justify-center p-6">
        <View className="w-24 h-24 rounded-full bg-[#2A2A2D] items-center justify-center mb-4">
          <Icon as={UserCircle} size="xl" className="text-[#C5D4CA]" />
        </View>
        <Text className="text-[#C5D4CA] text-center text-base">
          Unable to load profile data
        </Text>
        <TouchableOpacity
          onPress={onRefresh}
          className="mt-4 bg-[#BCF3FF] px-6 py-3 rounded-xl"
        >
          <Text className="text-black font-semibold">Retry</Text>
        </TouchableOpacity>
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
        <Animated.View
          style={{
            height: headerHeight,
            backgroundColor: config.bgColor,
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            minHeight: HEADER_MIN_HEIGHT,
          }}
        >
          <Animated.View
            style={{
              transform: [{ scale: imageScale }],
              opacity: headerOpacity,
            }}
          >
            <Image
              source={getProfileImage()}
              style={{ width: 200, height: 200 }}
              resizeMode="contain"
            />
          </Animated.View>
          
          <View className="absolute top-12 right-4">
            {!isEditing ? (
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                className="bg-black/10 rounded-full p-3"
              >
                <Icon as={Edit2} size="sm" className="text-black" />
              </TouchableOpacity>
            ) : (
              <HStack space="sm">
                <TouchableOpacity
                  onPress={() => {
                    setIsEditing(false);
                    setEditedName(userData.name || "");
                    setEditedGender(userData.gender || "male");
                  }}
                  className="bg-black/10 rounded-full p-3"
                >
                  <Icon as={X} size="sm" className="text-black" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveProfile}
                  disabled={saving}
                  className="bg-black rounded-full p-3"
                >
                  <Icon
                    as={Save}
                    size="sm"
                    className={saving ? "text-gray-400" : "text-white"}
                  />
                </TouchableOpacity>
              </HStack>
            )}
          </View>
        </Animated.View>

        <View className="bg-[#1C1C1E] rounded-t-3xl -mt-6 px-6 pt-8 pb-6">
          <View className="items-center mb-6">
            <View className="relative">
              <Avatar size="2xl" className="bg-[#2A2A2D] border-4 border-[#2A2A2D]">
                {userData.photoURL ? (
                  <AvatarImage source={{ uri: userData.photoURL }} />
                ) : (
                  <Image
                    source={getProfileImage()}
                    style={{ width: 72, height: 72 }}
                    resizeMode="contain"
                  />
                )}
              </Avatar>
              <View 
                className="absolute -bottom-2 -right-2 rounded-full px-3 py-1 flex-row items-center"
                style={{ backgroundColor: config.accentColor }}
              >
                <Icon as={config.icon} size="2xs" className="text-[#232323] mr-1" />
                <Text className="text-[#232323] text-xs font-bold">
                  {config.label}
                </Text>
              </View>
            </View>

            {isEditing ? (
              <View className="w-full mt-4">
                <Input 
                  variant="outline" 
                  size="lg" 
                  className="border-[#2A2A2D] bg-[#2A2A2D] rounded-xl mb-3"
                >
                  <InputField
                    value={editedName}
                    onChangeText={setEditedName}
                    placeholder="Enter your name"
                    className="text-white text-center text-lg font-semibold"
                    placeholderTextColor="#6B7280"
                  />
                </Input>
                <HStack space="md" className="w-full">
                  <TouchableOpacity
                    onPress={() => setEditedGender("male")}
                    className={`flex-1 py-3 px-4 rounded-xl flex-row items-center justify-center ${
                      editedGender === "male"
                        ? "bg-[#BCF3FF]"
                        : "bg-[#2A2A2D]"
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        editedGender === "male" ? "text-black" : "text-[#C5D4CA]"
                      }`}
                    >
                      Male
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setEditedGender("female")}
                    className={`flex-1 py-3 px-4 rounded-xl flex-row items-center justify-center ${
                      editedGender === "female"
                        ? "bg-[#BCF3FF]"
                        : "bg-[#2A2A2D]"
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        editedGender === "female" ? "text-black" : "text-[#C5D4CA]"
                      }`}
                    >
                      Female
                    </Text>
                  </TouchableOpacity>
                </HStack>
              </View>
            ) : (
              <>
                <Text className="text-white text-2xl font-bold mt-4">
                  {userData.name || "User"}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Icon as={UserIcon} size="xs" className="text-[#6B7280] mr-1" />
                  <Text className="text-[#6B7280] text-sm capitalize">
                    {userData.gender || "male"}
                  </Text>
                </View>
              </>
            )}
            
            <Text className="text-[#C5D4CA] text-sm mt-1">
              {userData.email}
            </Text>
          </View>

          <View className="bg-[#2A2A2D] rounded-2xl p-5 mb-4">
            <Text className="text-[#C5D4CA] text-xs font-semibold uppercase tracking-wide mb-4">
              Basic Information
            </Text>

            <VStack space="md">
              <HStack className="items-center justify-between">
                <HStack className="items-center" space="sm">
                  <View className="w-10 h-10 rounded-xl bg-[#1C1C1E] items-center justify-center">
                    <Icon as={Mail} size="sm" className="text-[#BCF3FF]" />
                  </View>
                  <VStack>
                    <Text className="text-[#C5D4CA] text-xs">Email</Text>
                    <Text className="text-white text-sm font-medium">
                      {userData.email}
                    </Text>
                  </VStack>
                </HStack>
              </HStack>

              <HStack className="items-center justify-between">
                <HStack className="items-center" space="sm">
                  <View className="w-10 h-10 rounded-xl bg-[#1C1C1E] items-center justify-center">
                    <Icon as={Users} size="sm" style={{ color: config.accentColor }} />
                  </View>
                  <VStack>
                    <Text className="text-[#C5D4CA] text-xs">Role</Text>
                    <Text className="text-white text-sm font-medium capitalize">
                      {userData.role}
                    </Text>
                  </VStack>
                </HStack>
              </HStack>

              <HStack className="items-center justify-between">
                <HStack className="items-center" space="sm">
                  <View className="w-10 h-10 rounded-xl bg-[#1C1C1E] items-center justify-center">
                    <Icon as={Calendar} size="sm" className="text-[#F9CD61]" />
                  </View>
                  <VStack>
                    <Text className="text-[#C5D4CA] text-xs">Member Since</Text>
                    <Text className="text-white text-sm font-medium">
                      {formatDate(userData.createdAt)}
                    </Text>
                  </VStack>
                </HStack>
              </HStack>
            </VStack>
          </View>

          {(userData.role === "student" || userData.role === "teacher") && (
            <View className="bg-[#2A2A2D] rounded-2xl p-5 mb-4">
              <Text className="text-[#C5D4CA] text-xs font-semibold uppercase tracking-wide mb-4">
                {userData.role === "student" ? "Academic Details" : "Professional Details"}
              </Text>

              <VStack space="md">
                {userData.role === "student" && (
                  <>
                    {userData.usn && (
                      <HStack className="items-center" space="sm">
                        <View className="w-10 h-10 rounded-xl bg-[#1C1C1E] items-center justify-center">
                          <Icon as={Hash} size="sm" className="text-[#F96857]" />
                        </View>
                        <VStack>
                          <Text className="text-[#C5D4CA] text-xs">USN</Text>
                          <Text className="text-white text-sm font-mono font-medium">
                            {userData.usn}
                          </Text>
                        </VStack>
                      </HStack>
                    )}

                    {(userData.departmentId || userData.department) && (
                      <HStack className="items-center" space="sm">
                        <View className="w-10 h-10 rounded-xl bg-[#1C1C1E] items-center justify-center">
                          <Icon as={BookOpen} size="sm" className="text-[#7477FF]" />
                        </View>
                        <VStack>
                          <Text className="text-[#C5D4CA] text-xs">Department</Text>
                          <Text className="text-white text-sm font-medium">
                            {userData.departmentId || userData.department}
                          </Text>
                        </VStack>
                      </HStack>
                    )}

                    {userData.semester && (
                      <HStack className="items-center" space="sm">
                        <View className="w-10 h-10 rounded-xl bg-[#1C1C1E] items-center justify-center">
                          <Icon as={Calendar} size="sm" className="text-[#BCF3FF]" />
                        </View>
                        <VStack>
                          <Text className="text-[#C5D4CA] text-xs">Semester</Text>
                          <Text className="text-white text-sm font-medium">
                            {userData.semester}
                            {userData.section && ` - Section ${userData.section}`}
                          </Text>
                        </VStack>
                      </HStack>
                    )}
                  </>
                )}

                {userData.role === "teacher" && (
                  <>
                    {userData.teacherCode && (
                      <HStack className="items-center" space="sm">
                        <View className="w-10 h-10 rounded-xl bg-[#1C1C1E] items-center justify-center">
                          <Icon as={Users} size="sm" className="text-[#F96857]" />
                        </View>
                        <VStack>
                          <Text className="text-[#C5D4CA] text-xs">Teacher Code</Text>
                          <Text className="text-white text-sm font-mono font-medium">
                            {userData.teacherCode}
                          </Text>
                        </VStack>
                      </HStack>
                    )}

                    {(userData.departmentId || userData.department) && (
                      <HStack className="items-center" space="sm">
                        <View className="w-10 h-10 rounded-xl bg-[#1C1C1E] items-center justify-center">
                          <Icon as={BookOpen} size="sm" className="text-[#7477FF]" />
                        </View>
                        <VStack>
                          <Text className="text-[#C5D4CA] text-xs">Department</Text>
                          <Text className="text-white text-sm font-medium">
                            {userData.departmentId || userData.department}
                          </Text>
                        </VStack>
                      </HStack>
                    )}
                  </>
                )}
              </VStack>
            </View>
          )}

          {userData.role === "student" && (
            <View className="mb-4">
              <HStack className="justify-between items-center mb-3 px-1">
                <Text className="text-[#C5D4CA] text-xs font-semibold uppercase tracking-wide">
                  Pending Requests
                </Text>
                {pendingRequests.length > 0 && (
                  <View className="bg-[#F96857] rounded-full px-2 py-0.5">
                    <Text className="text-white text-xs font-bold">
                      {pendingRequests.length}
                    </Text>
                  </View>
                )}
              </HStack>

              {loadingPending ? (
                <View className="bg-[#2A2A2D] rounded-2xl p-6 items-center">
                  <View className="w-6 h-6 rounded-full border-2 border-[#BCF3FF] border-t-transparent animate-spin" />
                </View>
              ) : pendingRequests.length > 0 ? (
                <VStack space="sm">
                  {pendingRequests.map((request) => (
                    <View
                      key={request.id}
                      className="bg-[#2A2A2D] rounded-2xl p-4 border border-[#F9CD61]/30"
                    >
                      <HStack className="items-start mb-3" space="sm">
                        <Avatar size="sm" className="bg-[#F9CD61]/20">
                          <AvatarFallbackText className="text-[#F9CD61]">
                            {getInitials(request.parentName)}
                          </AvatarFallbackText>
                        </Avatar>
                        <VStack className="flex-1">
                          <Text className="text-base text-white font-medium">
                            {request.parentName}
                          </Text>
                          <Text className="text-xs text-[#C5D4CA]">
                            {request.parentEmail}
                          </Text>
                        </VStack>
                        <View className="bg-[#F9CD61]/20 px-2 py-1 rounded-lg">
                          <Text className="text-[#F9CD61] text-xs font-semibold">
                            Pending
                          </Text>
                        </View>
                      </HStack>

                      <Text className="text-sm text-[#C5D4CA] mb-3">
                        wants to link with your account to view your academic progress.
                      </Text>

                      <HStack space="sm">
                        <TouchableOpacity
                          onPress={() => handleRejectRequest(request.id)}
                          className="flex-1 bg-[#1C1C1E] py-3 px-4 rounded-xl items-center"
                        >
                          <Text className="text-[#C5D4CA] font-semibold text-sm">
                            Decline
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            handleAcceptRequest(request.id, request.parentName)
                          }
                          className="flex-1 bg-[#BCF3FF] py-3 px-4 rounded-xl items-center"
                        >
                          <Text className="text-[#232323] font-semibold text-sm">
                            Accept
                          </Text>
                        </TouchableOpacity>
                      </HStack>
                    </View>
                  ))}
                </VStack>
              ) : (
                <View className="bg-[#2A2A2D] rounded-2xl p-6 items-center border border-dashed border-[#3C443F]">
                  <Icon
                    as={UserCheck}
                    size="lg"
                    className="text-[#3C443F] mb-2"
                  />
                  <Text className="text-[#6B7280] text-sm text-center">
                    No pending parent requests
                  </Text>
                </View>
              )}
            </View>
          )}

          {(userData.role === "parent" || userData.role === "student") && (
            <View className="mb-4">
              <HStack className="justify-between items-center mb-3 px-1">
                <Text className="text-[#C5D4CA] text-xs font-semibold uppercase tracking-wide">
                  {userData.role === "parent" ? "Linked Students" : "Linked Parents"}
                </Text>
                {userData.role === "parent" && (
                  <TouchableOpacity
                    onPress={() => router.push("/(auth)/parent-link")}
                    className="bg-[#BCF3FF]/10 px-3 py-1.5 rounded-full flex-row items-center"
                  >
                    <Text className="text-[#BCF3FF] text-xs font-semibold">
                      + Link Student
                    </Text>
                  </TouchableOpacity>
                )}
              </HStack>

              {loadingLinks ? (
                <View className="bg-[#2A2A2D] rounded-2xl p-6 items-center">
                  <View className="w-6 h-6 rounded-full border-2 border-[#BCF3FF] border-t-transparent animate-spin" />
                </View>
              ) : linkedUsers.length > 0 ? (
                <VStack space="sm">
                  {linkedUsers.map((linkedUser) => (
                    <View
                      key={linkedUser.uid}
                      className="bg-[#2A2A2D] rounded-2xl p-4"
                    >
                      <HStack className="items-center" space="sm">
                        <Avatar size="sm" className="bg-[#1C1C1E]">
                          <AvatarFallbackText className="text-[#C5D4CA]">
                            {getInitials(linkedUser.name)}
                          </AvatarFallbackText>
                        </Avatar>
                        <VStack className="flex-1">
                          <Text className="text-base text-white font-medium">
                            {linkedUser.name}
                          </Text>
                          <Text className="text-xs text-[#C5D4CA]">
                            {linkedUser.email}
                          </Text>
                        </VStack>
                        <Icon as={ChevronRight} size="sm" className="text-[#3C443F]" />
                      </HStack>

                      {userData.role === "parent" && linkedUser.usn && (
                        <View className="mt-3 pt-3 border-t border-[#1C1C1E]">
                          <Text className="text-xs text-[#C5D4CA]">
                            USN: <Text className="text-white font-mono">{linkedUser.usn}</Text>
                          </Text>
                          {(linkedUser.departmentId || linkedUser.department) && (
                            <Text className="text-xs text-[#C5D4CA] mt-1">
                              {linkedUser.departmentId || linkedUser.department}
                              {linkedUser.semester && ` • Sem ${linkedUser.semester}`}
                              {linkedUser.section && ` • Sec ${linkedUser.section}`}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
                </VStack>
              ) : (
                <View className="bg-[#2A2A2D] rounded-2xl p-6 items-center border border-dashed border-[#3C443F]">
                  <Icon as={Users} size="lg" className="text-[#3C443F] mb-2" />
                  <Text className="text-[#6B7280] text-sm text-center">
                    {userData.role === "parent"
                      ? "No students linked yet"
                      : "No parents linked yet"}
                  </Text>
                </View>
              )}
            </View>
          )}

          <Button
            onPress={() => setShowLogoutDialog(true)}
            className="bg-[#F96857] mt-6"
            size="lg"
          >
            <ButtonIcon as={LogOut} className="text-white mr-2" />
            <ButtonText className="text-white font-semibold">Logout</ButtonText>
          </Button>

          <View className="h-24" />
        </View>
      </Animated.ScrollView>

      <AlertDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
      >
        <AlertDialogBackdrop />
        <AlertDialogContent className="bg-[#2A2A2D]">
          <AlertDialogHeader>
            <Heading size="lg" className="text-white">
              Confirm Logout
            </Heading>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text className="text-[#C5D4CA]">
              Are you sure you want to logout?
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <HStack space="md" className="w-full justify-end">
              <Button
                variant="outline"
                onPress={() => setShowLogoutDialog(false)}
                className="border-[#3C443F]"
              >
                <ButtonText className="text-[#C5D4CA]">Cancel</ButtonText>
              </Button>
              <Button onPress={handleLogout} className="bg-[#F96857]">
                <ButtonText className="text-white">Logout</ButtonText>
              </Button>
            </HStack>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
