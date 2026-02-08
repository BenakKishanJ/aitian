import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { Grade } from '@/types';
import { getGradeColor, getGradeDisplayName, getGradePoints } from '@/lib/gradingUtils';

interface GradeDisplayProps {
  grade: Grade;
  percentage: number;
  total: number;
  maxTotal: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function GradeDisplay({
  grade,
  percentage,
  total,
  maxTotal,
  showDetails = true,
  size = 'md',
}: GradeDisplayProps) {
  const gradeColor = getGradeColor(grade);
  const isFail = grade === 'F';

  const sizeClasses = {
    sm: {
      grade: 'text-2xl',
      percentage: 'text-sm',
      marks: 'text-xs',
      progress: 'h-2',
    },
    md: {
      grade: 'text-4xl',
      percentage: 'text-lg',
      marks: 'text-sm',
      progress: 'h-3',
    },
    lg: {
      grade: 'text-6xl',
      percentage: 'text-xl',
      marks: 'text-base',
      progress: 'h-4',
    },
  };

  const classes = sizeClasses[size];

  return (
    <VStack space="md" className="items-center">
      {/* Grade Badge */}
      <View
        className="px-6 py-3 rounded-2xl"
        style={{ backgroundColor: isFail ? '#FEF0EE' : '#F0F1FF' }}
      >
        <Text
          className={`font-bold ${classes.grade}`}
          style={{ color: gradeColor }}
        >
          {grade}
        </Text>
      </View>

      {/* Grade Description */}
      <Text className="text-gray-600 font-medium">
        {getGradeDisplayName(grade)}
      </Text>

      {/* Percentage */}
      <Text className={`font-semibold text-black ${classes.percentage}`}>
        {percentage.toFixed(2)}%
      </Text>

      {/* Progress Bar */}
      <View className="w-full max-w-[200px]">
        <Progress value={percentage} className={classes.progress}>
          <ProgressFilledTrack
            style={{ backgroundColor: gradeColor }}
          />
        </Progress>
      </View>

      {/* Details */}
      {showDetails && (
        <VStack space="xs" className="items-center mt-2">
          <Text className={`text-gray-500 ${classes.marks}`}>
            {total} / {maxTotal} marks
          </Text>
          <Text className="text-sm text-purple-600 font-medium">
            {getGradePoints(grade)} Grade Points
          </Text>
        </VStack>
      )}
    </VStack>
  );
}

interface GradeBadgeProps {
  grade: Grade;
  size?: 'sm' | 'md' | 'lg';
}

export function GradeBadge({ grade, size = 'md' }: GradeBadgeProps) {
  const gradeColor = getGradeColor(grade);
  const isFail = grade === 'F';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <View
      className={`rounded-full ${sizeClasses[size]}`}
      style={{
        backgroundColor: isFail ? '#FEF0EE' : '#F0F1FF',
        borderWidth: 1,
        borderColor: isFail ? '#F96857' : '#7477FF',
      }}
    >
      <Text
        className="font-bold"
        style={{ color: gradeColor }}
      >
        {grade}
      </Text>
    </View>
  );
}

export default GradeDisplay;
