import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "@/lib/AuthContext";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { user, userData, role, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";
    const inAdminGroup = segments[0] === "admin";

    if (!user) {
      // Not authenticated - redirect to login
      if (!inAuthGroup) {
        router.replace("/(auth)/login");
      }
    } else if (!user.emailVerified) {
      // Email not verified - redirect to verification page
      router.replace("/(auth)/verify-email");
    } else if (!userData) {
      // User exists but no user data - should not happen in normal flow
      router.replace("/(auth)/login");
    } else {
      // Authenticated and verified
      if (role === "admin") {
        // Admin users go to admin dashboard
        if (!inAdminGroup) {
          router.replace("/admin");
        }
      } else {
        // Regular users (student, teacher, parent) go to tabs
        if (!inTabsGroup) {
          router.replace("/(tabs)");
        }
      }
    }
  }, [user, userData, role, loading, segments]);

  // Show loading screen while checking auth
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
      }}
    >
      <ActivityIndicator size="large" color="#3B82F6" />
    </View>
  );
}
