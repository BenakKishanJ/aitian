import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';
import { Slot, usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { getRoleBasedRedirect } from '@/lib/routeGuards';

function AuthGate() {
  const { isAuthenticated, role, userData, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuth =
      pathname.startsWith('/(auth)') ||
      pathname === '/login' ||
      pathname === '/register' ||
      pathname === '/parent-link';

    if (!isAuthenticated && !inAuth) {
      router.replace('/login');
      return;
    }

    if (isAuthenticated && inAuth && role) {
      router.replace(getRoleBasedRedirect(role, true) as any);
      return;
    }

    if (
      isAuthenticated &&
      role &&
      userData &&
      !userData.profileComplete &&
      pathname !== '/complete-profile'
    ) {
      router.replace('/complete-profile' as any);
      return;
    }
  }, [loading, isAuthenticated, role, userData, pathname]);

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'SpaceGrotesk-Regular': require('../assets/fonts/SpaceGrotesk-Regular.ttf'),
    'SpaceGrotesk-Medium': require('../assets/fonts/SpaceGrotesk-Medium.ttf'),
    'SpaceGrotesk-SemiBold': require('../assets/fonts/SpaceGrotesk-SemiBold.ttf'),
    'SpaceGrotesk-Bold': require('../assets/fonts/SpaceGrotesk-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <GluestackUIProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </GluestackUIProvider>
  );
}

