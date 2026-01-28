import React from "react";
import { View, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";

/* Gluestack UI components */
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export default function UnauthorizedScreen() {
  const { role } = useAuth();

  const getRoleName = () => {
    switch (role) {
      case "student":
        return "Student";
      case "teacher":
        return "Teacher";
      case "parent":
        return "Parent";
      case "admin":
        return "Administrator";
      default:
        return "User";
    }
  };

  const getAccessMessage = () => {
    switch (role) {
      case "parent":
        return "You need student approval to access this content.";
      case "student":
        return "This area is for teachers and administrators only.";
      case "teacher":
        return "You do not have permission to access this area.";
      case "admin":
        return "You have full access to all areas.";
      default:
        return "Please login to access this content.";
    }
  };

  return (
    <View className="flex-1 bg-[#1C1C1E]">
      <VStack className="flex-1 justify-center items-center px-6" space="lg">
        {/* Icon */}
        <Box
          className="p-6 rounded-full"
          style={{ backgroundColor: "#2A2A2D" }}
        >
          <Icon as={ShieldAlert} size="xl" className="text-[#F65F50]" />
        </Box>

        {/* Title and Message */}
        <VStack className="items-center" space="sm">
          <Text className="text-3xl font-bold text-white">Access Denied</Text>
          <Text className="text-center text-[#C5D4CA] text-base">
            {getAccessMessage()}
          </Text>
          {role && (
            <Text className="text-[#BCF3FF] font-semibold">
              Current Role: {getRoleName()}
            </Text>
          )}
        </VStack>

        {/* Info Box */}
        <View
          className="w-full p-4 rounded-2xl border-l-4"
          style={{ backgroundColor: "#2A2A2D", borderLeftColor: "#BCF3FF" }}
        >
          <VStack space="sm">
            <Text className="text-white font-semibold">Need help?</Text>
            <VStack space="xs">
              <Text className="text-[#C5D4CA] text-sm">
                • Contact your department administrator
              </Text>
              <Text className="text-[#C5D4CA] text-sm">
                • Check if you're using the correct account
              </Text>
              <Text className="text-[#C5D4CA] text-sm">
                • Parents: Ensure student has approved your link request
              </Text>
            </VStack>
          </VStack>
        </View>

        {/* Spacer */}
        <View className="flex-1" />

        {/* Action Buttons */}
        <VStack className="w-full" space="md">
          <Button
            size="lg"
            onPress={() => router.back()}
            className="bg-[#F65F50] rounded-lg disabled:opacity-60"
          >
            <HStack className="items-center justify-center" space="sm">
              <Icon as={ArrowLeft} size="md" className="text-white" />
              <ButtonText className="text-white font-semibold text-lg">
                Go Back
              </ButtonText>
            </HStack>
          </Button>

          {/* Divider */}
          <HStack className="items-center my-2">
            <View className="flex-1 h-px bg-[#2A2A2D]" />
            <Text className="mx-4 text-[#C5D4CA] text-sm">or</Text>
            <View className="flex-1 h-px bg-[#2A2A2D]" />
          </HStack>

          <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
            <View className="border-2 border-[#C5D4CA] rounded-lg py-3 items-center">
              <HStack className="items-center" space="sm">
                <Icon as={Home} size="md" className="text-[#C5D4CA]" />
                <Text className="text-[#C5D4CA] font-semibold">Go to Home</Text>
              </HStack>
            </View>
          </TouchableOpacity>

          {role === "parent" && (
            <>
              {/* Divider */}
              <HStack className="items-center my-2">
                <View className="flex-1 h-px bg-[#2A2A2D]" />
                <Text className="mx-4 text-[#C5D4CA] text-sm">or</Text>
                <View className="flex-1 h-px bg-[#2A2A2D]" />
              </HStack>

              <TouchableOpacity
                onPress={() => router.replace("/(auth)/parent-link")}
              >
                <View
                  className="border-2 rounded-lg py-3 items-center"
                  style={{ borderColor: "#F9CD61" }}
                >
                  <Text className="text-[#F9CD61] font-semibold">
                    Manage Student Links
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </VStack>

        {/* Footer */}
        <View className="mt-4 pb-4">
          <Text className="text-center text-xs text-[#C5D4CA]">
            By continuing, you agree to our Terms & Privacy Policy
          </Text>
        </View>
      </VStack>
    </View>
  );
}
