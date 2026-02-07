import { useState, useCallback } from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useFileUpload, type UploadedFile, type UploadableFile } from './useFileUpload';
import type { MaterialType } from '@/types';

interface UploadMaterialOptions {
  courseInstanceId: string;
  title: string;
  description?: string;
  type: MaterialType;
  tags?: string[];
}

export function useMaterialUpload() {
  const { user, role } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    uploadFile,
    deleteFile,
    progress,
    isUploading: fileUploading,
    error: fileError,
    reset,
  } = useFileUpload({
    folder: 'materials',
    maxSizeMB: 50,
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/*',
      'video/*',
    ],
  });

  const uploadMaterial = useCallback(
    async (
      file: UploadableFile,
      options: UploadMaterialOptions
    ): Promise<string> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (role !== 'teacher' && role !== 'admin') {
        throw new Error('Only teachers and admins can upload materials');
      }

      try {
        setIsUploading(true);
        setUploadError(null);

        // Upload file to Storage
        const uploadedFile = await uploadFile(file);

        // Create material document in Firestore
        const materialData = {
          courseInstanceId: options.courseInstanceId,
          title: options.title,
          type: options.type,
          url: uploadedFile.url,
          storagePath: uploadedFile.path,
          description: options.description || '',
          fileSize: formatFileSize(uploadedFile.size),
          fileName: uploadedFile.name,
          mimeType: uploadedFile.type,
          tags: options.tags || [],
          uploadedBy: user.uid,
          uploadedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'materials'), materialData);

        setIsUploading(false);
        return docRef.id;
      } catch (err: any) {
        setIsUploading(false);
        setUploadError(err.message || 'Failed to upload material');
        throw err;
      }
    },
    [user, role, uploadFile]
  );

  const deleteMaterialWithFile = useCallback(
    async (materialId: string, storagePath?: string) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (role !== 'teacher' && role !== 'admin') {
        throw new Error('Only teachers and admins can delete materials');
      }

      try {
        // Delete file from Storage if path exists
        if (storagePath) {
          await deleteFile(storagePath);
        }

        // Delete document from Firestore
        await deleteDoc(doc(db, 'materials', materialId));
      } catch (err: any) {
        console.error('Error deleting material:', err);
        throw new Error(err.message || 'Failed to delete material');
      }
    },
    [user, role, deleteFile]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const resetUpload = useCallback(() => {
    reset();
    setUploadError(null);
    setIsUploading(false);
  }, [reset]);

  return {
    uploadMaterial,
    deleteMaterialWithFile,
    isUploading: isUploading || fileUploading,
    progress,
    error: uploadError || fileError,
    resetUpload,
  };
}
