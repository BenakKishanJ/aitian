import React from "react";
import { TouchableOpacity, View, StyleSheet, Alert } from "react-native";
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Trash2,
  Award,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Icon } from "@/components/ui/icon";
import { Assignment } from "@/lib/hooks/useAssignments";

interface AssignmentCardProps {
  assignment: Assignment;
  role: "student" | "teacher" | "parent" | "admin";
  onPress: (assignment: Assignment) => void;
  onDelete?: (assignmentId: string) => void;
}

export function AssignmentCard({
  assignment,
  role,
  onPress,
  onDelete,
}: AssignmentCardProps) {
  const getStatusInfo = () => {
    const status = assignment.submissionStatus;

    switch (status) {
      case "graded":
        return {
          icon: Award,
          color: "#10B981",
          bgColor: "#D1FAE5",
          text: "Graded",
        };
      case "submitted":
        return {
          icon: CheckCircle,
          color: "#3B82F6",
          bgColor: "#DBEAFE",
          text: "Submitted",
        };
      case "overdue":
        return {
          icon: XCircle,
          color: "#EF4444",
          bgColor: "#FEE2E2",
          text: "Overdue",
        };
      case "pending":
      default:
        return {
          icon: Clock,
          color: "#F59E0B",
          bgColor: "#FEF3C7",
          text: "Pending",
        };
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return `Today, ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const isOverdue = () => {
    if (!assignment.dueDate) return false;
    const dueDate = assignment.dueDate.toDate
      ? assignment.dueDate.toDate()
      : new Date(assignment.dueDate);
    return new Date() > dueDate;
  };

  const getDaysUntilDue = () => {
    if (!assignment.dueDate) return null;
    const dueDate = assignment.dueDate.toDate
      ? assignment.dueDate.toDate()
      : new Date(assignment.dueDate);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return null;
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `${diffDays} days left`;
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Assignment",
      `Are you sure you want to delete "${assignment.title}"? This will also delete all submissions.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete?.(assignment.id),
        },
      ]
    );
  };

  const canDelete = role === "teacher" || role === "admin";
  const statusInfo = getStatusInfo();
  const daysUntil = getDaysUntilDue();
  const overdueStatus = isOverdue();

  return (
    <TouchableOpacity
      onPress={() => onPress(assignment)}
      activeOpacity={0.7}
      style={styles.card}
    >
      <VStack space="md">
        {/* Header */}
        <HStack className="justify-between items-start">
          <VStack space="xs" className="flex-1">
            <Text className="text-lg font-bold text-black" numberOfLines={2}>
              {assignment.title}
            </Text>

            {/* Status Badge (for students/parents) */}
            {(role === "student" || role === "parent") &&
              assignment.submissionStatus && (
                <HStack space="xs" className="items-center">
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusInfo.bgColor },
                    ]}
                  >
                    <Icon
                      as={statusInfo.icon}
                      size="xs"
                      style={{ color: statusInfo.color }}
                    />
                    <Text
                      style={[styles.statusText, { color: statusInfo.color }]}
                    >
                      {statusInfo.text}
                    </Text>
                  </View>

                  {/* Grade Display */}
                  {assignment.submission?.grade !== undefined && (
                    <View style={styles.gradeBadge}>
                      <Text className="text-sm font-bold text-green-700">
                        {assignment.submission.grade}
                        {assignment.maxScore && `/${assignment.maxScore}`}
                      </Text>
                    </View>
                  )}
                </HStack>
              )}
          </VStack>

          {/* Delete Button */}
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

        {/* Description */}
        <Text className="text-sm text-gray-600" numberOfLines={2}>
          {assignment.description}
        </Text>

        {/* Footer Info */}
        <VStack space="xs">
          {/* Due Date */}
          <HStack space="xs" className="items-center">
            <Icon
              as={Calendar}
              size="sm"
              style={{
                color: overdueStatus
                  ? "#EF4444"
                  : daysUntil
                  ? "#F59E0B"
                  : "#6B7280",
              }}
            />
            <Text
              className={`text-sm ${
                overdueStatus
                  ? "text-red-600 font-semibold"
                  : daysUntil
                  ? "text-amber-600"
                  : "text-gray-600"
              }`}
            >
              {overdueStatus ? "Overdue: " : "Due: "}
              {formatDate(assignment.dueDate)}
            </Text>
          </HStack>

          {/* Days Until Due */}
          {daysUntil && !overdueStatus && (
            <HStack space="xs" className="items-center">
              <Icon as={Clock} size="sm" className="text-amber-500" />
              <Text className="text-sm text-amber-600 font-semibold">
                {daysUntil}
              </Text>
            </HStack>
          )}

          {/* Creator Info (for students/parents) */}
          {(role === "student" || role === "parent") &&
            assignment.createdByName && (
              <Text className="text-xs text-gray-500">
                By {assignment.createdByName}
              </Text>
            )}

          {/* Max Score (if set) */}
          {assignment.maxScore && (
            <HStack space="xs" className="items-center">
              <Icon as={Award} size="sm" className="text-gray-600" />
              <Text className="text-sm text-gray-600">
                Max Score: {assignment.maxScore}
              </Text>
            </HStack>
          )}
        </VStack>

        {/* Attachment Indicator */}
        {assignment.attachmentUrl && (
          <View style={styles.attachmentHint}>
            <HStack space="xs" className="items-center">
              <Icon as={FileText} size="xs" className="text-blue-600" />
              <Text className="text-xs text-blue-600 font-medium">
                Has attachment
              </Text>
            </HStack>
          </View>
        )}
      </VStack>
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
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  gradeBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  attachmentHint: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
});
