import { Tabs } from 'expo-router';
import { GlobeIcon, CalendarDaysIcon, StarIcon, BellIcon, SettingsIcon } from '@/components/ui/icon';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#C5D4CA',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#1C1C1E',
          borderTopColor: '#2A2A2D',
        },
        headerStyle: {
          backgroundColor: '#1C1C1E',
        },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <GlobeIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <CalendarDaysIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="academics"
        options={{
          title: 'Academics',
          tabBarIcon: ({ color }) => <StarIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'News',
          tabBarIcon: ({ color }) => <BellIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <SettingsIcon color={color} />,
        }}
      />
    </Tabs>
  );
}