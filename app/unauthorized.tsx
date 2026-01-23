import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function UnauthorizedScreen() {
  return (
    <LinearGradient
      colors={['#C7B9FF', '#FFD6C9', '#B8DBFF']}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}
    >
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, shadowOpacity: 0.1, alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: '600', color: '#2B2B2B', marginBottom: 16 }}>
          Access Denied
        </Text>
        <Text style={{ fontSize: 16, color: '#6B6B6B', textAlign: 'center' }}>
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </Text>
      </View>
    </LinearGradient>
  );
}