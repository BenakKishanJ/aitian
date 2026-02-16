import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { getMonthCalendarGrid, DayInfo } from '@/lib/utils/calendarUtils';
import { ExpandedEvent } from '@/lib/hooks/useCalendarEvents';
import { HStack } from '@/components/ui/hstack';

interface MonthCalendarProps {
  currentDate: Date;
  events: ExpandedEvent[];
  selectedDate: Date | null;
  onDatePress: (date: Date) => void;
}

// Event type colors for dark theme - more vibrant
const eventColors: Record<string, string> = {
  class: '#BCF3FF',
  exam: '#F96857',
  assignment: '#F9CD61',
  personal: '#7477FF',
};

// Day cell colors - alternating pattern for visual interest
const dayCellColors = [
  '#2A2A2D', // Default dark
  '#323238', // Slightly lighter
  '#2A2A2D',
  '#323238',
];

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
    return Array.from(types).slice(0, 4);
  };

  const renderDay = (dayInfo: DayInfo, weekIndex: number, dayIndex: number) => {
    const isSelected =
      selectedDate &&
      selectedDate.getTime() === dayInfo.date.getTime();
    const dayEvents = getEventsForDate(dayInfo.date);
    const hasEvents = dayEvents.length > 0;
    const indicators = getEventIndicators(dayInfo.date);
    const isToday = dayInfo.isToday;
    const isWeekend = dayInfo.isWeekend && dayInfo.isCurrentMonth;
    
    // Get alternating background color
    const baseColorIndex = (weekIndex * 7 + dayIndex) % dayCellColors.length;
    const baseColor = dayCellColors[baseColorIndex];

    return (
      <TouchableOpacity
        key={dayInfo.date.getTime()}
        style={styles.dayCell}
        onPress={() => onDatePress(dayInfo.date)}
        disabled={!dayInfo.isCurrentMonth}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.dayContent,
            { backgroundColor: baseColor },
            !dayInfo.isCurrentMonth && styles.otherMonthContent,
            isWeekend && styles.weekendContent,
            isToday && styles.todayContent,
            isSelected && styles.selectedContent,
            hasEvents && styles.hasEventsContent,
          ]}
        >
          {/* Day Number */}
          <View style={styles.dayNumberContainer}>
            <Text
              style={[
                styles.dayText,
                !dayInfo.isCurrentMonth && styles.otherMonthText,
                isWeekend && styles.weekendText,
                isToday && styles.todayText,
                isSelected && styles.selectedText,
                hasEvents && !isSelected && styles.hasEventsText,
              ]}
            >
              {dayInfo.dayOfMonth}
            </Text>
            {isToday && <View style={styles.todayDot} />}
            {hasEvents && !isToday && <View style={styles.eventDot} />}
          </View>

          {/* Event indicators */}
          {hasEvents && dayInfo.isCurrentMonth && (
            <View style={styles.indicatorContainer}>
              {indicators.map((type, index) => (
                <View
                  key={`${type}-${index}`}
                  style={[
                    styles.indicator,
                    { backgroundColor: eventColors[type] || '#C5D4CA' },
                  ]}
                />
              ))}
              {dayEvents.length > 4 && (
                <Text style={styles.moreText}>+{dayEvents.length - 4}</Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Day headers with color */}
      <View style={styles.headerRow}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <View key={day} style={styles.headerCell}>
            <View style={[
              styles.dayHeaderBadge,
              index === 0 || index === 6 ? styles.weekendHeaderBadge : null
            ]}>
              <Text style={[
                styles.headerText,
                index === 0 || index === 6 ? styles.weekendHeaderText : null
              ]}>
                {day}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      {weeks.map((week, weekIndex) => (
        <View key={week.weekNumber} style={styles.weekRow}>
          {week.days.map((day, dayIndex) => renderDay(day, weekIndex, dayIndex))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#1C1C1E',
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    marginBottom: 4,
  },
  headerCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderBadge: {
    backgroundColor: '#2A2A2D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 36,
    alignItems: 'center',
  },
  weekendHeaderBadge: {
    backgroundColor: '#F9685720',
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C5D4CA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weekendHeaderText: {
    color: '#F96857',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 0.9,
    padding: 2,
  },
  dayContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  otherMonthContent: {
    opacity: 0.3,
  },
  weekendContent: {
    borderColor: '#F9685720',
  },
  todayContent: {
    borderWidth: 2,
    borderColor: '#BCF3FF',
    backgroundColor: '#BCF3FF15',
  },
  selectedContent: {
    backgroundColor: '#BCF3FF',
    borderColor: '#BCF3FF',
  },
  hasEventsContent: {
    borderColor: '#3C443F',
  },
  dayNumberContainer: {
    alignItems: 'center',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  otherMonthText: {
    color: '#6B7280',
  },
  weekendText: {
    color: '#F96857',
  },
  todayText: {
    fontWeight: '700',
    color: '#BCF3FF',
  },
  selectedText: {
    color: '#232323',
    fontWeight: '700',
  },
  hasEventsText: {
    color: '#FFFFFF',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#BCF3FF',
    marginTop: 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#7477FF',
    marginTop: 2,
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    flexWrap: 'wrap',
    paddingHorizontal: 4,
    maxWidth: '100%',
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#C5D4CA',
  },
});
