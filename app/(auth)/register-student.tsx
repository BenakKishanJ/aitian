import React, { useState } from "react";
import { router } from "expo-router";
import { View, Animated, TouchableOpacity, Alert } from "react-native";
import {
  User,
  Mail,
  Lock,
  Hash,
  ChevronDown,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react-native";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { autoEnrollStudentToCourses } from "@/lib/enrollmentUtils";
import { DEPARTMENTS, SEMESTERS, SECTIONS } from "@/types/constants";

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



export default function RegisterStudentScreen() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    usn: "",
    department: "",
    semester: "",
    section: "",
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

    if (!formData.usn) newErrors.usn = "USN is required";
    else if (!/^1DA\d{2}[A-Z]{2}\d{3}$/i.test(formData.usn)) {
      newErrors.usn = "Invalid USN format (e.g., 1DA22CS021)";
    }

    if (!formData.department) newErrors.department = "Department is required";
    if (!formData.semester) newErrors.semester = "Semester is required";
    if (!formData.section) newErrors.section = "Section is required";

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
        role: "student" as const,
        name: formData.name.trim(),
        email: formData.email,
        usn: formData.usn.toUpperCase(),
        department: formData.department,
        semester: parseInt(formData.semester),
        section: formData.section,
        isActive: true,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", userCredential.user.uid), userData);

      // Auto-enroll student in courses
      try {
        const enrollmentResult = await autoEnrollStudentToCourses(
          userCredential.user.uid,
          formData.department as any,
          parseInt(formData.semester),
          formData.section
        );

        if (enrollmentResult.success) {
          console.log(`Auto-enrolled in ${enrollmentResult.enrolledCount} courses`);
        } else {
          console.error('Auto-enrollment failed:', enrollmentResult.error);
        }
      } catch (enrollErr) {
        console.error('Error during auto-enrollment:', enrollErr);
      }

      Alert.alert(
        "Registration Successful!",
        "Please check your email to verify your account. You will be redirected to login.",
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
                Student Registration
              </Text>
              <Text className="text-[#C5D4CA] text-base">
                Complete your profile to get started
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
                    placeholder="1da22cs021@drait.edu.in"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(value) => updateField("email", value)}
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

              {/* USN */}
              <FormControl isInvalid={!!errors.usn}>
                <FormControlLabel>
                  <FormControlLabelText className="text-[#C5D4CA] font-medium mb-2">
                    USN Number
                  </FormControlLabelText>
                </FormControlLabel>
                <Input className="bg-[#2A2A2D] rounded-lg border-0" size="lg">
                  <InputSlot className="pl-3">
                    <Icon as={Hash} size="sm" className="text-[#C5D4CA]" />
                  </InputSlot>
                  <InputField
                    placeholder="1DA22CS021"
                    autoCapitalize="characters"
                    value={formData.usn}
                    onChangeText={(value) => updateField("usn", value)}
                    className="text-white"
                  />
                </Input>
                {errors.usn && (
                  <HStack className="mt-1 items-center" space="xs">
                    <Icon as={AlertCircle} size="sm" className="text-red-500" />
                    <Text className="text-red-500 text-sm">{errors.usn}</Text>
                  </HStack>
                )}
              </FormControl>
            </VStack>

            {/* Academic Details Section */}
            <VStack space="md">
              <Text className="text-sm font-semibold text-[#F65F50] uppercase tracking-wider">
                Academic Details
              </Text>

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

              {/* Semester and Section Row */}
              <HStack space="md" className="w-full">
                {/* Semester */}
                <FormControl className="flex-1" isInvalid={!!errors.semester}>
                  <FormControlLabel>
                    <FormControlLabelText className="text-[#C5D4CA] font-medium mb-2">
                      Semester
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Select
                    selectedValue={formData.semester}
                    onValueChange={(value) => updateField("semester", value)}
                  >
                    <SelectTrigger className="bg-[#2A2A2D] rounded-lg border-0">
                      <SelectInput
                        placeholder="Select"
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
                        {SEMESTERS.map((sem) => (
                          <SelectItem
                            key={sem}
                            label={`Semester ${sem}`}
                            value={sem.toString()}
                          />
                        ))}
                      </SelectContent>
                    </SelectPortal>
                  </Select>
                  {errors.semester && (
                    <HStack className="mt-1 items-center" space="xs">
                      <Icon
                        as={AlertCircle}
                        size="sm"
                        className="text-red-500"
                      />
                      <Text className="text-red-500 text-sm">
                        {errors.semester}
                      </Text>
                    </HStack>
                  )}
                </FormControl>

                {/* Section */}
                <FormControl className="flex-1" isInvalid={!!errors.section}>
                  <FormControlLabel>
                    <FormControlLabelText className="text-[#C5D4CA] font-medium mb-2">
                      Section
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Select
                    selectedValue={formData.section}
                    onValueChange={(value) => updateField("section", value)}
                  >
                    <SelectTrigger className="bg-[#2A2A2D] rounded-lg border-0">
                      <SelectInput
                        placeholder="Select"
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
                        {SECTIONS.map((sec) => (
                          <SelectItem
                            key={sec}
                            label={`Section ${sec}`}
                            value={sec.toLowerCase()}
                          />
                        ))}
                      </SelectContent>
                    </SelectPortal>
                  </Select>
                  {errors.section && (
                    <HStack className="mt-1 items-center" space="xs">
                      <Icon
                        as={AlertCircle}
                        size="sm"
                        className="text-red-500"
                      />
                      <Text className="text-red-500 text-sm">
                        {errors.section}
                      </Text>
                    </HStack>
                  )}
                </FormControl>
              </HStack>
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

            {/* Spacer */}
            <View className="flex-1" />

            {/* Register Button */}
            <Button
              onPress={handleRegister}
              disabled={loading}
              className="bg-[#BCF3FF] rounded-lg disabled:opacity-60 mt-2"
              size="lg"
            >
              <ButtonText className="text-black font-semibold text-lg">
                {loading ? "Creating Account..." : "Create Account"}
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
