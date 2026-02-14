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
    // Support both departmentId (new) and department (legacy) for backward compatibility
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

      // Normalize section for case-insensitive matching
      const normalizedSection = studentSection.toUpperCase();
      const altSection = studentSection.toLowerCase();
      
      // Normalize department (handle both departmentId formats)
      const normalizedDept = studentDept.toLowerCase();

      // ============================================
      // 1. FETCH CORE COURSES
      // ============================================
      const coreInstancesRef = collection(db, COLLECTIONS.COURSE_INSTANCES);
      
      // Try uppercase section first
      const coreQuery = query(
        coreInstancesRef,
        where('departmentId', '==', normalizedDept),
        where('semester', '==', studentSem),
        where('section', '==', normalizedSection),
        where('isActive', '==', true)
      );

      const coreSnap = await getDocs(coreQuery);
      const coreInstanceIds: string[] = [];
      const coreInstances: CourseInstanceWithDetails[] = [];

      coreSnap.docs.forEach((docSnap) => {
        const instance = { id: docSnap.id, ...docSnap.data() } as CourseInstanceWithDetails;
        coreInstances.push(instance);
        coreInstanceIds.push(docSnap.id);
      });

      // If no results with uppercase, try lowercase (backward compatibility)
      if (coreInstances.length === 0 && normalizedSection !== altSection) {
        const altCoreQuery = query(
          coreInstancesRef,
          where('departmentId', '==', normalizedDept),
          where('semester', '==', studentSem),
          where('section', '==', altSection),
          where('isActive', '==', true)
        );

        const altCoreSnap = await getDocs(altCoreQuery);
        altCoreSnap.docs.forEach((docSnap) => {
          const instance = { id: docSnap.id, ...docSnap.data() } as CourseInstanceWithDetails;
          coreInstances.push(instance);
          coreInstanceIds.push(docSnap.id);
        });
      }

      // ============================================
      // 2. FETCH PROFESSIONAL ELECTIVE SLOTS
      // ============================================
      const profSlotsRef = collection(db, COLLECTIONS.ELECTIVE_SLOTS);
      const profSlotsQuery = query(
        profSlotsRef,
        where('slotType', '==', ELECTIVE_SLOT_TYPES.PROFESSIONAL),
        where('departmentId', '==', normalizedDept),
        where('semester', '==', studentSem),
        where('isActive', '==', true)
      );

      const profSlotsSnap = await getDocs(profSlotsQuery);
      const profSlotIds: string[] = [];
      const profSlots: ElectiveSlot[] = [];

      profSlotsSnap.docs.forEach((docSnap) => {
        const slot = { id: docSnap.id, ...docSnap.data() } as ElectiveSlot;
        profSlots.push(slot);
        profSlotIds.push(docSnap.id);
      });

      // ============================================
      // 3. FETCH OPEN ELECTIVE SLOTS
      // ============================================
      const openSlotsRef = collection(db, COLLECTIONS.ELECTIVE_SLOTS);
      const openSlotsQuery = query(
        openSlotsRef,
        where('slotType', '==', ELECTIVE_SLOT_TYPES.OPEN),
        where('assignedDepartments', 'array-contains', normalizedDept),
        where('semester', '==', studentSem),
        where('isActive', '==', true)
      );

      const openSlotsSnap = await getDocs(openSlotsQuery);
      const openSlotIds: string[] = [];
      const openSlots: ElectiveSlot[] = [];

      openSlotsSnap.docs.forEach((docSnap) => {
        const slot = { id: docSnap.id, ...docSnap.data() } as ElectiveSlot;
        openSlots.push(slot);
        openSlotIds.push(docSnap.id);
      });

      // Combine all slots
      const allSlots = [...profSlots, ...openSlots];
      const allSlotIds = [...profSlotIds, ...openSlotIds];

      // ============================================
      // 4. FETCH ELECTIVE INSTANCES FOR SLOTS
      // ============================================
      const electiveInstanceIds: string[] = [];
      const slotInstancesMap: { [slotId: string]: CourseInstanceWithDetails[] } = {};

      if (allSlotIds.length > 0) {
        // For each slot, fetch instances
        for (const slotId of allSlotIds) {
          const slot = allSlots.find(s => s.id === slotId);
          if (!slot) continue;

          const instancesRef = collection(db, COLLECTIONS.COURSE_INSTANCES);
          const instancesQuery = query(
            instancesRef,
            where('electiveSlotId', '==', slotId),
where('departmentId', '==', normalizedDept),
            where('semester', '==', studentSem),
            where('isActive', '==', true)
          );

          const instancesSnap = await getDocs(instancesQuery);
          const slotInstanceList: CourseInstanceWithDetails[] = [];

          instancesSnap.docs.forEach((docSnap) => {
            const instance = { id: docSnap.id, ...docSnap.data() } as CourseInstanceWithDetails;
            slotInstanceList.push(instance);
            electiveInstanceIds.push(docSnap.id);
          });

          slotInstancesMap[slotId] = slotInstanceList;
        }
      }

      // ============================================
      // 5. FETCH STUDENT'S ELECTIVE SELECTIONS
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
      // 6. FETCH COURSE DETAILS FOR ALL INSTANCES
      // ============================================
      const allInstanceIds = [...coreInstanceIds, ...electiveInstanceIds];
      const courseData: { [id: string]: Course } = {};

      if (allInstanceIds.length > 0) {
        // Get unique courseIds
        const allInstances = [...coreInstances, ...Object.values(slotInstancesMap).flat()];
        const courseIds = [...new Set(allInstances.map(inst => inst.courseId).filter(Boolean))];

        // Fetch courses in batches
        if (courseIds.length > 0) {
          const courseBatches: Promise<QuerySnapshot<DocumentData>>[] = [];
          for (let i = 0; i < courseIds.length; i += 10) {
            const batchIds = courseIds.slice(i, i + 10);
            const coursesRef = collection(db, COLLECTIONS.COURSES);
            const coursesQuery = query(coursesRef, where('__name__', 'in', batchIds));
            courseBatches.push(getDocs(coursesQuery));
          }
          
          const courseResults = await Promise.all(courseBatches);
          courseResults.flatMap(snap => snap.docs).forEach(docSnap => {
            courseData[docSnap.id] = { id: docSnap.id, ...docSnap.data() } as Course;
          });
        }
      }

      // ============================================
      // 7. FETCH TEACHER NAMES
      // ============================================
      const allInstances = [...coreInstances, ...Object.values(slotInstancesMap).flat()];
      const teacherIds = [...new Set(allInstances.flatMap(inst => inst.teacherIds || []))];
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
      // 8. BUILD CORE COURSE VIEWS
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
      // 9. BUILD ELECTIVE SLOT VIEWS
      // ============================================
      allSlots.forEach(slot => {
        const instances = slotInstancesMap[slot.id] || [];
        const selection = selectionsMap[slot.id];

        if (selection && instances.length > 0) {
          // Student has made a selection - find the selected instance
          const selectedInstance = instances.find(inst => inst.id === selection.instanceId);
          
          if (selectedInstance) {
            // Enhance instance with course details
            if (selectedInstance.courseId && courseData[selectedInstance.courseId]) {
              selectedInstance.course = courseData[selectedInstance.courseId];
            }
            if (selectedInstance.teacherIds && selectedInstance.teacherIds.length > 0) {
              selectedInstance.teacherNames = selectedInstance.teacherIds.map(id => teacherData[id] || 'Unknown');
            }

            studentCourseViews.push({
              instance: selectedInstance,
              electiveSelection: selection,
              isElectiveSlot: true,
              selectionStatus: 'selected',
            });
          }
        } else {
          // No selection made - show placeholder slot
          // Create a placeholder instance for the slot
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
              credits: 0, // Will be set when course is selected
              courseType: slot.slotType === ELECTIVE_SLOT_TYPES.OPEN ? 'open_elective' : 'professional_elective',
              createdBy: '',
              createdAt: slot.createdAt,
            } as Course,
          };

          studentCourseViews.push({
            instance: placeholderInstance,
            isElectiveSlot: true,
            selectionStatus: 'not_selected',
          });
        }
      });

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
