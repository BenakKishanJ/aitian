import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import { Box } from '@/components/ui/box';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function CompleteProfileScreen() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    studentId: '', // For parents to link students
  });

  const handleSubmit = async () => {
    if (!user || !userData) return;

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const updateData: any = {
        name: formData.name,
        profileComplete: true,
      };

      // For parents, add linked student ID
      if (userData.role === 'parent' && formData.studentId) {
        updateData.linkedStudentId = formData.studentId;
      }

      await updateDoc(userRef, updateData);
      
      // Redirect to appropriate dashboard
      if (userData.role === 'student') {
        router.replace('/(tabs)/home');
      } else if (userData.role === 'teacher') {
        router.replace('/admin/dashboard');
      } else if (userData.role === 'parent') {
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('Error completing profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !userData) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Box style={styles.container}>
      <VStack space="md" style={styles.form}>
        <Heading size="lg">Complete Your Profile</Heading>
        
        <Text style={styles.subtitle}>
          Please provide the following information to get started
        </Text>

        <VStack space="sm">
          <Text style={styles.label}>Full Name</Text>
          <Input>
            <InputField
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter your full name"
              editable={!loading}
            />
          </Input>
        </VStack>

        {userData.role === 'parent' && (
          <VStack space="sm">
            <Text style={styles.label}>Student ID</Text>
            <Input>
              <InputField
                value={formData.studentId}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, studentId: text }))}
                placeholder="Enter your child's student ID"
                editable={!loading}
              />
            </Input>
          </VStack>
        )}

        <Button
          onPress={handleSubmit}
          disabled={loading || !formData.name || (userData.role === 'parent' && !formData.studentId)}
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Saving...' : 'Complete Profile'}
          </Text>
        </Button>
      </VStack>
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  form: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  button: {
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});