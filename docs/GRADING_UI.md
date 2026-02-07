# Teacher Grading UI - Feature Summary

## Overview
A comprehensive grading interface for teachers to view submissions, input grades, and provide feedback for assignments.

## Features Implemented

### 1. Assignment Grading Screen (`app/(tabs)/academics/[courseInstanceId]/assignments/[assignmentId]/grading.tsx`)

**Statistics Dashboard:**
- Total submissions count vs enrolled students
- Graded vs ungraded count
- Average grade calculation
- Progress bars for submission and grading completion

**Student Submission List:**
- Search by student name, email, or roll number
- Filter by status: All, Graded, Ungraded
- Student information cards with:
  - Name and email
  - Roll number (if available)
  - Submission timestamp
  - Submission type (file, URL, or text)
  - Current grade status
  - Feedback preview

**Grading Modal:**
- Grade input with validation (0 to max score)
- Feedback text area
- Save/update grade functionality
- Cancel option

### 2. Assignment Card Enhancement (`components/academics/AssignmentCard.tsx`)

**New Grade Button:**
- Black chart icon button for teachers/admins
- Visible only to teachers and admins
- Navigates to grading screen
- Positioned next to delete button

**Updated Props:**
```typescript
interface AssignmentCardProps {
  assignment: AssignmentWithStatus;
  role: "student" | "teacher" | "parent" | "admin";
  onPress: (assignment: AssignmentWithStatus) => void;
  onDelete?: (assignmentId: string) => void;
  onGrade?: (assignmentId: string) => void;  // NEW
  courseInstanceId: string;  // NEW
}
```

### 3. Custom Hook (`lib/hooks/useAssignmentGrading.ts`)

**Features:**
- Fetches assignment with all submissions
- Enriches submissions with student details (name, email, roll number)
- Calculates statistics (total, submitted, graded, average)
- Single submission grading
- Bulk grading support (for future use)
- Real-time state updates after grading

**Types:**
```typescript
interface SubmissionWithStudent extends Submission {
  studentName: string;
  studentEmail: string;
  studentRollNumber?: string;
}

interface AssignmentWithSubmissions extends Assignment {
  submissions: SubmissionWithStudent[];
  totalStudents: number;
  submittedCount: number;
  gradedCount: number;
  averageGrade?: number;
}
```

### 4. Integration with Push Notifications

The grading screen automatically sends push notifications to students when their assignment is graded using the `notifyAssignmentGraded` function.

## User Flow

1. **Teacher View:**
   - Navigate to Assignments tab
   - See list of all assignments
   - Click "Grade" button (chart icon) on any assignment
   - View grading dashboard with statistics
   - Search/filter submissions
   - Click "Grade Submission" button
   - Enter grade and feedback
   - Save (student receives push notification)

2. **Student View:**
   - Submit assignment
   - Receive notification when graded
   - View grade and feedback in assignment details

## UI/UX Design

**Color Scheme:**
- Black & white theme consistent with app design
- Green for graded status (#10B981)
- Orange for ungraded status (#F59E0B)
- Red for overdue (#EF4444)

**Statistics Cards:**
- Black card for submission count
- Gray card for graded count
- Light gray card for average

**Submission Cards:**
- White background with subtle shadow
- Student info at top
- Submission details in middle
- Grade button at bottom
- Color-coded status badges

**Modal Design:**
- Bottom sheet style modal
- Clean input fields
- Clear CTA buttons
- Loading states

## Technical Implementation

**Route Structure:**
```
/(tabs)/academics/[courseInstanceId]/assignments/[assignmentId]/grading
```

**Data Flow:**
1. AssignmentCard → onGrade callback
2. Navigation to grading screen
3. useAssignmentGrading hook fetches data
4. User inputs grade → gradeSubmission function
5. Firestore update → Local state refresh
6. Push notification sent to student

**Firestore Queries:**
- Get assignment details
- Get course instance for enrolled students
- Get all submissions for assignment
- Get student details for each submission
- Update submission with grade/feedback

## Security & Permissions

**Access Control:**
- Only teachers and admins can access grading screen
- Students see "Access Denied" if they try to navigate
- Role check in hook and component

**Validation:**
- Grade must be numeric
- Grade must be between 0 and max score
- Feedback is optional

## Future Enhancements

### Bulk Grading
- Select multiple submissions
- Apply same grade/feedback to all
- CSV export of grades

### Advanced Features
- Rubric-based grading
- Audio/video feedback
- Anonymous grading mode
- Grade history/audit log
- Late submission penalties

### Analytics
- Grade distribution chart
- Submission time analysis
- Class performance metrics
- Export to PDF/Excel

## Testing Checklist

- [ ] Grade button appears only for teachers/admins
- [ ] Clicking grade button navigates to grading screen
- [ ] Statistics display correctly
- [ ] Search filters submissions by student name
- [ ] Filter chips work (All/Graded/Ungraded)
- [ ] Grade input validates correctly
- [ ] Grade saves to Firestore
- [ ] Push notification sent after grading
- [ ] Student sees updated grade in assignment details
- [ ] Feedback displays correctly for student
- [ ] Error handling works for invalid inputs
- [ ] Loading states display correctly
- [ ] Empty states display when no submissions

## Files Modified/Created

### New Files:
- `app/(tabs)/academics/[courseInstanceId]/assignments/[assignmentId]/grading.tsx`
- `lib/hooks/useAssignmentGrading.ts`
- `docs/GRADING_UI.md` (this file)

### Modified Files:
- `components/academics/AssignmentCard.tsx` - Added grade button and courseInstanceId prop
- `app/(tabs)/academics/[courseInstanceId]/assignments.tsx` - Added onGrade handler

## Dependencies

No new dependencies required. Uses existing:
- expo-router for navigation
- lucide-react-native for icons
- firebase/firestore for data
- Gluestack UI components

## Performance Considerations

- Submissions fetched in single query
- Student details fetched in parallel
- Local state updates immediately after grading
- No real-time listener (refresh button available)
- Pagination not implemented (assumes manageable class sizes)

## Accessibility

- Touch targets minimum 44x44 points
- Clear labels and feedback
- Color contrast meets WCAG guidelines
- Screen reader friendly text
