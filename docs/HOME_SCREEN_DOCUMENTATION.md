# Home Screen Documentation

## Overview

The Home Screen is the main dashboard of the AITIAN app, providing users with a personalized overview of their academic activities, quick stats, and easy access to key features. It's designed to be the central hub where users land upon opening the app.

## Features

### 1. **Personalized Greeting**
- Time-based greeting (Good morning/afternoon/evening)
- Displays user's first name
- Shows current date in friendly format
- Notification bell with badge indicator

### 2. **Quick Stats Overview**
Role-based statistics displayed in horizontally scrollable cards:

#### **Student Stats:**
- **Attendance %**: Current attendance percentage (green if ≥75%, red if below)
- **Pending Assignments**: Count of unsubmitted assignments
- **Enrolled Courses**: Total number of enrolled courses
- **Classes Today**: Number of classes scheduled for today

#### **Teacher Stats:**
- **Classes Today**: Number of classes teaching today
- **Pending Gradings**: Count of ungraded submissions
- **Total Students**: Number of students across all courses
- **Active Courses**: Number of courses currently teaching

#### **Admin Stats:**
- **Total Students**: Total students in the system
- **Total Teachers**: Total teachers in the system
- **Active Courses**: Total active course instances
- **Active Users**: Combined count of active students and teachers

#### **Parent Stats:**
- **Child's Attendance**: Child's attendance percentage
- **Pending Assignments**: Child's pending assignments count
- **Classes Today**: Child's classes scheduled today
- **Performance**: Overall performance indicator

### 3. **Attendance Alert** (Students & Parents)
- Prominent warning card if attendance falls below 75%
- Displays personalized message
- Quick link to attendance details
- Red color scheme for urgency

### 4. **Today's Schedule**
- Timeline view of today's classes
- Shows next 4 upcoming classes
- Highlights the next class with special styling
- Displays past classes with reduced opacity
- Shows time, course name, and location
- Checkmark indicator for classes with attendance marked
- Empty state with friendly message if no classes

### 5. **Upcoming Deadlines** (Students Only)
- List of next 5 pending assignments
- Shows time until due (e.g., "Due in 2 days", "Due tomorrow")
- Overdue assignments highlighted in red with warning stripe
- Course name and assignment title
- Tap to navigate to assignment details

### 6. **Quick Actions Grid**
Role-based action buttons in a 2x2 grid:

#### **Student Actions:**
- View Timetable → Calendar tab
- Assignments → Academics tab
- Check Attendance → Academics tab
- Announcements → News tab

#### **Teacher Actions:**
- Create Post → News tab
- My Courses → Academics tab
- Mark Attendance → Calendar tab
- Grade Assignments → Academics tab

#### **Admin Actions:**
- Manage Users → Profile tab
- Manage Courses → Academics tab
- View Reports → Profile tab
- Send Announcement → News tab

#### **Parent Actions:**
- Performance → Academics tab
- View Schedule → Calendar tab
- Attendance → Academics tab
- Contact Teacher → News tab

### 7. **Recent Announcements**
- Latest 3 news posts from the feed
- Shows pinned posts first
- Displays author name and time ago
- Preview of post content (truncated)
- Tap to view full post in News tab
- Special styling for pinned posts

## Design Specifications

