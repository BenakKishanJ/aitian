import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import type {
  Course,
  CourseInstance,
  CourseInstanceWithDetails,
  ElectiveSlot,
  ElectiveSlotMapping,
  ElectiveSelection,
  ElectiveSlotAssignment,
  StudentCourseView,
} from '@/types';
import { COLLECTIONS, DepartmentId, ELECTIVE_SLOT_TYPES } from '@/types/constants';

export interface UseStudentCoursesResult {
  courses: StudentCourseView[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useStudentCourses(): UseStudentCoursesResult {
  const { user, userData, role, authInitialized } = useAuth();
   
  const [courses, setCourses] = useState<StudentCourseView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
   
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);

  const fetchStudentCourses = useCallback(async () => {
    // Wait for auth to initialize
    if (!authInitialized) {
      return;
    }

    if (!user || !userData || role !== 'student') {
      setLoading(false);
      return;
    }

    // Get student profile data with runtime validation
    const studentData = userData as any;
    const studentDept = studentData.departmentId || studentData.department;
    const studentSem = studentData.semester;
    const studentSection = studentData.section;

    // Validate all required fields exist and have correct types
    if (!studentDept || typeof studentDept !== 'string') {
      setError('Student department missing or invalid');
      setLoading(false);
      return;
    }

    if (typeof studentSem !== 'number' || studentSem < 1 || studentSem > 8) {
      setError('Student semester missing or invalid');
      setLoading(false);
      return;
    }

    if (!studentSection || typeof studentSection !== 'string') {
      setError('Student section missing or invalid');
      setLoading(false);
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const currentRequestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError(null);

      const studentCourseViews: StudentCourseView[] = [];

      // Normalize values
      const normalizedSection = studentSection.toUpperCase();
      const normalizedDept = studentDept.toLowerCase();

      // ============================================
      // 1. FETCH CORE COURSES (Regular mandatory courses)
      // ============================================
      const coreInstancesRef = collection(db, COLLECTIONS.COURSE_INSTANCES);
      const coreQuery = query(
        coreInstancesRef,
        where('departmentId', '==', normalizedDept),
        where('semester', '==', studentSem),
        where('section', '==', normalizedSection),
        where('isActive', '==', true)
      );

      const coreSnap = await getDocs(coreQuery);
      const coreInstances: CourseInstanceWithDetails[] = [];

      coreSnap.docs.forEach((docSnap) => {
        const instance = { id: docSnap.id, ...docSnap.data() } as CourseInstanceWithDetails;
        coreInstances.push(instance);
      });

      // ============================================
      // 2. FETCH ELECTIVE SLOTS ASSIGNED TO THIS STUDENT
      // ============================================
      // Find assignments for this department/semester/section
      const assignmentsRef = collection(db, COLLECTIONS.ELECTIVE_SLOT_ASSIGNMENTS);
      const assignmentsQuery = query(
        assignmentsRef,
        where('departmentId', '==', normalizedDept),
        where('semester', '==', studentSem),
        where('sections', 'array-contains', normalizedSection),
        where('isActive', '==', true)
      );

      const assignmentsSnap = await getDocs(assignmentsQuery);
      const assignedSlotIds: string[] = [];

      assignmentsSnap.docs.forEach((docSnap) => {
        const assignment = docSnap.data() as ElectiveSlotAssignment;
        assignedSlotIds.push(assignment.slotId);
      });

      // Fetch the actual slot details
      const slots: ElectiveSlot[] = [];
      for (const slotId of assignedSlotIds) {
        const slotDoc = await getDoc(doc(db, COLLECTIONS.ELECTIVE_SLOTS, slotId));
        if (slotDoc.exists()) {
          slots.push({ id: slotDoc.id, ...slotDoc.data() } as ElectiveSlot);
        }
      }

      // ============================================
      // 3. FETCH STUDENT'S ELECTIVE SELECTIONS
      // ============================================
      const selectionsRef = collection(db, COLLECTIONS.ELECTIVE_SELECTIONS);
      const selectionsQuery = query(
        selectionsRef,
        where('studentId', '==', user.uid)
      );

      const selectionsSnap = await getDocs(selectionsQuery);
      const selectionsMap: { [slotId: string]: ElectiveSelection } = {};

      selectionsSnap.docs.forEach((docSnap) => {
        const selection = { id: docSnap.id, ...docSnap.data() } as ElectiveSelection;
        selectionsMap[selection.slotId] = selection;
      });

      // ============================================
      // 4. FETCH SLOT MAPPINGS (Available courses for each slot)
      // ============================================
      const slotMappingsMap: { [slotId: string]: string[] } = {}; // slotId -> courseIds

      for (const slot of slots) {
        const mappingsRef = collection(db, COLLECTIONS.ELECTIVE_SLOT_MAPPINGS);
        const mappingsQuery = query(
          mappingsRef,
          where('slotId', '==', slot.id)
        );
        const mappingsSnap = await getDocs(mappingsQuery);
        
        if (!mappingsSnap.empty) {
          const mapping = mappingsSnap.docs[0].data() as ElectiveSlotMapping;
          slotMappingsMap[slot.id] = mapping.availableCourseIds || [];
        }
      }

      // ============================================
      // 5. FETCH COURSE DETAILS FOR CORE COURSES
      // ============================================
      const coreCourseIds = [...new Set(coreInstances.map(inst => inst.courseId).filter(Boolean))];
      const courseData: { [id: string]: Course } = {};

      if (coreCourseIds.length > 0) {
        const courseBatches: Promise<QuerySnapshot<DocumentData>>[] = [];
        for (let i = 0; i < coreCourseIds.length; i += 10) {
          const batchIds = coreCourseIds.slice(i, i + 10);
          const coursesRef = collection(db, COLLECTIONS.COURSES);
          const coursesQuery = query(coursesRef, where('__name__', 'in', batchIds));
          courseBatches.push(getDocs(coursesQuery));
        }
        
        const courseResults = await Promise.all(courseBatches);
        courseResults.flatMap(snap => snap.docs).forEach(docSnap => {
          courseData[docSnap.id] = { id: docSnap.id, ...docSnap.data() } as Course;
        });
      }

      // ============================================
      // 6. FETCH TEACHER NAMES FOR CORE COURSES
      // ============================================
      const teacherIds = [...new Set(coreInstances.flatMap(inst => inst.teacherIds || []))];
      const teacherData: { [id: string]: string } = {};

      if (teacherIds.length > 0) {
        const teacherBatches: Promise<QuerySnapshot<DocumentData>>[] = [];
        for (let i = 0; i < teacherIds.length; i += 10) {
          const batchIds = teacherIds.slice(i, i + 10);
          const usersRef = collection(db, COLLECTIONS.USERS);
          const usersQuery = query(usersRef, where('__name__', 'in', batchIds));
          teacherBatches.push(getDocs(usersQuery));
        }
        
        const teacherResults = await Promise.all(teacherBatches);
        teacherResults.flatMap(snap => snap.docs).forEach(docSnap => {
          teacherData[docSnap.id] = docSnap.data().name || 'Unknown';
        });
      }

      // ============================================
      // 7. BUILD CORE COURSE VIEWS
      // ============================================
      coreInstances.forEach(instance => {
        if (instance.courseId && courseData[instance.courseId]) {
          instance.course = courseData[instance.courseId];
        }
        if (instance.teacherIds && instance.teacherIds.length > 0) {
          instance.teacherNames = instance.teacherIds.map(id => teacherData[id] || 'Unknown');
        }

        studentCourseViews.push({
          instance,
          isElectiveSlot: false,
          selectionStatus: 'not_applicable',
        });
      });

      // ============================================
      // 8. BUILD ELECTIVE SLOT VIEWS
      // ============================================
      for (const slot of slots) {
        const selection = selectionsMap[slot.id];
        const availableCourseIds = slotMappingsMap[slot.id] || [];

        if (selection) {
          // Student has selected a course for this slot
          // Fetch the selected course details
          const selectedCourseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, selection.selectedCourseId));
          
          if (selectedCourseDoc.exists()) {
            const selectedCourse = { id: selectedCourseDoc.id, ...selectedCourseDoc.data() } as Course;
            
            // Find course instances for this elective course in this slot
            // Teachers are assigned to course instances
            const instanceRef = collection(db, COLLECTIONS.COURSE_INSTANCES);
            const instanceQuery = query(
              instanceRef,
              where('courseId', '==', selectedCourse.id),
              where('electiveSlotId', '==', slot.id),
              where('isActive', '==', true)
            );
            
            const instanceSnap = await getDocs(instanceQuery);
            let teacherIds: string[] = [];
            
            if (!instanceSnap.empty) {
              // Get teachers from the first available instance
              // (All instances of same elective in same slot should have same teachers)
              teacherIds = instanceSnap.docs[0].data().teacherIds || [];
            }
            
            // Fetch teacher names
            let teacherNames: string[] = [];
            if (teacherIds.length > 0) {
              const teacherDocs = await Promise.all(
                teacherIds.map(teacherId => 
                  getDoc(doc(db, COLLECTIONS.USERS, teacherId))
                )
              );
              teacherNames = teacherDocs
                .filter(doc => doc.exists())
                .map(doc => doc.data().name || 'Unknown');
            }
            
            // Create a virtual instance for the selected course
            const selectedInstance: CourseInstanceWithDetails = {
              id: `selection-${selection.id}`,
              courseId: selectedCourse.id,
              departmentId: normalizedDept as DepartmentId,
              semester: studentSem,
              section: normalizedSection,
              teacherIds: teacherIds,
              isActive: true,
              electiveSlotId: slot.id,
              createdAt: slot.createdAt,
              course: selectedCourse,
              teacherNames: teacherNames.length > 0 ? teacherNames : ['TBA'],
            };

            studentCourseViews.push({
              instance: selectedInstance,
              electiveSelection: selection,
              isElectiveSlot: true,
              selectionStatus: 'selected',
            });
          }
        } else {
          // No selection made - show placeholder slot
          const placeholderInstance: CourseInstanceWithDetails = {
            id: `slot-${slot.id}`,
            courseId: '',
            departmentId: normalizedDept as DepartmentId,
            semester: studentSem,
            section: normalizedSection,
            teacherIds: [],
            isActive: true,
            electiveSlotId: slot.id,
            createdAt: slot.createdAt,
            course: {
              id: `slot-course-${slot.id}`,
              courseCode: slot.slotCode,
              name: slot.name,
              departmentId: normalizedDept as DepartmentId,
              semester: studentSem,
              credits: 0,
              courseType: slot.slotType === ELECTIVE_SLOT_TYPES.OPEN ? 'open_elective' : 'professional_elective',
              createdBy: '',
              createdAt: slot.createdAt,
            } as Course,
          };

          studentCourseViews.push({
            instance: placeholderInstance,
            isElectiveSlot: true,
            selectionStatus: 'not_selected',
            availableCourseIds, // Store available courses for selection modal
          });
        }
      }

      // Sort courses by course code
      studentCourseViews.sort((a, b) => {
        const codeA = a.instance.course?.courseCode || '';
        const codeB = b.instance.course?.courseCode || '';
        return codeA.localeCompare(codeB);
      });

      // Only update state if this is still the latest request and not aborted
      if (currentRequestId === requestIdRef.current && !abortController.signal.aborted) {
        setCourses(studentCourseViews);
        setLoading(false);
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || abortController.signal.aborted) {
        return;
      }
      
      // Handle Firebase index errors
      if (err.code === 'failed-precondition') {
        console.error('Missing Firebase index:', err.message);
        if (currentRequestId === requestIdRef.current) {
          setError('Database configuration error. Please contact support.');
          setLoading(false);
        }
        return;
      }
      
      console.error('Error fetching student courses:', err);
      if (currentRequestId === requestIdRef.current) {
        setError(err.message || 'Failed to fetch courses');
        setLoading(false);
      }
    }
  }, [user?.uid, userData, role, authInitialized]);

  const refresh = useCallback(() => {
    fetchStudentCourses();
  }, [fetchStudentCourses]);

  useEffect(() => {
    fetchStudentCourses();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchStudentCourses]);

  return {
    courses,
    loading,
    error,
    refresh,
  };
}

export default useStudentCourses;
