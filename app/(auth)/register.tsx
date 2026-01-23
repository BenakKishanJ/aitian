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
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { isValidOrgEmail, inferUserDetails, UserData } from '@/lib/authUtils';

/* Gluestack UI (local re-exports) */
import { Text } from '@/components/ui/text'
import { Input, InputField, InputSlot, InputIcon } from '@/components/ui/input'
import { Button, ButtonText } from '@/components/ui/button'
import { VStack } from '@/components/ui/vstack'
import { MailIcon, EyeIcon, EyeOffIcon, LockIcon } from '@/components/ui/icon'


export default function RegisterScreen() {
  // --------------------------------------------------
  // State
  // --------------------------------------------------
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
    if (!isValidOrgEmail(email)) {
      Alert.alert('Invalid Email', 'Only organizational emails are allowed.')
      return
    }

    const userDetails = inferUserDetails(email)
    if (!userDetails) {
      Alert.alert('Invalid Email Format', 'Please check your email format.')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const uid = userCredential.user.uid

      const userData: UserData = {
        ...userDetails,
        email,
        createdAt: new Date(),
      }

      await setDoc(doc(db, 'users', uid), userData)

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
              Join AITIAN with your organizational email
            </Text>
          </View>

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
