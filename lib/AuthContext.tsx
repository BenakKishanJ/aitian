import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { UserData, Role } from "./authUtils";

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  role: Role | null;
  loading: boolean;
  authInitialized: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      // Set loading to true when auth state changes
      setLoading(true);

      if (!firebaseUser) {
        setUser(null);
        setUserData(null);
        setRole(null);
        setLoading(false);
        setAuthInitialized(true);
        return;
      }

      setUser(firebaseUser);

      try {
        // Fetch user data from Firestore
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));

        if (snap.exists()) {
          const data = snap.data() as UserData;
          setUserData(data);
          setRole(data.role);
        } else {
          // edge case: auth exists but no profile
          setUserData(null);
          setRole(null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUserData(null);
        setRole(null);
      } finally {
        // Only set loading to false after user data is fetched
        setLoading(false);
        setAuthInitialized(true);
      }
    });

    return unsub;
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        role,
        loading,
        authInitialized,
        isAuthenticated: !!user && authInitialized,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
