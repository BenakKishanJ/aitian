import React, { useState } from 'react';
import { Link, router } from 'expo-router';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  BookOpen,
  Hash,
  ChevronDown,
  AlertCircle,
  Phone,
} from 'lucide-react-native';
import { Alert } from 'react-native';
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

// Mock departments
const DEPARTMENTS = [
  { id: 'cse', name: 'Computer Science & Engineering', code: 'CSE' },
  { id: 'ece', name: 'Electronics & Communication', code: 'ECE' },
  { id: 'me', name: 'Mechanical Engineering', code: 'ME' },
  { id: 'cv', name: 'Civil Engineering', code: 'CV' },
  { id: 'ee', name: 'Electrical Engineering', code: 'EE' },
];

export default function RegisterTeacherScreen() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    teacherCode: '',
    department: '',
    phone: '',
    qualification: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) newErrors.name = 'Name is required';

    // Email validation
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    else if (!formData.email.endsWith('@drait.edu.in')) newErrors.email = 'Must use college email (@drait.edu.in)';

    // Password validation
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Minimum 6 characters';

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Teacher code validation
    if (!formData.teacherCode) newErrors.teacherCode = 'Teacher code is required';

    // Department validation
    if (!formData.department) newErrors.department = 'Department is required';

    // Phone validation (optional but if provided, validate)
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be 10 digits';
    }

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
        role: 'teacher' as const,
        name: formData.name.trim(),
        email: formData.email,
        teacherCode: formData.teacherCode.toUpperCase(),
        department: formData.department,
        phone: formData.phone || null,
        qualification: formData.qualification || null,
        approvedCourseIds: [],
        pendingCourseIds: [],
        isActive: true,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);

      // 4. Show success message
      Alert.alert(
        'Registration Successful!',
        'Your teacher account has been created. Please verify your email to continue.',
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

      Alert.alert('Registration Error', message);
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
          Teacher Registration
        </Heading>
        <Box className="w-10" />
      </HStack>

      {/* Form */}
      <VStack className="flex-1 p-6" space="md">
        <VStack space="md" className="flex-1">
          {/* Personal Details */}
          <VStack space="sm">
            <Text className="text-lg font-semibold text-gray-800">Personal Details</Text>

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
                  placeholder="faculty@drait.edu.in"
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
                Must end with @drait.edu.in
              </Text>
            </FormControl>

            {/* Phone */}
            <FormControl isInvalid={!!errors.phone}>
              <FormControlLabel>
                <FormControlLabelText className="text-gray-700">
                  Phone Number (Optional)
                </FormControlLabelText>
              </FormControlLabel>
              <Input>
                <Box className="mr-3">
                  <Phone size={20} color="#6B7280" />
                </Box>
                <InputField
                  placeholder="9876543210"
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(value) => updateField('phone', value)}
                />
              </Input>
              {errors.phone && (
                <HStack className="mt-1 items-center" space="xs">
                  <AlertCircle size={14} color="#EF4444" />
                  <Text className="text-red-500 text-sm">{errors.phone}</Text>
                </HStack>
              )}
            </FormControl>
          </VStack>

          {/* Professional Details */}
          <VStack space="sm" className="mt-4">
            <Text className="text-lg font-semibold text-gray-800">Professional Details</Text>

            {/* Teacher Code */}
            <FormControl isInvalid={!!errors.teacherCode}>
              <FormControlLabel>
                <FormControlLabelText className="text-gray-700">
                  Teacher Code/ID
                </FormControlLabelText>
              </FormControlLabel>
              <Input>
                <Box className="mr-3">
                  <Hash size={20} color="#6B7280" />
                </Box>
                <InputField
                  placeholder="TC001"
                  value={formData.teacherCode}
                  onChangeText={(value) => updateField('teacherCode', value)}
                />
              </Input>
              {errors.teacherCode && (
                <HStack className="mt-1 items-center" space="xs">
                  <AlertCircle size={14} color="#EF4444" />
                  <Text className="text-red-500 text-sm">{errors.teacherCode}</Text>
                </HStack>
              )}
            </FormControl>

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
                  <SelectInput placeholder="Select your department" />
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

            {/* Qualification */}
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText className="text-gray-700">
                  Qualification (Optional)
                </FormControlLabelText>
              </FormControlLabel>
              <Input>
                <Box className="mr-3">
                  <BookOpen size={20} color="#6B7280" />
                </Box>
                <InputField
                  placeholder="M.Tech, Ph.D, etc."
                  value={formData.qualification}
                  onChangeText={(value) => updateField('qualification', value)}
                />
              </Input>
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

          {/* Info Note */}
          <HStack className="items-start mt-4 p-4 bg-green-50 rounded-lg" space="sm">
            <BookOpen size={20} color="#10B981" />
            <Text className="flex-1 text-gray-700 text-sm">
              Courses will be assigned by the admin. You can request specific courses after login.
            </Text>
          </HStack>
        </VStack>

        {/* Register Button */}
        <Button
          size="lg"
          onPress={handleRegister}
          isDisabled={loading}
          className="mt-4 bg-green-500 active:bg-green-600"
        >
          <ButtonText className="text-white font-semibold">
            {loading ? 'Creating Account...' : 'Create Teacher Account'}
          </ButtonText>
        </Button>

        {/* Login Link */}
        <HStack className="justify-center py-4">
          <Text className="text-gray-600">Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <Button variant="link" size="sm">
              <ButtonText className="text-green-500">Sign In</ButtonText>
            </Button>
          </Link>
        </HStack>
      </VStack>
    </Box>
  );
}
