import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  COLLECTIONS,
  ENROLLMENT_STATUSES,
  EnrollmentType,
  StudentUserData,
  CourseInstance,
  Course,
  Enrollment,
} from '@/types';

/**
 * Auto-enroll a student to all non-elective courses for their department and semester
 * Called during student registration
 */
export async function autoEnrollStudentToCourses(
  studentId: string,
  departmentId: string,
  semester: number,
  section: string
): Promise<{ success: boolean; enrolledCount: number; error?: string }> {
  try {
    // Find all active course instances for student's department, semester, and section
    const instancesRef = collection(db, COLLECTIONS.COURSE_INSTANCES);
    const instancesQuery = query(
      instancesRef,
      where('departmentId', '==', departmentId),
      where('semester', '==', semester),
      where('section', '==', section),
      where('isActive', '==', true)
    );

    const instancesSnap = await getDocs(instancesQuery);
    const courseInstances: CourseInstance[] = [];
    const electiveInstances: CourseInstance[] = [];

    // Separate core and elective courses
    for (const docSnap of instancesSnap.docs) {
      const instance = { id: docSnap.id, ...docSnap.data() } as CourseInstance;
      
      // Get course details to check if it's elective
      const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, instance.courseId));
      if (courseDoc.exists()) {
        const course = { id: courseDoc.id, ...courseDoc.data() } as Course;
        
        if (course.isElective) {
          electiveInstances.push(instance);
        } else {
          courseInstances.push(instance);
        }
      }
    }

    // Create enrollments for core courses
    const batch = writeBatch(db);
    let enrolledCount = 0;

    for (const instance of courseInstances) {
      const enrollmentData = {
        studentId,
        courseInstanceId: instance.id,
        enrollmentType: 'core' as EnrollmentType,
        enrollmentStatus: ENROLLMENT_STATUSES.AUTO_ENROLLED,
        enrolledAt: Timestamp.now(),
      };

      const enrollmentRef = doc(collection(db, COLLECTIONS.ENROLLMENTS));
      batch.set(enrollmentRef, enrollmentData);
      enrolledCount++;
    }

    // Create pending elective enrollments
    for (const instance of electiveInstances) {
      const enrollmentData = {
        studentId,
        courseInstanceId: instance.id,
        enrollmentType: 'elective' as EnrollmentType,
        enrollmentStatus: ENROLLMENT_STATUSES.ELECTIVE_PENDING,
        enrolledAt: Timestamp.now(),
      };

      const enrollmentRef = doc(collection(db, COLLECTIONS.ENROLLMENTS));
      batch.set(enrollmentRef, enrollmentData);
      enrolledCount++;
    }

    await batch.commit();

    return {
      success: true,
      enrolledCount,
    };
  } catch (error: any) {
    console.error('Error auto-enrolling student:', error);
    return {
      success: false,
      enrolledCount: 0,
      error: error.message || 'Failed to enroll student in courses',
    };
  }
}

/**
 * Enroll a student to a specific elective course
 * Called when student selects an elective option
 */
export async function enrollInElectiveCourse(
  studentId: string,
  courseInstanceId: string,
  electiveGroupId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find the existing pending enrollment for this elective group or course
    const enrollmentsRef = collection(db, COLLECTIONS.ENROLLMENTS);
    let enrollmentQuery;

    if (electiveGroupId) {
      // If elective group ID provided, find enrollment by group
      enrollmentQuery = query(
        enrollmentsRef,
        where('studentId', '==', studentId),
        where('electiveGroupId', '==', electiveGroupId),
        where('enrollmentStatus', '==', ENROLLMENT_STATUSES.ELECTIVE_PENDING)
      );
    } else {
      // Otherwise find by course instance
      enrollmentQuery = query(
        enrollmentsRef,
        where('studentId', '==', studentId),
        where('courseInstanceId', '==', courseInstanceId),
        where('enrollmentStatus', '==', ENROLLMENT_STATUSES.ELECTIVE_PENDING)
      );
    }

    const enrollmentSnap = await getDocs(enrollmentQuery);

    if (enrollmentSnap.empty) {
      // No pending enrollment found, create a new one
      const enrollmentData = {
        studentId,
        courseInstanceId,
        enrollmentType: 'elective' as EnrollmentType,
        enrollmentStatus: ENROLLMENT_STATUSES.ELECTIVE_ENROLLED,
        electiveGroupId,
        enrolledAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(collection(db, COLLECTIONS.ENROLLMENTS), enrollmentData);
    } else {
      // Update existing enrollment(s) - mark all as enrolled
      const batch = writeBatch(db);
      enrollmentSnap.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, {
          courseInstanceId,
          enrollmentStatus: ENROLLMENT_STATUSES.ELECTIVE_ENROLLED,
          electiveGroupId,
          updatedAt: Timestamp.now(),
        });
      });
      await batch.commit();
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error enrolling in elective:', error);
    return {
      success: false,
      error: error.message || 'Failed to enroll in elective course',
    };
  }
}

