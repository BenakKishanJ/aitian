# 📱 AITIAN

**All-in-One Academic & Campus Management App**

---

## 1. Project Overview

**AITIAN** is a cross-platform (Android & iOS) mobile application designed for colleges to manage academics, scheduling, attendance, communication, and performance tracking in a **single, clean, modern interface**.

The app replaces:

- Manual attendance
- WhatsApp groups
- PDF circulars
- Fragmented portals

with a **role-aware, calendar-driven, real-time system**.

---

## 2. Design Philosophy

### UI / UX Style

The UI follows an **illustrative, bold, modern dashboard aesthetic**, inspired by the provided reference designs:

- Cream / muted pastel backgrounds
- High-contrast cards
- Bold typography
- Playful yet professional illustrations
- Rounded surfaces and floating elements
- Minimal clutter, clear hierarchy

### UI Stack

- **gluestack-ui** (base components)
- **nativewind** (styling & theming)
- **Expo Router** (navigation)

All screens are **shared across roles**.
Differences are handled via **conditional rendering**, not separate pages.

---

## 3. Supported Roles

### Roles

```
student
teacher
parent
admin
```

### Key Principle

> **Same tabs, same pages, same navigation — different capabilities.**

Only **Admin** has a separate admin area due to system-level responsibilities.

---

## 4. Authentication & Access Rules

### Authentication

- Students & Teachers:
  - Must use **organizational email**

- Parents:
  - Can use personal email

- Firebase Email + Password
- Email verification required

### Parent Linking

- Parents do **NOT** use student credentials
- Parent sends request using student email / ID
- Student approves from their account
- Parent can link **up to 5 students max**
- Parent access is:
  - Read-only
  - Revocable by student anytime

---

## 5. Navigation Structure (All Roles)

### Bottom Tabs

1. **Home**
2. **Calendar**
3. **Academics**
4. **News**
5. **Profile**

Tabs never change.
Actions change via **Floating Action Button (FAB)** and role checks.

---

## 6. Floating Action Button (FAB)

### Purpose

Provides **context-aware creation & modification actions**.

### Visibility

- ❌ Students & Parents → No FAB
- ✅ Teachers → Limited FAB
- ✅ Admins → Full FAB

### Examples

| Screen   | Teacher FAB                        | Admin FAB                  |
| -------- | ---------------------------------- | -------------------------- |
| Calendar | Add / modify class events          | Add exams, override events |
| Course   | Upload material, create assignment | Edit course metadata       |
| News     | Create post                        | Create / pin post          |

FAB opens **modals / drawers**, never role-specific pages.

---

## 7. Academic Structure Hierarchy

```
Department
  └─ Semester
       └─ Section (A, B, C...)
            └─ Course Instance
```

### Student Identity

Each student belongs to:

```
department
semester
section
```

This hierarchy is used for:

- Enrollment
- Attendance
- Timetable
- Course access
- Analytics

---

## 8. Teacher Course Registration

### Flow

1. Admin creates:
   - Departments
   - Semesters
   - Sections
   - Courses

2. Teacher requests to teach:
   - Course
   - Department / Semester / Section

3. Admin approves
4. Teacher gains control **only over assigned courses**

---

## 9. Calendar & Timetable System

### Event Types

- Class sessions (recurring)
- Exams (admin only)
- Assignment deadlines
- Personal events

### Repeating Classes

- Weekly recurrence rules
- Editable:
  - Single occurrence
  - All future occurrences

### Permissions

| Role    | Can Modify           |
| ------- | -------------------- |
| Student | Personal events only |
| Teacher | Their class sessions |
| Admin   | All events           |

---

## 10. Attendance System (No QR)

### Core Idea

Attendance is managed **directly through calendar events**.

### Flow

1. Teacher starts attendance for an ongoing class
2. Students tap **“Mark Present”**
3. Teacher sees live attendance list
4. Teacher verifies & corrects attendance manually
5. Attendance locks when class ends

### Why This Works

- No QR dependency
- No projector required
- Verification handled by teacher
- Simple, practical, reliable

---

## 11. Academics Tab

### Semester-Wise View

- Past semesters → Read-only
- Current semester → Active
- Future semesters → Greyed out

---

