import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * WARNING:
 * This is DEV ONLY. Do NOT ship to production.
 */
export async function seedFirestore() {
  /* ---------------- USERS ---------------- */

  await setDoc(doc(db, "users", "student_1"), {
    uid: "student_1",
    role: "student",
    email: "1da22cs021.cs@drait.edu.in",
    name: "Arjun Kumar",
    usn: "1DA22CS021",
    department: "CSE",
    semester: 5,
    section: "A",
    courseIds: ["cs501", "cs502", "cs503", "cs5e1"],
    linkedParentIds: ["parent_1"],
    status: "active",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "users", "teacher_1"), {
    uid: "teacher_1",
    role: "teacher",
    email: "samsmith.ec@drait.edu.in",
    name: "Sam Smith",
    department: "CSE",
    approvedCourseIds: ["cs501", "cs503"],
    pendingCourseIds: [],
    status: "approved",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "users", "admin_1"), {
    uid: "admin_1",
    role: "admin",
    email: "admin@drait.edu.in",
    name: "College Admin",
    status: "active",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "users", "parent_1"), {
    uid: "parent_1",
    role: "parent",
    email: "parent.arjun@gmail.com",
    name: "Ravi Kumar",
    linkedStudentIds: ["student_1"],
    status: "active",
    createdAt: serverTimestamp(),
  });

  /* ---------------- COURSES ---------------- */

  await setDoc(doc(db, "courses", "cs501"), {
    courseId: "cs501",
    name: "Database Management Systems",
    code: "21CS51",
    department: "CSE",
    semester: 5,
    sections: ["A", "B"],
    isElective: false,
    teacherIds: ["teacher_1"],
    credits: 4,
    status: "active",
  });

  await setDoc(doc(db, "courses", "cs5e1"), {
    courseId: "cs5e1",
    name: "Machine Learning",
    code: "21CS5E1",
    department: "CSE",
    semester: 5,
    sections: [],
    isElective: true,
    teacherIds: [],
    credits: 3,
    status: "active",
  });

  /* ---------------- COURSE ENROLLMENTS ---------------- */

  await setDoc(doc(db, "courseEnrollments", "student_1_cs501"), {
    enrollmentId: "student_1_cs501",
    studentId: "student_1",
    courseId: "cs501",
    semester: 5,
    section: "A",
    attendance: {
      totalClasses: 42,
      attendedClasses: 38,
      lastUpdated: serverTimestamp(),
    },
    marks: {
      cie1: 18,
      cie2: 20,
      assignment: 17,
      finalExam: 0,
      total: 55,
    },
    status: "active",
  });

  /* ---------------- EVENTS ---------------- */

  await setDoc(doc(db, "events", "event_1"), {
    eventId: "event_1",
    type: "class",
    courseId: "cs501",
    section: "A",
    title: "DBMS Lecture",
    startTime: new Date("2026-01-24T09:00:00Z"),
    endTime: new Date("2026-01-24T10:00:00Z"),
    repeat: "weekly",
    createdBy: "teacher_1",
  });

  /* ---------------- ATTENDANCE SESSION ---------------- */

  await setDoc(
    doc(db, "attendanceSessions", "att_2026_01_24_cs501_A"),
    {
      sessionId: "att_2026_01_24_cs501_A",
      courseId: "cs501",
      section: "A",
      semester: 5,
      date: "2026-01-24",
      startTime: "09:00",
      endTime: "10:00",
      startedBy: "teacher_1",
      status: "closed",
      presentStudentIds: ["student_1"],
      absentStudentIds: [],
      createdAt: serverTimestamp(),
    }
  );
}
