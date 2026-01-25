import React, { useState } from 'react';
import { Alert as RAlert } from 'react-native';
import { Link, router } from 'expo-router';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Shield,
  ChevronDown,
  AlertCircle,
  Briefcase,
} from 'lucide-react-native';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

/* Gluestack UI (local re-exports) */

// Layout
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { Box } from '@/components/ui/box'

// Typography
import { Text } from '@/components/ui/text'
import { Heading } from '@/components/ui/heading'
import { Alert, AlertText, AlertIcon } from '@/components/ui/alert';

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

// Select
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectItem,
} from '@/components/ui/select'

// Mock data
const DEPARTMENTS = [
  { id: 'cse', name: 'Computer Science & Engineering' },
  { id: 'ece', name: 'Electronics & Communication' },
  { id: 'me', name: 'Mechanical Engineering' },
  { id: 'cv', name: 'Civil Engineering' },
  { id: 'ee', name: 'Electrical Engineering' },
  { id: 'admin', name: 'Administration' },
  { id: 'exam', name: 'Examination Department' },
  { id: 'academic', name: 'Academic Office' },
];

const DESIGNATIONS = [
  { id: 'hod', name: 'Head of Department' },
  { id: 'principal', name: 'Principal' },
  { id: 'dean', name: 'Dean' },
  { id: 'director', name: 'Director' },
  { id: 'admin_officer', name: 'Administrative Officer' },
  { id: 'exam_controller', name: 'Exam Controller' },
  { id: 'system_admin', name: 'System Administrator' },
];

