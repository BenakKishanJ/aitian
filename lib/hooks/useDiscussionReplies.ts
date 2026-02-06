import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import type { DiscussionReply, DiscussionReplyCreateData } from '@/types';

interface UseDiscussionRepliesOptions {
  threadId?: string;
}

export function useDiscussionReplies(options: UseDiscussionRepliesOptions = {}) {
  const { threadId } = options;
  const { user, userData, role } = useAuth();
  
  const [replies, setReplies] = useState<DiscussionReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Fetch replies
  const fetchReplies = useCallback(async () => {
    if (!threadId || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const repliesRef = collection(db, 'discussionReplies');
      const repliesQuery = query(
        repliesRef,
        where('threadId', '==', threadId),
        orderBy('createdAt', 'asc')
      );

      const snapshot = await getDocs(repliesQuery);
      let fetchedReplies = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as DiscussionReply[];

      // Fetch creator names for each reply
      for (const reply of fetchedReplies) {
        try {
          const userDoc = await getDocs(
            query(collection(db, 'users'), where('__name__', '==', reply.createdBy))
          );
          if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            reply.createdByName = userData.name || 'Unknown';
            reply.createdByRole = userData.role || 'student';
          }
        } catch (err) {
          console.error('Error fetching user:', err);
        }
      }

      setReplies(fetchedReplies);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching replies:', err);
      setError(err.message || 'Failed to fetch replies');
      setLoading(false);
    }
  }, [threadId, user]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!threadId) return;

    const repliesRef = collection(db, 'discussionReplies');
    const repliesQuery = query(
      repliesRef,
      where('threadId', '==', threadId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      repliesQuery,
      async (snapshot) => {
        const updatedReplies = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as DiscussionReply[];

        // Fetch creator names
        for (const reply of updatedReplies) {
          try {
            const userDoc = await getDocs(
              query(collection(db, 'users'), where('__name__', '==', reply.createdBy))
            );
            if (!userDoc.empty) {
              const userData = userDoc.docs[0].data();
              reply.createdByName = userData.name || 'Unknown';
              reply.createdByRole = userData.role || 'student';
            }
          } catch (err) {
            console.error('Error fetching user:', err);
          }
        }

        setReplies(updatedReplies);
      },
      (err) => {
        console.error('Error listening to replies:', err);
      }
    );

    return () => unsubscribe();
  }, [threadId]);

  // Create a new reply
  const createReply = async (content: string) => {
    if (!user || !threadId) {
      throw new Error('User not authenticated or no thread selected');
    }

    try {
      setCreating(true);

      const replyData = {
        threadId,
        content,
        createdBy: user.uid,
        createdByName: userData?.name || 'Unknown',
        createdByRole: role || 'student',
        isTeacherReply: role === 'teacher' || role === 'admin',
        createdAt: serverTimestamp(),
      };

      // Add reply
      const docRef = await addDoc(collection(db, 'discussionReplies'), replyData);

      // Update reply count on discussion
      await updateDoc(doc(db, 'discussions', threadId), {
        replyCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      setCreating(false);
      return docRef.id;
    } catch (err: any) {
      console.error('Error creating reply:', err);
      setCreating(false);
      throw err;
    }
  };

  // Update a reply
  const updateReply = async (replyId: string, content: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const reply = replies.find((r) => r.id === replyId);
      if (!reply) {
        throw new Error('Reply not found');
      }

      // Only creator can update
      if (reply.createdBy !== user.uid) {
        throw new Error('Not authorized to update this reply');
      }

      await updateDoc(doc(db, 'discussionReplies', replyId), {
        content,
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.error('Error updating reply:', err);
      throw err;
    }
  };

  // Delete a reply
  const deleteReply = async (replyId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const reply = replies.find((r) => r.id === replyId);
      if (!reply) {
        throw new Error('Reply not found');
      }

      // Only creator or teacher/admin can delete
      if (reply.createdBy !== user.uid && role !== 'teacher' && role !== 'admin') {
        throw new Error('Not authorized to delete this reply');
      }

      await deleteDoc(doc(db, 'discussionReplies', replyId));

      // Update reply count on discussion
      if (threadId) {
        await updateDoc(doc(db, 'discussions', threadId), {
          replyCount: increment(-1),
          updatedAt: serverTimestamp(),
        });
      }

      await fetchReplies();
    } catch (err: any) {
      console.error('Error deleting reply:', err);
      throw err;
    }
  };

  // Refresh replies
  const refresh = async () => {
    await fetchReplies();
  };

  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  return {
    replies,
    loading,
    error,
    creating,
    createReply,
    updateReply,
    deleteReply,
    refresh,
  };
}
