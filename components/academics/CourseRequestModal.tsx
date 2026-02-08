import React, { useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { X, Plus, BookOpen, CheckCircle, AlertCircle, Trash2 } from 'lucide-react-native';
import { Modal, ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectItem } from '@/components/ui/select';
import { Pressable } from '@/components/ui/pressable';
import { Alert, AlertIcon, AlertText } from '@/components/ui/alert';
import { DEPARTMENTS, DepartmentId } from '@/types';

interface CourseRequestForm {
  id: string;
  courseName: string;
  departmentId: DepartmentId | '';
  semester: number | '';
  section: string;
}

interface CourseRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (requests: Omit<CourseRequestForm, 'id'>[]) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export function CourseRequestModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  error = null,
}: CourseRequestModalProps) {
  const [requests, setRequests] = useState<CourseRequestForm[]>([
    { id: '1', courseName: '', departmentId: '', semester: '', section: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const addRequest = () => {
    setRequests((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        courseName: '',
        departmentId: '',
        semester: '',
        section: '',
      },
    ]);
  };

  const removeRequest = (id: string) => {
    if (requests.length > 1) {
      setRequests((prev) => prev.filter((req) => req.id !== id));
    }
  };

  const updateRequest = (id: string, field: keyof CourseRequestForm, value: string | number) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === id ? { ...req, [field]: value } : req
      )
    );
  };

  const validateRequests = (): boolean => {
    return requests.every(
      (req) =>
        req.courseName.trim() !== '' &&
        req.departmentId !== '' &&
        req.semester !== '' &&
        req.section.trim() !== ''
    );
  };

  const handleSubmit = async () => {
    if (!validateRequests()) {
      return;
    }

    setSubmitting(true);
    try {
      const requestsToSubmit = requests.map(({ id, ...rest }) => ({
        ...rest,
        semester: Number(rest.semester),
      }));

      await onSubmit(requestsToSubmit);
      setRequests([{ id: '1', courseName: '', departmentId: '', semester: '', section: '' }]);
      onClose();
    } catch (err) {
      console.error('Failed to submit course requests:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setRequests([{ id: '1', courseName: '', departmentId: '', semester: '', section: '' }]);
      onClose();
    }
  };

  const isValid = validateRequests();

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalBackdrop />
      <ModalContent className="max-h-[85%]">
        <ModalHeader className="border-b border-gray-100">
          <HStack className="items-center justify-between w-full">
            <VStack space="xs">
              <Heading size="md" className="text-black">
                Request Course Assignment
              </Heading>
              <Text className="text-sm text-gray-500">
                Submit request to teach new courses
              </Text>
            </VStack>
            <Pressable onPress={handleClose} className="p-2" disabled={submitting}>
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
              <Text className="mt-4 text-gray-500">Loading...</Text>
            </View>
          ) : (
            <ScrollView className="p-4">
              <Text className="text-sm text-gray-600 mb-4">
                Enter details for the courses you want to teach. You can add multiple requests at once.
              </Text>

              <VStack space="lg">
                {requests.map((request, index) => (
                  <View
                    key={request.id}
                    className="p-4 rounded-xl border border-gray-200 bg-gray-50"
                  >
                    <HStack className="justify-between items-center mb-4">
                      <HStack space="sm" className="items-center">
                        <BookOpen size={18} color="#7477FF" />
                        <Text className="font-semibold text-black">
                          Course Request {index + 1}
                        </Text>
                      </HStack>
                      {requests.length > 1 && (
                        <Pressable
                          onPress={() => removeRequest(request.id)}
                          className="p-2"
                          disabled={submitting}
                        >
                          <Trash2 size={18} color="#F96857" />
                        </Pressable>
                      )}
                    </HStack>

                    <VStack space="md">
                      {/* Course Name */}
                      <VStack space="xs">
                        <Text className="text-sm font-medium text-gray-700">
                          Course Name *
                        </Text>
                        <Input>
                          <InputField
                            placeholder="e.g., Advanced Database Systems"
                            value={request.courseName}
                            onChangeText={(text) =>
                              updateRequest(request.id, 'courseName', text)
                            }
                            editable={!submitting}
                          />
                        </Input>
                      </VStack>

                      {/* Department */}
                      <VStack space="xs">
                        <Text className="text-sm font-medium text-gray-700">
                          Department *
                        </Text>
                        <Select
                          selectedValue={request.departmentId}
                          onValueChange={(value) =>
                            updateRequest(request.id, 'departmentId', value)
                          }
                          isDisabled={submitting}
                        >
                          <SelectTrigger className="w-full">
                            <SelectInput placeholder="Select department" />
                            <SelectIcon className="mr-3" />
                          </SelectTrigger>
                          <SelectPortal>
                            <SelectBackdrop />
                            <SelectContent>
                              <SelectDragIndicatorWrapper>
                                <SelectDragIndicator />
                              </SelectDragIndicatorWrapper>
                              {DEPARTMENTS.map((dept) => (
                                <SelectItem
                                  key={dept.id}
                                  label={dept.name}
                                  value={dept.id}
                                />
                              ))}
                            </SelectContent>
                          </SelectPortal>
                        </Select>
                      </VStack>

                      {/* Semester */}
                      <VStack space="xs">
                        <Text className="text-sm font-medium text-gray-700">
                          Semester *
                        </Text>
                        <Select
                          selectedValue={request.semester.toString()}
                          onValueChange={(value) =>
                            updateRequest(request.id, 'semester', parseInt(value))
                          }
                          isDisabled={submitting}
                        >
                          <SelectTrigger className="w-full">
                            <SelectInput placeholder="Select semester" />
                            <SelectIcon className="mr-3" />
                          </SelectTrigger>
                          <SelectPortal>
                            <SelectBackdrop />
                            <SelectContent>
                              <SelectDragIndicatorWrapper>
                                <SelectDragIndicator />
                              </SelectDragIndicatorWrapper>
                              {SEMESTERS.map((sem) => (
                                <SelectItem
                                  key={sem}
                                  label={`Semester ${sem}`}
                                  value={sem.toString()}
                                />
                              ))}
                            </SelectContent>
                          </SelectPortal>
                        </Select>
                      </VStack>

                      {/* Section */}
                      <VStack space="xs">
                        <Text className="text-sm font-medium text-gray-700">
                          Section *
                        </Text>
                        <Input>
                          <InputField
                            placeholder="e.g., A, B, C"
                            value={request.section}
                            onChangeText={(text) =>
                              updateRequest(request.id, 'section', text.toUpperCase())
                            }
                            autoCapitalize="characters"
                            editable={!submitting}
                            maxLength={2}
                          />
                        </Input>
                      </VStack>
                    </VStack>
                  </View>
                ))}
              </VStack>

              {/* Add More Button */}
              <Pressable
                onPress={addRequest}
                className="mt-4 p-4 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 active:bg-purple-100"
                disabled={submitting}
              >
                <HStack space="sm" className="items-center justify-center">
                  <Plus size={20} color="#7477FF" />
                  <Text className="font-semibold text-purple-600">
                    Add Another Course Request
                  </Text>
                </HStack>
              </Pressable>
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
              onPress={handleSubmit}
              disabled={!isValid || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ButtonText className="text-white">
                  Submit {requests.length > 1 ? `(${requests.length})` : ''} Request
                  {requests.length > 1 ? 's' : ''}
                </ButtonText>
              )}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default CourseRequestModal;
