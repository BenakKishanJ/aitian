# AITIAN

All-in-One Academic & Campus Management App for Colleges

## Overview

AITIAN is a cross-platform mobile application (iOS & Android) designed to streamline academic life for students, teachers, parents, and administrators. Built with Expo and React Native, it replaces fragmented systems with a unified, role-aware platform.

**Key Philosophy:** Same interface for all roles, different capabilities through conditional rendering.

## Tech Stack

- **Frontend:** Expo + React Native + TypeScript
- **UI Framework:** Gluestack UI + NativeWind (Tailwind CSS)
- **Routing:** Expo Router
- **Backend:** Firebase (Auth + Firestore)
- **Testing:** Jest with jest-expo preset

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web

# Run tests
npm test
npx jest --testPathPattern="ComponentName" --watch

# Deploy Firestore Security Rules
npm run firebase:login        # First time only
npm run firebase:deploy:rules # Deploy rules to production
```

## Project Structure

```
app/
  (auth)/           # Login, register, parent linking
  (tabs)/           # Main tabs: home, calendar, academics, news, profile
  admin/            # Admin dashboard and management
components/
  ui/               # Gluestack UI components
  home/             # Home screen components
  calendar/         # Calendar components
  academics/        # Academics components
hooks/              # Custom React hooks
lib/                # Firebase config, utilities, contexts
constants/          # App constants
docs/               # Feature documentation
```

## Features

### Core Tabs

| Tab           | Description                                            | Status        |
| ------------- | ------------------------------------------------------ | ------------- |
| **Home**      | Personalized dashboard with stats, schedule, deadlines | ✅ Complete   |
| **Calendar**  | Month/week views, events, recurring classes            | ✅ Complete   |
| **Academics** | Courses, materials, assignments, marks, attendance     | ✅ Complete\* |
| **News**      | Role-based feed, post creation, pinning                | ✅ Complete\* |
| **Profile**   | User info, linked accounts, logout                     | ✅ Complete   |

\*See limitations below

### Role-Based Features

- **Students:** View schedule, submit assignments, track attendance, see marks
- **Teachers:** Create assignments, upload materials, grade submissions, manage classes
- **Parents:** Read-only access to linked student's data
- **Admins:** Full system management, user/course creation

## Architecture

### Firestore Collections

```
users | courseInstances | enrollments | calendarEvents
materials | assignments | submissions | marks
discussions | newsPosts | parentLinks | attendanceRecords
```

### Key Principles

- Flat collections, no deep nesting
- Reference by ID, minimal duplication
- Read-optimized queries
- Role enforcement in Security Rules

## Development

### Path Aliases

- `@/` → project root
- `tailwind.config` → `./tailwind.config.js`

### Code Style

- TypeScript strict mode
- Functional components with hooks
- NativeWind for styling: `className="flex-row items-center"`
- 2-space indentation, single quotes, semicolons

### Testing

Test files: `*.test.tsx` or `__tests__/*.tsx`

```bash
# Run all tests in watch mode
npm test

# Run specific test file
npx jest --testPathPattern="Button" --watch

# Run specific test name
npx jest --testNamePattern="renders correctly"
```

## Implementation Status

### ✅ Fully Implemented

- Authentication (email/password, role-based)
- Parent linking system
- Home dashboard (stats, schedule, assignments, announcements)
- Calendar (month/week views, recurring events, filters)
- News feed (create posts, role-based visibility, pinning)
- Profile (edit name, view linked accounts)
- Course listing and detail views
- Materials upload/download
- Assignment creation and submission
- Marks display with progress bars
- Attendance calendar view

### ⚠️ Partially Implemented

- **Discussions:** Basic UI created, needs reply system and real-time updates
- **Attendance:** Display only, needs session start/mark functionality
- **Marks:** Display only, needs editing interface for teachers

### ❌ Not Yet Implemented

- **Media Upload:** Image picker and Firebase Storage integration
- **Real-time Features:** Live attendance marking, notifications
- **Admin Tools:** User management, course creation UI
- **Bulk Operations:** CSV import for marks, mass enrollment
- **Analytics:** Charts, reports, trends
- **Notifications:** Push notifications, in-app alerts
- **Offline Support:** Data caching
- **Export Features:** PDF reports, transcripts

## Documentation

Feature-specific documentation in `/docs/`:

- `HOME_SCREEN_DOCUMENTATION.md`
- `CALENDAR_FEATURE.md`
- `NEWS_PAGE_IMPLEMENTATION.md`
- `ACADEMICS_IMPLEMENTATION.md`
- `PROFILE_PAGE_IMPLEMENTATION.md`

## Next Steps

IMPLEMENTATION STATUS
✅ FULLY IMPLEMENTED
All Roles:

- Authentication (registration, login, email verification, password reset)
- Home dashboard with role-based stats and quick actions
- Calendar (month/week views, event creation, recurring events, filters)
- News/Announcements (role-based viewing, create posts, pinning)
- Profile (view/edit info, linked accounts, logout)
  Students:
- View courses, materials, assignments
- Submit assignments (URL/text)
- View attendance percentage
- View marks (display only)
  Teachers:
- Create/edit/delete courses, materials, assignments
- Grade student submissions
- Create calendar events
- Full academics management
  Parents:
- Read-only access to linked student's data
- View all academics content
- Monitor attendance and marks
  Admins:
- System dashboard with statistics
- Course management (create, auto-enroll)
- Post announcements to any audience
- Create all event types (including exams)

---

⚠️ PARTIALLY IMPLEMENTED

1. Discussions - UI exists but no actual thread/reply functionality
2. Attendance - Display works but teachers can't mark attendance in real-time
3. Marks - Students can view (mock data), but teachers can't edit grades via UI
4. Media Upload - Placeholder only, needs image picker + Firebase Storage
5. Post Editing/Deletion - Not implemented in News

---

❌ NOT YET IMPLEMENTED
Critical (High Priority):

1. Firestore Security Rules - Essential for production!
2. Teacher Attendance Marking - Start sessions, mark students present/absent
3. Discussion Forum - Complete thread/reply system
4. Admin User Management - Create/edit/delete users
5. Marks Editing - Interface for teachers to input grades
   Important (Medium Priority):
6. File Upload - PDF/document submission (not just URLs)
7. Push Notifications - Assignment alerts, grade notifications
8. Bulk Operations - CSV import for users/marks
9. Elective Enrollment - Students browse and enroll in electives
   Enhancements (Low Priority):
10. Analytics Dashboard - Charts and reports
11. Offline Support - Data caching
12. Advanced Search - Full-text search with Algolia
13. Audit Logs - Track admin actions

---

What Should We Implement Next?
My recommendation:

1. Firestore Security Rules (Critical - security risk)
2. Teacher Attendance System (Core feature for teachers)
3. Discussion Forum (Complete the academics section)
4. Admin User Management (Essential admin capability)

### High Priority

1. Implement Firestore Security Rules
2. Complete discussions (thread replies, real-time)
3. Add marks editing for teachers
4. Build attendance session management
5. Integrate media upload (Firebase Storage)

### Medium Priority

6. Push notifications for assignments and grades
7. Analytics and reporting dashboard
8. Bulk CSV operations
9. Offline data caching

### Low Priority

10. iOS/Android widgets
11. Dark mode support
12. Export to PDF

## License

Private - For educational institutions

---

**Built with:** Expo, React Native, Firebase, Gluestack UI, NativeWind
