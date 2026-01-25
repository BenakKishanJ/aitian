import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { ActivityIndicator, View } from 'react-native';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { firebaseUser, userData, role, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Not authenticated
  if (!firebaseUser) {
    return <Redirect href="/(auth)/login" />;
  }

  // Email not verified
  if (!firebaseUser.emailVerified) {
    return <Redirect href="/(auth)/verify-email" />;
  }

  // Parent without approved links - show limited content
  if (role === 'parent' && (!userData?.linkedStudentIds || userData.linkedStudentIds.length === 0)) {
    // Still allow access but will filter content in components
    return <>{children}</>;
  }

  // Role-based redirect handled by layout structure

  return <>{children}</>;
}