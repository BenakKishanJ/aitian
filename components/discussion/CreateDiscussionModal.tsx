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
import { X, MessageSquare, Info } from 'lucide-react-native';
import { useDiscussions } from '@/lib/hooks/useDiscussions';

interface CreateDiscussionModalProps {
  visible: boolean;
  onClose: () => void;
  courseInstanceId: string;
  courseName: string;
  onDiscussionCreated?: (discussionId: string) => void;
}

export function CreateDiscussionModal({
  visible,
  onClose,
  courseInstanceId,
  courseName,
  onDiscussionCreated,
}: CreateDiscussionModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  const { createDiscussion, creating } = useDiscussions({
    courseInstanceId,
  });

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Error', 'Please enter content');
      return;
    }

    try {
      const discussionId = await createDiscussion({
        courseInstanceId,
        title: title.trim(),
        content: content.trim(),
      });

      Alert.alert('Success', 'Discussion created successfully!');
      setTitle('');
      setContent('');
      onClose();
      onDiscussionCreated?.(discussionId);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create discussion');
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
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
            <Text style={styles.headerTitle}>New Discussion</Text>
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
                editable={!creating}
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
                editable={!creating}
              />
            </VStack>

            {/* Guidelines */}
            <View style={styles.guidelinesBox}>
              <HStack space="sm" style={styles.guidelinesHeader}>
                <Info size={16} color="#3B82F6" />
                <Text style={styles.guidelinesTitle}>Discussion Guidelines</Text>
              </HStack>
              <VStack space="xs" style={styles.guidelinesList}>
                <Text style={styles.guidelineItem}>• Be respectful and constructive</Text>
                <Text style={styles.guidelineItem}>• Stay on topic and relevant to the course</Text>
                <Text style={styles.guidelineItem}>• Search before posting to avoid duplicates</Text>
                <Text style={styles.guidelineItem}>• Teachers can pin important discussions</Text>
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
                styles.createButton,
                (!title.trim() || !content.trim() || creating) && styles.createButtonDisabled,
              ]}
              onPress={handleCreate}
              disabled={!title.trim() || !content.trim() || creating}
            >
              {creating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MessageSquare size={18} color="#FFFFFF" />
                  <Text style={styles.createButtonText}>Post Discussion</Text>
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
  guidelinesBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  guidelinesHeader: {
    marginBottom: 8,
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  guidelinesList: {
    gap: 4,
  },
  guidelineItem: {
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
