# Authentication Implementation Guide

## Overview

AITIAN uses Firebase Authentication with Firestore for user management. The authentication system is role-based, supporting four user types: **Student**, **Teacher**, **Parent**, and **Admin**.

## Architecture

### Core Components

1. **AuthContext** (`/lib/AuthContext.tsx`)
   - Provides global auth state
   - Listens to Firebase auth changes
   - Syncs user data from Firestore
   - Exports `useAuth()` hook

2. **ProtectedRoute** (`/components/ProtectedRoute.tsx`)
   - Wraps protected screens (tabs)
   - Validates authentication & email verification
   - Redirects based on role and auth state

3. **AdminRoute** (`/components/AdminRoute.tsx`)
   - Wraps admin-only screens
   - Ensures only admins can access admin area
   - Redirects unauthorized users

4. **Root Index** (`/app/index.tsx`)
   - Entry point for all navigation
   - Smart router that checks auth state
   - Prevents redirect loops using `useSegments()`

## Authentication Flow

```
App Launch (index.tsx)
    ↓
Check Auth State (AuthContext)
    ↓
┌───────────────┐
│ Authenticated?│
└───┬───────┬───┘
    NO     YES
    ↓       ↓
  Login  Email Verified?
         ┌──┴──┐
        NO    YES
         ↓     ↓
      Verify  Role?
           ┌───┴────┐
         Admin   Regular
           ↓        ↓
        /admin  /(tabs)
```

## User Roles

### Student
- **Email Pattern**: `1da22cs040.cs@drait.edu.in`
- **Access**: Full tabs access (home, calendar, academics, news, profile)
- **Permissions**: View-only for most content, can manage personal events

### Teacher
- **Email Pattern**: `harishd.cs@drait.edu.in`
- **Access**: Full tabs access + FAB (Floating Action Button)
- **Permissions**: Can create/edit content for assigned courses

### Parent
- **Email**: Any valid email (not restricted to org domain)
- **Access**: Limited tabs access after linking to student
- **Permissions**: Read-only access to linked student's data
- **Special**: Must be approved by student before gaining access

### Admin
- **Email**: Any valid email
- **Access**: Separate admin dashboard (`/admin`)
- **Permissions**: Full system control
- **Special**: Requires admin secret code during registration

## Route Structure

### Public Routes (`/(auth)`)
- `/login` - Main login screen
- `/register` - Role selection
- `/register-student` - Student registration
- `/register-teacher` - Teacher registration
- `/register-parent` - Parent registration
- `/register-admin` - Admin registration (requires secret)
- `/verify-email` - Email verification prompt
- `/forgot-password` - Password reset
- `/parent-link` - Parent-student linking management
- `/unauthorized` - Access denied page

### Protected Routes (`/(tabs)`)
**Wrapper**: `ProtectedRoute`
- `/home` - Dashboard (Tab 1)
- `/calendar` - Schedule & Events (Tab 2)
- `/academics` - Courses & Materials (Tab 3)
- `/news` - Announcements (Tab 4)
- `/profile` - User Profile (Tab 5)

### Admin Routes (`/admin`)
**Wrapper**: `AdminRoute`
- `/dashboard` - Admin control panel
- Additional admin screens as needed

## Using Auth in Components

### Basic Usage

```typescript
import { useAuth } from '@/lib/AuthContext';

function MyComponent() {
  const { user, userData, role, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <View>
      <Text>Welcome, {userData?.name}!</Text>
      <Text>Role: {role}</Text>
    </View>
  );
}
```

### Role-Based Rendering

```typescript
import { useAuth } from '@/lib/AuthContext';

function CourseScreen() {
  const { role } = useAuth();

  return (
    <View>
      {/* All roles can view */}
      <CourseContent />

      {/* Only teachers and admins can edit */}
      {(role === 'teacher' || role === 'admin') && (
        <EditButton />
      )}

      {/* Only admins can delete */}
      {role === 'admin' && (
        <DeleteButton />
      )}
    </View>
  );
}
```

### Logout

```typescript
import { useAuth } from '@/lib/AuthContext';

function ProfileScreen() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // User will be automatically redirected to login
  };

  return (
    <Button onPress={handleLogout}>
      <Text>Logout</Text>
    </Button>
  );
}
```

## Parent-Student Linking

### Process

1. **Parent** searches for student by USN
2. **Parent** sends link request
3. **Student** receives notification
4. **Student** approves/rejects request
5. If approved, **Parent** gains read-only access to student data

