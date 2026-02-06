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
  serverTimestamp,
  limit,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, deleteUser as deleteAuthUser } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import type { UserData, Role, DepartmentId } from '@/types';

interface UseAdminUsersOptions {
  role?: Role | null;
  departmentId?: string | null;
  searchQuery?: string;
  pageSize?: number;
}

interface UserFilters {
  role: Role | null;
  departmentId: string | null;
  isActive: boolean | null;
}

export function useAdminUsers(options: UseAdminUsersOptions = {}) {
  const { role: filterRole, departmentId, searchQuery, pageSize = 50 } = options;
  const { user, role: currentUserRole } = useAuth();
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);

  // Fetch users with pagination
  const fetchUsers = useCallback(async (loadMore = false) => {
    if (!user || currentUserRole !== 'admin') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const usersRef = collection(db, 'users');
      let usersQuery = query(
        usersRef,
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      // Apply role filter
      if (filterRole) {
        usersQuery = query(
          usersRef,
          where('role', '==', filterRole),
          orderBy('createdAt', 'desc'),
          limit(pageSize)
        );
      }

      // Apply department filter
      if (departmentId && !filterRole) {
        usersQuery = query(
          usersRef,
          where('departmentId', '==', departmentId),
          orderBy('createdAt', 'desc'),
          limit(pageSize)
        );
      }

      // Apply pagination
      if (loadMore && lastDoc) {
        usersQuery = query(usersQuery, startAfter(lastDoc));
      }

      const snapshot = await getDocs(usersQuery);
      const fetchedUsers = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as UserData[];

      // Apply search filter client-side (Firestore doesn't support text search)
      let filteredUsers = fetchedUsers;
      if (searchQuery?.trim()) {
        const query = searchQuery.toLowerCase();
        filteredUsers = fetchedUsers.filter(
          (u) =>
            u.name?.toLowerCase().includes(query) ||
            u.email?.toLowerCase().includes(query) ||
            (u as any).usn?.toLowerCase().includes(query)
        );
      }

      if (loadMore) {
        setUsers((prev) => [...prev, ...filteredUsers]);
      } else {
        setUsers(filteredUsers);
      }

      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      setHasMore(snapshot.docs.length === pageSize);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
      setLoading(false);
    }
  }, [user, currentUserRole, filterRole, departmentId, searchQuery, pageSize, lastDoc]);

  // Create a new user
  const createUser = async (userData: {
    email: string;
    password: string;
    name: string;
    role: Role;
    departmentId?: DepartmentId;
    semester?: number;
    section?: string;
    usn?: string;
    teacherCode?: string;
  }) => {
    if (!user || currentUserRole !== 'admin') {
      throw new Error('Only admins can create users');
    }

    try {
      setCreating(true);

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      // Create Firestore user document
      const newUserData: any = {
        uid: userCredential.user.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        profileComplete: true,
        isActive: true,
        createdAt: serverTimestamp(),
      };

      // Add role-specific fields
      if (userData.role === 'student') {
        newUserData.departmentId = userData.departmentId;
        newUserData.semester = userData.semester;
        newUserData.section = userData.section;
        newUserData.usn = userData.usn;
        newUserData.batch = userData.usn?.substring(0, 4);
      } else if (userData.role === 'teacher') {
        newUserData.departmentId = userData.departmentId;
        newUserData.teacherCode = userData.teacherCode;
      }

      await addDoc(collection(db, 'users'), newUserData);

      setCreating(false);
      await refresh();
      return userCredential.user.uid;
    } catch (err: any) {
      console.error('Error creating user:', err);
      setCreating(false);
      throw new Error(err.message || 'Failed to create user');
    }
  };

  // Update user
  const updateUser = async (userId: string, updates: Partial<UserData>) => {
    if (!user || currentUserRole !== 'admin') {
      throw new Error('Only admins can update users');
    }

    try {
      setUpdating(true);

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      setUpdating(false);
      await refresh();
    } catch (err: any) {
      console.error('Error updating user:', err);
      setUpdating(false);
      throw new Error(err.message || 'Failed to update user');
    }
  };

  // Delete user
  const deleteUser = async (userId: string) => {
    if (!user || currentUserRole !== 'admin') {
      throw new Error('Only admins can delete users');
    }

    try {
      setDeleting(true);

      // Delete Firestore document
      await deleteDoc(doc(db, 'users', userId));

      // Note: Deleting Firebase Auth user requires Cloud Functions
      // or the user must be recently signed in
      // For now, we just mark as inactive in Firestore

      setDeleting(false);
      await refresh();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setDeleting(false);
      throw new Error(err.message || 'Failed to delete user');
    }
  };

  // Toggle user active status
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    if (!user || currentUserRole !== 'admin') {
      throw new Error('Only admins can change user status');
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: !currentStatus,
        updatedAt: serverTimestamp(),
      });
      await refresh();
    } catch (err: any) {
      console.error('Error toggling user status:', err);
      throw new Error(err.message || 'Failed to update user status');
    }
  };

  // Load more users
  const loadMore = () => {
    if (hasMore && !loading) {
      fetchUsers(true);
    }
  };

  // Refresh users
  const refresh = async () => {
    setLastDoc(null);
    setHasMore(true);
    await fetchUsers(false);
  };

  useEffect(() => {
    fetchUsers(false);
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    creating,
    updating,
    deleting,
    hasMore,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    loadMore,
    refresh,
  };
}
