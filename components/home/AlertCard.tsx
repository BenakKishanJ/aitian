import React from 'react';

import { VStack } from '../ui/vstack';
import { HStack } from '../ui/hstack';
import { Text } from '../ui/text';
import { Box } from '../ui/box';
import { Button, ButtonText } from '../ui/button';

import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react-native';

interface AlertCardProps {
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  courseName?: string;
  percentage?: number;
  onPress?: () => void;
}

export function AlertCard({
  type,
  title,
  message,
  courseName,
  percentage,
  onPress
}: AlertCardProps) {
  const getTypeConfig = () => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: AlertTriangle,
          iconColor: '#F59E0B',
          textColor: 'text-yellow-800'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: Info,
          iconColor: '#3B82F6',
          textColor: 'text-blue-800'
        };
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: CheckCircle,
          iconColor: '#10B981',
          textColor: 'text-green-800'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: XCircle,
          iconColor: '#EF4444',
          textColor: 'text-red-800'
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <Button
      variant="outline"
      className={`${config.bg} ${config.border} border h-auto p-4 mb-3 active:opacity-90`}
      onPress={onPress}
    >
      <HStack className="w-full items-start" space="md">
        {/* Icon */}
        <Box className="p-2 rounded-lg bg-white">
          <Icon size={20} color={config.iconColor} />
        </Box>

        {/* Content */}
        <VStack className="flex-1" space="xs">
          <Text className={`font-bold text-lg ${config.textColor}`}>
            {title}
          </Text>

          {courseName && (
            <Text className="font-medium text-gray-800">
              {courseName}
              {percentage !== undefined && ` • ${percentage}%`}
            </Text>
          )}

          <Text className={`${config.textColor} opacity-90`}>
            {message}
          </Text>
        </VStack>
      </HStack>
    </Button>
  );
}
