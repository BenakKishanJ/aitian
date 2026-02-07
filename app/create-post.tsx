import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Image as ImageIcon,
  X,
  Users,
  BookOpen,
  Calendar,
  Pin,
  Send,
  FileText,
} from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import { usePostUpload } from "@/lib/hooks/usePostUpload";
import { FilePicker, type PickedFile } from "@/components/ui/FilePicker";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { Heading } from "@/components/ui/heading";
import {
  Radio,
  RadioGroup,
  RadioIcon,
  RadioIndicator,
  RadioLabel,
} from "@/components/ui/radio";
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
} from "@/components/ui/select";
import { Divider } from "@/components/ui/divider";
import type { TargetAudience } from "@/types";

type AudienceType = "all" | "department" | "semester" | "departmentSemester";

const DEPARTMENTS = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "ISE"];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const MAX_FILES = 5;

export default function CreatePostScreen() {
  const { userData, role } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audienceType, setAudienceType] = useState<AudienceType>("all");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<PickedFile[]>([]);

  const {
    createPost,
    isUploading,
    uploadProgress,
    currentFileIndex,
    totalFiles,
    error,
    resetUpload,
  } = usePostUpload();

  const isAdmin = role === "admin";

  const validateForm = (): boolean => {
    if (!title.trim() && !content.trim()) {
      Alert.alert("Error", "Please provide at least a title or content");
      return false;
    }

    if (title.trim().length > 0 && title.trim().length < 3) {
      Alert.alert("Error", "Title must be at least 3 characters");
      return false;
    }

    if (content.trim().length > 0 && content.trim().length < 10) {
      Alert.alert("Error", "Content must be at least 10 characters");
      return false;
    }

    if (audienceType === "department" && !selectedDepartment) {
      Alert.alert("Error", "Please select a department");
      return false;
    }

    if (audienceType === "semester" && !selectedSemester) {
      Alert.alert("Error", "Please select a semester");
      return false;
    }

    if (
      audienceType === "departmentSemester" &&
      (!selectedDepartment || !selectedSemester)
    ) {
      Alert.alert("Error", "Please select both department and semester");
      return false;
    }

    return true;
  };

  const handlePost = async () => {
    if (!validateForm() || !userData) return;

    try {
      const targetAudience: TargetAudience = {
        type: audienceType,
      };

      if (
        audienceType === "department" ||
        audienceType === "departmentSemester"
      ) {
        targetAudience.departmentId = selectedDepartment;
      }

      if (
        audienceType === "semester" ||
        audienceType === "departmentSemester"
      ) {
        targetAudience.semester = parseInt(selectedSemester);
      }

      await createPost(
        {
          title: title.trim(),
          content: content.trim(),
          isAnonymous,
          isPinned: isAdmin ? isPinned : false,
          targetAudience,
        },
        selectedFiles.length > 0 ? selectedFiles : undefined
      );

      Alert.alert("Success", "Post created successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error("Error creating post:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to create post. Please try again."
      );
    }
  };

  const handleFilesSelected = (files: PickedFile[]) => {
    // Check total file limit
    const totalFiles = selectedFiles.length + files.length;
    if (totalFiles > MAX_FILES) {
      Alert.alert(
        "Too Many Files",
        `You can only upload up to ${MAX_FILES} files per post.`
      );
      return;
    }
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <ImageIcon size={20} color="#10B981" />;
    }
    if (mimeType.startsWith("video/")) {
      return <Icon as={ImageIcon} size="sm" className="text-purple-500" />;
    }
    return <FileText size={20} color="#3B82F6" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-black pt-16 pb-4 px-6">
        <HStack className="items-center justify-between">
          <HStack className="items-center flex-1" space="md">
            <TouchableOpacity onPress={() => router.back()}>
              <Icon as={ArrowLeft} size="lg" className="text-white" />
            </TouchableOpacity>
            <Heading size="xl" className="text-white font-bold">
              Create Post
            </Heading>
          </HStack>
          <Button
            onPress={handlePost}
            disabled={isUploading}
            size="sm"
            className="bg-white"
          >
            <ButtonIcon as={Send} className="text-black" />
            <ButtonText className="text-black font-semibold ml-1">
              {isUploading ? "Posting..." : "Post"}
            </ButtonText>
          </Button>
        </HStack>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <VStack className="p-6" space="lg">
          {/* Title Input */}
          <VStack space="xs">
            <Text className="text-sm font-semibold text-gray-700">
              Title <Text className="text-gray-400">(Optional)</Text>
            </Text>
            <Input variant="outline" size="lg" className="border-gray-300">
              <InputField
                value={title}
                onChangeText={setTitle}
                placeholder="Enter post title..."
                className="text-black"
                maxLength={100}
                editable={!isUploading}
              />
            </Input>
            <Text className="text-xs text-gray-500">
              {title.length}/100 characters
            </Text>
          </VStack>

          {/* Content Input */}
          <VStack space="xs">
            <Text className="text-sm font-semibold text-gray-700">
              Content <Text className="text-gray-400">(Required)</Text>
            </Text>
            <Textarea size="md" className="border-gray-300 min-h-[120px]">
              <TextareaInput
                value={content}
                onChangeText={setContent}
                placeholder="Write your announcement or news..."
                className="text-black"
                multiline
                numberOfLines={6}
                maxLength={1000}
                editable={!isUploading}
              />
            </Textarea>
            <Text className="text-xs text-gray-500">
              {content.length}/1000 characters
            </Text>
          </VStack>

          {/* Media Section */}
          <VStack space="sm">
            <Text className="text-sm font-semibold text-gray-700">
              Attachments{" "}
              <Text className="text-gray-400">
                ({selectedFiles.length}/{MAX_FILES})
              </Text>
            </Text>

            {isUploading ? (
              <View className="bg-gray-50 rounded-lg p-6 items-center">
                <ActivityIndicator size="large" color="#000000" />
                <Text className="text-gray-700 mt-3 font-medium">
                  Uploading files...
                </Text>
                {totalFiles > 0 && (
                  <Text className="text-gray-500 text-sm mt-1">
                    File {currentFileIndex} of {totalFiles}
                  </Text>
                )}
                <View className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <View
                    className="bg-black h-2 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </View>
                <Text className="text-gray-500 text-xs mt-2">
                  {Math.round(uploadProgress)}%
                </Text>
              </View>
            ) : (
              <FilePicker
                onFileSelect={(file) => handleFilesSelected([file])}
                onMultipleSelect={handleFilesSelected}
                selectedFiles={selectedFiles}
                allowMultiple={true}
                disabled={isUploading}
                fileType="any"
                label="Add Photos, Videos, or Documents"
                maxSizeMB={10}
              />
            )}

            {/* Selected Files List */}
            {selectedFiles.length > 0 && !isUploading && (
              <VStack space="xs" className="mt-2">
                {selectedFiles.map((file, index) => (
                  <HStack
                    key={index}
                    className="items-center justify-between bg-gray-100 rounded-lg p-3"
                  >
                    <HStack space="sm" className="items-center flex-1">
                      {getFileIcon(file.mimeType)}
                      <VStack className="flex-1">
                        <Text
                          className="text-sm text-gray-700 font-medium"
                          numberOfLines={1}
                        >
                          {file.name}
                        </Text>
                        {file.size > 0 && (
                          <Text className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                    <TouchableOpacity
                      onPress={() => handleRemoveFile(index)}
                      disabled={isUploading}
                      className="p-1"
                    >
                      <Icon as={X} size="sm" className="text-gray-600" />
                    </TouchableOpacity>
                  </HStack>
                ))}
              </VStack>
            )}
          </VStack>

          <Divider className="bg-gray-200" />

          {/* Target Audience */}
          <VStack space="md">
            <HStack className="items-center" space="xs">
              <Icon as={Users} size="sm" className="text-gray-700" />
              <Text className="text-sm font-semibold text-gray-700">
                Target Audience
              </Text>
            </HStack>

            <RadioGroup
              value={audienceType}
              onChange={(value) => setAudienceType(value as AudienceType)}
            >
              <VStack space="sm">
                <Radio value="all" isDisabled={isUploading}>
                  <RadioIndicator>
                    <RadioIcon />
                  </RadioIndicator>
                  <RadioLabel>
                    <Text className="text-gray-700">Everyone</Text>
                  </RadioLabel>
                </Radio>

                <Radio value="department" isDisabled={isUploading}>
                  <RadioIndicator>
                    <RadioIcon />
                  </RadioIndicator>
                  <RadioLabel>
                    <Text className="text-gray-700">Specific Department</Text>
                  </RadioLabel>
                </Radio>

                <Radio value="semester" isDisabled={isUploading}>
                  <RadioIndicator>
                    <RadioIcon />
                  </RadioIndicator>
                  <RadioLabel>
                    <Text className="text-gray-700">Specific Semester</Text>
                  </RadioLabel>
                </Radio>

                <Radio value="departmentSemester" isDisabled={isUploading}>
                  <RadioIndicator>
                    <RadioIcon />
                  </RadioIndicator>
                  <RadioLabel>
                    <Text className="text-gray-700">
                      Specific Department & Semester
                    </Text>
                  </RadioLabel>
                </Radio>
              </VStack>
            </RadioGroup>

            {/* Department Selector */}
            {(audienceType === "department" ||
              audienceType === "departmentSemester") && (
              <VStack space="xs" className="mt-2">
                <Text className="text-xs font-semibold text-gray-600 uppercase">
                  Select Department
                </Text>
                <Select
                  selectedValue={selectedDepartment}
                  onValueChange={setSelectedDepartment}
                  isDisabled={isUploading}
                >
                  <SelectTrigger variant="outline" size="md">
                    <SelectInput
                      placeholder="Choose department"
                      className="text-black"
                    />
                    <SelectIcon as={BookOpen} className="text-gray-600 mr-2" />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent>
                      <SelectDragIndicatorWrapper>
                        <SelectDragIndicator />
                      </SelectDragIndicatorWrapper>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} label={dept} value={dept} />
                      ))}
                    </SelectContent>
                  </SelectPortal>
                </Select>
              </VStack>
            )}

            {/* Semester Selector */}
            {(audienceType === "semester" ||
              audienceType === "departmentSemester") && (
              <VStack space="xs" className="mt-2">
                <Text className="text-xs font-semibold text-gray-600 uppercase">
                  Select Semester
                </Text>
                <Select
                  selectedValue={selectedSemester}
                  onValueChange={setSelectedSemester}
                  isDisabled={isUploading}
                >
                  <SelectTrigger variant="outline" size="md">
                    <SelectInput
                      placeholder="Choose semester"
                      className="text-black"
                    />
                    <SelectIcon as={Calendar} className="text-gray-600 mr-2" />
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
              </VStack>
            )}
          </VStack>

          <Divider className="bg-gray-200" />

          {/* Post Options */}
          <VStack space="md">
            <Text className="text-sm font-semibold text-gray-700">
              Post Options
            </Text>

            {/* Anonymous Toggle */}
            <HStack className="items-center justify-between">
              <VStack className="flex-1">
                <Text className="text-gray-700 font-medium">
                  Post Anonymously
                </Text>
                <Text className="text-gray-500 text-xs">
                  Your name will be hidden from viewers
                </Text>
              </VStack>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                disabled={isUploading}
                trackColor={{ false: "#d1d5db", true: "#000000" }}
                thumbColor={isAnonymous ? "#ffffff" : "#f3f4f6"}
              />
            </HStack>

            {/* Pin Toggle (Admin only) */}
            {isAdmin && (
              <HStack className="items-center justify-between">
                <VStack className="flex-1">
                  <HStack className="items-center" space="xs">
                    <Icon as={Pin} size="xs" className="text-gray-700" />
                    <Text className="text-gray-700 font-medium">
                      Pin this post
                    </Text>
                  </HStack>
                  <Text className="text-gray-500 text-xs">
                    Pinned posts appear at the top of the feed
                  </Text>
                </VStack>
                <Switch
                  value={isPinned}
                  onValueChange={setIsPinned}
                  disabled={isUploading}
                  trackColor={{ false: "#d1d5db", true: "#000000" }}
                  thumbColor={isPinned ? "#ffffff" : "#f3f4f6"}
                />
              </HStack>
            )}
          </VStack>

          {/* Preview Section */}
          <VStack
            space="sm"
            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
          >
            <Text className="text-xs font-semibold text-gray-600 uppercase">
              Preview
            </Text>
            <VStack space="xs">
              {title.trim() && (
                <Text className="text-black font-bold text-base">
                  {title.trim()}
                </Text>
              )}
              {content.trim() && (
                <Text className="text-gray-700 text-sm">{content.trim()}</Text>
              )}
              {selectedFiles.length > 0 && (
                <Text className="text-gray-500 text-xs">
                  {selectedFiles.length} file
                  {selectedFiles.length !== 1 ? "s" : ""} attached
                </Text>
              )}
              {!title.trim() && !content.trim() && selectedFiles.length === 0 && (
                <Text className="text-gray-400 text-sm italic">
                  Your post preview will appear here...
                </Text>
              )}
            </VStack>
          </VStack>

          <View className="h-8" />
        </VStack>
      </ScrollView>
    </View>
  );
}