## 12. Course (Subject) Detail Structure

Each **course instance** contains:

### 1️⃣ Course Details

- Name
- Course ID
- Department
- Semester
- Section(s)
- Credits
- Admin-defined metadata

---

### 2️⃣ Study Materials

- Materials stored as **links**
- Any storage provider supported
- Stored info:
  - Title
  - Type
  - URL
  - Uploaded by
  - Timestamp

---

### 3️⃣ Discussion Forum

- Thread-based
- Students ask doubts
- Teachers reply (highlighted)
- Moderation:
  - Teacher → their course
  - Admin → global

---

### 4️⃣ Assignments

- Created by teacher
- Fields:
  - Title
  - Description
  - Due date
  - Attachments

- Students submit via link or file
- Teachers grade & comment

---

### 5️⃣ Marks & Results

Marks breakdown:

```
CIE1
CIE2
Assignment
Final Exam
Total
Grade
```

Rules:

- Teacher → only their course students
- Admin → override any marks
- Students & Parents → view only

---

### 6️⃣ Attendance Summary

- Total classes
- Attended classes
- Percentage
- Derived from attendance sessions

---

## 13. Elective Courses

### Types

- Core courses → auto assigned
- Electives → chosen by students

### Rules

- First selection → auto approved
- Changes after selection → admin approval required

---

## 14. News / Feed

### Post Types

- Text
- Images
- Videos
- Attachments

### Permissions

- Teacher & Admin → post
- Admin → pin posts
- Students & Parents → view only

---

## 15. Home Screen

### Displays

- Greeting
- Today’s classes
- Attendance alerts
- Assignment deadlines
- Latest announcements

---

## 16. Profile Screen

- User details
- Role
- Linked students (for parents)
- Notification settings
- Logout

---

## 17. Expo Router Structure (High Level)

```txt
app/
 ├─ (auth)/
 │   ├─ login.tsx
 │   ├─ register.tsx
 │   └─ parent-link.tsx
 │
 ├─ (tabs)/
 │   ├─ home.tsx
 │   ├─ calendar.tsx
 │   ├─ academics.tsx
 │   ├─ news.tsx
 │   └─ profile.tsx
 │
 ├─ course/
 │   └─ [courseInstanceId]/
 │       ├─ index.tsx
 │       ├─ materials.tsx
 │       ├─ assignments.tsx
 │       ├─ discussion.tsx
 │       ├─ attendance.tsx
 │       └─ marks.tsx
 │
 ├─ admin/
 │   ├─ dashboard.tsx
 │   ├─ users.tsx
 │   ├─ courses.tsx
 │   ├─ timetable.tsx
 │   └─ approvals.tsx
```

---

## 18. Firestore Data Model (Normalized & Efficient)

### Core Collections

```
users
parentLinks
departments
courses
courseInstances
enrollments
calendarEvents
attendanceSessions
attendanceRecords
materials
assignments
submissions
marks
discussions
newsPosts
```

### Key Principles

- No deep nesting
- `courseInstance` = course + dept + sem + section
- Indexed by:
  - department
  - semester
  - section
  - userId

- Optimized for read performance

---

## 19. Security Rules

- Role-based access enforced in Firestore
- UI never trusted
- Parent access always read-only
- Teachers limited to assigned courses

---

## 20. Tech Stack

- **Frontend:** Expo + React Native + TypeScript
- **UI:** gluestack-ui + nativewind
- **Backend:** Firebase
  - Auth
  - Firestore
  - Storage (abstracted)
  - Cloud Messaging

---

## 21. Project Goal

AITIAN aims to be a **single source of truth** for academic life:

- Clean
- Reliable
- Scalable
- Human-friendly
- AI-friendly

---

1. **Design principles (important for AI + scale)**
2. **Collections & document schemas (field-by-field)**
3. **Relationships & query patterns**
4. **Indexes you’ll need**
5. **Notes on scalability & future-proofing**

---

# 1️⃣ Firestore Design Principles (Final)

These rules are intentionally followed everywhere below:

- ✅ **Flat collections** (no deep nesting)
- ✅ **Reference by ID, not duplication**
- ✅ **Read-optimized** (Firestore is read-heavy)
- ✅ **Role enforcement via Security Rules**
- ❌ No arrays that grow unbounded
- ❌ No polymorphic “magic” fields

