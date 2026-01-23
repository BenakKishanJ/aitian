import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/useAuth';

export default function Index() {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return null; // Or loading component
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  // Redirect based on role
  const role = userData?.role;
  if (role === 'student' || role === 'teacher' || role === 'parent') {
    return <Redirect href="/(tabs)/home" />;
  } else if (role === 'admin') {
    return <Redirect href="/admin/dashboard" />;
  }

  return <Redirect href="/unauthorized" />;
}
