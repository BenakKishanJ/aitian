import React, { useCallback, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  File,
  Video,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

export type FileType = 'image' | 'document' | 'any';

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
  /** MIME type alias to match UploadableFile interface */
  type: string;
}

interface FilePickerProps {
  onFileSelect: (file: PickedFile) => void;
  onClear?: () => void;
  fileType?: FileType;
  selectedFile?: PickedFile | null;
  disabled?: boolean;
  label?: string;
  maxSizeMB?: number;
  allowMultiple?: boolean;
  onMultipleSelect?: (files: PickedFile[]) => void;
  selectedFiles?: PickedFile[];
}

export function FilePicker({
  onFileSelect,
  onClear,
  fileType = 'any',
  selectedFile,
  disabled = false,
  label = 'Select File',
  maxSizeMB = 10,
  allowMultiple = false,
  onMultipleSelect,
  selectedFiles = [],
}: FilePickerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: { size?: number; mimeType?: string }): string | null => {
    if (file.size) {
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        return `File size exceeds ${maxSizeMB}MB limit`;
      }
    }
    return null;
  };

  const getAcceptTypes = () => {
    switch (fileType) {
      case 'image':
        return 'image/*';
      case 'document':
        return '.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx';
      default:
        return '*';
    }
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) {
      return <Upload size={24} color={disabled ? '#9CA3AF' : '#000000'} />;
    }
    
    if (mimeType.startsWith('image/')) {
      return <ImageIcon size={24} color="#10B981" />;
    }
    
    if (mimeType.startsWith('video/')) {
      return <Video size={24} color="#8B5CF6" />;
    }
    
    return <FileText size={24} color="#3B82F6" />;
  };

  const pickDocument = async () => {
    try {
      setIsLoading(true);
      
      const options: DocumentPicker.DocumentPickerOptions = {
        type: fileType === 'image' 
          ? 'image/*' 
          : fileType === 'document' 
            ? ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
            : '*/*',
        copyToCacheDirectory: true,
        multiple: allowMultiple,
      };

      const result = await DocumentPicker.getDocumentAsync(options);

      if (result.canceled) {
        return;
      }

      if (allowMultiple && result.assets && result.assets.length > 0) {
        const files: PickedFile[] = [];
        
        for (const asset of result.assets) {
          const mimeType = asset.mimeType || 'application/octet-stream';
          const file: PickedFile = {
            uri: asset.uri,
            name: asset.name || 'unnamed-file',
            mimeType: mimeType,
            type: mimeType,
            size: asset.size || 0,
          };

          const validationError = validateFile(file);
          if (validationError) {
            Alert.alert('File Too Large', `${file.name}: ${validationError}`);
            continue;
          }

          files.push(file);
        }

        if (files.length > 0) {
          onMultipleSelect?.(files);
        }
      } else if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const mimeType = asset.mimeType || 'application/octet-stream';
        const file: PickedFile = {
          uri: asset.uri,
          name: asset.name || 'unnamed-file',
          mimeType: mimeType,
          type: mimeType,
          size: asset.size || 0,
        };

        const validationError = validateFile(file);
        if (validationError) {
          Alert.alert('Error', validationError);
          return;
        }

        onFileSelect(file);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      setIsLoading(true);

      // Request permission first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant access to your photo library to select images.');
        return;
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: false,
        allowsMultipleSelection: allowMultiple,
        quality: 0.8,
      };

      const result = await ImagePicker.launchImageLibraryAsync(options);

      if (result.canceled) {
        return;
      }

      if (allowMultiple && result.assets && result.assets.length > 0) {
        const files: PickedFile[] = [];
        
        for (const asset of result.assets) {
          const mimeType = asset.mimeType || 'image/jpeg';
          
          // Get actual file size
          let fileSize = 0;
          try {
            const fileInfo = await FileSystem.getInfoAsync(asset.uri);
            if (fileInfo.exists && 'size' in fileInfo) {
              fileSize = fileInfo.size;
            }
          } catch (e) {
            // Size unknown, will be determined during upload
          }
          
          const file: PickedFile = {
            uri: asset.uri,
            name: asset.fileName || `image-${Date.now()}.jpg`,
            mimeType: mimeType,
            type: mimeType,
            size: fileSize,
          };

          files.push(file);
        }

        onMultipleSelect?.(files);
      } else if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const mimeType = asset.mimeType || 'image/jpeg';
        
        // Get actual file size
        let fileSize = 0;
        try {
          const fileInfo = await FileSystem.getInfoAsync(asset.uri);
          if (fileInfo.exists && 'size' in fileInfo) {
            fileSize = fileInfo.size;
          }
        } catch (e) {
          // Size unknown, will be determined during upload
        }
        
        const file: PickedFile = {
          uri: asset.uri,
          name: asset.fileName || `image-${Date.now()}.jpg`,
          mimeType: mimeType,
          type: mimeType,
          size: fileSize,
        };

        onFileSelect(file);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickFile = () => {
    if (disabled || isLoading) return;

    if (fileType === 'image') {
      pickImage();
    } else {
      // For 'document' or 'any', show options
      if (fileType === 'any') {
        Alert.alert(
          'Select File Type',
          'Choose the type of file you want to upload',
          [
            { text: 'Image', onPress: pickImage },
            { text: 'Document', onPress: pickDocument },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } else {
        pickDocument();
      }
    }
  };

  const handleClear = (index?: number) => {
    if (allowMultiple && selectedFiles.length > 0 && typeof index === 'number') {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      onMultipleSelect?.(newFiles);
    } else {
      onClear?.();
    }
  };

  const getHintText = () => {
    if (fileType === 'image') {
      return 'Supports: JPG, PNG, GIF, WebP';
    } else if (fileType === 'document') {
      return 'Supports: PDF, DOC, DOCX, TXT';
    }
    return 'Tap to select image or document';
  };

  // Render single file or multiple files
  const renderFileList = () => {
    if (allowMultiple && selectedFiles.length > 0) {
      return (
        <View style={styles.fileList}>
          {selectedFiles.map((file, index) => (
            <View key={index} style={styles.fileSelected}>
              <HStack space="md" style={styles.fileInfo}>
                {getFileIcon(file.mimeType)}
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  {file.size > 0 && (
                    <Text style={styles.fileSize}>
                      {formatFileSize(file.size)}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => handleClear(index)}
                  disabled={disabled}
                >
                  <X size={20} color="#EF4444" />
                </TouchableOpacity>
              </HStack>
            </View>
          ))}
          {selectedFiles.length < 5 && (
            <TouchableOpacity
              style={[styles.addMoreButton, disabled && styles.uploadAreaDisabled]}
              onPress={handlePickFile}
              disabled={disabled}
            >
              <File size={20} color={disabled ? '#9CA3AF' : '#6B7280'} />
              <Text style={[styles.addMoreText, disabled && styles.labelDisabled]}>
                Add another file
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (selectedFile) {
      return (
        <View style={styles.fileSelected}>
          <HStack space="md" style={styles.fileInfo}>
            {getFileIcon(selectedFile.mimeType)}
            <View style={styles.fileDetails}>
              <Text style={styles.fileName} numberOfLines={1}>
                {selectedFile.name}
              </Text>
              {selectedFile.size > 0 && (
                <Text style={styles.fileSize}>
                  {formatFileSize(selectedFile.size)}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => handleClear()}
              disabled={disabled}
            >
              <X size={20} color="#EF4444" />
            </TouchableOpacity>
          </HStack>
        </View>
      );
    }

    return null;
  };

  const fileList = renderFileList();

  return (
    <View style={styles.container}>
      {!fileList ? (
        <TouchableOpacity
          style={[
            styles.uploadArea,
            disabled && styles.uploadAreaDisabled,
          ]}
          onPress={handlePickFile}
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color="#000000" />
          ) : (
            <>
              {getFileIcon()}
              <Text style={[styles.label, disabled && styles.labelDisabled]}>
                {label}
              </Text>
              <Text style={styles.hint}>{getHintText()}</Text>
              <Text style={styles.maxSizeHint}>
                Max size: {maxSizeMB}MB
              </Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        fileList
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadAreaDisabled: {
    opacity: 0.5,
    borderColor: '#D1D5DB',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginTop: 12,
  },
  labelDisabled: {
    color: '#9CA3AF',
  },
  hint: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  maxSizeHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  fileList: {
    gap: 8,
  },
  fileSelected: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  fileInfo: {
    alignItems: 'center',
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  fileSize: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  clearButton: {
    padding: 8,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    gap: 8,
  },
  addMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
});
