import React from 'react';
import { router } from 'expo-router';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';

export default function UnauthorizedScreen() {
  const { role } = useAuth();

  const getRoleName = () => {
    switch (role) {
      case 'student': return 'Student';
      case 'teacher': return 'Teacher';
      case 'parent': return 'Parent';
      case 'admin': return 'Administrator';
      default: return 'User';
    }
  };

  const getAccessMessage = () => {
    switch (role) {
      case 'parent':
        return 'You need student approval to access this content.';
      case 'student':
        return 'This area is for teachers and administrators only.';
      case 'teacher':
        return 'You do not have permission to access this area.';
      case 'admin':
        return 'You have full access to all areas.';
      default:
        return 'Please login to access this content.';
    }
  };

  return (
    <Box className="flex-1 bg-white px-6">
      <VStack className="flex-1 justify-center items-center" space="lg">
        {/* Icon */}
        <Box className="p-6 rounded-full bg-red-100">
          <ShieldAlert size={64} color="#EF4444" />
        </Box>

        {/* Title */}
        <VStack className="items-center" space="sm">
          <Heading size="2xl" className="text-gray-900">
            Access Denied
          </Heading>
          <Text className="text-center text-gray-600">
            {getAccessMessage()}
          </Text>
          {role && (
            <Text className="font-semibold text-blue-600">
              Current Role: {getRoleName()}
            </Text>
          )}
        </VStack>

        {/* Actions */}
        <VStack className="w-full" space="sm">
          <Button
            size="lg"
            onPress={() => router.back()}
            className="bg-gray-500 active:bg-gray-600"
          >
            <HStack className="items-center" space="sm">
              <ArrowLeft size={20} color="white" />
              <ButtonText className="text-white font-semibold">
                Go Back
              </ButtonText>
            </HStack>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onPress={() => router.replace('/(tabs)/home')}
          >
            <HStack className="items-center" space="sm">
              <Home size={20} color="#6B7280" />
              <ButtonText className="text-gray-700">
                Go to Home
              </ButtonText>
            </HStack>
          </Button>

          {role === 'parent' && (
            <Button
              variant="outline"
              size="lg"
              onPress={() => router.replace('/(auth)/parent-link')}
              className="border-purple-300"
            >
              <ButtonText className="text-purple-600">
                Manage Student Links
              </ButtonText>
            </Button>
          )}
        </VStack>

        {/* Help Text */}
        <VStack className="mt-8 p-4 bg-gray-50 rounded-lg w-full" space="sm">
          <Text className="font-semibold text-gray-800">Need help?</Text>
          <Text className="text-gray-600 text-sm">
            • Contact your department administrator
          </Text>
          <Text className="text-gray-600 text-sm">
            • Check if you're using the correct account
          </Text>
          <Text className="text-gray-600 text-sm">
            • Parents: Ensure student has approved your link request
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
}
