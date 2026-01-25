import { View, Text } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

export default function HomeScreen() {
  const { userData, role } = useAuth();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome, {userData?.name}!</Text>
      <Text>Role: {role}</Text>
      <Text>Home Screen Content Here</Text>
    </View>
  );
}