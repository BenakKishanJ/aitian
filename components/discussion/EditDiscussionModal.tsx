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
import { X, Edit3, Info } from 'lucide-react-native';
import { useDiscussions } from '@/lib/hooks/useDiscussions';
import type { Discussion } from '@/types';

interface EditDiscussionModalProps {
  visible: boolean;
  onClose: () => void;
  discussion: Discussion | null;
  courseInstanceId: string;
  courseName: string;
  onDiscussionUpdated?: () => void;
}

export function EditDiscussionModal({
  visible,
  onClose,
  discussion,
  courseInstanceId,
  courseName,
  onDiscussionUpdated,
}: EditDiscussionModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  const { updateDiscussion, loading } = useDiscussions({
    courseInstanceId,
  });

  // Load discussion data when modal opens
  useEffect(() => {
    if (discussion && visible) {
      setTitle(discussion.title);
      setContent(discussion.content);
    }
  }, [discussion, visible]);

  const handleUpdate = async () => {
    if (!discussion) {
      Alert.alert('Error', 'No discussion selected');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Error', 'Please enter content');
      return;
    }

    try {
      await updateDiscussion(discussion.id, {
        title: title.trim(),
        content: content.trim(),
      });

      Alert.alert('Success', 'Discussion updated successfully!');
      onDiscussionUpdated?.();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update discussion');
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!discussion) return null;

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
            <Text style={styles.headerTitle}>Edit Discussion</Text>
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

            {/* Title Input */}
            <VStack space="sm" style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="What's your question or topic?"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                editable={!loading}
              />
              <Text style={styles.charCount}>{title.length}/100</Text>
            </VStack>

            {/* Content Input */}
            <VStack space="sm" style={styles.inputGroup}>
              <Text style={styles.label}>Content *</Text>
              <TextInput
                style={styles.contentInput}
                placeholder="Describe your question or start the discussion..."
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
                numberOfLines={8}
                editable={!loading}
              />
            </VStack>

            {/* Edit Notice */}
            <View style={styles.noticeBox}>
              <HStack space="sm" style={styles.noticeHeader}>
                <Info size={16} color="#8B5CF6" />
                <Text style={styles.noticeTitle}>Editing Notice</Text>
              </HStack>
              <VStack space="xs" style={styles.noticeList}>
                <Text style={styles.noticeItem}>• Changes will be saved immediately</Text>
                <Text style={styles.noticeItem}>• All replies will remain intact</Text>
                <Text style={styles.noticeItem}>• Original author and timestamp will be preserved</Text>
              </VStack>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.updateButton,
                (!title.trim() || !content.trim() || loading) && styles.updateButtonDisabled,
              ]}
              onPress={handleUpdate}
              disabled={!title.trim() || !content.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Edit3 size={18} color="#FFFFFF" />
                  <Text style={styles.updateButtonText}>Update Discussion</Text>
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  charCount: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    minHeight: 150,
    textAlignVertical: 'top',
  },
  noticeBox: {
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  noticeHeader: {
    marginBottom: 8,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B21A8',
  },
  noticeList: {
    gap: 4,
  },
  noticeItem: {
    fontSize: 13,
    color: '#7C3AED',
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
  updateButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#000000',
    gap: 8,
  },
  updateButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  updateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
