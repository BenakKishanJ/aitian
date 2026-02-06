import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import {
  User,
  GraduationCap,
  Shield,
  Users,
  MoreVertical,
  Mail,
  Building2,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import type { UserData } from '@/types';

interface UserListItemProps {
  user: UserData;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleStatus?: () => void;
  showActions?: boolean;
}

export function UserListItem({
  user,
  onPress,
  onEdit,
  onDelete,
  onToggleStatus,
  showActions = true,
}: UserListItemProps) {
  const getRoleIcon = () => {
    switch (user.role) {
      case 'teacher':
        return <GraduationCap size={18} color="#FFFFFF" />;
      case 'admin':
        return <Shield size={18} color="#FFFFFF" />;
      case 'parent':
        return <Users size={18} color="#FFFFFF" />;
      default:
        return <User size={18} color="#FFFFFF" />;
    }
  };

  const getRoleColor = () => {
    switch (user.role) {
      case 'teacher':
        return '#3B82F6';
      case 'admin':
        return '#8B5CF6';
      case 'parent':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getRoleLabel = () => {
    return user.role.charAt(0).toUpperCase() + user.role.slice(1);
  };

  const getDepartmentLabel = () => {
    if (user.role === 'student' && (user as any).departmentId) {
      return (user as any).departmentId.toUpperCase();
    }
    if (user.role === 'teacher' && (user as any).departmentId) {
      return (user as any).departmentId.toUpperCase();
    }
    return null;
  };

  return (
    <TouchableOpacity
      style={[styles.container, !user.isActive && styles.containerInactive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: getRoleColor() }]}>
        {getRoleIcon()}
      </View>

      {/* User Info */}
      <VStack space="xs" style={styles.userInfo}>
        <HStack space="sm" style={styles.nameRow}>
          <Text style={styles.name}>{user.name}</Text>
          {!user.isActive && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveText}>Inactive</Text>
            </View>
          )}
        </HStack>

        <HStack space="sm" style={styles.emailRow}>
          <Mail size={12} color="#9CA3AF" />
          <Text style={styles.email}>{user.email}</Text>
        </HStack>

        <HStack space="md" style={styles.metaRow}>
          <View style={[styles.roleBadge, { backgroundColor: `${getRoleColor()}20` }]}>
            <Text style={[styles.roleText, { color: getRoleColor() }]}>
              {getRoleLabel()}
            </Text>
          </View>

          {getDepartmentLabel() && (
            <HStack space="xs" style={styles.departmentRow}>
              <Building2 size={12} color="#6B7280" />
              <Text style={styles.departmentText}>{getDepartmentLabel()}</Text>
            </HStack>
          )}

          {(user as any).semester && (
            <Text style={styles.semesterText}>Sem {(user as any).semester}</Text>
          )}
        </HStack>
      </VStack>

      {/* Actions */}
      {showActions && (
        <TouchableOpacity
          style={styles.moreButton}
          onPress={(e) => {
            e.stopPropagation();
            // Action sheet would be shown here
          }}
        >
          <MoreVertical size={20} color="#6B7280" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  containerInactive: {
    opacity: 0.7,
    backgroundColor: '#F9FAFB',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
  },
  emailRow: {
    alignItems: 'center',
  },
  email: {
    fontSize: 13,
    color: '#6B7280',
  },
  metaRow: {
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  departmentRow: {
    alignItems: 'center',
  },
  departmentText: {
    fontSize: 12,
    color: '#6B7280',
  },
  semesterText: {
    fontSize: 12,
    color: '#6B7280',
  },
  moreButton: {
    padding: 8,
    marginLeft: 8,
  },
});
