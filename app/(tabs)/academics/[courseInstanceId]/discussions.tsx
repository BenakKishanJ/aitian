import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { MessageSquare, Plus, Send, Search, X } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/lib/AuthContext";

export default function DiscussionsScreen() {
  const { courseInstanceId } = useLocalSearchParams<{
    courseInstanceId: string;
  }>();
  const { role } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadContent, setNewThreadContent] = useState("");
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock data for now
  const discussions = [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <HStack className="justify-between items-center px-4 py-3">
          <Text className="text-xl font-bold text-black">Discussion Forum</Text>

          <TouchableOpacity
            onPress={() => setShowSearch(!showSearch)}
            style={styles.iconButton}
          >
            <Icon
              as={showSearch ? X : Search}
              size="md"
              className="text-black"
            />
          </TouchableOpacity>
        </HStack>

        {/* Search Bar */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <Icon as={Search} size="md" className="text-gray-400" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search discussions..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Icon as={X} size="sm" className="text-gray-400" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => {}} />
        }
      >
        {/* Empty State */}
        <View style={styles.emptyContainer}>
          <MessageSquare size={48} color="#9CA3AF" />
          <Text className="text-gray-500 text-center text-lg mt-4">
            No discussions yet
          </Text>
          <Text className="text-gray-400 text-center text-sm mt-2">
            Start a discussion to ask questions or share ideas
          </Text>
        </View>

        {/* Create Thread Form */}
        {showCreateThread && (
          <View style={styles.createThreadCard}>
            <VStack space="md">
              <HStack className="justify-between items-center">
                <Text className="text-lg font-bold text-black">
                  New Discussion
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCreateThread(false)}
                >
                  <Icon as={X} size="md" className="text-gray-500" />
                </TouchableOpacity>
              </HStack>

              <TextInput
                style={styles.input}
                placeholder="Discussion title"
                value={newThreadTitle}
                onChangeText={setNewThreadTitle}
                placeholderTextColor="#9CA3AF"
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Write your question or topic..."
                value={newThreadContent}
                onChangeText={setNewThreadContent}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
              />

              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
              >
                <HStack space="xs" className="items-center">
                  <Icon as={Send} size="sm" className="text-white" />
                  <Text className="text-white font-semibold">Post</Text>
                </HStack>
              </TouchableOpacity>
            </VStack>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateThread(true)}
        activeOpacity={0.8}
      >
        <Icon as={Plus} size="xl" className="text-white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#000000",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  createThreadCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#000000",
    backgroundColor: "#F9FAFB",
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimary: {
    backgroundColor: "#000000",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
