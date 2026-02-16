import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Icon } from '@/components/ui/icon';
import {
  Clock,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import type { ExpandedEvent } from '@/types/calendar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Time slots from 6 AM to 10 PM (30 min intervals)
const START_HOUR = 6;
const END_HOUR = 22;
const TIME_SLOTS = Array.from(
  { length: (END_HOUR - START_HOUR) * 2 + 1 },
  (_, i) => {
    const hour = Math.floor(i / 2) + START_HOUR;
    const minute = (i % 2) * 30;
    return { hour, minute, label: formatTimeSlot(hour, minute) };
  }
);

function formatTimeSlot(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const displayMinute = minute === 0 ? '00' : '30';
  return `${displayHour}:${displayMinute} ${period}`;
}

// Event colors by type - vibrant solid colors
const eventColors: Record<string, { bg: string; text: string; border: string; iconBg: string; accent: string }> = {
  class: {
    bg: '#BCF3FF',
    text: '#232323',
    border: '#7DD3E8',
    iconBg: '#232323',
    accent: '#E5FBFF',
  },
  exam: {
    bg: '#F96857',
    text: '#FFFFFF',
    border: '#E54D3C',
    iconBg: '#FFFFFF',
    accent: '#FDE1DD',
  },
  assignment: {
    bg: '#F9CD61',
    text: '#232323',
    border: '#E5B84D',
    iconBg: '#232323',
    accent: '#FDF3D1',
  },
  personal: {
    bg: '#7477FF',
    text: '#FFFFFF',
    border: '#5A5DE8',
    iconBg: '#FFFFFF',
    accent: '#E1E3FF',
  },
};

interface DayTimelineProps {
  date: Date;
  events: ExpandedEvent[];
  onEventPress: (event: ExpandedEvent) => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
}

export function DayTimeline({
  date,
  events,
  onEventPress,
  onPreviousDay,
  onNextDay,
}: DayTimelineProps) {
  // Sort events by start time
  const sortedEvents = React.useMemo(() => {
    return [...events].sort((a, b) => {
      const aTime = a.startTime.toDate().getTime();
      const bTime = b.startTime.toDate().getTime();
      return aTime - bTime;
    });
  }, [events]);

  // Get events for a specific time slot
  const getEventsForSlot = (hour: number, minute: number) => {
    const slotStart = new Date(date);
    slotStart.setHours(hour, minute, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(minute + 30);

    return sortedEvents.filter((event) => {
      const eventStart = event.startTime.toDate();
      const eventEnd = event.endTime.toDate();
      return eventStart < slotEnd && eventEnd > slotStart;
    });
  };

  const formatEventTime = (event: ExpandedEvent) => {
    const start = event.startTime.toDate();
    const end = event.endTime.toDate();
    return `${formatTimeSlot(start.getHours(), start.getMinutes())} - ${formatTimeSlot(end.getHours(), end.getMinutes())}`;
  };

  const isCurrentSlot = (hour: number, minute: number) => {
    const now = new Date();
    const slotTime = new Date(date);
    slotTime.setHours(hour, minute, 0, 0);
    const nextSlot = new Date(slotTime);
    nextSlot.setMinutes(minute + 30);
    return now >= slotTime && now < nextSlot && isToday(date);
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <View style={styles.container}>
      {/* Day Header - Colorful */}
      <View style={styles.dayHeader}>
        <TouchableOpacity onPress={onPreviousDay} style={styles.navButton}>
          <View style={styles.navButtonInner}>
            <Icon as={ChevronLeft} size="md" className="text-[#232323]" />
          </View>
        </TouchableOpacity>

        <View style={styles.dayInfo}>
          <Text style={styles.dayName}>{dayNames[date.getDay()]}</Text>
          <Text style={styles.dayDate}>
            {monthNames[date.getMonth()]} {date.getDate()}, {date.getFullYear()}
          </Text>
        </View>

        <TouchableOpacity onPress={onNextDay} style={styles.navButton}>
          <View style={styles.navButtonInner}>
            <Icon as={ChevronRight} size="md" className="text-[#232323]" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Events Count - Colorful badge */}
      <View style={styles.eventsCountContainer}>
        <View style={styles.eventsCountBadge}>
          <Text style={styles.eventsCountText}>
            {events.length} {events.length === 1 ? 'Event' : 'Events'}
          </Text>
        </View>
      </View>

      {/* Timeline */}
      <ScrollView
        style={styles.timeline}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.timelineContent}
      >
        {TIME_SLOTS.map(({ hour, minute, label }, index) => {
          const slotEvents = getEventsForSlot(hour, minute);
          const current = isCurrentSlot(hour, minute);
          const isEven = index % 2 === 0;

          return (
            <View key={`${hour}-${minute}`} style={styles.timeSlot}>
              {/* Time Label */}
              <View style={[
                styles.timeLabel,
                isEven ? styles.timeLabelEven : styles.timeLabelOdd,
                current && styles.currentTimeLabel
              ]}>
                <Text style={[styles.timeText, current && styles.currentTimeText]}>
                  {label}
                </Text>
              </View>

              {/* Slot Content */}
              <View style={[
                styles.slotContent,
                isEven ? styles.slotContentEven : styles.slotContentOdd,
                current && styles.currentSlot
              ]}>
                {/* Hour Line */}
                <View style={styles.hourLine} />

                {/* Events in this slot */}
                {slotEvents.map((event, eventIndex) => {
                  const colors = eventColors[event.type] || eventColors.personal;
                  const isFirstSlot = event.startTime.toDate().getHours() === hour &&
                    Math.floor(event.startTime.toDate().getMinutes() / 30) === (minute === 0 ? 0 : 1);

                  if (!isFirstSlot) return null;

                  // Calculate event duration in 30-min slots
                  const durationMs = event.endTime.toDate().getTime() - event.startTime.toDate().getTime();
                  const durationSlots = Math.max(1, Math.ceil(durationMs / (30 * 60 * 1000)));

                  return (
                    <TouchableOpacity
                      key={event.id}
                      onPress={() => {
                        console.log('Event pressed:', event.id, event.title);
                        onEventPress(event);
                      }}
                      activeOpacity={0.7}
                      style={[
                        styles.eventCard,
                        {
                          backgroundColor: colors.bg,
                          minHeight: Math.max(70, durationSlots * 32 - 8),
                        },
                      ]}
                    >
                      {/* Left accent border */}
                      <View style={[styles.eventAccentBorder, { backgroundColor: colors.border }]} />
                      
                      <VStack space="xs" style={styles.eventContent}>
                        <HStack className="items-center" space="sm">
                          <View
                            style={[
                              styles.eventIcon,
                              { backgroundColor: colors.iconBg },
                            ]}
                          >
                            <Text style={[styles.eventIconText, { color: colors.bg }]}>
                              {event.type.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <Text
                            style={[styles.eventTitle, { color: colors.text }]}
                            numberOfLines={1}
                          >
                            {event.title}
                          </Text>
                        </HStack>

                        <HStack space="sm" className="items-center">
                          <Icon as={Clock} size="2xs" style={{ color: colors.text }} />
                          <Text style={[styles.eventTime, { color: colors.text }]}>
                            {formatEventTime(event)}
                          </Text>
                        </HStack>

                        {event.location && (
                          <HStack space="sm" className="items-center">
                            <Icon as={MapPin} size="2xs" style={{ color: colors.text }} />
                            <Text style={[styles.eventLocation, { color: colors.text }]}>
                              {event.location}
                            </Text>
                          </HStack>
                        )}

                        {event.courseName && (
                          <HStack space="sm" className="items-center">
                            <Icon as={Calendar} size="2xs" style={{ color: colors.text }} />
                            <Text style={[styles.eventCourse, { color: colors.text }]}>
                              {event.courseName}
                            </Text>
                          </HStack>
                        )}
                      </VStack>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#BCF3FF',
  },
  navButton: {
    padding: 4,
  },
  navButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#232323',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInfo: {
    alignItems: 'center',
  },
  dayName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#232323',
  },
  dayDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#232323',
    marginTop: 2,
    opacity: 0.8,
  },
  eventsCountContainer: {
    backgroundColor: '#232323',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3C443F',
  },
  eventsCountBadge: {
    backgroundColor: '#2A2A2D',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BCF3FF',
  },
  eventsCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#BCF3FF',
  },
  timeline: {
    flex: 1,
  },
  timelineContent: {
    paddingBottom: 20,
  },
  timeSlot: {
    flexDirection: 'row',
    minHeight: 60,
  },
  timeLabel: {
    width: 70,
    paddingTop: 8,
    paddingLeft: 12,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    borderRightWidth: 2,
  },
  timeLabelEven: {
    backgroundColor: '#2A2A2D',
    borderRightColor: '#3C443F',
  },
  timeLabelOdd: {
    backgroundColor: '#323238',
    borderRightColor: '#4C4C52',
  },
  currentTimeLabel: {
    backgroundColor: '#BCF3FF30',
    borderRightColor: '#BCF3FF',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  currentTimeText: {
    color: '#BCF3FF',
    fontWeight: '700',
  },
  slotContent: {
    flex: 1,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 4,
    position: 'relative',
  },
  slotContentEven: {
    backgroundColor: '#1C1C1E',
  },
  slotContentOdd: {
    backgroundColor: '#232323',
  },
  currentSlot: {
    backgroundColor: 'rgba(188, 243, 255, 0.08)',
  },
  hourLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#3C443F',
  },
  eventCard: {
    borderRadius: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  eventAccentBorder: {
    width: 5,
    height: '100%',
  },
  eventContent: {
    flex: 1,
    padding: 12,
    paddingLeft: 10,
  },
  eventIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventIconText: {
    fontSize: 13,
    fontWeight: '800',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  eventTime: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  eventLocation: {
    fontSize: 12,
    opacity: 0.85,
  },
  eventCourse: {
    fontSize: 11,
    opacity: 0.75,
    fontWeight: '500',
  },
});
