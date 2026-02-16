import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Pressable,
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
  Clock,
  MapPin,
  Calendar,
  MoreVertical,
} from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { useAuth } from "@/lib/AuthContext";
import {
  useCalendarEvents,
  EventType,
  ExpandedEvent,
} from "@/lib/hooks/useCalendarEvents";
import { CreateEventModal } from "@/components/calendar/CreateEventModal";
import type { EventFormData } from "@/types/calendar";
import {
  formatDate,
  getMonthCalendarGrid,
  getWeekForDate,
  DayInfo,
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
import { undefinedToNull } from "@/lib/utils/firebaseSanitizer";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Dark Pastel Theme
const colors = {
  background: "#111318",
  surface: "#1A1D24",
  elevated: "#20242D",
  border: "#2A2F3A",

  textPrimary: "#F2F4F7",
  textSecondary: "#C5D4CA",

  blue: "#BCF3FF",
  red: "#F65F50",
  yellow: "#F9CD61",
  grey: "#C5D4CA",
  purple: "#7477FF",
};

// Event type configuration - solid colors with good contrast
const eventTypeConfig: Record<EventType, { 
  label: string; 
  bg: string; 
  text: string;
  badgeBg: string;
  badgeText: string;
}> = {
  class: { 
    label: "Classes", 
    bg: "#BCF3FF", 
    text: "#0A4B5C",
    badgeBg: "#232323",
    badgeText: "#BCF3FF"
  },
  exam: { 
    label: "Exams", 
    bg: "#F96857", 
    text: "#FFFFFF",
    badgeBg: "#FFFFFF",
    badgeText: "#F96857"
  },
  assignment: { 
    label: "Assignments", 
    bg: "#F9CD61", 
    text: "#5C4A0A",
    badgeBg: "#232323",
    badgeText: "#F9CD61"
  },
  personal: { 
    label: "Personal", 
    bg: "#7477FF", 
    text: "#FFFFFF",
    badgeBg: "#FFFFFF",
    badgeText: "#7477FF"
  },
};

// Height values for collapse animation
const MONTH_HEIGHT = 380;
const WEEK_HEIGHT = 70;
const SNAP_THRESHOLD = 120;

// Get day color based on event count
const getDayColor = (count: number): string => {
  if (count === 0) return colors.elevated;
  if (count === 1) return colors.blue;
  if (count === 2) return colors.yellow;
  return colors.purple;
};

export default function AdminCalendarScreen() {
  const { user, userData, role } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<EventType[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<{ id: string; name: string }[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ExpandedEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Reanimated shared values
  const scrollY = useSharedValue(0);
  const calendarHeight = useSharedValue(MONTH_HEIGHT);

  // Refs
  const scrollRef = useRef<ScrollView>(null);

  // Fetch all course instances for admin
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user || role !== "admin") return;

      try {
        const coursesRef = collection(db, "courseInstances");
        const q = query(coursesRef, where("isActive", "==", true));
        const snapshot = await getDocs(q);

        const courses = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
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

  // Memoize date range to prevent infinite re-fetching
  const dateRange = useMemo(() => ({
    startDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
    endDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
  }), [currentDate]);

  // Fetch calendar events
  const { events, loading, error, refresh: refreshEvents } = useCalendarEvents({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    eventTypes: selectedFilters.length > 0 ? selectedFilters : undefined,
  });

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    return events.filter((event) => {
      const eventDate = event.startTime.toDate();
      return (
        eventDate.getFullYear() === selectedDate.getFullYear() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getDate() === selectedDate.getDate()
      );
    });
  }, [events, selectedDate]);

  // Get week days for selected date
  const weekDays = useMemo(() => {
    return getWeekForDate(selectedDate);
  }, [selectedDate]);

  // Animated styles
  const calendarAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: calendarHeight.value,
      opacity: interpolate(
        calendarHeight.value,
        [WEEK_HEIGHT, MONTH_HEIGHT],
        [0.95, 1],
        Extrapolate.CLAMP
      ),
    };
  });

  // Handle scroll for collapse/expand
  const handleScroll = useCallback(
    (event: any) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      scrollY.value = offsetY;

      const newHeight = interpolate(
        offsetY,
        [0, SNAP_THRESHOLD],
        [MONTH_HEIGHT, WEEK_HEIGHT],
        Extrapolate.CLAMP
      );
      calendarHeight.value = newHeight;
    },
    [scrollY, calendarHeight]
  );

  // Handle snap on scroll end
  const handleScrollEndDrag = useCallback(
    (event: any) => {
      const offsetY = event.nativeEvent.contentOffset.y;

      if (offsetY > SNAP_THRESHOLD / 2) {
        calendarHeight.value = withSpring(WEEK_HEIGHT, { damping: 20, stiffness: 150 });
        setIsCollapsed(true);
        scrollRef.current?.scrollTo({ y: SNAP_THRESHOLD, animated: true });
      } else {
        calendarHeight.value = withSpring(MONTH_HEIGHT, { damping: 20, stiffness: 150 });
        setIsCollapsed(false);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
    },
    [calendarHeight]
  );

  const handlePreviousMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEventPress = (event: ExpandedEvent) => {
    setSelectedEvent(event);
    setIsEditing(true);
    setTimeout(() => setShowCreateModal(true), 50);
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setIsEditing(false);
    setShowCreateModal(true);
  };

  const handleSaveEvent = async (eventData: EventFormData) => {
    try {
      if (isEditing && selectedEvent) {
        let courseName = null;
        if (eventData.courseInstanceId) {
          const course = availableCourses.find((c) => c.id === eventData.courseInstanceId);
          courseName = course?.name || null;
        }

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

        if (eventData.description) eventDoc.description = eventData.description;
        else eventDoc.description = null;
        if (eventData.location) eventDoc.location = eventData.location;
        else eventDoc.location = null;

        if (eventData.isRecurring) {
          eventDoc.recurrenceRule = {
            frequency: eventData.recurrenceFrequency,
            days: eventData.recurrenceDays || null,
            until: eventData.recurrenceUntil ? Timestamp.fromDate(eventData.recurrenceUntil) : null,
          };
        } else {
          eventDoc.recurrenceRule = null;
        }

        const sanitizedEventDoc = undefinedToNull(eventDoc);
        await updateDoc(
          doc(db, "calendarEvents", selectedEvent.originalEventId || selectedEvent.id),
          sanitizedEventDoc
        );

        setShowCreateModal(false);
        setSelectedEvent(null);
        setIsEditing(false);
        Alert.alert("Success", "Event updated successfully");
      } else {
        const eventsRef = collection(db, "calendarEvents");

        let courseName = null;
        if (eventData.courseInstanceId) {
          const course = availableCourses.find((c) => c.id === eventData.courseInstanceId);
          courseName = course?.name || null;
        }

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

        if (eventData.description) eventDoc.description = eventData.description;
        if (eventData.location) eventDoc.location = eventData.location;

        if (eventData.isRecurring) {
          eventDoc.recurrenceRule = {
            frequency: eventData.recurrenceFrequency,
            days: eventData.recurrenceDays || null,
            until: eventData.recurrenceUntil ? Timestamp.fromDate(eventData.recurrenceUntil) : null,
          };
        } else {
          eventDoc.recurrenceRule = null;
        }

        const sanitizedEventDoc = undefinedToNull(eventDoc);
        await addDoc(eventsRef, sanitizedEventDoc);
        setShowCreateModal(false);
        refreshEvents();
      }
    } catch (error) {
      console.error("Error saving event:", error);
      throw error;
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    Alert.alert("Delete Event", "Are you sure you want to delete this event?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "calendarEvents", selectedEvent.originalEventId || selectedEvent.id));
            setShowCreateModal(false);
            setSelectedEvent(null);
            setIsEditing(false);
            Alert.alert("Success", "Event deleted successfully");
          } catch (error) {
            console.error("Error deleting event:", error);
            Alert.alert("Error", "Failed to delete event");
          }
        },
      },
    ]);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshEvents();
    setRefreshing(false);
  }, [refreshEvents]);

  const toggleFilter = (type: EventType) => {
    setSelectedFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSelectedFilters([]);
  };

  // Get event count for a date
  const getEventCountForDate = (date: Date): number => {
    return events.filter((event) => {
      const eventDate = event.startTime.toDate();
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    }).length;
  };

  // Render month grid
  const renderMonthGrid = () => {
    const weeks = getMonthCalendarGrid(currentDate);

    return weeks.map((week, weekIndex) => (
      <View key={week.weekNumber} style={styles.weekRow}>
        {week.days.map((dayInfo) => {
          const isSelected = selectedDate.toDateString() === dayInfo.date.toDateString();
          const isToday = dayInfo.isToday;
          const eventCount = getEventCountForDate(dayInfo.date);
          const dayColor = getDayColor(eventCount);

          return (
            <Pressable
              key={dayInfo.date.getTime()}
              onPress={() => handleDatePress(dayInfo.date)}
              style={styles.dayCell}
            >
              <View
                style={[
                  styles.dayCircle,
                  {
                    backgroundColor: isSelected ? colors.red : dayColor,
                    opacity: dayInfo.isCurrentMonth ? 1 : 0.3,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    {
                      color: isSelected ? "#FFF" : eventCount > 0 ? "#111" : colors.grey,
                      fontWeight: isToday || isSelected ? "700" : "500",
                    },
                  ]}
                >
                  {dayInfo.dayOfMonth}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    ));
  };

  // Render week view (collapsed state)
  const renderWeekView = () => {
    return (
      <View style={styles.weekViewContainer}>
        {weekDays.map((date, index) => {
          const isSelected = selectedDate.toDateString() === date.toDateString();
          const isToday = date.toDateString() === new Date().toDateString();
          const eventCount = getEventCountForDate(date);
          const dayColor = getDayColor(eventCount);
          const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

          return (
            <Pressable
              key={date.getTime()}
              onPress={() => handleDatePress(date)}
              style={styles.weekDayCell}
            >
              <Text
                style={[
                  styles.weekDayLabel,
                  { color: isSelected ? colors.red : colors.grey },
                ]}
              >
                {dayNames[index]}
              </Text>
              <View
                style={[
                  styles.weekDayCircle,
                  {
                    backgroundColor: isSelected ? colors.red : dayColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.weekDayText,
                    {
                      color: isSelected ? "#FFF" : eventCount > 0 ? "#111" : colors.grey,
                      fontWeight: isToday || isSelected ? "700" : "500",
                    },
                  ]}
                >
                  {date.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  };

  // Format time
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  // Render timeline event card
  // Render timeline event card with solid colors
  const renderTimelineCard = (event: ExpandedEvent, index: number) => {
    const config = eventTypeConfig[event.type];
    const startTime = event.startTime.toDate();
    const endTime = event.endTime.toDate();

    return (
      <TouchableOpacity
        key={event.id}
        onPress={() => handleEventPress(event)}
        style={styles.timelineCard}
      >
        {/* Time column */}
        <View style={styles.timelineTimeColumn}>
          <Text style={styles.timelineTimeText}>{formatTime(startTime)}</Text>
          <View style={styles.timelineDot} />
          <View style={styles.timelineLine} />
        </View>

        {/* Event card - solid color background */}
        <View style={[styles.eventCard, { backgroundColor: config.bg }]}>
          <View style={styles.eventContent}>
            {/* Title row with badge */}
            <HStack space="sm" className="items-center" style={styles.titleRow}>
              <Text style={[styles.eventTitle, { color: config.text }]} numberOfLines={1}>
                {event.title}
              </Text>
              <View style={[styles.typeBadge, { backgroundColor: config.badgeBg }]}>
                <Text style={[styles.typeBadgeText, { color: config.badgeText }]}>
                  {config.label}
                </Text>
              </View>
            </HStack>

            <Text style={[styles.eventTime, { color: config.text, opacity: 0.8 }]}>
              {formatTime(startTime)} - {formatTime(endTime)}
            </Text>

            {/* Course badge if exists */}
            {event.courseName && (
              <View style={styles.courseBadgeContainer}>
                <View style={[styles.courseBadge, { backgroundColor: config.text }]}>
                  <Text style={[styles.courseBadgeText, { color: config.bg }]}>
                    {event.courseName}
                  </Text>
                </View>
              </View>
            )}

            {event.location && (
              <HStack space="xs" className="items-center" style={styles.locationContainer}>
                <Icon as={MapPin} size="2xs" style={{ color: config.text }} />
                <Text style={[styles.locationText, { color: config.text }]}>
                  {event.location}
                </Text>
              </HStack>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <HStack className="justify-between items-center">
          <VStack>
            <Text style={styles.headerTitle}>Calendar</Text>
            <Text style={styles.headerSubtitle}>
              {formatDate(currentDate, "month-year")}
            </Text>
          </VStack>

          <HStack space="sm">
            <TouchableOpacity
              style={[styles.iconButton, selectedFilters.length > 0 && styles.iconButtonActive]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Icon
                as={Filter}
                size="sm"
                style={{ color: selectedFilters.length > 0 ? "#111" : colors.grey }}
              />
              {selectedFilters.length > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{selectedFilters.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={handleToday}>
              <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={handleCreateEvent}>
              <Icon as={Plus} size="sm" className="text-[#FFF]" />
            </TouchableOpacity>
          </HStack>
        </HStack>

        {/* Month navigation */}
        <HStack className="justify-between items-center" style={styles.monthNav}>
          <TouchableOpacity onPress={handlePreviousMonth} style={styles.navArrow}>
            <Icon as={ChevronLeft} size="md" className="text-[#FFF]" />
          </TouchableOpacity>

          <View style={styles.monthSelector}>
            <Text style={styles.monthText}>{formatDate(currentDate, "month-year")}</Text>
          </View>

          <TouchableOpacity onPress={handleNextMonth} style={styles.navArrow}>
            <Icon as={ChevronRight} size="md" className="text-[#FFF]" />
          </TouchableOpacity>
        </HStack>
      </View>

      {/* Filter Chips */}
      {showFilters && (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <HStack space="sm" style={styles.filterChips}>
              {(Object.keys(eventTypeConfig) as EventType[]).map((type) => {
                const isActive = selectedFilters.includes(type);
                const config = eventTypeConfig[type];
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => toggleFilter(type)}
                    style={[styles.filterChip, isActive && { backgroundColor: config.bg }]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && { color: "#111", fontWeight: "700" },
                      ]}
                    >
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {selectedFilters.length > 0 && (
                <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
              )}
            </HStack>
          </ScrollView>
        </View>
      )}

      {/* Collapsible Calendar */}
      <Animated.View style={[styles.calendarContainer, calendarAnimatedStyle]}>
        {/* Day headers */}
        <View style={styles.dayHeaders}>
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <View key={index} style={styles.dayHeaderCell}>
              <Text style={styles.dayHeaderText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar content */}
        <View style={styles.calendarContent}>
          {isCollapsed ? renderWeekView() : renderMonthGrid()}
        </View>
      </Animated.View>

      {/* Timeline */}
      <ScrollView
        ref={scrollRef}
        style={styles.timelineScroll}
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Date header */}
        <View style={styles.timelineHeader}>
          <Text style={styles.timelineDateTitle}>
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
          <Text style={styles.timelineEventCount}>
            {selectedDateEvents.length} {selectedDateEvents.length === 1 ? "event" : "events"}
          </Text>
        </View>

        {/* Events */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.purple} style={styles.loader} />
        ) : selectedDateEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No events for this day</Text>
            <TouchableOpacity onPress={handleCreateEvent} style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>Create Event</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.timelineList}>
            {selectedDateEvents.map((event, index) => renderTimelineCard(event, index))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create/Edit Event Modal */}
      <CreateEventModal
        visible={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedEvent(null);
          setIsEditing(false);
        }}
        onSave={handleSaveEvent}
        onDelete={isEditing ? handleDeleteEvent : undefined}
        userRole={role || "admin"}
        userId={user?.uid || ""}
        availableCourses={availableCourses}
        initialDate={selectedDate}
        editingEvent={isEditing ? selectedEvent : null}
        isEditing={isEditing}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.grey,
    marginTop: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  iconButtonActive: {
    backgroundColor: colors.purple,
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colors.red,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFF",
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.grey,
  },
  monthNav: {
    marginTop: 16,
  },
  navArrow: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  monthSelector: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  monthText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  filterContainer: {
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterChips: {
    paddingRight: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  clearButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.elevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.red,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.red,
  },
  calendarContainer: {
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  dayHeaders: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: "center",
  },
  dayHeaderText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.grey,
  },
  calendarContent: {
    flex: 1,
    paddingHorizontal: 12,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    aspectRatio: 1,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 15,
  },
  weekViewContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingBottom: 16,
    justifyContent: "space-between",
  },
  weekDayCell: {
    flex: 1,
    alignItems: "center",
  },
  weekDayLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  weekDayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  weekDayText: {
    fontSize: 16,
  },
  timelineScroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  timelineHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timelineDateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  timelineEventCount: {
    fontSize: 14,
    color: colors.grey,
    marginTop: 4,
  },
  timelineList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  timelineCard: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineTimeColumn: {
    width: 60,
    alignItems: "center",
  },
  timelineTimeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.grey,
    marginBottom: 8,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.purple,
    borderWidth: 3,
    borderColor: colors.background,
  },
  timelineLine: {
    position: "absolute",
    top: 32,
    bottom: -24,
    width: 2,
    backgroundColor: colors.border,
  },
  eventCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.1)",
  },
  eventContent: {
    flex: 1,
    padding: 14,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  eventTime: {
    fontSize: 13,
    marginTop: 6,
    fontWeight: "500",
  },
  courseBadgeContainer: {
    marginTop: 10,
  },
  courseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  courseBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  locationContainer: {
    marginTop: 8,
  },
  locationText: {
    fontSize: 12,
    fontWeight: "500",
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.grey,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: colors.purple,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
});
