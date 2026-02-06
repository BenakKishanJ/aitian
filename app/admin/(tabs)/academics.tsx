import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Users,
  GraduationCap,
  Building2,
  MoreVertical,
  Trash2,
  Edit3,
} from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import { useCourses } from "@/lib/hooks/useCourses";
import { CourseCard } from "@/components/academics/CourseCard";
import { collection, addDoc, deleteDoc, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEPARTMENTS } from "@/types/constants";

export default function AdminAcademicsScreen() {
  const { user, userData, role } = useAuth();
  const router = useRouter();
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    courses,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  } = useCourses({
    semester: selectedSemester,
    searchQuery: searchQuery,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleCreateCourse = async (courseData: any) => {
    if (!user) return;

    try {
      await addDoc(collection(db, "courses"), {
        ...courseData,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      setShowCreateModal(false);
      refresh();
    } catch (error) {
      console.error("Error creating course:", error);
      Alert.alert("Error", "Failed to create course");
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    Alert.alert(
      "Delete Course",
      "Are you sure you want to delete this course?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "courses", courseId));
              refresh();
            } catch (error) {
              console.error("Error deleting course:", error);
              Alert.alert("Error", "Failed to delete course");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <HStack space="md" style={styles.headerTop}>
          <Text style={styles.headerTitle}>Academics</Text>
          <HStack space="sm">
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Search size={20} color="#000000" />
            </TouchableOpacity>
          </HStack>
        </HStack>

        {showSearch && (
          <View style={styles.searchContainer}>
            <Search size={16} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search courses..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        )}

        {/* Semester Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.semesterScroll}
        >
          <TouchableOpacity
            style={[
              styles.semesterChip,
              selectedSemester === null && styles.semesterChipActive,
            ]}
            onPress={() => setSelectedSemester(null)}
          >
            <Text
              style={[
                styles.semesterChipText,
                selectedSemester === null && styles.semesterChipTextActive,
              ]}
            >
              All Semesters
            </Text>
          </TouchableOpacity>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
            <TouchableOpacity
              key={sem}
              style={[
                styles.semesterChip,
                selectedSemester === sem && styles.semesterChipActive,
              ]}
              onPress={() => setSelectedSemester(sem)}
            >
              <Text
                style={[
                  styles.semesterChipText,
                  selectedSemester === sem && styles.semesterChipTextActive,
                ]}
              >
                Semester {sem}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Course List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
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
        {courses.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <BookOpen size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No Courses Found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? "No courses match your search"
                : "No courses available for this semester"}
            </Text>
          </View>
        ) : (
          <>
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                courseInstance={course}
                role={role || "admin"}
              />
            ))}
            {loading && (
              <View style={styles.loadingMore}>
                <Text style={styles.loadingText}>Loading more...</Text>
              </View>
            )}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
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
  semesterScroll: {
    flexDirection: "row",
  },
  semesterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  semesterChipActive: {
    backgroundColor: "#000000",
  },
  semesterChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
  semesterChipTextActive: {
    color: "#FFFFFF",
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
