import React from "react";
import { View, Text } from "react-native";
import { useAuth } from "@/lib/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

export default function AdminDashboard() {
  const { userData } = useAuth();

  if (userData?.role !== "admin") {
    return null; // This should be handled by route guards
  }

  return (
    <LinearGradient
      colors={["#C7B9FF", "#FFD6C9", "#B8DBFF"]}
      style={{ flex: 1, paddingTop: 60 }}
    >
      <View
        style={{
          backgroundColor: "#FFFFFF",
          margin: 20,
          borderRadius: 20,
          padding: 24,
          shadowOpacity: 0.1,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "600",
            color: "#2B2B2B",
            marginBottom: 16,
          }}
        >
          Admin Dashboard
        </Text>
        <Text style={{ fontSize: 16, color: "#6B6B6B" }}>
          Welcome, {userData.email}. This is the admin area.
        </Text>
        {/* Add admin-specific content here */}
      </View>
    </LinearGradient>
  );
}
