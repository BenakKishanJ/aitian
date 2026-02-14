import React, { useState } from "react";
import { View, Animated, Alert, TouchableOpacity } from "react-native";
import { router } from "expo-router";
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
  Eye,
  EyeOff,
} from "lucide-react-native";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { DEPARTMENTS } from "@/types/constants";

/* Gluestack UI (local re-exports) */
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
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
} from "@/components/ui/select";
import { Icon } from "@/components/ui/icon";

export default function RegisterTeacherScreen() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    teacherCode: "",
    department: "",
    phone: "",
    qualification: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";

    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    else if (!formData.email.endsWith("@drait.edu.in"))
      newErrors.email = "Must use college email (@drait.edu.in)";

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Minimum 6 characters";

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.teacherCode)
      newErrors.teacherCode = "Teacher code is required";

    if (!formData.department) newErrors.department = "Department is required";

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone must be 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );

      await sendEmailVerification(userCredential.user);

      const userData = {
        uid: userCredential.user.uid,
        role: "teacher" as const,
        name: formData.name.trim(),
        email: formData.email,
        teacherCode: formData.teacherCode.toUpperCase(),
        departmentId: formData.department,
        phone: formData.phone || null,
        qualification: formData.qualification || null,
        approvedCourseIds: [],
        pendingCourseIds: [],
        isActive: true,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", userCredential.user.uid), userData);

      Alert.alert(
        "Registration Successful!",
        "Your teacher account has been created. Please verify your email to continue.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(auth)/login"),
          },
        ],
      );
    } catch (error: any) {
      let message = "Registration failed. Please try again.";

      switch (error.code) {
        case "auth/email-already-in-use":
          message = "Email already registered. Please login instead.";
          break;
        case "auth/invalid-email":
          message = "Invalid email address.";
          break;
        case "auth/weak-password":
          message = "Password is too weak.";
          break;
        case "auth/operation-not-allowed":
          message = "Registration is currently disabled.";
          break;
      }

      Alert.alert("Registration Error", message);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
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

        {/* Registration Card */}
        <View className="bg-[#1C1C1E] rounded-t-3xl px-6 pt-8 pb-8 flex-1">
          <VStack space="lg" className="flex-1">
            {/* Header */}
            <View>
              <HStack className="items-center mb-4" space="md">
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/register")}
                >
                  <Icon as={ArrowLeft} size="lg" className="text-[#C5D4CA]" />
                </TouchableOpacity>
                <View className="flex-1" />
              </HStack>
              <Text className="text-3xl font-bold text-white mb-2">
                Teacher Registration
              </Text>
              <Text className="text-[#C5D4CA] text-base">
                Create your educator profile
              </Text>
            </View>

            {/* Personal Details Section */}
            <VStack space="md">
              <Text className="text-sm font-semibold text-[#BCF3FF] uppercase tracking-wider">
                Personal Details
              </Text>

              {/* Name */}
              <FormControl isInvalid={!!errors.name}>
                <FormControlLabel>
                  <FormControlLabelText className="text-[#C5D4CA] font-medium mb-2">
                    Full Name
                  </FormControlLabelText>
                </FormControlLabel>
                <Input className="bg-[#2A2A2D] rounded-lg border-0" size="lg">
                  <InputSlot className="pl-3">
                    <Icon as={User} size="sm" className="text-[#C5D4CA]" />
                  </InputSlot>
                  <InputField
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChangeText={(value) => updateField("name", value)}
                    className="text-white"
                    placeholderTextColor="#6B7280"
                  />
                </Input>
                {errors.name && (
                  <HStack className="mt-1 items-center" space="xs">
                    <Icon as={AlertCircle} size="sm" className="text-red-500" />
                    <Text className="text-red-500 text-sm">{errors.name}</Text>
                  </HStack>
                )}
              </FormControl>

              {/* Email */}
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
                    placeholder="faculty@drait.edu.in"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(value) => updateField("email", value)}
                    className="text-white"
                    placeholderTextColor="#6B7280"
                  />
                </Input>
                {errors.email && (
                  <HStack className="mt-1 items-center" space="xs">
                    <Icon as={AlertCircle} size="sm" className="text-red-500" />
                    <Text className="text-red-500 text-sm">{errors.email}</Text>
                  </HStack>
                )}
              </FormControl>

              {/* Phone */}
              <FormControl isInvalid={!!errors.phone}>
                <FormControlLabel>
                  <FormControlLabelText className="text-[#C5D4CA] font-medium mb-2">
                    Phone Number (Optional)
                  </FormControlLabelText>
                </FormControlLabel>
                <Input className="bg-[#2A2A2D] rounded-lg border-0" size="lg">
                  <InputSlot className="pl-3">
                    <Icon as={Phone} size="sm" className="text-[#C5D4CA]" />
                  </InputSlot>
                  <InputField
                    placeholder="9876543210"
                    keyboardType="phone-pad"
                    value={formData.phone}
                    onChangeText={(value) => updateField("phone", value)}
                    className="text-white"
                    placeholderTextColor="#6B7280"
                  />
                </Input>
                {errors.phone && (
                  <HStack className="mt-1 items-center" space="xs">
                    <Icon as={AlertCircle} size="sm" className="text-red-500" />
                    <Text className="text-red-500 text-sm">{errors.phone}</Text>
                  </HStack>
                )}
              </FormControl>
            </VStack>

            {/* Professional Details Section */}
            <VStack space="md">
              <Text className="text-sm font-semibold text-[#F65F50] uppercase tracking-wider">
                Professional Details
              </Text>

              {/* Teacher Code */}
              <FormControl isInvalid={!!errors.teacherCode}>
                <FormControlLabel>
                  <FormControlLabelText className="text-[#C5D4CA] font-medium mb-2">
                    Teacher Code/ID
                  </FormControlLabelText>
                </FormControlLabel>
                <Input className="bg-[#2A2A2D] rounded-lg border-0" size="lg">
                  <InputSlot className="pl-3">
                    <Icon as={Hash} size="sm" className="text-[#C5D4CA]" />
                  </InputSlot>
                  <InputField
                    placeholder="TC001"
                    value={formData.teacherCode}
                    onChangeText={(value) => updateField("teacherCode", value)}
                    className="text-white"
                    placeholderTextColor="#6B7280"
                  />
                </Input>
                {errors.teacherCode && (
                  <HStack className="mt-1 items-center" space="xs">
                    <Icon as={AlertCircle} size="sm" className="text-red-500" />
                    <Text className="text-red-500 text-sm">
                      {errors.teacherCode}
                    </Text>
                  </HStack>
                )}
              </FormControl>

              {/* Department */}
              <FormControl isInvalid={!!errors.department}>
                <FormControlLabel>
                  <FormControlLabelText className="text-[#C5D4CA] font-medium mb-2">
                    Department
                  </FormControlLabelText>
                </FormControlLabel>
                <Select
                  selectedValue={formData.department}
                  onValueChange={(value) => updateField("department", value)}
                >
                  <SelectTrigger className="bg-[#2A2A2D] rounded-lg border-0">
                    <SelectInput
                      placeholder="Select your department"
                      className="text-white"
                    />
                    <SelectIcon as={ChevronDown} className="text-[#C5D4CA]" />
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
                          label={`${dept.code} - ${dept.name}`}
                          value={dept.id}
                        />
                      ))}
                    </SelectContent>
                  </SelectPortal>
                </Select>
                {errors.department && (
                  <HStack className="mt-1 items-center" space="xs">
                    <Icon as={AlertCircle} size="sm" className="text-red-500" />
                    <Text className="text-red-500 text-sm">
                      {errors.department}
                    </Text>
                  </HStack>
                )}
              </FormControl>

              {/* Qualification */}
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText className="text-[#C5D4CA] font-medium mb-2">
                    Qualification (Optional)
                  </FormControlLabelText>
                </FormControlLabel>
                <Input className="bg-[#2A2A2D] rounded-lg border-0" size="lg">
                  <InputSlot className="pl-3">
                    <Icon as={BookOpen} size="sm" className="text-[#C5D4CA]" />
                  </InputSlot>
                  <InputField
                    placeholder="M.Tech, Ph.D, etc."
                    value={formData.qualification}
                    onChangeText={(value) =>
                      updateField("qualification", value)
                    }
                    className="text-white"
                    placeholderTextColor="#6B7280"
                  />
                </Input>
              </FormControl>
            </VStack>

            {/* Security Section */}
            <VStack space="md">
              <Text className="text-sm font-semibold text-[#F9CD61] uppercase tracking-wider">
                Security
              </Text>

              {/* Password */}
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
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    value={formData.password}
                    onChangeText={(value) => updateField("password", value)}
                    className="text-white"
                    placeholderTextColor="#6B7280"
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

              {/* Confirm Password */}
              <FormControl isInvalid={!!errors.confirmPassword}>
                <FormControlLabel>
                  <FormControlLabelText className="text-[#C5D4CA] font-medium mb-2">
                    Confirm Password
                  </FormControlLabelText>
                </FormControlLabel>
                <Input className="bg-[#2A2A2D] rounded-lg border-0" size="lg">
                  <InputSlot className="pl-3">
                    <Icon as={Lock} size="sm" className="text-[#C5D4CA]" />
                  </InputSlot>
                  <InputField
                    placeholder="••••••••"
                    secureTextEntry={!showConfirmPassword}
                    value={formData.confirmPassword}
                    onChangeText={(value) =>
                      updateField("confirmPassword", value)
                    }
                    className="text-white"
                    placeholderTextColor="#6B7280"
                  />
                  <InputSlot
                    className="pr-3"
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Icon
                      as={showConfirmPassword ? EyeOff : Eye}
                      size="sm"
                      className="text-[#C5D4CA]"
                    />
                  </InputSlot>
                </Input>
                {errors.confirmPassword && (
                  <HStack className="mt-1 items-center" space="xs">
                    <Icon as={AlertCircle} size="sm" className="text-red-500" />
                    <Text className="text-red-500 text-sm">
                      {errors.confirmPassword}
                    </Text>
                  </HStack>
                )}
              </FormControl>
            </VStack>

            {/* Info Note */}
            <View
              className="bg-[#2A2A2D] rounded-2xl p-4 border-l-4"
              style={{ borderLeftColor: "#F65F50" }}
            >
              <HStack space="md" className="items-start">
                <Icon as={BookOpen} size="md" className="text-[#F65F50] mt-1" />
                <Text className="flex-1 text-[#C5D4CA] text-sm leading-5">
                  Courses will be assigned by the admin. You can request
                  specific courses after login.
                </Text>
              </HStack>
            </View>

            {/* Spacer */}
            <View className="flex-1" />

            {/* Register Button */}
            <Button
              onPress={handleRegister}
              disabled={loading}
              className="bg-[#F65F50] rounded-lg disabled:opacity-60 mt-2"
              size="lg"
            >
              <ButtonText className="text-white font-semibold text-lg">
                {loading ? "Creating Account..." : "Create Teacher Account"}
              </ButtonText>
            </Button>

            {/* Divider */}
            <HStack className="items-center my-2">
              <View className="flex-1 h-px bg-[#2A2A2D]" />
              <Text className="mx-4 text-[#C5D4CA] text-sm">or</Text>
              <View className="flex-1 h-px bg-[#2A2A2D]" />
            </HStack>

            {/* Back to Register */}
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <View className="border-2 border-[#F65F50] rounded-lg py-3 items-center">
                <Text className="text-[#F65F50] font-semibold text-base">
                  Back to Role Selection
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
        </View>
      </Animated.ScrollView>
    </View>
  );
}
