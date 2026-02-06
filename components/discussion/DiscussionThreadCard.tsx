import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import {
  MessageCircle,
  Pin,
  MoreVertical,
  User,
  GraduationCap,
  Shield,
  Clock,
} from 'lucide-react-native';
import type { Discussion } from '@/types';

interface DiscussionThreadCardProps {
  discussion: Discussion;
  onPress?: () => void;
  onTogglePin?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function DiscussionThreadCard({
  discussion,
  onPress,
  onTogglePin,
  onDelete,
  showActions = true,
}: DiscussionThreadCardProps) {
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
    switch (discussion.createdByRole) {
      case 'teacher':
        return <GraduationCap size={14} color="#FFFFFF" />;
      case 'admin':
        return <Shield size={14} color="#FFFFFF" />;
      default:
        return <User size={14} color="#FFFFFF" />;
    }
  };

  const getRoleColor = () => {
    switch (discussion.createdByRole) {
      case 'teacher':
        return '#3B82F6';
      case 'admin':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const getRoleLabel = () => {
    switch (discussion.createdByRole) {
      case 'teacher':
        return 'Teacher';
      case 'admin':
        return 'Admin';
      default:
        return 'Student';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, discussion.isPinned && styles.cardPinned]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Pin Badge */}
      {discussion.isPinned && (
        <View style={styles.pinnedBadge}>
          <Pin size={12} color="#FFFFFF" />
          <Text style={styles.pinnedText}>Pinned</Text>
        </View>
      )}

      {/* Header */}
      <HStack space="md" style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: getRoleColor() }]}>
          {getRoleIcon()}
        </View>

        <VStack space="xs" style={styles.authorInfo}>
          <HStack space="sm" style={styles.authorRow}>
            <Text style={styles.authorName}>{discussion.createdByName}</Text>
            <View style={[styles.roleBadge, { backgroundColor: `${getRoleColor()}20` }]}>
              <Text style={[styles.roleText, { color: getRoleColor() }]}>
                {getRoleLabel()}
              </Text>
            </View>
          </HStack>
          
          <HStack space="sm" style={styles.metaRow}>
            <Clock size={12} color="#9CA3AF" />
            <Text style={styles.timeText}>{formatTimeAgo(discussion.createdAt)}</Text>
          </HStack>
        </VStack>

        {showActions && (
          <TouchableOpacity
            style={styles.moreButton}
            onPress={(e) => {
              e.stopPropagation();
              // Show action sheet
            }}
          >
            <MoreVertical size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </HStack>

      {/* Content */}
      <VStack space="sm" style={styles.content}>
        <Text style={styles.title}>{discussion.title}</Text>
        <Text style={styles.body} numberOfLines={3}>
          {discussion.content}
        </Text>
      </VStack>

      {/* Footer */}
      <HStack space="md" style={styles.footer}>
        <HStack space="xs" style={styles.statItem}>
          <MessageCircle size={16} color="#6B7280" />
          <Text style={styles.statText}>
            {discussion.replyCount || 0} {discussion.replyCount === 1 ? 'reply' : 'replies'}
          </Text>
        </HStack>

        {showActions && onTogglePin && (
          <TouchableOpacity
            style={[
              styles.pinButton,
              discussion.isPinned && styles.pinButtonActive,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
          >
            <Pin
              size={14}
              color={discussion.isPinned ? '#FFFFFF' : '#6B7280'}
            />
            <Text
              style={[
                styles.pinButtonText,
                discussion.isPinned && styles.pinButtonTextActive,
              ]}
            >
              {discussion.isPinned ? 'Unpin' : 'Pin'}
            </Text>
          </TouchableOpacity>
        )}
      </HStack>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardPinned: {
    borderLeftColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 10,
    gap: 4,
  },
  pinnedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  header: {
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorInfo: {
    flex: 1,
  },
  authorRow: {
    alignItems: 'center',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metaRow: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  moreButton: {
    padding: 4,
  },
  content: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  body: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    color: '#6B7280',
  },
  pinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  pinButtonActive: {
    backgroundColor: '#F59E0B',
  },
  pinButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  pinButtonTextActive: {
    color: '#FFFFFF',
  },
});
