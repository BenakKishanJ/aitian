import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { getMonthCalendarGrid, DayInfo } from '@/lib/utils/calendarUtils';
import { ExpandedEvent } from '@/lib/hooks/useCalendarEvents';

interface MonthCalendarProps {
  currentDate: Date;
  events: ExpandedEvent[];
  selectedDate: Date | null;
  onDatePress: (date: Date) => void;
}

export function MonthCalendar({
  currentDate,
  events,
  selectedDate,
  onDatePress,
}: MonthCalendarProps) {
  const weeks = getMonthCalendarGrid(currentDate);

  // Get events for a specific date
  const getEventsForDate = (date: Date): ExpandedEvent[] => {
    return events.filter((event) => {
      const eventDate = event.startTime.toDate();
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  // Get event type indicators for a date
  const getEventIndicators = (date: Date) => {
    const dayEvents = getEventsForDate(date);
    const types = new Set(dayEvents.map((e) => e.type));
    return Array.from(types).slice(0, 3); // Show max 3 indicators
  };

  const renderDay = (dayInfo: DayInfo) => {
    const isSelected =
      selectedDate &&
      selectedDate.getTime() === dayInfo.date.getTime();
    const dayEvents = getEventsForDate(dayInfo.date);
    const hasEvents = dayEvents.length > 0;
    const indicators = getEventIndicators(dayInfo.date);

    return (
      <TouchableOpacity
        key={dayInfo.date.getTime()}
        style={styles.dayCell}
        onPress={() => onDatePress(dayInfo.date)}
        disabled={!dayInfo.isCurrentMonth}
      >
        <View
          style={[
            styles.dayContent,
            dayInfo.isToday && styles.todayContent,
            isSelected && styles.selectedContent,
          ]}
        >
          <Text
            style={[
              styles.dayText,
              !dayInfo.isCurrentMonth && styles.otherMonthText,
              dayInfo.isToday && styles.todayText,
              isSelected && styles.selectedText,
              dayInfo.isWeekend && dayInfo.isCurrentMonth && styles.weekendText,
            ]}
          >
            {dayInfo.dayOfMonth}
          </Text>

          {/* Event indicators */}
          {hasEvents && dayInfo.isCurrentMonth && (
            <View style={styles.indicatorContainer}>
              {indicators.map((type, index) => (
                <View
                  key={`${type}-${index}`}
                  style={[
                    styles.indicator,
                    type === 'class' && styles.indicatorClass,
                    type === 'exam' && styles.indicatorExam,
                    type === 'assignment' && styles.indicatorAssignment,
                    type === 'personal' && styles.indicatorPersonal,
                  ]}
                />
              ))}
              {dayEvents.length > 3 && (
                <Text style={styles.moreIndicator}>+</Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Day headers */}
      <View style={styles.headerRow}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <View key={day} style={styles.headerCell}>
            <Text style={styles.headerText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      {weeks.map((week) => (
        <View key={week.weekNumber} style={styles.weekRow}>
          {week.days.map((day) => renderDay(day))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerCell: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    padding: 2,
  },
  dayContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  todayContent: {
    backgroundColor: '#F3F4F6',
  },
  selectedContent: {
    backgroundColor: '#000000',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  otherMonthText: {
    color: '#D1D5DB',
  },
  todayText: {
    fontWeight: '700',
    color: '#000000',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  weekendText: {
    color: '#6B7280',
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  indicatorClass: {
    backgroundColor: '#000000',
  },
  indicatorExam: {
    backgroundColor: '#EF4444',
  },
  indicatorAssignment: {
    backgroundColor: '#3B82F6',
  },
  indicatorPersonal: {
    backgroundColor: '#10B981',
  },
  moreIndicator: {
    fontSize: 8,
    fontWeight: '700',
    color: '#6B7280',
    marginLeft: 2,
  },
});
