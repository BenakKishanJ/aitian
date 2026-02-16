import React, { useState } from 'react';
import { View, Pressable, Animated } from 'react-native';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';

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
    <View
      className={`mb-4 overflow-hidden rounded-2xl ${
        isLocked ? 'opacity-70' : ''
      }`}
    >
      <Pressable
        onPress={toggleExpand}
        className="p-4 active:opacity-80"
        style={{ backgroundColor: '#2A2A2D' }}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityLabel={`${getSemesterLabel(semester)}, ${courseCount} courses`}
      >
        <HStack className="items-center justify-between">
          <HStack className="items-center gap-3">
            <View
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isLocked
                  ? 'bg-[#3C443F]'
                  : 'bg-[#7477FF]/15'
              }`}
            >
              <Icon
                as={BookOpen}
                size="sm"
                className={isLocked ? 'text-[#6B7280]' : 'text-[#7477FF]'}
              />
            </View>
            <VStack>
              <Text
                className={`text-lg font-semibold ${
                  isLocked ? 'text-[#6B7280]' : 'text-white'
                }`}
              >
                {getSemesterLabel(semester)}
              </Text>
              <Text className="text-sm text-[#6B7280]">
                {courseCount} {courseCount === 1 ? 'course' : 'courses'}
              </Text>
            </VStack>
          </HStack>

          <HStack className="items-center gap-2">
            <Animated.View style={{ transform: [{ rotate: rotateIcon }] }}>
              <Icon as={ChevronDown} size="sm" className="text-[#6B7280]" />
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
          <View className="px-4 pb-4 pt-2">
            <View className="h-px bg-[#3C443F] mb-4" />
            {children}
          </View>
        </Animated.View>
      )}
    </View>
  );
}
