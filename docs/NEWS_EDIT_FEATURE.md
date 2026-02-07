# News Post Edit Feature - Implementation Summary

## Overview
Successfully implemented an edit feature for news/announcement posts for admins and authorized users.

## Features Implemented

### 1. useNews Hook (`lib/hooks/useNews.ts`)

**Features:**
- Fetch all news posts from Firestore
- Real-time updates via onSnapshot listener
- `updatePost()` function to update post content
- `togglePin()` function to pin/unpin posts
- `refresh()` function to manually reload posts
- Loading and error states

**Permissions:**
- Only teachers and admins can update posts
- Validation ensures proper authorization

### 2. Edit News Modal (`components/news/EditNewsModal.tsx`)

**Features:**
- Slide-up modal with pre-filled post data
- Edit title (optional, max 100 characters)
- Edit content (required, min 10 characters)
- Toggle pin status with switch
- Shows current target audience (read-only)
- Edit notice explaining:
  - Changes save immediately
  - Author/timestamp preserved
  - Target audience cannot be changed
- Form validation
- Loading states
- Success/error alerts

**UI:**
- Purple-themed edit notice
- Black primary button for update
- Cancel button to close without saving
- Character counter for title
- Target audience display showing who can see the post

### 3. Admin News Screen Updates (`app/admin/(tabs)/news.tsx`)

**Changes:**
- Imported `EditNewsModal` component
- Imported `useNews` hook
- Added state for edit modal:
  - `showEditModal`: controls modal visibility
  - `editingPost`: stores post being edited
- Added `handleEdit()` function to open edit modal
- Updated Alert dialog to call `handleEdit()`
- Added inline Edit and Delete buttons in post footer:
  - Edit button: Gray background with edit icon
  - Delete button: Red background with trash icon
  - Both show text labels for clarity
- Added `EditNewsModal` component at end of screen

**UI Improvements:**
- Edit and Delete buttons now visible directly on each post card
- No need to tap "More" menu for common actions
- Maintains existing "More" menu as alternative access

## User Flow

### Admin/Teacher Editing:
1. Navigate to Admin → News tab
2. See list of all news posts
3. Tap "Edit" button on any post (or use More menu → Edit)
4. Modal opens with current title, content, and pin status
5. Make desired changes
6. Toggle pin switch if needed
7. Tap "Update Post"
8. Changes saved, modal closes, list refreshes

### Permissions

| Role | Own Posts | Other Teachers | Other Admins |
|------|-----------|----------------|--------------|
| Admin | ✓ Full Edit | ✓ Full Edit | ✓ Full Edit |
| Teacher | ✓ Full Edit | ✗ Can Only Pin | ✗ Can Only Pin |

## Firestore Security Rules

The existing rules already support editing:

```
match /newsPosts/{postId} {
  // Author can update their own post
  // Admins can update any (including pinning)
  allow update: if isTeacherOrAdmin() &&
    (isAdmin() || 
     resource.data.postedBy == request.auth.uid ||
     request.resource.data.diff(resource.data).affectedKeys().hasOnly(['isPinned']));
}
```

**Rule Breakdown:**
- `isAdmin()`: Admin can update any field of any post
- `resource.data.postedBy == request.auth.uid`: Author can update their own post
- `hasOnly(['isPinned'])`: Non-author teachers can only toggle pin status

## Files Created/Modified

### New Files:
- `lib/hooks/useNews.ts` - News data management hook
- `components/news/EditNewsModal.tsx` - Edit post modal component

### Modified Files:
- `app/admin/(tabs)/news.tsx` - Integrated edit modal and added action buttons

## Technical Details

### Data Flow:
1. User taps Edit button on a post
2. `handleEdit(post)` sets `editingPost` and opens modal
3. `EditNewsModal` receives post data via props
4. User makes edits and taps Update
5. `updatePost()` hook function called with post ID and new data
6. Firestore document updated
7. Success alert shown, modal closes
8. `onPostUpdated` callback triggers `fetchPosts()`
9. Posts list reloads with updated data

### State Management:
- Uses `useNews` hook for data operations
- Local state in `EditNewsModal` for form fields
- Admin screen manages modal visibility and selected post
- Real-time sync via Firestore onSnapshot

### Validation:
- Title: Optional, but if provided must be ≥3 characters
- Content: Required, must be ≥10 characters
- At least one of title or content must be provided
- Only teachers and admins can update

## UI/UX Design

**Color Scheme:**
- Edit notice: Purple theme (#F3E8FF background)
- Edit button: Gray (#F3F4F6)
- Delete button: Light red (#FEE2E2)
- Primary action: Black (#000000)

**Button Placement:**
- Edit and Delete buttons in post footer
- Positioned next to audience badge
- Clear text labels with icons

**Modal Design:**
- Bottom sheet style
- Pre-filled with current data
- Toggle switch for pin status
- Read-only audience info
- Clear CTA buttons

## Testing Checklist

- [ ] Edit button appears on all posts for admin
- [ ] Edit button appears on own posts for teachers
- [ ] Edit button hidden for students
- [ ] Modal opens with correct pre-filled data
- [ ] Title validation works (min 3 chars if provided)
- [ ] Content validation works (min 10 chars)
- [ ] Pin toggle works correctly
- [ ] Update button disabled when form invalid
- [ ] Loading state shows during update
- [ ] Success alert shows after update
- [ ] Modal closes after successful update
- [ ] Posts list refreshes after update
- [ ] Changes persist after refresh
- [ ] Target audience shows correctly (read-only)
- [ ] Firestore rules prevent unauthorized edits
- [ ] Delete button works correctly

## Future Enhancements

1. **Rich Text Editor**: Support formatting in post content
2. **Image Management**: Add/remove images when editing
3. **Edit History**: Track who edited and when
4. **Scheduled Posts**: Edit posts before they're published
5. **Draft Mode**: Save edits as drafts
6. **Preview Mode**: Preview changes before saving

## Dependencies

No new dependencies required. Uses existing:
- lucide-react-native (icons)
- @/components/ui/* (UI components)
- @/lib/hooks/useNews (new hook)
- @/types (TypeScript types)

## Accessibility

- Touch targets minimum 44x44 points
- Clear button labels and icons
- Error messages for validation
- Loading indicators for async operations
- Keyboard accessible form fields
- Switch component for pin toggle

## Performance

- Modal only renders when visible
- Real-time updates via Firestore onSnapshot
- Efficient Firestore updates (only changed fields)
- Minimal re-renders with proper state management
