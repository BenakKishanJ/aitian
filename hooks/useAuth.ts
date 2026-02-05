import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { Role, UserData, AuthState } from '@/types';

/**
 * @deprecated Use AuthState from @/types instead
 */
export interface AuthUser extends AuthState {}

/**
 * @deprecated Use Role from @/types instead
 */
export type UserRole = Role;

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    firebaseUser: null,
    user: null,
    loading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const userRef = doc(db, 'users', firebaseUser.uid);

        const unsubscribeUserData = onSnapshot(userRef, (docSnap) => {
          const userData = docSnap.data() as UserData | undefined;

          setAuthState({
            firebaseUser,
            user: userData ?? null,
            loading: false,
            isAuthenticated: true,
          });
        });

        return () => unsubscribeUserData();
      } else {
        // User is signed out
        setAuthState({
          firebaseUser: null,
          user: null,
          loading: false,
          isAuthenticated: false,
        });
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return authState;
}
