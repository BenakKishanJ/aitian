import React, { useState } from 'react';
import { View, Pressable, Animated } from 'react-native';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SemesterGroupProps {
  semester: number;
  courseCount: number;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  isLocked?: boolean;
}

export function SemesterGroup({
  semester,
  courseCount,
  children,
  defaultExpanded = false,
  isLocked = false,
}: SemesterGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [animation] = useState(new Animated.Value(defaultExpanded ? 1 : 0));

  const toggleExpand = () => {
    const newValue = !isExpanded;
    setIsExpanded(newValue);
    
    Animated.spring(animation, {
      toValue: newValue ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  };

  const rotateIcon = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const getSemesterLabel = (sem: number): string => {
    const suffixes: Record<number, string> = {
      1: 'st',
      2: 'nd',
      3: 'rd',
    };
    return `${sem}${suffixes[sem] || 'th'} Semester`;
  };

  return (
    <Card
      className={`mb-4 overflow-hidden ${
        isLocked ? 'opacity-70' : ''
      }`}
      variant="outline"
    >
      <Pressable
        onPress={toggleExpand}
        className="p-4 active:opacity-80"
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityLabel={`${getSemesterLabel(semester)}, ${courseCount} courses`}
      >
        <HStack className="items-center justify-between">
          <HStack className="items-center gap-3">
            <View
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isLocked
                  ? 'bg-gray-200'
                  : 'bg-purple-100'
              }`}
            >
              <BookOpen
                size={20}
                color={isLocked ? '#77867D' : '#7477FF'}
              />
            </View>
            <VStack>
              <Text
                className={`text-lg font-semibold ${
                  isLocked ? 'text-gray-500' : 'text-black'
                }`}
              >
                {getSemesterLabel(semester)}
              </Text>
              <Text className="text-sm text-gray-500">
                {courseCount} {courseCount === 1 ? 'course' : 'courses'}
              </Text>
            </VStack>
          </HStack>

          <HStack className="items-center gap-2">
            {isLocked && (
              <Badge
                variant="outline"
                className="bg-gray-100 border-gray-300"
              >
                <Text className="text-xs text-gray-600">Locked</Text>
              </Badge>
            )}
            <Animated.View style={{ transform: [{ rotate: rotateIcon }] }}>
              <ChevronDown size={24} color="#232323" />
            </Animated.View>
          </HStack>
        </HStack>
      </Pressable>

      {isExpanded && (
        <Animated.View
          style={{
            opacity: animation,
            transform: [
              {
                translateY: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0],
                }),
              },
            ],
          }}
        >
          <View className="px-4 pb-4">
            <View className="h-px bg-gray-200 mb-4" />
            {children}
          </View>
        </Animated.View>
      )}
    </Card>
  );
}
