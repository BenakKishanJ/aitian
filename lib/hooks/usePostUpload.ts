import { useState, useCallback } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useFileUpload, type UploadableFile } from './useFileUpload';
import type { MediaAttachment, TargetAudience } from '@/types';

interface CreatePostOptions {
  title?: string;
  content: string;
  isAnonymous?: boolean;
  isPinned?: boolean;
  targetAudience: TargetAudience;
}

interface UpdatePostOptions {
  title?: string;
  content?: string;
  media?: MediaAttachment[];
  isPinned?: boolean;
}

export function usePostUpload() {
  const { user, role } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [totalFiles, setTotalFiles] = useState<number>(0);

  const {
    uploadFile,
    deleteFile,
    isUploading: fileUploading,
    error: fileError,
    reset,
  } = useFileUpload({
    folder: 'announcements',
    maxSizeMB: 10,
    allowedTypes: [
      'image/*',
      'video/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
  });

  /**
   * Upload multiple files and return media attachments
   */
  const uploadMediaFiles = useCallback(
    async (files: UploadableFile[]): Promise<MediaAttachment[]> => {
      if (files.length === 0) return [];

      const media: MediaAttachment[] = [];
      setTotalFiles(files.length);
      setCurrentFileIndex(0);

      for (let i = 0; i < files.length; i++) {
        try {
          setCurrentFileIndex(i + 1);
          const file = files[i];
          
          // Upload file to Firebase Storage
          const uploadedFile = await uploadFile(file);

          media.push({
            url: uploadedFile.url,
            storagePath: uploadedFile.path,
            fileName: uploadedFile.name,
            mimeType: uploadedFile.type,
            fileSize: uploadedFile.size,
          });

          // Update progress
          setUploadProgress(((i + 1) / files.length) * 100);
        } catch (err: any) {
          console.error(`Error uploading file ${i + 1}:`, err);
          throw new Error(`Failed to upload file ${files[i].name || i + 1}: ${err.message}`);
        }
      }

      return media;
    },
    [uploadFile]
  );

  /**
   * Create a new post with optional media files
   */
  const createPost = useCallback(
    async (
      options: CreatePostOptions,
      files?: UploadableFile[]
    ): Promise<string> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (role !== 'teacher' && role !== 'admin') {
        throw new Error('Only teachers and admins can create posts');
      }

      try {
        setIsUploading(true);
        setUploadError(null);
        setUploadProgress(0);

        // Upload files if any
        let media: MediaAttachment[] = [];
        let mediaUrls: string[] = [];
        
        if (files && files.length > 0) {
          media = await uploadMediaFiles(files);
          mediaUrls = media.map(m => m.url);
        }

        // Create post document
        const postData = {
          title: options.title || '',
          content: options.content,
          mediaUrls, // Legacy field for backward compatibility
          media, // New rich media field
          postedBy: user.uid,
          authorName: user.displayName || user.email || 'Anonymous',
          authorRole: role,
          isAnonymous: options.isAnonymous || false,
          isPinned: options.isPinned || false,
          targetAudience: options.targetAudience,
          createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'newsPosts'), postData);

        setIsUploading(false);
        return docRef.id;
      } catch (err: any) {
        setIsUploading(false);
        setUploadError(err.message || 'Failed to create post');
        throw err;
      }
    },
    [user, role, uploadMediaFiles]
  );

  /**
   * Update an existing post
   */
  const updatePost = useCallback(
    async (postId: string, options: UpdatePostOptions): Promise<void> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (role !== 'teacher' && role !== 'admin') {
        throw new Error('Only teachers and admins can update posts');
      }

      try {
        const updateData: any = {
          updatedAt: serverTimestamp(),
        };

        if (options.title !== undefined) updateData.title = options.title;
        if (options.content !== undefined) updateData.content = options.content;
        if (options.isPinned !== undefined) updateData.isPinned = options.isPinned;
        
        if (options.media) {
          updateData.media = options.media;
          updateData.mediaUrls = options.media.map(m => m.url);
        }

        await updateDoc(doc(db, 'newsPosts', postId), updateData);
      } catch (err: any) {
        console.error('Error updating post:', err);
        throw new Error(err.message || 'Failed to update post');
      }
    },
    [user, role]
  );

  /**
   * Delete media files from storage
   */
  const deleteMediaFiles = useCallback(
    async (storagePaths: string[]): Promise<void> => {
      for (const path of storagePaths) {
        try {
          await deleteFile(path);
        } catch (err) {
          console.error(`Error deleting file at ${path}:`, err);
          // Continue deleting other files even if one fails
        }
      }
    },
    [deleteFile]
  );

  /**
   * Delete a post and optionally its associated media files
   */
  const deletePost = useCallback(
    async (postId: string, media?: MediaAttachment[]): Promise<void> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (role !== 'teacher' && role !== 'admin') {
        throw new Error('Only teachers and admins can delete posts');
      }

      try {
        // Delete associated media files
        if (media && media.length > 0) {
          const storagePaths = media.map(m => m.storagePath);
          await deleteMediaFiles(storagePaths);
        }

        // Delete post document
        await deleteDoc(doc(db, 'newsPosts', postId));
      } catch (err: any) {
        console.error('Error deleting post:', err);
        throw new Error(err.message || 'Failed to delete post');
      }
    },
    [user, role, deleteMediaFiles]
  );

  const resetUpload = useCallback(() => {
    reset();
    setUploadError(null);
    setIsUploading(false);
    setUploadProgress(0);
    setCurrentFileIndex(0);
    setTotalFiles(0);
  }, [reset]);

  return {
    createPost,
    updatePost,
    deletePost,
    uploadMediaFiles,
    deleteMediaFiles,
    isUploading: isUploading || fileUploading,
    uploadProgress,
    currentFileIndex,
    totalFiles,
    error: uploadError || fileError,
    resetUpload,
  };
}