---

# 2️⃣ Core Collections & Schemas

---

## 🔹 `users`

> All users: students, teachers, parents, admins

```ts
users / { userId };
```

```json
{
  "uid": "string",
  "role": "student | teacher | parent | admin",

  "name": "string",
  "email": "string",
  "photoURL": "string | null",

  // Academic identity (students only)
  "departmentId": "string | null",
  "semester": "number | null",
  "section": "string | null",

  // Teacher metadata
  "teacherCode": "string | null",

  "createdAt": "timestamp",
  "isActive": true
}
```

🔹 Notes:

- Parents **do not** have department/semester
- Teachers are linked via approvals (not here)

---

## 🔹 `parentLinks`

> Parent ↔ student relationship with approval

```ts
parentLinks / { linkId };
```

```json
{
  "parentId": "string",
  "studentId": "string",

  "status": "pending | approved | revoked",

  "requestedAt": "timestamp",
  "approvedAt": "timestamp | null"
}
```

🔹 Rules:

- Max 5 approved links per parent
- Student can revoke anytime

---

## 🔹 `departments`

```ts
departments / { departmentId };
```

```json
{
  "name": "Computer Science",
  "code": "CSE",

  "createdAt": "timestamp",
  "isActive": true
}
```

---

## 🔹 `courses`

> Abstract course definition (same for all sections)

```ts
courses / { courseId };
```

```json
{
  "courseCode": "CS401",
  "name": "Database Management Systems",

  "departmentId": "string",
  "semester": 4,
  "credits": 4,

  "isElective": false,

  "metadata": {
    "labRequired": true,
    "examType": "theory"
  },

  "createdBy": "adminId",
  "createdAt": "timestamp"
}
```

---

## 🔹 `courseInstances`

> **MOST IMPORTANT COLLECTION**
> One document = one course + dept + sem + section

```ts
courseInstances / { courseInstanceId };
```

```json
{
  "courseId": "string",

  "departmentId": "string",
  "semester": 4,
  "section": "A",

  "teacherIds": ["teacherId1"],

  "enrollmentType": "core | elective",

  "createdAt": "timestamp",
  "isActive": true
}
```

🔹 Why this exists:

- Attendance
- Marks
- Materials
- Discussions
- Assignments

ALL attach here.

---

## 🔹 `enrollments`

> Student ↔ courseInstance mapping

```ts
enrollments / { enrollmentId };
```

```json
{
  "studentId": "string",
  "courseInstanceId": "string",

  "type": "core | elective",
  "enrolledAt": "timestamp"
}
```

---

## 🔹 `calendarEvents`

```ts
calendarEvents / { eventId };
```

```json
{
  "title": "DBMS Lecture",
  "type": "class | exam | assignment | personal",

  "courseInstanceId": "string | null",

  "createdBy": "teacherId | adminId | studentId",

  "startTime": "timestamp",
  "endTime": "timestamp",

  "recurrenceRule": {
    "frequency": "weekly",
    "days": ["MON", "WED"],
    "until": "timestamp"
  },

  "isAttendanceEnabled": true,

  "createdAt": "timestamp"
}
```

---

## 🔹 `attendanceSessions`

> One per class occurrence

```ts
attendanceSessions / { sessionId };
```

```json
{
  "eventId": "string",
  "courseInstanceId": "string",

  "startedBy": "teacherId",
  "startedAt": "timestamp",
  "endedAt": "timestamp | null",

  "isLocked": false
}
```

---

## 🔹 `attendanceRecords`

```ts
attendanceRecords / { recordId };
```

```json
{
  "sessionId": "string",
  "studentId": "string",

  "status": "present | absent",
  "markedBy": "student | teacher",

  "markedAt": "timestamp"
}
```

---

## 🔹 `materials`

```ts
materials / { materialId };
```

```json
{
  "courseInstanceId": "string",

  "title": "Unit 3 Notes",
  "type": "pdf | link | video",

  "url": "string",

  "uploadedBy": "teacherId",
  "uploadedAt": "timestamp"
}
```

---

## 🔹 `assignments`

