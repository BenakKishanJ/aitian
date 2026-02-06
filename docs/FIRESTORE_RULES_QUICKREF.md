# Firestore Security Rules - Quick Reference

## Deploy Commands

```bash
# Login to Firebase (first time only)
npm run firebase:login

# Deploy security rules to production
npm run firebase:deploy:rules

# Start local emulator for testing
npm run firebase:emulators
```

## Rule Structure

### Collections Protected

1. **users** - User profiles and role data
2. **departments** - Department definitions
3. **courses** - Base course catalog
4. **courseInstances** - Active course offerings
5. **enrollments** - Student-course relationships
6. **calendarEvents** - Calendar entries
7. **materials** - Course materials
8. **assignments** - Course assignments
9. **submissions** - Student submissions
10. **marks** - Grade records
11. **discussions** - Discussion threads
12. **discussionReplies** - Thread replies
13. **newsPosts** - Announcements
14. **parentLinks** - Parent-student connections
15. **attendanceSessions** - Attendance recording sessions
16. **attendanceRecords** - Individual attendance entries
17. **config** - System configuration

## Common Patterns

### Read Access Patterns

```javascript
// Own data only
allow read: if request.auth.uid == resource.data.userId;

// Role-based
allow read: if getUserData().role == 'admin';

// Course-based (enrolled students)
allow read: if exists(/databases/$(database)/documents/enrollments/$(request.auth.uid + '_' + courseInstanceId));

// Parent access to linked student
allow read: if isParent() && getUserData().linkedStudentId == resource.data.studentId;
```

### Write Access Patterns

```javascript
// Self-modification only
allow update: if request.auth.uid == resource.data.userId;

// Field-restricted updates
allow update: if request.resource.data.diff(resource.data).affectedKeys()
  .hasOnly(['name', 'photoURL', 'updatedAt']);

// Role + ownership
allow update: if isTeacher() && resource.data.createdBy == request.auth.uid;
```

## Helper Functions

### Authentication
- `isAuthenticated()` - User is logged in
- `isUser(userId)` - Is the specific user
- `getUserData()` - Get user's Firestore document

### Role Checks
- `isRole(role)` - Has specific role
- `isStudent()` - Is student
- `isTeacher()` - Is teacher  
- `isParent()` - Is parent
- `isAdmin()` - Is admin
- `isTeacherOrAdmin()` - Is teacher OR admin

### Course Access
- `isEnrolledInCourse(courseInstanceId)` - Student is enrolled
- `isTeachingCourse(courseInstanceId)` - Teacher teaches course
- `isSameDepartment(departmentId)` - User in same department

### Family Links
- `isLinkedToStudent(studentId)` - Parent linked to student

## Validation Examples

### Required Fields
```javascript
allow create: if request.resource.data.keys().hasAll(['field1', 'field2']);
```

### Enum Validation
```javascript
allow create: if request.resource.data.role in ['student', 'teacher', 'parent', 'admin'];
```

### Timestamp Validation
```javascript
allow create: if request.time == request.resource.data.createdAt;
```

### String Length
```javascript
allow create: if request.resource.data.name.size() >= 2 && 
               request.resource.data.name.size() <= 100;
```

## Security Checklist

Before deploying rules, verify:

- [ ] Users can only modify their own data (unless admin)
- [ ] Students can't see other students' submissions
- [ ] Parents can only see their linked student's data
- [ ] Teachers can only modify their own courses/materials/assignments
- [ ] Required fields are validated on create
- [ ] Enum values are validated
- [ ] No unrestricted wildcards (`allow read, write: if true`)
- [ ] All collections have rules
- [ ] Rules are tested with emulator

## Troubleshooting

### "Missing or insufficient permissions"

**Causes:**
1. User not logged in
2. User lacks required role
3. Missing required fields
4. Trying to access unauthorized document

**Debug Steps:**
1. Check auth state in app
2. Verify user role in Firestore console
3. Check request data matches rule requirements
4. Review console error logs

### Testing Rules

Use Firebase Console > Firestore Database > Rules Playground:

1. Select collection
2. Choose simulation type (read/write)
3. Enter document path
4. Add request data
5. Click "Run"
6. Check if allowed/denied

## Best Practices

1. **Fail Closed**: Default is deny - explicitly allow operations
2. **Validate Everything**: Check all inputs, even from authenticated users
3. **Minimize Wildcards**: Be specific about document paths
4. **Test Thoroughly**: Use emulator before deploying
5. **Monitor Logs**: Watch for denied requests after deployment
6. **Document Changes**: Keep this file updated when modifying rules

## Updates & Maintenance

When modifying rules:

1. Test locally first with emulator
2. Update this documentation
3. Deploy to staging (if available)
4. Deploy to production
5. Monitor for 24-48 hours for issues
6. Rollback if problems detected

## Resources

- [Firebase Security Rules Docs](https://firebase.google.com/docs/firestore/security/overview)
- [Rules Language Reference](https://firebase.google.com/docs/reference/rules/rules)
- [Testing Rules](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
