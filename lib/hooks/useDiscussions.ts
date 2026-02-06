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
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import type { Discussion, DiscussionCreateData } from '@/types';

interface UseDiscussionsOptions {
  courseInstanceId?: string;
  searchQuery?: string;
  pinnedOnly?: boolean;
}

export function useDiscussions(options: UseDiscussionsOptions = {}) {
  const { courseInstanceId, searchQuery, pinnedOnly } = options;
  const { user, userData, role } = useAuth();
  
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Fetch discussions
  const fetchDiscussions = useCallback(async () => {
    if (!courseInstanceId || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const discussionsRef = collection(db, 'discussions');
      let discussionsQuery = query(
        discussionsRef,
        where('courseInstanceId', '==', courseInstanceId),
        orderBy('isPinned', 'desc'),
        orderBy('createdAt', 'desc')
      );

      if (pinnedOnly) {
        discussionsQuery = query(
          discussionsRef,
          where('courseInstanceId', '==', courseInstanceId),
          where('isPinned', '==', true),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(discussionsQuery);
      let fetchedDiscussions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Discussion[];

      // Fetch creator names for each discussion
      for (const discussion of fetchedDiscussions) {
        try {
          const userDoc = await getDocs(
            query(collection(db, 'users'), where('__name__', '==', discussion.createdBy))
          );
          if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            discussion.createdByName = userData.name || 'Unknown';
            discussion.createdByRole = userData.role || 'student';
          }
        } catch (err) {
          console.error('Error fetching user:', err);
        }
      }

      // Apply search filter
      if (searchQuery?.trim()) {
        const query = searchQuery.toLowerCase();
        fetchedDiscussions = fetchedDiscussions.filter(
          (d) =>
            d.title.toLowerCase().includes(query) ||
            d.content.toLowerCase().includes(query)
        );
      }

      setDiscussions(fetchedDiscussions);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching discussions:', err);
      setError(err.message || 'Failed to fetch discussions');
      setLoading(false);
    }
  }, [courseInstanceId, user, searchQuery, pinnedOnly]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!courseInstanceId) return;

    const discussionsRef = collection(db, 'discussions');
    const discussionsQuery = query(
      discussionsRef,
      where('courseInstanceId', '==', courseInstanceId),
      orderBy('isPinned', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      discussionsQuery,
      async (snapshot) => {
        const updatedDiscussions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Discussion[];

        // Fetch creator names
        for (const discussion of updatedDiscussions) {
          try {
            const userDoc = await getDocs(
              query(collection(db, 'users'), where('__name__', '==', discussion.createdBy))
            );
            if (!userDoc.empty) {
              const userData = userDoc.docs[0].data();
              discussion.createdByName = userData.name || 'Unknown';
              discussion.createdByRole = userData.role || 'student';
            }
          } catch (err) {
            console.error('Error fetching user:', err);
          }
        }

        setDiscussions(updatedDiscussions);
      },
      (err) => {
        console.error('Error listening to discussions:', err);
      }
    );

    return () => unsubscribe();
  }, [courseInstanceId]);

  // Create a new discussion
  const createDiscussion = async (data: DiscussionCreateData) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setCreating(true);

      const discussionData = {
        ...data,
        createdBy: user.uid,
        createdByName: userData?.name || 'Unknown',
        createdByRole: role || 'student',
        replyCount: 0,
        isPinned: false,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'discussions'), discussionData);
      setCreating(false);
      return docRef.id;
    } catch (err: any) {
      console.error('Error creating discussion:', err);
      setCreating(false);
      throw err;
    }
  };

  // Pin/unpin a discussion
  const togglePin = async (discussionId: string, currentPinned: boolean) => {
    if (!user || (role !== 'teacher' && role !== 'admin')) {
      throw new Error('Only teachers and admins can pin discussions');
    }

    try {
      await updateDoc(doc(db, 'discussions', discussionId), {
        isPinned: !currentPinned,
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.error('Error toggling pin:', err);
      throw err;
    }
  };

  // Update a discussion
  const updateDiscussion = async (discussionId: string, data: Partial<Discussion>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const discussion = discussions.find((d) => d.id === discussionId);
      if (!discussion) {
        throw new Error('Discussion not found');
      }

      // Only creator or teacher/admin can update
      if (discussion.createdBy !== user.uid && role !== 'teacher' && role !== 'admin') {
        throw new Error('Not authorized to update this discussion');
      }

      await updateDoc(doc(db, 'discussions', discussionId), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.error('Error updating discussion:', err);
      throw err;
    }
  };

  // Delete a discussion
  const deleteDiscussion = async (discussionId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const discussion = discussions.find((d) => d.id === discussionId);
      if (!discussion) {
        throw new Error('Discussion not found');
      }

      // Only creator or teacher/admin can delete
      if (discussion.createdBy !== user.uid && role !== 'teacher' && role !== 'admin') {
        throw new Error('Not authorized to delete this discussion');
      }

      // Delete all replies first
      const repliesRef = collection(db, 'discussionReplies');
      const repliesQuery = query(repliesRef, where('threadId', '==', discussionId));
      const repliesSnap = await getDocs(repliesQuery);

      const batch = writeBatch(db);
      repliesSnap.docs.forEach((replyDoc) => {
        batch.delete(replyDoc.ref);
      });
      batch.delete(doc(db, 'discussions', discussionId));
      await batch.commit();

      await fetchDiscussions();
    } catch (err: any) {
      console.error('Error deleting discussion:', err);
      throw err;
    }
  };

  // Refresh discussions
  const refresh = async () => {
    await fetchDiscussions();
  };

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  return {
    discussions,
    loading,
    error,
    creating,
    createDiscussion,
    togglePin,
    updateDiscussion,
    deleteDiscussion,
    refresh,
  };
}
