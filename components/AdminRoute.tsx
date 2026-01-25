import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { ActivityIndicator, View } from 'react-native';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { firebaseUser, role, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!firebaseUser || role !== 'admin') {
    return <Redirect href="/(auth)/unauthorized" />;
  }

  return <>{children}</>;
}