import React, { useState } from "react";
import {
  View,
  Animated,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react-native";

/* Gluestack UI components */
import { Text } from "@/components/ui/text";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Icon } from "@/components/ui/icon";

export default function LoginScreen() {
  // --------------------------------------------------
  // State
  // --------------------------------------------------
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const router = useRouter();

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

  // Validate form
  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = "Please enter a valid email";

    if (!password) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --------------------------------------------------
  // Login Handler
  // --------------------------------------------------
  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/");
    } catch (error: any) {
      let message = "Login failed. Please check your credentials.";

      switch (error.code) {
        case "auth/user-not-found":
          message = "No account found with this email.";
          break;
        case "auth/wrong-password":
          message = "Incorrect password.";
          break;
        case "auth/invalid-email":
          message = "Invalid email address.";
          break;
        case "auth/too-many-requests":
          message = "Too many attempts. Please try again later.";
          break;
        case "auth/user-disabled":
          message = "Account disabled. Please contact admin.";
          break;
      }

      Alert.alert("Login Error", message);
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
        {/* --------------------------------------------------
            Animated Header with Illustration
        --------------------------------------------------- */}
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

        {/* --------------------------------------------------
            Login Card
        --------------------------------------------------- */}
        <View className="bg-[#1C1C1E] rounded-t-3xl px-6 pt-8 pb-8 flex-1">
          <VStack space="lg">
            {/* Header */}
            <View>
              <Text className="text-3xl font-bold text-white mb-1">
                Welcome Back
              </Text>
              <Text className="text-[#C5D4CA] text-base mb-6">
                Sign in to access your academic dashboard
              </Text>
            </View>

            {/* Email Input */}
            <FormControl isInvalid={!!errors.email}>
              <FormControlLabel>
                <FormControlLabelText className="text-[#C5D4CA] font-medium mb-2">
                  College Email
                </FormControlLabelText>
              </FormControlLabel>
              <Input className="bg-[#2A2A2D] rounded-lg border-0" size="lg">
                <InputSlot className="pl-3">
                  <Icon as={Mail} size="sm" className="text-[#C5D4CA]" />
                </InputSlot>
                <InputField
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@college.edu"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#6B7280"
                  className="text-white"
                />
              </Input>
              {errors.email && (
                <HStack className="mt-1 items-center" space="xs">
                  <Icon as={AlertCircle} size="sm" className="text-red-500" />
                  <Text className="text-red-500 text-sm">{errors.email}</Text>
                </HStack>
              )}
            </FormControl>

            {/* Password Input */}
            <FormControl isInvalid={!!errors.password}>
              <FormControlLabel>
                <FormControlLabelText className="text-[#C5D4CA] font-medium mb-2">
                  Password
                </FormControlLabelText>
              </FormControlLabel>
              <Input className="bg-[#2A2A2D] rounded-lg border-0" size="lg">
                <InputSlot className="pl-3">
                  <Icon as={Lock} size="sm" className="text-[#C5D4CA]" />
                </InputSlot>
                <InputField
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#6B7280"
                  className="text-white"
                  type={showPassword ? "text" : "password"}
                />
                <InputSlot
                  className="pr-3"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Icon
                    as={showPassword ? EyeOff : Eye}
                    size="sm"
                    className="text-[#C5D4CA]"
                  />
                </InputSlot>
              </Input>
              {errors.password && (
                <HStack className="mt-1 items-center" space="xs">
                  <Icon as={AlertCircle} size="sm" className="text-red-500" />
                  <Text className="text-red-500 text-sm">
                    {errors.password}
                  </Text>
                </HStack>
              )}
            </FormControl>

            {/* Forgot Password Link */}
            <View className="items-end mb-2">
              <TouchableOpacity
                onPress={() => router.push("/(auth)/forgot-password")}
              >
                <Text className="text-[#BCF3FF] text-sm font-medium">
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <Button
              onPress={handleLogin}
              disabled={loading}
              className="bg-[#BCF3FF] rounded-lg disabled:opacity-60 mt-2"
              size="lg"
            >
              <ButtonText className="text-black font-semibold text-lg">
                {loading ? "Signing in..." : "Sign In"}
              </ButtonText>
              <Icon as={ArrowRight} size="md" className="ml-2 text-black" />
            </Button>

            {/* Divider */}
            <HStack className="items-center my-4">
              <View className="flex-1 h-px bg-[#2A2A2D]" />
              <Text className="mx-4 text-[#C5D4CA] text-sm">or</Text>
              <View className="flex-1 h-px bg-[#2A2A2D]" />
            </HStack>

            {/* Register Links */}
            <VStack space="sm">
              <Text className="text-center text-[#C5D4CA]">
                Don't have an account?
              </Text>

              <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <View className="border border-[#C5D4CA] rounded-lg py-3 items-center">
                  <Text className="text-[#C5D4CA] font-medium">
                    Create Account
                  </Text>
                </View>
              </TouchableOpacity>

              <HStack className="justify-center mt-3" space="md">
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/register-student")}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: "#BCF3FF" }}
                  >
                    Student
                  </Text>
                </TouchableOpacity>
                <Text className="text-[#C5D4CA]">•</Text>
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/register-teacher")}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: "#F65F50" }}
                  >
                    Teacher
                  </Text>
                </TouchableOpacity>
                <Text className="text-[#C5D4CA]">•</Text>
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/register-parent")}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: "#F9CD61" }}
                  >
                    Parent
                  </Text>
                </TouchableOpacity>
              </HStack>
            </VStack>

            {/* Footer */}
            <View className="mt-6 pb-6">
              <Text className="text-center text-xs text-[#C5D4CA]">
                By continuing, you agree to our Terms & Privacy Policy
              </Text>
            </View>
          </VStack>
        </View>
      </Animated.ScrollView>
    </View>
  );
}
