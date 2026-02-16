import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Animated,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Users,
  Building2,
  BookOpen,
  Bell,
  ChevronRight,
  LogOut,
  Shield,
  Settings,
} from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";

import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText } from "@/components/ui/button";

export default function AdminProfileScreen() {
  const { user, userData, logout } = useAuth();
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const scrollY = new Animated.Value(0);
  const HEADER_MAX_HEIGHT = 260;
  const HEADER_MIN_HEIGHT = 100;
  const COLLAPSE_RANGE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, COLLAPSE_RANGE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: "clamp",
  });

  const imageScale = scrollY.interpolate({
    inputRange: [0, COLLAPSE_RANGE],
    outputRange: [1, 0.6],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, COLLAPSE_RANGE / 2, COLLAPSE_RANGE],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  const gender = userData?.gender || "male";
  
  const getProfileImage = () => {
    return gender === "female" 
      ? require("@/assets/images/profile/admin_female.png")
      : require("@/assets/images/profile/admin_male.png");
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const menuItems = [
    {
      icon: Users,
      label: "User Management",
      description: "Manage students, teachers, and parents",
      color: "#BCF3FF",
      onPress: () => router.push("/admin/users"),
    },
    {
      icon: Building2,
      label: "Departments",
      description: "Manage departments and courses",
      color: "#F96857",
      onPress: () => router.push("/admin/departments"),
    },
    {
      icon: BookOpen,
      label: "Course Management",
      description: "Manage courses and enrollments",
      color: "#7477FF",
      onPress: () => router.push("/admin/academics"),
    },
    {
      icon: Bell,
      label: "System Settings",
      description: "Configure app settings",
      color: "#F9CD61",
      onPress: () => router.push("/admin/settings"),
    },
  ];

  return (
    <View className="flex-1 bg-[#1C1C1E]">
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            height: headerHeight,
            backgroundColor: "#E1E3FF",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            minHeight: HEADER_MIN_HEIGHT,
          }}
        >
          <Animated.View
            style={{
              transform: [{ scale: imageScale }],
              opacity: headerOpacity,
            }}
          >
            <Image
              source={getProfileImage()}
              style={{ width: 200, height: 200 }}
              resizeMode="contain"
            />
          </Animated.View>
        </Animated.View>

        <View className="bg-[#1C1C1E] rounded-t-3xl -mt-6 px-6 pt-8 pb-6">
          <View className="items-center mb-6">
            <View className="relative">
              <View className="w-24 h-24 rounded-full bg-[#2A2A2D] border-4 border-[#2A2A2D] items-center justify-center overflow-hidden">
                <Image
                  source={getProfileImage()}
                  style={{ width: 88, height: 88 }}
                  resizeMode="contain"
                />
              </View>
              <View className="absolute -bottom-2 -right-2 rounded-full px-3 py-1 flex-row items-center bg-[#7477FF]">
                <Icon as={Shield} size="2xs" className="text-white mr-1" />
                <Text className="text-white text-xs font-bold">
                  Admin
                </Text>
              </View>
            </View>

            <Text className="text-white text-2xl font-bold mt-4">
              {userData?.name || "Administrator"}
            </Text>
            <Text className="text-[#C5D4CA] text-sm mt-1">
              {userData?.email || "admin@college.edu"}
            </Text>
            <Text className="text-[#6B7280] text-xs mt-2">
              Admin since {formatDate(userData?.createdAt)}
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-[#C5D4CA] text-xs font-semibold uppercase tracking-wide mb-3 px-1">
              Administration
            </Text>
            
            <VStack space="sm">
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={item.onPress}
                  className="bg-[#2A2A2D] rounded-2xl p-4 flex-row items-center"
                >
                  <View 
                    className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <Icon as={item.icon} size="md" style={{ color: item.color }} />
                  </View>
                  <VStack className="flex-1">
                    <Text className="text-white text-base font-semibold">
                      {item.label}
                    </Text>
                    <Text className="text-[#6B7280] text-xs">
                      {item.description}
                    </Text>
                  </VStack>
                  <Icon as={ChevronRight} size="sm" className="text-[#3C443F]" />
                </TouchableOpacity>
              ))}
            </VStack>
          </View>

          <View className="mb-4">
            <Text className="text-[#C5D4CA] text-xs font-semibold uppercase tracking-wide mb-3 px-1">
              Account
            </Text>
            
            <TouchableOpacity
              onPress={() => {}}
              className="bg-[#2A2A2D] rounded-2xl p-4 flex-row items-center"
            >
              <View className="w-12 h-12 rounded-xl bg-[#1C1C1E] items-center justify-center mr-4">
                <Icon as={Settings} size="md" className="text-[#C5D4CA]" />
              </View>
              <VStack className="flex-1">
                <Text className="text-white text-base font-semibold">
                  Settings
                </Text>
                <Text className="text-[#6B7280] text-xs">
                  Manage your account preferences
                </Text>
              </VStack>
              <Icon as={ChevronRight} size="sm" className="text-[#3C443F]" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setShowLogoutDialog(true)}
            className="bg-[#F96857]/10 rounded-2xl p-4 flex-row items-center justify-center mt-6"
          >
            <Icon as={LogOut} size="md" className="text-[#F96857] mr-2" />
            <Text className="text-[#F96857] font-semibold text-base">
              Logout
            </Text>
          </TouchableOpacity>

          <View className="items-center mt-8">
            <Text className="text-[#3C443F] text-xs">
              AITIAN v1.0.0
            </Text>
            <Text className="text-[#3C443F] text-xs mt-1">
              © 2025 College Management
            </Text>
          </View>

          <View className="h-24" />
        </View>
      </Animated.ScrollView>

      <AlertDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
      >
        <AlertDialogBackdrop />
        <AlertDialogContent className="bg-[#2A2A2D]">
          <AlertDialogHeader>
            <Heading size="lg" className="text-white">
              Confirm Logout
            </Heading>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text className="text-[#C5D4CA]">
              Are you sure you want to logout?
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <HStack space="md" className="w-full justify-end">
              <Button
                variant="outline"
                onPress={() => setShowLogoutDialog(false)}
                className="border-[#3C443F]"
              >
                <ButtonText className="text-[#C5D4CA]">Cancel</ButtonText>
              </Button>
              <Button onPress={handleLogout} className="bg-[#F96857]">
                <ButtonText className="text-white">Logout</ButtonText>
              </Button>
            </HStack>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
