import { useState } from 'react'
import {
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { isValidOrgEmail, inferUserDetails } from '@/lib/authUtils';

/* Gluestack UI (local re-exports) */
import { Text } from '@/components/ui/text'
import { Input, InputField, InputSlot, InputIcon } from '@/components/ui/input'
import { Button, ButtonText } from '@/components/ui/button'
import { VStack } from '@/components/ui/vstack'
import { TouchableOpacity } from 'react-native'
import { MailIcon, EyeIcon, EyeOffIcon, LockIcon } from '@/components/ui/icon'

export default function LoginScreen() {
  // --------------------------------------------------
  // State
  // --------------------------------------------------
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false);
  const handlePassState = () => {
    setShowPassword((showState) => {
      return !showState;
    });
  };
  const router = useRouter()

  // --------------------------------------------------
  // Login Handler (KEEP YOUR EXISTING LOGIC HERE)
  // --------------------------------------------------

  const handleLogin = async () => {
    if (!isValidOrgEmail(email)) {
      Alert.alert('Invalid Email', 'Only organizational emails are allowed.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect will be handled by _layout.tsx
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid credentials.');
      console.log(error);
    } finally {
      setLoading(false);
    }
  };


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
          Login Card
      --------------------------------------------------- */}
      <View className="flex-1 bg-[#1C1C1E] rounded-t-3xl px-6 pt-12">
        <VStack space="lg" className="flex-1">
          {/* Header */}
          <View>
            <Text className="text-4xl font-semibold text-white">
              Welcome back
            </Text>
            <Text className="text-[#C5D4CA] text-sm mt-1 pb-8">
              Sign in to continue
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
            <InputSlot className="pr-3" onPress={handlePassState}>
              <InputIcon as={showPassword ? EyeIcon : EyeOffIcon} />
            </InputSlot>
          </Input>

          {/* Login Button */}
          <Button
            onPress={handleLogin}
            disabled={loading}
            className="bg-[#C5D4CA] ded-md disabled:opacity-60"
            size='xl'
          >
            <ButtonText className="text-black font-semibold text-xl">
              {loading ? 'Signing in...' : 'Login'}
            </ButtonText>
          </Button>

          {/* Register Link */}
          <View className="mt-4">
            <Text className="text-center text-[#C5D4CA] text-sm">
              Don’t have an account?{' '}
               <TouchableOpacity onPress={() => router.push('/register')}>
                 <Text
                   className="text-[#F9CD61] font-semibold"
                   onPress={() => router.push('/register')}
                 >
                   Register
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

