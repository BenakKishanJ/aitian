import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type EventType = 'class' | 'exam' | 'assignment' | 'personal';

export interface RecurrenceRule {
  frequency: 'weekly' | 'daily';
  days?: string[]; // ['MON', 'WED', 'FRI']
  until?: Timestamp;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  courseInstanceId?: string | null;
  courseName?: string;
  createdBy: string;
  startTime: Timestamp;
  endTime: Timestamp;
  recurrenceRule?: RecurrenceRule;
  isAttendanceEnabled?: boolean;
  createdAt: Timestamp;
}

export interface ExpandedEvent extends CalendarEvent {
  isRecurring: boolean;
  occurrenceDate?: Date;
  originalEventId?: string;
}

interface UseCalendarEventsProps {
  startDate: Date;
  endDate: Date;
  userId?: string;
  courseInstanceIds?: string[];
  eventTypes?: EventType[];
}

export function useCalendarEvents({
  startDate,
  endDate,
  userId,
  courseInstanceIds,
  eventTypes,
}: UseCalendarEventsProps) {
  const [events, setEvents] = useState<ExpandedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expand recurring events into individual occurrences
  const expandRecurringEvents = useCallback(
    (baseEvents: CalendarEvent[]): ExpandedEvent[] => {
      const expanded: ExpandedEvent[] = [];
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      baseEvents.forEach((event) => {
        if (!event.recurrenceRule) {
          // Non-recurring event
          const eventDate = event.startTime.toDate();
          if (eventDate >= start && eventDate <= end) {
            expanded.push({
              ...event,
              isRecurring: false,
            });
          }
        } else {
          // Recurring event
          const rule = event.recurrenceRule;
          const eventStart = event.startTime.toDate();
          const eventEnd = event.endTime.toDate();
          const duration = eventEnd.getTime() - eventStart.getTime();

          const recurrenceEnd = rule.until
            ? rule.until.toDate()
            : new Date(end.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year default

          const currentDate = new Date(
            Math.max(eventStart.getTime(), start.getTime())
          );

          while (currentDate <= end && currentDate <= recurrenceEnd) {
            if (rule.frequency === 'weekly' && rule.days) {
              const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
              const dayName = dayNames[currentDate.getDay()];

              if (rule.days.includes(dayName)) {
                const occurrenceStart = new Date(currentDate);
                occurrenceStart.setHours(
                  eventStart.getHours(),
                  eventStart.getMinutes(),
                  eventStart.getSeconds()
                );

                const occurrenceEnd = new Date(
                  occurrenceStart.getTime() + duration
                );

                if (occurrenceStart >= start && occurrenceStart <= end) {
                  expanded.push({
                    ...event,
                    id: `${event.id}_${occurrenceStart.getTime()}`,
                    startTime: Timestamp.fromDate(occurrenceStart),
                    endTime: Timestamp.fromDate(occurrenceEnd),
                    isRecurring: true,
                    occurrenceDate: occurrenceStart,
                    originalEventId: event.id,
                  });
                }
              }
            } else if (rule.frequency === 'daily') {
              const occurrenceStart = new Date(currentDate);
              occurrenceStart.setHours(
                eventStart.getHours(),
                eventStart.getMinutes(),
                eventStart.getSeconds()
              );

              const occurrenceEnd = new Date(occurrenceStart.getTime() + duration);

              if (occurrenceStart >= start && occurrenceStart <= end) {
                expanded.push({
                  ...event,
                  id: `${event.id}_${occurrenceStart.getTime()}`,
                  startTime: Timestamp.fromDate(occurrenceStart),
                  endTime: Timestamp.fromDate(occurrenceEnd),
                  isRecurring: true,
                  occurrenceDate: occurrenceStart,
                  originalEventId: event.id,
                });
              }
            }

            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      });

      return expanded.sort(
        (a, b) => a.startTime.toMillis() - b.startTime.toMillis()
      );
    },
    [startDate, endDate]
  );

  useEffect(() => {
    setLoading(true);
    setError(null);

    const eventsRef = collection(db, 'calendarEvents');
    const constraints: QueryConstraint[] = [];

    // Query events that could potentially appear in the date range
    // We need to get recurring events that started before our range
    const queryStart = new Date(startDate);
    queryStart.setDate(queryStart.getDate() - 90); // Get events from 90 days before

    // Add type filter if specified
    if (eventTypes && eventTypes.length > 0) {
      constraints.push(where('type', 'in', eventTypes));
    }

    // Add user filter if specified (for personal events)
    if (userId) {
      // This will need to be combined with OR logic in the component
      // For now, we fetch all and filter in memory
    }

    // Add course instance filter if specified
    if (courseInstanceIds && courseInstanceIds.length > 0) {
      // Firestore 'in' operator supports up to 10 values
      if (courseInstanceIds.length <= 10) {
        constraints.push(where('courseInstanceId', 'in', courseInstanceIds));
      }
    }

    constraints.push(orderBy('startTime', 'asc'));

    const q = query(eventsRef, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedEvents: CalendarEvent[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          fetchedEvents.push({
            id: doc.id,
            title: data.title,
            type: data.type,
            courseInstanceId: data.courseInstanceId,
            courseName: data.courseName,
            createdBy: data.createdBy,
            startTime: data.startTime,
            endTime: data.endTime,
            recurrenceRule: data.recurrenceRule,
            isAttendanceEnabled: data.isAttendanceEnabled,
            createdAt: data.createdAt,
          });
        });

        // Filter by userId if needed (personal events or created by user)
        let filteredEvents = fetchedEvents;
        if (userId) {
          filteredEvents = fetchedEvents.filter(
            (event) =>
              event.createdBy === userId ||
              event.type !== 'personal' ||
              !event.courseInstanceId
          );
        }

        // Expand recurring events
        const expandedEvents = expandRecurringEvents(filteredEvents);

        setEvents(expandedEvents);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching calendar events:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [startDate, endDate, userId, courseInstanceIds, eventTypes, expandRecurringEvents]);

  return { events, loading, error };
}
