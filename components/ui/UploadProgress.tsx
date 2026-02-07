import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { Upload, CheckCircle2, AlertCircle, Pause } from 'lucide-react-native';
import type { UploadProgress } from '@/lib/hooks/useFileUpload';

interface UploadProgressBarProps {
  progress: UploadProgress | null;
  showDetails?: boolean;
}

export function UploadProgressBar({
  progress,
  showDetails = true,
}: UploadProgressBarProps) {
  if (!progress) return null;

  const getStatusIcon = () => {
    switch (progress.state) {
      case 'success':
        return <CheckCircle2 size={20} color="#10B981" />;
      case 'error':
        return <AlertCircle size={20} color="#EF4444" />;
      case 'paused':
        return <Pause size={20} color="#F59E0B" />;
      default:
        return <Upload size={20} color="#3B82F6" />;
    }
  };

  const getStatusText = () => {
    switch (progress.state) {
      case 'success':
        return 'Upload complete';
      case 'error':
        return 'Upload failed';
      case 'paused':
        return 'Upload paused';
      case 'running':
        return `Uploading... ${Math.round(progress.progress)}%`;
      default:
        return 'Uploading...';
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <View style={styles.container}>
      <HStack space="sm" style={styles.header}>
        {getStatusIcon()}
        <Text style={styles.statusText}>{getStatusText()}</Text>
        {progress.state === 'running' && (
          <ActivityIndicator size="small" color="#3B82F6" />
        )}
      </HStack>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${progress.progress}%`,
              backgroundColor:
                progress.state === 'success'
                  ? '#10B981'
                  : progress.state === 'error'
                  ? '#EF4444'
                  : '#3B82F6',
            },
          ]}
        />
      </View>

      {/* Details */}
      {showDetails && progress.state === 'running' && (
        <HStack space="md" style={styles.details}>
          <Text style={styles.detailText}>
            {formatBytes(progress.bytesTransferred)} /{' '}
            {formatBytes(progress.totalBytes)}
          </Text>
          <Text style={styles.detailText}>
            {Math.round(progress.progress)}%
          </Text>
        </HStack>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  details: {
    justifyContent: 'space-between',
    marginTop: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
