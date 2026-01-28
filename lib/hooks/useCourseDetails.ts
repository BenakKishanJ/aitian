import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Course, CourseInstance } from "./useCourses";

export interface CourseDetails extends CourseInstance {
  course: Course;
  teacherNames: string[];
}

export function useCourseDetails(courseInstanceId: string) {
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourseDetails = async () => {
    if (!courseInstanceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch course instance
      const instanceDoc = await getDoc(
        doc(db, "courseInstances", courseInstanceId)
      );

      if (!instanceDoc.exists()) {
        setError("Course not found");
        setLoading(false);
        return;
      }

      const instanceData = {
        id: instanceDoc.id,
        ...instanceDoc.data(),
      } as CourseInstance;

      // Fetch course details
      const courseDoc = await getDoc(doc(db, "courses", instanceData.courseId));

      if (!courseDoc.exists()) {
        setError("Course details not found");
        setLoading(false);
        return;
      }

      const courseData = {
        id: courseDoc.id,
        ...courseDoc.data(),
      } as Course;

      // Fetch teacher names
      const teacherNames: string[] = [];
      if (instanceData.teacherIds && instanceData.teacherIds.length > 0) {
        for (const teacherId of instanceData.teacherIds) {
          try {
            const teacherDoc = await getDoc(doc(db, "users", teacherId));
            if (teacherDoc.exists()) {
              teacherNames.push(teacherDoc.data().name || "Unknown");
            }
          } catch (err) {
            console.error("Error fetching teacher:", err);
            teacherNames.push("Unknown");
          }
        }
      }

      setCourseDetails({
        ...instanceData,
        course: courseData,
        teacherNames,
      });

      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching course details:", err);
      setError(err.message || "Failed to fetch course details");
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchCourseDetails();
  };

  useEffect(() => {
    fetchCourseDetails();
  }, [courseInstanceId]);

  return {
    courseDetails,
    loading,
    error,
    refresh,
  };
}
