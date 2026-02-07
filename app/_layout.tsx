import { Stack } from "expo-router";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { AuthProvider } from "@/lib/AuthContext";
import { useFonts } from "expo-font";
import { usePushNotifications } from "@/lib/hooks/usePushNotifications";
import "@/global.css";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Push notification provider component
function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  usePushNotifications();
  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "SpaceGrotesk-Regular": require("../assets/fonts/SpaceGrotesk-Regular.ttf"),
    "SpaceGrotesk-Medium": require("../assets/fonts/SpaceGrotesk-Medium.ttf"),
    "SpaceGrotesk-SemiBold": require("../assets/fonts/SpaceGrotesk-SemiBold.ttf"),
    "SpaceGrotesk-Bold": require("../assets/fonts/SpaceGrotesk-Bold.ttf"),
  });

  if (!fontsLoaded) return null;

  return (
    <GluestackUIProvider>
      <AuthProvider>
        <PushNotificationProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="admin" />
          </Stack>
        </PushNotificationProvider>
      </AuthProvider>
    </GluestackUIProvider>
  );
}
