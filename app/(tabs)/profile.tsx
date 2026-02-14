import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
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
} from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/* Gluestack UI Components */
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
import { Divider } from "@/components/ui/divider";
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
  department?: string; // legacy support
  semester?: number;
  section?: string;
}

export default function ProfileScreen() {
  const { userData, user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Linked users (for parents and students)
  const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  useEffect(() => {
    if (userData?.name) {
      setEditedName(userData.name);
    }
  }, [userData?.name]);

  useEffect(() => {
    if (
      userData &&
      (userData.role === "parent" || userData.role === "student")
    ) {
      fetchLinkedUsers();
    }
  }, [userData]);

  const fetchLinkedUsers = async () => {
    if (!userData) return;

    setLoadingLinks(true);
    try {
      const linksRef = collection(db, "parentLinks");
      let q;

      if (userData.role === "parent") {
        // Fetch students linked to this parent
        q = query(
          linksRef,
          where("parentId", "==", userData.uid),
          where("status", "==", "approved"),
        );
      } else if (userData.role === "student") {
        // Fetch parents linked to this student
        q = query(
          linksRef,
          where("studentId", "==", userData.uid),
          where("status", "==", "approved"),
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

      // Fetch user details for each linked user
      const users: LinkedUser[] = [];
      for (const uid of userIds) {
        const userDoc = await getDocs(
          query(collection(db, "users"), where("uid", "==", uid)),
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
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-600">Loading...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-6">
        <Icon as={UserCircle} size="xl" className="text-gray-400 mb-4" />
        <Text className="text-gray-600 text-center">
          Unable to load profile data
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="bg-black pt-16 pb-8 px-6">
          <HStack className="justify-between items-start mb-6">
            <Text className="text-white text-2xl font-bold">Profile</Text>
            {!isEditing ? (
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                className="bg-white/10 rounded-full p-2"
              >
                <Icon as={Edit2} size="sm" className="text-white" />
              </TouchableOpacity>
            ) : (
              <HStack space="sm">
                <TouchableOpacity
                  onPress={() => {
                    setIsEditing(false);
                    setEditedName(userData.name || "");
                  }}
                  className="bg-white/10 rounded-full p-2"
                >
                  <Icon as={X} size="sm" className="text-white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveProfile}
                  disabled={saving}
                  className="bg-white rounded-full p-2"
                >
                  <Icon
                    as={Save}
                    size="sm"
                    className={saving ? "text-gray-400" : "text-black"}
                  />
                </TouchableOpacity>
              </HStack>
            )}
          </HStack>

          {/* Profile Photo */}
          <View className="items-center mb-4">
            <Avatar size="2xl" className="bg-white border-4 border-white/20">
              {userData.photoURL ? (
                <AvatarImage source={{ uri: userData.photoURL }} />
              ) : (
                <AvatarFallbackText className="text-black font-bold text-2xl">
                  {getInitials(userData.name || "User")}
                </AvatarFallbackText>
              )}
            </Avatar>
            {isEditing && (
              <TouchableOpacity className="mt-3">
                <Text className="text-white/80 text-sm underline">
                  Change Photo
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Profile Content */}
        <VStack className="px-6 py-6" space="lg">
          {/* Basic Information */}
          <VStack space="md">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Basic Information
            </Text>

            {/* Name */}
            <VStack space="xs">
              <HStack className="items-center" space="xs">
                <Icon as={User} size="xs" className="text-gray-400" />
                <Text className="text-xs text-gray-600">Name</Text>
              </HStack>
              {isEditing ? (
                <Input variant="outline" size="md" className="border-gray-300">
                  <InputField
                    value={editedName}
                    onChangeText={setEditedName}
                    placeholder="Enter your name"
                    className="text-black"
                  />
                </Input>
              ) : (
                <Text className="text-base text-black font-medium">
                  {userData.name || "N/A"}
                </Text>
              )}
            </VStack>

            {/* Email */}
            <VStack space="xs">
              <HStack className="items-center" space="xs">
                <Icon as={Mail} size="xs" className="text-gray-400" />
                <Text className="text-xs text-gray-600">Email</Text>
              </HStack>
              <Text className="text-base text-black">{userData.email}</Text>
            </VStack>

            {/* Role */}
            <VStack space="xs">
              <HStack className="items-center" space="xs">
                <Icon as={Users} size="xs" className="text-gray-400" />
                <Text className="text-xs text-gray-600">Role</Text>
              </HStack>
              <Text className="text-base text-black capitalize">
                {userData.role}
              </Text>
            </VStack>
          </VStack>

          <Divider className="bg-gray-200" />

          {/* Academic/Professional Information */}
          {(userData.role === "student" || userData.role === "teacher") && (
            <>
              <VStack space="md">
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {userData.role === "student"
                    ? "Academic Information"
                    : "Professional Information"}
                </Text>

                {/* Student-specific fields */}
                {userData.role === "student" && (
                  <>
                    {userData.usn && (
                      <VStack space="xs">
                        <HStack className="items-center" space="xs">
                          <Icon
                            as={Hash}
                            size="xs"
                            className="text-gray-400"
                          />
                          <Text className="text-xs text-gray-600">USN</Text>
                        </HStack>
                        <Text className="text-base text-black font-mono">
                          {userData.usn}
                        </Text>
                      </VStack>
                    )}

                    {(userData.departmentId || userData.department) && (
                      <VStack space="xs">
                        <HStack className="items-center" space="xs">
                          <Icon
                            as={BookOpen}
                            size="xs"
                            className="text-gray-400"
                          />
                          <Text className="text-xs text-gray-600">
                            Department
                          </Text>
                        </HStack>
                        <Text className="text-base text-black">
                          {userData.departmentId || userData.department}
                        </Text>
                      </VStack>
                    )}

                    {userData.semester && (
                      <VStack space="xs">
                        <HStack className="items-center" space="xs">
                          <Icon
                            as={Calendar}
                            size="xs"
                            className="text-gray-400"
                          />
                          <Text className="text-xs text-gray-600">
                            Semester
                          </Text>
                        </HStack>
                        <Text className="text-base text-black">
                          Semester {userData.semester}
                          {userData.section && ` - Section ${userData.section}`}
                        </Text>
                      </VStack>
                    )}

                    {userData.batch && (
                      <VStack space="xs">
                        <HStack className="items-center" space="xs">
                          <Icon
                            as={Calendar}
                            size="xs"
                            className="text-gray-400"
                          />
                          <Text className="text-xs text-gray-600">Batch</Text>
                        </HStack>
                        <Text className="text-base text-black">
                          {userData.batch}
                        </Text>
                      </VStack>
                    )}
                  </>
                )}

                {/* Teacher-specific fields */}
                {userData.role === "teacher" && (
                  <>
                    {userData.teacherCode && (
                      <VStack space="xs">
                        <HStack className="items-center" space="xs">
                          <Icon
                            as={Users}
                            size="xs"
                            className="text-gray-400"
                          />
                          <Text className="text-xs text-gray-600">
                            Teacher Code
                          </Text>
                        </HStack>
                        <Text className="text-base text-black font-mono">
                          {userData.teacherCode}
                        </Text>
                      </VStack>
                    )}

                    {(userData.departmentId || userData.department) && (
                      <VStack space="xs">
                        <HStack className="items-center" space="xs">
                          <Icon
                            as={BookOpen}
                            size="xs"
                            className="text-gray-400"
                          />
                          <Text className="text-xs text-gray-600">
                            Department
                          </Text>
                        </HStack>
                        <Text className="text-base text-black">
                          {userData.departmentId || userData.department}
                        </Text>
                      </VStack>
                    )}

                    {userData.department && (
                      <VStack space="xs">
                        <HStack className="items-center" space="xs">
                          <Icon
                            as={BookOpen}
                            size="xs"
                            className="text-gray-400"
                          />
                          <Text className="text-xs text-gray-600">
                            Department
                          </Text>
                        </HStack>
                        <Text className="text-base text-black">
                          {userData.department}
                        </Text>
                      </VStack>
                    )}
                  </>
                )}
              </VStack>

              <Divider className="bg-gray-200" />
            </>
          )}

          {/* Linked Users Section */}
          {(userData.role === "parent" || userData.role === "student") && (
            <>
              <VStack space="md">
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {userData.role === "parent"
                    ? "Linked Students"
                    : "Linked Parents"}
                </Text>

                {loadingLinks ? (
                  <Text className="text-gray-500 text-sm">Loading...</Text>
                ) : linkedUsers.length > 0 ? (
                  <VStack space="sm">
                    {linkedUsers.map((linkedUser) => (
                      <View
                        key={linkedUser.uid}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <HStack className="items-center mb-2" space="sm">
                          <Avatar size="sm" className="bg-gray-200">
                            <AvatarFallbackText className="text-gray-600">
                              {getInitials(linkedUser.name)}
                            </AvatarFallbackText>
                          </Avatar>
                          <VStack className="flex-1">
                            <Text className="text-base text-black font-medium">
                              {linkedUser.name}
                            </Text>
                            <Text className="text-xs text-gray-600">
                              {linkedUser.email}
                            </Text>
                          </VStack>
                        </HStack>

                        {userData.role === "parent" && linkedUser.usn && (
                          <VStack space="xs" className="mt-2">
                            <Text className="text-xs text-gray-600">
                              USN: {linkedUser.usn}
                            </Text>
                            {(linkedUser.departmentId || linkedUser.department) && (
                              <Text className="text-xs text-gray-600">
                                {linkedUser.departmentId || linkedUser.department}
                                {linkedUser.semester &&
                                  ` • Sem ${linkedUser.semester}`}
                                {linkedUser.section &&
                                  ` • Sec ${linkedUser.section}`}
                              </Text>
                            )}
                          </VStack>
                        )}
                      </View>
                    ))}
                  </VStack>
                ) : (
                  <View className="border border-dashed border-gray-300 rounded-lg p-6 items-center">
                    <Icon as={Users} size="lg" className="text-gray-300 mb-2" />
                    <Text className="text-gray-500 text-sm text-center">
                      {userData.role === "parent"
                        ? "No students linked yet"
                        : "No parents linked yet"}
                    </Text>
                  </View>
                )}
              </VStack>

              <Divider className="bg-gray-200" />
            </>
          )}

          {/* Account Information */}
          <VStack space="md">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Account Information
            </Text>

            <VStack space="xs">
              <HStack className="items-center" space="xs">
                <Icon as={Calendar} size="xs" className="text-gray-400" />
                <Text className="text-xs text-gray-600">Member Since</Text>
              </HStack>
              <Text className="text-base text-black">
                {formatDate(userData.createdAt)}
              </Text>
            </VStack>

            {userData.isActive !== undefined && (
              <VStack space="xs">
                <Text className="text-xs text-gray-600">Status</Text>
                <Text
                  className={`text-base font-medium ${
                    userData.isActive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {userData.isActive ? "Active" : "Inactive"}
                </Text>
              </VStack>
            )}
          </VStack>

          {/* Logout Button */}
          <Button
            onPress={() => setShowLogoutDialog(true)}
            className="bg-black mt-6"
            size="lg"
          >
            <ButtonIcon as={LogOut} className="text-white mr-2" />
            <ButtonText className="text-white font-semibold">Logout</ButtonText>
          </Button>

          <View className="h-8" />
        </VStack>
      </ScrollView>

      {/* Logout Confirmation Dialog */}
      <AlertDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
      >
        <AlertDialogBackdrop />
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <Heading size="lg" className="text-black">
              Confirm Logout
            </Heading>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text className="text-gray-700">
              Are you sure you want to logout?
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <HStack space="md" className="w-full justify-end">
              <Button
                variant="outline"
                onPress={() => setShowLogoutDialog(false)}
                className="border-gray-300"
              >
                <ButtonText className="text-black">Cancel</ButtonText>
              </Button>
              <Button onPress={handleLogout} className="bg-black">
                <ButtonText className="text-white">Logout</ButtonText>
              </Button>
            </HStack>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