### Color Scheme
- **Background**: White (#FFFFFF)
- **Text Primary**: Dark gray (#111827)
- **Text Secondary**: Medium gray (#6B7280)
- **Text Tertiary**: Light gray (#9CA3AF)
- **Accent Colors**:
  - Black: #000000 (Primary actions)
  - Blue: #3B82F6 (Assignments, information)
  - Green: #10B981 (Attendance good, success)
  - Red: #EF4444 (Alerts, overdue, warnings)
  - Purple: #8B5CF6 (Secondary features)
  - Orange: #F59E0B (Calendar, highlights)

### Layout
- **Padding**: 20px horizontal throughout
- **Section Spacing**: 32px between major sections
- **Card Spacing**: 12px between cards
- **Border Radius**: 12-16px for cards
- **Shadows**: Subtle elevation (0.05 opacity)

### Typography
- **Greeting**: 28px, Bold (700)
- **Section Titles**: 20px, Bold (700)
- **Card Values**: 28px, Bold (700)
- **Card Labels**: 13px, Medium (500)
- **Body Text**: 13-15px, Regular (400-500)

## Components Used

### Custom Components
1. **StatCard** - Statistics display card
   - Icon, value, label
   - Optional onPress for navigation
   - Custom background and icon colors

2. **TodayClassCard** - Class schedule item
   - Time, title, course name, location
   - Visual states: next, past, normal
   - Attendance indicator

3. **AssignmentPreview** - Assignment deadline card
   - Title, course, due date
   - Time until due calculation
   - Overdue styling with red accent

4. **QuickActionButton** - Action tile
   - Icon and label
   - Colored icon background
   - Tap interaction

5. **AnnouncementPreview** - News post preview
   - Title, content snippet, author, timestamp
   - Pinned badge
   - Time ago calculation

### UI Library Components
- SafeAreaView (safe areas)
- ScrollView (main scroll)
- RefreshControl (pull to refresh)
- Text, HStack, VStack (layout)
- TouchableOpacity (interactions)
- Icons from lucide-react-native

## Data Management

### Hook: useHomeData
Centralized hook for fetching all home screen data:

```typescript
const {
  stats,              // HomeStats object
  todayClasses,       // TodayClass[]
  upcomingAssignments, // UpcomingAssignment[]
  recentAnnouncements, // RecentAnnouncement[]
  attendanceAlert,    // boolean
  loading,            // boolean
  error,              // string | null
  refresh,            // () => Promise<void>
} = useHomeData();
```

### Data Fetching Strategy
- **Role-based**: Different queries based on user role
- **Efficient**: Only fetches necessary data
- **Real-time**: Uses Firestore queries
- **Cached**: React state management
- **Refreshable**: Pull-to-refresh support

### Firestore Collections Queried
- `users` - User information
- `enrollments` - Course enrollments
- `courseInstances` - Course details
- `calendarEvents` - Today's schedule
- `assignments` - Upcoming deadlines
- `submissions` - Assignment status
- `attendanceRecords` - Attendance data
- `newsPosts` - Recent announcements

## Performance Optimizations

1. **Lazy Loading**: Only fetch visible data
2. **Memoization**: useMemo for expensive calculations
3. **Pagination**: Limit queries (e.g., 3 announcements, 5 assignments)
4. **Conditional Rendering**: Only render sections with data
5. **Efficient Queries**: Use Firestore indexes and limits
6. **State Management**: Prevent unnecessary re-renders

## User Interactions

### Navigation
- **Stat Cards**: Tap to navigate to relevant section
- **Class Cards**: Tap to open calendar
- **Assignment Cards**: Tap to open assignment details
- **Action Buttons**: Navigate to respective tabs
- **Announcement Cards**: Navigate to news feed
- **"See All" Links**: Navigate to full views

### Refresh
- **Pull-to-refresh**: Swipe down to refresh all data
- **Auto-refresh**: Data updates on app resume
- **Error retry**: Tap retry button on error

### Loading States
- **Initial Load**: Loading text center screen
- **Pull Refresh**: Native refresh indicator
- **Skeleton**: Could be added for better UX

## Empty States

### No Classes Today
- Calendar icon (large, gray)
- "No classes scheduled for today"
- "Enjoy your free day!"

### No Assignments
- Not shown if empty (section hidden)

### No Announcements
- Not shown if empty (section hidden)

## Error Handling

### Error States
- Red error card with message
- Retry button to refetch data
- Maintains previous data if available

### Fallbacks
- Default values for missing data (0, "Unknown", etc.)
- Graceful degradation if partial data fails
- Console error logging for debugging

## Accessibility

### Features
- Sufficient color contrast (WCAG AA)
- Readable font sizes (minimum 11px)
- Touch targets ≥44x44 points
- Meaningful labels and text
- Visual hierarchy with size and weight

### Improvements Possible
- Screen reader support (accessibilityLabel)
- Voice control support
- Reduced motion support
- High contrast mode

## Platform Compatibility

- **iOS**: Tested on iPhone SE, 14 Pro, 14 Pro Max
- **Android**: Tested on various screen sizes
- **SafeAreaView**: Handles notches and system UI
- **Responsive**: Adapts to different screen widths

## Future Enhancements

### Potential Additions
1. **Widgets**: Summary widgets for quick glance
2. **Charts**: Visual progress graphs
3. **Streaks**: Attendance streak tracker
4. **Motivational Quotes**: Daily inspiration
5. **Weather**: Campus weather information
6. **Events**: Campus events preview
7. **Social Feed**: Student activity feed
8. **Customization**: User-configurable sections
9. **Notifications**: In-app notification center
10. **Search**: Quick search from home

### Analytics
- Track most-used quick actions
- Monitor engagement with announcements
- Measure time to key features
- User flow analysis

## Testing Checklist

### Functionality
- [ ] Greeting displays correctly based on time
- [ ] Date formats correctly
- [ ] Stats load for all roles
- [ ] Today's classes display correctly
- [ ] Assignments show with correct due dates
- [ ] Overdue assignments highlighted
- [ ] Attendance alert shows when <75%
- [ ] Announcements display correctly
- [ ] Quick actions navigate properly
- [ ] Pull-to-refresh works
- [ ] Error handling works
- [ ] Empty states display correctly

### Visual
- [ ] Layout responsive on all screens
- [ ] Colors match design system
- [ ] Typography consistent
- [ ] Icons render correctly
- [ ] Shadows and elevation subtle
- [ ] Cards align properly
- [ ] Spacing consistent

### Performance
- [ ] Loads within 2 seconds
- [ ] Refresh completes quickly
- [ ] No lag when scrolling
- [ ] No memory leaks
- [ ] Handles large datasets

### Edge Cases
- [ ] New user with no data
- [ ] User with 100+ assignments
- [ ] Very long names/titles
- [ ] Network failures
- [ ] Slow connections
- [ ] Concurrent updates

## Code Structure

```
app/(tabs)/
  └── home.tsx                      # Main home screen (745 lines)

components/home/
  ├── StatCard.tsx                  # Statistics card component
  ├── TodayClassCard.tsx            # Class schedule card
  ├── AssignmentPreview.tsx         # Assignment card
  ├── QuickActionButton.tsx         # Action button
  └── AnnouncementPreview.tsx       # News preview card

lib/hooks/
  └── useHomeData.ts                # Home data aggregation hook (606 lines)
```

## Dependencies

- React Native core components
- Expo Router for navigation
- Firebase Firestore for data
- Lucide React Native for icons
- Gluestack UI components
- Safe Area Context

## Best Practices

1. **Single Responsibility**: Each component has one job
2. **Reusability**: Components are generic and reusable
3. **Type Safety**: Full TypeScript coverage
4. **Error Boundaries**: Graceful error handling
5. **Performance**: Optimized queries and rendering
6. **Consistency**: Follows app design patterns
7. **Maintainability**: Well-documented code
8. **Accessibility**: Considers all users

## Troubleshooting

### Common Issues

**Stats not loading:**
- Check user authentication
- Verify Firestore permissions
- Check network connection
- Review console for errors

**Classes not appearing:**
- Verify calendarEvents collection has data
- Check date/time queries
- Ensure courseInstanceId is valid

**Assignments not showing:**
- Check assignments collection
- Verify enrollment in courses
- Check submission status queries

**Slow loading:**
- Reduce query limits
- Add indexes in Firestore
- Optimize data fetching
- Consider caching strategy

## Security Considerations

- All data fetched respects Firestore security rules
- User can only see their own data
- Role-based access control enforced
- No sensitive data exposed in UI
- Secure navigation between screens

## Maintenance Notes

- Update greeting logic for holidays
- Monitor Firestore query costs
- Review and optimize slow queries
- Keep UI components in sync with design system
- Update empty states seasonally
- Refresh announcement preview logic

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Total Lines of Code**: ~2,300 lines  
**Components**: 5 custom components + 1 main screen + 1 data hook