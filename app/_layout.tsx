import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';
import { Slot, useRouter, useSegments, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Text } from 'react-native';
import { useAuth } from '@/lib/useAuth';
import { getRoleBasedRedirect } from '@/lib/routeGuards';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'SpaceGrotesk-Regular': require('../assets/fonts/SpaceGrotesk-Regular.ttf'),
    'SpaceGrotesk-Medium': require('../assets/fonts/SpaceGrotesk-Medium.ttf'),
    'SpaceGrotesk-SemiBold': require('../assets/fonts/SpaceGrotesk-SemiBold.ttf'),
    'SpaceGrotesk-Bold': require('../assets/fonts/SpaceGrotesk-Bold.ttf'),
  });

  const { user, userData, loading } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();



  useEffect(() => {
    console.log('Auth guard running:', { user: user?.email, role: userData?.role, loading, pathname });
    
    if (loading) return;

    const inAuthGroup = pathname.startsWith('/(auth)') || pathname === '/login' || pathname === '/register' || pathname === '/parent-link';
    const inAdminGroup = pathname.startsWith('/admin');
    const inTabsGroup = pathname.startsWith('/(tabs)');

    if (!user) {
      // Redirect unauthenticated users to login if not already in auth
      if (!inAuthGroup) {
        console.log('Redirecting to login');
        router.replace('/(auth)/login' as any);
      }
      return;
    }

    const role = userData?.role;
    console.log('User role:', role, 'inAuthGroup:', inAuthGroup);

    // Role-based redirects
    if (inAuthGroup && role) {
      // Authenticated users shouldn't be in auth pages
      const redirectPath = getRoleBasedRedirect(role, true);
      console.log('Redirecting from auth to:', redirectPath);
      router.replace(redirectPath as any);
      return;
    }

    if (inAdminGroup && role !== 'admin') {
      router.replace('/unauthorized' as any);
      return;
    }
  }, [user, userData, loading, pathname, router]);

  if (loading) {
    return null; // Show loading screen if needed
  }

  return (
    <GluestackUIProvider mode="light">
      <Slot />
    </GluestackUIProvider>
  );
}
