import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { getWeekDays, formatTime, DayInfo } from '@/lib/utils/calendarUtils';
import { ExpandedEvent } from '@/lib/hooks/useCalendarEvents';

interface WeekCalendarProps {
  currentDate: Date;
  events: ExpandedEvent[];
  selectedDate: Date | null;
  onDatePress: (date: Date) => void;
  onEventPress: (event: ExpandedEvent) => void;
}

export function WeekCalendar({
  currentDate,
  events,
  selectedDate,
  onDatePress,
  onEventPress,
}: WeekCalendarProps) {
  const weekDays = getWeekDays(currentDate);

  // Get events for a specific date
  const getEventsForDate = (date: Date): ExpandedEvent[] => {
    return events.filter((event) => {
      const eventDate = event.startTime.toDate();
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    }).sort((a, b) => a.startTime.toMillis() - b.startTime.toMillis());
  };

  const renderDayHeader = (dayInfo: DayInfo) => {
    const isSelected =
      selectedDate &&
      selectedDate.getTime() === dayInfo.date.getTime();

    return (
      <TouchableOpacity
        key={dayInfo.date.getTime()}
        style={styles.dayHeader}
        onPress={() => onDatePress(dayInfo.date)}
      >
        <View
          style={[
            styles.dayHeaderContent,
            isSelected && styles.dayHeaderSelected,
            dayInfo.isToday && styles.dayHeaderToday,
          ]}
        >
          <Text
            style={[
              styles.dayName,
              isSelected && styles.dayNameSelected,
              dayInfo.isToday && styles.dayNameToday,
            ]}
          >
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayInfo.date.getDay()]}
          </Text>
          <Text
            style={[
              styles.dayNumber,
              isSelected && styles.dayNumberSelected,
              dayInfo.isToday && styles.dayNumberToday,
            ]}
          >
            {dayInfo.dayOfMonth}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDayColumn = (dayInfo: DayInfo) => {
    const dayEvents = getEventsForDate(dayInfo.date);

    return (
      <View key={dayInfo.date.getTime()} style={styles.dayColumn}>
        {dayEvents.length === 0 ? (
          <View style={styles.noEventsContainer}>
            <Text style={styles.noEventsText}>—</Text>
          </View>
        ) : (
          dayEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={[
                styles.eventCard,
                event.type === 'class' && styles.eventCardClass,
                event.type === 'exam' && styles.eventCardExam,
                event.type === 'assignment' && styles.eventCardAssignment,
                event.type === 'personal' && styles.eventCardPersonal,
              ]}
              onPress={() => onEventPress(event)}
            >
              <Text style={styles.eventTime}>
                {formatTime(event.startTime.toDate())}
              </Text>
              <Text
                style={styles.eventTitle}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {event.title}
              </Text>
              {event.courseName && (
                <Text style={styles.eventCourse} numberOfLines={1}>
                  {event.courseName}
                </Text>
              )}
              {event.isRecurring && (
                <View style={styles.recurringBadge}>
                  <Text style={styles.recurringText}>↻</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Day headers */}
      <View style={styles.headerRow}>
        {weekDays.map((day) => renderDayHeader(day))}
      </View>

      {/* Event columns */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.columnsContainer}>
          {weekDays.map((day) => renderDayColumn(day))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderContent: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 48,
  },
  dayHeaderToday: {
    backgroundColor: '#F3F4F6',
  },
  dayHeaderSelected: {
    backgroundColor: '#000000',
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dayNameToday: {
    color: '#000000',
  },
  dayNameSelected: {
    color: '#FFFFFF',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  dayNumberToday: {
    color: '#000000',
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  columnsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 16,
    minWidth: '100%',
  },
  dayColumn: {
    flex: 1,
    minWidth: 100,
    paddingHorizontal: 4,
  },
  noEventsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noEventsText: {
    fontSize: 20,
    color: '#D1D5DB',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  eventCardClass: {
    borderLeftColor: '#000000',
    backgroundColor: '#FAFAFA',
  },
  eventCardExam: {
    borderLeftColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  eventCardAssignment: {
    borderLeftColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  eventCardPersonal: {
    borderLeftColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  eventTime: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  eventCourse: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  recurringBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurringText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },
});
