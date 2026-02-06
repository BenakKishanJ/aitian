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
  Search,
  Trash2,
  Edit3,
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
  deleteDoc,
  doc,
  Timestamp,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Alert } from "react-native";

type ViewMode = "month" | "week";

export default function AdminCalendarScreen() {
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
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Get date range based on view mode
  const dateRange = useMemo(() => {
    return viewMode === "month"
      ? getMonthRange(currentDate)
      : getWeekRange(currentDate);
  }, [currentDate, viewMode]);

  // Fetch all course instances for admin
  React.useEffect(() => {
    const fetchCourses = async () => {
      if (!user || role !== "admin") return;

      try {
        const coursesRef = collection(db, "courseInstances");
        const q = query(coursesRef, where("isActive", "==", true));
        const snapshot = await getDocs(q);

        const courses = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            // Get course details
            const courseDoc = await getDocs(
              query(collection(db, "courses"), where("__name__", "==", data.courseId))
            );
            const courseName = courseDoc.docs[0]?.data().name || "Unknown Course";
            return {
              id: docSnap.id,
              name: courseName,
            };
          })
        );

        setAvailableCourses(courses);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchCourses();
  }, [user, role]);

  // Fetch calendar events
  const {
    events,
    loading,
    error,
    refresh: refreshEvents,
  } = useCalendarEvents({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Apply type filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter((event) =>
        selectedFilters.includes(event.type)
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          (event.courseName && event.courseName.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [events, selectedFilters, searchQuery]);

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    setCurrentDate((prev) =>
      viewMode === "month" ? getPreviousMonth(prev) : getPreviousWeek(prev)
    );
  }, [viewMode]);

  const handleNext = useCallback(() => {
    setCurrentDate((prev) =>
      viewMode === "month" ? getNextMonth(prev) : getNextWeek(prev)
    );
  }, [viewMode]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Date selection handler
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setShowEventList(true);
  }, []);

  // Event creation handler
  const handleCreateEvent = async (formData: EventFormData) => {
    if (!user) return;

    try {
      const startDateTime = new Date(formData.startDate);
      startDateTime.setHours(
        formData.startTime.getHours(),
        formData.startTime.getMinutes()
      );

      const endDateTime = new Date(formData.endDate);
      endDateTime.setHours(
        formData.endTime.getHours(),
        formData.endTime.getMinutes()
      );

      const eventData = {
        title: formData.title,
        type: formData.type,
        description: formData.description,
        courseInstanceId: formData.courseInstanceId || null,
        courseName: formData.courseInstanceId
          ? availableCourses.find((c) => c.id === formData.courseInstanceId)
              ?.name
          : null,
        createdBy: user.uid,
        startTime: Timestamp.fromDate(startDateTime),
        endTime: Timestamp.fromDate(endDateTime),
        location: formData.location,
        recurrenceRule: formData.isRecurring
          ? {
              frequency: formData.recurrenceFrequency,
              days: formData.recurrenceDays,
              until: formData.recurrenceUntil
                ? Timestamp.fromDate(formData.recurrenceUntil)
                : null,
            }
          : null,
        isAttendanceEnabled: formData.isAttendanceEnabled,
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, "calendarEvents"), eventData);
      setShowCreateModal(false);
      refreshEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      Alert.alert("Error", "Failed to create event");
    }
  };

  // Event deletion handler
  const handleDeleteEvent = async (eventId: string) => {
    Alert.alert(
      "Delete Event",
      "Are you sure you want to delete this event?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "calendarEvents", eventId));
              setShowEventDetail(false);
              setSelectedEvent(null);
              refreshEvents();
            } catch (error) {
              console.error("Error deleting event:", error);
              Alert.alert("Error", "Failed to delete event");
            }
          },
        },
      ]
    );
  };

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshEvents();
    setRefreshing(false);
  }, [refreshEvents]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter((event) => {
      const eventDate = event.startTime.toDate();
      return (
        eventDate.getDate() === selectedDate.getDate() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [filteredEvents, selectedDate]);

  // Filter options
  const filterOptions: { type: EventType; label: string; color: string }[] = [
    { type: "class", label: "Classes", color: "#000000" },
    { type: "exam", label: "Exams", color: "#EF4444" },
    { type: "assignment", label: "Assignments", color: "#3B82F6" },
    { type: "personal", label: "Personal", color: "#10B981" },
  ];

  const toggleFilter = (type: EventType) => {
    setSelectedFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <HStack space="md" style={styles.headerTop}>
          <Text style={styles.headerTitle}>Calendar</Text>
          <HStack space="sm">
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Search size={20} color="#000000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} color="#000000" />
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

        {showSearch && (
          <View style={styles.searchContainer}>
            <Search size={16} color="#9CA3AF" />
            <Text
              style={styles.searchInput}
              // Using Text component for display, actual implementation would use TextInput
            >
              {searchQuery || "Search events..."}
            </Text>
          </View>
        )}

        {/* View Mode Toggle */}
        <HStack space="sm" style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === "month" && styles.viewToggleButtonActive,
            ]}
            onPress={() => setViewMode("month")}
          >
            <Text
              style={[
                styles.viewToggleText,
                viewMode === "month" && styles.viewToggleTextActive,
              ]}
            >
              Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === "week" && styles.viewToggleButtonActive,
            ]}
            onPress={() => setViewMode("week")}
          >
            <Text
              style={[
                styles.viewToggleText,
                viewMode === "week" && styles.viewToggleTextActive,
              ]}
            >
              Week
            </Text>
          </TouchableOpacity>
        </HStack>

        {/* Navigation */}
        <HStack space="md" style={styles.navigation}>
          <TouchableOpacity onPress={handlePrevious} style={styles.navButton}>
            <ChevronLeft size={24} color="#000000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleToday}>
            <Text style={styles.currentDate}>
              {formatDate(currentDate, "MMMM yyyy")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} style={styles.navButton}>
            <ChevronRight size={24} color="#000000" />
          </TouchableOpacity>
        </HStack>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Filter by Type</Text>
          <HStack space="sm" style={styles.filterChips}>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.type}
                style={[
                  styles.filterChip,
                  selectedFilters.includes(option.type) && {
                    backgroundColor: option.color,
                    borderColor: option.color,
                  },
                ]}
                onPress={() => toggleFilter(option.type)}
              >
                <View
                  style={[
                    styles.filterChipDot,
                    { backgroundColor: option.color },
                  ]}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilters.includes(option.type) &&
                      styles.filterChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </HStack>
        </View>
      )}

      {/* Calendar */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {viewMode === "month" ? (
          <MonthCalendar
            currentDate={currentDate}
            events={filteredEvents}
            onDateSelect={handleDateSelect}
            selectedDate={selectedDate}
          />
        ) : (
          <WeekCalendar
            currentDate={currentDate}
            events={filteredEvents}
            onEventPress={(event) => {
              setSelectedEvent(event);
              setShowEventDetail(true);
            }}
          />
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

      {/* Event List Modal */}
      <Modal
        visible={showEventList}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEventList(false)}
      >
        <EventList
          date={selectedDate || new Date()}
          events={selectedDateEvents}
          onClose={() => setShowEventList(false)}
          onEventPress={(event) => {
            setSelectedEvent(event);
            setShowEventList(false);
            setShowEventDetail(true);
          }}
        />
      </Modal>

      {/* Create Event Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateEvent}
          availableCourses={availableCourses}
          initialDate={selectedDate || new Date()}
        />
      </Modal>

      {/* Event Detail Modal */}
      <Modal
        visible={showEventDetail}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEventDetail(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.eventDetailModal}>
            <View style={styles.eventDetailHeader}>
              <Text style={styles.eventDetailTitle}>
                {selectedEvent?.title}
              </Text>
              <TouchableOpacity
                onPress={() => setShowEventDetail(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.eventDetailContent}>
              <VStack space="md">
                <HStack space="sm" style={styles.eventTypeBadge}>
                  <View
                    style={[
                      styles.eventTypeDot,
                      {
                        backgroundColor:
                          selectedEvent?.type === "exam"
                            ? "#EF4444"
                            : selectedEvent?.type === "assignment"
                            ? "#3B82F6"
                            : selectedEvent?.type === "personal"
                            ? "#10B981"
                            : "#000000",
                      },
                    ]}
                  />
                  <Text style={styles.eventTypeText}>
                    {selectedEvent?.type.charAt(0).toUpperCase() +
                      selectedEvent?.type.slice(1)}
                  </Text>
                </HStack>

                {selectedEvent?.courseName && (
                  <HStack space="sm">
                    <CalendarIcon size={16} color="#6B7280" />
                    <Text style={styles.eventDetailLabel}>
                      {selectedEvent.courseName}
                    </Text>
                  </HStack>
                )}

                <HStack space="sm">
                  <CalendarIcon size={16} color="#6B7280" />
                  <Text style={styles.eventDetailLabel}>
                    {selectedEvent?.startTime
                      ? formatDate(selectedEvent.startTime.toDate(),
                          "EEEE, MMMM d, yyyy")
                      : ""}
                  </Text>
                </HStack>

                <HStack space="sm">
                  <CalendarIcon size={16} color="#6B7280" />
                  <Text style={styles.eventDetailLabel}>
                    {selectedEvent?.startTime && selectedEvent?.endTime
                      ? `${formatDate(
                          selectedEvent.startTime.toDate(),
                          "h:mm a"
                        )} - ${formatDate(
                          selectedEvent.endTime.toDate(),
                          "h:mm a"
                        )}`
                      : ""}
                  </Text>
                </HStack>

                {selectedEvent?.location && (
                  <HStack space="sm">
                    <CalendarIcon size={16} color="#6B7280" />
                    <Text style={styles.eventDetailLabel}>
                      Location: {selectedEvent.location}
                    </Text>
                  </HStack>
                )}

                {selectedEvent?.description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionLabel}>Description</Text>
                    <Text style={styles.descriptionText}>
                      {selectedEvent.description}
                    </Text>
                  </View>
                )}

                {selectedEvent?.isAttendanceEnabled && (
                  <View style={styles.attendanceBadge}>
                    <Text style={styles.attendanceText}>
                      Attendance Enabled
                    </Text>
                  </View>
                )}
              </VStack>
            </ScrollView>

            <View style={styles.eventDetailFooter}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => {
                  // TODO: Implement edit functionality
                  Alert.alert("Info", "Edit functionality coming soon");
                }}
              >
                <Edit3 size={18} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() =>
                  selectedEvent && handleDeleteEvent(selectedEvent.id)
                }
              >
                <Trash2 size={18} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
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
  viewToggle: {
    justifyContent: "center",
    marginBottom: 12,
  },
  viewToggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
  },
  viewToggleButtonActive: {
    backgroundColor: "#000000",
  },
  viewToggleText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  viewToggleTextActive: {
    color: "#FFFFFF",
  },
  navigation: {
    justifyContent: "center",
    alignItems: "center",
  },
  navButton: {
    padding: 4,
  },
  currentDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    minWidth: 120,
    textAlign: "center",
  },
  filtersContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filtersTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  filterChips: {
    flexWrap: "wrap",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  filterChipText: {
    fontSize: 13,
    color: "#374151",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  eventDetailModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  eventDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  eventDetailTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    color: "#6B7280",
  },
  eventDetailContent: {
    padding: 20,
  },
  eventTypeBadge: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  eventTypeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eventTypeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  eventDetailLabel: {
    fontSize: 14,
    color: "#374151",
  },
  descriptionContainer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  attendanceBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  attendanceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
  eventDetailFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  editButton: {
    backgroundColor: "#000000",
  },
  deleteButton: {
    backgroundColor: "#EF4444",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
