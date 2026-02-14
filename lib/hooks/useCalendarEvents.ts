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
  description?: string;
  courseInstanceId?: string | null;
  courseName?: string;
  createdBy: string;
  startTime: Timestamp;
  endTime: Timestamp;
  location?: string;
  recurrenceRule?: RecurrenceRule;
  isAttendanceEnabled?: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface ExpandedEvent extends CalendarEvent {
  isRecurring: boolean;
  occurrenceDate?: Date;
  originalEventId?: string;
  occurrenceId?: string;
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
    
    // Add date range filter - only fetch events that start within our query window
    // Note: Using only >= filter to avoid composite index requirements
    constraints.push(where('startTime', '>=', Timestamp.fromDate(queryStart)));
    constraints.push(orderBy('startTime', 'asc'));

    const q = query(eventsRef, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedEvents: CalendarEvent[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          
          // Skip soft-deleted events
          if (data.isDeleted === true) {
            return;
          }
          
          fetchedEvents.push({
            id: doc.id,
            title: data.title,
            type: data.type,
            description: data.description,
            courseInstanceId: data.courseInstanceId,
            courseName: data.courseName,
            createdBy: data.createdBy,
            startTime: data.startTime,
            endTime: data.endTime,
            location: data.location,
            recurrenceRule: data.recurrenceRule,
            isAttendanceEnabled: data.isAttendanceEnabled,
            createdAt: data.createdAt,
          });
        });

        // Apply all filters in memory to avoid Firestore composite index requirements
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        let filteredEvents = fetchedEvents.filter((event) => {
          const eventStart = event.startTime.toDate();
          
          // Filter by end date
          if (eventStart > end) {
            return false;
          }
          
          // Filter by event type
          if (eventTypes && eventTypes.length > 0) {
            if (!eventTypes.includes(event.type)) {
              return false;
            }
          }
          
          // Filter by course instance (but allow events without courseInstanceId - like personal events)
          if (courseInstanceIds && courseInstanceIds.length > 0) {
            // If event has a courseInstanceId, it must be in the allowed list
            // If event has no courseInstanceId (personal events), allow it through
            if (event.courseInstanceId && !courseInstanceIds.includes(event.courseInstanceId)) {
              return false;
            }
          }
          
          // Filter by user (personal events only visible to creator)
          if (userId && event.type === 'personal' && event.createdBy !== userId) {
            return false;
          }
          
          return true;
        });

        // Expand recurring events
        const expandedEvents = expandRecurringEvents(filteredEvents);

        console.log(`[useCalendarEvents] Fetched ${fetchedEvents.length} base events, expanded to ${expandedEvents.length} events`);
        console.log('[useCalendarEvents] Date range:', startDate.toISOString(), 'to', endDate.toISOString());

        setEvents(expandedEvents);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching calendar events:', err);
        console.error('Query constraints:', constraints.map(c => c.toString()));
        console.error('Start date:', startDate, 'End date:', endDate);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [startDate, endDate, userId, courseInstanceIds, eventTypes, expandRecurringEvents, refreshTrigger]);

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return { events, loading, error, refresh };
}
