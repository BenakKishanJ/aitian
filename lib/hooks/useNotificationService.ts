import { useCallback } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';

export type NotificationType = 
  | 'assignment_created'
  | 'assignment_due_soon'
  | 'assignment_graded'
  | 'material_uploaded'
  | 'announcement'
  | 'discussion_reply'
  | 'attendance_marked';

interface SendNotificationOptions {
  recipientIds: string[];
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, any>;
}

export function useNotificationService() {
  const { user } = useAuth();

  const sendNotification = useCallback(
    async (options: SendNotificationOptions): Promise<void> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      try {
        // Create notification documents for each recipient
        const notifications = options.recipientIds.map((recipientId) => ({
          recipientId,
          senderId: user.uid,
          senderName: user.displayName || 'System',
          title: options.title,
          body: options.body,
          type: options.type,
          data: options.data || {},
          read: false,
          createdAt: serverTimestamp(),
        }));

        // Batch write notifications
        const promises = notifications.map((notification) =>
          addDoc(collection(db, 'notifications'), notification)
        );

        await Promise.all(promises);

        // Note: Actual push notification sending is handled by Firebase Cloud Functions
        // which listens to the 'notifications' collection
      } catch (err: any) {
        console.error('Error sending notification:', err);
        throw new Error(err.message || 'Failed to send notification');
      }
    },
    [user]
  );

  const notifyAssignmentCreated = useCallback(
    async (
      courseInstanceId: string,
      studentIds: string[],
      assignmentTitle: string,
      dueDate: Date
    ) => {
      const formattedDate = dueDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      await sendNotification({
        recipientIds: studentIds,
        title: 'New Assignment',
        body: `"${assignmentTitle}" has been assigned. Due: ${formattedDate}`,
        type: 'assignment_created',
        data: {
          courseInstanceId,
          screen: 'assignments',
        },
      });
    },
    [sendNotification]
  );

  const notifyAssignmentGraded = useCallback(
    async (
      studentId: string,
      assignmentTitle: string,
      grade: number,
      maxScore: number
    ) => {
      await sendNotification({
        recipientIds: [studentId],
        title: 'Assignment Graded',
        body: `"${assignmentTitle}" has been graded: ${grade}/${maxScore}`,
        type: 'assignment_graded',
        data: {
          screen: 'assignments',
        },
      });
    },
    [sendNotification]
  );

  const notifyMaterialUploaded = useCallback(
    async (
      courseInstanceId: string,
      studentIds: string[],
      materialTitle: string,
      materialType: string
    ) => {
      await sendNotification({
        recipientIds: studentIds,
        title: 'New Study Material',
        body: `"${materialTitle}" (${materialType}) has been uploaded`,
        type: 'material_uploaded',
        data: {
          courseInstanceId,
          screen: 'materials',
        },
      });
    },
    [sendNotification]
  );

  const notifyDiscussionReply = useCallback(
    async (
      recipientIds: string[],
      discussionTitle: string,
      replierName: string
    ) => {
      await sendNotification({
        recipientIds,
        title: 'New Reply',
        body: `${replierName} replied to "${discussionTitle}"`,
        type: 'discussion_reply',
        data: {
          screen: 'discussions',
        },
      });
    },
    [sendNotification]
  );

  const notifyAttendanceMarked = useCallback(
    async (
      studentIds: string[],
      courseName: string,
      date: Date,
      status: 'present' | 'absent' | 'late' | 'excused'
    ) => {
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      const statusText = status.charAt(0).toUpperCase() + status.slice(1);

      await sendNotification({
        recipientIds: studentIds,
        title: 'Attendance Updated',
        body: `Your attendance for ${courseName} on ${formattedDate}: ${statusText}`,
        type: 'attendance_marked',
        data: {
          screen: 'attendance',
        },
      });
    },
    [sendNotification]
  );

  const notifyLowAttendance = useCallback(
    async (
      studentId: string,
      courseName: string,
      percentage: number
    ) => {
      await sendNotification({
        recipientIds: [studentId],
        title: 'Attendance Alert',
        body: `Your attendance for ${courseName} is ${percentage.toFixed(1)}%. Please attend classes regularly to avoid falling below 75%.`,
        type: 'attendance_marked',
        data: {
          screen: 'attendance',
        },
      });
    },
    [sendNotification]
  );

  const notifyParentAttendance = useCallback(
    async (
      parentIds: string[],
      studentName: string,
      courseName: string,
      date: Date,
      status: 'present' | 'absent' | 'late' | 'excused'
    ) => {
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      const statusText = status.charAt(0).toUpperCase() + status.slice(1);

      await sendNotification({
        recipientIds: parentIds,
        title: 'Child Attendance Update',
        body: `${studentName}'s attendance for ${courseName} on ${formattedDate}: ${statusText}`,
        type: 'attendance_marked',
        data: {
          screen: 'attendance',
        },
      });
    },
    [sendNotification]
  );

  const notifyParentLowAttendance = useCallback(
    async (
      parentIds: string[],
      studentName: string,
      courseName: string,
      percentage: number
    ) => {
      await sendNotification({
        recipientIds: parentIds,
        title: 'Child Attendance Alert',
        body: `${studentName}'s attendance for ${courseName} is ${percentage.toFixed(1)}%. Please ensure regular attendance.`,
        type: 'attendance_marked',
        data: {
          screen: 'attendance',
        },
      });
    },
    [sendNotification]
  );

  return {
    sendNotification,
    notifyAssignmentCreated,
    notifyAssignmentGraded,
    notifyMaterialUploaded,
    notifyDiscussionReply,
    notifyAttendanceMarked,
    notifyLowAttendance,
    notifyParentAttendance,
    notifyParentLowAttendance,
  };
}
