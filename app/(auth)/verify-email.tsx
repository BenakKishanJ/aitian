import React, { useState, useEffect } from "react";
import { router } from "expo-router";
import {
  MailCheck,
  MailWarning,
  RefreshCw,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Zap,
} from "lucide-react-native";
import { auth } from "@/lib/firebase";
import { sendEmailVerification, reload } from "firebase/auth";
import { Alert, View, Animated, TouchableOpacity } from "react-native";

/* Gluestack UI (local re-exports) */
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export default function VerifyEmailScreen() {
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [userEmail, setUserEmail] = useState("");

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

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      router.replace("/(auth)/login");
      return;
    }

    setUserEmail(user.email || "");
    setIsVerified(user.emailVerified);

    // Check verification status every 5 seconds
    const interval = setInterval(async () => {
      await user.reload();
      if (user.emailVerified && !isVerified) {
        setIsVerified(true);
        clearInterval(interval);

        // Redirect after verification
        setTimeout(() => {
          router.replace("/(tabs)/home");
        }, 2000);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendVerification = async () => {
    if (cooldown > 0) return;

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace("/(auth)/login");
        return;
      }

      await sendEmailVerification(user);
      setVerificationSent(true);
      setCooldown(60); // 60 seconds cooldown

      Alert.alert(
        "Verification Email Sent",
        "Please check your inbox and spam folder.",
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        "Failed to send verification email. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (isVerified) {
      router.replace("/(tabs)/home");
    } else {
      Alert.alert(
        "Email Not Verified",
        "Please verify your email before continuing.",
      );
    }
  };

  // TEST ONLY: Skip to homepage directly
  const handleTestSkip = () => {
    router.replace("/(tabs)/home");
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

            {isVerified ? (
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
                    Email Verified!
                  </Text>
                  <Text className="text-center text-[#C5D4CA] text-base">
                    Your email has been successfully verified.
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
                      You're all set! You can now access all features of the
                      app.
                    </Text>
                  </HStack>
                </View>

                {/* Continue Button */}
                <Button
                  onPress={handleContinue}
                  className="bg-[#BCF3FF] rounded-lg disabled:opacity-60 w-full mt-4"
                  size="lg"
                >
                  <ButtonText className="text-black font-semibold text-lg">
                    Continue to App
                  </ButtonText>
                  <Icon as={ArrowRight} size="md" className="ml-2 text-black" />
                </Button>

                {/* Auto-redirect notice */}
                <Text className="text-[#C5D4CA] text-sm">
                  Redirecting you in a moment...
                </Text>
              </VStack>
            ) : (
              <VStack space="lg">
                {/* Title */}
                <VStack space="sm">
                  <Text className="text-3xl font-bold text-white">
                    Verify Your Email
                  </Text>
                  <Text className="text-[#C5D4CA] text-base">
                    We've sent a verification link to:
                  </Text>
                  <Text className="text-[#BCF3FF] font-semibold text-lg">
                    {userEmail}
                  </Text>
                </VStack>

                {/* Instructions Box */}
                <View
                  className="w-full p-4 rounded-2xl border-l-4"
                  style={{
                    backgroundColor: "#2A2A2D",
                    borderLeftColor: "#BCF3FF",
                  }}
                >
                  <VStack space="sm">
                    <Text className="font-semibold text-white">
                      Instructions:
                    </Text>
                    <VStack space="xs" className="pl-1">
                      <Text className="text-[#C5D4CA] text-sm">
                        1. Check your email inbox
                      </Text>
                      <Text className="text-[#C5D4CA] text-sm">
                        2. Click the verification link in the email
                      </Text>
                      <Text className="text-[#C5D4CA] text-sm">
                        3. Return to this screen
                      </Text>
                    </VStack>
                    <Text className="text-[#C5D4CA] text-sm mt-2">
                      Can't find the email? Check your spam folder.
                    </Text>
                  </VStack>
                </View>

                {/* Status Message */}
                {verificationSent && (
                  <HStack
                    className="w-full p-3 rounded-lg items-center border-l-4"
                    space="md"
                    style={{
                      backgroundColor: "#2A2A2D",
                      borderLeftColor: "#10B981",
                    }}
                  >
                    <Icon as={MailCheck} size="md" className="text-[#10B981]" />
                    <Text className="text-[#C5D4CA] text-sm">
                      New verification email sent!
                    </Text>
                  </HStack>
                )}

                {/* Resend Button */}
                <Button
                  onPress={handleResendVerification}
                  disabled={loading || cooldown > 0}
                  className="bg-[#BCF3FF] rounded-lg disabled:opacity-60 w-full"
                  size="lg"
                >
                  <HStack className="items-center justify-center" space="sm">
                    {loading ? (
                      <Icon
                        as={RefreshCw}
                        size="md"
                        className="text-black animate-spin"
                      />
                    ) : (
                      <Icon as={MailCheck} size="md" className="text-black" />
                    )}
                    <ButtonText className="text-black font-semibold text-lg">
                      {cooldown > 0
                        ? `Resend in ${cooldown}s`
                        : loading
                          ? "Sending..."
                          : "Resend Verification Email"}
                    </ButtonText>
                  </HStack>
                </Button>

                {/* TEST ONLY: Skip to Homepage Button */}
                <Button
                  onPress={handleTestSkip}
                  className="bg-[#FFA500] rounded-lg w-full"
                  size="lg"
                >
                  <HStack className="items-center justify-center" space="sm">
                    <Icon as={Zap} size="md" className="text-white" />
                    <ButtonText className="text-white font-semibold text-lg">
                      🧪 Test: Skip to Homepage
                    </ButtonText>
                  </HStack>
                </Button>

                {/* Warning for test button */}
                <View
                  className="w-full p-3 rounded-lg border-l-4"
                  style={{
                    backgroundColor: "#2A2A2D",
                    borderLeftColor: "#FFA500",
                  }}
                >
                  <HStack space="md" className="items-start">
                    <Icon
                      as={MailWarning}
                      size="sm"
                      className="text-[#FFA500] mt-1"
                    />
                    <Text className="text-[#C5D4CA] flex-1 text-xs leading-4">
                      ⚠️ Testing only: Skip directly to homepage without
                      verification. Remove before production!
                    </Text>
                  </HStack>
                </View>

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
                      Back to Login
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
