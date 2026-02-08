import React, { useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { X, BookOpen, CheckCircle, AlertCircle } from 'lucide-react-native';
import { Modal, ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Button, ButtonText } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Badge } from '@/components/ui/badge';
import { Pressable } from '@/components/ui/pressable';
import { Alert, AlertIcon, AlertText } from '@/components/ui/alert';
import { Course, ElectiveGroup } from '@/types';

interface ElectiveCourse extends Course {
  teacherNames?: string[];
  slot?: string;
}

interface ElectiveSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (courseId: string) => Promise<void>;
  electiveGroup: ElectiveGroup | null;
  courses: ElectiveCourse[];
  loading?: boolean;
  error?: string | null;
}

export function ElectiveSelectorModal({
  isOpen,
  onClose,
  onSelect,
  electiveGroup,
  courses,
  loading = false,
  error = null,
}: ElectiveSelectorModalProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = async () => {
    if (!selectedCourseId) return;
    
    setSubmitting(true);
    try {
      await onSelect(selectedCourseId);
      setSelectedCourseId(null);
      onClose();
    } catch (err) {
      console.error('Failed to select elective:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedCourseId(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalBackdrop />
      <ModalContent className="max-h-[80%]">
        <ModalHeader className="border-b border-gray-100">
          <HStack className="items-center justify-between w-full">
            <VStack space="xs">
              <Heading size="md" className="text-black">
                Select Elective Course
              </Heading>
              <Text className="text-sm text-gray-500">
                {electiveGroup?.name || 'Choose your elective'}
              </Text>
            </VStack>
            <Pressable onPress={handleClose} className="p-2">
              <X size={24} color="#77867D" />
            </Pressable>
          </HStack>
        </ModalHeader>

        <ModalBody className="p-0">
          {error && (
            <Alert action="error" className="m-4">
              <AlertIcon as={AlertCircle} />
              <AlertText>{error}</AlertText>
            </Alert>
          )}

          {loading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color="#7477FF" />
              <Text className="mt-4 text-gray-500">Loading elective options...</Text>
            </View>
          ) : (
            <ScrollView className="p-4">
              <Text className="text-sm text-gray-600 mb-4">
                Select one course from the options below. This choice cannot be changed without admin approval.
              </Text>

              <VStack space="md">
                {courses.map((course) => (
                  <Pressable
                    key={course.id}
                    onPress={() => setSelectedCourseId(course.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedCourseId === course.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <HStack className="items-start gap-3">
                      <View
                        className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                          selectedCourseId === course.id
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedCourseId === course.id && (
                          <CheckCircle size={14} color="#FFFFFF" />
                        )}
                      </View>

                      <VStack className="flex-1" space="xs">
                        <HStack space="sm" className="items-center">
                          <Badge
                            variant="outline"
                            className="bg-purple-50 border-purple-200"
                          >
                            <Text className="text-xs font-semibold text-purple-600">
                              {course.courseCode}
                            </Text>
                          </Badge>
                          <Badge
                            variant="outline"
                            className="bg-gray-50 border-gray-200"
                          >
                            <Text className="text-xs text-gray-600">
                              {course.credits} Credits
                            </Text>
                          </Badge>
                        </HStack>

                        <Text className="text-base font-semibold text-black">
                          {course.name}
                        </Text>

                        {course.teacherNames && course.teacherNames.length > 0 && (
                          <Text className="text-sm text-gray-500">
                            Faculty: {course.teacherNames.join(', ')}
                          </Text>
                        )}

                        {course.metadata?.description && (
                          <Text className="text-sm text-gray-600 mt-1">
                            {course.metadata.description}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </Pressable>
                ))}
              </VStack>

              {courses.length === 0 && !loading && (
                <View className="py-8 items-center">
                  <BookOpen size={48} color="#C5D4CA" />
                  <Text className="mt-4 text-gray-500 text-center">
                    No elective courses available at this time.
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </ModalBody>

        <ModalFooter className="border-t border-gray-100">
          <HStack space="md" className="w-full">
            <Button
              variant="outline"
              className="flex-1"
              onPress={handleClose}
              disabled={submitting}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button
              className="flex-1 bg-purple-500"
              onPress={handleSelect}
              disabled={!selectedCourseId || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ButtonText className="text-white">Confirm Selection</ButtonText>
              )}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ElectiveSelectorModal;
