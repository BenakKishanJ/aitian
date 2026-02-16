import React from 'react';
import {
  View,
  TouchableOpacity,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import {
  User,
  GraduationCap,
  Shield,
  Users,
  MoreVertical,
  Mail,
  Building2,
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

const roleConfig: Record<string, { color: string; bgColor: string; icon: any; label: string }> = {
  student: {
    color: '#BCF3FF',
    bgColor: 'rgba(188, 243, 255, 0.15)',
    icon: GraduationCap,
    label: 'Student',
  },
  teacher: {
    color: '#F96857',
    bgColor: 'rgba(249, 104, 87, 0.15)',
    icon: User,
    label: 'Teacher',
  },
  parent: {
    color: '#F9CD61',
    bgColor: 'rgba(249, 205, 97, 0.15)',
    icon: Users,
    label: 'Parent',
  },
  admin: {
    color: '#7477FF',
    bgColor: 'rgba(116, 119, 255, 0.15)',
    icon: Shield,
    label: 'Admin',
  },
};

export function UserListItem({
  user,
  onPress,
  onEdit,
  onDelete,
  onToggleStatus,
  showActions = true,
}: UserListItemProps) {
  const config = roleConfig[user.role] || roleConfig.student;

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
      className={`flex-row items-center bg-[#2A2A2D] rounded-2xl p-4 mb-3 ${
        !user.isActive ? 'opacity-60' : ''
      }`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View
        className="w-12 h-12 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: config.bgColor }}
      >
        <Icon as={config.icon} size="md" style={{ color: config.color }} />
      </View>

      {/* User Info */}
      <VStack space="xs" className="flex-1">
        <HStack space="sm" className="items-center">
          <Text className="text-white text-base font-semibold flex-1" numberOfLines={1}>
            {user.name}
          </Text>
          {!user.isActive && (
            <View className="bg-[#F96857]/20 px-2 py-0.5 rounded">
              <Text className="text-[#F96857] text-xs font-semibold">Inactive</Text>
            </View>
          )}
        </HStack>

        <HStack space="xs" className="items-center">
          <Icon as={Mail} size="2xs" className="text-[#6B7280]" />
          <Text className="text-[#9CA3AF] text-xs" numberOfLines={1}>
            {user.email}
          </Text>
        </HStack>

        <HStack space="sm" className="items-center flex-wrap">
          <View
            className="px-2.5 py-1 rounded-lg"
            style={{ backgroundColor: config.bgColor }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: config.color }}
            >
              {config.label}
            </Text>
          </View>

          {getDepartmentLabel() && (
            <HStack space="xs" className="items-center">
              <Icon as={Building2} size="2xs" className="text-[#6B7280]" />
              <Text className="text-[#9CA3AF] text-xs">
                {getDepartmentLabel()}
              </Text>
            </HStack>
          )}

          {(user as any).semester && (
            <Text className="text-[#9CA3AF] text-xs">
              Sem {(user as any).semester}
            </Text>
          )}
        </HStack>
      </VStack>

      {/* Actions */}
      {showActions && (
        <TouchableOpacity
          className="p-2 ml-2"
          onPress={(e) => {
            e.stopPropagation();
            // Action sheet would be shown here
          }}
        >
          <Icon as={MoreVertical} size="sm" className="text-[#6B7280]" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}
