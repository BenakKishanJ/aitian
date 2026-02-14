import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Plus,
  X,
  Calendar as CalendarIcon,
  Clock,
  Repeat,
  Trash2,
  Edit,
  Search,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { undefinedToNull } from "@/lib/utils/firebaseSanitizer";

interface CalendarEvent {
  id: string;
  title: string;
  type: "class" | "exam" | "assignment" | "personal";
  courseInstanceId?: string;
  courseName?: string;
  createdBy: string;
  createdByName?: string;
  startTime: any;
  endTime: any;
  recurrenceRule?: {
    frequency: "weekly" | "daily" | "none";
    days?: string[];
    until?: any;
  };
  isAttendanceEnabled: boolean;
  createdAt: any;
}

interface CourseInstance {
  id: string;
  courseId: string;
  departmentId: string;
  semester: number;
  section: string;
  courseName: string;
}

export default function AdminEventsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [courseInstances, setCourseInstances] = useState<CourseInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Form state
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState<
    "class" | "exam" | "assignment" | "personal"
  >("class");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<
    "daily" | "weekly"
  >("weekly");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [recurringUntil, setRecurringUntil] = useState("");
  const [attendanceEnabled, setAttendanceEnabled] = useState(true);
  const [creating, setCreating] = useState(false);

  const weekDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchEvents(), fetchCourseInstances()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const eventsRef = collection(db, "calendarEvents");
      const eventsQuery = query(eventsRef, orderBy("startTime", "desc"));
      const eventsSnap = await getDocs(eventsQuery);

      const fetchedEvents = await Promise.all(
        eventsSnap.docs.map(async (eventDoc) => {
          const eventData = { id: eventDoc.id, ...eventDoc.data() } as CalendarEvent;

          // Fetch course name if courseInstanceId exists
          if (eventData.courseInstanceId) {
            try {
              const instanceDoc = await getDocs(
                query(
                  collection(db, "courseInstances"),
                  where("__name__", "==", eventData.courseInstanceId)
                )
              );
              if (!instanceDoc.empty) {
                const instanceData = instanceDoc.docs[0].data();
                const courseDoc = await getDocs(
                  query(
                    collection(db, "courses"),
                    where("__name__", "==", instanceData.courseId)
                  )
                );
                if (!courseDoc.empty) {
                  eventData.courseName = courseDoc.docs[0].data().name;
                }
              }
            } catch (err) {
              console.error("Error fetching course name:", err);
            }
          }

          // Fetch creator name
          try {
            const userDoc = await getDocs(
              query(collection(db, "users"), where("__name__", "==", eventData.createdBy))
            );
            if (!userDoc.empty) {
              eventData.createdByName = userDoc.docs[0].data().name;
            }
          } catch (err) {
            console.error("Error fetching creator name:", err);
          }

          return eventData;
        })
      );

      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      Alert.alert("Error", "Failed to fetch events");
    }
  };

  const fetchCourseInstances = async () => {
    try {
      const instancesRef = collection(db, "courseInstances");
      const instancesQuery = query(
        instancesRef,
        where("isActive", "==", true),
        orderBy("semester")
      );
      const instancesSnap = await getDocs(instancesQuery);

      const instances = await Promise.all(
        instancesSnap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          // Get course name
          const coursesRef = collection(db, "courses");
          const courseQuery = query(coursesRef, where("__name__", "==", data.courseId));
          const courseSnap = await getDocs(courseQuery);
          const courseName = courseSnap.docs[0]?.data().name || "Unknown Course";

          return {
            id: docSnap.id,
            courseId: data.courseId,
            departmentId: data.departmentId,
            semester: data.semester,
            section: data.section,
            courseName,
          } as CourseInstance;
        })
      );
      setCourseInstances(instances);
    } catch (error) {
      console.error("Error fetching course instances:", error);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventTitle.trim() || !startDate || !startTime || !endTime) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    // Validate course selection for class/exam/assignment
    if (
      (eventType === "class" || eventType === "exam" || eventType === "assignment") &&
      !selectedCourseId
    ) {
      Alert.alert("Error", "Please select a course");
      return;
    }

    setCreating(true);
    try {
      const startDateTime = new Date(`${startDate}T${startTime}:00`);
      const endDateTime = new Date(`${startDate}T${endTime}:00`);

      if (endDateTime <= startDateTime) {
        Alert.alert("Error", "End time must be after start time");
        setCreating(false);
        return;
      }

      let recurrenceRule: any = null;
      if (isRecurring) {
        if (recurringFrequency === "weekly" && selectedDays.length === 0) {
          Alert.alert("Error", "Please select at least one day for weekly recurrence");
          setCreating(false);
          return;
        }

        recurrenceRule = {
          frequency: recurringFrequency,
          days: recurringFrequency === "weekly" ? selectedDays : null,
          until: recurringUntil
            ? Timestamp.fromDate(new Date(recurringUntil))
            : null,
        };
      }

      // Get course name if course is selected
      const selectedCourse = courseInstances.find(
        (c) => c.id === selectedCourseId
      );

      const newEvent: any = {
        title: eventTitle.trim(),
        type: eventType,
        courseInstanceId: selectedCourseId || null,
        courseName: selectedCourse?.courseName || null,
        createdBy: user?.uid,
        startTime: Timestamp.fromDate(startDateTime),
        endTime: Timestamp.fromDate(endDateTime),
        recurrenceRule: recurrenceRule,
        isAttendanceEnabled: eventType === "class" ? attendanceEnabled : false,
        createdAt: serverTimestamp(),
      };

      // Sanitize to remove any undefined values before saving to Firebase
      const sanitizedEvent = undefinedToNull(newEvent);
      await addDoc(collection(db, "calendarEvents"), sanitizedEvent);

      Alert.alert("Success", "Event created successfully");
      resetForm();
      setShowEventModal(false);
      fetchEvents();
    } catch (error: any) {
      console.error("Error creating event:", error);
      Alert.alert("Error", error.message || "Failed to create event");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    Alert.alert(
      "Delete Event",
      `Are you sure you want to delete "${event.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "calendarEvents", event.id));
              Alert.alert("Success", "Event deleted successfully");
              fetchEvents();
            } catch (error) {
              console.error("Error deleting event:", error);
              Alert.alert("Error", "Failed to delete event");
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setEventTitle("");
    setEventType("class");
    setSelectedCourseId("");
    setStartDate("");
    setStartTime("");
    setEndTime("");
    setIsRecurring(false);
    setRecurringFrequency("weekly");
    setSelectedDays([]);
    setRecurringUntil("");
    setAttendanceEnabled(true);
    setSelectedEvent(null);
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const formatEventTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "class":
        return { bg: "#DBEAFE", text: "#1E40AF" };
      case "exam":
        return { bg: "#FEE2E2", text: "#991B1B" };
      case "assignment":
        return { bg: "#FEF3C7", text: "#92400E" };
      case "personal":
        return { bg: "#F3E8FF", text: "#6B21A8" };
      default:
        return { bg: "#F3F4F6", text: "#374151" };
    }
  };

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.courseName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <VStack space="sm" className="px-4 py-3">
          <Text className="text-2xl font-bold text-black">
            Calendar Events
          </Text>
          <Text className="text-sm text-gray-600">
            Manage classes, exams, and events
          </Text>
        </VStack>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Icon as={Search} size="md" className="text-gray-400" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
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
      </View>

      {/* Events List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text className="text-gray-600 mt-4">Loading events...</Text>
          </View>
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CalendarIcon size={48} color="#9CA3AF" />
            <Text className="text-gray-500 text-center text-lg mt-4">
              {searchQuery ? "No events found" : "No events created yet"}
            </Text>
            <Text className="text-gray-400 text-center text-sm mt-2">
              Create your first event to get started
            </Text>
          </View>
        ) : (
          filteredEvents.map((event) => {
            const typeColors = getTypeColor(event.type);
            return (
              <View key={event.id} style={styles.eventCard}>
                <VStack space="md">
                  {/* Header */}
                  <HStack className="justify-between items-start">
                    <VStack space="xs" className="flex-1">
                      <Text className="text-lg font-bold text-black">
                        {event.title}
                      </Text>
                      {event.courseName && (
                        <Text className="text-sm text-gray-600">
                          {event.courseName}
                        </Text>
                      )}
                    </VStack>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteEvent(event)}
                    >
                      <Icon as={Trash2} size="sm" className="text-red-600" />
                    </TouchableOpacity>
                  </HStack>

                  {/* Info */}
                  <VStack space="xs">
                    <HStack space="xs" className="items-center">
                      <Icon as={Clock} size="sm" className="text-gray-600" />
                      <Text className="text-sm text-gray-700">
                        {formatEventTime(event.startTime)}
                      </Text>
                    </HStack>

                    {event.recurrenceRule && (
                      <HStack space="xs" className="items-center">
                        <Icon as={Repeat} size="sm" className="text-gray-600" />
                        <Text className="text-sm text-gray-700">
                          Repeats {event.recurrenceRule.frequency}
                          {event.recurrenceRule.days &&
                            ` (${event.recurrenceRule.days.join(", ")})`}
                        </Text>
                      </HStack>
                    )}

                    {event.createdByName && (
                      <Text className="text-xs text-gray-500">
                        By {event.createdByName}
                      </Text>
                    )}
                  </VStack>

                  {/* Badges */}
                  <HStack space="sm" className="flex-wrap">
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: typeColors.bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          { color: typeColors.text },
                        ]}
                      >
                        {event.type.toUpperCase()}
                      </Text>
                    </View>

                    {event.isAttendanceEnabled && (
                      <View style={styles.attendanceBadge}>
                        <Text className="text-xs font-semibold text-green-700">
                          ATTENDANCE
                        </Text>
                      </View>
                    )}
                  </HStack>
                </VStack>
              </View>
            );
          })
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowEventModal(true)}
        activeOpacity={0.8}
      >
        <Icon as={Plus} size="xl" className="text-white" />
      </TouchableOpacity>

      {/* Create Event Modal */}
      <Modal
        visible={showEventModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          resetForm();
          setShowEventModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
              keyboardShouldPersistTaps="always"
            >
              <View style={{ gap: 24 }}>
                {/* Header */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 20, fontWeight: "bold", color: "#000000" }}>
                    Create Event
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      resetForm();
                      setShowEventModal(false);
                    }}
                  >
                    <Text style={{ fontSize: 24, color: "#6B7280" }}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Title */}
                <View>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
                    Event Title *
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      borderRadius: 12,
                      padding: 12,
                      fontSize: 16,
                      color: "#000000",
                      backgroundColor: "#F9FAFB",
                      minHeight: 48,
                    }}
                    placeholder="e.g., DBMS Lecture"
                    value={eventTitle}
                    onChangeText={setEventTitle}
                    placeholderTextColor="#9CA3AF"
                    autoFocus={true}
                  />
                </View>

                {/* Event Type */}
                <View>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
                    Event Type *
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {["class", "exam", "assignment", "personal"].map((type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() =>
                          setEventType(
                            type as "class" | "exam" | "assignment" | "personal"
                          )
                        }
                        style={[
                          styles.typeChip,
                          eventType === type && styles.typeChipActive,
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: eventType === type ? "600" : "400",
                            color: eventType === type ? "#FFFFFF" : "#374151",
                          }}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Course (for class/exam/assignment) */}
                {(eventType === "class" || eventType === "exam" || eventType === "assignment") && courseInstances.length > 0 && (
                  <View style={{ gap: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151" }}>
                      Course *
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        {courseInstances.map((instance) => (
                          <TouchableOpacity
                            key={instance.id}
                            onPress={() => setSelectedCourseId(instance.id)}
                            style={[
                              styles.typeChip,
                              selectedCourseId === instance.id && styles.typeChipActive,
                            ]}
                          >
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: selectedCourseId === instance.id ? "600" : "400",
                                color: selectedCourseId === instance.id ? "#FFFFFF" : "#374151",
                              }}
                            >
                              {instance.courseName}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                    {!selectedCourseId && (
                      <Text style={{ fontSize: 12, color: "#EF4444", marginTop: 4 }}>
                        Please select a course
                      </Text>
                    )}
                  </View>
                )}

                {/* Date and Time */}
                <View style={{ gap: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151" }}>
                    Date *
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  <View style={{ flex: 1, gap: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151" }}>
                      Start Time *
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="HH:MM"
                      value={startTime}
                      onChangeText={setStartTime}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={{ flex: 1, gap: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151" }}>
                      End Time *
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="HH:MM"
                      value={endTime}
                      onChangeText={setEndTime}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                {/* Recurring */}
                <TouchableOpacity
                  onPress={() => setIsRecurring(!isRecurring)}
                  style={styles.checkboxRow}
                >
                  <View
                    style={[
                      styles.checkbox,
                      isRecurring && styles.checkboxChecked,
                    ]}
                  >
                    {isRecurring && <View style={styles.checkboxInner} />}
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#000000" }}>
                      Recurring Event
                    </Text>
                    <Text style={{ fontSize: 12, color: "#4B5563" }}>
                      Repeat this event on a schedule
                    </Text>
                  </View>
                </TouchableOpacity>

                {isRecurring && (
                  <>
                    <View style={{ gap: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151" }}>
                        Frequency
                      </Text>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        {["daily", "weekly"].map((freq) => (
                          <TouchableOpacity
                            key={freq}
                            onPress={() =>
                              setRecurringFrequency(freq as "daily" | "weekly")
                            }
                            style={[
                              styles.typeChip,
                              recurringFrequency === freq &&
                                styles.typeChipActive,
                            ]}
                          >
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: recurringFrequency === freq ? "600" : "400",
                                color: recurringFrequency === freq ? "#FFFFFF" : "#374151",
                              }}
                            >
                              {freq.charAt(0).toUpperCase() + freq.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {recurringFrequency === "weekly" && (
                      <View style={{ gap: 8 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151" }}>
                          Repeat on Days
                        </Text>
                        <View style={{ flexDirection: "row", gap: 4, flexWrap: "wrap" }}>
                          {weekDays.map((day) => (
                            <TouchableOpacity
                              key={day}
                              onPress={() => toggleDay(day)}
                              style={[
                                styles.dayChip,
                                selectedDays.includes(day) &&
                                  styles.dayChipActive,
                              ]}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: selectedDays.includes(day) ? "700" : "400",
                                  color: selectedDays.includes(day) ? "#FFFFFF" : "#374151",
                                }}
                              >
                                {day}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    <View style={{ gap: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151" }}>
                        Repeat Until (Optional)
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        value={recurringUntil}
                        onChangeText={setRecurringUntil}
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </>
                )}

                {/* Attendance (for class events) */}
                {eventType === "class" && (
                  <TouchableOpacity
                    onPress={() => setAttendanceEnabled(!attendanceEnabled)}
                    style={styles.checkboxRow}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        attendanceEnabled && styles.checkboxChecked,
                      ]}
                    >
                      {attendanceEnabled && (
                        <View style={styles.checkboxInner} />
                      )}
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#000000" }}>
                      Enable Attendance
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Buttons */}
                <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
                  <TouchableOpacity
                    onPress={() => {
                      resetForm();
                      setShowEventModal(false);
                    }}
                    style={[styles.button, styles.buttonSecondary]}
                    disabled={creating}
                  >
                    <Text style={{ fontWeight: "600" }}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleCreateEvent}
                    style={[styles.button, styles.buttonPrimary]}
                    disabled={creating}
                  >
                    {creating ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Create</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
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
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  attendanceBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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
    shadowRadius: 4,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    zIndex: 1000,
    elevation: 1000,
  },
  modal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalContent: {
    padding: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    minHeight: 48,
    backgroundColor: "#F9FAFB",
    flexDirection: "row",
    alignItems: "center",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#F9FAFB",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    borderColor: "#000000",
    backgroundColor: "#000000",
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  typeChipActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: 48,
    alignItems: "center",
  },
  dayChipActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSecondary: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  buttonPrimary: {
    backgroundColor: "#000000",
  },
});
