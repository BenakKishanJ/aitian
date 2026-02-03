import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "@/lib/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { BookOpen, Users, Calendar, Settings } from "lucide-react-native";

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
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Welcome, {userData.email}</Text>
        </View>

        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/admin/courses")}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#DBEAFE" }]}>
              <BookOpen size={28} color="#1E40AF" />
            </View>
            <Text style={styles.cardTitle}>Course Management</Text>
            <Text style={styles.cardDescription}>
              Create courses and manage enrollments
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              // TODO: Create users management page
              console.log("Users management coming soon");
            }}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#FEE2E2" }]}>
              <Users size={28} color="#991B1B" />
            </View>
            <Text style={styles.cardTitle}>User Management</Text>
            <Text style={styles.cardDescription}>
              Manage students, teachers, and parents
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/admin/events")}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#FEF3C7" }]}>
              <Calendar size={28} color="#92400E" />
            </View>
            <Text style={styles.cardTitle}>Calendar Events</Text>
            <Text style={styles.cardDescription}>
              Manage classes, exams, and events
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "48%",
    minHeight: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
});
