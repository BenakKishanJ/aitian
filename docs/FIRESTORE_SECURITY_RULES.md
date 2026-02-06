# Firestore Security Rules

This directory contains the security rules for the AITIAN Firestore database.

## File Structure

- `firestore.rules` - Production security rules
- `firestore.rules.test.js` - Unit tests for security rules (optional)

## Deployment

### Using Firebase CLI

1. Install Firebase CLI (if not already installed):
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase project (if not already done):
```bash
firebase init firestore
```

4. Deploy rules:
```bash
firebase deploy --only firestore:rules
```

Or from the project root:
```bash
npx firebase deploy --only firestore:rules
```

### Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database > Rules
4. Copy the contents of `firestore.rules`
5. Click "Publish"

## Security Rules Overview

### Role-Based Access Control

The security rules implement strict role-based access control:

- **Students**: Can read course data they're enrolled in, submit assignments, view their marks/attendance
- **Teachers**: Can manage their courses, create assignments/materials, grade submissions, mark attendance
- **Parents**: Read-only access to their linked student's data
- **Admins**: Full CRUD access to all collections

### Collection-Level Security

| Collection | Create | Read | Update | Delete |
|------------|--------|------|--------|--------|
| users | Self only | Self + Linked + Admin | Self (limited) + Admin | Admin only |
| departments | Admin only | All authenticated | Admin only | Admin only |
| courses | Teachers + Admin | All authenticated | Creator + Admin | Admin only |
| courseInstances | Teachers + Admin | Enrolled + Teaching + Admin | Creator + Admin | Admin only |
| enrollments | Self + Teachers + Admin | Self + Teaching + Admin | Teachers + Admin | Teachers + Admin |
| calendarEvents | Teachers + Admin | All authenticated | Creator + Admin | Creator + Admin |
| materials | Teachers + Admin | Enrolled + Teaching | Creator + Admin | Creator + Admin |
| assignments | Teachers + Admin | Enrolled + Teaching | Creator + Admin | Creator + Admin |
| submissions | Self only | Self + Teaching + Admin | Teachers (grade only) | Self (if not graded) |
| marks | Teachers + Admin | Self + Teaching + Admin | Teachers + Admin | Admin only |
| discussions | Enrolled users | Enrolled + Teaching | Creator + Teachers | Creator + Teachers + Admin |
| discussionReplies | Enrolled users | All | Creator | Creator + Teachers |
| newsPosts | Teachers + Admin | All authenticated | Creator + Admin | Creator + Admin |
| parentLinks | Self | Self + Admin | Student (approve) + Admin | Admin only |
| attendanceSessions | Teachers + Admin | Enrolled + Teaching | Creator + Admin | Creator + Admin |
| attendanceRecords | Self + Teachers | Self + Teaching + Admin | Teachers + Admin | Teachers + Admin |
| config | Admin only | Admin only | Admin only | Admin only |

### Data Validation

All rules include validation for:
- Required fields presence
- Field type checking
- Enum value validation (e.g., role must be in ['student', 'teacher', 'parent', 'admin'])
- Relationship validation (e.g., submissions must reference valid assignments)

### Important Security Features

1. **User Isolation**: Users can only modify their own data
2. **Course-Based Access**: Content is protected based on enrollment/teaching relationships
3. **Role Validation**: All role assignments are validated against allowed values
4. **Immutable Fields**: Certain fields cannot be modified after creation (e.g., submission studentId)
5. **Soft Deletes**: Some collections use `isActive` flags instead of hard deletes

## Testing

### Local Testing with Emulator

1. Start Firebase emulator:
```bash
firebase emulators:start --only firestore
```

2. Run tests:
```bash
npm test
```

### Production Testing

Always test rules in a staging environment before deploying to production:

1. Deploy to staging project
2. Test each user role
3. Verify unauthorized access is blocked
4. Check data validation

## Common Issues

### "Missing or insufficient permissions"

This error occurs when:
- User is not authenticated
- User doesn't have required role
- User is trying to access data they don't have permission for
- Required fields are missing in the request

### "Property not found" errors

Make sure your app sends all required fields when creating documents. Check the field lists in the rules.

## Updating Rules

When adding new features:

1. Update the rules to allow the new operations
2. Test thoroughly with emulator
3. Deploy to staging first
4. Deploy to production
5. Monitor for permission errors in Firebase Console

## Security Best Practices Followed

✅ Principle of least privilege - Users only get necessary permissions
✅ Data validation - All writes are validated for correct data structure
✅ Relationship verification - Cross-collection relationships are verified
✅ No client-side security - All security logic is server-side in rules
✅ Audit trail - Created/updated timestamps and user tracking
✅ Role-based access - Strict role enforcement throughout

## Support

For security-related issues or questions:
- Check Firebase documentation: https://firebase.google.com/docs/firestore/security/overview
- Review this project's README.md
- Open an issue in the project repository
