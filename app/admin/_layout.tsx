import { Stack } from "expo-router";
import AdminRoute from "@/components/AdminRoute";

export default function AdminLayout() {
  return (
    <AdminRoute>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="users" />
        <Stack.Screen name="courses" />
        {/* Add more admin screens */}
      </Stack>
    </AdminRoute>
  );
}
