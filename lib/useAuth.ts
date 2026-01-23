import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserData, Role } from './authUtils';

export interface AuthState {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userData: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.email);
      
      if (user) {
        // Fetch user data from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserData;
          console.log('User data loaded:', userData);
          setAuthState({
            user,
            userData,
            loading: false,
          });
        } else {
          // User document doesn't exist - this shouldn't happen in normal flow
          console.log('No user document found');
          setAuthState({
            user: null,
            userData: null,
            loading: false,
          });
        }
      } else {
        console.log('User logged out');
        setAuthState({
          user: null,
          userData: null,
          loading: false,
        });
      }
    });

    return unsubscribe;
  }, []);

  return authState;
}