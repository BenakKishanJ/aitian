import { useState } from 'react'
import {
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'

/* Gluestack UI (local re-exports) */
import { Text } from '@/components/ui/text'
import { Input, InputField } from '@/components/ui/input'
import { Button, ButtonText } from '@/components/ui/button'
import { VStack } from '@/components/ui/vstack'

export default function ParentLinkScreen() {
  const [studentEmail, setStudentEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSendRequest = async () => {
    // TODO: Implement sending link request to student
    Alert.alert('Request Sent', 'A link request has been sent to the student.')
    router.replace('/login')
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#D1E7EF]"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1 bg-[#1C1C1E] rounded-t-3xl px-6 pt-12">
        <VStack space="lg" className="flex-1">
          <View>
            <Text className="text-4xl font-semibold text-white">
              Link to Student
            </Text>
            <Text className="text-[#C5D4CA] text-sm mt-1 pb-8">
              Enter student's email to send a link request
            </Text>
          </View>

          <Input className="bg-[#2A2A2D] rounded-md border-0" size='xl'>
            <InputField
              value={studentEmail}
              onChangeText={setStudentEmail}
              placeholder="Student Email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#C5D4CA"
              className="text-white"
            />
          </Input>

          <Button
            onPress={handleSendRequest}
            disabled={loading}
            className="bg-[#C5D4CA] rounded-md disabled:opacity-60"
            size='xl'
          >
            <ButtonText className="text-black font-semibold text-xl">
              Send Request
            </ButtonText>
          </Button>

          <View className="flex-1" />
        </VStack>
      </View>
    </KeyboardAvoidingView>
  )
}