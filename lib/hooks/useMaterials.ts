import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

export interface Material {
  id: string;
  courseInstanceId: string;
  title: string;
  type: "pdf" | "video" | "link" | "document" | "other";
  url: string;
  description?: string;
  uploadedBy: string;
  uploadedByName?: string;
  uploadedAt: any;
  fileSize?: string;
  tags?: string[];
}

export interface UseMaterialsOptions {
  courseInstanceId: string;
  searchQuery?: string;
  typeFilter?: string | null;
  pageSize?: number;
}

export function useMaterials(options: UseMaterialsOptions) {
  const { user, role } = useAuth();
  const { courseInstanceId, searchQuery, typeFilter, pageSize = 20 } = options;

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);

  const fetchMaterials = async (loadMore = false) => {
    if (!courseInstanceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const materialsRef = collection(db, "materials");
      let materialsQuery = query(
        materialsRef,
        where("courseInstanceId", "==", courseInstanceId),
        orderBy("uploadedAt", "desc"),
        limit(pageSize)
      );

      // Apply type filter
      if (typeFilter && typeFilter !== "all") {
        materialsQuery = query(
          materialsRef,
          where("courseInstanceId", "==", courseInstanceId),
          where("type", "==", typeFilter),
          orderBy("uploadedAt", "desc"),
          limit(pageSize)
        );
      }

      // Pagination for load more
      if (loadMore && lastDoc) {
        if (typeFilter && typeFilter !== "all") {
          materialsQuery = query(
            materialsRef,
            where("courseInstanceId", "==", courseInstanceId),
            where("type", "==", typeFilter),
            orderBy("uploadedAt", "desc"),
            startAfter(lastDoc),
            limit(pageSize)
          );
        } else {
          materialsQuery = query(
            materialsRef,
            where("courseInstanceId", "==", courseInstanceId),
            orderBy("uploadedAt", "desc"),
            startAfter(lastDoc),
            limit(pageSize)
          );
        }
      }

      const materialsSnap = await getDocs(materialsQuery);
      const fetchedMaterials = materialsSnap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Material)
      );

      // Fetch uploader names
      for (const material of fetchedMaterials) {
        try {
          const userDoc = await getDoc(doc(db, "users", material.uploadedBy));
          if (userDoc.exists()) {
            material.uploadedByName = userDoc.data().name || "Unknown";
          }
        } catch (err) {
          console.error("Error fetching user:", err);
          material.uploadedByName = "Unknown";
        }
      }

      // Apply search filter
      let filteredMaterials = fetchedMaterials;
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredMaterials = fetchedMaterials.filter(
          (material) =>
            material.title.toLowerCase().includes(query) ||
            material.description?.toLowerCase().includes(query) ||
            material.type.toLowerCase().includes(query)
        );
      }

      if (loadMore) {
        setMaterials((prev) => [...prev, ...filteredMaterials]);
      } else {
        setMaterials(filteredMaterials);
      }

      if (materialsSnap.docs.length > 0) {
        setLastDoc(materialsSnap.docs[materialsSnap.docs.length - 1]);
      }
      setHasMore(materialsSnap.docs.length === pageSize);
      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching materials:", err);
      setError(err.message || "Failed to fetch materials");
      setLoading(false);
    }
  };

  const addMaterial = async (materialData: {
    title: string;
    type: Material["type"];
    url: string;
    description?: string;
    fileSize?: string;
    tags?: string[];
  }) => {
    if (!user || !courseInstanceId) {
      throw new Error("User not authenticated or course not specified");
    }

    if (role !== "teacher" && role !== "admin") {
      throw new Error("Only teachers and admins can upload materials");
    }

    try {
      const newMaterial = {
        courseInstanceId,
        ...materialData,
        uploadedBy: user.uid,
        uploadedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "materials"), newMaterial);

      // Refresh the list
      await refresh();

      return docRef.id;
    } catch (err: any) {
      console.error("Error adding material:", err);
      throw new Error(err.message || "Failed to add material");
    }
  };

  const deleteMaterial = async (materialId: string) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    if (role !== "teacher" && role !== "admin") {
      throw new Error("Only teachers and admins can delete materials");
    }

    try {
      await deleteDoc(doc(db, "materials", materialId));

      // Remove from local state
      setMaterials((prev) => prev.filter((m) => m.id !== materialId));
    } catch (err: any) {
      console.error("Error deleting material:", err);
      throw new Error(err.message || "Failed to delete material");
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchMaterials(true);
    }
  };

  const refresh = async () => {
    setLastDoc(null);
    setHasMore(true);
    await fetchMaterials(false);
  };

  useEffect(() => {
    fetchMaterials(false);
  }, [courseInstanceId, searchQuery, typeFilter]);

  return {
    materials,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    addMaterial,
    deleteMaterial,
  };
}
