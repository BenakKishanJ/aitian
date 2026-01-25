import { useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { useAuth } from './useAuth';

export function useLogout() {
  const { user, userData } = useAuth();

  const logout = async () => {
    try {
      await signOut(auth);
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return { logout, canLogout: !!user };
}