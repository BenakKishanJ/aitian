import React from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import {
  FileText,
  Video,
  Link as LinkIcon,
  Download,
  Trash2,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Icon } from "@/components/ui/icon";
import { Material } from "@/lib/hooks/useMaterials";

interface MaterialCardProps {
  material: Material;
  role: "student" | "teacher" | "parent" | "admin";
  onDelete?: (materialId: string) => void;
}

export function MaterialCard({ material, role, onDelete }: MaterialCardProps) {
  const getTypeIcon = () => {
    switch (material.type) {
      case "pdf":
      case "document":
        return FileText;
      case "video":
        return Video;
      case "link":
        return LinkIcon;
      default:
        return FileText;
    }
  };

  const getTypeColor = () => {
    switch (material.type) {
      case "pdf":
      case "document":
        return "#EF4444";
      case "video":
        return "#8B5CF6";
      case "link":
        return "#3B82F6";
      default:
        return "#6B7280";
    }
  };

  const getTypeBadgeStyle = () => {
    switch (material.type) {
      case "pdf":
      case "document":
        return { backgroundColor: "#FEE2E2", color: "#991B1B" };
      case "video":
        return { backgroundColor: "#F3E8FF", color: "#6B21A8" };
      case "link":
        return { backgroundColor: "#DBEAFE", color: "#1E40AF" };
      default:
        return { backgroundColor: "#F3F4F6", color: "#374151" };
    }
  };

  const handleOpen = async () => {
    try {
      const supported = await Linking.canOpenURL(material.url);
      if (supported) {
        await Linking.openURL(material.url);
      } else {
        Alert.alert("Error", "Cannot open this URL");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open material");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Material",
      `Are you sure you want to delete "${material.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete?.(material.id),
        },
      ],
    );
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const canDelete = role === "teacher" || role === "admin";
  const TypeIcon = getTypeIcon();
  const typeColor = getTypeColor();
  const typeBadge = getTypeBadgeStyle();

  return (
    <TouchableOpacity
      onPress={handleOpen}
      activeOpacity={0.7}
      style={styles.card}
    >
      <HStack className="items-start justify-between">
        {/* Left Side - Icon and Content */}
        <HStack space="md" className="flex-1 items-start">
          {/* Type Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: typeColor + "20" },
            ]}
          >
            <Icon as={TypeIcon} size="md" style={{ color: typeColor }} />
          </View>

          {/* Content */}
          <VStack space="xs" className="flex-1">
            {/* Title */}
            <Text
              className="text-base font-semibold text-black"
              numberOfLines={2}
            >
              {material.title}
            </Text>

            {/* Description */}
            {material.description && (
              <Text className="text-sm text-gray-600" numberOfLines={2}>
                {material.description}
              </Text>
            )}

            {/* Meta Info */}
            <HStack space="sm" className="items-center flex-wrap mt-1">
              {/* Type Badge */}
              <View
                style={[
                  styles.badge,
                  { backgroundColor: typeBadge.backgroundColor },
                ]}
              >
                <Text style={[styles.badgeText, { color: typeBadge.color }]}>
                  {material.type.toUpperCase()}
                </Text>
              </View>

              {/* File Size */}
              {material.fileSize && (
                <>
                  <Text className="text-xs text-gray-400">•</Text>
                  <Text className="text-xs text-gray-500">
                    {material.fileSize}
                  </Text>
                </>
              )}

              {/* Upload Date */}
              <Text className="text-xs text-gray-400">•</Text>
              <Text className="text-xs text-gray-500">
                {formatDate(material.uploadedAt)}
              </Text>
            </HStack>

            {/* Uploader */}
            {material.uploadedByName && (
              <Text className="text-xs text-gray-500 mt-1">
                By {material.uploadedByName}
              </Text>
            )}

            {/* Tags */}
            {material.tags && material.tags.length > 0 && (
              <HStack space="xs" className="flex-wrap mt-2">
                {material.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text className="text-xs text-gray-600">#{tag}</Text>
                  </View>
                ))}
              </HStack>
            )}
          </VStack>
        </HStack>

        {/* Right Side - Actions */}
        {canDelete && (
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.deleteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon as={Trash2} size="sm" className="text-gray-500" />
          </TouchableOpacity>
        )}
      </HStack>

      {/* Download Hint */}
      <View style={styles.downloadHint}>
        <HStack space="xs" className="items-center">
          <Icon as={Download} size="xs" className="text-gray-400" />
          <Text className="text-xs text-gray-500">Tap to open</Text>
        </HStack>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  tag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  downloadHint: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
});
