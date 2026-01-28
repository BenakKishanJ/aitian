# Calendar Feature Documentation

## Overview

The Calendar feature provides a comprehensive event management system for the AITIAN app, supporting different views, event types, and role-based permissions. It integrates seamlessly with the academic system, automatically creating events for assignments and allowing teachers and admins to manage class schedules.

## Features

### 1. **Multiple View Modes**
- **Month View**: Traditional calendar grid showing events as indicators
- **Week View**: Column-based view showing detailed events for each day of the week
- Toggle between views with a single tap

### 2. **Event Types**
- **Class**: Regular class sessions (can be recurring)
- **Exam**: Important exams (admin only)
- **Assignment**: Assignment deadlines (auto-created)
- **Personal**: Personal events for individual users

### 3. **Role-Based Permissions**

| Role    | Can Create                                  | Can Edit/Delete                          |
|---------|---------------------------------------------|------------------------------------------|
| Student | Personal events only                        | Own personal events only                 |
| Teacher | Class events (for their courses), Personal  | Own events and their class events        |
| Admin   | All event types (exam, class, personal)     | All events                               |
| Parent  | Read-only access                            | None                                     |

### 4. **Smart Features**
- **Filters**: Filter events by type (class, exam, assignment, personal)
- **Event Indicators**: Visual dots on calendar showing event types
- **Date Selection**: Tap any date to see all events for that day
- **Today Navigation**: Quick jump to current date
- **Real-time Updates**: Automatic sync with Firestore

### 5. **Recurring Events**
- Support for daily and weekly recurrence
- Select specific days for weekly events (Mon, Wed, Fri, etc.)
- Set optional end dates for recurring events
- Each occurrence is individually displayed on the calendar

### 6. **Automatic Assignment Events**
- When a teacher/admin creates an assignment, a calendar event is automatically created
- Event appears at the assignment due date/time
- Linked to the course instance
- Deleted automatically when assignment is deleted

## File Structure

```
aitian/
├── app/(tabs)/
│   └── calendar.tsx                    # Main calendar screen
├── components/calendar/
│   ├── MonthCalendar.tsx              # Month view component
│   ├── WeekCalendar.tsx               # Week view component
│   ├── EventList.tsx                  # Event list modal
│   └── CreateEventModal.tsx           # Create/edit event modal
├── lib/
│   ├── hooks/
│   │   ├── useCalendarEvents.ts       # Calendar events hook
│   │   └── useAssignments.ts          # Updated with calendar integration
│   └── utils/
│       └── calendarUtils.ts           # Date/calendar utilities
└── docs/
    └── CALENDAR_FEATURE.md            # This file
```

## Usage

### For Students

1. **View Events**:
   - Open the Calendar tab
   - Switch between Month/Week view
   - Tap any date to see detailed events

2. **Add Personal Events**:
   - Tap the + FAB button
   - Enter event details
   - Select date and time
   - Save

3. **Filter Events**:
   - Tap the filter icon
   - Select/deselect event types
   - Apply filters

### For Teachers

1. **Add Class Events**:
   - Tap the + FAB button
   - Select "Class" as event type
   - Choose the course
   - Set date/time
   - Enable recurring if needed (e.g., every Mon, Wed, Fri)
   - Optionally enable attendance tracking
   - Save

2. **View Course Events**:
   - All class events, exams, and assignment deadlines appear
   - Filter by course if needed

### For Admins

1. **Add Exams**:
   - Tap the + FAB button
   - Select "Exam" as event type
   - Choose the course
   - Set date/time
   - Save

2. **Manage All Events**:
   - Full access to all events
   - Can edit/delete any event

## Technical Details

### Data Model

**calendarEvents Collection**:
```typescript
{
  id: string;
  title: string;
  type: 'class' | 'exam' | 'assignment' | 'personal';
  courseInstanceId?: string | null;
  courseName?: string;
  createdBy: string;
  startTime: Timestamp;
  endTime: Timestamp;
  recurrenceRule?: {
    frequency: 'weekly' | 'daily';
    days?: string[];  // ['MON', 'WED', 'FRI']
    until?: Timestamp;
  };
  isAttendanceEnabled?: boolean;
  createdAt: Timestamp;
}
```

### Event Expansion

