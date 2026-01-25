import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'react-native';
import { Box } from '@/components/ui/box';

export default function AuthLayout() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <Box className="flex-1">
        {/* Header with Logo */}
        <Box className="items-center justify-center pt-8 pb-4">
          <Image
            source={require('@/assets/images/icon.png')}
            className="w-24 h-24"
            resizeMode="contain"
          />
        </Box>

        {/* Auth Screens */}
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: 'white' },
          }}
        />
      </Box>
    </SafeAreaView>
  );
}
