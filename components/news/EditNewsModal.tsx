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
  Switch,
  Image,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { X, Edit3, Pin, Info, Users, FileText, Image as ImageIcon, Video } from 'lucide-react-native';
import { useNews } from '@/lib/hooks/useNews';
import { usePostUpload } from '@/lib/hooks/usePostUpload';
import { FilePicker, type PickedFile } from '@/components/ui/FilePicker';
import type { NewsPost, NewsPostUpdateData, MediaAttachment } from '@/types';

interface EditNewsModalProps {
  visible: boolean;
  onClose: () => void;
  post: NewsPost | null;
  onPostUpdated?: () => void;
}

const MAX_FILES = 5;

export function EditNewsModal({
  visible,
  onClose,
  post,
  onPostUpdated,
}: EditNewsModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [existingMedia, setExistingMedia] = useState<MediaAttachment[]>([]);
  const [newFiles, setNewFiles] = useState<PickedFile[]>([]);
  const [mediaToDelete, setMediaToDelete] = useState<MediaAttachment[]>([]);
  
  const { updatePost, updating } = useNews();
  const { uploadMediaFiles, deleteMediaFiles, isUploading, error: uploadError } = usePostUpload();

  // Load post data when modal opens
  useEffect(() => {
    if (post && visible) {
      setTitle(post.title || '');
      setContent(post.content || '');
      setIsPinned(post.isPinned || false);
      setExistingMedia(post.media || []);
      setNewFiles([]);
      setMediaToDelete([]);
    }
  }, [post, visible]);

  const handleUpdate = async () => {
    if (!post) {
      Alert.alert('Error', 'No post selected');
      return;
    }

    if (!title.trim() && !content.trim()) {
      Alert.alert('Error', 'Please provide at least a title or content');
      return;
    }

    if (title.trim().length > 0 && title.trim().length < 3) {
      Alert.alert('Error', 'Title must be at least 3 characters');
      return;
    }

    if (content.trim().length > 0 && content.trim().length < 10) {
      Alert.alert('Error', 'Content must be at least 10 characters');
      return;
    }

    try {
      // Upload new files first if any
      let updatedMedia = [...existingMedia];
      
      if (newFiles.length > 0) {
        const uploadedMedia = await uploadMediaFiles(newFiles);
        updatedMedia = [...updatedMedia, ...uploadedMedia];
      }

      // Delete removed media files from storage
      if (mediaToDelete.length > 0) {
        const storagePaths = mediaToDelete
          .filter(m => m.storagePath)
          .map(m => m.storagePath);
        if (storagePaths.length > 0) {
          await deleteMediaFiles(storagePaths);
        }
      }

      const updateData: NewsPostUpdateData = {
        title: title.trim(),
        content: content.trim(),
        isPinned,
        media: updatedMedia,
      };

      await updatePost(post.id, updateData);

      Alert.alert('Success', 'Post updated successfully!');
      onPostUpdated?.();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update post');
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleRemoveExistingMedia = (index: number) => {
    const media = existingMedia[index];
    setMediaToDelete([...mediaToDelete, media]);
    setExistingMedia(existingMedia.filter((_, i) => i !== index));
  };

  const handleRemoveNewFile = (index: number) => {
    setNewFiles(newFiles.filter((_, i) => i !== index));
  };

  const handleAddFiles = (files: PickedFile[]) => {
    const totalFiles = existingMedia.length + newFiles.length + files.length;
    if (totalFiles > MAX_FILES) {
      Alert.alert(
        'Too Many Files',
        `You can only have up to ${MAX_FILES} files per post.`
      );
      return;
    }
    setNewFiles([...newFiles, ...files]);
  };

  const isImageFile = (mimeType: string) => mimeType.startsWith('image/');
  const isVideoFile = (mimeType: string) => mimeType.startsWith('video/');

  const getFileIcon = (mimeType: string) => {
    if (isImageFile(mimeType)) {
      return <ImageIcon size={20} color="#10B981" />;
    }
    if (isVideoFile(mimeType)) {
      return <Video size={20} color="#8B5CF6" />;
    }
    return <FileText size={20} color="#3B82F6" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isProcessing = updating || isUploading;

  if (!post) return null;

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
            <Text style={styles.headerTitle}>Edit Post</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Title Input */}
            <VStack space="sm" style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Enter post title (optional)"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                editable={!isProcessing}
              />
              <Text style={styles.charCount}>{title.length}/100</Text>
            </VStack>

            {/* Content Input */}
            <VStack space="sm" style={styles.inputGroup}>
              <Text style={styles.label}>Content *</Text>
              <TextInput
                style={styles.contentInput}
                placeholder="Write your announcement..."
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
                numberOfLines={8}
                editable={!isProcessing}
              />
            </VStack>

            {/* Existing Media */}
            {existingMedia.length > 0 && (
              <VStack space="sm" style={styles.inputGroup}>
                <Text style={styles.label}>Current Attachments</Text>
                <VStack space="xs">
                  {existingMedia.map((media, index) => (
                    <View key={index} style={styles.mediaItem}>
                      <HStack space="sm" style={styles.mediaItemContent}>
                        {isImageFile(media.mimeType) ? (
                          <Image
                            source={{ uri: media.url }}
                            style={styles.mediaThumbnail}
                            resizeMode="cover"
                          />
                        ) : (
                          getFileIcon(media.mimeType)
                        )}
                        <VStack style={styles.mediaInfo}>
                          <Text style={styles.mediaName} numberOfLines={1}>
                            {media.fileName || 'Attachment'}
                          </Text>
                          {media.fileSize > 0 && (
                            <Text style={styles.mediaSize}>
                              {formatFileSize(media.fileSize)}
                            </Text>
                          )}
                        </VStack>
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemoveExistingMedia(index)}
                          disabled={isProcessing}
                        >
                          <X size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </HStack>
                    </View>
                  ))}
                </VStack>
              </VStack>
            )}

            {/* New Files to Upload */}
            {newFiles.length > 0 && (
              <VStack space="sm" style={styles.inputGroup}>
                <Text style={styles.label}>New Files to Upload</Text>
                <VStack space="xs">
                  {newFiles.map((file, index) => (
                    <View key={index} style={styles.mediaItem}>
                      <HStack space="sm" style={styles.mediaItemContent}>
                        {getFileIcon(file.mimeType)}
                        <VStack style={styles.mediaInfo}>
                          <Text style={styles.mediaName} numberOfLines={1}>
                            {file.name}
                          </Text>
                          {file.size > 0 && (
                            <Text style={styles.mediaSize}>
                              {formatFileSize(file.size)}
                            </Text>
                          )}
                        </VStack>
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemoveNewFile(index)}
                          disabled={isProcessing}
                        >
                          <X size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </HStack>
                    </View>
                  ))}
                </VStack>
              </VStack>
            )}

            {/* Add New Files */}
            {(existingMedia.length + newFiles.length) < MAX_FILES && (
              <VStack space="sm" style={styles.inputGroup}>
                <Text style={styles.label}>
                  Add Attachments ({existingMedia.length + newFiles.length}/{MAX_FILES})
                </Text>
                <FilePicker
                  onFileSelect={(file) => handleAddFiles([file])}
                  onMultipleSelect={handleAddFiles}
                  disabled={isProcessing}
                  fileType="any"
                  label="Add Photos, Videos, or Documents"
                  maxSizeMB={10}
                />
              </VStack>
            )}

            {/* Pin Toggle */}
            <View style={styles.toggleContainer}>
              <HStack space="sm" style={styles.toggleRow}>
                <Pin size={20} color="#000000" />
                <VStack space="xs" style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Pin this post</Text>
                  <Text style={styles.toggleDescription}>
                    Pinned posts appear at the top of the news feed
                  </Text>
                </VStack>
                <Switch
                  value={isPinned}
                  onValueChange={setIsPinned}
                  disabled={isProcessing}
                  trackColor={{ false: '#E5E7EB', true: '#000000' }}
                  thumbColor="#FFFFFF"
                />
              </HStack>
            </View>

            {/* Edit Notice */}
            <View style={styles.noticeBox}>
              <HStack space="sm" style={styles.noticeHeader}>
                <Info size={16} color="#8B5CF6" />
                <Text style={styles.noticeTitle}>Editing Notice</Text>
              </HStack>
              <VStack space="xs" style={styles.noticeList}>
                <Text style={styles.noticeItem}>• Changes will be saved immediately</Text>
                <Text style={styles.noticeItem}>• Original author and timestamp will be preserved</Text>
                <Text style={styles.noticeItem}>• Target audience cannot be changed</Text>
                <Text style={styles.noticeItem}>• Removed files will be permanently deleted</Text>
              </VStack>
            </View>

            {/* Current Audience Info */}
            <View style={styles.audienceInfo}>
              <HStack space="sm" style={styles.audienceHeader}>
                <Users size={16} color="#6B7280" />
                <Text style={styles.audienceLabel}>Target Audience</Text>
              </HStack>
              <Text style={styles.audienceValue}>
                {post.targetAudience.type === 'all' && 'Everyone'}
                {post.targetAudience.type === 'department' && `Department: ${post.targetAudience.departmentId}`}
                {post.targetAudience.type === 'semester' && `Semester: ${post.targetAudience.semester}`}
                {post.targetAudience.type === 'departmentSemester' && 
                  `${post.targetAudience.departmentId} - Semester ${post.targetAudience.semester}`}
              </Text>
              <Text style={styles.audienceNote}>
                (Cannot be changed after posting)
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isProcessing}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.updateButton,
                ((!title.trim() && !content.trim()) || isProcessing) && styles.updateButtonDisabled,
              ]}
              onPress={handleUpdate}
              disabled={(!title.trim() && !content.trim()) || isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Edit3 size={18} color="#FFFFFF" />
                  <Text style={styles.updateButtonText}>Update Post</Text>
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
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
    marginTop: 4,
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
  mediaItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mediaItemContent: {
    alignItems: 'center',
  },
  mediaThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  mediaInfo: {
    flex: 1,
  },
  mediaName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  mediaSize: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  toggleContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  toggleRow: {
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  toggleDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
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
  audienceInfo: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  audienceHeader: {
    marginBottom: 8,
  },
  audienceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  audienceValue: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
  },
  audienceNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
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
