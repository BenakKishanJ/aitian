import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Search, Plus, X, Upload, Filter, Link, File, Shield, Trash2 } from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import { useMaterials } from "@/lib/hooks/useMaterials";
import { useMaterialUpload } from "@/lib/hooks/useMaterialUpload";
import { MaterialCard } from "@/components/academics/MaterialCard";
import { FilePicker, type PickedFile } from "@/components/ui/FilePicker";
import { UploadProgressBar } from "@/components/ui/UploadProgress";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { collection, query, where, getDocs, writeBatch, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/types/constants";

export default function AdminMaterialsScreen() {
  const { courseInstanceId } = useLocalSearchParams<{
    courseInstanceId: string;
  }>();

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>("all");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState<
    "pdf" | "video" | "link" | "document" | "other"
  >("pdf");
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadFileSize, setUploadFileSize] = useState("");
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [selectedFile, setSelectedFile] = useState<PickedFile | null>(null);

  const {
    materials,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    addMaterial,
    deleteMaterial,
  } = useMaterials({
    courseInstanceId: courseInstanceId as string,
    searchQuery,
    typeFilter,
  });

  const {
    uploadMaterial,
    isUploading,
    progress,
    error: uploadError,
    resetUpload,
  } = useMaterialUpload();

  const materialTypes = [
    { value: "all", label: "All Types" },
    { value: "pdf", label: "PDF" },
    { value: "video", label: "Video" },
    { value: "link", label: "Link" },
    { value: "document", label: "Document" },
    { value: "other", label: "Other" },
  ];

  const handleEndReached = () => {
    if (hasMore && !loading) {
      loadMore();
    }
  };

  const isScrollable = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    return (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom
    );
  };

  const handleDelete = async (materialId: string) => {
    Alert.alert(
      "Delete Material",
      "Are you sure you want to delete this material?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMaterial(materialId);
              Alert.alert("Success", "Material deleted successfully");
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete material");
            }
          },
        },
      ]
    );
  };

  const handleDeleteAll = async () => {
    Alert.alert(
      "Delete All Materials",
      "Are you sure you want to delete ALL materials in this course? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            setDeletingAll(true);
            try {
              const batch = writeBatch(db);
              const materialsQuery = query(
                collection(db, COLLECTIONS.MATERIALS),
                where("courseInstanceId", "==", courseInstanceId)
              );
              const materialsSnap = await getDocs(materialsQuery);
              materialsSnap.docs.forEach((doc) => {
                batch.delete(doc.ref);
              });
              await batch.commit();
              await refresh();
              Alert.alert("Success", "All materials deleted successfully");
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete materials");
            } finally {
              setDeletingAll(false);
            }
          },
        },
      ]
    );
  };

  const handleUpload = async () => {
    if (!uploadTitle.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    try {
      if (uploadMode === "file" && selectedFile) {
        // Upload file
        await uploadMaterial(selectedFile, {
          courseInstanceId: courseInstanceId as string,
          title: uploadTitle,
          type: uploadType,
          description: uploadDescription.trim() || undefined,
        });
      } else if (uploadMode === "url" && uploadUrl.trim()) {
        // Add URL-based material
        await addMaterial({
          title: uploadTitle,
          type: uploadType,
          url: uploadUrl,
          description: uploadDescription.trim() || undefined,
          fileSize: uploadFileSize.trim() || undefined,
        });
      } else {
        Alert.alert("Error", uploadMode === "file" ? "Please select a file" : "Please enter a URL");
        return;
      }

      // Reset form
      resetUploadForm();
      Alert.alert("Success", "Material uploaded successfully");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to upload material");
    }
  };

  const resetUploadForm = () => {
    setUploadTitle("");
    setUploadType("pdf");
    setUploadUrl("");
    setUploadDescription("");
    setUploadFileSize("");
    setUploadMode("file");
    setSelectedFile(null);
    resetUpload();
    setShowUploadModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <HStack className="justify-between items-center px-4 py-3">
          <HStack space="sm" className="items-center">
            <Shield size={20} color="#8B5CF6" />
            <Text className="text-xl font-bold text-black">Admin: Materials</Text>
          </HStack>

          <HStack space="sm">
            {/* Search Icon */}
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

            {/* Filter Icon */}
            <TouchableOpacity
              onPress={() => setShowFilterModal(true)}
              style={[
                styles.iconButton,
                typeFilter !== "all" && styles.iconButtonActive,
              ]}
            >
              <Icon as={Filter} size="md" className="text-black" />
            </TouchableOpacity>

            {/* Delete All Icon */}
            {materials.length > 0 && (
              <TouchableOpacity
                onPress={handleDeleteAll}
                style={[styles.iconButton, styles.deleteButton]}
                disabled={deletingAll}
              >
                <Icon as={Trash2} size="md" className="text-red-600" />
              </TouchableOpacity>
            )}
          </HStack>
        </HStack>

        {/* Search Bar */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <Icon as={Search} size="md" className="text-gray-400" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search materials..."
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

        {/* Active Filter Indicator */}
        {typeFilter !== "all" && (
          <View style={styles.activeFilter}>
            <Text className="text-sm text-gray-700">
              Filter: {materialTypes.find((t) => t.value === typeFilter)?.label}
            </Text>
            <TouchableOpacity onPress={() => setTypeFilter("all")}>
              <Icon as={X} size="xs" className="text-gray-500 ml-2" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Materials List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading && materials.length === 0}
            onRefresh={refresh}
          />
        }
        onScroll={({ nativeEvent }) => {
          if (isScrollable({ nativeEvent })) {
            handleEndReached();
          }
        }}
        scrollEventThrottle={400}
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text className="text-red-600 text-center">{error}</Text>
          </View>
        )}

        {!loading && materials.length === 0 && (
          <View style={styles.emptyContainer}>
            <Upload size={48} color="#9CA3AF" />
            <Text className="text-gray-500 text-center text-lg mt-4">
              {searchQuery ? "No materials found" : "No materials uploaded yet"}
            </Text>
            <Text className="text-gray-400 text-center text-sm mt-2">
              Upload your first material to get started
            </Text>
          </View>
        )}

        {materials.map((material) => (
          <MaterialCard
            key={material.id}
            material={material}
            role="admin"
            onDelete={handleDelete}
          />
        ))}

        {loading && materials.length > 0 && (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color="#000000" />
            <Text className="text-gray-600 ml-2">Loading more...</Text>
          </View>
        )}

        {!loading && materials.length > 0 && !hasMore && (
          <View style={styles.endMessage}>
            <Text className="text-gray-400 text-center text-sm">
              No more materials to load
            </Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB for Upload */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowUploadModal(true)}
        activeOpacity={0.8}
      >
        <Icon as={Plus} size="xl" className="text-white" />
      </TouchableOpacity>

      {/* Initial Loading */}
      {loading && materials.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text className="text-gray-600 mt-4">Loading materials...</Text>
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.filterModal}>
            <TouchableOpacity activeOpacity={1}>
              <VStack space="md">
                <Text className="text-lg font-bold text-black">
                  Filter by Type
                </Text>

                {materialTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => {
                      setTypeFilter(type.value);
                      setShowFilterModal(false);
                    }}
                    style={[
                      styles.filterOption,
                      typeFilter === type.value && styles.filterOptionActive,
                    ]}
                  >
                    <Text
                      className={
                        typeFilter === type.value
                          ? "text-white font-semibold"
                          : "text-black"
                      }
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </VStack>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        transparent
        animationType="slide"
        onRequestClose={resetUploadForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.uploadModal}>
            <ScrollView contentContainerStyle={styles.uploadModalContent}>
              <VStack space="lg">
                {/* Header */}
                <HStack className="justify-between items-center">
                  <HStack space="sm" className="items-center">
                    <Shield size={20} color="#8B5CF6" />
                    <Text className="text-xl font-bold text-black">
                      Upload Material
                    </Text>
                  </HStack>
                  <TouchableOpacity onPress={resetUploadForm}>
                    <Icon as={X} size="lg" className="text-gray-500" />
                  </TouchableOpacity>
                </HStack>

                {/* Title */}
                <VStack space="xs">
                  <Text className="text-sm font-semibold text-gray-700">
                    Title *
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter material title"
                    value={uploadTitle}
                    onChangeText={setUploadTitle}
                    placeholderTextColor="#9CA3AF"
                  />
                </VStack>

                {/* Type */}
                <VStack space="xs">
                  <Text className="text-sm font-semibold text-gray-700">
                    Type *
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <HStack space="sm">
                      {materialTypes.slice(1).map((type) => (
                        <TouchableOpacity
                          key={type.value}
                          onPress={() => setUploadType(type.value as any)}
                          style={[
                            styles.typeChip,
                            uploadType === type.value && styles.typeChipActive,
                          ]}
                        >
                          <Text
                            className={
                              uploadType === type.value
                                ? "text-white font-semibold text-sm"
                                : "text-gray-700 text-sm"
                            }
                          >
                            {type.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </HStack>
                  </ScrollView>
                </VStack>

                {/* Description */}
                <VStack space="xs">
                  <Text className="text-sm font-semibold text-gray-700">
                    Description
                  </Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Add a description (optional)"
                    value={uploadDescription}
                    onChangeText={setUploadDescription}
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                  />
                </VStack>

                {/* Upload Mode Toggle */}
                <HStack space="sm">
                  <TouchableOpacity
                    onPress={() => setUploadMode("file")}
                    style={[
                      styles.modeButton,
                      uploadMode === "file" && styles.modeButtonActive,
                    ]}
                  >
                    <Icon
                      as={File}
                      size="sm"
                      className={uploadMode === "file" ? "text-white" : "text-gray-700"}
                    />
                    <Text
                      className={
                        uploadMode === "file"
                          ? "text-white font-semibold ml-2"
                          : "text-gray-700 ml-2"
                      }
                    >
                      Upload File
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setUploadMode("url")}
                    style={[
                      styles.modeButton,
                      uploadMode === "url" && styles.modeButtonActive,
                    ]}
                  >
                    <Icon
                      as={Link}
                      size="sm"
                      className={uploadMode === "url" ? "text-white" : "text-gray-700"}
                    />
                    <Text
                      className={
                        uploadMode === "url"
                          ? "text-white font-semibold ml-2"
                          : "text-gray-700 ml-2"
                      }
                    >
                      Add URL
                    </Text>
                  </TouchableOpacity>
                </HStack>

                {/* File Upload or URL Input */}
                {uploadMode === "file" ? (
                  <VStack space="xs">
                    <Text className="text-sm font-semibold text-gray-700">
                      Select File *
                    </Text>
                    <FilePicker
                      onFileSelect={setSelectedFile}
                      onClear={() => setSelectedFile(null)}
                      selectedFile={selectedFile}
                      disabled={isUploading}
                      fileType="document"
                      label="Click to select file"
                    />
                    <UploadProgressBar progress={progress} />
                    {uploadError && (
                      <Text className="text-red-600 text-sm">{uploadError}</Text>
                    )}
                  </VStack>
                ) : (
                  <>
                    <VStack space="xs">
                      <Text className="text-sm font-semibold text-gray-700">
                        URL / Link *
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="https://example.com/file.pdf"
                        value={uploadUrl}
                        onChangeText={setUploadUrl}
                        placeholderTextColor="#9CA3AF"
                        keyboardType="url"
                        autoCapitalize="none"
                      />
                    </VStack>

                    <VStack space="xs">
                      <Text className="text-sm font-semibold text-gray-700">
                        File Size
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g., 2.5 MB (optional)"
                        value={uploadFileSize}
                        onChangeText={setUploadFileSize}
                        placeholderTextColor="#9CA3AF"
                      />
                    </VStack>
                  </>
                )}

                {/* Buttons */}
                <HStack space="sm" className="mt-4">
                  <TouchableOpacity
                    onPress={resetUploadForm}
                    style={[styles.button, styles.buttonSecondary]}
                    disabled={isUploading}
                  >
                    <Text className="text-black font-semibold">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleUpload}
                    style={[styles.button, styles.buttonPrimary]}
                    disabled={
                      isUploading ||
                      !uploadTitle.trim() ||
                      (uploadMode === "file" ? !selectedFile : !uploadUrl.trim())
                    }
                  >
                    {isUploading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <HStack space="xs" className="items-center">
                        <Icon as={Upload} size="sm" className="text-white" />
                        <Text className="text-white font-semibold">Upload</Text>
                      </HStack>
                    )}
                  </TouchableOpacity>
                </HStack>
              </VStack>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  iconButtonActive: {
    backgroundColor: "#000000",
  },
  deleteButton: {
    backgroundColor: "#FEE2E2",
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
    fontFamily: "System",
  },
  activeFilter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingMore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  endMessage: {
    paddingVertical: 16,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#8B5CF6",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  filterModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  filterOption: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterOptionActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  uploadModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  uploadModalContent: {
    padding: 24,
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
    height: 100,
    textAlignVertical: "top",
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  typeChipActive: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSecondary: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  buttonPrimary: {
    backgroundColor: "#8B5CF6",
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modeButtonActive: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
});
