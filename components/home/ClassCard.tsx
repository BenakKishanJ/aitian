import React from 'react';

import { VStack } from '../ui/vstack';
import { HStack } from '../ui/hstack';
import { Box } from '../ui/box';
import { Text } from '../ui/text';
import { Button, ButtonText } from '../ui/button';
import { Badge, BadgeText } from '../ui/badge';

import { Clock, MapPin, Calendar, User } from 'lucide-react-native';

interface ClassCardProps {
  title: string;
  time: string;
  endTime?: string;
  type: 'class' | 'exam' | 'assignment' | 'personal';
  courseName?: string;
  location?: string;
  teacher?: string;
  onPress?: () => void;
}

export function ClassCard({
  title,
  time,
  endTime,
  type,
  courseName,
  location,
  teacher,
  onPress
}: ClassCardProps) {
  const getTypeColor = () => {
    switch (type) {
      case 'class': return 'bg-blue-100 border-blue-300';
      case 'exam': return 'bg-red-100 border-red-300';
      case 'assignment': return 'bg-yellow-100 border-yellow-300';
      case 'personal': return 'bg-green-100 border-green-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const getTypeText = () => {
    switch (type) {
      case 'class': return 'Class';
      case 'exam': return 'Exam';
      case 'assignment': return 'Assignment';
      case 'personal': return 'Personal';
      default: return type;
    }
  };

  return (
    <Button
      variant="outline"
      className={`${getTypeColor()} border h-auto p-4 mb-3 active:opacity-90`}
      onPress={onPress}
    >
      <VStack className="w-full" space="sm">
        {/* Header */}
        <HStack className="items-center justify-between">
          <Text className="font-bold text-lg text-gray-900">{title}</Text>
          <Badge
            size="sm"
            variant="solid"
            className={`${type === 'class' ? 'bg-blue-500' :
                type === 'exam' ? 'bg-red-500' :
                  type === 'assignment' ? 'bg-yellow-500' : 'bg-green-500'
              }`}
          >
            <BadgeText>{getTypeText()}</BadgeText>
          </Badge>
        </HStack>

        {/* Course Name */}
        {courseName && (
          <Text className="text-gray-700 font-medium">{courseName}</Text>
        )}

        {/* Details */}
        <VStack space="xs">
          {/* Time */}
          <HStack className="items-center" space="sm">
            <Clock size={16} color="#6B7280" />
            <Text className="text-gray-600 text-sm">
              {time}{endTime ? ` - ${endTime}` : ''}
            </Text>
          </HStack>

          {/* Location */}
          {location && (
            <HStack className="items-center" space="sm">
              <MapPin size={16} color="#6B7280" />
              <Text className="text-gray-600 text-sm">{location}</Text>
            </HStack>
          )}

          {/* Teacher */}
          {teacher && (
            <HStack className="items-center" space="sm">
              <User size={16} color="#6B7280" />
              <Text className="text-gray-600 text-sm">{teacher}</Text>
            </HStack>
          )}
        </VStack>
      </VStack>
    </Button>
  );
}
