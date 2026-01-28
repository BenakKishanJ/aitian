import React, { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Plus, X } from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import { useCourses } from "@/lib/hooks/useCourses";
import { CourseCard } from "@/components/academics/CourseCard";
import { SemesterFilter } from "@/components/academics/SemesterFilter";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";

export default function AcademicsScreen() {
  const { user, userData, role } = useAuth();
  const [selectedSemester, setSelectedSemester] = useState<number | null>(
    userData?.semester || null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const { courses, loading, error, hasMore, loadMore, refresh } = useCourses({
    semester: selectedSemester,
    searchQuery: searchQuery,
  });

  const currentSemester = userData?.semester || 1;

  const handleCreateCourse = () => {
    // TODO: Navigate to create course modal/page
    console.log("Create course");
  };

  const handleEndReached = () => {
    if (hasMore && !loading && role === "admin") {
      loadMore();
    }
  };

  const isScrollable = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    return (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <HStack className="justify-between items-center px-4 py-3">
          <VStack space="xs">
            <Text className="text-2xl font-bold text-black">Academics</Text>
            <Text className="text-sm text-gray-600">
              {role === "student" && "Your enrolled courses"}
              {role === "teacher" && "Courses you teach"}
              {role === "parent" && "Your child's courses"}
              {role === "admin" && "All courses"}
            </Text>
          </VStack>

          {/* Search Icon */}
          <TouchableOpacity
            onPress={() => setShowSearch(!showSearch)}
            style={styles.iconButton}
          >
            <Icon
              as={showSearch ? X : Search}
              size="lg"
              className="text-black"
            />
          </TouchableOpacity>
        </HStack>

        {/* Search Bar */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <Icon as={Search} size="md" className="text-gray-400" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search courses..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Icon as={X} size="sm" className="text-gray-400" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Semester Filter */}
        <SemesterFilter
          currentSemester={currentSemester}
          selectedSemester={selectedSemester}
          onSelectSemester={setSelectedSemester}
        />
      </View>

      {/* Course List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
        onScroll={({ nativeEvent }) => {
          if (isScrollable({ nativeEvent })) {
            handleEndReached();
          }
        }}
        scrollEventThrottle={400}
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text className="text-red-600 text-center">{error}</Text>
          </View>
        )}

        {!loading && courses.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text className="text-gray-500 text-center text-lg">
              {searchQuery
                ? "No courses found"
                : selectedSemester !== null
                  ? `No courses for Semester ${selectedSemester}`
                  : "No courses available"}
            </Text>
            <Text className="text-gray-400 text-center text-sm mt-2">
              {role === "student" && "You haven't enrolled in any courses yet"}
              {role === "teacher" && "No courses assigned to you"}
              {role === "parent" && "No courses found for your child"}
              {role === "admin" && "Create your first course to get started"}
            </Text>
          </View>
        )}

        {courses.map((courseInstance) => (
          <CourseCard
            key={courseInstance.id}
            courseInstance={courseInstance}
            role={role!}
          />
        ))}

        {loading && courses.length > 0 && (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color="#000000" />
            <Text className="text-gray-600 ml-2">Loading more...</Text>
          </View>
        )}

        {!loading && courses.length > 0 && !hasMore && (
          <View style={styles.endMessage}>
            <Text className="text-gray-400 text-center text-sm">
              No more courses to load
            </Text>
          </View>
        )}

        {/* Spacing at bottom */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB for Admin */}
      {role === "admin" && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreateCourse}
          activeOpacity={0.8}
        >
          <Icon as={Plus} size="xl" className="text-white" />
        </TouchableOpacity>
      )}

      {/* Initial Loading */}
      {loading && courses.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text className="text-gray-600 mt-4">Loading courses...</Text>
        </View>
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#000000",
    fontFamily: "System",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingMore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  endMessage: {
    paddingVertical: 16,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
