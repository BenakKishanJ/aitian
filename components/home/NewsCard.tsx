import React from 'react';

import { VStack } from '../ui/vstack';
import { HStack } from '../ui/hstack';
import { Text } from '../ui/text';
import { Box } from '../ui/box';
import { Button, ButtonText } from '../ui/button';
import { Badge, BadgeText } from '../ui/badge';

import { MessageSquare, Pin, User, Clock } from 'lucide-react-native';

interface NewsCardProps {
  title: string;
  content: string;
  author: string;
  time: string;
  isPinned: boolean;
  hasAttachment?: boolean;
  onPress?: () => void;
}

export function NewsCard({
  title,
  content,
  author,
  time,
  isPinned,
  hasAttachment = false,
  onPress
}: NewsCardProps) {
  // Truncate content if too long
  const truncatedContent = content.length > 100
    ? `${content.substring(0, 100)}...`
    : content;

  return (
    <Button
      variant="outline"
      className="bg-white border border-gray-200 h-auto p-4 mb-3 active:opacity-90"
      onPress={onPress}
    >
      <VStack className="w-full" space="sm">
        {/* Header */}
        <HStack className="items-start justify-between">
          <VStack className="flex-1" space="xs">
            <HStack className="items-center" space="sm">
              {isPinned && (
                <Pin size={16} color="#8B5CF6" />
              )}
              <Text className="font-bold text-lg text-gray-900 flex-1">
                {title}
              </Text>
            </HStack>

            {/* Author and time */}
            <HStack className="items-center" space="sm">
              <User size={14} color="#6B7280" />
              <Text className="text-gray-600 text-sm">{author}</Text>
              <Box className="w-1 h-1 bg-gray-300 rounded-full" />
              <Clock size={14} color="#6B7280" />
              <Text className="text-gray-600 text-sm">{time}</Text>
            </HStack>
          </VStack>

          {hasAttachment && (
            <Badge size="sm" variant="outline" className="border-blue-300">
              <BadgeText className="text-blue-600">Attachment</BadgeText>
            </Badge>
          )}
        </HStack>

        {/* Content */}
        <Text className="text-gray-700 mt-1">{truncatedContent}</Text>

        {/* Footer */}
        <HStack className="items-center justify-between mt-2">
          <HStack className="items-center" space="sm">
            <MessageSquare size={16} color="#6B7280" />
            <Text className="text-gray-500 text-sm">Comments</Text>
          </HStack>

          {isPinned && (
            <Badge size="sm" variant="solid" className="bg-purple-100">
              <BadgeText className="text-purple-700">Pinned</BadgeText>
            </Badge>
          )}
        </HStack>
      </VStack>
    </Button>
  );
}
