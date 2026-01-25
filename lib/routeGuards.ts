import { Role } from './authUtils';

export function getRoleBasedRedirect(role: Role | null, isAuthenticated: boolean) {
  if (!isAuthenticated) return '/login';

  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'student':
    case 'teacher':
    case 'parent':
      return '/(tabs)/home';
    default:
      return '/unauthorized';
  }
}

