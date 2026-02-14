import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ChevronDown, User, GraduationCap } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import type { LinkedStudent } from '@/lib/hooks/useLinkedStudents';

interface StudentSelectorProps {
  students: LinkedStudent[];
  selectedStudent: LinkedStudent | null;
  onSelectStudent: (student: LinkedStudent) => void;
  loading?: boolean;
}

/**
 * Component for parents to select which child to view
 * Shows as a dropdown-style selector when parent has multiple linked students
 * Shows as a simple info card when parent has only one linked student
 */
export function StudentSelector({
  students,
  selectedStudent,
  onSelectStudent,
  loading = false,
}: StudentSelectorProps) {
  if (loading) {
    return (
      <View className="bg-white mx-4 my-2 p-4 rounded-xl border border-gray-200">
        <HStack className="items-center" space="md">
          <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
            <Icon as={User} size="sm" className="text-gray-400" />
          </View>
          <VStack className="flex-1">
            <View className="h-4 w-32 bg-gray-200 rounded mb-1" />
            <View className="h-3 w-24 bg-gray-100 rounded" />
          </VStack>
        </HStack>
      </View>
    );
  }

  if (students.length === 0) {
    return (
      <View className="bg-amber-50 mx-4 my-2 p-4 rounded-xl border border-amber-200">
        <HStack className="items-center" space="md">
          <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center">
            <Icon as={GraduationCap} size="sm" className="text-amber-600" />
          </View>
          <VStack className="flex-1">
            <Text className="text-amber-900 font-semibold">No Student Linked</Text>
            <Text className="text-amber-700 text-sm">
              Link to a student to view their academics
            </Text>
          </VStack>
        </HStack>
      </View>
    );
  }

  if (students.length === 1) {
    // Single student - show as info card
    const student = students[0];
    return (
      <View className="bg-blue-50 mx-4 my-2 p-4 rounded-xl border border-blue-200">
        <HStack className="items-center" space="md">
          <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
            <Icon as={User} size="sm" className="text-blue-600" />
          </View>
          <VStack className="flex-1">
            <Text className="text-blue-900 font-semibold">{student.name}</Text>
            <Text className="text-blue-700 text-sm">
              {student.usn} • {student.departmentId} • Sem {student.semester}
            </Text>
          </VStack>
        </HStack>
      </View>
    );
  }

  // Multiple students - show selector
  return (
    <View className="mx-4 my-2">
      <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 ml-1">
        Viewing Child
      </Text>
      
      {students.map((student) => {
        const isSelected = selectedStudent?.uid === student.uid;
        
        return (
          <TouchableOpacity
            key={student.uid}
            onPress={() => onSelectStudent(student)}
            className={`p-4 rounded-xl border mb-2 ${
              isSelected
                ? 'bg-blue-50 border-blue-300'
                : 'bg-white border-gray-200'
            }`}
          >
            <HStack className="items-center" space="md">
              <View
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  isSelected ? 'bg-blue-100' : 'bg-gray-100'
                }`}
              >
                <Icon
                  as={User}
                  size="sm"
                  className={isSelected ? 'text-blue-600' : 'text-gray-400'}
                />
              </View>
              <VStack className="flex-1">
                <Text
                  className={`font-semibold ${
                    isSelected ? 'text-blue-900' : 'text-gray-900'
                  }`}
                >
                  {student.name}
                </Text>
                <Text
                  className={`text-sm ${
                    isSelected ? 'text-blue-700' : 'text-gray-500'
                  }`}
                >
                  {student.usn} • {student.departmentId} • Sem {student.semester}
                </Text>
              </VStack>
              {isSelected && (
                <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center">
                  <Icon as={ChevronDown} size="xs" className="text-white" />
                </View>
              )}
            </HStack>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default StudentSelector;
