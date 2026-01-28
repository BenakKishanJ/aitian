import React, { useState, useEffect } from 'react';

import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import { Modal, ModalBackdrop, ModalBody, ModalFooter, ModalContent, ModalHeader } from '@/components/ui/modal';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper, ActionsheetItem, ActionsheetItemText } from '@/components/ui/actionsheet';


import {
  Plus,
  Calendar as CalendarIcon,
  BookOpen,
  FileText,
  Upload,
  Clock,
  MessageSquare,
  Pin,
  UserPlus,
  Settings,
  X,
  CheckCircle,
  Users,
  Award,
  FileUp,
  Edit,
  Trash2
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { router, usePathname } from 'expo-router';
import { Alert } from 'react-native';

// Define FAB action types
type FABAction = {
  id: string;
  label: string;
  icon: React.ElementType;
  description?: string;
  color: string;
  iconColor: string;
  onPress: () => void;
  roles: Array<'student' | 'teacher' | 'parent' | 'admin'>;
  screen: string | string[]; // Which screen(s) this action appears on
};

export function FAB() {
  const { userData, role } = useAuth();
  const pathname = usePathname();
  const [showActions, setShowActions] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('');

  // Determine current screen from pathname
  useEffect(() => {
    if (pathname.includes('calendar')) {
      setCurrentScreen('calendar');
    } else if (pathname.includes('academics')) {
      setCurrentScreen('academics');
    } else if (pathname.includes('course')) {
      setCurrentScreen('course');
    } else if (pathname.includes('news')) {
      setCurrentScreen('news');
    } else if (pathname.includes('assignments')) {
      setCurrentScreen('assignments');
    } else if (pathname.includes('materials')) {
      setCurrentScreen('materials');
    } else if (pathname.includes('attendance')) {
      setCurrentScreen('attendance');
    } else {
      setCurrentScreen('');
    }
  }, [pathname]);

  // Get all possible FAB actions based on README matrix
  const getAllActions = (): FABAction[] => [
    // Calendar Tab Actions
    {
      id: 'add_personal_event',
      label: 'Add Personal Event',
      icon: CalendarIcon,
      description: 'Add event to your personal calendar',
      color: 'bg-blue-100',
      iconColor: '#3B82F6',
      onPress: () => router.push('/calendar/add-event?type=personal'),
      roles: ['student'],
      screen: 'calendar'
    },
    {
      id: 'add_class_event',
      label: 'Add Class Event',
      icon: CalendarIcon,
      description: 'Schedule a class session',
      color: 'bg-green-100',
      iconColor: '#10B981',
      onPress: () => router.push('/calendar/add-event?type=class'),
      roles: ['teacher'],
      screen: 'calendar'
    },
    {
      id: 'add_exam_event',
      label: 'Add Exam',
      icon: Award,
      description: 'Schedule an exam',
      color: 'bg-red-100',
      iconColor: '#EF4444',
      onPress: () => router.push('/calendar/add-event?type=exam'),
      roles: ['admin'],
      screen: 'calendar'
    },
    {
      id: 'add_global_event',
      label: 'Add Global Event',
      icon: CalendarIcon,
      description: 'Add college-wide event',
      color: 'bg-orange-100',
      iconColor: '#F97316',
      onPress: () => router.push('/calendar/add-event?type=global'),
      roles: ['admin'],
      screen: 'calendar'
    },

    // Academics Tab Actions (Admin only)
    {
      id: 'create_course',
      label: 'Create Course',
      icon: BookOpen,
      description: 'Create new course definition',
      color: 'bg-blue-100',
      iconColor: '#3B82F6',
      onPress: () => router.push('/admin/courses/create'),
      roles: ['admin'],
      screen: 'academics'
    },
    {
      id: 'create_course_instance',
      label: 'Create Course Instance',
      icon: BookOpen,
      description: 'Create course for specific section',
      color: 'bg-purple-100',
      iconColor: '#8B5CF6',
      onPress: () => router.push('/admin/course-instances/create'),
      roles: ['admin'],
      screen: 'academics'
    },

    // Course Detail Page Actions
    {
      id: 'upload_material',
      label: 'Upload Material',
      icon: Upload,
      description: 'Upload study material',
      color: 'bg-blue-100',
      iconColor: '#3B82F6',
      onPress: () => router.push('/course/[id]/materials/upload'),
      roles: ['teacher', 'admin'],
      screen: 'course'
    },
    {
      id: 'create_assignment',
      label: 'Create Assignment',
      icon: FileText,
      description: 'Create new assignment',
      color: 'bg-green-100',
      iconColor: '#10B981',
      onPress: () => router.push('/course/[id]/assignments/create'),
      roles: ['teacher', 'admin'],
      screen: 'course'
    },
    {
      id: 'start_attendance',
      label: 'Start Attendance',
      icon: Clock,
      description: 'Start attendance session',
      color: 'bg-yellow-100',
      iconColor: '#F59E0B',
      onPress: () => handleStartAttendance(),
      roles: ['teacher', 'admin'],
      screen: 'course'
    },
    {
      id: 'edit_course_timetable',
      label: 'Edit Timetable',
      icon: CalendarIcon,
      description: 'Modify course schedule',
      color: 'bg-purple-100',
      iconColor: '#8B5CF6',
      onPress: () => router.push('/course/[id]/timetable/edit'),
      roles: ['teacher'],
      screen: 'course'
    },
    {
      id: 'assign_teacher',
      label: 'Assign Teacher',
      icon: UserPlus,
      description: 'Assign teacher to course',
      color: 'bg-indigo-100',
      iconColor: '#6366F1',
      onPress: () => router.push('/course/[id]/teachers/assign'),
      roles: ['admin'],
      screen: 'course'
    },
    {
      id: 'modify_course_metadata',
      label: 'Modify Course',
      icon: Settings,
      description: 'Edit course details',
      color: 'bg-gray-100',
      iconColor: '#6B7280',
      onPress: () => router.push('/course/[id]/edit'),
      roles: ['admin'],
      screen: 'course'
    },
    {
      id: 'lock_course',
      label: 'Lock Course',
      icon: CheckCircle,
      description: 'Lock/unlock course',
      color: 'bg-red-100',
      iconColor: '#EF4444',
      onPress: () => handleLockCourse(),
      roles: ['admin'],
      screen: 'course'
    },

    // Assignments Page Actions
    {
      id: 'create_assignment_page',
      label: 'Create Assignment',
      icon: FileText,
      description: 'Create new assignment',
      color: 'bg-green-100',
      iconColor: '#10B981',
      onPress: () => router.push('/assignments/create'),
      roles: ['teacher', 'admin'],
      screen: 'assignments'
    },
    {
      id: 'delete_assignment',
      label: 'Delete Assignment',
      icon: Trash2,
      description: 'Delete selected assignment',
      color: 'bg-red-100',
      iconColor: '#EF4444',
      onPress: () => handleDeleteAssignment(),
      roles: ['admin'],
      screen: 'assignments'
    },

    // Materials Page Actions
    {
      id: 'upload_material_page',
      label: 'Upload Material',
      icon: Upload,
      description: 'Upload study material',
      color: 'bg-blue-100',
      iconColor: '#3B82F6',
      onPress: () => router.push('/materials/upload'),
      roles: ['teacher', 'admin'],
      screen: 'materials'
    },
    {
      id: 'delete_material',
      label: 'Delete Material',
      icon: Trash2,
      description: 'Delete selected material',
      color: 'bg-red-100',
      iconColor: '#EF4444',
      onPress: () => handleDeleteMaterial(),
      roles: ['admin'],
      screen: 'materials'
    },

    // Attendance Page Actions
    {
      id: 'start_attendance_page',
      label: 'Start Attendance',
      icon: Clock,
      description: 'Start attendance session',
      color: 'bg-yellow-100',
      iconColor: '#F59E0B',
      onPress: () => handleStartAttendance(),
      roles: ['teacher', 'admin'],
      screen: 'attendance'
    },
    {
      id: 'override_attendance',
      label: 'Override Attendance',
      icon: Edit,
      description: 'Manually override attendance',
      color: 'bg-orange-100',
      iconColor: '#F97316',
      onPress: () => router.push('/attendance/override'),
      roles: ['admin'],
      screen: 'attendance'
    },

    // News Tab Actions
    {
      id: 'create_post',
      label: 'Create Post',
      icon: MessageSquare,
      description: 'Create new announcement',
      color: 'bg-blue-100',
      iconColor: '#3B82F6',
      onPress: () => router.push('/news/create'),
      roles: ['teacher', 'admin'],
      screen: 'news'
    },
    {
      id: 'pin_post',
      label: 'Pin Post',
      icon: Pin,
      description: 'Pin/unpin announcement',
      color: 'bg-purple-100',
      iconColor: '#8B5CF6',
      onPress: () => handlePinPost(),
      roles: ['admin'],
      screen: 'news'
    },

    // Discussion Forum Actions
    {
      id: 'create_discussion',
      label: 'Create Discussion',
      icon: MessageSquare,
      description: 'Start new discussion thread',
      color: 'bg-blue-100',
      iconColor: '#3B82F6',
      onPress: () => router.push('/discussion/create'),
      roles: ['student'],
      screen: 'discussion'
    },

    // Admin Screens Actions (always visible for admin)
    {
      id: 'add_user',
      label: 'Add User',
      icon: UserPlus,
      description: 'Add new user to system',
      color: 'bg-green-100',
      iconColor: '#10B981',
      onPress: () => router.push('/admin/users/add'),
      roles: ['admin'],
      screen: 'admin'
    },
    {
      id: 'manage_courses',
      label: 'Manage Courses',
      icon: BookOpen,
      description: 'Course management',
      color: 'bg-blue-100',
      iconColor: '#3B82F6',
      onPress: () => router.push('/admin/courses'),
      roles: ['admin'],
      screen: 'admin'
    },
    {
      id: 'system_settings',
      label: 'System Settings',
      icon: Settings,
      description: 'Configure system settings',
      color: 'bg-gray-100',
      iconColor: '#6B7280',
      onPress: () => router.push('/admin/settings'),
      roles: ['admin'],
      screen: 'admin'
    },
  ];

  // Filter actions based on role and current screen
  const getFilteredActions = (): FABAction[] => {
    if (!role) return [];

    // Get actions for current screen and user role
    const actions = getAllActions().filter(action => {
      // Check if role has permission
      if (!action.roles.includes(role as any)) return false;

      // Check if action applies to current screen
      if (Array.isArray(action.screen)) {
        return action.screen.includes(currentScreen);
      }
      return action.screen === currentScreen;
    });

    return actions;
  };

  // Handler functions for various actions
  const handleStartAttendance = () => {
    Alert.alert(
      'Start Attendance',
      'Are you ready to start attendance for this class?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: () => {
            // TODO: Implement attendance session start
            router.push('/attendance/session/start');
          }
        }
      ]
    );
  };

  const handleLockCourse = () => {
    Alert.alert(
      'Lock Course',
      'Locking the course will prevent any modifications. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Lock',
          onPress: () => {
            // TODO: Implement course locking
            Alert.alert('Success', 'Course locked successfully');
          }
        }
      ]
    );
  };

  const handleDeleteAssignment = () => {
    Alert.alert(
      'Delete Assignment',
      'This will delete the assignment and all submissions. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement assignment deletion
            Alert.alert('Success', 'Assignment deleted');
          }
        }
      ]
    );
  };

  const handleDeleteMaterial = () => {
    Alert.alert(
      'Delete Material',
      'Are you sure you want to delete this material?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement material deletion
            Alert.alert('Success', 'Material deleted');
          }
        }
      ]
    );
  };

  const handlePinPost = () => {
    Alert.alert(
      'Pin Post',
      'Pin this post to the top of the feed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pin',
          onPress: () => {
            // TODO: Implement post pinning
            Alert.alert('Success', 'Post pinned');
          }
        }
      ]
    );
  };

  // Check if FAB should be visible
  const shouldShowFAB = (): boolean => {
    if (!role) return false;

    // According to README:
    // ❌ Students & Parents → No FAB (except specific cases)
    // ✅ Teachers → Limited FAB
    // ✅ Admins → Full FAB

    if (role === 'student') {
      // Students only get FAB on calendar (personal events) and discussion
      return currentScreen === 'calendar' || currentScreen === 'discussion';
    }

    if (role === 'parent') {
      // Parents get NO FAB (README: ❌ Parents → No FAB)
      return false;
    }

    if (role === 'teacher') {
      // Teachers get FAB on specific screens
      const teacherFABScreens = [
        'calendar', 'course', 'assignments', 'materials',
        'attendance', 'news', 'discussion'
      ];
      return teacherFABScreens.includes(currentScreen);
    }

    if (role === 'admin') {
      // Admins get FAB on all screens except home and profile
      const noFABScreens = ['', 'home', 'profile'];
      return !noFABScreens.includes(currentScreen);
    }

    return false;
  };

  const filteredActions = getFilteredActions();
  const showFab = shouldShowFAB() && filteredActions.length > 0;

  if (!showFab) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <Pressable
        onPress={() => setShowActions(true)}
        className="absolute bottom-24 right-6 z-50"
      >
        <Box className="w-16 h-16 rounded-full bg-blue-500 shadow-lg shadow-blue-500/30 items-center justify-center active:bg-blue-600 active:scale-95 transition-all">
          <Plus size={24} color="white" />
        </Box>
      </Pressable>

      {/* Action Sheet */}
      <Actionsheet
        isOpen={showActions}
        onClose={() => setShowActions(false)}
      >
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>

          <ModalHeader className="px-4 pt-4">
            <Heading size="lg">Actions</Heading>
            <Text className="text-gray-500">
              {currentScreen ? `Available for ${currentScreen}` : 'Available actions'}
            </Text>
          </ModalHeader>

          <ModalBody className="px-4">
            <VStack space="sm">
              {filteredActions.map((action) => {
                const IconComponent = action.icon;
                return (
                  <ActionsheetItem
                    key={action.id}
                    onPress={() => {
                      setShowActions(false);
                      setTimeout(() => action.onPress(), 100);
                    }}
                    className="py-4"
                  >
                    <HStack className="items-center w-full" space="md">
                      <Box className={`p-3 rounded-lg ${action.color}`}>
                        <IconComponent size={20} color={action.iconColor} />
                      </Box>
                      <VStack className="flex-1" space="xs">
                        <ActionsheetItemText className="font-semibold text-gray-900">
                          {action.label}
                        </ActionsheetItemText>
                        {action.description && (
                          <Text className="text-gray-500 text-sm">
                            {action.description}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </ActionsheetItem>
                );
              })}
            </VStack>
          </ModalBody>

          <ModalFooter className="px-4 pb-6">
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onPress={() => setShowActions(false)}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
          </ModalFooter>
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
}
