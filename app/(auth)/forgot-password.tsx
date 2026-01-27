import React, { useState } from "react";
import { router } from "expo-router";
import {
  Mail,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  X,
  ArrowRight,
} from "lucide-react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  Alert as RNAlert,
  View,
  Animated,
  TouchableOpacity,
} from "react-native";

/* Gluestack UI (local re-exports) */
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Icon } from "@/components/ui/icon";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Scroll animation
  const scrollY = new Animated.Value(0);
  const HEADER_MAX_HEIGHT = 280;
  const HEADER_MIN_HEIGHT = 80;
  const COLLAPSE_RANGE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, COLLAPSE_RANGE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: "clamp",
  });

  const imageScale = scrollY.interpolate({
    inputRange: [0, COLLAPSE_RANGE],
    outputRange: [1, 0.4],
    extrapolate: "clamp",
  });

  const validateEmail = () => {
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    setError("");
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (error: any) {
      let message = "Failed to send reset email. Please try again.";

      switch (error.code) {
        case "auth/user-not-found":
          message = "No account found with this email.";
          break;
        case "auth/invalid-email":
          message = "Invalid email address.";
          break;
        case "auth/too-many-requests":
          message = "Too many attempts. Please try again later.";
          break;
      }

      setError(message);
      RNAlert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#D1E7EF]">
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        showsVerticalScrollIndicator={false}
        bounces={false}
        scrollsToTop={false}
        overScrollMode="never"
        contentContainerStyle={{
          backgroundColor: "#D1E7EF",
          flexGrow: 1,
        }}
      >
        {/* Animated Header with Illustration */}
        <Animated.View
          style={{
            height: headerHeight,
            backgroundColor: "#D1E7EF",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            minHeight: HEADER_MIN_HEIGHT,
          }}
        >
          <Animated.Image
            source={require("@/assets/images/login1.png")}
            style={{
              width: 320,
              height: 240,
              transform: [{ scale: imageScale }],
            }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Card Container */}
        <View className="bg-[#1C1C1E] rounded-t-3xl px-6 pt-8 pb-8 flex-1">
          <VStack space="lg">
            {/* Header */}
            <HStack className="items-center mb-2" space="md">
              <TouchableOpacity onPress={() => router.back()}>
                <Icon as={ArrowLeft} size="lg" className="text-[#C5D4CA]" />
              </TouchableOpacity>
              <View className="flex-1" />
              <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                <Icon as={X} size="lg" className="text-[#C5D4CA]" />
              </TouchableOpacity>
            </HStack>

            {success ? (
              <VStack space="lg" className="items-center mt-6">
                {/* Success Icon */}
                <Box
                  className="p-6 rounded-full"
                  style={{ backgroundColor: "#D1E7EF" }}
                >
                  <Icon as={CheckCircle} size="xl" className="text-[#10B981]" />
                </Box>

                {/* Title */}
                <VStack space="sm" className="items-center">
                  <Text className="text-3xl font-bold text-white">
                    Check Your Email
                  </Text>
                  <Text className="text-center text-[#C5D4CA] text-base">
                    We've sent password reset instructions to:
                  </Text>
                  <Text className="text-[#BCF3FF] font-semibold text-lg">
                    {email}
                  </Text>
                </VStack>

                {/* Success Message */}
                <View
                  className="w-full p-4 rounded-2xl border-l-4"
                  style={{
                    backgroundColor: "#2A2A2D",
                    borderLeftColor: "#10B981",
                  }}
                >
                  <HStack space="md" className="items-start">
                    <Icon
                      as={CheckCircle}
                      size="md"
                      className="text-[#10B981] mt-1"
                    />
                    <Text className="text-[#C5D4CA] flex-1 text-sm leading-5">
                      If you don't see the email, check your spam folder.
                    </Text>
                  </HStack>
                </View>

                {/* Return to Login Button */}
                <Button
                  onPress={() => router.replace("/(auth)/login")}
                  className="bg-[#BCF3FF] rounded-lg disabled:opacity-60 w-full"
                  size="lg"
                >
                  <ButtonText className="text-black font-semibold text-lg">
                    Return to Login
                  </ButtonText>
                  <Icon as={ArrowRight} size="md" className="ml-2 text-black" />
                </Button>

                {/* Divider */}
                <HStack className="items-center my-2 w-full">
                  <View className="flex-1 h-px bg-[#2A2A2D]" />
                  <Text className="mx-4 text-[#C5D4CA] text-sm">or</Text>
                  <View className="flex-1 h-px bg-[#2A2A2D]" />
                </HStack>

                {/* Reset Another Email Button */}
                <TouchableOpacity
                  onPress={() => {
                    setSuccess(false);
                    setEmail("");
                  }}
                  className="w-full"
                >
                  <View className="border-2 border-[#C5D4CA] rounded-lg py-3 items-center">
                    <Text className="text-[#C5D4CA] font-semibold">
                      Reset Another Email
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Footer */}
                <View className="mt-4 pb-2">
                  <Text className="text-center text-xs text-[#C5D4CA]">
                    By continuing, you agree to our Terms & Privacy Policy
                  </Text>
                </View>
              </VStack>
            ) : (
              <VStack space="lg">
                {/* Title */}
                <VStack space="sm">
                  <Text className="text-3xl font-bold text-white">
                    Reset Password
                  </Text>
                  <Text className="text-[#C5D4CA] text-base">
                    Enter your email address and we'll send you instructions to
                    reset your password.
                  </Text>
                </VStack>

                {/* Info Box */}
                <View
                  className="w-full p-4 rounded-2xl border-l-4"
                  style={{
                    backgroundColor: "#2A2A2D",
                    borderLeftColor: "#BCF3FF",
                  }}
                >
                  <HStack space="md" className="items-start">
                    <Icon
                      as={AlertCircle}
                      size="md"
                      className="text-[#BCF3FF] mt-1"
                    />
                    <Text className="text-[#C5D4CA] flex-1 text-sm leading-5">
                      Use the email you registered with
                    </Text>
                  </HStack>
                </View>

                {/* Email Input */}
                <FormControl isInvalid={!!error}>
                  <FormControlLabel>
                    <FormControlLabelText className="text-[#C5D4CA] font-medium mb-2">
                      Email Address
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Input className="bg-[#2A2A2D] rounded-lg border-0" size="lg">
                    <InputSlot className="pl-3">
                      <Icon as={Mail} size="sm" className="text-[#C5D4CA]" />
                    </InputSlot>
                    <InputField
                      value={email}
                      onChangeText={(value) => {
                        setEmail(value);
                        if (error) setError("");
                      }}
                      placeholder="you@college.edu"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor="#6B7280"
                      className="text-white"
                    />
                  </Input>
                  {error && (
                    <HStack className="mt-1 items-center" space="xs">
                      <Icon
                        as={AlertCircle}
                        size="sm"
                        className="text-red-500"
                      />
                      <Text className="text-red-500 text-sm">{error}</Text>
                    </HStack>
                  )}
                </FormControl>

                {/* Send Button */}
                <Button
                  onPress={handleResetPassword}
                  disabled={loading}
                  className="bg-[#BCF3FF] rounded-lg disabled:opacity-60 w-full"
                  size="lg"
                >
                  <ButtonText className="text-black font-semibold text-lg">
                    {loading ? "Sending..." : "Send Reset Instructions"}
                  </ButtonText>
                  <Icon as={ArrowRight} size="md" className="ml-2 text-black" />
                </Button>

                {/* Divider */}
                <HStack className="items-center my-2">
                  <View className="flex-1 h-px bg-[#2A2A2D]" />
                  <Text className="mx-4 text-[#C5D4CA] text-sm">or</Text>
                  <View className="flex-1 h-px bg-[#2A2A2D]" />
                </HStack>

                {/* Back to Login Button */}
                <TouchableOpacity onPress={() => router.back()}>
                  <View className="border-2 border-[#C5D4CA] rounded-lg py-3 items-center">
                    <Text className="text-[#C5D4CA] font-semibold">
                      Back to Sign In
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Footer */}
                <View className="mt-4 pb-2">
                  <Text className="text-center text-xs text-[#C5D4CA]">
                    By continuing, you agree to our Terms & Privacy Policy
                  </Text>
                </View>
              </VStack>
            )}
          </VStack>
        </View>
      </Animated.ScrollView>
    </View>
  );
}
