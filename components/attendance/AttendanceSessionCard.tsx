import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import {
  Calendar,
  Clock,
  Lock,
  Unlock,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
  Play,
} from 'lucide-react-native';
import type { AttendanceSession } from '@/types';

interface AttendanceSessionCardProps {
  session: AttendanceSession;
  onPress?: () => void;
  onLock?: () => void;
  onUnlock?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  stats?: {
    total: number;
    present: number;
    absent: number;
  };
}

export function AttendanceSessionCard({
  session,
  onPress,
  onLock,
  onUnlock,
  onDelete,
  showActions = true,
  stats,
}: AttendanceSessionCardProps) {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Session',
      `Are you sure you want to delete "${session.title}"? This will also delete all attendance records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.card, session.isLocked && styles.cardLocked]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Status Badge */}
      <View
        style={[
          styles.statusBadge,
          session.isLocked ? styles.statusBadgeLocked : styles.statusBadgeActive,
        ]}
      >
        {session.isLocked ? (
          <Lock size={12} color="#FFFFFF" />
        ) : (
          <Play size={12} color="#FFFFFF" />
        )}
        <Text style={styles.statusText}>
          {session.isLocked ? 'Locked' : 'Active'}
        </Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>{session.title}</Text>

      {/* Date & Time */}
      <HStack space="md" style={styles.metaRow}>
        <HStack space="xs" style={styles.metaItem}>
          <Calendar size={14} color="#6B7280" />
          <Text style={styles.metaText}>{formatDate(session.startedAt)}</Text>
        </HStack>
        <HStack space="xs" style={styles.metaItem}>
          <Clock size={14} color="#6B7280" />
          <Text style={styles.metaText}>{formatTime(session.startedAt)}</Text>
        </HStack>
      </HStack>

      {/* Stats */}
      {stats && (
        <View style={styles.statsContainer}>
          <HStack space="md">
            <HStack space="xs" style={styles.statItem}>
              <Users size={14} color="#6B7280" />
              <Text style={styles.statText}>{stats.total} students</Text>
            </HStack>
            <HStack space="xs" style={styles.statItem}>
              <CheckCircle2 size={14} color="#10B981" />
              <Text style={[styles.statText, { color: '#10B981' }]}>
                {stats.present} present
              </Text>
            </HStack>
            <HStack space="xs" style={styles.statItem}>
              <XCircle size={14} color="#EF4444" />
              <Text style={[styles.statText, { color: '#EF4444' }]}>
                {stats.absent} absent
              </Text>
            </HStack>
          </HStack>
        </View>
      )}

      {/* Actions */}
      {showActions && (
        <HStack space="sm" style={styles.actions}>
          {session.isLocked ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.unlockButton]}
              onPress={(e) => {
                e.stopPropagation();
                onUnlock?.();
              }}
            >
              <Unlock size={16} color="#059669" />
              <Text style={[styles.actionButtonText, { color: '#059669' }]}>
                Unlock
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.lockButton]}
              onPress={(e) => {
                e.stopPropagation();
                onLock?.();
              }}
            >
              <Lock size={16} color="#DC2626" />
              <Text style={[styles.actionButtonText, { color: '#DC2626' }]}>
                Lock
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
          >
            <Trash2 size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </HStack>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardLocked: {
    borderLeftColor: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 10,
    gap: 4,
  },
  statusBadgeActive: {
    backgroundColor: '#10B981',
  },
  statusBadgeLocked: {
    backgroundColor: '#6B7280',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  metaRow: {
    marginBottom: 12,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  statsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#374151',
  },
  actions: {
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  lockButton: {
    backgroundColor: '#FEE2E2',
  },
  unlockButton: {
    backgroundColor: '#D1FAE5',
  },
  deleteButton: {
    backgroundColor: '#F3F4F6',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
