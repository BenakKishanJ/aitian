# News/Feed Page Implementation

## Overview
The News/Feed page has been successfully implemented with a clean black and white design using Gluestack UI components. It provides a comprehensive news feed system with role-based permissions, targeted audience posting, and anonymous posting capabilities.

## Features Implemented

### 1. **News Feed Display**
- Clean, card-based layout for posts
- Pull-to-refresh functionality
- Infinite scroll capability (ready for pagination)
- Pinned posts always appear at the top
- Empty state when no posts available

### 2. **Post Card Components**
Each post card displays:
- **Pinned Badge** - Black banner at top for pinned posts
- **Author Section**:
  - Avatar with initials (or "Anonymous" icon)
  - Author name or "Anonymous"
  - Role badge (Teacher/Admin)
  - Relative timestamp ("2h ago", "3d ago", etc.)
- **Target Audience Badge** - Shows who can see the post
- **Title** - Bold, prominent text
- **Content** - Main post content (expandable in future)
- **Media Gallery** - Images displayed inline (single or multiple)

### 3. **Post Filtering**
- **Pin Filter** - Toggle to show only pinned posts
- **Audience-based filtering**:
  - Students see: Their department/semester posts + general posts
  - Teachers see: Their department posts + general posts
  - Parents see: All posts (can be refined to show linked students' departments)
  - Admins see: All posts

### 4. **Create Post Feature**
Full-screen post creation form with:

#### Form Fields
- **Title** (Optional, max 100 characters)
- **Content** (Required, 10-1000 characters)
- **Media Upload** (Placeholder for future implementation)
- **Target Audience** selector:
  - Everyone
  - Specific Department
  - Specific Semester
  - Specific Department & Semester
- **Anonymous Toggle** - Hide author name
- **Pin Post Toggle** (Admin only)
- **Live Preview** - See how post will appear

#### Validation
- At least title or content required
- Character limits enforced
- Audience selection validation
- Real-time character counters

### 5. **Role-Based Permissions**

#### Viewing Posts
| Role | Can View |
|------|----------|
| Student | Department/Semester specific + General posts |
| Teacher | Department specific + General posts |
| Parent | All posts (or linked students' departments) |
| Admin | All posts |

#### Creating Posts
| Role | Can Create | Can Pin | Can Post Anonymously |
|------|------------|---------|----------------------|
| Student | ❌ | ❌ | ❌ |
| Teacher | ✅ | ❌ | ✅ |
| Parent | ❌ | ❌ | ❌ |
| Admin | ✅ | ✅ | ✅ |

### 6. **FAB (Floating Action Button)**
- Only visible for Teachers and Admins
- Black circular button with plus icon
- Bottom-right corner placement
- Opens Create Post screen

## Data Structure

### Enhanced `newsPosts` Schema

```typescript
{
  id: string;
  title: string;                    // Optional, max 100 chars
  content: string;                  // Required, 10-1000 chars
  mediaUrls: string[];              // Array of image/video URLs
  postedBy: string;                 // User ID (teacher/admin)
  authorName: string;               // Cached for performance
  authorRole: "teacher" | "admin";  // Cached for performance
  isAnonymous: boolean;             // Hide author name if true
  isPinned: boolean;                // Pin to top (admin only)
  targetAudience: {
    type: "all" | "department" | "semester" | "departmentSemester";
    department?: string;            // Optional: specific dept
    semester?: number;              // Optional: specific semester
  };
  createdAt: Timestamp;             // Post creation time
}
```

## Design Choices

### Color Scheme
- **Black header** with white text
- **White post cards** on gray background
- **Black buttons** for primary actions
- **Gray borders** and dividers
- **Badge colors**: Gray for info, Black for pinned

### Layout Structure
- FlatList for efficient rendering
- Card-based design with proper spacing
- Responsive image gallery
- Clean typography hierarchy

### UX Patterns
- Pull-to-refresh for updating feed
- Relative timestamps (human-readable)
- Empty states with helpful messages
- Loading indicators
- Confirmation before posting

## Data Flow

### Feed Loading
1. Query `newsPosts` collection (ordered by `createdAt` desc)
2. Fetch up to 50 posts initially
3. Filter posts based on user's role and department/semester
4. Sort: Pinned posts first, then by date
5. Apply additional filters (pinned-only toggle)
6. Render in FlatList

### Post Creation Flow
1. User clicks FAB (teachers/admins only)
2. Navigate to Create Post screen
3. Fill form with title, content, audience
4. Toggle anonymous/pin options
5. Preview post in real-time
6. Validate form inputs
7. Submit to Firestore with `serverTimestamp()`
8. Show success message
9. Navigate back to feed
10. Feed auto-refreshes

### Filtering Logic

```typescript
// Student sees:
- targetAudience.type === "all"
- targetAudience.type === "department" AND department matches
- targetAudience.type === "semester" AND semester matches
- targetAudience.type === "departmentSemester" AND both match

// Teacher sees:
- targetAudience.type === "all"
- targetAudience.type === "department" AND department matches
- targetAudience.type === "departmentSemester" AND department matches

// Admin sees:
- ALL posts (no filtering)

// Parent sees:
- ALL posts (can be refined to linked students' departments)
```

## Components Structure

### Main Components
1. **`NewsScreen`** (`app/(tabs)/news.tsx`)
   - Main feed container
   - Header with filters
   - FlatList of posts
   - FAB for creating posts

2. **`CreatePostScreen`** (`app/create-post.tsx`)
   - Full-screen form
   - Input fields
   - Audience selectors
   - Preview section

### Component Breakdown

```
NewsScreen
├── Header (Black)
│   ├── Title
│   └── Filter Toggle (Pin)
├── FlatList
│   └── PostCard (repeated)
│       ├── Pinned Badge
│       ├── Author Section
│       ├── Title
│       ├── Content
│       └── Media Gallery
├── Empty State
└── FAB Button

CreatePostScreen
├── Header (Black)
│   ├── Back Button
│   └── Post Button
└── ScrollView
    ├── Title Input
    ├── Content Input
    ├── Media Upload (placeholder)
    ├── Target Audience
    │   ├── Radio Group
    │   ├── Department Select
    │   └── Semester Select
    ├── Post Options
    │   ├── Anonymous Toggle
    │   └── Pin Toggle (admin)
    └── Preview Section
```

## Technical Implementation

### Dependencies Used
- `firebase/firestore` - Data storage and queries
- `lucide-react-native` - Icons
- `@gluestack-ui/*` - UI components
- `expo-router` - Navigation
- React Native components: FlatList, Image, ScrollView

### Key Functions

#### `fetchPosts()`
- Queries Firestore for posts
- Applies filtering logic
- Sorts by pinned status and date
- Updates state

#### `filterPostsByAudience(posts)`
- Takes all posts array
- Returns filtered array based on user role
- Implements audience matching logic

#### `formatTimestamp(timestamp)`
- Converts Firestore timestamp to relative time
- Returns human-readable strings ("2h ago", "3d ago")

#### `handlePost()`
- Validates form inputs
- Constructs post data object
- Uploads to Firestore
- Shows success/error messages

### State Management
```typescript
// NewsScreen
const [posts, setPosts] = useState<NewsPost[]>([]);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [showPinnedOnly, setShowPinnedOnly] = useState(false);

// CreatePostScreen
const [title, setTitle] = useState("");
const [content, setContent] = useState("");
const [audienceType, setAudienceType] = useState<AudienceType>("all");
const [selectedDepartment, setSelectedDepartment] = useState("");
const [selectedSemester, setSelectedSemester] = useState("");
const [isAnonymous, setIsAnonymous] = useState(false);
const [isPinned, setIsPinned] = useState(false);
const [posting, setPosting] = useState(false);
```

## Future Enhancements

### Planned Features
1. **Media Upload**
   - Image picker integration
   - Firebase Storage upload
   - Video support
   - Multiple media selection
   - Image compression

2. **Engagement Features**
   - Like/React to posts
   - Comment system
   - Share posts
   - Bookmark/Save posts

3. **Advanced Filtering**
   - Search posts
   - Filter by date range
   - Filter by author
   - Filter by category/tags

4. **Post Management**
   - Edit posts (within time limit)
   - Delete posts
   - Report inappropriate posts
   - Post analytics (views, engagement)

5. **Rich Content**
   - Markdown support
   - Link previews
   - Polls
   - Attachments (PDFs, docs)

6. **Notifications**
   - Push notifications for new posts
   - @mentions
   - Post updates

### Technical Improvements
- Implement pagination (infinite scroll)
- Add caching for offline viewing
- Optimize image loading
- Add skeleton loaders
- Implement optimistic UI updates
- Add post drafts feature
- Better error handling with toast notifications

## Files Modified/Created

### New Files
1. **`app/create-post.tsx`** - Create post screen
2. **`docs/NEWS_PAGE_IMPLEMENTATION.md`** - This documentation

### Modified Files
1. **`app/(tabs)/news.tsx`** - Complete news feed implementation
2. **`lib/firestoreSeed.ts`** - Added 5 sample news posts

## Seed Data

Added 5 sample posts covering different scenarios:
1. **Pinned General Post** - Mid-semester exam notice (Admin)
2. **Department+Semester Post** - DBMS lab reschedule (Teacher)
3. **General Post** - Technical fest announcement (Admin)
4. **Department Post** - Assignment reminder (Teacher)
5. **Semester Post** - Career guidance workshop (Admin)

## Testing Checklist

- [x] Feed loads correctly with posts
- [x] Pinned posts appear at top
- [x] Posts filter correctly by audience
- [x] Students see only relevant posts
- [x] Teachers can create posts
- [x] Admins can create and pin posts
- [x] Anonymous posting works
- [x] Target audience selector works
- [x] Form validation works
- [x] Post creation saves to Firestore
- [x] Pull-to-refresh updates feed
- [x] Empty state displays correctly
- [x] FAB shows only for teachers/admins
- [x] Relative timestamps display correctly
- [ ] Media upload (pending implementation)
- [ ] Pagination (pending implementation)

## Known Limitations

1. **Media Upload** - Currently shows placeholder, needs image picker and Firebase Storage integration
2. **Pagination** - Loads all posts at once (limit 50), infinite scroll not yet implemented
3. **Post Editing** - Not implemented yet
4. **Post Deletion** - Not implemented yet
5. **Search** - No search functionality yet
6. **Categories** - No post categorization yet
7. **Engagement** - No likes/comments yet

## Security Considerations

1. **Firestore Rules** - Need to add security rules to:
   - Allow only teachers/admins to create posts
   - Allow only admins to pin posts
   - Prevent unauthorized edits/deletes
   - Validate post structure

2. **Anonymous Posts** - Author ID is still stored for admin tracking, only display name is hidden

3. **Content Moderation** - Future: implement content filters and reporting

## Performance Notes

- Uses FlatList for efficient rendering
- Caches author name/role in post document (no need to query users collection)
- Limits initial query to 50 posts
- Client-side filtering for better UX
- Relative timestamps avoid constant re-renders

## Notes

- The news feed follows the same black and white design pattern as other pages
- All text is clean and readable with proper contrast
- The layout is responsive and works on different screen sizes
- Posts are sorted with pinned first, then by creation date (newest first)
- The create post screen provides live preview of how the post will appear
- Form validation provides helpful error messages
- Character counters help users stay within limits

## Next Steps

After testing the news page, consider:
1. Implementing media upload functionality
2. Adding pagination/infinite scroll
3. Implementing post editing/deletion
4. Adding engagement features (likes, comments)
5. Setting up Firestore security rules
6. Adding push notifications for new posts