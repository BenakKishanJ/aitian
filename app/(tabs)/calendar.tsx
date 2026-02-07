import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Icon } from "@/components/ui/icon";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Calendar as CalendarIcon,
} from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import {
  useCalendarEvents,
  EventType,
  ExpandedEvent,
} from "@/lib/hooks/useCalendarEvents";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { WeekCalendar } from "@/components/calendar/WeekCalendar";
import { EventList } from "@/components/calendar/EventList";
import {
  CreateEventModal,
  EventFormData,
} from "@/components/calendar/CreateEventModal";
import {
  formatDate,
  getMonthRange,
  getWeekRange,
  getPreviousMonth,
  getNextMonth,
  getPreviousWeek,
  getNextWeek,
} from "@/lib/utils/calendarUtils";
import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type ViewMode = "month" | "week";

export default function CalendarScreen() {
  const { user, userData, role } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventList, setShowEventList] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<EventType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedEvent, setSelectedEvent] = useState<ExpandedEvent | null>(
    null,
  );

  // Get date range based on view mode
  const dateRange = useMemo(() => {
    return viewMode === "month"
      ? getMonthRange(currentDate)
      : getWeekRange(currentDate);
  }, [currentDate, viewMode]);

  // Fetch course instances for teacher/admin
  React.useEffect(() => {
    const fetchCourses = async () => {
      if (!user || role === "student" || role === "parent") return;

      try {
        const coursesRef = collection(db, "courseInstances");
        let q;

        if (role === "teacher") {
          q = query(
            coursesRef,
            where("teacherIds", "array-contains", user.uid),
            where("isActive", "==", true),
          );
        } else if (role === "admin") {
          q = query(coursesRef, where("isActive", "==", true));
        }

        if (q) {
          const snapshot = await getDocs(q);
          const courses = snapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().courseName || "Unknown Course",
          }));
          setAvailableCourses(courses);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchCourses();
  }, [user, role]);

  // Fetch events with filters
  const { events, loading, error } = useCalendarEvents({
    startDate: dateRange.start,
    endDate: dateRange.end,
    userId: user?.uid,
    eventTypes: selectedFilters.length > 0 ? selectedFilters : undefined,
  });

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter((event) => {
      const eventDate = event.startTime.toDate();
      return (
        eventDate.getFullYear() === selectedDate.getFullYear() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getDate() === selectedDate.getDate()
      );
    });
  }, [events, selectedDate]);

  const handlePrevious = () => {
    setCurrentDate((prev) =>
      viewMode === "month" ? getPreviousMonth(prev) : getPreviousWeek(prev),
    );
  };

  const handleNext = () => {
    setCurrentDate((prev) =>
      viewMode === "month" ? getNextMonth(prev) : getNextWeek(prev),
    );
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
    setShowEventList(true);
  };

  const handleEventPress = (event: ExpandedEvent) => {
    setSelectedEvent(event);
    // TODO: Navigate to event detail page or show detail modal
    console.log("Event pressed:", event);
  };

  const handleCreateEvent = () => {
    setShowCreateModal(true);
  };

  const handleSaveEvent = async (eventData: EventFormData) => {
    try {
      const eventsRef = collection(db, "calendarEvents");

      // Get course name if courseInstanceId is provided
      let courseName = undefined;
      if (eventData.courseInstanceId) {
        const course = availableCourses.find(
          (c) => c.id === eventData.courseInstanceId,
        );
        courseName = course?.name;
      }

      const eventDoc: any = {
        ...eventData,
        createdBy: user?.uid,
        createdAt: Timestamp.now(),
      };

      // Only add courseName if it exists
      if (courseName) {
        eventDoc.courseName = courseName;
      }

      await addDoc(eventsRef, eventDoc);

      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // The hook will automatically refresh due to real-time listeners
    setTimeout(() => setRefreshing(false), 1000);
  };

  const toggleFilter = (type: EventType) => {
    setSelectedFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const filterOptions: { type: EventType; label: string; color: string }[] = [
    { type: "class", label: "Classes", color: "#000000" },
    { type: "exam", label: "Exams", color: "#EF4444" },
    { type: "assignment", label: "Assignments", color: "#3B82F6" },
    { type: "personal", label: "Personal", color: "#10B981" },
  ];

  const canCreateEvents = role !== "parent";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <VStack space="xs" style={styles.headerContent}>
          <HStack className="justify-between items-center">
            <Text style={styles.headerTitle}>Calendar</Text>
            <HStack space="sm">
              {/* Filter Button */}
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  selectedFilters.length > 0 && styles.iconButtonActive,
                ]}
                onPress={() => setShowFilters(true)}
              >
                <Filter
                  size={20}
                  color={selectedFilters.length > 0 ? "#FFFFFF" : "#000000"}
                />
                {selectedFilters.length > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>
                      {selectedFilters.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </HStack>
          </HStack>

          {/* View Mode Toggle */}
          <HStack space="sm" className="items-center">
            <TouchableOpacity
              style={[
                styles.viewButton,
                viewMode === "month" && styles.viewButtonActive,
              ]}
              onPress={() => setViewMode("month")}
            >
              <Text
                style={[
                  styles.viewButtonText,
                  viewMode === "month" && styles.viewButtonTextActive,
                ]}
              >
                Month
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewButton,
                viewMode === "week" && styles.viewButtonActive,
              ]}
              onPress={() => setViewMode("week")}
            >
              <Text
                style={[
                  styles.viewButtonText,
                  viewMode === "week" && styles.viewButtonTextActive,
                ]}
              >
                Week
              </Text>
            </TouchableOpacity>
          </HStack>

          {/* Navigation */}
          <HStack className="justify-between items-center">
            <TouchableOpacity onPress={handlePrevious} style={styles.navButton}>
              <ChevronLeft size={24} color="#000000" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleToday} style={styles.todayButton}>
              <Text style={styles.dateText}>
                {viewMode === "month"
                  ? formatDate(currentDate, "month-year")
                  : `${formatDate(dateRange.start, "short")} - ${formatDate(dateRange.end, "short")}`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNext} style={styles.navButton}>
              <ChevronRight size={24} color="#000000" />
            </TouchableOpacity>
          </HStack>
        </VStack>
      </View>

      {/* Calendar View */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && events.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load events</Text>
            <TouchableOpacity
              onPress={handleRefresh}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.calendarContainer}>
            {viewMode === "month" ? (
              <MonthCalendar
                currentDate={currentDate}
                events={events}
                selectedDate={selectedDate}
                onDatePress={handleDatePress}
              />
            ) : (
              <WeekCalendar
                currentDate={currentDate}
                events={events}
                selectedDate={selectedDate}
                onDatePress={handleDatePress}
                onEventPress={handleEventPress}
              />
            )}
          </View>
        )}

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Event Types</Text>
          <VStack space="xs" style={{ marginTop: 8 }}>
            {filterOptions.map((option) => (
              <HStack key={option.type} space="sm" className="items-center">
                <View
                  style={[styles.legendDot, { backgroundColor: option.color }]}
                />
                <Text style={styles.legendLabel}>{option.label}</Text>
              </HStack>
            ))}
          </VStack>
        </View>
      </ScrollView>

      {/* FAB */}
      {canCreateEvents && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreateEvent}
          activeOpacity={0.8}
        >
          <Plus size={24} color="#FFFFFF" strokeWidth={3} />
        </TouchableOpacity>
      )}

      {/* Event List Modal */}
      <Modal
        visible={showEventList}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEventList(false)}
      >
        {selectedDate && (
          <EventList
            date={selectedDate}
            events={selectedDateEvents}
            onEventPress={handleEventPress}
            onClose={() => setShowEventList(false)}
          />
        )}
      </Modal>

      {/* Create Event Modal */}
      <CreateEventModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleSaveEvent}
        userRole={role || "student"}
        userId={user?.uid || ""}
        availableCourses={availableCourses}
        initialDate={selectedDate || currentDate}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="fade"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <VStack space="md">
              <HStack className="justify-between items-center">
                <Text style={styles.filterModalTitle}>Filter Events</Text>
                <TouchableOpacity onPress={() => setShowFilters(false)}>
                  <Text style={styles.filterModalClose}>✕</Text>
                </TouchableOpacity>
              </HStack>

              <VStack space="sm">
                {filterOptions.map((option) => (
                  <TouchableOpacity
                    key={option.type}
                    style={[
                      styles.filterOption,
                      selectedFilters.includes(option.type) &&
                        styles.filterOptionActive,
                    ]}
                    onPress={() => toggleFilter(option.type)}
                  >
                    <HStack space="sm" className="items-center flex-1">
                      <View
                        style={[
                          styles.filterDot,
                          { backgroundColor: option.color },
                        ]}
                      />
                      <Text
                        style={[
                          styles.filterOptionText,
                          selectedFilters.includes(option.type) &&
                            styles.filterOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </HStack>
                    {selectedFilters.includes(option.type) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </VStack>

              <HStack space="sm">
                <TouchableOpacity
                  style={[styles.filterButton, styles.filterButtonSecondary]}
                  onPress={() => {
                    setSelectedFilters([]);
                    setShowFilters(false);
                  }}
                >
                  <Text style={styles.filterButtonTextSecondary}>
                    Clear All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, styles.filterButtonPrimary]}
                  onPress={() => setShowFilters(false)}
                >
                  <Text style={styles.filterButtonTextPrimary}>Apply</Text>
                </TouchableOpacity>
              </HStack>
            </VStack>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  headerContent: {
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    position: "relative",
  },
  iconButtonActive: {
    backgroundColor: "#000000",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },
  viewButtonActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  viewButtonTextActive: {
    color: "#FFFFFF",
  },
  navButton: {
    padding: 8,
  },
  todayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 64,
    alignItems: "center",
  },
  errorContainer: {
    paddingVertical: 64,
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#000000",
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  calendarContainer: {
    paddingVertical: 16,
  },
  legend: {
    padding: 16,
    margin: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 13,
    color: "#6B7280",
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  filterModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "80%",
    maxWidth: 400,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  filterModalClose: {
    fontSize: 24,
    color: "#6B7280",
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  filterOptionActive: {
    backgroundColor: "#F3F4F6",
    borderColor: "#000000",
  },
  filterDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  filterOptionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
  },
  filterOptionTextActive: {
    fontWeight: "600",
    color: "#111827",
  },
  checkmark: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  filterButtonSecondary: {
    backgroundColor: "#F3F4F6",
  },
  filterButtonPrimary: {
    backgroundColor: "#000000",
  },
  filterButtonTextSecondary: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  filterButtonTextPrimary: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
