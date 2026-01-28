import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Platform,
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
} from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/* Gluestack UI Components */
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

type AudienceType = "all" | "department" | "semester" | "departmentSemester";

const DEPARTMENTS = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "ISE"];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

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
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);

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

    setPosting(true);
    try {
      const targetAudience: any = {
        type: audienceType,
      };

      if (
        audienceType === "department" ||
        audienceType === "departmentSemester"
      ) {
        targetAudience.department = selectedDepartment;
      }

      if (
        audienceType === "semester" ||
        audienceType === "departmentSemester"
      ) {
        targetAudience.semester = parseInt(selectedSemester);
      }

      const postData = {
        title: title.trim(),
        content: content.trim(),
        mediaUrls: mediaUrls,
        postedBy: userData.uid,
        authorName: userData.name,
        authorRole: userData.role,
        isAnonymous: isAnonymous,
        isPinned: isAdmin ? isPinned : false,
        targetAudience: targetAudience,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "newsPosts"), postData);

      Alert.alert("Success", "Post created successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", "Failed to create post. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const handleAddMedia = () => {
    // Placeholder for image picker - will implement actual upload later
    Alert.alert(
      "Media Upload",
      "Image/Video upload feature coming soon!\n\nFor now, you can add image URLs manually in the next update.",
      [{ text: "OK" }],
    );
  };

  const handleRemoveMedia = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
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
            disabled={posting}
            size="sm"
            className="bg-white"
          >
            <ButtonIcon as={Send} className="text-black" />
            <ButtonText className="text-black font-semibold ml-1">
              {posting ? "Posting..." : "Post"}
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
              />
            </Textarea>
            <Text className="text-xs text-gray-500">
              {content.length}/1000 characters
            </Text>
          </VStack>

          {/* Media Section */}
          <VStack space="sm">
            <Text className="text-sm font-semibold text-gray-700">
              Media <Text className="text-gray-400">(Optional)</Text>
            </Text>
            <TouchableOpacity
              onPress={handleAddMedia}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 items-center"
            >
              <Icon as={ImageIcon} size="lg" className="text-gray-400 mb-2" />
              <Text className="text-gray-600 text-sm">
                Add Images or Videos
              </Text>
              <Text className="text-gray-400 text-xs mt-1">Coming soon</Text>
            </TouchableOpacity>

            {mediaUrls.length > 0 && (
              <VStack space="xs" className="mt-2">
                {mediaUrls.map((url, index) => (
                  <HStack
                    key={index}
                    className="items-center justify-between bg-gray-100 rounded-lg p-3"
                  >
                    <Text
                      className="text-sm text-gray-700 flex-1"
                      numberOfLines={1}
                    >
                      {url}
                    </Text>
                    <TouchableOpacity onPress={() => handleRemoveMedia(index)}>
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

            <RadioGroup value={audienceType} onChange={setAudienceType}>
              <VStack space="sm">
                <Radio value="all">
                  <RadioIndicator>
                    <RadioIcon />
                  </RadioIndicator>
                  <RadioLabel>
                    <Text className="text-gray-700">Everyone</Text>
                  </RadioLabel>
                </Radio>

                <Radio value="department">
                  <RadioIndicator>
                    <RadioIcon />
                  </RadioIndicator>
                  <RadioLabel>
                    <Text className="text-gray-700">Specific Department</Text>
                  </RadioLabel>
                </Radio>

                <Radio value="semester">
                  <RadioIndicator>
                    <RadioIcon />
                  </RadioIndicator>
                  <RadioLabel>
                    <Text className="text-gray-700">Specific Semester</Text>
                  </RadioLabel>
                </Radio>

                <Radio value="departmentSemester">
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
              {!title.trim() && !content.trim() && (
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
