import { Tabs } from 'expo-router';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Home, CalendarDays, BookOpen, Bell, User } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { FAB } from '@/components/layout/FAB';

export default function TabsLayout() {
  const { role } = useAuth();

  return (
    <ProtectedRoute>
      <Tabs screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 60,
        }
      }}>
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused, size }) => (
              <Home size={size} color={focused ? '#3B82F6' : '#6B7280'} />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            tabBarIcon: ({ focused, size }) => (
              <CalendarDays size={size} color={focused ? '#3B82F6' : '#6B7280'} />
            ),
          }}
        />
        <Tabs.Screen
          name="academics"
          options={{
            tabBarIcon: ({ focused, size }) => (
              <BookOpen size={size} color={focused ? '#3B82F6' : '#6B7280'} />
            ),
          }}
        />
        <Tabs.Screen
          name="news"
          options={{
            tabBarIcon: ({ focused, size }) => (
              <Bell size={size} color={focused ? '#3B82F6' : '#6B7280'} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused, size }) => (
              <User size={size} color={focused ? '#3B82F6' : '#6B7280'} />
            ),
          }}
        />
      </Tabs>

      {/* Context-aware FAB will be added later */}
      {/* <FAB /> */}
    </ProtectedRoute>
  );
}
