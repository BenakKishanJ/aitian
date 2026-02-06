import { Tabs } from "expo-router";
import AdminRoute from "@/components/AdminRoute";
import { Home, CalendarDays, BookOpen, Bell, User } from "lucide-react-native";

export default function AdminTabsLayout() {
  return (
    <AdminRoute>
      <Tabs screenOptions={{ headerShown: false, tabBarShowLabel: false }}>
        <Tabs.Screen
          name="home"
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <Home size={size} color={focused ? "#000000" : color} />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <CalendarDays size={size} color={focused ? "#000000" : color} />
            ),
          }}
        />
        <Tabs.Screen
          name="academics"
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <BookOpen size={size} color={focused ? "#000000" : color} />
            ),
          }}
        />
        <Tabs.Screen
          name="news"
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <Bell size={size} color={focused ? "#000000" : color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <User size={size} color={focused ? "#000000" : color} />
            ),
          }}
        />
      </Tabs>
    </AdminRoute>
  );
}