/**
 * Check if all students in a semester have their SEE marks uploaded
 * If yes, auto-promote all students to the next semester
 */
export async function checkAndAutoPromoteStudents(
  departmentId: string,
  semester: number
): Promise<{ success: boolean; promotedCount: number; error?: string }> {
  try {
    // Get all students in the department and semester
    const studentsRef = collection(db, COLLECTIONS.USERS);
    const studentsQuery = query(
      studentsRef,
      where('role', '==', 'student'),
      where('departmentId', '==', departmentId),
      where('semester', '==', semester),
      where('isActive', '==', true)
    );

    const studentsSnap = await getDocs(studentsQuery);
    const students = studentsSnap.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    })) as unknown as StudentUserData[];

    if (students.length === 0) {
      return { success: true, promotedCount: 0 };
    }

    // Get all course instances for this semester
    const instancesRef = collection(db, COLLECTIONS.COURSE_INSTANCES);
    const instancesQuery = query(
      instancesRef,
      where('departmentId', '==', departmentId),
      where('semester', '==', semester),
      where('isActive', '==', true)
    );

    const instancesSnap = await getDocs(instancesQuery);
    const courseInstanceIds = instancesSnap.docs.map((doc) => doc.id);

    // Check if all students have marks for all courses
    const marksRef = collection(db, COLLECTIONS.MARKS);
    const studentsReadyForPromotion: string[] = [];

    for (const student of students) {
      let hasAllMarks = true;

      for (const instanceId of courseInstanceIds) {
        const marksQuery = query(
          marksRef,
          where('studentId', '==', student.uid),
          where('courseInstanceId', '==', instanceId)
        );

        const marksSnap = await getDocs(marksQuery);
        if (marksSnap.empty) {
          hasAllMarks = false;
          break;
        }

        // Check if SEE marks are uploaded
        const marks = marksSnap.docs[0].data();
        if (marks.see === undefined || marks.see === null) {
          hasAllMarks = false;
          break;
        }
      }

      if (hasAllMarks) {
        studentsReadyForPromotion.push(student.uid);
      }
    }

    // Promote students who have all marks
    const batch = writeBatch(db);
    let promotedCount = 0;

    for (const studentId of studentsReadyForPromotion) {
      const studentRef = doc(db, COLLECTIONS.USERS, studentId);
      const studentDoc = await getDoc(studentRef);

      if (studentDoc.exists()) {
        const currentSemester = studentDoc.data().semester;
        const newSemester = Math.min(currentSemester + 1, 8);

        batch.update(studentRef, {
          semester: newSemester,
          promotionStatus: 'promoted',
          lastPromotionDate: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        promotedCount++;

        // If promoted to new semester, auto-enroll in new courses
        if (newSemester > currentSemester) {
          // We'll handle this in a separate function to avoid complexity
          console.log(`Student ${studentId} promoted to semester ${newSemester}`);
        }
      }
    }

    await batch.commit();

    return {
      success: true,
      promotedCount,
    };
  } catch (error: any) {
    console.error('Error auto-promoting students:', error);
    return {
      success: false,
      promotedCount: 0,
      error: error.message || 'Failed to promote students',
    };
  }
}

/**
 * Get enrollment status for a student's course
 */
export async function getStudentEnrollmentStatus(
  studentId: string,
  courseInstanceId: string
): Promise<Enrollment | null> {
  try {
    const enrollmentsRef = collection(db, COLLECTIONS.ENROLLMENTS);
    const enrollmentQuery = query(
      enrollmentsRef,
      where('studentId', '==', studentId),
      where('courseInstanceId', '==', courseInstanceId)
    );

    const enrollmentSnap = await getDocs(enrollmentQuery);

    if (enrollmentSnap.empty) {
      return null;
    }

    const doc = enrollmentSnap.docs[0];
    return { id: doc.id, ...doc.data() } as Enrollment;
  } catch (error) {
    console.error('Error getting enrollment status:', error);
    return null;
  }
}

/**
 * Get all enrollments for a student with their status
 */
export async function getStudentEnrollments(
  studentId: string
): Promise<Enrollment[]> {
  try {
    const enrollmentsRef = collection(db, COLLECTIONS.ENROLLMENTS);
    const enrollmentQuery = query(
      enrollmentsRef,
      where('studentId', '==', studentId)
    );

    const enrollmentSnap = await getDocs(enrollmentQuery);

    return enrollmentSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Enrollment[];
  } catch (error) {
    console.error('Error getting student enrollments:', error);
    return [];
  }
}

export default {
  autoEnrollStudentToCourses,
  enrollInElectiveCourse,
  checkAndAutoPromoteStudents,
  getStudentEnrollmentStatus,
  getStudentEnrollments,
};
