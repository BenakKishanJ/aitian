import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { LucideIcon } from 'lucide-react-native';

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  color?: string;
  bgColor?: string;
  onPress?: () => void;
}

export function StatCard({
  icon: Icon,
  value,
  label,
  color = '#000000',
  bgColor = '#F9FAFB',
  onPress,
}: StatCardProps) {
  const content = (
    <View style={[styles.card, { backgroundColor: bgColor }]}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Icon size={24} color={color} strokeWidth={2} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
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
    width: 140,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 18,
  },
});
