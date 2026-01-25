import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export type UserRole = 'student' | 'teacher' | 'parent' | 'admin';

export interface AuthUser {
  firebaseUser: User | null;
  userData: any | null;
  role: UserRole | null;
  loading: boolean;
}

export function useAuth(): AuthUser {
  const [authState, setAuthState] = useState<AuthUser>({
    firebaseUser: null,
    userData: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const userRef = doc(db, 'users', firebaseUser.uid);

        const unsubscribeUserData = onSnapshot(userRef, (docSnap) => {
          const userData = docSnap.data();

          setAuthState({
            firebaseUser,
            userData,
            role: userData?.role || null,
            loading: false,
          });
        });

        return () => unsubscribeUserData();
      } else {
        // User is signed out
        setAuthState({
          firebaseUser: null,
          userData: null,
          role: null,
          loading: false,
        });
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return authState;
}
