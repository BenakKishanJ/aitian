# AGENTS.md

Instructions for AI agents working in this repository.

## Project Overview

- **Type**: Expo (React Native) + TypeScript mobile/web app
- **UI Framework**: Gluestack UI + NativeWind (Tailwind for RN)
- **Router**: Expo Router (file-based)
- **Backend**: Firebase (Auth + Firestore)
- **Testing**: Jest (jest-expo preset)

## Build/Lint/Test Commands

```bash
# Development
npm start          # Start Expo dev server
npm run android    # Start with Android simulator
npm run ios        # Start with iOS simulator
npm run web        # Start with web browser

# Build
npm run build      # Build for web production (exports to dist/)
npm run build:preview  # Build for preview

# Testing
npm test           # Run Jest in watch mode
npx jest --testPathPattern="Button" --watch  # Run single test file
npx jest --testNamePattern="renders correctly"  # Run specific test

# Note: No ESLint/Prettier configured. Follow existing code style.
```

## Import Conventions

### Path Aliases (configured in babel.config.js)
- `@/` → project root (e.g., `import { Button } from '@/components/ui/button'`)
- `tailwind.config` → `./tailwind.config.js`

### Import Order
1. React/Expo imports
2. Third-party libraries
3. Internal components (`@/components/...`)
4. Internal hooks/utils (`@/hooks/...`, `@/lib/...`)
5. Relative imports (avoid when possible)

Example:
```typescript
import React from 'react';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
```

## Code Style

### Formatting
- 2-space indentation
- Single quotes for strings, double quotes in JSX
- Semicolons required
- Max line length: ~100 characters (be reasonable)

### Naming Conventions
- **Components**: PascalCase (e.g., `TodayClassCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Utilities**: camelCase (e.g., `authUtils.ts`)
- **Interfaces/Types**: PascalCase, Props interface uses `ComponentNameProps`
- **Files**: Match the default export name

### TypeScript
- Strict mode enabled
- Always define types for props using interfaces
- Use explicit return types for complex functions
- Prefer `interface` over `type` for object shapes

Example:
```typescript
interface TodayClassCardProps {
  title: string;
  courseName?: string;
  startTime: Date;
  onPress?: () => void;
}

export function TodayClassCard({ title, ...props }: TodayClassCardProps) {
  // ...
}
```

### Component Structure
- Use functional components with hooks
- Group related hooks together
- Extract helper functions outside component or at top
- Use early returns for loading/null states

### Styling
- Mix of NativeWind (Tailwind classes) and StyleSheet
- Use `className` for layout/utilities: `className="flex-row items-center"`
- Use `StyleSheet.create()` for complex/computed styles
- Use theme colors from design system (e.g., `primary-500`, `typography-700`)

### Error Handling
- Use try/catch for async operations
- Log errors with context: `console.error("Error fetching user:", error)`
- Set appropriate fallback states in catch blocks
- Don't swallow errors silently

### Firebase Patterns
- Use real-time listeners (`onSnapshot`) for live data
- Clean up subscriptions in useEffect cleanup
- Auth state handled in `AuthContext` - use `useAuth()` hook

## File Organization

```
/app              # Expo Router pages
  /(auth)         # Auth route group (login, register)
  /(tabs)         # Tab navigation group
  /admin          # Admin routes
  _layout.tsx     # Root layout with providers
/components       # Reusable components
  /ui             # Gluestack UI components
  /home           # Feature-specific components
  /calendar
  /academics
/hooks            # Custom React hooks
/lib              # Utilities, Firebase config, contexts
/constants        # App constants, colors
```

## Testing Guidelines

- Test files: `*.test.tsx` or `__tests__/*.tsx`
- Use `jest-expo` preset
- Test user interactions and component rendering
- Mock Firebase calls
- Run single tests with `--testPathPattern`

## Git Workflow

1. Never commit secrets or API keys
2. Don't use `git commit --amend` on pushed commits
3. Don't push with `--force`
4. Follow existing commit message style
5. Create feature branches for changes

## Dependencies

Key libraries to be familiar with:
- `expo` / `expo-router` - Framework and routing
- `nativewind` - Tailwind CSS for React Native
- `@gluestack-ui/*` - UI component library
- `firebase` - Backend services
- `lucide-react-native` - Icons
- `zustand` (if used) - State management

## Common Gotchas

- **Web vs Native**: Some components have `.web.tsx` variants
- **Firebase Auth**: Check both `user` and `authInitialized` before rendering
- **Fonts**: SpaceGrotesk family is preloaded in `_layout.tsx`
- **Routes**: Use typed routes via `expo-router` (see `app/` structure)
- **Images**: Store in `assets/images/`, fonts in `assets/fonts/`
