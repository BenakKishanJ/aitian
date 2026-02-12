import { Stack } from "expo-router";
import AdminRoute from "@/components/AdminRoute";

export default function AdminLayout() {
  return (
    <AdminRoute>
      <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="courses" />
      <Stack.Screen name="events" />
      </Stack>
    </AdminRoute>
  );
}
