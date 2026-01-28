import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Calendar, CheckCircle, XCircle, TrendingUp } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/lib/AuthContext";

export default function AttendanceScreen() {
  const { courseInstanceId } = useLocalSearchParams<{
    courseInstanceId: string;
  }>();
  const { role } = useAuth();

  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Mock data - replace with actual hook
  const attendanceData = {
    totalClasses: 42,
    attendedClasses: 38,
    percentage: 90.48,
    sessions: [
      {
        id: "1",
        date: "2024-01-15",
        status: "present",
        topic: "Introduction to React",
      },
      {
        id: "2",
        date: "2024-01-18",
        status: "present",
        topic: "State Management",
      },
      {
        id: "3",
        date: "2024-01-22",
        status: "absent",
        topic: "Hooks Deep Dive",
      },
      {
        id: "4",
        date: "2024-01-25",
        status: "present",
        topic: "Context API",
      },
    ],
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 75) return "#10B981";
    if (percentage >= 60) return "#F59E0B";
    return "#EF4444";
  };

  const getAttendanceStatus = (percentage: number) => {
    if (percentage >= 75) return "Good Standing";
    if (percentage >= 60) return "Warning";
    return "At Risk";
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(selectedMonth);
    const weeks = [];
    let days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.calendarDay}>
          <View style={styles.dayCell} />
        </View>
      );
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedMonth.getFullYear()}-${String(
        selectedMonth.getMonth() + 1
      ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const session = attendanceData.sessions.find((s) => s.date === dateStr);
      const hasClass = session !== undefined;
      const isPresent = session?.status === "present";

      days.push(
        <View key={day} style={styles.calendarDay}>
          <View
            style={[
              styles.dayCell,
              hasClass && styles.dayCellWithClass,
              hasClass && isPresent && styles.dayCellPresent,
              hasClass && !isPresent && styles.dayCellAbsent,
            ]}
          >
            <Text
              className={`text-sm ${
                hasClass
                  ? "text-white font-bold"
                  : "text-gray-700"
              }`}
            >
              {day}
            </Text>
          </View>
        </View>
      );

      // Start new week
      if ((startingDayOfWeek + day) % 7 === 0) {
        weeks.push(
          <View key={`week-${weeks.length}`} style={styles.calendarWeek}>
            {days}
          </View>
        );
        days = [];
      }
    }

    // Add remaining days
    if (days.length > 0) {
      while (days.length < 7) {
        days.push(
          <View key={`empty-end-${days.length}`} style={styles.calendarDay}>
            <View style={styles.dayCell} />
          </View>
        );
      }
      weeks.push(
        <View key={`week-${weeks.length}`} style={styles.calendarWeek}>
          {days}
        </View>
      );
    }

    return weeks;
  };

  const changeMonth = (direction: number) => {
    setSelectedMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const attendanceColor = getAttendanceColor(attendanceData.percentage);
  const attendanceStatus = getAttendanceStatus(attendanceData.percentage);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text className="text-xl font-bold text-black px-4 py-3">
          Attendance
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => {}} />
        }
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <VStack space="lg">
            {/* Percentage Circle */}
            <View style={styles.percentageContainer}>
              <View
                style={[
                  styles.percentageCircle,
                  { borderColor: attendanceColor },
                ]}
              >
                <Text
                  className="text-5xl font-bold"
                  style={{ color: attendanceColor }}
                >
                  {attendanceData.percentage.toFixed(0)}%
                </Text>
              </View>
            </View>

            {/* Status */}
            <VStack space="xs" className="items-center">
              <HStack space="xs" className="items-center">
                <Icon
                  as={attendanceData.percentage >= 75 ? CheckCircle : XCircle}
                  size="md"
                  style={{ color: attendanceColor }}
                />
                <Text
                  className="text-lg font-semibold"
                  style={{ color: attendanceColor }}
                >
                  {attendanceStatus}
                </Text>
              </HStack>
              <Text className="text-sm text-gray-500">
                {attendanceData.attendedClasses} / {attendanceData.totalClasses}{" "}
                classes attended
              </Text>
            </VStack>

            {/* Stats Row */}
            <HStack className="justify-around">
              <VStack space="xs" className="items-center">
                <Text className="text-2xl font-bold text-green-600">
                  {attendanceData.attendedClasses}
                </Text>
                <Text className="text-xs text-gray-500">Present</Text>
              </VStack>

              <View style={styles.divider} />

              <VStack space="xs" className="items-center">
                <Text className="text-2xl font-bold text-red-600">
                  {attendanceData.totalClasses - attendanceData.attendedClasses}
                </Text>
                <Text className="text-xs text-gray-500">Absent</Text>
              </VStack>

              <View style={styles.divider} />

              <VStack space="xs" className="items-center">
                <Text className="text-2xl font-bold text-gray-700">
                  {attendanceData.totalClasses}
                </Text>
                <Text className="text-xs text-gray-500">Total</Text>
              </VStack>
            </HStack>
          </VStack>
        </View>

        {/* Calendar Card */}
        <View style={styles.card}>
          <VStack space="md">
            {/* Month Navigation */}
            <HStack className="justify-between items-center">
              <TouchableOpacity
                onPress={() => changeMonth(-1)}
                style={styles.monthButton}
              >
                <Text className="text-lg font-bold text-black">←</Text>
              </TouchableOpacity>

              <Text className="text-lg font-bold text-black">
                {selectedMonth.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>

              <TouchableOpacity
                onPress={() => changeMonth(1)}
                style={styles.monthButton}
              >
                <Text className="text-lg font-bold text-black">→</Text>
              </TouchableOpacity>
            </HStack>

            {/* Calendar Header */}
            <View style={styles.calendarHeader}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <View key={day} style={styles.calendarHeaderDay}>
                  <Text className="text-xs font-semibold text-gray-500">
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <VStack space="xs">{renderCalendar()}</VStack>

            {/* Legend */}
            <HStack space="md" className="justify-center mt-2">
              <HStack space="xs" className="items-center">
                <View style={[styles.legendDot, { backgroundColor: "#10B981" }]} />
                <Text className="text-xs text-gray-600">Present</Text>
              </HStack>
              <HStack space="xs" className="items-center">
                <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
                <Text className="text-xs text-gray-600">Absent</Text>
              </HStack>
            </HStack>
          </VStack>
        </View>

        {/* Recent Sessions */}
        <View style={styles.card}>
          <Text className="text-lg font-bold text-black mb-4">
            Recent Sessions
          </Text>

          <VStack space="sm">
            {attendanceData.sessions.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <HStack className="justify-between items-center">
                  <HStack space="md" className="items-center flex-1">
                    <View
                      style={[
                        styles.sessionIcon,
                        {
                          backgroundColor:
                            session.status === "present"
                              ? "#D1FAE5"
                              : "#FEE2E2",
                        },
                      ]}
                    >
                      <Icon
                        as={
                          session.status === "present"
                            ? CheckCircle
                            : XCircle
                        }
                        size="md"
                        style={{
                          color:
                            session.status === "present"
                              ? "#10B981"
                              : "#EF4444",
                        }}
                      />
                    </View>

                    <VStack space="xs" className="flex-1">
                      <Text className="text-sm font-semibold text-black">
                        {session.topic}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {new Date(session.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Text>
                    </VStack>
                  </HStack>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          session.status === "present"
                            ? "#D1FAE5"
                            : "#FEE2E2",
                      },
                    ]}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{
                        color:
                          session.status === "present"
                            ? "#10B981"
                            : "#EF4444",
                      }}
                    >
                      {session.status.toUpperCase()}
                    </Text>
                  </View>
                </HStack>
              </View>
            ))}
          </VStack>
        </View>

        {/* Warning Message */}
        {attendanceData.percentage < 75 && (
          <View style={styles.warningCard}>
            <HStack space="md" className="items-start">
              <Icon as={TrendingUp} size="md" className="text-amber-600" />
              <VStack space="xs" className="flex-1">
                <Text className="text-base font-semibold text-amber-900">
                  Attendance Warning
                </Text>
                <Text className="text-sm text-amber-800">
                  Your attendance is below 75%. You need to attend{" "}
                  {Math.ceil(
                    (0.75 * (attendanceData.totalClasses + 10) -
                      attendanceData.attendedClasses) /
                      0.25
                  )}{" "}
                  more classes to reach the minimum requirement.
                </Text>
              </VStack>
            </HStack>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  percentageContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  percentageCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  monthButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    minWidth: 40,
    alignItems: "center",
  },
  calendarHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  calendarHeaderDay: {
    flex: 1,
    alignItems: "center",
  },
  calendarWeek: {
    flexDirection: "row",
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    padding: 2,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  dayCellWithClass: {
    borderWidth: 2,
  },
  dayCellPresent: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  dayCellAbsent: {
    backgroundColor: "#EF4444",
    borderColor: "#EF4444",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sessionCard: {
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  warningCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
});
