import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/AuthContext';

export default function Index() {
  const { role, loading, isAuthenticated } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (role === 'admin') {
    return <Redirect href="/admin/dashboard" />;
  }

  return <Redirect href="/(tabs)/home" />;
}