```ts
assignments / { assignmentId };
```

```json
{
  "courseInstanceId": "string",

  "title": "Assignment 1",
  "description": "ER Diagrams",

  "dueDate": "timestamp",

  "createdBy": "teacherId",
  "createdAt": "timestamp"
}
```

---

## 🔹 `submissions`

```ts
submissions / { submissionId };
```

```json
{
  "assignmentId": "string",
  "studentId": "string",

  "submissionUrl": "string",
  "submittedAt": "timestamp",

  "grade": 18,
  "feedback": "Good work"
}
```

---

## 🔹 `marks`

```ts
marks / { marksId };
```

```json
{
  "courseInstanceId": "string",
  "studentId": "string",

  "cie1": 18,
  "cie2": 20,
  "assignment": 17,
  "finalExam": 45,

  "total": 100,
  "grade": "A",

  "updatedBy": "teacherId | adminId",
  "updatedAt": "timestamp"
}
```

---

## 🔹 `discussions`

```ts
discussions / { threadId };
```

```json
{
  "courseInstanceId": "string",

  "createdBy": "studentId",
  "content": "Can someone explain normalization?",

  "createdAt": "timestamp"
}
```

---

## 🔹 `discussionReplies`

```ts
discussionReplies / { replyId };
```

```json
{
  "threadId": "string",

  "createdBy": "teacherId | studentId",
  "content": "Sure, here’s an example...",

  "createdAt": "timestamp"
}
```

---

## 🔹 `newsPosts`

```ts
newsPosts / { postId };
```

```json
{
  "title": "Mid-sem Exams",
  "content": "Exams start from Monday",

  "mediaUrls": ["string"],

  "postedBy": "teacherId | adminId",
  "isPinned": false,

  "createdAt": "timestamp"
}
```

---

# 3️⃣ Relationship Summary (Mental Model)

```
User → Enrollment → CourseInstance → Course
                      ↓
                 Attendance
                 Materials
                 Assignments
                 Discussions
                 Marks
```

---

# 4️⃣ Required Indexes (IMPORTANT)

Create composite indexes for:

- `courseInstances`
  - departmentId + semester + section

- `calendarEvents`
  - courseInstanceId + startTime

- `attendanceRecords`
  - sessionId + studentId

- `enrollments`
  - studentId + courseInstanceId

- `marks`
  - courseInstanceId + studentId

---

# 5️⃣ Why This Schema Works

✅ Easy to reason
✅ No duplication
✅ Fast queries
✅ Scales to 10k+ students
✅ AI-agent friendly
✅ Safe role enforcement

---

A **Floating Action Button (FAB) permission matrix** is exactly what keeps AITIAN **clean, safe, and intuitive** without cluttering the UI.

Below is a **clear, unambiguous FAB permission matrix** that your AI agent and future-you can both follow without confusion.

---

# AITIAN – FAB Permission Matrix

## 🎯 Design Principles for FAB

- **One FAB per screen max**
- FAB is **context-aware**
- FAB actions are **role-gated**
- FAB never exposes forbidden actions (not even disabled buttons)
- FAB opens a **bottom sheet / action menu**, not a new screen directly

---

# 1️⃣ Global Role Capability Summary

| Role    | FAB Visible               | Can Create           | Can Edit      | Can Delete    |
| ------- | ------------------------- | -------------------- | ------------- | ------------- |
| Student | ❌ (almost always hidden) | Personal events only | Personal only | Personal only |
| Teacher | ✅                        | Academic content     | Own content   | Own content   |
| Admin   | ✅                        | System-wide content  | Any           | Any           |
| Parent  | ❌                        | ❌                   | ❌            | ❌            |

---

# 2️⃣ Screen-wise FAB Permission Matrix

---

## 🏠 Home / Dashboard Tab

| Role    | FAB | Actions |
| ------- | --- | ------- |
| Student | ❌  | —       |
| Teacher | ❌  | —       |
| Admin   | ❌  | —       |
| Parent  | ❌  | —       |

Reason: Home is informational.

---

## 📅 Calendar Tab

