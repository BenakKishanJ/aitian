import React, { useState, useEffect } from 'react';
import { Link, router } from 'expo-router';
import { Alert as RAlert } from 'react-native';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Shield,
  ChevronDown,
  AlertCircle,
  Phone,
  GraduationCap,
  CheckCircle,
} from 'lucide-react-native';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
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

// Alert
import {
  Alert,
  AlertIcon,
  AlertText,
} from '@/components/ui/alert'

export default function RegisterParentScreen() {
  const [loading, setLoading] = useState(false);
  const [searchingStudent, setSearchingStudent] = useState(false);
  const [studentFound, setStudentFound] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    studentUSN: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [studentError, setStudentError] = useState('');

  // Search for student when USN changes
  useEffect(() => {
    const searchStudent = async () => {
      const usn = formData.studentUSN.trim().toUpperCase();
      if (!usn || usn.length < 3) {
        setStudentFound(null);
        return;
      }

      setSearchingStudent(true);
      setStudentError('');

      try {
        // Search for student by USN
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          where('role', '==', 'student'),
          where('usn', '>=', usn),
          where('usn', '<=', usn + '\uf8ff')
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setStudentFound(null);
          setStudentError('No student found with this USN');
        } else {
          const studentDoc = querySnapshot.docs[0];
          const studentData = studentDoc.data();
          setStudentFound({
            id: studentDoc.id,
            ...studentData,
          });
          setStudentError('');
        }
      } catch (error) {
        console.error('Error searching student:', error);
        setStudentError('Error searching for student');
        setStudentFound(null);
      } finally {
        setSearchingStudent(false);
      }
    };

    const delaySearch = setTimeout(searchStudent, 500);
    return () => clearTimeout(delaySearch);
  }, [formData.studentUSN]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) newErrors.name = 'Name is required';

    // Email validation (any email allowed for parents)
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';

    // Password validation
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Minimum 6 characters';

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Student USN validation
    if (!formData.studentUSN.trim()) {
      newErrors.studentUSN = 'Student USN is required';
    } else if (!studentFound) {
      newErrors.studentUSN = 'Please select a valid student';
    }

    // Phone validation (optional but if provided, validate)
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    if (!studentFound) {
      RAlert.alert('Error', 'Please select a valid student');
      return;
    }

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
        role: 'parent' as const,
        name: formData.name.trim(),
        email: formData.email,
        phone: formData.phone || null,
        linkedStudentIds: [], // Empty until student approves
        pendingStudentIds: [studentFound.id], // Student ID waiting for approval
        maxStudents: 5,
        isActive: true,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);

      // 4. Create parent link request
      const linkId = `${userCredential.user.uid}_${studentFound.id}`;
      await setDoc(doc(db, 'parentLinks', linkId), {
        parentId: userCredential.user.uid,
        parentName: formData.name.trim(),
        studentId: studentFound.id,
        studentName: studentFound.name,
        studentUSN: studentFound.usn,
        status: 'pending',
        requestedAt: serverTimestamp(),
        approvedAt: null,
      });

      // 5. Add notification to student
      await setDoc(doc(db, 'notifications', `${studentFound.id}_parent_${Date.now()}`), {
        userId: studentFound.id,
        type: 'parent_link_request',
        title: 'Parent Link Request',
        message: `${formData.name} wants to link with your account`,
        data: {
          parentId: userCredential.user.uid,
          parentName: formData.name,
          linkId: linkId,
        },
        isRead: false,
        createdAt: serverTimestamp(),
      });

      // 6. Show success message
      RAlert.alert(
        'Registration Successful!',
        `Your account has been created. A link request has been sent to ${studentFound.name}. You will have limited access until they approve.`,
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
          Parent Registration
        </Heading>
        <Box className="w-10" />
      </HStack>

      {/* Form */}
      <VStack className="flex-1 p-6" space="md">
        <VStack space="md" className="flex-1">
          {/* Personal Details */}
          <VStack space="sm">
            <Text className="text-lg font-semibold text-gray-800">Parent Details</Text>

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
                Use any email address
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

          {/* Student Link Section */}
          <VStack space="sm" className="mt-4">
            <Text className="text-lg font-semibold text-gray-800">Link to Student</Text>

            {/* Student USN Search */}
            <FormControl isInvalid={!!errors.studentUSN}>
              <FormControlLabel>
                <FormControlLabelText className="text-gray-700">
                  Student USN
                </FormControlLabelText>
              </FormControlLabel>
              <Input>
                <Box className="mr-3">
                  <GraduationCap size={20} color="#6B7280" />
                </Box>
                <InputField
                  placeholder="1DA22CS021"
                  autoCapitalize="characters"
                  value={formData.studentUSN}
                  onChangeText={(value) => updateField('studentUSN', value)}
                />
              </Input>
              {errors.studentUSN && (
                <HStack className="mt-1 items-center" space="xs">
                  <AlertCircle size={14} color="#EF4444" />
                  <Text className="text-red-500 text-sm">{errors.studentUSN}</Text>
                </HStack>
              )}
              {studentError && !studentFound && (
                <HStack className="mt-1 items-center" space="xs">
                  <AlertCircle size={14} color="#EF4444" />
                  <Text className="text-red-500 text-sm">{studentError}</Text>
                </HStack>
              )}
            </FormControl>

            {/* Student Found Preview */}
            {searchingStudent ? (
              <HStack className="p-4 bg-gray-50 rounded-lg items-center" space="sm">
                <Box className="animate-spin">
                  <AlertCircle size={20} color="#6B7280" />
                </Box>
                <Text className="text-gray-600">Searching for student...</Text>
              </HStack>
            ) : studentFound ? (
              <Alert className="bg-green-50 border border-green-200" action="success">
                <AlertIcon as={CheckCircle} className="text-green-500" />
                <AlertText className="text-green-800">
                  Student Found: {studentFound.name} ({studentFound.usn})
                  {'\n'}
                  <Text className="text-green-700 text-sm">
                    {studentFound.department} • Semester {studentFound.semester} • Section {studentFound.section}
                  </Text>
                </AlertText>
              </Alert>
            ) : null}
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

          {/* Important Information */}
          <VStack className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200" space="sm">
            <HStack space="sm" className="items-center">
              <Shield size={20} color="#8B5CF6" />
              <Text className="font-semibold text-purple-800">Important Information</Text>
            </HStack>
            <VStack space="xs" className="pl-1">
              <Text className="text-purple-700 text-sm">
                • You can link to maximum 5 students
              </Text>
              <Text className="text-purple-700 text-sm">
                • Student must approve your request
              </Text>
              <Text className="text-purple-700 text-sm">
                • You will have read-only access to student data
              </Text>
              <Text className="text-purple-700 text-sm">
                • Student can revoke access anytime
              </Text>
              <Text className="text-purple-700 text-sm mt-2">
                Until approved, you'll see only general college information.
              </Text>
            </VStack>
          </VStack>
        </VStack>

        {/* Register Button */}
        <Button
          size="lg"
          onPress={handleRegister}
          isDisabled={loading || !studentFound}
          className={`mt-4 ${!studentFound ? 'bg-gray-400' : 'bg-purple-500 active:bg-purple-600'}`}
        >
          <ButtonText className="text-white font-semibold">
            {loading ? 'Creating Account...' : 'Create Parent Account'}
          </ButtonText>
        </Button>

        {/* Login Link */}
        <HStack className="justify-center py-4">
          <Text className="text-gray-600">Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <Button variant="link" size="sm">
              <ButtonText className="text-purple-500">Sign In</ButtonText>
            </Button>
          </Link>
        </HStack>
      </VStack>
    </Box>
  );
}
