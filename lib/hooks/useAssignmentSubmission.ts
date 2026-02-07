import { useState, useCallback } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useFileUpload, type UploadableFile } from './useFileUpload';
import type { AssignmentStatus } from '@/types';

interface SubmitAssignmentOptions {
  assignmentId: string;
  studentId: string;
  submissionText?: string;
}

export function useAssignmentSubmission() {
  const { user, role } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const {
    uploadFile,
    deleteFile,
    progress,
    isUploading: fileUploading,
    error: fileError,
    reset,
  } = useFileUpload({
    folder: 'submissions',
    maxSizeMB: 25,
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/*',
      'application/zip',
      'application/x-zip-compressed',
    ],
  });

  const submitWithFile = useCallback(
    async (
      file: UploadableFile,
      options: SubmitAssignmentOptions
    ): Promise<string> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (role !== 'student') {
        throw new Error('Only students can submit assignments');
      }

      try {
        setIsSubmitting(true);
        setSubmissionError(null);

        // Upload file to Storage
        const uploadedFile = await uploadFile(file);

        // Create or update submission document
        const submissionData = {
          assignmentId: options.assignmentId,
          studentId: user.uid,
          studentName: user.displayName || 'Unknown',
          submissionUrl: uploadedFile.url,
          storagePath: uploadedFile.path,
          fileName: uploadedFile.name,
          fileSize: formatFileSize(uploadedFile.size),
          mimeType: uploadedFile.type,
          submissionText: options.submissionText || '',
          submittedAt: serverTimestamp(),
          status: 'submitted' as AssignmentStatus,
        };

        const docRef = await addDoc(collection(db, 'submissions'), submissionData);

        setIsSubmitting(false);
        return docRef.id;
      } catch (err: any) {
        setIsSubmitting(false);
        setSubmissionError(err.message || 'Failed to submit assignment');
        throw err;
      }
    },
    [user, role, uploadFile]
  );

  const submitTextOnly = useCallback(
    async (
      submissionText: string,
      options: SubmitAssignmentOptions
    ): Promise<string> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (role !== 'student') {
        throw new Error('Only students can submit assignments');
      }

      try {
        setIsSubmitting(true);
        setSubmissionError(null);

        const submissionData = {
          assignmentId: options.assignmentId,
          studentId: user.uid,
          studentName: user.displayName || 'Unknown',
          submissionText,
          submittedAt: serverTimestamp(),
          status: 'submitted' as AssignmentStatus,
        };

        const docRef = await addDoc(collection(db, 'submissions'), submissionData);

        setIsSubmitting(false);
        return docRef.id;
      } catch (err: any) {
        setIsSubmitting(false);
        setSubmissionError(err.message || 'Failed to submit assignment');
        throw err;
      }
    },
    [user, role]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const resetSubmission = useCallback(() => {
    reset();
    setSubmissionError(null);
    setIsSubmitting(false);
  }, [reset]);

  return {
    submitWithFile,
    submitTextOnly,
    isSubmitting: isSubmitting || fileUploading,
    progress,
    error: submissionError || fileError,
    resetSubmission,
  };
}
