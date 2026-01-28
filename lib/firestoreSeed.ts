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
    department: "CS",
    semester: 5,
    section: "A",
    profileComplete: true,
    isActive: true,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "users", "teacher_1"), {
    uid: "teacher_1",
    role: "teacher",
    email: "prof01.cs@drait.edu.in",
    name: "Prof. Rajesh Kumar",
    department: "CS",
    teacherCode: "PROF01",
    profileComplete: true,
    isActive: true,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "users", "admin_1"), {
    uid: "admin_1",
    role: "admin",
    email: "admin@drait.edu.in",
    name: "College Admin",
    profileComplete: true,
    isActive: true,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "users", "parent_1"), {
    uid: "parent_1",
    role: "parent",
    email: "parent.arjun@gmail.com",
    name: "Ravi Kumar",
    linkedStudentId: "student_1",
    profileComplete: true,
    isActive: true,
    createdAt: serverTimestamp(),
  });

  /* ---------------- DEPARTMENTS ---------------- */

  await setDoc(doc(db, "departments", "cs"), {
    name: "Computer Science",
    code: "CS",
    isActive: true,
    createdAt: serverTimestamp(),
  });

  /* ---------------- COURSES (Base Definitions) ---------------- */

  // Semester 1 Courses
  await setDoc(doc(db, "courses", "cs101"), {
    courseCode: "21CS11",
    name: "Introduction to Programming",
    departmentId: "cs",
    semester: 1,
    credits: 4,
    isElective: false,
    metadata: {
      labRequired: true,
      examType: "theory-practical",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courses", "cs102"), {
    courseCode: "21CS12",
    name: "Engineering Mathematics - I",
    departmentId: "cs",
    semester: 1,
    credits: 4,
    isElective: false,
    metadata: {
      labRequired: false,
      examType: "theory",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courses", "cs103"), {
    courseCode: "21CS13",
    name: "Engineering Physics",
    departmentId: "cs",
    semester: 1,
    credits: 3,
    isElective: false,
    metadata: {
      labRequired: true,
      examType: "theory-practical",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  // Semester 2 Courses
  await setDoc(doc(db, "courses", "cs201"), {
    courseCode: "21CS21",
    name: "Data Structures",
    departmentId: "cs",
    semester: 2,
    credits: 4,
    isElective: false,
    metadata: {
      labRequired: true,
      examType: "theory-practical",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courses", "cs202"), {
    courseCode: "21CS22",
    name: "Engineering Mathematics - II",
    departmentId: "cs",
    semester: 2,
    credits: 4,
    isElective: false,
    metadata: {
      labRequired: false,
      examType: "theory",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courses", "cs203"), {
    courseCode: "21CS23",
    name: "Digital Electronics",
    departmentId: "cs",
    semester: 2,
    credits: 3,
    isElective: false,
    metadata: {
      labRequired: true,
      examType: "theory-practical",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  // Semester 3 Courses
  await setDoc(doc(db, "courses", "cs301"), {
    courseCode: "21CS31",
    name: "Object Oriented Programming",
    departmentId: "cs",
    semester: 3,
    credits: 4,
    isElective: false,
    metadata: {
      labRequired: true,
      examType: "theory-practical",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courses", "cs302"), {
    courseCode: "21CS32",
    name: "Computer Organization",
    departmentId: "cs",
    semester: 3,
    credits: 4,
    isElective: false,
    metadata: {
      labRequired: false,
      examType: "theory",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courses", "cs303"), {
    courseCode: "21CS33",
    name: "Discrete Mathematics",
    departmentId: "cs",
    semester: 3,
    credits: 3,
    isElective: false,
    metadata: {
      labRequired: false,
      examType: "theory",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  // Semester 4 Courses
  await setDoc(doc(db, "courses", "cs401"), {
    courseCode: "21CS41",
    name: "Design and Analysis of Algorithms",
    departmentId: "cs",
    semester: 4,
    credits: 4,
    isElective: false,
    metadata: {
      labRequired: true,
      examType: "theory-practical",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courses", "cs402"), {
    courseCode: "21CS42",
    name: "Operating Systems",
    departmentId: "cs",
    semester: 4,
    credits: 4,
    isElective: false,
    metadata: {
      labRequired: true,
      examType: "theory-practical",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courses", "cs403"), {
    courseCode: "21CS43",
    name: "Microcontrollers and Embedded Systems",
    departmentId: "cs",
    semester: 4,
    credits: 3,
    isElective: false,
    metadata: {
      labRequired: true,
      examType: "theory-practical",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  // Semester 5 Courses
  await setDoc(doc(db, "courses", "cs501"), {
    courseCode: "21CS51",
    name: "Database Management Systems",
    departmentId: "cs",
    semester: 5,
    credits: 4,
    isElective: false,
    metadata: {
      labRequired: true,
      examType: "theory-practical",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courses", "cs502"), {
    courseCode: "21CS52",
    name: "Computer Networks",
    departmentId: "cs",
    semester: 5,
    credits: 4,
    isElective: false,
    metadata: {
      labRequired: true,
      examType: "theory-practical",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courses", "cs503"), {
    courseCode: "21CS53",
    name: "Software Engineering",
    departmentId: "cs",
    semester: 5,
    credits: 3,
    isElective: false,
    metadata: {
      labRequired: false,
      examType: "theory",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courses", "cs5e1"), {
    courseCode: "21CS5E1",
    name: "Machine Learning",
    departmentId: "cs",
    semester: 5,
    credits: 3,
    isElective: true,
    metadata: {
      labRequired: true,
      examType: "theory-practical",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  // Semester 6 Courses
  await setDoc(doc(db, "courses", "cs601"), {
    courseCode: "21CS61",
    name: "Web Technologies",
    departmentId: "cs",
    semester: 6,
    credits: 4,
    isElective: false,
    metadata: {
      labRequired: true,
      examType: "theory-practical",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courses", "cs602"), {
    courseCode: "21CS62",
    name: "Theory of Computation",
    departmentId: "cs",
    semester: 6,
    credits: 4,
    isElective: false,
    metadata: {
      labRequired: false,
      examType: "theory",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courses", "cs603"), {
    courseCode: "21CS63",
    name: "Mobile Application Development",
    departmentId: "cs",
    semester: 6,
    credits: 3,
    isElective: false,
    metadata: {
      labRequired: true,
      examType: "theory-practical",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courses", "cs6e1"), {
    courseCode: "21CS6E1",
    name: "Cloud Computing",
    departmentId: "cs",
    semester: 6,
    credits: 3,
    isElective: true,
    metadata: {
      labRequired: true,
      examType: "theory-practical",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  // Semester 7 Courses
  await setDoc(doc(db, "courses", "cs701"), {
    courseCode: "21CS71",
    name: "Artificial Intelligence",
    departmentId: "cs",
    semester: 7,
    credits: 4,
    isElective: false,
    metadata: {
      labRequired: true,
      examType: "theory-practical",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courses", "cs702"), {
    courseCode: "21CS72",
    name: "Compiler Design",
    departmentId: "cs",
    semester: 7,
    credits: 4,
    isElective: false,
    metadata: {
      labRequired: true,
      examType: "theory-practical",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courses", "cs703"), {
    courseCode: "21CS73",
    name: "Information Security",
    departmentId: "cs",
    semester: 7,
    credits: 3,
    isElective: false,
    metadata: {
      labRequired: false,
      examType: "theory",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courses", "cs7e1"), {
    courseCode: "21CS7E1",
    name: "Big Data Analytics",
    departmentId: "cs",
    semester: 7,
    credits: 3,
    isElective: true,
    metadata: {
      labRequired: true,
      examType: "theory-practical",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  // Semester 8 Courses
  await setDoc(doc(db, "courses", "cs801"), {
    courseCode: "21CS81",
    name: "Project Work",
    departmentId: "cs",
    semester: 8,
    credits: 10,
    isElective: false,
    metadata: {
      labRequired: false,
      examType: "project",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courses", "cs802"), {
    courseCode: "21CS82",
    name: "Internship",
    departmentId: "cs",
    semester: 8,
    credits: 4,
    isElective: false,
    metadata: {
      labRequired: false,
      examType: "evaluation",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courses", "cs8e1"), {
    courseCode: "21CS8E1",
    name: "Blockchain Technology",
    departmentId: "cs",
    semester: 8,
    credits: 3,
    isElective: true,
    metadata: {
      labRequired: false,
      examType: "theory",
    },
    createdBy: "admin_1",
    createdAt: serverTimestamp(),
  });

  /* ---------------- COURSE INSTANCES (Active Courses) ---------------- */

  // Semester 5 Course Instances (Current semester for student_1)
  await setDoc(doc(db, "courseInstances", "cs501_sem5_secA"), {
    courseId: "cs501",
    departmentId: "cs",
    semester: 5,
    section: "A",
    teacherIds: ["teacher_1"],
    enrollmentType: "mandatory",
    isActive: true,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courseInstances", "cs502_sem5_secA"), {
    courseId: "cs502",
    departmentId: "cs",
    semester: 5,
    section: "A",
    teacherIds: ["teacher_1"],
    enrollmentType: "mandatory",
    isActive: true,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courseInstances", "cs503_sem5_secA"), {
    courseId: "cs503",
    departmentId: "cs",
    semester: 5,
    section: "A",
    teacherIds: ["teacher_1"],
    enrollmentType: "mandatory",
    isActive: true,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courseInstances", "cs5e1_sem5_secA"), {
    courseId: "cs5e1",
    departmentId: "cs",
    semester: 5,
    section: "A",
    teacherIds: ["teacher_1"],
    enrollmentType: "elective",
    isActive: true,
    createdAt: serverTimestamp(),
  });

  /* ---------------- ENROLLMENTS (Student: 1da22cs021.cs@drait.edu.in) ---------------- */

  await setDoc(doc(db, "enrollments", "enroll_student1_cs501"), {
    studentId: "student_1",
    courseInstanceId: "cs501_sem5_secA",
    type: "mandatory",
    enrolledAt: serverTimestamp(),
  });

  await setDoc(doc(db, "enrollments", "enroll_student1_cs502"), {
    studentId: "student_1",
    courseInstanceId: "cs502_sem5_secA",
    type: "mandatory",
    enrolledAt: serverTimestamp(),
  });

  await setDoc(doc(db, "enrollments", "enroll_student1_cs503"), {
    studentId: "student_1",
    courseInstanceId: "cs503_sem5_secA",
    type: "mandatory",
    enrolledAt: serverTimestamp(),
  });

  await setDoc(doc(db, "enrollments", "enroll_student1_cs5e1"), {
    studentId: "student_1",
    courseInstanceId: "cs5e1_sem5_secA",
    type: "elective",
    enrolledAt: serverTimestamp(),
  });

  /* ---------------- SAMPLE MATERIALS ---------------- */

  await setDoc(doc(db, "materials", "mat_cs501_1"), {
    courseInstanceId: "cs501_sem5_secA",
    title: "Introduction to DBMS - Lecture Notes",
    type: "pdf",
    url: "https://example.com/dbms-intro.pdf",
    description: "Comprehensive notes covering database fundamentals",
    uploadedBy: "teacher_1",
    fileSize: "2.5 MB",
    uploadedAt: serverTimestamp(),
  });

  await setDoc(doc(db, "materials", "mat_cs501_2"), {
    courseInstanceId: "cs501_sem5_secA",
    title: "SQL Tutorial Video",
    type: "video",
    url: "https://youtube.com/watch?v=example",
    description: "Complete SQL tutorial for beginners",
    uploadedBy: "teacher_1",
    uploadedAt: serverTimestamp(),
  });

  await setDoc(doc(db, "materials", "mat_cs502_1"), {
    courseInstanceId: "cs502_sem5_secA",
    title: "Computer Networks - OSI Model",
    type: "pdf",
    url: "https://example.com/networks-osi.pdf",
    description: "Detailed explanation of OSI 7-layer model",
    uploadedBy: "teacher_1",
    fileSize: "1.8 MB",
    uploadedAt: serverTimestamp(),
  });

  await setDoc(doc(db, "materials", "mat_cs503_1"), {
    courseInstanceId: "cs503_sem5_secA",
    title: "Software Engineering Best Practices",
    type: "document",
    url: "https://docs.google.com/document/example",
    description: "Industry best practices for software development",
    uploadedBy: "teacher_1",
    uploadedAt: serverTimestamp(),
  });

  await setDoc(doc(db, "materials", "mat_cs5e1_1"), {
    courseInstanceId: "cs5e1_sem5_secA",
    title: "Machine Learning Fundamentals",
    type: "pdf",
    url: "https://example.com/ml-fundamentals.pdf",
    description: "Introduction to ML algorithms and concepts",
    uploadedBy: "teacher_1",
    fileSize: "3.2 MB",
    uploadedAt: serverTimestamp(),
  });

  /* ---------------- SAMPLE ASSIGNMENTS ---------------- */

  await setDoc(doc(db, "assignments", "assign_cs501_1"), {
    courseInstanceId: "cs501_sem5_secA",
    title: "SQL Queries Assignment",
    description:
      "Practice SQL queries on the given database schema. Submit your .sql file with queries for joins, subqueries, and aggregations.",
    dueDate: new Date("2024-02-15T23:59:00Z"),
    maxScore: 20,
    createdBy: "teacher_1",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "assignments", "assign_cs501_2"), {
    courseInstanceId: "cs501_sem5_secA",
    title: "Database Design Project",
    description:
      "Design a complete database for a library management system. Include ER diagram and normalized schema.",
    dueDate: new Date("2024-03-01T23:59:00Z"),
    maxScore: 30,
    attachmentUrl: "https://example.com/assignment-guidelines.pdf",
    createdBy: "teacher_1",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "assignments", "assign_cs502_1"), {
    courseInstanceId: "cs502_sem5_secA",
    title: "Network Protocols Analysis",
    description:
      "Analyze HTTP, TCP, and UDP protocols. Write a detailed report comparing their features and use cases.",
    dueDate: new Date("2024-02-20T23:59:00Z"),
    maxScore: 25,
    createdBy: "teacher_1",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "assignments", "assign_cs503_1"), {
    courseInstanceId: "cs503_sem5_secA",
    title: "Software Requirements Specification",
    description:
      "Create an SRS document for a mobile banking application following IEEE standards.",
    dueDate: new Date("2024-02-25T23:59:00Z"),
    maxScore: 20,
    createdBy: "teacher_1",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "assignments", "assign_cs5e1_1"), {
    courseInstanceId: "cs5e1_sem5_secA",
    title: "Linear Regression Implementation",
    description:
      "Implement linear regression from scratch using Python. Submit Jupyter notebook with analysis.",
    dueDate: new Date("2024-02-28T23:59:00Z"),
    maxScore: 25,
    createdBy: "teacher_1",
    createdAt: serverTimestamp(),
  });

  /* ---------------- SAMPLE MARKS ---------------- */

  await setDoc(doc(db, "marks", "marks_student1_cs501"), {
    courseInstanceId: "cs501_sem5_secA",
    studentId: "student_1",
    cie1: 18,
    cie2: 19,
    assignment: 18,
    finalExam: 45,
    total: 100,
    grade: "A+",
    updatedBy: "teacher_1",
    updatedAt: serverTimestamp(),
  });

  await setDoc(doc(db, "marks", "marks_student1_cs502"), {
    courseInstanceId: "cs502_sem5_secA",
    studentId: "student_1",
    cie1: 17,
    cie2: 18,
    assignment: 16,
    finalExam: 42,
    total: 93,
    grade: "A+",
    updatedBy: "teacher_1",
    updatedAt: serverTimestamp(),
  });

  await setDoc(doc(db, "marks", "marks_student1_cs503"), {
    courseInstanceId: "cs503_sem5_secA",
    studentId: "student_1",
    cie1: 19,
    cie2: 20,
    assignment: 19,
    finalExam: 48,
    total: 106,
    grade: "A+",
    updatedBy: "teacher_1",
    updatedAt: serverTimestamp(),
  });

  await setDoc(doc(db, "marks", "marks_student1_cs5e1"), {
    courseInstanceId: "cs5e1_sem5_secA",
    studentId: "student_1",
    cie1: 16,
    cie2: 17,
    assignment: 20,
    finalExam: 40,
    total: 93,
    grade: "A",
    updatedBy: "teacher_1",
    updatedAt: serverTimestamp(),
  });

  /* ---------------- SAMPLE ATTENDANCE SESSIONS ---------------- */

  await setDoc(doc(db, "attendanceSessions", "session_cs501_1"), {
    eventId: "event_cs501_class1",
    courseInstanceId: "cs501_sem5_secA",
    startedBy: "teacher_1",
    startedAt: new Date("2024-01-15T09:00:00Z"),
    endedAt: new Date("2024-01-15T10:00:00Z"),
    isLocked: true,
  });

  await setDoc(doc(db, "attendanceSessions", "session_cs501_2"), {
    eventId: "event_cs501_class2",
    courseInstanceId: "cs501_sem5_secA",
    startedBy: "teacher_1",
    startedAt: new Date("2024-01-18T09:00:00Z"),
    endedAt: new Date("2024-01-18T10:00:00Z"),
    isLocked: true,
  });

  /* ---------------- SAMPLE ATTENDANCE RECORDS ---------------- */

  await setDoc(doc(db, "attendanceRecords", "record_student1_session1"), {
    sessionId: "session_cs501_1",
    studentId: "student_1",
    status: "present",
    markedBy: "teacher_1",
    markedAt: new Date("2024-01-15T09:05:00Z"),
  });

  await setDoc(doc(db, "attendanceRecords", "record_student1_session2"), {
    sessionId: "session_cs501_2",
    studentId: "student_1",
    status: "present",
    markedBy: "teacher_1",
    markedAt: new Date("2024-01-18T09:05:00Z"),
  });

  /* ---------------- SAMPLE DISCUSSIONS ---------------- */

  await setDoc(doc(db, "discussions", "disc_cs501_1"), {
    courseInstanceId: "cs501_sem5_secA",
    createdBy: "student_1",
    content:
      "Can someone explain the difference between BCNF and 3NF normalization?",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "discussionReplies", "reply_disc1_1"), {
    threadId: "disc_cs501_1",
    createdBy: "teacher_1",
    content:
      "BCNF is a stricter form of 3NF. In 3NF, we allow some transitive dependencies, but BCNF doesn't. I'll explain this in detail in tomorrow's class.",
    createdAt: serverTimestamp(),
  });

  console.log("✅ Firestore seeded successfully with CS courses!");
  console.log("📚 Added courses for semesters 1-8");
  console.log("👨‍🎓 Enrolled student: 1da22cs021.cs@drait.edu.in (Semester 5)");
  console.log(
    "👨‍🏫 Assigned teacher: prof01.cs@drait.edu.in to all Sem 5 courses",
  );
  /* ---------------- COURSE INSTANCES (Semester 5 - Current) ---------------- */

  await setDoc(doc(db, "courseInstances", "cs501_sem5_secA"), {
    courseId: "cs501",
    departmentId: "cs",
    semester: 5,
    section: "A",
    teacherIds: ["teacher_1"],
    enrollmentType: "mandatory",
    isActive: true,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courseInstances", "cs502_sem5_secA"), {
    courseId: "cs502",
    departmentId: "cs",
    semester: 5,
    section: "A",
    teacherIds: ["teacher_1"],
    enrollmentType: "mandatory",
    isActive: true,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courseInstances", "cs503_sem5_secA"), {
    courseId: "cs503",
    departmentId: "cs",
    semester: 5,
    section: "A",
    teacherIds: ["teacher_1"],
    enrollmentType: "mandatory",
    isActive: true,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courseInstances", "cs5e1_sem5_secA"), {
    courseId: "cs5e1",
    departmentId: "cs",
    semester: 5,
    section: "A",
    teacherIds: ["teacher_1"],
    enrollmentType: "elective",
    isActive: true,
    createdAt: serverTimestamp(),
  });

  /* ---------------- ENROLLMENTS (Student: 1da22cs021.cs) ---------------- */

  await setDoc(doc(db, "enrollments", "enroll_student1_cs501"), {
    studentId: "student_1",
    courseInstanceId: "cs501_sem5_secA",
    type: "mandatory",
    enrolledAt: serverTimestamp(),
  });

  await setDoc(doc(db, "enrollments", "enroll_student1_cs502"), {
    studentId: "student_1",
    courseInstanceId: "cs502_sem5_secA",
    type: "mandatory",
    enrolledAt: serverTimestamp(),
  });

  await setDoc(doc(db, "enrollments", "enroll_student1_cs503"), {
    studentId: "student_1",
    courseInstanceId: "cs503_sem5_secA",
    type: "mandatory",
    enrolledAt: serverTimestamp(),
  });

  await setDoc(doc(db, "enrollments", "enroll_student1_cs5e1"), {
    studentId: "student_1",
    courseInstanceId: "cs5e1_sem5_secA",
    type: "elective",
    enrolledAt: serverTimestamp(),
  });

  /* ---------------- SAMPLE MATERIALS ---------------- */

  await setDoc(doc(db, "materials", "mat_cs501_1"), {
    courseInstanceId: "cs501_sem5_secA",
    title: "Introduction to DBMS - Lecture Notes",
    type: "pdf",
    url: "https://example.com/dbms-intro.pdf",
    description: "Comprehensive notes covering database fundamentals",
    uploadedBy: "teacher_1",
    fileSize: "2.5 MB",
    uploadedAt: serverTimestamp(),
  });

  await setDoc(doc(db, "materials", "mat_cs502_1"), {
    courseInstanceId: "cs502_sem5_secA",
    title: "Computer Networks - OSI Model",
    type: "pdf",
    url: "https://example.com/networks-osi.pdf",
    description: "Detailed explanation of OSI 7-layer model",
    uploadedBy: "teacher_1",
    fileSize: "1.8 MB",
    uploadedAt: serverTimestamp(),
  });

  /* ---------------- SAMPLE ASSIGNMENTS ---------------- */

  await setDoc(doc(db, "assignments", "assign_cs501_1"), {
    courseInstanceId: "cs501_sem5_secA",
    title: "SQL Queries Assignment",
    description:
      "Practice SQL queries on the given database schema. Submit your .sql file.",
    dueDate: new Date("2024-02-15T23:59:00Z"),
    maxScore: 20,
    createdBy: "teacher_1",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "assignments", "assign_cs502_1"), {
    courseInstanceId: "cs502_sem5_secA",
    title: "Network Protocols Analysis",
    description:
      "Analyze HTTP, TCP, and UDP protocols. Write a detailed report.",
    dueDate: new Date("2024-02-20T23:59:00Z"),
    maxScore: 25,
    createdBy: "teacher_1",
    createdAt: serverTimestamp(),
  });

  /* ---------------- SAMPLE MARKS ---------------- */

  await setDoc(doc(db, "marks", "marks_student1_cs501"), {
    courseInstanceId: "cs501_sem5_secA",
    studentId: "student_1",
    cie1: 18,
    cie2: 19,
    assignment: 18,
    finalExam: 45,
    total: 100,
    grade: "A+",
    updatedBy: "teacher_1",
    updatedAt: serverTimestamp(),
  });

  console.log("✅ Firestore seeded successfully with CS courses!");
}
