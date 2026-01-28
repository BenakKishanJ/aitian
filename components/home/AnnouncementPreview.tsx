import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { MessageSquare, Pin, Clock } from 'lucide-react-native';

interface AnnouncementPreviewProps {
  title: string;
  content: string;
  authorName: string;
  timestamp: Date;
  isPinned?: boolean;
  onPress?: () => void;
}

export function AnnouncementPreview({
  title,
  content,
  authorName,
  timestamp,
  isPinned = false,
  onPress,
}: AnnouncementPreviewProps) {
  const getTimeAgo = () => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;

    return timestamp.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const content_element = (
    <View style={[styles.card, isPinned && styles.cardPinned]}>
      {isPinned && (
        <View style={styles.pinnedBadge}>
          <Pin size={12} color="#000000" strokeWidth={2} fill="#000000" />
          <Text style={styles.pinnedText}>Pinned</Text>
        </View>
      )}

      <VStack space="sm">
        {/* Header */}
        <HStack space="sm" className="items-center justify-between">
          <View style={styles.iconContainer}>
            <MessageSquare size={16} color="#6B7280" strokeWidth={2} />
          </View>
          <HStack space="xs" className="items-center flex-1">
            <Text style={styles.author} numberOfLines={1}>
              {authorName}
            </Text>
            <Text style={styles.dot}>•</Text>
            <HStack space="xs" className="items-center">
              <Clock size={10} color="#9CA3AF" strokeWidth={2} />
              <Text style={styles.time}>{getTimeAgo()}</Text>
            </HStack>
          </HStack>
          <Text style={styles.arrow}>›</Text>
        </HStack>

        {/* Content */}
        <VStack space="xs">
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.content} numberOfLines={2}>
            {content}
          </Text>
        </VStack>
      </VStack>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content_element}
      </TouchableOpacity>
    );
  }

  return content_element;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardPinned: {
    borderColor: '#000000',
    borderWidth: 1.5,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
    gap: 4,
  },
  pinnedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  author: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  dot: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  time: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  content: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 18,
  },
  arrow: {
    fontSize: 24,
    color: '#D1D5DB',
  },
});
