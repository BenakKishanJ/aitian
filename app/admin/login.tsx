import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { isValidOrgEmail, validateAdminSecret } from '@/lib/authUtils';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function AdminLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAdminLogin = async () => {
    if (!isValidOrgEmail(email)) {
      Alert.alert('Invalid Email', 'Only organizational emails are allowed.');
      return;
    }

    const isValidSecret = await validateAdminSecret(secretCode);
    if (!isValidSecret) {
      Alert.alert('Invalid Secret', 'Incorrect admin secret code.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Update user role to admin
      await updateDoc(doc(db, 'users', uid), { role: 'admin' });

      router.replace('/admin/dashboard');
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#C7B9FF', '#FFD6C9', '#B8DBFF']}
      style={{ flex: 1, justifyContent: 'center', padding: 20 }}
    >
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, shadowOpacity: 0.1 }}>
        <Text style={{ fontSize: 28, fontWeight: '600', color: '#2B2B2B', textAlign: 'center', marginBottom: 8 }}>
          Admin Access
        </Text>
        <Text style={{ fontSize: 16, color: '#6B6B6B', textAlign: 'center', marginBottom: 32 }}>
          Enter your credentials and secret code
        </Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={{
            backgroundColor: '#FAF7F2',
            borderWidth: 1,
            borderColor: '#EDE7DF',
            borderRadius: 12,
            padding: 16,
            fontSize: 16,
            marginBottom: 16,
          }}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            backgroundColor: '#FAF7F2',
            borderWidth: 1,
            borderColor: '#EDE7DF',
            borderRadius: 12,
            padding: 16,
            fontSize: 16,
            marginBottom: 16,
          }}
        />

        <TextInput
          placeholder="Admin Secret Code"
          value={secretCode}
          onChangeText={setSecretCode}
          secureTextEntry
          style={{
            backgroundColor: '#FAF7F2',
            borderWidth: 1,
            borderColor: '#EDE7DF',
            borderRadius: 12,
            padding: 16,
            fontSize: 16,
            marginBottom: 24,
          }}
        />

        <TouchableOpacity onPress={handleAdminLogin} disabled={loading}>
          <LinearGradient
            colors={['#B69CFF', '#FFB8C8']}
            style={{
              paddingVertical: 16,
              borderRadius: 25,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>
              {loading ? 'Verifying...' : 'Access Admin'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}