import { Redirect } from "expo-router";
import { useAuth } from "@/lib/AuthContext";
import { ActivityIndicator, View } from "react-native";

// TEST MODE: Set to true to bypass email verification during testing
const TEST_MODE = true;

export default function AdminRoute({
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
  if (!user.emailVerified && !TEST_MODE) {
    return <Redirect href="/(auth)/verify-email" />;
  }

  // No user data
  if (!userData) {
    return <Redirect href="/(auth)/login" />;
  }

  // Not an admin - redirect to unauthorized page
  if (role !== "admin") {
    return <Redirect href="/(auth)/unauthorized" />;
  }

  // Admin user - render protected admin content
  return <>{children}</>;
}
