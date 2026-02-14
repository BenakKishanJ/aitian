import React, { useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { X, UserPlus, Eye, EyeOff, ChevronDown } from 'lucide-react-native';
import { useAdminUsers } from '@/lib/hooks/useAdminUsers';

import type { Role, DepartmentId } from '@/types';
import { DEPARTMENTS } from '@/types/constants';

interface CreateUserModalProps {
  visible: boolean;
  onClose: () => void;
  onUserCreated?: (userId: string) => void;
}

export function CreateUserModal({
  visible,
  onClose,
  onUserCreated,
}: CreateUserModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>('student');
  const [departmentId, setDepartmentId] = useState<DepartmentId | ''>('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [usn, setUsn] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showDeptPicker, setShowDeptPicker] = useState(false);

  const { createUser, creating } = useAdminUsers();

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email');
      return;
    }

    if (!password || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!role) {
      Alert.alert('Error', 'Please select a role');
      return;
    }

    // Validate role-specific fields
    if ((role === 'student' || role === 'teacher') && !departmentId) {
      Alert.alert('Error', 'Please select a department');
      return;
    }

    if (role === 'student' && (!semester || !section)) {
      Alert.alert('Error', 'Please enter semester and section');
      return;
    }

    try {
      const userData: any = {
        email: email.trim(),
        password,
        name: name.trim(),
        role,
      };

      if (role === 'student') {
        userData.departmentId = departmentId as DepartmentId;
        userData.semester = parseInt(semester);
        userData.section = section.toUpperCase();
        userData.usn = usn.trim().toUpperCase();
      } else if (role === 'teacher') {
        userData.departmentId = departmentId as DepartmentId;
        userData.teacherCode = teacherCode.trim().toUpperCase();
      }

      const userId = await createUser(userData);

      Alert.alert('Success', 'User created successfully!');
      resetForm();
      onClose();
      onUserCreated?.(userId);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create user');
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('student');
    setDepartmentId('');
    setSemester('');
    setSection('');
    setUsn('');
    setTeacherCode('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const roles: { value: Role; label: string }[] = [
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'parent', label: 'Parent' },
    { value: 'admin', label: 'Admin' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create New User</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Basic Info */}
            <VStack space="md" style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>

              <VStack space="xs">
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  value={name}
                  onChangeText={setName}
                  editable={!creating}
                />
              </VStack>

              <VStack space="xs">
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!creating}
                />
              </VStack>

              <VStack space="xs">
                <Text style={styles.label}>Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Min 6 characters"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!creating}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#6B7280" />
                    ) : (
                      <Eye size={20} color="#6B7280" />
                    )}
                  </TouchableOpacity>
                </View>
              </VStack>

              <VStack space="xs">
                <Text style={styles.label}>Role *</Text>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => setShowRolePicker(!showRolePicker)}
                >
                  <Text style={styles.pickerText}>
                    {roles.find((r) => r.value === role)?.label}
                  </Text>
                  <ChevronDown size={20} color="#6B7280" />
                </TouchableOpacity>

                {showRolePicker && (
                  <View style={styles.pickerDropdown}>
                    {roles.map((r) => (
                      <TouchableOpacity
                        key={r.value}
                        style={styles.pickerItem}
                        onPress={() => {
                          setRole(r.value);
                          setShowRolePicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            role === r.value && styles.pickerItemTextActive,
                          ]}
                        >
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </VStack>
            </VStack>

            {/* Department (for students and teachers) */}
            {(role === 'student' || role === 'teacher') && (
              <VStack space="md" style={styles.section}>
                <Text style={styles.sectionTitle}>Department</Text>

                <VStack space="xs">
                  <Text style={styles.label}>Department *</Text>
                  <TouchableOpacity
                    style={styles.picker}
                    onPress={() => setShowDeptPicker(!showDeptPicker)}
                  >
                    <Text style={styles.pickerText}>
                      {departmentId
                        ? DEPARTMENTS.find((d) => d.id === departmentId)?.name
                        : 'Select Department'}
                    </Text>
                    <ChevronDown size={20} color="#6B7280" />
                  </TouchableOpacity>

                  {showDeptPicker && (
                    <View style={styles.pickerDropdown}>
                      {DEPARTMENTS.map((dept) => (
                        <TouchableOpacity
                          key={dept.id}
                          style={styles.pickerItem}
                          onPress={() => {
                            setDepartmentId(dept.id as DepartmentId);
                            setShowDeptPicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.pickerItemText,
                              departmentId === dept.id && styles.pickerItemTextActive,
                            ]}
                          >
                            {dept.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </VStack>
              </VStack>
            )}

            {/* Student-specific fields */}
            {role === 'student' && (
              <VStack space="md" style={styles.section}>
                <Text style={styles.sectionTitle}>Student Information</Text>

                <HStack space="md">
                  <VStack space="xs" style={{ flex: 1 }}>
                    <Text style={styles.label}>Semester *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="1-8"
                      value={semester}
                      onChangeText={setSemester}
                      keyboardType="number-pad"
                      maxLength={1}
                      editable={!creating}
                    />
                  </VStack>

                  <VStack space="xs" style={{ flex: 1 }}>
                    <Text style={styles.label}>Section *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="A, B, C"
                      value={section}
                      onChangeText={setSection}
                      maxLength={1}
                      autoCapitalize="characters"
                      editable={!creating}
                    />
                  </VStack>
                </HStack>

                <VStack space="xs">
                  <Text style={styles.label}>USN</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 1DA22CS001"
                    value={usn}
                    onChangeText={setUsn}
                    autoCapitalize="characters"
                    editable={!creating}
                  />
                </VStack>
              </VStack>
            )}

            {/* Teacher-specific fields */}
            {role === 'teacher' && (
              <VStack space="md" style={styles.section}>
                <Text style={styles.sectionTitle}>Teacher Information</Text>

                <VStack space="xs">
                  <Text style={styles.label}>Teacher Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., PROF001"
                    value={teacherCode}
                    onChangeText={setTeacherCode}
                    autoCapitalize="characters"
                    editable={!creating}
                  />
                </VStack>
              </VStack>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={creating}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.createButton,
                (!name.trim() || !email.trim() || !password || creating) &&
                  styles.createButtonDisabled,
              ]}
              onPress={handleCreate}
              disabled={!name.trim() || !email.trim() || !password || creating}
            >
              {creating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <UserPlus size={18} color="#FFFFFF" />
                  <Text style={styles.createButtonText}>Create User</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000000',
  },
  eyeButton: {
    padding: 10,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  pickerText: {
    fontSize: 16,
    color: '#000000',
  },
  pickerDropdown: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: '#FFFFFF',
  },
  pickerItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#374151',
  },
  pickerItemTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  createButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#000000',
    gap: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
