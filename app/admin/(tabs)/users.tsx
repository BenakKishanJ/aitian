import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <VStack space="xs">
          <Text style={styles.headerTitle}>User Management</Text>
          <Text style={styles.subtitle}>Manage all users in the system</Text>
        </VStack>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <HStack space="lg">
          <VStack space="xs" style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </VStack>
          <VStack space="xs" style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#3B82F6" }]}>
              {stats.students}
            </Text>
            <Text style={styles.statLabel}>Students</Text>
          </VStack>
          <VStack space="xs" style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#10B981" }]}>
              {stats.teachers}
            </Text>
            <Text style={styles.statLabel}>Teachers</Text>
          </VStack>
          <VStack space="xs" style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#000000" }]}>
              {stats.active}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </VStack>
        </HStack>
      </View>

      {/* Search & Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Search size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <HStack space="sm" style={styles.filterRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowRolePicker(!showRolePicker)}
          >
            <Text style={styles.filterButtonText}>
              {roleOptions.find((r) => r.value === roleFilter)?.label}
            </Text>
            <ChevronDown size={16} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowDeptPicker(!showDeptPicker)}
          >
            <Text style={styles.filterButtonText}>
              {deptFilter
                ? DEPARTMENTS.find((d) => d.id === deptFilter)?.code
                : "All Depts"}
            </Text>
            <ChevronDown size={16} color="#6B7280" />
          </TouchableOpacity>
        </HStack>

        {/* Role Picker Dropdown */}
        {showRolePicker && (
          <View style={styles.pickerDropdown}>
            {roleOptions.map((r) => (
              <TouchableOpacity
                key={r.label}
                style={styles.pickerItem}
                onPress={() => {
                  setRoleFilter(r.value);
                  setShowRolePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    roleFilter === r.value && styles.pickerItemTextActive,
                  ]}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Department Picker Dropdown */}
        {showDeptPicker && (
          <View style={styles.pickerDropdown}>
            <TouchableOpacity
              style={styles.pickerItem}
              onPress={() => {
                setDeptFilter(null);
                setShowDeptPicker(false);
              }}
            >
              <Text
                style={[
                  styles.pickerItemText,
                  deptFilter === null && styles.pickerItemTextActive,
                ]}
              >
                All Departments
              </Text>
            </TouchableOpacity>
            {DEPARTMENTS.map((dept) => (
              <TouchableOpacity
                key={dept.id}
                style={styles.pickerItem}
                onPress={() => {
                  setDeptFilter(dept.id);
                  setShowDeptPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    deptFilter === dept.id && styles.pickerItemTextActive,
                  ]}
                >
                  {dept.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* User List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
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
        {users.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Users size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Users Found</Text>
            <Text style={styles.emptyText}>
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
              <View style={styles.loadingMore}>
                <Text style={styles.loadingText}>Loading more...</Text>
              </View>
            )}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  statsBar: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  filtersContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#000000",
  },
  filterRow: {
    flexDirection: "row",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  filterButtonText: {
    fontSize: 13,
    color: "#374151",
  },
  pickerDropdown: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pickerItemText: {
    fontSize: 15,
    color: "#374151",
  },
  pickerItemTextActive: {
    color: "#000000",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
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
