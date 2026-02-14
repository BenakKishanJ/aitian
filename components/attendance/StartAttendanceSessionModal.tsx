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
import { X, Calendar, Clock, Play } from 'lucide-react-native';
import { useAttendanceSession } from '@/lib/hooks/useAttendanceSession';

interface StartAttendanceSessionModalProps {
  visible: boolean;
  onClose: () => void;
  courseInstanceId: string;
  courseName: string;
  calendarEventId?: string;
  onSessionStarted?: (sessionId: string) => void;
}

export function StartAttendanceSessionModal({
  visible,
  onClose,
  courseInstanceId,
  courseName,
  calendarEventId,
  onSessionStarted,
}: StartAttendanceSessionModalProps) {
  const [title, setTitle] = useState('');
  const { startSession, creating, activeSession } = useAttendanceSession({
    courseInstanceId,
  });

  const handleStart = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a session title');
      return;
    }

    try {
      const sessionId = await startSession({
        calendarEventId,
        courseInstanceId,
        title: title.trim(),
      });

      Alert.alert('Success', 'Attendance session started!');
      setTitle('');
      onClose();
      onSessionStarted?.(sessionId);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to start session');
    }
  };

  const handleClose = () => {
    setTitle('');
    onClose();
  };

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
            <Text style={styles.headerTitle}>Start Attendance</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Course Info */}
            <View style={styles.courseInfo}>
              <Text style={styles.courseLabel}>Course</Text>
              <Text style={styles.courseName}>{courseName}</Text>
            </View>

            {/* Active Session Warning */}
            {activeSession && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  There's already an active session: "{activeSession.title}". 
                  Please end it before starting a new one.
                </Text>
              </View>
            )}

            {/* Session Title Input */}
            <VStack space="sm" style={styles.inputGroup}>
              <Text style={styles.label}>Session Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Lecture 1 - Introduction"
                value={title}
                onChangeText={setTitle}
                editable={!creating && !activeSession}
              />
            </VStack>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>What happens next?</Text>
              <VStack space="xs" style={styles.infoList}>
                <Text style={styles.infoItem}>• Students can mark themselves present</Text>
                <Text style={styles.infoItem}>• You can also mark students manually</Text>
                <Text style={styles.infoItem}>• Lock the session when done</Text>
                <Text style={styles.infoItem}>• View attendance reports anytime</Text>
              </VStack>
            </View>
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
                styles.startButton,
                (!title.trim() || creating || activeSession) && styles.startButtonDisabled,
              ]}
              onPress={handleStart}
              disabled={!title.trim() || creating || !!activeSession}
            >
              {creating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Play size={18} color="#FFFFFF" />
                  <Text style={styles.startButtonText}>Start Session</Text>
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
    maxHeight: '80%',
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
  courseInfo: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  courseLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
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
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoList: {
    gap: 4,
  },
  infoItem: {
    fontSize: 13,
    color: '#3B82F6',
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
  startButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#000000',
    gap: 8,
  },
  startButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
