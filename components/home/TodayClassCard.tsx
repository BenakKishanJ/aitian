import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Clock, MapPin, CheckCircle } from 'lucide-react-native';

interface TodayClassCardProps {
  title: string;
  courseName?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  isNext?: boolean;
  isPast?: boolean;
  hasAttendance?: boolean;
  onPress?: () => void;
}

export function TodayClassCard({
  title,
  courseName,
  startTime,
  endTime,
  location,
  isNext = false,
  isPast = false,
  hasAttendance = false,
  onPress,
}: TodayClassCardProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const content = (
    <View
      style={[
        styles.card,
        isNext && styles.cardNext,
        isPast && styles.cardPast,
      ]}
    >
      <HStack space="md" className="items-start">
        {/* Time Column */}
        <View style={styles.timeColumn}>
          <Text style={[styles.time, isPast && styles.timePast]}>
            {formatTime(startTime)}
          </Text>
          <View style={[styles.timeDivider, isPast && styles.timeDividerPast]} />
          <Text style={[styles.timeEnd, isPast && styles.timePast]}>
            {formatTime(endTime)}
          </Text>
        </View>

        {/* Details Column */}
        <VStack space="xs" style={{ flex: 1 }}>
          <HStack space="xs" className="items-center flex-wrap">
            <Text style={[styles.title, isPast && styles.titlePast]} numberOfLines={1}>
              {title}
            </Text>
            {isNext && (
              <View style={styles.nextBadge}>
                <Text style={styles.nextBadgeText}>Next</Text>
              </View>
            )}
            {isPast && hasAttendance && (
              <CheckCircle size={14} color="#10B981" strokeWidth={2} />
            )}
          </HStack>

          {courseName && (
            <Text style={[styles.courseName, isPast && styles.courseNamePast]} numberOfLines={1}>
              {courseName}
            </Text>
          )}

          {location && (
            <HStack space="xs" className="items-center">
              <MapPin size={12} color="#9CA3AF" strokeWidth={2} />
              <Text style={styles.location} numberOfLines={1}>
                {location}
              </Text>
            </HStack>
          )}
        </VStack>

        {/* Status Indicator */}
        <View style={[styles.indicator, isNext && styles.indicatorNext, isPast && styles.indicatorPast]} />
      </HStack>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
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
  cardNext: {
    borderColor: '#000000',
    borderWidth: 2,
    backgroundColor: '#FAFAFA',
  },
  cardPast: {
    opacity: 0.6,
  },
  timeColumn: {
    alignItems: 'center',
    width: 60,
  },
  time: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  timeEnd: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  timePast: {
    color: '#9CA3AF',
  },
  timeDivider: {
    width: 2,
    height: 8,
    backgroundColor: '#D1D5DB',
    marginVertical: 4,
  },
  timeDividerPast: {
    backgroundColor: '#E5E7EB',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  titlePast: {
    color: '#6B7280',
  },
  courseName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  courseNamePast: {
    color: '#9CA3AF',
  },
  location: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  nextBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nextBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  indicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  indicatorNext: {
    backgroundColor: '#000000',
  },
  indicatorPast: {
    backgroundColor: '#F3F4F6',
  },
});
