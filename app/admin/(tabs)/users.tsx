import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Plus,
  Users,
  Search,
  GraduationCap,
  UserCheck,
  User,
  Shield,
  ChevronDown,
} from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import { useAdminUsers } from "@/lib/hooks/useAdminUsers";
import { UserListItem } from "@/components/admin/UserListItem";
import { CreateUserModal } from "@/components/admin/CreateUserModal";
import { EditUserModal } from "@/components/admin/EditUserModal";
import type { UserData, Role } from "@/types";
import { DEPARTMENTS } from "@/types/constants";

import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";

const roleConfig: Record<string, { color: string; icon: any; label: string }> = {
  student: { color: "#BCF3FF", icon: GraduationCap, label: "Students" },
  teacher: { color: "#F96857", icon: User, label: "Teachers" },
  parent: { color: "#F9CD61", icon: UserCheck, label: "Parents" },
  admin: { color: "#7477FF", icon: Shield, label: "Admins" },
};

export default function AdminUsersScreen() {
  const router = useRouter();
  const { role, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [roleFilter, setRoleFilter] = useState<Role | null>(null);
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showDeptPicker, setShowDeptPicker] = useState(false);

  const {
    users,
    loading,
    error,
    creating,
    hasMore,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    loadMore,
    refresh,
  } = useAdminUsers({
    role: roleFilter,
    departmentId: deptFilter,
    searchQuery,
    pageSize: 50,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    Alert.alert(
      "Delete User",
      `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteUser(userId);
              Alert.alert("Success", "User deleted successfully");
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete user");
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (userData: UserData) => {
    try {
      await toggleUserStatus(userData.uid, userData.isActive);
      Alert.alert(
        "Success",
        `User ${userData.isActive ? "deactivated" : "activated"} successfully`
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update user status");
    }
  };

  // Calculate stats
  const stats = {
    total: users.length,
    students: users.filter((u) => u.role === "student").length,
    teachers: users.filter((u) => u.role === "teacher").length,
    active: users.filter((u) => u.isActive).length,
  };

  const roleOptions: { value: Role | null; label: string }[] = [
    { value: null, label: "All Roles" },
    { value: "student", label: "Students" },
    { value: "teacher", label: "Teachers" },
    { value: "parent", label: "Parents" },
    { value: "admin", label: "Admins" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#1C1C1E]">
      {/* Header */}
      <View className="px-6 pt-4 pb-4">
        <VStack space="xs">
          <Text className="text-white text-2xl font-bold">User Management</Text>
          <Text className="text-[#C5D4CA] text-sm">Manage all users in the system</Text>
        </VStack>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-24"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#BCF3FF"
            colors={["#BCF3FF"]}
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 20;
          if (isCloseToBottom && hasMore && !loading) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Stats Cards */}
        <View className="flex-row flex-wrap justify-between mb-6">
          <View className="bg-[#2A2A2D] rounded-2xl p-4 w-[48%] mb-3">
            <VStack space="xs">
              <Text className="text-white text-2xl font-bold">{stats.total}</Text>
              <Text className="text-[#6B7280] text-xs">Total Users</Text>
            </VStack>
          </View>
          <View className="bg-[#2A2A2D] rounded-2xl p-4 w-[48%] mb-3">
            <VStack space="xs">
              <Text className="text-[#BCF3FF] text-2xl font-bold">{stats.students}</Text>
              <Text className="text-[#6B7280] text-xs">Students</Text>
            </VStack>
          </View>
          <View className="bg-[#2A2A2D] rounded-2xl p-4 w-[48%] mb-3">
            <VStack space="xs">
              <Text className="text-[#F96857] text-2xl font-bold">{stats.teachers}</Text>
              <Text className="text-[#6B7280] text-xs">Teachers</Text>
            </VStack>
          </View>
          <View className="bg-[#2A2A2D] rounded-2xl p-4 w-[48%] mb-3">
            <VStack space="xs">
              <Text className="text-[#F9CD61] text-2xl font-bold">{stats.active}</Text>
              <Text className="text-[#6B7280] text-xs">Active</Text>
            </VStack>
          </View>
        </View>

        {/* Search & Filters */}
        <View className="bg-[#2A2A2D] rounded-2xl p-4 mb-4">
          <View className="flex-row items-center bg-[#1C1C1E] rounded-xl px-4 py-3 mb-4">
            <Icon as={Search} size="sm" className="text-[#6B7280] mr-3" />
            <TextInput
              className="flex-1 text-white text-base"
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#6B7280"
            />
          </View>

          <HStack space="sm">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-between bg-[#1C1C1E] px-4 py-3 rounded-xl"
              onPress={() => setShowRolePicker(!showRolePicker)}
            >
              <Text className="text-white text-sm">
                {roleOptions.find((r) => r.value === roleFilter)?.label}
              </Text>
              <Icon as={ChevronDown} size="sm" className="text-[#6B7280]" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 flex-row items-center justify-between bg-[#1C1C1E] px-4 py-3 rounded-xl"
              onPress={() => setShowDeptPicker(!showDeptPicker)}
            >
              <Text className="text-white text-sm">
                {deptFilter
                  ? DEPARTMENTS.find((d) => d.id === deptFilter)?.code
                  : "All Depts"}
              </Text>
              <Icon as={ChevronDown} size="sm" className="text-[#6B7280]" />
            </TouchableOpacity>
          </HStack>

          {/* Role Picker Dropdown */}
          {showRolePicker && (
            <View className="bg-[#1C1C1E] rounded-xl mt-3 border border-[#3C443F]">
              {roleOptions.map((r) => (
                <TouchableOpacity
                  key={r.label}
                  className="px-4 py-3 border-b border-[#3C443F] last:border-b-0"
                  onPress={() => {
                    setRoleFilter(r.value);
                    setShowRolePicker(false);
                  }}
                >
                  <Text
                    className={`text-sm ${
                      roleFilter === r.value
                        ? "text-[#BCF3FF] font-semibold"
                        : "text-[#C5D4CA]"
                    }`}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Department Picker Dropdown */}
          {showDeptPicker && (
            <View className="bg-[#1C1C1E] rounded-xl mt-3 border border-[#3C443F]">
              <TouchableOpacity
                className="px-4 py-3 border-b border-[#3C443F]"
                onPress={() => {
                  setDeptFilter(null);
                  setShowDeptPicker(false);
                }}
              >
                <Text
                  className={`text-sm ${
                    deptFilter === null
                      ? "text-[#BCF3FF] font-semibold"
                      : "text-[#C5D4CA]"
                  }`}
                >
                  All Departments
                </Text>
              </TouchableOpacity>
              {DEPARTMENTS.map((dept) => (
                <TouchableOpacity
                  key={dept.id}
                  className="px-4 py-3 border-b border-[#3C443F] last:border-b-0"
                  onPress={() => {
                    setDeptFilter(dept.id);
                    setShowDeptPicker(false);
                  }}
                >
                  <Text
                    className={`text-sm ${
                      deptFilter === dept.id
                        ? "text-[#BCF3FF] font-semibold"
                        : "text-[#C5D4CA]"
                    }`}
                  >
                    {dept.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* User List */}
        {users.length === 0 && !loading ? (
          <View className="items-center justify-center py-16">
            <View className="w-20 h-20 rounded-full bg-[#2A2A2D] items-center justify-center mb-4">
              <Icon as={Users} size="xl" className="text-[#3C443F]" />
            </View>
            <Text className="text-white text-lg font-semibold mb-2">No Users Found</Text>
            <Text className="text-[#6B7280] text-sm text-center">
              {searchQuery
                ? "No users match your search"
                : "Start by creating a new user"}
            </Text>
          </View>
        ) : (
          <VStack space="sm">
            {users.map((userData) => (
              <UserListItem
                key={userData.uid}
                user={userData}
                onPress={() => setEditingUser(userData)}
                onToggleStatus={() => handleToggleStatus(userData)}
                onDelete={() => handleDeleteUser(userData.uid, userData.name)}
                showActions={true}
              />
            ))}
            {loading && (
              <View className="py-6 items-center">
                <Text className="text-[#6B7280] text-sm">Loading more...</Text>
              </View>
            )}
          </VStack>
        )}
      </ScrollView>

      {/* FAB for Create */}
      <TouchableOpacity
        className="absolute right-6 bottom-24 w-14 h-14 rounded-full bg-[#BCF3FF] items-center justify-center shadow-lg"
        style={{
          elevation: 5,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        }}
        onPress={() => setShowCreateModal(true)}
      >
        <Icon as={Plus} size="lg" className="text-[#232323]" />
      </TouchableOpacity>

      {/* Create User Modal */}
      <CreateUserModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={() => {
          refresh();
        }}
      />

      {/* Edit User Modal */}
      <EditUserModal
        visible={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onUserUpdated={() => {
          refresh();
        }}
      />
    </SafeAreaView>
  );
}
