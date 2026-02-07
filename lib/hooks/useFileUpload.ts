import { useState, useCallback } from 'react';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '@/lib/firebase';
import * as FileSystem from 'expo-file-system';

export type UploadFolder =
  | 'materials'
  | 'submissions'
  | 'profile-photos'
  | 'announcements'
  | 'documents';

export interface UploadProgress {
  progress: number;
  state: 'running' | 'paused' | 'success' | 'error' | 'canceled';
  bytesTransferred: number;
  totalBytes: number;
}

interface UseFileUploadOptions {
  folder: UploadFolder;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export interface UploadedFile {
  url: string;
  path: string;
  name: string;
  size: number;
  type: string;
}

/**
 * Universal file type that works with both web File and native PickedFile
 */
export interface UploadableFile {
  name: string;
  size: number;
  type: string;
  // For native files, we need the URI to fetch the blob
  uri?: string;
}

/**
 * Convert base64 to Blob for upload
 */
const base64ToBlob = async (base64: string, mimeType: string): Promise<Blob> => {
  // Remove data URL prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;

  // Decode base64 to binary string
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

/**
 * Fetch file as blob from URI (works for both platforms)
 */
const fetchFileAsBlob = async (uri: string, mimeType: string): Promise<Blob> => {
  const response = await fetch(uri);
  const blob = await response.blob();

  // Ensure the blob has the correct MIME type
  if (blob.type !== mimeType) {
    return new Blob([blob], { type: mimeType });
  }

  return blob;
};

export function useFileUpload(options: UseFileUploadOptions) {
  const { folder, maxSizeMB = 50, allowedTypes } = options;
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: UploadableFile): string | null => {
    // Check file size (if known)
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > 0 && file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }

    // Check file type if allowed types specified
    if (allowedTypes && allowedTypes.length > 0) {
      const isAllowed = allowedTypes.some((type) => {
        if (type.includes('*')) {
          // Handle wildcards like "image/*"
          const prefix = type.split('/')[0];
          return file.type.startsWith(`${prefix}/`);
        }
        return file.type === type;
      });

      if (!isAllowed) {
        return `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
      }
    }

    return null;
  };

  const uploadFile = useCallback(
    async (file: UploadableFile, fileName?: string): Promise<UploadedFile> => {
      try {
        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          throw new Error(validationError);
        }

        setIsUploading(true);
        setError(null);

        // Generate unique filename
        const timestamp = Date.now();
        const uniqueFileName = fileName || `${timestamp}_${file.name}`;
        const storagePath = `${folder}/${uniqueFileName}`;
        const storageRef = ref(storage, storagePath);

        let downloadURL: string;
        let finalSize = file.size || 0;
        let finalType = file.type;
        let blob: Blob;

        // Handle web File objects
        if (file instanceof File) {
          setProgress({
            progress: 0,
            state: 'running',
            bytesTransferred: 0,
            totalBytes: file.size,
          });

          blob = file;
          finalSize = file.size;
          finalType = file.type;
        } else if (file.uri) {
          // Native file - use fetch to get blob
          setProgress({
            progress: 0,
            state: 'running',
            bytesTransferred: 0,
            totalBytes: file.size,
          });

          // Fetch the file as a blob
          blob = await fetchFileAsBlob(file.uri, file.type);
          finalSize = blob.size || file.size || 0;
          finalType = blob.type || file.type;
        } else {
          throw new Error('File must have either a File object or uri property');
        }

        // Upload blob
        await uploadBytes(storageRef, blob, {
          contentType: finalType,
        });

        downloadURL = await getDownloadURL(storageRef);

        setIsUploading(false);
        setProgress({
          progress: 100,
          state: 'success',
          bytesTransferred: finalSize,
          totalBytes: finalSize,
        });

        return {
          url: downloadURL,
          path: storagePath,
          name: file.name,
          size: finalSize,
          type: finalType,
        };
      } catch (err: any) {
        setIsUploading(false);
        console.error('Upload error:', err);
        const errorMessage = err.message || 'Failed to upload file';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [folder, maxSizeMB, allowedTypes]
  );

  const deleteFile = useCallback(
    async (filePath: string): Promise<void> => {
      try {
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
      } catch (err: any) {
        console.error('Error deleting file:', err);
        throw new Error(err.message || 'Failed to delete file');
      }
    },
    []
  );

  const reset = useCallback(() => {
    setProgress(null);
    setIsUploading(false);
    setError(null);
  }, []);

  return {
    uploadFile,
    deleteFile,
    reset,
    progress,
    isUploading,
    error,
  };
}
