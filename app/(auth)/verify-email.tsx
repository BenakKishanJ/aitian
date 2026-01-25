import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import {
  MailCheck,
  MailWarning,
  RefreshCw,
  CheckCircle,
  ArrowRight,
} from 'lucide-react-native';
import { auth } from '@/lib/firebase';
import { sendEmailVerification, reload } from 'firebase/auth';
import { Alert } from 'react-native';

/* Gluestack UI (local re-exports) */

// Layout
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { Box } from '@/components/ui/box'

// Typography
import { Text } from '@/components/ui/text'
import { Heading } from '@/components/ui/heading'

// Button
import { Button, ButtonText } from '@/components/ui/button'


export default function VerifyEmailScreen() {
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }

    setUserEmail(user.email || '');
    setIsVerified(user.emailVerified);

    // Check verification status every 5 seconds
    const interval = setInterval(async () => {
      await user.reload();
      if (user.emailVerified && !isVerified) {
        setIsVerified(true);
        clearInterval(interval);

        // Redirect after verification
        setTimeout(() => {
          router.replace('/');
        }, 2000);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendVerification = async () => {
    if (cooldown > 0) return;

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      await sendEmailVerification(user);
      setVerificationSent(true);
      setCooldown(60); // 60 seconds cooldown

      Alert.alert(
        'Verification Email Sent',
        'Please check your inbox and spam folder.'
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        'Failed to send verification email. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (isVerified) {
      router.replace('/');
    } else {
      Alert.alert(
        'Email Not Verified',
        'Please verify your email before continuing.'
      );
    }
  };

  return (
    <Box className="flex-1 bg-white px-6">
      <VStack className="flex-1 justify-center items-center" space="lg">
        {/* Icon */}
        <Box className="p-6 rounded-full bg-blue-100">
          {isVerified ? (
            <CheckCircle size={64} color="#10B981" />
          ) : (
            <MailWarning size={64} color="#3B82F6" />
          )}
        </Box>

        {/* Title */}
        <VStack className="items-center" space="sm">
          <Heading size="2xl" className="text-gray-900">
            {isVerified ? 'Email Verified!' : 'Verify Your Email'}
          </Heading>
          <Text className="text-center text-gray-600">
            {isVerified
              ? 'Your email has been successfully verified.'
              : `We've sent a verification link to:`}
          </Text>
          {!isVerified && (
            <Text className="font-semibold text-blue-600 text-lg">
              {userEmail}
            </Text>
          )}
        </VStack>

        {/* Instructions */}
        {!isVerified && (
          <VStack className="bg-blue-50 p-4 rounded-lg w-full" space="sm">
            <Text className="font-semibold text-blue-800">Instructions:</Text>
            <VStack space="xs" className="pl-1">
              <Text className="text-blue-700 text-sm">
                1. Check your email inbox
              </Text>
              <Text className="text-blue-700 text-sm">
                2. Click the verification link in the email
              </Text>
              <Text className="text-blue-700 text-sm">
                3. Return to this screen
              </Text>
              <Text className="text-blue-700 text-sm mt-2">
                Can't find the email? Check your spam folder.
              </Text>
            </VStack>
          </VStack>
        )}

        {/* Status Message */}
        {verificationSent && !isVerified && (
          <HStack className="bg-green-50 p-3 rounded-lg items-center" space="sm">
            <MailCheck size={20} color="#10B981" />
            <Text className="text-green-800">
              New verification email sent!
            </Text>
          </HStack>
        )}

        {/* Actions */}
        <VStack className="w-full" space="md">
          {!isVerified ? (
            <>
              <Button
                size="lg"
                onPress={handleResendVerification}
                isDisabled={loading || cooldown > 0}
                className="bg-blue-500 active:bg-blue-600"
              >
                <HStack className="items-center" space="sm">
                  {loading ? (
                    <RefreshCw size={20} color="white" className="animate-spin" />
                  ) : (
                    <MailCheck size={20} color="white" />
                  )}
                  <ButtonText className="text-white font-semibold">
                    {cooldown > 0
                      ? `Resend in ${cooldown}s`
                      : loading
                        ? 'Sending...'
                        : 'Resend Verification Email'}
                  </ButtonText>
                </HStack>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onPress={() => router.back()}
              >
                <ButtonText className="text-gray-700">Back to Login</ButtonText>
              </Button>
            </>
          ) : (
            <Button
              size="lg"
              onPress={handleContinue}
              className="bg-green-500 active:bg-green-600"
            >
              <HStack className="items-center" space="sm">
                <ButtonText className="text-white font-semibold">
                  Continue to App
                </ButtonText>
                <ArrowRight size={20} color="white" />
              </HStack>
            </Button>
          )}
        </VStack>

        {/* Auto-redirect notice */}
        {isVerified && (
          <Text className="text-gray-500 text-sm mt-4">
            Redirecting you to the app...
          </Text>
        )}
      </VStack>
    </Box>
  );
}
