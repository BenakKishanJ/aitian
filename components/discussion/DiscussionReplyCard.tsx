import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import {
  User,
  GraduationCap,
  Shield,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  Check,
  X,
} from 'lucide-react-native';
import type { DiscussionReply } from '@/types';

interface DiscussionReplyCardProps {
  reply: DiscussionReply;
  isFirst?: boolean;
  onEdit?: (content: string) => void;
  onDelete?: () => void;
  currentUserId?: string;
}

export function DiscussionReplyCard({
  reply,
  isFirst = false,
  onEdit,
  onDelete,
  currentUserId,
}: DiscussionReplyCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);
  const [showActions, setShowActions] = useState(false);

  const isOwner = currentUserId === reply.createdBy;

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getRoleIcon = () => {
    switch (reply.createdByRole) {
      case 'teacher':
        return <GraduationCap size={12} color="#FFFFFF" />;
      case 'admin':
        return <Shield size={12} color="#FFFFFF" />;
      default:
        return <User size={12} color="#FFFFFF" />;
    }
  };

  const getRoleColor = () => {
    switch (reply.createdByRole) {
      case 'teacher':
        return '#3B82F6';
      case 'admin':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const getRoleLabel = () => {
    switch (reply.createdByRole) {
      case 'teacher':
        return 'Teacher';
      case 'admin':
        return 'Admin';
      default:
        return 'Student';
    }
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(editContent.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(reply.content);
    setIsEditing(false);
  };

  return (
    <View style={[styles.container, isFirst && styles.firstReply]}>
      {/* Connector Line */}
      {!isFirst && <View style={styles.connector} />}

      <View style={styles.card}>
        {/* Header */}
        <HStack space="sm" style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: getRoleColor() }]}>
            {getRoleIcon()}
          </View>

          <VStack space="xs" style={styles.authorInfo}>
            <HStack space="sm" style={styles.authorRow}>
              <Text style={styles.authorName}>{reply.createdByName}</Text>
              <View style={[styles.roleBadge, { backgroundColor: `${getRoleColor()}20` }]}>
                <Text style={[styles.roleText, { color: getRoleColor() }]}>
                  {getRoleLabel()}
                </Text>
              </View>
              {reply.isTeacherReply && (
                <View style={styles.teacherBadge}>
                  <Text style={styles.teacherBadgeText}>Official</Text>
                </View>
              )}
            </HStack>
            
            <HStack space="sm" style={styles.metaRow}>
              <Clock size={10} color="#9CA3AF" />
              <Text style={styles.timeText}>{formatTimeAgo(reply.createdAt)}</Text>
              {reply.updatedAt && (
                <Text style={styles.editedText}>(edited)</Text>
              )}
            </HStack>
          </VStack>

          {isOwner && !isEditing && (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => setShowActions(!showActions)}
            >
              <MoreVertical size={16} color="#6B7280" />
            </TouchableOpacity>
          )}
        </HStack>

        {/* Action Menu */}
        {showActions && !isEditing && (
          <HStack space="sm" style={styles.actionMenu}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setIsEditing(true);
                setShowActions(false);
              }}
            >
              <Edit2 size={14} color="#3B82F6" />
              <Text style={[styles.actionText, { color: '#3B82F6' }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                onDelete?.();
                setShowActions(false);
              }}
            >
              <Trash2 size={14} color="#EF4444" />
              <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
            </TouchableOpacity>
          </HStack>
        )}

        {/* Content */}
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={editContent}
              onChangeText={setEditContent}
              multiline
              autoFocus
            />
            <HStack space="sm" style={styles.editActions}>
              <TouchableOpacity
                style={[styles.editButton, styles.cancelButton]}
                onPress={handleCancelEdit}
              >
                <X size={16} color="#6B7280" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editButton, styles.saveButton]}
                onPress={handleSaveEdit}
              >
                <Check size={16} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </HStack>
          </View>
        ) : (
          <Text style={styles.content}>{reply.content}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingLeft: 20,
    marginBottom: 4,
  },
  firstReply: {
    paddingLeft: 0,
  },
  connector: {
    position: 'absolute',
    left: 6,
    top: -20,
    width: 2,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
  },
  header: {
    marginBottom: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorInfo: {
    flex: 1,
  },
  authorRow: {
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  authorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
  },
  teacherBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  teacherBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  metaRow: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  editedText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  moreButton: {
    padding: 2,
  },
  actionMenu: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  editContainer: {
    marginTop: 4,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  editActions: {
    justifyContent: 'flex-end',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#000000',
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
