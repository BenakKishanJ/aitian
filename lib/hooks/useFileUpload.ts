import { useState, useCallback } from 'react';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '@/lib/firebase';

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

export function useFileUpload(options: UseFileUploadOptions) {
  const { folder, maxSizeMB = 50, allowedTypes } = options;
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
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
    async (file: File, fileName?: string): Promise<UploadedFile> => {
      return new Promise((resolve, reject) => {
        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          reject(new Error(validationError));
          return;
        }

        setIsUploading(true);
        setError(null);
        setProgress({
          progress: 0,
          state: 'running',
          bytesTransferred: 0,
          totalBytes: file.size,
        });

        // Generate unique filename
        const timestamp = Date.now();
        const uniqueFileName = fileName || `${timestamp}_${file.name}`;
        const storagePath = `${folder}/${uniqueFileName}`;
        const storageRef = ref(storage, storagePath);

        // Start upload
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress({
              progress,
              state: snapshot.state,
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
            });
          },
          (error) => {
            setIsUploading(false);
            setProgress(null);
            let errorMessage = 'Upload failed';

            switch (error.code) {
              case 'storage/unauthorized':
                errorMessage = 'You do not have permission to upload files';
                break;
              case 'storage/canceled':
                errorMessage = 'Upload was cancelled';
                break;
              case 'storage/quota-exceeded':
                errorMessage = 'Storage quota exceeded';
                break;
              case 'storage/invalid-checksum':
                errorMessage = 'File verification failed';
                break;
              default:
                errorMessage = error.message;
            }

            setError(errorMessage);
            reject(new Error(errorMessage));
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              setIsUploading(false);
              setProgress({
                progress: 100,
                state: 'success',
                bytesTransferred: file.size,
                totalBytes: file.size,
              });

              resolve({
                url: downloadURL,
                path: storagePath,
                name: file.name,
                size: file.size,
                type: file.type,
              });
            } catch (err: any) {
              setIsUploading(false);
              setError(err.message || 'Failed to get download URL');
              reject(err);
            }
          }
        );
      });
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
