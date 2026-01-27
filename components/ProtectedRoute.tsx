import { Redirect } from "expo-router";
import { useAuth } from "@/lib/AuthContext";
import { ActivityIndicator, View } from "react-native";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData, role, loading } = useAuth();

  if (loading) {
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

  // Not authenticated
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Email not verified
  if (!user.emailVerified) {
    return <Redirect href="/(auth)/verify-email" />;
  }

  // No user data - shouldn't happen but handle gracefully
  if (!userData) {
    return <Redirect href="/(auth)/login" />;
  }

  // Admin users should use admin routes, not tabs
  if (role === "admin") {
    return <Redirect href="/admin" />;
  }

  // Parent without approved links - still allow access but filter content in components
  if (role === "parent" && !userData.linkedStudentId) {
    // Still allow access but will show limited content
    return <>{children}</>;
  }

  // All checks passed - render protected content
  return <>{children}</>;
}
