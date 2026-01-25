import React, { useState } from 'react'
import {
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { inferUserDetails } from '@/lib/roleUtils';
import { UserData } from '@/lib/authUtils';

/* Gluestack UI (local re-exports) */
import { Text } from '@/components/ui/text'
import { Input, InputField, InputSlot, InputIcon } from '@/components/ui/input'
import { Button, ButtonText } from '@/components/ui/button'
import { VStack } from '@/components/ui/vstack'
import { MailIcon, EyeIcon, EyeOffIcon, LockIcon, SettingsIcon } from '@/components/ui/icon'


export default function RegisterScreen() {
  // --------------------------------------------------
  // State
  // --------------------------------------------------
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const router = useRouter()

  // Password visibility handlers
  const handlePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState)
  }

  const handleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prevState) => !prevState)
  }

  // --------------------------------------------------
  // Register Handler (KEEP YOUR EXISTING LOGIC HERE)
  // --------------------------------------------------
  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your full name.')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      const userDetails = inferUserDetails(email)
      
      if (!userDetails) {
        Alert.alert('Invalid Email', 'Please check your email format.')
        return
      }

      const userData: UserData = {
        uid: userCredential.user.uid,
        profileComplete: userDetails.role === 'parent' ? false : true,
        role: userDetails.role,
        name: name.trim(),
        email,
        createdAt: serverTimestamp(),
        ...(userDetails.batch && { batch: userDetails.batch }),
        ...(userDetails.dept && { dept: userDetails.dept }),
        ...(userDetails.usn && { usn: userDetails.usn }),
      }

      await setDoc(doc(db, 'users', userCredential.user.uid), userData)

      // Redirect will be handled by _layout.tsx
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error?.message ?? 'An error occurred during registration.'
      )
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#D1E7EF]"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* --------------------------------------------------
          Illustration Section
      --------------------------------------------------- */}
      <View className="items-center pt-24 pb-0">
        <Image
          source={require('@/assets/images/login1.png')}
          className="w-112 h-80"
          resizeMode="contain"
        />
      </View>

      {/* --------------------------------------------------
          Register Card
      --------------------------------------------------- */}
      <View className="flex-1 bg-[#1C1C1E] rounded-t-3xl px-6 pt-12">
        <VStack space="lg" className="flex-1">
          {/* Header */}
          <View>
            <Text className="text-4xl font-semibold text-white">
              Create Account
            </Text>
            <Text className="text-[#C5D4CA] text-sm mt-1 pb-8">
              Use your college email if you are a student or teacher.
              Parents may use any email address.
            </Text>
          </View>

          {/* Name Input */}
          <Input className="bg-[#2A2A2D] rounded-md border-0" size='xl'>
            <InputField
              value={name}
              onChangeText={setName}
              placeholder="Full Name"
              placeholderTextColor="#C5D4CA"
              className="text-white pl-4"
            />
          </Input>

          {/* Email Input */}
          <Input className="bg-[#2A2A2D] rounded-md border-0" size='xl'>
            <InputSlot className='pl-4'>
              <InputIcon as={MailIcon} />
            </InputSlot>
            <InputField
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#C5D4CA"
              className="text-white"
            />
          </Input>

          {/* Password Input */}
          <Input className="bg-[#2A2A2D] rounded-md border-0" size='xl'>
            <InputSlot className='pl-4'>
              <InputIcon as={LockIcon} />
            </InputSlot>
            <InputField
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#C5D4CA"
              className="text-white"
              type={showPassword ? 'text' : 'password'}
            />
            <InputSlot className="pr-3" onPress={handlePasswordVisibility}>
              <InputIcon as={showPassword ? EyeIcon : EyeOffIcon} />
            </InputSlot>
          </Input>

          {/* Confirm Password Input */}
          <Input className="bg-[#2A2A2D] rounded-md border-0" size='xl'>
            <InputSlot className='pl-4'>
              <InputIcon as={LockIcon} />
            </InputSlot>
            <InputField
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm Password"
              placeholderTextColor="#C5D4CA"
              className="text-white"
              type={showConfirmPassword ? 'text' : 'password'}
            />
            <InputSlot className="pr-3" onPress={handleConfirmPasswordVisibility}>
              <InputIcon as={showConfirmPassword ? EyeIcon : EyeOffIcon} />
            </InputSlot>
          </Input>

          {/* Register Button */}
          <Button
            onPress={handleRegister}
            disabled={loading}
            className="bg-[#C5D4CA] ded-md disabled:opacity-60"
            size='xl'
          >
            <ButtonText className="text-black font-semibold text-xl">
              {loading ? 'Creating Account...' : 'Create Account'}
            </ButtonText>
          </Button>

          {/* Login Link */}
          <View className="mt-4">
            <Text className="text-center text-[#C5D4CA] text-sm">
              Already have an account?{' '}
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text className="text-[#F9CD61] font-semibold">
                  Sign In
                </Text>
              </TouchableOpacity>
            </Text>
          </View>

          {/* Spacer */}
          <View className="flex-1" />

          {/* Footer */}
          <View className="pb-6">
            <Text className="text-center text-xs text-[#C5D4CA]">
              By continuing, you agree to our Terms & Privacy Policy
            </Text>
          </View>
        </VStack>
      </View>
    </KeyboardAvoidingView>
  )
}
