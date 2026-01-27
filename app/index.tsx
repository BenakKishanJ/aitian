import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/AuthContext";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { user, userData, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Not authenticated - redirect to login
      router.replace("/(auth)/login");
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
        router.replace("/admin");
      } else {
        // Regular users (student, teacher, parent) go to tabs
        router.replace("/(tabs)/home");
      }
    }
  }, [user, userData, role, loading]);

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
