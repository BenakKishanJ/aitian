# Calendar Feature - Testing Checklist

## 📋 Overview
This checklist ensures all calendar features are thoroughly tested across different roles, platforms, and scenarios.

---

## 🧪 Pre-Testing Setup

### Required Test Accounts
- [ ] Student account created and logged in
- [ ] Teacher account created and logged in
- [ ] Admin account created and logged in
- [ ] Parent account created and logged in

### Required Data
- [ ] At least 2 departments exist
- [ ] At least 3 courses exist
- [ ] At least 2 course instances active
- [ ] Teacher assigned to course instances
- [ ] Student enrolled in courses
- [ ] Parent linked to student

---

## 📱 Platform Testing

### iOS Testing
- [ ] iPhone SE (small screen)
- [ ] iPhone 14 Pro (standard screen)
- [ ] iPhone 14 Pro Max (large screen)
- [ ] iPad (tablet layout)

### Android Testing
- [ ] Small phone (5.5" screen)
- [ ] Standard phone (6.1" screen)
- [ ] Large phone (6.7" screen)
- [ ] Tablet

---

## 🎓 Student Role Tests

### Basic Navigation
- [ ] Open Calendar tab from bottom navigation
- [ ] Calendar screen loads successfully
- [ ] Month view displays by default
- [ ] Current month and year shown in header
- [ ] Today's date highlighted with gray background
- [ ] Navigation arrows visible

### Month View
- [ ] Calendar grid shows 7 columns (Sun-Sat)
- [ ] All dates visible for current month
- [ ] Previous/next month dates shown in gray
- [ ] Tap previous arrow navigates to previous month
- [ ] Tap next arrow navigates to next month
- [ ] Tap header date text jumps to today
- [ ] Weekends (Sat/Sun) slightly grayed out

### Week View
- [ ] Switch to Week view using toggle button
- [ ] Week view shows 7 columns for current week
- [ ] Day headers show day name and date number
- [ ] Current day highlighted
- [ ] Events displayed as cards in columns
- [ ] Tap previous arrow navigates to previous week
- [ ] Tap next arrow navigates to next week
- [ ] Scroll horizontally to see more events

### Event Viewing
- [ ] See class events created by teachers
- [ ] See exam events created by admins
- [ ] See assignment deadline events
- [ ] Cannot see other students' personal events
- [ ] Event indicators (dots) appear on dates with events
- [ ] Different colors for different event types:
  - [ ] Black dot for class events
  - [ ] Red dot for exam events
  - [ ] Blue dot for assignment events
  - [ ] Green dot for personal events
- [ ] Tap date to open event list modal
- [ ] Event list shows all events for selected date
- [ ] Events sorted by time (earliest first)
- [ ] Empty state shown when no events

### Personal Event Creation
- [ ] FAB (+) button visible in bottom-right
- [ ] Tap FAB opens create event modal
- [ ] Only "Personal" event type available
- [ ] Title field accepts text input
- [ ] Date picker works on platform
- [ ] Time pickers work (start and end)
- [ ] Can toggle recurring event ON
- [ ] Daily frequency option available
- [ ] Weekly frequency option available
- [ ] Can select specific days for weekly recurrence
- [ ] Can set end date for recurrence
- [ ] Save button creates event successfully
- [ ] Event appears on calendar immediately
- [ ] Close button cancels creation

### Filters
- [ ] Filter icon visible in top-right
- [ ] Tap filter icon opens filter modal
- [ ] All event types listed (Class, Exam, Assignment, Personal)
- [ ] Can select/deselect event types
- [ ] Selected filters show checkmark
- [ ] Filter badge shows count of active filters
- [ ] "Clear All" removes all filters
- [ ] "Apply" button applies filters
- [ ] Calendar updates to show only filtered events
- [ ] Filter persists when switching views

### Permissions
- [ ] Cannot edit class events
- [ ] Cannot edit exam events
- [ ] Cannot edit assignment events
- [ ] Can edit own personal events (future feature)
- [ ] Cannot delete class events
- [ ] Cannot delete exam events
- [ ] Cannot delete assignment events
- [ ] Can delete own personal events (future feature)

### Real-time Updates
- [ ] Pull-to-refresh works
- [ ] New events appear automatically (when teacher creates)
- [ ] Deleted events disappear automatically
- [ ] Updated events refresh automatically

---

## 👨‍🏫 Teacher Role Tests

### Event Creation - Class Events
- [ ] FAB button visible
- [ ] Tap FAB opens create event modal
- [ ] "Class" event type available
- [ ] "Personal" event type available
- [ ] Course dropdown shows only teacher's courses
- [ ] Can select a course from dropdown
- [ ] Can create one-time class event
- [ ] Event appears on calendar for enrolled students

### Recurring Class Events
- [ ] Can toggle recurring ON
- [ ] Can select "Weekly" frequency
- [ ] Can select multiple days (e.g., Mon, Wed, Fri)
- [ ] Can set start date
- [ ] Can set end date
- [ ] All occurrences appear on calendar
- [ ] Recurring badge (↻) shown on events
- [ ] Each occurrence has correct date/time

### Attendance Feature
- [ ] Attendance toggle visible for class events
- [ ] Can enable attendance for class event
- [ ] "Attendance Enabled" badge shown on event cards
- [ ] Attendance setting saved correctly

### Multiple Courses
- [ ] Can create events for different courses
- [ ] Course name appears on event cards
- [ ] Can filter by course (future feature)

### Personal Events
- [ ] Can create personal events (like students)
- [ ] Personal events separate from class events
- [ ] Both event types visible on calendar

### Event Management
- [ ] Can view own class events
- [ ] Can view own personal events
- [ ] Cannot edit other teachers' events
- [ ] Cannot edit admin events
- [ ] Can edit own events (future feature)
- [ ] Can delete own events (future feature)

---

## 👔 Admin Role Tests

### Full Access
- [ ] FAB button visible
- [ ] All event types available:
  - [ ] Class
  - [ ] Exam
  - [ ] Assignment
  - [ ] Personal
- [ ] Course dropdown shows ALL courses

### Exam Creation
- [ ] Can select "Exam" event type
- [ ] Can choose any course
- [ ] Can set exam date/time
- [ ] Exam appears for all students in course
- [ ] Exam shown with red color/accent
- [ ] Cannot enable attendance for exams

### Global Events
- [ ] Can create events without course selection
- [ ] Global events visible to all users

### Management
- [ ] Can view all events across all courses
- [ ] Can view all users' events
- [ ] Can edit any event (future feature)
- [ ] Can delete any event (future feature)

---

## 👪 Parent Role Tests

### Read-Only Access
- [ ] Calendar tab accessible
- [ ] Can view child's schedule
- [ ] Can see all child's events:
  - [ ] Class events
  - [ ] Exam events
  - [ ] Assignment events
  - [ ] Child's personal events (if visible)
- [ ] NO FAB button visible
- [ ] Cannot create events
- [ ] Cannot edit events
- [ ] Cannot delete events
- [ ] Can switch between views (Month/Week)
- [ ] Can use filters
- [ ] Can navigate dates

---

## 📚 Assignment Integration Tests

### Automatic Event Creation
- [ ] Create assignment as teacher
- [ ] Calendar event automatically created
- [ ] Event title: "{Assignment Title} - Due"
- [ ] Event date matches assignment due date
- [ ] Event time matches assignment due time
- [ ] Event type is "assignment"
- [ ] Event linked to correct course
- [ ] Event appears for enrolled students
- [ ] Event appears immediately (real-time)

### Event Details
- [ ] Assignment event shows course name
- [ ] Assignment event shows correct time
- [ ] Assignment event has blue color/accent
- [ ] Assignment event visible in filters

### Automatic Event Deletion
- [ ] Delete assignment as teacher
- [ ] Calendar event automatically deleted
- [ ] Event disappears from calendar
- [ ] Event disappears for all students
- [ ] No orphaned events remain

### Multiple Assignments
- [ ] Create multiple assignments for same course
- [ ] Each creates separate calendar event
- [ ] All events visible on calendar
- [ ] Can distinguish between assignments

---

## 🔄 Recurring Events Tests

### Daily Recurrence
- [ ] Create daily recurring event
- [ ] Set start date
- [ ] Set end date (e.g., 30 days later)
- [ ] All 30 occurrences appear on calendar
- [ ] Each occurrence has correct date
- [ ] Time remains consistent across occurrences

### Weekly Recurrence - Single Day
- [ ] Create weekly recurring event
- [ ] Select only Monday
- [ ] Set start date (a Monday)
- [ ] Set end date (e.g., 3 months later)
- [ ] All Monday occurrences appear (~12 events)
- [ ] No events on other days

### Weekly Recurrence - Multiple Days
- [ ] Create weekly recurring event
- [ ] Select Mon, Wed, Fri
- [ ] Set start date
- [ ] Set end date (e.g., semester length)
- [ ] All occurrences appear on correct days
- [ ] Count matches expected (e.g., 45 classes for 15 weeks)

### Recurrence Without End Date
- [ ] Create recurring event without end date
- [ ] Events appear for reasonable future period
- [ ] No performance issues
- [ ] Can navigate to future dates and see events

### Recurrence Edge Cases
- [ ] Start date is not one of selected days
- [ ] End date is before next occurrence
- [ ] Cross month boundaries
- [ ] Cross year boundaries
- [ ] Handle daylight saving time changes

---

## 🎨 UI/UX Tests

### Visual Design
- [ ] Black and white color scheme maintained
- [ ] Clean, modern aesthetic
- [ ] Consistent spacing and padding
- [ ] Readable font sizes
- [ ] Clear visual hierarchy
- [ ] Icons are clear and recognizable

### Responsive Design
- [ ] Layout adapts to screen size
- [ ] No horizontal scrolling (except week view events)
- [ ] Text doesn't overflow
- [ ] Buttons are tappable (minimum 44x44 points)
- [ ] Modals fit screen on small devices

### Accessibility
- [ ] Sufficient color contrast
- [ ] Text is readable at default size
- [ ] Touch targets are adequate size
- [ ] No text in images
- [ ] Icons have descriptive purposes

### Animations
- [ ] Modal transitions smooth
- [ ] View switching smooth
- [ ] No janky animations
- [ ] Loading states shown appropriately

### Loading States
- [ ] Initial load shows loading spinner
- [ ] Pull-to-refresh shows indicator
- [ ] Creating event shows saving state
- [ ] Save button disabled during save

### Empty States
- [ ] Month with no events shows clean calendar
- [ ] Week with no events shows "—" in columns
- [ ] Selected day with no events shows empty state message
- [ ] Empty state includes helpful text

### Error States
- [ ] Network error shows error message
- [ ] Failed event creation shows alert
- [ ] Retry option available
- [ ] Error messages are helpful

---

## 🔧 Technical Tests

### Performance
- [ ] Calendar loads within 2 seconds
- [ ] Switching views is instant
- [ ] No lag when scrolling
- [ ] No lag when navigating months/weeks
- [ ] Recurring events expand quickly
- [ ] Filter application is instant
- [ ] Works well with 100+ events

### Data Integrity
- [ ] Events persist after app restart
- [ ] Events sync across devices
- [ ] Recurring events calculated correctly
- [ ] Times display in local timezone
- [ ] Dates handle timezone correctly

### Firestore Integration
- [ ] Real-time listener connects
- [ ] Events update in real-time
- [ ] Listener disconnects on unmount
- [ ] No memory leaks
- [ ] Efficient queries (only fetch needed data)

### Edge Cases
- [ ] February (28/29 days)
- [ ] Months with 31 days
- [ ] Months starting on Sunday
- [ ] Months starting on Saturday
- [ ] Events at midnight
- [ ] Events at 11:59 PM
- [ ] Events spanning multiple days (currently 1 hour duration)
- [ ] Events in past
- [ ] Events far in future

---

## 🌐 Cross-Platform Tests

### Date/Time Pickers
- [ ] iOS date picker displays correctly
- [ ] iOS time picker displays correctly
- [ ] Android date picker displays correctly
- [ ] Android time picker displays correctly
- [ ] Picker values save correctly
- [ ] Picker cancellation works

### Platform-Specific UI
- [ ] Modal presentation style appropriate for platform
- [ ] Safe areas respected (iPhone notch, Android navigation)
- [ ] Back button works on Android
- [ ] Swipe-to-dismiss works on iOS
- [ ] Keyboard avoidance works on both platforms

---

## 🔐 Security & Permissions Tests

### Authentication
- [ ] Must be logged in to access calendar
- [ ] Redirects to login if not authenticated
- [ ] User ID correctly associated with events

### Role-Based Access
- [ ] Students cannot access teacher features
- [ ] Teachers cannot access admin-only features
- [ ] Parents have read-only access
- [ ] Role checks enforced on backend (Firestore rules)

### Data Privacy
- [ ] Users only see events they should see
- [ ] Personal events private to creator
- [ ] Course events visible to enrolled students only
- [ ] No data leakage between users

---

## 🔄 Integration Tests

### With Academics Tab
- [ ] Course names match between tabs
- [ ] Course instances correctly linked
- [ ] Enrollment respected for event visibility

### With Assignments
- [ ] Assignment creation triggers calendar event
- [ ] Assignment deletion removes calendar event
- [ ] Assignment due date matches calendar event
- [ ] Course linkage maintained

### With Attendance (Future)
- [ ] Class events with attendance enabled
- [ ] Can navigate to attendance from event (future)

---

## 📊 Stress Tests

### Large Data Sets
- [ ] 100+ events in a month
- [ ] 50+ recurring events
- [ ] Multiple courses with events
- [ ] Year-long recurring events
- [ ] Performance remains acceptable

### Rapid Actions
- [ ] Quick view switching
- [ ] Rapid date navigation
- [ ] Fast filter toggling
- [ ] Multiple events created in succession
- [ ] No crashes or freezes

---

## 🐛 Bug Tests

### Common Issues
- [ ] Events don't duplicate
- [ ] Filters don't persist unintentionally
- [ ] Modal doesn't get stuck
- [ ] Navigation doesn't break
- [ ] Date calculations are correct
- [ ] No infinite loops
- [ ] No memory leaks

### Form Validation
- [ ] Cannot save event without title
- [ ] Cannot save class event without course
- [ ] Cannot save with invalid date
- [ ] Cannot save with end time before start time
- [ ] Cannot save weekly recurrence without days

---

## ✅ Final Verification

### Production Readiness
- [ ] All critical features working
- [ ] No console errors
- [ ] No console warnings
- [ ] Acceptable performance
- [ ] No known major bugs
- [ ] Documentation complete
- [ ] Code reviewed
- [ ] Firestore indexes created (if needed)

### User Experience
- [ ] Intuitive to use
- [ ] Clear instructions where needed
- [ ] Error messages helpful
- [ ] Success feedback clear
- [ ] Responsive and smooth
- [ ] Visually appealing

---

## 📝 Test Results Template

```
Test Date: _____________
Tester: _________________
Device: _________________
OS Version: _____________

Pass Rate: ____%

Critical Issues: ______
Major Issues: ______
Minor Issues: ______

Notes:
_____________________
_____________________
_____________________

Sign-off: ____________
```

---

## 🎯 Priority Levels

### P0 - Critical (Must Fix Before Release)
- Authentication issues
- App crashes
- Data loss
- Complete feature failure
- Security vulnerabilities

### P1 - High (Should Fix Before Release)
- Major UI issues
- Incorrect calculations
- Permission errors
- Poor performance

### P2 - Medium (Fix in Next Version)
- Minor UI issues
- Non-critical bugs
- UX improvements

### P3 - Low (Nice to Have)
- Edge case issues
- Cosmetic improvements
- Optional enhancements

---

**Testing Status**: ⏳ Pending  
**Last Updated**: January 2025  
**Estimated Testing Time**: 4-6 hours (comprehensive test)