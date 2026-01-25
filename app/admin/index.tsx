import { View, Text } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

export default function AdminDashboard() {
  const { userData } = useAuth();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Admin Dashboard</Text>
      <Text>Welcome, {userData?.name}</Text>
      <Text>Manage users, courses, and system settings here.</Text>
    </View>
  );
}