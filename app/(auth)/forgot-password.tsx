import React, { useState } from 'react';
import { Link, router } from 'expo-router';
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Alert as RNAlert } from 'react-native';

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

// Input
import { Input, InputField } from '@/components/ui/input'

// Form Control
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control'

// Alert
import {
  Alert,
  AlertIcon,
  AlertText,
} from '@/components/ui/alert'


export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    setError('');
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (error: any) {
      let message = 'Failed to send reset email. Please try again.';

      switch (error.code) {
        case 'auth/user-not-found':
          message = 'No account found with this email.';
          break;
        case 'auth/invalid-email':
          message = 'Invalid email address.';
          break;
        case 'auth/too-many-requests':
          message = 'Too many attempts. Please try again later.';
          break;
      }

      setError(message);
      RNAlert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="flex-1 bg-white px-6">
      {/* Header */}
      <HStack className="items-center pt-6 pb-4">
        <Link href="/(auth)/login" asChild>
          <Button variant="link" size="sm">
            <ArrowLeft size={20} color="#6B7280" />
          </Button>
        </Link>
        <Heading size="xl" className="flex-1 text-center text-gray-900">
          Reset Password
        </Heading>
        <Box className="w-10" />
      </HStack>

      <VStack className="flex-1 justify-center" space="lg">
        {/* Success Message */}
        {success ? (
          <VStack className="items-center" space="lg">
            <Box className="p-6 rounded-full bg-green-100">
              <CheckCircle size={64} color="#10B981" />
            </Box>

            <VStack className="items-center" space="sm">
              <Heading size="xl" className="text-gray-900">
                Check Your Email
              </Heading>
              <Text className="text-center text-gray-600">
                We've sent password reset instructions to:
              </Text>
              <Text className="font-semibold text-blue-600 text-lg">
                {email}
              </Text>
            </VStack>

            <Alert className="bg-green-50 border border-green-200">
              <AlertIcon as={CheckCircle} className="text-green-500" />
              <AlertText className="text-green-800">
                If you don't see the email, check your spam folder.
              </AlertText>
            </Alert>

            <VStack className="w-full mt-4" space="sm">
              <Button
                size="lg"
                onPress={() => router.replace('/(auth)/login')}
                className="bg-green-500 active:bg-green-600"
              >
                <ButtonText className="text-white font-semibold">
                  Return to Login
                </ButtonText>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onPress={() => {
                  setSuccess(false);
                  setEmail('');
                }}
              >
                <ButtonText className="text-gray-700">
                  Reset Another Email
                </ButtonText>
              </Button>
            </VStack>
          </VStack>
        ) : (
          /* Reset Form */
          <VStack space="lg">
            <VStack space="sm">
              <Text className="text-center text-gray-600">
                Enter your email address and we'll send you instructions to reset your password.
              </Text>

              <Alert className="bg-blue-50 border border-blue-200">
                <AlertIcon as={AlertCircle} className="text-blue-500" />
                <AlertText className="text-blue-800">
                  Use the email you registered with
                </AlertText>
              </Alert>
            </VStack>

            {/* Email Input */}
            <FormControl isInvalid={!!error}>
              <FormControlLabel>
                <FormControlLabelText className="text-gray-700">
                  Email Address
                </FormControlLabelText>
              </FormControlLabel>
              <Input>
                <Box className="mr-3">
                  <Mail size={20} color="#6B7280" />
                </Box>
                <InputField
                  placeholder="you@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    if (error) setError('');
                  }}
                />
              </Input>
              {error && (
                <HStack className="mt-1 items-center" space="xs">
                  <AlertCircle size={14} color="#EF4444" />
                  <Text className="text-red-500 text-sm">{error}</Text>
                </HStack>
              )}
            </FormControl>

            {/* Reset Button */}
            <Button
              size="lg"
              onPress={handleResetPassword}
              isDisabled={loading}
              className="bg-blue-500 active:bg-blue-600"
            >
              <ButtonText className="text-white font-semibold">
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </ButtonText>
            </Button>

            {/* Back to Login */}
            <Link href="/(auth)/login" asChild>
              <Button variant="link" size="lg">
                <ButtonText className="text-gray-600">
                  Back to Sign In
                </ButtonText>
              </Button>
            </Link>
          </VStack>
        )}
      </VStack>
    </Box>
  );
}