| Role    | FAB | Actions                                        |
| ------- | --- | ---------------------------------------------- |
| Student | ✅  | ➕ Add personal event                          |
| Teacher | ✅  | ➕ Add class event (for owned courseInstances) |
| Admin   | ✅  | ➕ Add exam / global academic event            |
| Parent  | ❌  | —                                              |

### Action rules

- Students:
  - Cannot edit/delete class or exam events

- Teachers:
  - Can only modify events for their assigned courseInstances

- Admins:
  - Full control

---

## 📘 Academics Tab (Course List)

| Role    | FAB | Actions                           |
| ------- | --- | --------------------------------- |
| Student | ❌  | —                                 |
| Teacher | ❌  | —                                 |
| Admin   | ✅  | ➕ Create course / courseInstance |

---

## 📚 Course Detail Page

> FAB appears **only when relevant**

| Role    | FAB | Actions                  |
| ------- | --- | ------------------------ |
| Student | ❌  | —                        |
| Teacher | ✅  | Context menu (see below) |
| Admin   | ✅  | Full context menu        |
| Parent  | ❌  | —                        |

### Teacher FAB actions

- ➕ Upload material
- ➕ Create assignment
- 🕒 Start attendance session
- ✏️ Edit course timetable (only assigned courses)

### Admin FAB actions

- All teacher actions +
- ➕ Assign / remove teacher
- ➕ Modify course metadata
- ➕ Lock/unlock course

---

## 📝 Assignments Page

| Role    | FAB | Actions                       |
| ------- | --- | ----------------------------- |
| Student | ❌  | —                             |
| Teacher | ✅  | ➕ Create assignment          |
| Admin   | ✅  | ➕ Create / delete assignment |
| Parent  | ❌  | —                             |

---

## 📂 Materials Page

| Role    | FAB | Actions                     |
| ------- | --- | --------------------------- |
| Student | ❌  | —                           |
| Teacher | ✅  | ➕ Upload material          |
| Admin   | ✅  | ➕ Upload / delete material |
| Parent  | ❌  | —                           |

---

## 🧾 Attendance Page

| Role    | FAB | Actions                        |
| ------- | --- | ------------------------------ |
| Student | ❌  | —                              |
| Teacher | ✅  | 🟢 Start attendance            |
| Admin   | ✅  | 🟢 Start / override attendance |
| Parent  | ❌  | —                              |

---

## 📢 News / Feed Tab

| Role    | FAB | Actions              |
| ------- | --- | -------------------- |
| Student | ❌  | —                    |
| Teacher | ✅  | ➕ Create post       |
| Admin   | ✅  | ➕ Create / pin post |
| Parent  | ❌  | —                    |

---

## 💬 Discussion Forum

| Role    | FAB | Actions              |
| ------- | --- | -------------------- |
| Student | ✅  | ➕ Create discussion |
| Teacher | ❌  | —                    |
| Admin   | ❌  | —                    |
| Parent  | ❌  | —                    |

> Replies are inline, no FAB needed

---

## 👤 Profile Tab

| Role    | FAB | Actions |
| ------- | --- | ------- |
| Student | ❌  | —       |
| Teacher | ❌  | —       |
| Admin   | ❌  | —       |
| Parent  | ❌  | —       |

---

## 🛠️ Admin Screens (Separate Folder)

| Screen            | FAB |
| ----------------- | --- |
| Admin Dashboard   | ✅  |
| User Management   | ✅  |
| Course Management | ✅  |
| System Settings   | ✅  |

Admin FAB is **always visible** inside admin screens.

---

# 3️⃣ FAB Visibility Logic (Exact Rule)

```ts
showFAB = permissions[role][screen].length > 0;
```

If no valid actions → FAB does not render.

---

# 4️⃣ FAB UX Behavior (Strict Rules)

- FAB icon: `+` (default)
- Long press: ❌ (disabled)
- Tap → Bottom sheet with:
  - Icon
  - Label
  - Short description

- FAB auto-hides on scroll down

---

# 5️⃣ Security Reminder (Critical)

⚠️ FAB visibility is **UX only**

All actions must still be validated by:

- Firestore Security Rules
- Cloud Functions (where needed)

---

# 6️⃣ Why This Matrix Works

- No clutter
- No confusion
- No accidental misuse
- Clear mental model
- Easy to implement
- Easy to audit

---
