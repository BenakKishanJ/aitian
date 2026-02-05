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
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import type {
  Assignment,
  AssignmentWithStatus,
  Submission,
  AssignmentFilterOptions,
  AssignmentStatus,
  ParentUserData,
} from "@/types";

export type { Assignment, AssignmentWithStatus, Submission, AssignmentStatus };

export interface UseAssignmentsOptions extends Omit<AssignmentFilterOptions, 'status'> {
  courseInstanceId: string;
  status?: AssignmentStatus | 'all' | null;
  pageSize?: number;
}

export function useAssignments(options: UseAssignmentsOptions) {
  const { user, userData, role } = useAuth();
  const {
    courseInstanceId,
    searchQuery,
    status,
    pageSize = 20,
  } = options;

  const [assignments, setAssignments] = useState<AssignmentWithStatus[]>([]);
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
        limit(pageSize),
      );

      if (loadMore && lastDoc) {
        assignmentsQuery = query(
          assignmentsRef,
          where("courseInstanceId", "==", courseInstanceId),
          orderBy("dueDate", "desc"),
          startAfter(lastDoc),
          limit(pageSize),
        );
      }

      const assignmentsSnap = await getDocs(assignmentsQuery);
      const fetchedAssignments = assignmentsSnap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as AssignmentWithStatus,
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
            where("studentId", "==", user.uid),
          );
          const submissionSnap = await getDocs(submissionQuery);

          if (submissionSnap.empty) {
            // Check if overdue
            const dueDate = assignment.dueDate instanceof Timestamp
              ? assignment.dueDate.toDate()
              : new Date(assignment.dueDate);
            const now = new Date();
            assignment.submissionStatus = now > dueDate ? "overdue" : "pending";
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
        if (role === "parent" && userData) {
          const parentData = userData as ParentUserData;
            if (parentData.linkedStudentId) {
            const submissionsRef = collection(db, "submissions");
            const submissionQuery = query(
              submissionsRef,
              where("assignmentId", "==", assignment.id),
              where("studentId", "==", parentData.linkedStudentId),
            );
            const submissionSnap = await getDocs(submissionQuery);

            if (submissionSnap.empty) {
              const dueDate = assignment.dueDate instanceof Timestamp
                ? assignment.dueDate.toDate()
                : new Date(assignment.dueDate);
              const now = new Date();
              assignment.submissionStatus = now > dueDate ? "overdue" : "pending";
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
      }

      // Apply search filter
      let filteredAssignments = fetchedAssignments;
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredAssignments = fetchedAssignments.filter(
          (assignment) =>
            assignment.title.toLowerCase().includes(query) ||
            assignment.description.toLowerCase().includes(query),
        );
      }

      // Apply status filter
      if (status && status !== "all" && role === "student") {
        filteredAssignments = filteredAssignments.filter(
          (assignment) => assignment.submissionStatus === status as AssignmentWithStatus['submissionStatus'],
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

      // Automatically create a calendar event for the assignment deadline
      try {
        // Get course instance details for the course name
        const courseInstanceDoc = await getDoc(
          doc(db, "courseInstances", courseInstanceId),
        );
        const courseName = courseInstanceDoc.exists()
          ? courseInstanceDoc.data()?.courseName || "Course"
          : "Course";

        // Create calendar event at the due date/time
        const eventStartTime = Timestamp.fromDate(assignmentData.dueDate);
        const eventEndTime = Timestamp.fromDate(
          new Date(assignmentData.dueDate.getTime() + 60 * 60 * 1000), // +1 hour
        );

        await addDoc(collection(db, "calendarEvents"), {
          title: `${assignmentData.title} - Due`,
          type: "assignment",
          courseInstanceId: courseInstanceId,
          courseName: courseName,
          createdBy: user.uid,
          startTime: eventStartTime,
          endTime: eventEndTime,
          isAttendanceEnabled: false,
          createdAt: serverTimestamp(),
        });
      } catch (calendarError) {
        console.error(
          "Error creating calendar event for assignment:",
          calendarError,
        );
        // Don't fail the assignment creation if calendar event fails
      }

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
      // Get assignment to find related calendar events
      const assignmentDoc = await getDoc(doc(db, "assignments", assignmentId));
      const assignmentData = assignmentDoc.data();

      // Delete assignment
      await deleteDoc(doc(db, "assignments", assignmentId));

      // Delete all submissions
      const submissionsRef = collection(db, "submissions");
      const submissionsQuery = query(
        submissionsRef,
        where("assignmentId", "==", assignmentId),
      );
      const submissionsSnap = await getDocs(submissionsQuery);

      const deletePromises = submissionsSnap.docs.map((doc) =>
        deleteDoc(doc.ref),
      );
      await Promise.all(deletePromises);

      // Delete related calendar events (assignment type events for this course instance)
      if (assignmentData) {
        try {
          const calendarEventsRef = collection(db, "calendarEvents");
          const calendarQuery = query(
            calendarEventsRef,
            where("type", "==", "assignment"),
            where("courseInstanceId", "==", assignmentData.courseInstanceId),
          );
          const calendarSnap = await getDocs(calendarQuery);

          // Find events that match the assignment title
          const eventsToDelete = calendarSnap.docs.filter((doc) => {
            const eventData = doc.data();
            return eventData.title?.includes(assignmentData.title);
          });

          const deleteCalendarPromises = eventsToDelete.map((doc) =>
            deleteDoc(doc.ref),
          );
          await Promise.all(deleteCalendarPromises);
        } catch (calendarError) {
          console.error("Error deleting calendar events:", calendarError);
          // Don't fail the assignment deletion if calendar deletion fails
        }
      }

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
    },
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
    feedback?: string,
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
  }, [courseInstanceId, searchQuery, status]);

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