### Database Structure

```typescript
// Collection: parentLinks
{
  parentId: string;
  parentName: string;
  parentEmail: string;
  studentId: string;
  studentName: string;
  studentUSN: string;
  studentDepartment: string;
  studentSemester: number;
  status: 'pending' | 'approved';
  requestedAt: Timestamp;
  approvedAt: Timestamp | null;
}
```

### Limits
- Maximum 5 students per parent
- Student can revoke access anytime
- Parent access is always read-only

## Email Verification

All users MUST verify their email before accessing the app.

### Flow
1. User registers
2. Firebase sends verification email
3. User clicks link in email
4. On next app open, verification status is checked
5. If verified, user gains full access

### Implementation

```typescript
// Already handled in ProtectedRoute and AdminRoute
if (!user.emailVerified) {
  return <Redirect href="/(auth)/verify-email" />;
}
```

## Security Best Practices

### 1. Never Store Sensitive Data in Client
```typescript
// ❌ BAD
const API_KEY = "sk-1234567890abcdef";

// ✅ GOOD
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;
```

### 2. Validate User Role on Backend
```typescript
// Client-side checks are for UX only
// Always validate on backend/Firestore rules

// Firestore Security Rules Example:
match /courses/{courseId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['teacher', 'admin'];
}
```

### 3. Email Verification Required
```typescript
// Already enforced in route guards
// Don't allow unverified users to access protected content
```

### 4. Admin Secret Protection
```typescript
// Store admin secret in Firestore config collection
// Hash it in production
// Never hardcode in client code
```

## Troubleshooting

### Issue: Redirect Loop
**Cause**: Auth state checking in multiple places
**Solution**: Use `useSegments()` to check current route before redirecting

```typescript
const segments = useSegments();
const inAuthGroup = segments[0] === '(auth)';

if (!user && !inAuthGroup) {
  router.replace('/(auth)/login');
}
```

### Issue: User Logged Out After Refresh
**Cause**: Firebase persistence not configured
**Solution**: Already handled by Firebase SDK (enabled by default)

### Issue: Parent Can't Access Content
**Cause**: Parent hasn't linked to student yet
**Solution**: Check for `linkedStudentId` in userData

```typescript
if (role === 'parent' && !userData?.linkedStudentId) {
  return <LinkStudentPrompt />;
}
```

### Issue: Admin Can Access Regular Tabs
**Cause**: ProtectedRoute not checking for admin role
**Solution**: Already implemented - admins are redirected to `/admin`

```typescript
if (role === 'admin') {
  return <Redirect href="/admin" />;
}
```

## Testing Checklist

- [ ] Student can register with org email
- [ ] Teacher can register with org email
- [ ] Parent can register with any email
- [ ] Admin can register with secret code
- [ ] Email verification enforced for all roles
- [ ] Student redirects to tabs after login
- [ ] Teacher redirects to tabs after login
- [ ] Parent redirects to tabs after login
- [ ] Admin redirects to admin dashboard after login
- [ ] Parent can link to student
- [ ] Student can approve/reject parent request
- [ ] Parent sees limited content before linking
- [ ] Admin cannot access regular tabs
- [ ] Regular users cannot access admin area
- [ ] Logout redirects to login
- [ ] No redirect loops occur
- [ ] Auth state persists after app reload

## Additional Resources

- Firebase Auth Docs: https://firebase.google.com/docs/auth
- Expo Router Docs: https://docs.expo.dev/router/introduction/
- Firestore Security Rules: https://firebase.google.com/docs/firestore/security/get-started

## File Reference

```
Authentication System Files:
├── lib/
│   ├── AuthContext.tsx          [Global auth state]
│   ├── authUtils.ts             [Helper functions]
│   └── firebase.ts              [Firebase config]
├── components/
│   ├── ProtectedRoute.tsx       [Tab route guard]
│   └── AdminRoute.tsx           [Admin route guard]
├── app/
│   ├── _layout.tsx              [Root with AuthProvider]
│   ├── index.tsx                [Smart router]
│   ├── (auth)/                  [Public routes]
│   ├── (tabs)/                  [Protected routes]
│   └── admin/                   [Admin routes]
└── hooks/
    └── useAuth.ts               [Deprecated - use AuthContext]
```

---

**Last Updated**: 2024
**Version**: 1.0
**Maintainer**: AITIAN Development Team