import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import type { NewsPost, NewsPostUpdateData } from '@/types';

interface UseNewsOptions {
  pinnedOnly?: boolean;
}

export function useNews(options: UseNewsOptions = {}) {
  const { pinnedOnly } = options;
  const { user, role } = useAuth();
  
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const postsRef = collection(db, 'newsPosts');
      const postsQuery = query(postsRef, orderBy('createdAt', 'desc'));
      
      const snapshot = await getDocs(postsQuery);
      const fetchedPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as NewsPost[];

      // Filter pinned if requested
      let filteredPosts = fetchedPosts;
      if (pinnedOnly) {
        filteredPosts = fetchedPosts.filter((post) => post.isPinned);
      }

      setPosts(filteredPosts);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching news posts:', err);
      setError(err.message || 'Failed to fetch news posts');
      setLoading(false);
    }
  }, [pinnedOnly]);

  // Subscribe to real-time updates
  useEffect(() => {
    const postsRef = collection(db, 'newsPosts');
    const postsQuery = query(postsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        const updatedPosts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as NewsPost[];

        // Filter pinned if requested
        let filteredPosts = updatedPosts;
        if (pinnedOnly) {
          filteredPosts = updatedPosts.filter((post) => post.isPinned);
        }

        setPosts(filteredPosts);
      },
      (err) => {
        console.error('Error listening to news posts:', err);
      }
    );

    return () => unsubscribe();
  }, [pinnedOnly]);

  // Update a news post
  const updatePost = async (postId: string, data: NewsPostUpdateData): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (role !== 'teacher' && role !== 'admin') {
      throw new Error('Only teachers and admins can update news posts');
    }

    setUpdating(true);
    try {
      await updateDoc(doc(db, 'newsPosts', postId), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      setUpdating(false);
    } catch (err: any) {
      console.error('Error updating news post:', err);
      setUpdating(false);
      throw new Error(err.message || 'Failed to update news post');
    }
  };

  // Toggle pin status
  const togglePin = async (postId: string, currentPinned: boolean): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (role !== 'teacher' && role !== 'admin') {
      throw new Error('Only teachers and admins can pin posts');
    }

    try {
      await updateDoc(doc(db, 'newsPosts', postId), {
        isPinned: !currentPinned,
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.error('Error toggling pin:', err);
      throw new Error(err.message || 'Failed to toggle pin');
    }
  };

  // Refresh posts
  const refresh = useCallback(async () => {
    await fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    loading,
    error,
    updating,
    updatePost,
    togglePin,
    refresh,
  };
}
