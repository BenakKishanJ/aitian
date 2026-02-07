import React, { useCallback, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  Check,
} from 'lucide-react-native';

export type FileType = 'image' | 'document' | 'any';

interface FilePickerProps {
  onFileSelect: (file: File) => void;
  onClear?: () => void;
  fileType?: FileType;
  selectedFile?: File | null;
  disabled?: boolean;
  label?: string;
  accept?: string;
}

// Helper to convert expo file to web File object
const createFileFromUri = async (
  uri: string,
  name: string,
  mimeType: string
): Promise<File> => {
  // For web, we can use fetch
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new File([blob], name, { type: mimeType });
  }
  
  // For React Native, we need to handle this differently
  // This is a simplified version - in production you'd use expo-file-system
  const response = await fetch(uri);
  const blob = await response.blob();
  return new File([blob], name, { type: mimeType });
};

export function FilePicker({
  onFileSelect,
  onClear,
  fileType = 'any',
  selectedFile,
  disabled = false,
  label = 'Select File',
  accept,
}: FilePickerProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getAcceptTypes = () => {
    if (accept) return accept;
    
    switch (fileType) {
      case 'image':
        return 'image/*';
      case 'document':
        return '.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx';
      default:
        return '*';
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) {
      return <Upload size={24} color={disabled ? '#9CA3AF' : '#000000'} />;
    }
    
    if (selectedFile.type.startsWith('image/')) {
      return <ImageIcon size={24} color="#10B981" />;
    }
    
    return <FileText size={24} color="#3B82F6" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleClear = () => {
    onClear?.();
  };

  // Web implementation using hidden input
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {!selectedFile ? (
          <View
            style={[
              styles.uploadArea,
              isHovered && styles.uploadAreaHovered,
              disabled && styles.uploadAreaDisabled,
            ]}
            // @ts-ignore - web-only props
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <TouchableOpacity
              onPress={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = getAcceptTypes();
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files && files.length > 0) {
                    onFileSelect(files[0]);
                  }
                };
                input.click();
              }}
              disabled={disabled}
              style={styles.touchableContent}
            >
              {getFileIcon()}
              <Text style={[styles.label, disabled && styles.labelDisabled]}>
                {label}
              </Text>
              <Text style={styles.hint}>
                {fileType === 'image'
                  ? 'Supports: JPG, PNG, GIF'
                  : fileType === 'document'
                  ? 'Supports: PDF, DOC, DOCX'
                  : 'Click to browse files'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.fileSelected}>
            <HStack space="md" style={styles.fileInfo}>
              {getFileIcon()}
              <View style={styles.fileDetails}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {selectedFile.name}
                </Text>
                <Text style={styles.fileSize}>
                  {formatFileSize(selectedFile.size)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClear}
                disabled={disabled}
              >
                <X size={20} color="#EF4444" />
              </TouchableOpacity>
            </HStack>
          </View>
        )}
      </View>
    );
  }

  // Native implementation (simplified - would need expo-document-picker)
  return (
    <View style={styles.container}>
      {!selectedFile ? (
        <TouchableOpacity
          style={[
            styles.uploadArea,
            disabled && styles.uploadAreaDisabled,
          ]}
          onPress={() => {
            Alert.alert(
              'File Upload',
              'File picker requires expo-document-picker. Please use the URL option for now.',
              [{ text: 'OK' }]
            );
          }}
          disabled={disabled}
        >
          {getFileIcon()}
          <Text style={[styles.label, disabled && styles.labelDisabled]}>
            {label}
          </Text>
          <Text style={styles.hint}>Tap to select file</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.fileSelected}>
          <HStack space="md" style={styles.fileInfo}>
            {getFileIcon()}
            <View style={styles.fileDetails}>
              <Text style={styles.fileName} numberOfLines={1}>
                {selectedFile.name}
              </Text>
              <Text style={styles.fileSize}>
                {formatFileSize(selectedFile.size)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
              disabled={disabled}
            >
              <X size={20} color="#EF4444" />
            </TouchableOpacity>
          </HStack>
        </View>
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
  touchableContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  uploadAreaHovered: {
    borderColor: '#000000',
    backgroundColor: '#F3F4F6',
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
});
