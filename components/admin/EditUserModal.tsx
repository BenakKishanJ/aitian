import React, { useState, useEffect } from 'react';
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
import { X, Save, ChevronDown, User } from 'lucide-react-native';
import { useAdminUsers } from '@/lib/hooks/useAdminUsers';
import type { UserData, Role, DepartmentId } from '@/types';
import { DEPARTMENTS } from '@/types/constants';

interface EditUserModalProps {
  visible: boolean;
  onClose: () => void;
  user: UserData | null;
  onUserUpdated?: () => void;
}

export function EditUserModal({
  visible,
  onClose,
  user,
  onUserUpdated,
}: EditUserModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [departmentId, setDepartmentId] = useState<DepartmentId | ''>('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [usn, setUsn] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showDeptPicker, setShowDeptPicker] = useState(false);

  const { updateUser, updating } = useAdminUsers();

  // Populate form when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setRole(user.role);
      setDepartmentId((user as any).departmentId || '');
      setSemester((user as any).semester?.toString() || '');
      setSection((user as any).section || '');
      setUsn((user as any).usn || '');
      setTeacherCode((user as any).teacherCode || '');
      setIsActive(user.isActive ?? true);
    }
  }, [user]);

  const handleUpdate = async () => {
    if (!user) return;

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    try {
      const updates: any = {
        name: name.trim(),
        isActive,
      };

      // Add role-specific fields
      if (role === 'student') {
        if (departmentId) updates.departmentId = departmentId;
        if (semester) updates.semester = parseInt(semester);
        if (section) updates.section = section.toUpperCase();
        if (usn) updates.usn = usn.trim().toUpperCase();
      } else if (role === 'teacher') {
        if (departmentId) updates.departmentId = departmentId;
        if (teacherCode) updates.teacherCode = teacherCode.trim().toUpperCase();
      }

      await updateUser(user.uid, updates);

      Alert.alert('Success', 'User updated successfully!');
      onUserUpdated?.();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update user');
    }
  };

  const handleClose = () => {
    onClose();
  };

  const roles: { value: Role; label: string }[] = [
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'parent', label: 'Parent' },
    { value: 'admin', label: 'Admin' },
  ];

  if (!user) return null;

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
            <Text style={styles.headerTitle}>Edit User</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* User Avatar & Role */}
            <View style={styles.userHeader}>
              <View style={styles.avatar}>
                <User size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.userEmail}>{email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Text>
              </View>
            </View>

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
                  editable={!updating}
                />
              </VStack>

              {/* Active Status Toggle */}
              <TouchableOpacity
                style={styles.statusToggle}
                onPress={() => setIsActive(!isActive)}
              >
                <Text style={styles.label}>Account Status</Text>
                <View
                  style={[
                    styles.statusBadge,
                    isActive ? styles.statusActive : styles.statusInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      isActive ? styles.statusTextActive : styles.statusTextInactive,
                    ]}
                  >
                    {isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </TouchableOpacity>
            </VStack>

            {/* Department (for students and teachers) */}
            {(role === 'student' || role === 'teacher') && (
              <VStack space="md" style={styles.section}>
                <Text style={styles.sectionTitle}>Department</Text>

                <VStack space="xs">
                  <Text style={styles.label}>Department</Text>
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
                    <Text style={styles.label}>Semester</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="1-8"
                      value={semester}
                      onChangeText={setSemester}
                      keyboardType="number-pad"
                      maxLength={1}
                      editable={!updating}
                    />
                  </VStack>

                  <VStack space="xs" style={{ flex: 1 }}>
                    <Text style={styles.label}>Section</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="A, B, C"
                      value={section}
                      onChangeText={setSection}
                      maxLength={1}
                      autoCapitalize="characters"
                      editable={!updating}
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
                    editable={!updating}
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
                    editable={!updating}
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
              disabled={updating}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                (!name.trim() || updating) && styles.saveButtonDisabled,
              ]}
              onPress={handleUpdate}
              disabled={!name.trim() || updating}
            >
              {updating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Save size={18} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
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
  userHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
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
  statusToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
  },
  statusInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#059669',
  },
  statusTextInactive: {
    color: '#DC2626',
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
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#000000',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
