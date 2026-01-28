import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { FileText, Clock, AlertCircle } from 'lucide-react-native';

interface AssignmentPreviewProps {
  title: string;
  courseName: string;
  dueDate: Date;
  isOverdue?: boolean;
  onPress?: () => void;
}

export function AssignmentPreview({
  title,
  courseName,
  dueDate,
  isOverdue = false,
  onPress,
}: AssignmentPreviewProps) {
  const getTimeUntilDue = () => {
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();

    if (diff < 0) {
      const days = Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24));
      return days === 0 ? 'Overdue today' : `Overdue by ${days}d`;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days === 0) {
      if (hours === 0) {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `Due in ${minutes}m`;
      }
      return `Due in ${hours}h`;
    }

    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  };

  const formatDueDate = () => {
    return dueDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const content = (
    <View style={[styles.card, isOverdue && styles.cardOverdue]}>
      <HStack space="md" className="items-start">
        {/* Icon */}
        <View style={[styles.iconContainer, isOverdue && styles.iconContainerOverdue]}>
          {isOverdue ? (
            <AlertCircle size={20} color="#EF4444" strokeWidth={2} />
          ) : (
            <FileText size={20} color="#3B82F6" strokeWidth={2} />
          )}
        </View>

        {/* Content */}
        <VStack space="xs" style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.courseName} numberOfLines={1}>
            {courseName}
          </Text>
          <HStack space="xs" className="items-center">
            <Clock size={12} color={isOverdue ? '#EF4444' : '#6B7280'} strokeWidth={2} />
            <Text style={[styles.dueTime, isOverdue && styles.dueTimeOverdue]}>
              {getTimeUntilDue()}
            </Text>
          </HStack>
        </VStack>

        {/* Arrow */}
        <Text style={styles.arrow}>›</Text>
      </HStack>

      {isOverdue && (
        <View style={styles.overdueStrip} />
      )}
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
    position: 'relative',
    overflow: 'hidden',
  },
  cardOverdue: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerOverdue: {
    backgroundColor: '#FEE2E2',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  courseName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  dueTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  dueTimeOverdue: {
    color: '#EF4444',
  },
  arrow: {
    fontSize: 24,
    color: '#D1D5DB',
    marginTop: 8,
  },
  overdueStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
    backgroundColor: '#EF4444',
  },
});
