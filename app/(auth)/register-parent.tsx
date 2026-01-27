import React, { useState, useEffect } from "react";
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
  AlertCircle,
  Phone,
  GraduationCap,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react-native";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  where,
  getDocs,
  query,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

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
import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";

export default function RegisterParentScreen() {
  const [loading, setLoading] = useState(false);
  const [searchingStudent, setSearchingStudent] = useState(false);
  const [studentFound, setStudentFound] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    studentUSN: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [studentError, setStudentError] = useState("");

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

  // Search for student when USN changes
  useEffect(() => {
    const searchStudent = async () => {
      const usn = formData.studentUSN.trim().toUpperCase();
      if (!usn || usn.length < 3) {
        setStudentFound(null);
        return;
      }

      setSearchingStudent(true);
      setStudentError("");

      try {
        const usersRef = collection(db, "users");
        const q = query(
          usersRef,
          where("role", "==", "student"),
          where("usn", ">=", usn),
          where("usn", "<=", usn + "\uf8ff"),
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setStudentFound(null);
          setStudentError("No student found with this USN");
        } else {
          const studentDoc = querySnapshot.docs[0];
          const studentData = studentDoc.data();
          setStudentFound({
            id: studentDoc.id,
            ...studentData,
          });
          setStudentError("");
        }
      } catch (error) {
        console.error("Error searching student:", error);
        setStudentError("Error searching for student");
        setStudentFound(null);
      } finally {
        setSearchingStudent(false);
      }
    };

    const delaySearch = setTimeout(searchStudent, 500);
    return () => clearTimeout(delaySearch);
  }, [formData.studentUSN]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";

    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Minimum 6 characters";

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.studentUSN.trim()) {
      newErrors.studentUSN = "Student USN is required";
    } else if (!studentFound) {
      newErrors.studentUSN = "Please select a valid student";
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone must be 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    if (!studentFound) {
      RAlert.alert("Error", "Please select a valid student");
      return;
    }

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
        role: "parent" as const,
        name: formData.name.trim(),
        email: formData.email,
        phone: formData.phone || null,
        linkedStudentIds: [],
        pendingStudentIds: [studentFound.id],
        maxStudents: 5,
        isActive: true,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", userCredential.user.uid), userData);

      const linkId = `${userCredential.user.uid}_${studentFound.id}`;
      await setDoc(doc(db, "parentLinks", linkId), {
        parentId: userCredential.user.uid,
        parentName: formData.name.trim(),
        studentId: studentFound.id,
        studentName: studentFound.name,
        studentUSN: studentFound.usn,
        status: "pending",
        requestedAt: serverTimestamp(),
        approvedAt: null,
      });

      await setDoc(
        doc(db, "notifications", `${studentFound.id}_parent_${Date.now()}`),
        {
          userId: studentFound.id,
          type: "parent_link_request",
          title: "Parent Link Request",
          message: `${formData.name} wants to link with your account`,
          data: {
            parentId: userCredential.user.uid,
            parentName: formData.name,
            linkId: linkId,
          },
          isRead: false,
          createdAt: serverTimestamp(),
        },
      );

      RAlert.alert(
        "Registration Successful!",
        `Your account has been created. A link request has been sent to ${studentFound.name}. You will have limited access until they approve.`,
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
                Parent Registration
              </Text>
              <Text className="text-[#C5D4CA] text-base">
                Link with your child's account
              </Text>
            </View>

            {/* Parent Details Section */}
            <VStack space="md">
              <Text className="text-sm font-semibold text-[#BCF3FF] uppercase tracking-wider">
                Parent Details
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
                    Email Address
                  </FormControlLabelText>
                </FormControlLabel>
                <Input className="bg-[#2A2A2D] rounded-lg border-0" size="lg">
                  <InputSlot className="pl-3">
                    <Icon as={Mail} size="sm" className="text-[#C5D4CA]" />
                  </InputSlot>
                  <InputField
                    placeholder="you@email.com"
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

            {/* Student Link Section */}
            <VStack space="md">
              <Text className="text-sm font-semibold text-[#F9CD61] uppercase tracking-wider">
                Link to Student
              </Text>

              {/* Student USN Search */}
              <FormControl isInvalid={!!errors.studentUSN}>
                <FormControlLabel>
                  <FormControlLabelText className="text-[#C5D4CA] font-medium mb-2">
                    Student USN
                  </FormControlLabelText>
                </FormControlLabel>
                <Input className="bg-[#2A2A2D] rounded-lg border-0" size="lg">
                  <InputSlot className="pl-3">
                    <Icon
                      as={GraduationCap}
                      size="sm"
                      className="text-[#C5D4CA]"
                    />
                  </InputSlot>
                  <InputField
                    placeholder="1DA22CS021"
                    autoCapitalize="characters"
                    value={formData.studentUSN}
                    onChangeText={(value) => updateField("studentUSN", value)}
                    className="text-white"
                    placeholderTextColor="#6B7280"
                  />
                </Input>
                {errors.studentUSN && (
                  <HStack className="mt-1 items-center" space="xs">
                    <Icon as={AlertCircle} size="sm" className="text-red-500" />
                    <Text className="text-red-500 text-sm">
                      {errors.studentUSN}
                    </Text>
                  </HStack>
                )}
                {studentError && !studentFound && (
                  <HStack className="mt-1 items-center" space="xs">
                    <Icon as={AlertCircle} size="sm" className="text-red-500" />
                    <Text className="text-red-500 text-sm">{studentError}</Text>
                  </HStack>
                )}
              </FormControl>

              {/* Student Found Preview */}
              {searchingStudent ? (
                <View className="bg-[#2A2A2D] p-4 rounded-2xl border border-[#3A3A3D]">
                  <HStack className="items-center" space="sm">
                    <Icon
                      as={AlertCircle}
                      size="md"
                      className="text-[#F9CD61] animate-pulse"
                    />
                    <Text className="text-[#C5D4CA]">
                      Searching for student...
                    </Text>
                  </HStack>
                </View>
              ) : studentFound ? (
                <Alert
                  className="bg-[#2A2A2D] border-l-4"
                  style={{ borderLeftColor: "#F9CD61" }}
                >
                  <AlertIcon as={CheckCircle} className="text-[#F9CD61]" />
                  <View className="flex-1">
                    <AlertText className="text-[#C5D4CA] font-semibold">
                      Student Found: {studentFound.name} ({studentFound.usn})
                    </AlertText>
                    <Text className="text-[#9CA3AF] text-sm mt-1">
                      {studentFound.department} • Semester{" "}
                      {studentFound.semester} • Section {studentFound.section}
                    </Text>
                  </View>
                </Alert>
              ) : null}
            </VStack>

            {/* Security Section */}
            <VStack space="md">
              <Text className="text-sm font-semibold text-[#F65F50] uppercase tracking-wider">
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

            {/* Important Information */}
            <View
              className="bg-[#2A2A2D] rounded-2xl p-4 border-l-4"
              style={{ borderLeftColor: "#F9CD61" }}
            >
              <HStack space="md" className="items-start">
                <Icon as={Shield} size="md" className="text-[#F9CD61] mt-1" />
                <VStack className="flex-1" space="xs">
                  <Text className="font-semibold text-[#F9CD61] text-sm uppercase tracking-wider">
                    Important Information
                  </Text>
                  <Text className="text-[#C5D4CA] text-sm leading-5">
                    • You can link to maximum 5 students{"\n"}• Student must
                    approve your request{"\n"}• You will have read-only access
                    {"\n"}• Student can revoke access anytime{"\n\n"}
                    <Text className="text-[#9CA3AF] text-xs">
                      Until approved, you'll see only general college
                      information.
                    </Text>
                  </Text>
                </VStack>
              </HStack>
            </View>

            {/* Spacer */}
            <View className="flex-1" />

            {/* Register Button */}
            <Button
              onPress={handleRegister}
              disabled={loading || !studentFound}
              className="bg-[#F9CD61] rounded-lg disabled:opacity-60 mt-2"
              size="lg"
            >
              <ButtonText className="text-black font-semibold text-lg">
                {loading ? "Creating Account..." : "Create Parent Account"}
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
              <View className="border-2 border-[#F9CD61] rounded-lg py-3 items-center">
                <Text className="text-[#F9CD61] font-semibold text-base">
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