Recurring events are expanded into individual occurrences on the client side:
- Original event stored once in Firestore
- Hook expands it based on recurrence rules
- Each occurrence gets a unique ID: `{originalId}_{timestamp}`
- Efficient querying within date ranges

### Firestore Queries

- Events are queried based on the current view's date range
- Recurring events are fetched from 90 days before the view range
- Real-time listeners update the calendar automatically
- Filters are applied client-side for performance

## Color Scheme

The calendar uses a clean black and white design with subtle accents:

- **Class Events**: Black border/background (#000000)
- **Exam Events**: Red accent (#EF4444)
- **Assignment Events**: Blue accent (#3B82F6)
- **Personal Events**: Green accent (#10B981)
- **Today**: Gray background (#F3F4F6)
- **Selected Date**: Black background (#000000)

## Components

### 1. MonthCalendar
Displays a traditional monthly calendar grid with:
- 7-column layout (Sun-Sat)
- Event indicators (small colored dots)
- Today highlighting
- Date selection

### 2. WeekCalendar
Shows a week view with:
- Day headers with date numbers
- Scrollable event columns
- Time display for each event
- Recurring event badges

### 3. EventList
Modal displaying all events for a selected date:
- Sorted by time
- Event cards with full details
- Empty state when no events
- Scroll support for many events

### 4. CreateEventModal
Full-screen modal for creating/editing events:
- Form validation
- Date/time pickers (iOS/Android compatible)
- Recurring event options
- Course selection for teachers/admins
- Attendance toggle for class events

## Integration Points

### 1. Assignment System
- When `createAssignment()` is called in `useAssignments.ts`
- Calendar event is automatically created
- Event title: "{AssignmentTitle} - Due"
- Event time: Assignment due date
- Event deleted when assignment is deleted

### 2. Course System
- Teachers see courses they teach
- Admins see all courses
- Course names are fetched and cached
- Events linked to courseInstanceId

### 3. Authentication
- Role-based UI changes
- Permission checks on event creation
- User ID tracking for personal events

## Future Enhancements

Potential additions for future versions:

1. **Event Details Page**: Full-page view with more information
2. **Event Editing**: Update existing events
3. **Push Notifications**: Reminders before events
4. **iCal Export**: Export calendar to other apps
5. **Event Search**: Search across all events
6. **Attendance Integration**: Direct link to attendance marking
7. **Color Customization**: Let users choose event colors
8. **Multiple Calendars**: Separate work/personal calendars
9. **Event Sharing**: Share events with other users
10. **Offline Support**: Cache events for offline viewing

## Performance Considerations

- **Lazy Loading**: Events loaded per view range only
- **Client-Side Expansion**: Recurring events expanded in memory
- **Memoization**: Heavy calculations cached with useMemo
- **Real-time Optimization**: Unsubscribe listeners on unmount
- **Pagination**: Future support for very long event lists

## Testing Checklist

- [ ] Create event as student (personal only)
- [ ] Create event as teacher (class + personal)
- [ ] Create event as admin (all types)
- [ ] Create recurring event (weekly with specific days)
- [ ] Create recurring event (daily)
- [ ] View month calendar with events
- [ ] View week calendar with events
- [ ] Switch between month/week views
- [ ] Filter events by type
- [ ] Select date and view event list
- [ ] Navigate between months
- [ ] Navigate between weeks
- [ ] Jump to today
- [ ] Create assignment and verify calendar event created
- [ ] Delete assignment and verify calendar event deleted
- [ ] Test on iOS
- [ ] Test on Android
- [ ] Test date/time pickers on both platforms

## Dependencies

- `@react-native-community/datetimepicker`: Native date/time picker
- `firebase/firestore`: Backend storage
- `lucide-react-native`: Icons
- React Native components: Modal, ScrollView, TouchableOpacity, etc.

## Known Limitations

1. **Recurrence Editing**: Cannot edit single occurrence of recurring event (future enhancement)
2. **Time Zones**: Uses device local time (future: support multiple time zones)
3. **All-Day Events**: Not currently supported (future enhancement)
4. **Event Conflicts**: No conflict detection (future enhancement)

## Support

For issues or questions about the calendar feature, please refer to:
- Main README.md for general app information
- Firestore schema documentation
- Component source code comments

---

**Last Updated**: January 2025
**Version**: 1.0.0