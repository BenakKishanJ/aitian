import React from "react";
import { View, Animated, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import {
  ArrowLeft,
  GraduationCap,
  Users,
  Shield,
  BookOpen,
} from "lucide-react-native";

/* Gluestack UI (local re-exports) */
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";

type RoleRoute =
  | "/(auth)/register-student"
  | "/(auth)/register-teacher"
  | "/(auth)/register-parent"
  | "/(auth)/register-admin";

interface RoleCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  accentColor: string;
  href: RoleRoute;
}

export default function RegisterScreen() {
  const scrollY = new Animated.Value(0);

  const HEADER_MAX_HEIGHT = 280;
  const HEADER_MIN_HEIGHT = 80;
  const COLLAPSE_RANGE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  // Animate header height based on scroll
  const headerHeight = scrollY.interpolate({
    inputRange: [0, COLLAPSE_RANGE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: "clamp",
  });

  // Animate image scale
  const imageScale = scrollY.interpolate({
    inputRange: [0, COLLAPSE_RANGE],
    outputRange: [1, 0.4],
    extrapolate: "clamp",
  });

  const roles: RoleCard[] = [
    {
      id: "student",
      title: "Student",
      description: "Access timetable, marks, attendance, and course materials",
      icon: GraduationCap,
      accentColor: "#BCF3FF",
      href: "/(auth)/register-student",
    },
    {
      id: "teacher",
      title: "Teacher",
      description:
        "Manage courses, take attendance, upload materials, and grade assignments",
      icon: BookOpen,
      accentColor: "#F65F50",
      href: "/(auth)/register-teacher",
    },
    {
      id: "parent",
      title: "Parent",
      description: "Monitor your child's academic progress and receive updates",
      icon: Users,
      accentColor: "#F9CD61",
      href: "/(auth)/register-parent",
    },
    {
      id: "admin",
      title: "Admin",
      description: "Manage system, users, courses, and academic structure",
      icon: Shield,
      accentColor: "#C5D4CA",
      href: "/(auth)/register-admin",
    },
  ];

  const handleRolePress = (href: RoleRoute) => {
    router.push(href);
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
            <View>
              <HStack className="items-center mb-4" space="md">
                <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                  <Icon as={ArrowLeft} size="lg" className="text-[#C5D4CA]" />
                </TouchableOpacity>
                <View className="flex-1" />
              </HStack>
              <Text className="text-3xl font-bold text-white mb-2">
                Get Started
              </Text>
              <Text className="text-[#C5D4CA] text-base">
                Select your role to create an account
              </Text>
            </View>

            {/* Role Cards */}
            <VStack space="md" className="mt-4">
              {roles.map((role) => {
                const RoleIcon = role.icon;
                return (
                  <TouchableOpacity
                    key={role.id}
                    onPress={() => handleRolePress(role.href)}
                    activeOpacity={0.8}
                  >
                    <View
                      className="bg-[#2A2A2D] rounded-2xl p-4 border-2"
                      style={{ borderColor: role.accentColor }}
                    >
                      <HStack className="items-start" space="md">
                        {/* Icon Container */}
                        <View
                          className="rounded-xl p-3 mt-1"
                          style={{
                            backgroundColor: role.accentColor,
                          }}
                        >
                          <Icon
                            as={RoleIcon}
                            size="lg"
                            className="text-[#1C1C1E]"
                          />
                        </View>

                        {/* Content */}
                        <VStack className="flex-1" space="xs">
                          <Text className="text-lg font-bold text-white">
                            {role.title}
                          </Text>
                          <Text className="text-[#C5D4CA] text-sm leading-5">
                            {role.description}
                          </Text>
                        </VStack>

                        {/* Arrow Indicator */}
                        <View className="justify-center">
                          <Icon
                            as={ArrowLeft}
                            size="md"
                            className="text-[#C5D4CA] rotate-180"
                          />
                        </View>
                      </HStack>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </VStack>

            {/* Divider */}
            <HStack className="items-center my-2">
              <View className="flex-1 h-px bg-[#2A2A2D]" />
              <Text className="mx-4 text-[#C5D4CA] text-sm">or</Text>
              <View className="flex-1 h-px bg-[#2A2A2D]" />
            </HStack>

            {/* Already have account */}
            <VStack space="md" className="items-center mt-2">
              <Text className="text-center text-[#C5D4CA]">
                Already have an account?
              </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                <View className="border-2 border-[#F9CD61] rounded-lg py-3 px-8 items-center">
                  <Text className="text-[#F9CD61] font-semibold text-base">
                    Sign In
                  </Text>
                </View>
              </TouchableOpacity>
            </VStack>

            {/* Footer */}
            <View className="mt-6 pb-2">
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
