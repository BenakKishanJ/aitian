import { Stack } from 'expo-router';
import { Box } from '@/components/ui/box';

export default function AuthLayout() {
  return (
    <Box className="flex-1">
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </Box>
  );
}
