import React, { useState } from "react";
import {
  View,
  Animated,
  Alert as RAlert,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Shield,
  ChevronDown,
  AlertCircle,
  Briefcase,
  Eye,
  EyeOff,
} from "lucide-react-native";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { DEPARTMENTS as ACADEMIC_DEPARTMENTS } from "@/types/constants";

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
import { Alert, AlertText, AlertIcon } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";

const DEPARTMENTS = [
  ...ACADEMIC_DEPARTMENTS.map(dept => ({ id: dept.id, name: `${dept.code} - ${dept.name}` })),
  { id: "admin", name: "Administration" },
  { id: "exam", name: "Examination Department" },
  { id: "academic", name: "Academic Office" },
];

const DESIGNATIONS = [
  { id: "hod", name: "Head of Department" },
  { id: "principal", name: "Principal" },
  { id: "dean", name: "Dean" },
  { id: "director", name: "Director" },
  { id: "admin_officer", name: "Administrative Officer" },
  { id: "exam_controller", name: "Exam Controller" },
  { id: "system_admin", name: "System Administrator" },
];

export default function RegisterAdminScreen() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "male",
    department: "",
    designation: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    else if (formData.password.length < 8)
      newErrors.password = "Minimum 8 characters";
    else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Must include uppercase, lowercase and numbers";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.department) newErrors.department = "Department is required";

    if (!formData.designation)
      newErrors.designation = "Designation is required";

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
        role: "admin" as const,
        name: formData.name.trim(),
        email: formData.email,
        gender: formData.gender,
        department: formData.department,
        designation: formData.designation,
        isActive: true,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", userCredential.user.uid), userData);

      RAlert.alert(
        "Admin Account Created!",
        "Your administrator account has been created. Please verify your email to access the admin dashboard.",
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

      RAlert.alert("Registration Error", message);
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

        <View className="bg-[#1C1C1E] rounded-t-3xl px-6 pt-8 pb-8 flex-1">
          <VStack space="lg" className="flex-1">
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
                Admin Registration
              </Text>
              <Text className="text-[#C5D4CA] text-base">
                Create administrator account
              </Text>
            </View>

            <Alert
              className="bg-[#2A2A2D] border-l-4"
              style={{ borderLeftColor: "#C5D4CA" }}
            >
              <AlertIcon as={Shield} className="text-[#C5D4CA]" />
              <AlertText className="text-[#C5D4CA]">
                Admin accounts have full system access. Use responsibly.
              </AlertText>
            </Alert>

            <VStack space="md">
              <Text className="text-sm font-semibold text-[#BCF3FF] uppercase tracking-wider">
                Administrator Details
              </Text>

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

              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText className="text-[#C5D4CA] font-medium mb-2">
                    Gender
                  </FormControlLabelText>
                </FormControlLabel>
                <HStack space="md">
                  <TouchableOpacity
                    onPress={() => updateField("gender", "male")}
                    className={`flex-1 py-3 px-4 rounded-lg flex-row items-center justify-center ${
                      formData.gender === "male"
                        ? "bg-[#BCF3FF]"
                        : "bg-[#2A2A2D]"
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        formData.gender === "male" ? "text-black" : "text-[#C5D4CA]"
                      }`}
                    >
                      Male
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => updateField("gender", "female")}
                    className={`flex-1 py-3 px-4 rounded-lg flex-row items-center justify-center ${
                      formData.gender === "female"
                        ? "bg-[#BCF3FF]"
                        : "bg-[#2A2A2D]"
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        formData.gender === "female" ? "text-black" : "text-[#C5D4CA]"
                      }`}
                    >
                      Female
                    </Text>
                  </TouchableOpacity>
                </HStack>
              </FormControl>

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
                    placeholder="admin@drait.edu.in"
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
            </VStack>

            <VStack space="md">
              <Text className="text-sm font-semibold text-[#F65F50] uppercase tracking-wider">
                Professional Details
              </Text>

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
                      placeholder="Select department"
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
                          label={dept.name}
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

              <FormControl isInvalid={!!errors.designation}>
                <FormControlLabel>
                  <FormControlLabelText className="text-[#C5D4CA] font-medium mb-2">
                    Designation
                  </FormControlLabelText>
                </FormControlLabel>
                <Select
                  selectedValue={formData.designation}
                  onValueChange={(value) => updateField("designation", value)}
                >
                  <SelectTrigger className="bg-[#2A2A2D] rounded-lg border-0">
                    <SelectInput
                      placeholder="Select designation"
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
                      {DESIGNATIONS.map((designation) => (
                        <SelectItem
                          key={designation.id}
                          label={designation.name}
                          value={designation.id}
                        />
                      ))}
                    </SelectContent>
                  </SelectPortal>
                </Select>
                {errors.designation && (
                  <HStack className="mt-1 items-center" space="xs">
                    <Icon as={AlertCircle} size="sm" className="text-red-500" />
                    <Text className="text-red-500 text-sm">
                      {errors.designation}
                    </Text>
                  </HStack>
                )}
              </FormControl>
            </VStack>

            <VStack space="md">
              <Text className="text-sm font-semibold text-[#F9CD61] uppercase tracking-wider">
                Security
              </Text>

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

            <View
              className="bg-[#2A2A2D] rounded-2xl p-4 border-l-4"
              style={{ borderLeftColor: "#C5D4CA" }}
            >
              <HStack space="md" className="items-start">
                <Icon as={Shield} size="md" className="text-[#C5D4CA] mt-1" />
                <VStack space="xs" className="flex-1">
                  <Text className="font-semibold text-[#C5D4CA] text-sm uppercase tracking-wider">
                    Security Guidelines
                  </Text>
                  <Text className="text-[#C5D4CA] text-sm leading-5">
                    • Use a strong, unique password{"\n"}• Min. 8 chars:
                    uppercase, lowercase, numbers{"\n"}• Never share admin
                    credentials{"\n"}• Enable 2FA if available{"\n"}• Log out
                    when not in use
                  </Text>
                </VStack>
              </HStack>
            </View>

            <View className="flex-1" />

            <Button
              onPress={handleRegister}
              disabled={loading}
              className="bg-[#C5D4CA] rounded-lg disabled:opacity-60 mt-2"
              size="lg"
            >
              <ButtonText className="text-black font-semibold text-lg">
                {loading ? "Creating Admin Account..." : "Create Admin Account"}
              </ButtonText>
            </Button>

            <HStack className="items-center my-2">
              <View className="flex-1 h-px bg-[#2A2A2D]" />
              <Text className="mx-4 text-[#C5D4CA] text-sm">or</Text>
              <View className="flex-1 h-px bg-[#2A2A2D]" />
            </HStack>

            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <View className="border-2 border-[#C5D4CA] rounded-lg py-3 items-center">
                <Text className="text-[#C5D4CA] font-semibold text-base">
                  Back to Role Selection
                </Text>
              </View>
            </TouchableOpacity>

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
