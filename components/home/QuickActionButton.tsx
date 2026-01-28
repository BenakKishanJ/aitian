import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { LucideIcon } from 'lucide-react-native';

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  color?: string;
  onPress: () => void;
}

export function QuickActionButton({
  icon: Icon,
  label,
  color = '#000000',
  onPress,
}: QuickActionButtonProps) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '10' }]}>
        <Icon size={24} color={color} strokeWidth={2} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 18,
  },
});
