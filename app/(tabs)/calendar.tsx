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
import { useCalendarEvents, EventType } from "@/lib/hooks/useCalendarEvents";
import type { ExpandedEvent } from "@/types/calendar";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { WeekCalendar } from "@/components/calendar/WeekCalendar";
import { EventList } from "@/components/calendar/EventList";
import { CreateEventModal } from "@/components/calendar/CreateEventModal";
import type { EventFormData } from "@/types/calendar";
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
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Alert } from "react-native";
import { canEditEvent } from "@/lib/calendarPermissions";
import { undefinedToNull } from "@/lib/utils/firebaseSanitizer";

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
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ExpandedEvent | null>(
    null,
  );
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Get date range based on view mode
  const dateRange = useMemo(() => {
    return viewMode === "month"
      ? getMonthRange(currentDate)
      : getWeekRange(currentDate);
  }, [currentDate, viewMode]);

  // Fetch course instances for teacher/admin AND enrolled courses for students
  React.useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;

      try {
        let courseIds: string[] = [];

        if (role === "student") {
          // Get enrolled courses for student
          const enrollmentsRef = collection(db, "enrollments");
          const enrollmentsQuery = query(
            enrollmentsRef,
            where("studentId", "==", user.uid),
          );
          const enrollmentsSnap = await getDocs(enrollmentsQuery);
          courseIds = enrollmentsSnap.docs.map(
            (doc) => doc.data().courseInstanceId,
          );
        } else if (role === "teacher") {
          // Get courses taught by teacher
          const coursesRef = collection(db, "courseInstances");
          const q = query(
            coursesRef,
            where("teacherIds", "array-contains", user.uid),
            where("isActive", "==", true),
          );
          const snapshot = await getDocs(q);
          courseIds = snapshot.docs.map((doc) => doc.id);
        } else if (role === "admin") {
          // Admin sees all active courses
          const coursesRef = collection(db, "courseInstances");
          const q = query(coursesRef, where("isActive", "==", true));
          const snapshot = await getDocs(q);
          courseIds = snapshot.docs.map((doc) => doc.id);
        }

        // Fetch course details
        if (courseIds.length > 0) {
          const coursesRef = collection(db, "courseInstances");
          const courses: { id: string; name: string }[] = [];

          // Firestore 'in' query supports up to 10 items, so we batch
          for (let i = 0; i < courseIds.length; i += 10) {
            const batchIds = courseIds.slice(i, i + 10);
            const q = query(coursesRef, where("__name__", "in", batchIds));
            const snapshot = await getDocs(q);
            snapshot.docs.forEach((doc) => {
              courses.push({
                id: doc.id,
                name: doc.data().courseName || "Unknown Course",
              });
            });
          }

          setAvailableCourses(courses);
          setEnrolledCourseIds(courseIds);
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
    courseInstanceIds:
      role === "student" || role === "teacher" ? enrolledCourseIds : undefined,
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
    setShowEventDetail(true);
  };

  const handleCreateEvent = () => {
    setShowCreateModal(true);
  };

  const handleSaveEvent = async (eventData: EventFormData) => {
    try {
      const eventsRef = collection(db, "calendarEvents");

      // Get course name if courseInstanceId is provided
      let courseName = null;
      if (eventData.courseInstanceId) {
        const course = availableCourses.find(
          (c) => c.id === eventData.courseInstanceId,
        );
        courseName = course?.name || null;
      }

      // Build event document, ensuring no undefined values
      const eventDoc: any = {
        title: eventData.title,
        type: eventData.type,
        createdBy: user?.uid,
        createdAt: Timestamp.now(),
        startTime: Timestamp.fromDate(eventData.startDate),
        endTime: Timestamp.fromDate(eventData.endDate),
        isAttendanceEnabled: eventData.isAttendanceEnabled,
        courseInstanceId: eventData.courseInstanceId || null,
        courseName: courseName,
      };

      // Only add optional fields if they have values (not undefined)
      if (eventData.description) {
        eventDoc.description = eventData.description;
      }
      if (eventData.location) {
        eventDoc.location = eventData.location;
      }

      // Handle recurrence
      if (eventData.isRecurring) {
        eventDoc.recurrenceRule = {
          frequency: eventData.recurrenceFrequency,
          days: eventData.recurrenceDays || null,
          until: eventData.recurrenceUntil
            ? Timestamp.fromDate(eventData.recurrenceUntil)
            : null,
        };
      } else {
        eventDoc.recurrenceRule = null;
      }

      // Sanitize to remove any undefined values before saving to Firebase
      const sanitizedEventDoc = undefinedToNull(eventDoc);
      await addDoc(eventsRef, sanitizedEventDoc);

      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  };

  const handleUpdateEvent = async (eventData: EventFormData) => {
    if (!user || !selectedEvent) return;

    try {
      // Check if user can edit this event
      if (!canEditEvent(role || "student", selectedEvent.createdBy, user.uid)) {
        Alert.alert("Error", "You don't have permission to edit this event");
        return;
      }

      // Get course name if courseInstanceId is provided
      let courseName = null;
      if (eventData.courseInstanceId) {
        const course = availableCourses.find(
          (c) => c.id === eventData.courseInstanceId,
        );
        courseName = course?.name || null;
      }

      // Build event document, ensuring no undefined values
      const eventDoc: any = {
        title: eventData.title,
        type: eventData.type,
        courseInstanceId: eventData.courseInstanceId || null,
        courseName: courseName,
        startTime: Timestamp.fromDate(eventData.startDate),
        endTime: Timestamp.fromDate(eventData.endDate),
        isAttendanceEnabled: eventData.isAttendanceEnabled,
        updatedAt: Timestamp.now(),
      };

      // Only add optional fields if they have values (not undefined)
      if (eventData.description) {
        eventDoc.description = eventData.description;
      } else {
        eventDoc.description = null;
      }
      if (eventData.location) {
        eventDoc.location = eventData.location;
      } else {
        eventDoc.location = null;
      }

      if (eventData.isRecurring) {
        eventDoc.recurrenceRule = {
          frequency: eventData.recurrenceFrequency,
          days: eventData.recurrenceDays || null,
          until: eventData.recurrenceUntil
            ? Timestamp.fromDate(eventData.recurrenceUntil)
            : null,
        };
      } else {
        eventDoc.recurrenceRule = null;
      }

      // Sanitize to remove any undefined values before saving to Firebase
      const sanitizedEventDoc = undefinedToNull(eventDoc);
      await updateDoc(
        doc(
          db,
          "calendarEvents",
          selectedEvent.originalEventId || selectedEvent.id,
        ),
        sanitizedEventDoc,
      );

      setShowCreateModal(false);
      setShowEventDetail(false);
      setIsEditing(false);
      setSelectedEvent(null);

      Alert.alert("Success", "Event updated successfully");
    } catch (error) {
      console.error("Error updating event:", error);
      Alert.alert("Error", "Failed to update event");
    }
  };

  const handleDeleteEvent = async (eventId: string, createdBy: string) => {
    if (!user) return;

    // Check if user can delete this event
    if (!canEditEvent(role || "student", createdBy, user.uid)) {
      Alert.alert("Error", "You don't have permission to delete this event");
      return;
    }

    Alert.alert("Delete Event", "Are you sure you want to delete this event?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "calendarEvents", eventId));
            setShowEventDetail(false);
            setSelectedEvent(null);
            Alert.alert("Success", "Event deleted successfully");
          } catch (error) {
            console.error("Error deleting event:", error);
            Alert.alert("Error", "Failed to delete event");
          }
        },
      },
    ]);
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
        onClose={() => {
          setShowCreateModal(false);
          setIsEditing(false);
          setSelectedEvent(null);
        }}
        onSave={isEditing ? handleUpdateEvent : handleSaveEvent}
        userRole={role || "student"}
        userId={user?.uid || ""}
        availableCourses={availableCourses}
        initialDate={selectedDate || currentDate}
        editingEvent={isEditing ? selectedEvent : null}
        isEditing={isEditing}
      />

      {/* Event Detail Modal */}
      <Modal
        visible={showEventDetail}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowEventDetail(false);
          setSelectedEvent(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.eventDetailModal}>
            <View style={styles.eventDetailHeader}>
              <Text style={styles.eventDetailTitle}>
                {selectedEvent?.title}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowEventDetail(false);
                  setSelectedEvent(null);
                }}
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
                    {selectedEvent?.type
                      ? selectedEvent.type.charAt(0).toUpperCase() +
                        selectedEvent.type.slice(1)
                      : ""}
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
                      ? formatDate(selectedEvent.startTime.toDate(), "full")
                      : ""}
                  </Text>
                </HStack>

                <HStack space="sm">
                  <CalendarIcon size={16} color="#6B7280" />
                  <Text style={styles.eventDetailLabel}>
                    {selectedEvent?.startTime && selectedEvent?.endTime
                      ? `${selectedEvent.startTime.toDate().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })} - ${selectedEvent.endTime.toDate().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
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

            {selectedEvent &&
              user &&
              canEditEvent(
                role || "student",
                selectedEvent.createdBy,
                user.uid,
              ) && (
                <View style={styles.eventDetailFooter}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => {
                      setIsEditing(true);
                      setShowEventDetail(false);
                      setShowCreateModal(true);
                    }}
                  >
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() =>
                      selectedEvent &&
                      handleDeleteEvent(
                        selectedEvent.originalEventId || selectedEvent.id,
                        selectedEvent.createdBy,
                      )
                    }
                  >
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
          </View>
        </View>
      </Modal>

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
    bottom: 120,
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