export default function RegisterAdminScreen() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    designation: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) newErrors.name = 'Name is required';

    // Email validation - only admin domain
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    else if (!formData.email.endsWith('@drait.edu.in')) newErrors.email = 'Must use college email (@drait.edu.in)';

    // Password validation
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Minimum 8 characters';
    else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Must include uppercase, lowercase and numbers';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Department validation
    if (!formData.department) newErrors.department = 'Department is required';

    // Designation validation
    if (!formData.designation) newErrors.designation = 'Designation is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // 1. Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // 2. Send verification email
      await sendEmailVerification(userCredential.user);

      // 3. Create user document in Firestore
      const userData = {
        uid: userCredential.user.uid,
        role: 'admin' as const,
        name: formData.name.trim(),
        email: formData.email,
        department: formData.department,
        designation: formData.designation,
        isActive: true,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);

      // 4. Show success message
      RAlert.alert(
        'Admin Account Created!',
        'Your administrator account has been created. Please verify your email to access the admin dashboard.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );

    } catch (error: any) {
      let message = 'Registration failed. Please try again.';

      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'Email already registered. Please login instead.';
          break;
        case 'auth/invalid-email':
          message = 'Invalid email address.';
          break;
        case 'auth/weak-password':
          message = 'Password is too weak.';
          break;
        case 'auth/operation-not-allowed':
          message = 'Registration is currently disabled.';
          break;
      }

      RAlert.alert('Registration Error', message);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Box className="flex-1 bg-white">
      {/* Header */}
      <HStack className="items-center p-6 border-b border-gray-200">
        <Link href="/(auth)/register" asChild>
          <Button variant="link" size="sm">
            <ArrowLeft size={20} color="#6B7280" />
          </Button>
        </Link>
        <Heading size="xl" className="flex-1 text-center text-gray-900">
          Admin Registration
        </Heading>
        <Box className="w-10" />
      </HStack>

      {/* Form */}
      <VStack className="flex-1 p-6" space="md">
        <VStack space="md" className="flex-1">
          {/* Admin Note */}
          <Alert className="bg-orange-50 border border-orange-200">
            <AlertIcon as={Shield} className="text-orange-500" />
            <AlertText className="text-orange-800">
              Admin accounts have full system access. Use responsibly.
            </AlertText>
          </Alert>

          {/* Personal Details */}
          <VStack space="sm">
            <Text className="text-lg font-semibold text-gray-800">Administrator Details</Text>

            {/* Name */}
            <FormControl isInvalid={!!errors.name}>
              <FormControlLabel>
                <FormControlLabelText className="text-gray-700">
                  Full Name
                </FormControlLabelText>
              </FormControlLabel>
              <Input>
                <Box className="mr-3">
                  <User size={20} color="#6B7280" />
                </Box>
                <InputField
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChangeText={(value) => updateField('name', value)}
                />
              </Input>
              {errors.name && (
                <HStack className="mt-1 items-center" space="xs">
                  <AlertCircle size={14} color="#EF4444" />
                  <Text className="text-red-500 text-sm">{errors.name}</Text>
                </HStack>
              )}
            </FormControl>

            {/* Email */}
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
                  placeholder="admin@drait.edu.in"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(value) => updateField('email', value)}
                />
              </Input>
              {errors.email && (
                <HStack className="mt-1 items-center" space="xs">
                  <AlertCircle size={14} color="#EF4444" />
                  <Text className="text-red-500 text-sm">{errors.email}</Text>
                </HStack>
              )}
              <Text className="text-gray-500 text-sm mt-1">
                Must be @drait.edu.in domain
              </Text>
            </FormControl>
          </VStack>

          {/* Professional Details */}
          <VStack space="sm" className="mt-4">
            <Text className="text-lg font-semibold text-gray-800">Professional Details</Text>

            {/* Department */}
            <FormControl isInvalid={!!errors.department}>
              <FormControlLabel>
                <FormControlLabelText className="text-gray-700">
                  Department
                </FormControlLabelText>
              </FormControlLabel>
              <Select
                selectedValue={formData.department}
                onValueChange={(value) => updateField('department', value)}
              >
                <SelectTrigger className="border-gray-300">
                  <SelectInput placeholder="Select department" />
                  <SelectIcon as={ChevronDown} />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem
                        key={dept.id}
                        label={dept.name}
                        value={dept.id}
                      />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
              {errors.department && (
                <HStack className="mt-1 items-center" space="xs">
                  <AlertCircle size={14} color="#EF4444" />
                  <Text className="text-red-500 text-sm">{errors.department}</Text>
                </HStack>
              )}
            </FormControl>

            {/* Designation */}
            <FormControl isInvalid={!!errors.designation}>
              <FormControlLabel>
                <FormControlLabelText className="text-gray-700">
                  Designation
                </FormControlLabelText>
              </FormControlLabel>
              <Select
                selectedValue={formData.designation}
                onValueChange={(value) => updateField('designation', value)}
              >
                <SelectTrigger className="border-gray-300">
                  <SelectInput placeholder="Select designation" />
                  <SelectIcon as={ChevronDown} />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    {DESIGNATIONS.map((designation) => (
                      <SelectItem
                        key={designation.id}
                        label={designation.name}
                        value={designation.id}
                      />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
              {errors.designation && (
                <HStack className="mt-1 items-center" space="xs">
                  <AlertCircle size={14} color="#EF4444" />
                  <Text className="text-red-500 text-sm">{errors.designation}</Text>
                </HStack>
              )}
            </FormControl>
          </VStack>

          {/* Password Section */}
          <VStack space="sm" className="mt-4">
            <Text className="text-lg font-semibold text-gray-800">Security</Text>

            {/* Password */}
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
                  value={formData.password}
                  onChangeText={(value) => updateField('password', value)}
                />
              </Input>
              {errors.password && (
                <HStack className="mt-1 items-center" space="xs">
                  <AlertCircle size={14} color="#EF4444" />
                  <Text className="text-red-500 text-sm">{errors.password}</Text>
                </HStack>
              )}
              <Text className="text-gray-500 text-sm mt-1">
                Minimum 8 characters with uppercase, lowercase and numbers
              </Text>
            </FormControl>

            {/* Confirm Password */}
            <FormControl isInvalid={!!errors.confirmPassword}>
              <FormControlLabel>
                <FormControlLabelText className="text-gray-700">
                  Confirm Password
                </FormControlLabelText>
              </FormControlLabel>
              <Input>
                <Box className="mr-3">
                  <Lock size={20} color="#6B7280" />
                </Box>
                <InputField
                  placeholder="••••••••"
                  secureTextEntry
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateField('confirmPassword', value)}
                />
              </Input>
              {errors.confirmPassword && (
                <HStack className="mt-1 items-center" space="xs">
                  <AlertCircle size={14} color="#EF4444" />
                  <Text className="text-red-500 text-sm">{errors.confirmPassword}</Text>
                </HStack>
              )}
            </FormControl>
          </VStack>

          {/* Security Note */}
          <VStack className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200" space="sm">
            <HStack space="sm" className="items-center">
              <Shield size={20} color="#F97316" />
              <Text className="font-semibold text-orange-800">Security Guidelines</Text>
            </HStack>
            <VStack space="xs" className="pl-1">
              <Text className="text-orange-700 text-sm">
                • Use a strong, unique password
              </Text>
              <Text className="text-orange-700 text-sm">
                • Never share your admin credentials
              </Text>
              <Text className="text-orange-700 text-sm">
                • Enable two-factor authentication if available
              </Text>
              <Text className="text-orange-700 text-sm">
                • Log out when not using the system
              </Text>
            </VStack>
          </VStack>
        </VStack>

        {/* Register Button */}
        <Button
          size="lg"
          onPress={handleRegister}
          isDisabled={loading}
          className="mt-4 bg-orange-500 active:bg-orange-600"
        >
          <ButtonText className="text-white font-semibold">
            {loading ? 'Creating Admin Account...' : 'Create Admin Account'}
          </ButtonText>
        </Button>

        {/* Login Link */}
        <HStack className="justify-center py-4">
          <Text className="text-gray-600">Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <Button variant="link" size="sm">
              <ButtonText className="text-orange-500">Sign In</ButtonText>
            </Button>
          </Link>
        </HStack>
      </VStack>
    </Box>
  );
}
