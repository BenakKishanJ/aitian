import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import {
  Clock,
  BookOpen,
  FileText,
  Calendar,
  User,
  Repeat,
} from 'lucide-react-native';
import { ExpandedEvent } from '@/lib/hooks/useCalendarEvents';
import { formatTime, formatDate } from '@/lib/utils/calendarUtils';

interface EventListProps {
  date: Date;
  events: ExpandedEvent[];
  onEventPress: (event: ExpandedEvent) => void;
  onClose?: () => void;
}

export function EventList({
  date,
  events,
  onEventPress,
  onClose,
}: EventListProps) {
  // Sort events by time
  const sortedEvents = [...events].sort(
    (a, b) => a.startTime.toMillis() - b.startTime.toMillis()
  );

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'class':
        return BookOpen;
      case 'exam':
        return FileText;
      case 'assignment':
        return FileText;
      case 'personal':
        return User;
      default:
        return Calendar;
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'class':
        return 'Class';
      case 'exam':
        return 'Exam';
      case 'assignment':
        return 'Assignment';
      case 'personal':
        return 'Personal';
      default:
        return 'Event';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <VStack space="xs">
          <Text style={styles.headerTitle}>
            {formatDate(date, 'full')}
          </Text>
          <Text style={styles.headerSubtitle}>
            {sortedEvents.length} {sortedEvents.length === 1 ? 'event' : 'events'}
          </Text>
        </VStack>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Events List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {sortedEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar size={48} color="#D1D5DB" strokeWidth={1.5} />
            <Text style={styles.emptyText}>No events scheduled</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to add an event
            </Text>
          </View>
        ) : (
          <VStack space="sm" style={styles.eventsList}>
            {sortedEvents.map((event) => {
              const EventIcon = getEventIcon(event.type);
              const startTime = event.startTime.toDate();
              const endTime = event.endTime.toDate();

              return (
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
                  activeOpacity={0.7}
                >
                  {/* Time Column */}
                  <View style={styles.timeColumn}>
                    <HStack space="xs" className="items-center">
                      <Clock size={14} color="#6B7280" strokeWidth={2} />
                      <Text style={styles.timeText}>
                        {formatTime(startTime)}
                      </Text>
                    </HStack>
                    <Text style={styles.timeEndText}>
                      {formatTime(endTime)}
                    </Text>
                  </View>

                  {/* Event Details Column */}
                  <View style={styles.detailsColumn}>
                    <VStack space="xs">
                      {/* Title and Type */}
                      <HStack space="sm" className="items-start">
                        <View
                          style={[
                            styles.iconContainer,
                            event.type === 'class' && styles.iconContainerClass,
                            event.type === 'exam' && styles.iconContainerExam,
                            event.type === 'assignment' &&
                              styles.iconContainerAssignment,
                            event.type === 'personal' &&
                              styles.iconContainerPersonal,
                          ]}
                        >
                          <EventIcon size={16} color="#000000" strokeWidth={2} />
                        </View>
                        <VStack space="xs" style={{ flex: 1 }}>
                          <Text style={styles.eventTitle} numberOfLines={2}>
                            {event.title}
                          </Text>
                          <HStack space="xs" className="items-center">
                            <Text style={styles.eventType}>
                              {getEventTypeLabel(event.type)}
                            </Text>
                            {event.isRecurring && (
                              <>
                                <Text style={styles.dotSeparator}>•</Text>
                                <HStack space="xs" className="items-center">
                                  <Repeat size={10} color="#6B7280" />
                                  <Text style={styles.recurringLabel}>
                                    Recurring
                                  </Text>
                                </HStack>
                              </>
                            )}
                          </HStack>
                        </VStack>
                      </HStack>

                      {/* Course Name */}
                      {event.courseName && (
                        <HStack space="xs" className="items-center ml-9">
                          <BookOpen size={12} color="#6B7280" strokeWidth={2} />
                          <Text style={styles.courseName} numberOfLines={1}>
                            {event.courseName}
                          </Text>
                        </HStack>
                      )}

                      {/* Attendance Badge */}
                      {event.isAttendanceEnabled && (
                        <View style={styles.attendanceBadge}>
                          <Text style={styles.attendanceBadgeText}>
                            Attendance Enabled
                          </Text>
                        </View>
                      )}
                    </VStack>
                  </View>

                  {/* Arrow Indicator */}
                  <View style={styles.arrowContainer}>
                    <Text style={styles.arrow}>›</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </VStack>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 24,
    color: '#6B7280',
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  eventsList: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  eventCardClass: {
    borderLeftWidth: 4,
    borderLeftColor: '#000000',
    backgroundColor: '#FAFAFA',
  },
  eventCardExam: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  eventCardAssignment: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  eventCardPersonal: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  timeColumn: {
    width: 70,
    paddingRight: 12,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  timeEndText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    marginLeft: 18,
  },
  detailsColumn: {
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  iconContainerClass: {
    backgroundColor: '#F3F4F6',
  },
  iconContainerExam: {
    backgroundColor: '#FEE2E2',
  },
  iconContainerAssignment: {
    backgroundColor: '#DBEAFE',
  },
  iconContainerPersonal: {
    backgroundColor: '#D1FAE5',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  eventType: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dotSeparator: {
    fontSize: 11,
    color: '#D1D5DB',
  },
  recurringLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  courseName: {
    fontSize: 12,
    color: '#6B7280',
  },
  attendanceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 36,
    marginTop: 4,
  },
  attendanceBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  arrowContainer: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
  arrow: {
    fontSize: 24,
    color: '#D1D5DB',
  },
});
