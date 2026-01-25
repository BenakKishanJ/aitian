import React, { useState } from 'react';
import { Link, router } from 'expo-router';
import { AlertCircle, Mail, Lock } from 'lucide-react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

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


export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';

    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Update Redirect Logic in Auth Pages
      router.replace('/');
    } catch (error: any) {
      let message = 'Login failed. Please check your credentials.';

      switch (error.code) {
        case 'auth/user-not-found':
          message = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          message = 'Incorrect password.';
          break;
        case 'auth/invalid-email':
          message = 'Invalid email address.';
          break;
        case 'auth/too-many-requests':
          message = 'Too many attempts. Please try again later.';
          break;
        case 'auth/user-disabled':
          message = 'Account disabled. Please contact admin.';
          break;
      }

      Alert.alert('Login Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="flex-1 px-6">
      <VStack className="flex-1 justify-center" space="lg">
        {/* Header */}
        <VStack space="sm">
          <Heading size="2xl" className="text-gray-900">
            Welcome Back
          </Heading>
          <Text className="text-gray-600">
            Sign in to access your academic dashboard
          </Text>
        </VStack>

        {/* Form */}
        <VStack space="md">
          {/* Email Input */}
          <FormControl isInvalid={!!errors.email}>
            <FormControlLabel>
              <FormControlLabelText className="text-gray-700">
                College Email
              </FormControlLabelText>
            </FormControlLabel>
            <Input>
              <Box className="mr-3">
                <Mail size={20} color="#6B7280" />
              </Box>
              <InputField
                placeholder="you@college.edu"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                className="flex-1"
              />
            </Input>
            {errors.email && (
              <HStack className="mt-1 items-center" space="xs">
                <AlertCircle size={14} color="#EF4444" />
                <Text className="text-red-500 text-sm">{errors.email}</Text>
              </HStack>
            )}
          </FormControl>

          {/* Password Input */}
          <FormControl isInvalid={!!errors.password}>
            <FormControlLabel>
              <FormControlLabelText className="text-gray-700">
                Password
              </FormControlLabelText>
            </FormControlLabel>
            <Input>
              <Box className="mr-3">
                <Lock size={20} color="#6B7280" />
              </Box>
              <InputField
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                className="flex-1"
              />
            </Input>
            {errors.password && (
              <HStack className="mt-1 items-center" space="xs">
                <AlertCircle size={14} color="#EF4444" />
                <Text className="text-red-500 text-sm">{errors.password}</Text>
              </HStack>
            )}
          </FormControl>

          {/* Forgot Password Link */}
          <Box className="items-end">
            <Link href="/(auth)/forgot-password" asChild>
              <Button variant="link" size="sm">
                <ButtonText className="text-blue-500">
                  Forgot Password?
                </ButtonText>
              </Button>
            </Link>
          </Box>

          {/* Login Button */}
          <Button
            size="lg"
            onPress={handleLogin}
            isDisabled={loading}
            className="mt-2 bg-blue-500 active:bg-blue-600"
          >
            <ButtonText className="text-white font-semibold">
              {loading ? 'Signing in...' : 'Sign In'}
            </ButtonText>
          </Button>
        </VStack>

        {/* Divider */}
        <HStack className="items-center my-4">
          <Box className="flex-1 h-px bg-gray-200" />
          <Text className="mx-4 text-gray-500">or</Text>
          <Box className="flex-1 h-px bg-gray-200" />
        </HStack>

        {/* Register Links */}
        <VStack space="sm">
          <Text className="text-center text-gray-600">
            Don't have an account?
          </Text>

          <Link href="/(auth)/register" asChild>
            <Button variant="outline" size="lg">
              <ButtonText className="text-gray-700">
                Create Account
              </ButtonText>
            </Button>
          </Link>

          <HStack className="justify-center mt-4" space="sm">
            <Link href="/(auth)/register-student" asChild>
              <Button variant="link" size="sm">
                <ButtonText className="text-blue-500">
                  Student
                </ButtonText>
              </Button>
            </Link>
            <Text className="text-gray-500">•</Text>
            <Link href="/(auth)/register-teacher" asChild>
              <Button variant="link" size="sm">
                <ButtonText className="text-green-500">
                  Teacher
                </ButtonText>
              </Button>
            </Link>
            <Text className="text-gray-500">•</Text>
            <Link href="/(auth)/register-parent" asChild>
              <Button variant="link" size="sm">
                <ButtonText className="text-purple-500">
                  Parent
                </ButtonText>
              </Button>
            </Link>
          </HStack>
        </VStack>

        {/* Footer Note */}
        <Text className="text-center text-gray-500 text-sm mt-8">
          By signing in, you agree to our Terms and Privacy Policy
        </Text>
      </VStack>
    </Box>
  );
}
