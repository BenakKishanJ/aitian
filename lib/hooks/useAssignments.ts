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
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

export interface Assignment {
  id: string;
  courseInstanceId: string;
  title: string;
  description: string;
  dueDate: any;
  maxScore?: number;
  attachmentUrl?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: any;
  // For students
  submissionStatus?: "pending" | "submitted" | "graded" | "overdue";
  submission?: Submission;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  submissionUrl?: string;
  submissionText?: string;
  submittedAt: any;
  grade?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: any;
}

export interface UseAssignmentsOptions {
  courseInstanceId: string;
  searchQuery?: string;
  statusFilter?: string | null;
  pageSize?: number;
}

export function useAssignments(options: UseAssignmentsOptions) {
  const { user, userData, role } = useAuth();
  const { courseInstanceId, searchQuery, statusFilter, pageSize = 20 } = options;

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);

  const fetchAssignments = async (loadMore = false) => {
    if (!courseInstanceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const assignmentsRef = collection(db, "assignments");
      let assignmentsQuery = query(
        assignmentsRef,
        where("courseInstanceId", "==", courseInstanceId),
        orderBy("dueDate", "desc"),
        limit(pageSize)
      );

      if (loadMore && lastDoc) {
        assignmentsQuery = query(
          assignmentsRef,
          where("courseInstanceId", "==", courseInstanceId),
          orderBy("dueDate", "desc"),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }

      const assignmentsSnap = await getDocs(assignmentsQuery);
      const fetchedAssignments = assignmentsSnap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Assignment)
      );

      // Fetch creator names
      for (const assignment of fetchedAssignments) {
        try {
          const userDoc = await getDoc(doc(db, "users", assignment.createdBy));
          if (userDoc.exists()) {
            assignment.createdByName = userDoc.data().name || "Unknown";
          }
        } catch (err) {
          console.error("Error fetching user:", err);
          assignment.createdByName = "Unknown";
        }

        // For students, fetch their submission status
        if (role === "student" && user) {
          const submissionsRef = collection(db, "submissions");
          const submissionQuery = query(
            submissionsRef,
            where("assignmentId", "==", assignment.id),
            where("studentId", "==", user.uid)
          );
          const submissionSnap = await getDocs(submissionQuery);

          if (submissionSnap.empty) {
            // Check if overdue
            const dueDate = assignment.dueDate?.toDate
              ? assignment.dueDate.toDate()
              : new Date(assignment.dueDate);
            const now = new Date();
            assignment.submissionStatus =
              now > dueDate ? "overdue" : "pending";
          } else {
            const submissionData = submissionSnap.docs[0].data();
            assignment.submission = {
              id: submissionSnap.docs[0].id,
              ...submissionData,
            } as Submission;

            if (submissionData.grade !== undefined) {
              assignment.submissionStatus = "graded";
            } else {
              assignment.submissionStatus = "submitted";
            }
          }
        }

        // For parents, fetch linked student's submission status
        if (role === "parent" && userData?.linkedStudentId) {
          const submissionsRef = collection(db, "submissions");
          const submissionQuery = query(
            submissionsRef,
            where("assignmentId", "==", assignment.id),
            where("studentId", "==", userData.linkedStudentId)
          );
          const submissionSnap = await getDocs(submissionQuery);

          if (submissionSnap.empty) {
            const dueDate = assignment.dueDate?.toDate
              ? assignment.dueDate.toDate()
              : new Date(assignment.dueDate);
            const now = new Date();
            assignment.submissionStatus =
              now > dueDate ? "overdue" : "pending";
          } else {
            const submissionData = submissionSnap.docs[0].data();
            assignment.submission = {
              id: submissionSnap.docs[0].id,
              ...submissionData,
            } as Submission;

            if (submissionData.grade !== undefined) {
              assignment.submissionStatus = "graded";
            } else {
              assignment.submissionStatus = "submitted";
            }
          }
        }
      }

      // Apply search filter
      let filteredAssignments = fetchedAssignments;
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredAssignments = fetchedAssignments.filter(
          (assignment) =>
            assignment.title.toLowerCase().includes(query) ||
            assignment.description.toLowerCase().includes(query)
        );
      }

      // Apply status filter
      if (statusFilter && statusFilter !== "all" && role === "student") {
        filteredAssignments = filteredAssignments.filter(
          (assignment) => assignment.submissionStatus === statusFilter
        );
      }

      if (loadMore) {
        setAssignments((prev) => [...prev, ...filteredAssignments]);
      } else {
        setAssignments(filteredAssignments);
      }

      if (assignmentsSnap.docs.length > 0) {
        setLastDoc(assignmentsSnap.docs[assignmentsSnap.docs.length - 1]);
      }
      setHasMore(assignmentsSnap.docs.length === pageSize);
      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching assignments:", err);
      setError(err.message || "Failed to fetch assignments");
      setLoading(false);
    }
  };

  const createAssignment = async (assignmentData: {
    title: string;
    description: string;
    dueDate: Date;
    maxScore?: number;
    attachmentUrl?: string;
  }) => {
    if (!user || !courseInstanceId) {
      throw new Error("User not authenticated or course not specified");
    }

    if (role !== "teacher" && role !== "admin") {
      throw new Error("Only teachers and admins can create assignments");
    }

    try {
      const newAssignment = {
        courseInstanceId,
        ...assignmentData,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "assignments"), newAssignment);
      await refresh();
      return docRef.id;
    } catch (err: any) {
      console.error("Error creating assignment:", err);
      throw new Error(err.message || "Failed to create assignment");
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    if (role !== "teacher" && role !== "admin") {
      throw new Error("Only teachers and admins can delete assignments");
    }

    try {
      // Delete assignment
      await deleteDoc(doc(db, "assignments", assignmentId));

      // Delete all submissions
      const submissionsRef = collection(db, "submissions");
      const submissionsQuery = query(
        submissionsRef,
        where("assignmentId", "==", assignmentId)
      );
      const submissionsSnap = await getDocs(submissionsQuery);

      const deletePromises = submissionsSnap.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      // Remove from local state
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    } catch (err: any) {
      console.error("Error deleting assignment:", err);
      throw new Error(err.message || "Failed to delete assignment");
    }
  };

  const submitAssignment = async (
    assignmentId: string,
    submissionData: {
      submissionUrl?: string;
      submissionText?: string;
    }
  ) => {
    if (!user || role !== "student") {
      throw new Error("Only students can submit assignments");
    }

    try {
      const newSubmission = {
        assignmentId,
        studentId: user.uid,
        ...submissionData,
        submittedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "submissions"), newSubmission);
      await refresh();
    } catch (err: any) {
      console.error("Error submitting assignment:", err);
      throw new Error(err.message || "Failed to submit assignment");
    }
  };

  const gradeSubmission = async (
    submissionId: string,
    grade: number,
    feedback?: string
  ) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    if (role !== "teacher" && role !== "admin") {
      throw new Error("Only teachers and admins can grade submissions");
    }

    try {
      await updateDoc(doc(db, "submissions", submissionId), {
        grade,
        feedback: feedback || "",
        gradedBy: user.uid,
        gradedAt: serverTimestamp(),
      });

      await refresh();
    } catch (err: any) {
      console.error("Error grading submission:", err);
      throw new Error(err.message || "Failed to grade submission");
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchAssignments(true);
    }
  };

  const refresh = async () => {
    setLastDoc(null);
    setHasMore(true);
    await fetchAssignments(false);
  };

  useEffect(() => {
    fetchAssignments(false);
  }, [courseInstanceId, searchQuery, statusFilter]);

  return {
    assignments,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    createAssignment,
    deleteAssignment,
    submitAssignment,
    gradeSubmission,
  };
}
