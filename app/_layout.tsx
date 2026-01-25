import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { useFonts } from 'expo-font';
import '@/global.css';


export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'SpaceGrotesk-Regular': require('../assets/fonts/SpaceGrotesk-Regular.ttf'),
    'SpaceGrotesk-Medium': require('../assets/fonts/SpaceGrotesk-Medium.ttf'),
    'SpaceGrotesk-SemiBold': require('../assets/fonts/SpaceGrotesk-SemiBold.ttf'),
    'SpaceGrotesk-Bold': require('../assets/fonts/SpaceGrotesk-Bold.ttf'),
  });

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // You can add global auth state handling here
    });

    return unsubscribe;
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GluestackUIProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="admin" />
        {/* Add more groups as needed */}
      </Stack>
    </GluestackUIProvider>
  );
}