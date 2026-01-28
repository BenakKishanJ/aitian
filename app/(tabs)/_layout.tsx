import { Tabs } from "expo-router";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Home, CalendarDays, BookOpen, Bell, User } from "lucide-react-native";

export default function TabsLayout() {
  return (
    <ProtectedRoute>
      <Tabs screenOptions={{ headerShown: false, tabBarShowLabel: false }}>
        <Tabs.Screen
          name="home"
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <Home size={size} color={focused ? "#3B82F6" : color} />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <CalendarDays size={size} color={focused ? "#3B82F6" : color} />
            ),
          }}
        />
        <Tabs.Screen
          name="academics"
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <BookOpen size={size} color={focused ? "#3B82F6" : color} />
            ),
          }}
        />
        <Tabs.Screen
          name="news"
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <Bell size={size} color={focused ? "#3B82F6" : color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <User size={size} color={focused ? "#3B82F6" : color} />
            ),
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
