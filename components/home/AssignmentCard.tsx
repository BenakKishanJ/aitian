import React from 'react';

import { VStack } from '../ui/vstack';
import { HStack } from '../ui/hstack';
import { Text } from '../ui/text';
import { Button, ButtonText } from '../ui/button';
import { Badge, BadgeText } from '../ui/badge';

import { Calendar, BookOpen, CheckCircle, Clock } from 'lucide-react-native';

interface AssignmentCardProps {
  title: string;
  dueDate: Date;
  courseName: string;
  submitted: boolean;
  overdue?: boolean;
  onPress?: () => void;
}

export function AssignmentCard({
  title,
  dueDate,
  courseName,
  submitted,
  overdue = false,
  onPress
}: AssignmentCardProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysLeft = () => {
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  return (
    <Button
      variant="outline"
      className={`${overdue ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'} h-auto p-4 mb-3 active:opacity-90`}
      onPress={onPress}
    >
      <VStack className="w-full" space="sm">
        {/* Header */}
        <HStack className="items-center justify-between">
          <Text className="font-bold text-lg text-gray-900 flex-1">{title}</Text>
          {submitted && (
            <Badge size="sm" variant="solid" className="bg-green-500">
              <BadgeText>Submitted</BadgeText>
            </Badge>
          )}
        </HStack>

        {/* Course */}
        <HStack className="items-center" space="sm">
          <BookOpen size={16} color="#6B7280" />
          <Text className="text-gray-700">{courseName}</Text>
        </HStack>

        {/* Due Date */}
        <HStack className="items-center justify-between">
          <HStack className="items-center" space="sm">
            <Calendar size={16} color="#6B7280" />
            <Text className="text-gray-600">
              {formatDate(dueDate)} • {formatTime(dueDate)}
            </Text>
          </HStack>

          <HStack className="items-center" space="sm">
            <Clock size={16} color={overdue ? '#EF4444' : '#F59E0B'} />
            <Text className={`font-medium ${overdue ? 'text-red-600' : 'text-amber-600'}`}>
              {getDaysLeft()}
            </Text>
          </HStack>
        </HStack>
      </VStack>
    </Button>
  );
}
