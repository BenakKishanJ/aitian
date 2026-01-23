import React from 'react';
import { Role } from './authUtils';

interface RouteGuardProps {
  requiredRole?: Role;
  requireAuth?: boolean;
  children: React.ReactNode;
}

/**
 * Protects routes based on authentication and role requirements
 */
export function RouteGuard({ requiredRole, requireAuth = true, children }: RouteGuardProps) {
  // This component would use useAuth hook to check current user state
  // For now, returning children - implement logic based on auth state
  return children;
}

/**
 * Redirects based on user role and authentication status
 */
export function getRoleBasedRedirect(role: Role | null, isAuthenticated: boolean): string {
  if (!isAuthenticated) {
    return '/login';
  }

  switch (role) {
    case 'student':
    case 'teacher':
    case 'parent':
      return '/(tabs)/home';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/unauthorized';
  }
}