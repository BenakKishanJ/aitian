import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, Clock, User, BookOpen, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/lib/AuthContext';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Button, ButtonText } from '@/components/ui/button';
import { Modal, ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Input, InputField } from '@/components/ui/input';
import { Alert, AlertIcon, AlertText } from '@/components/ui/alert';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CourseRequest, COLLECTIONS, DepartmentId } from '@/types';
import { getDepartmentNameById } from '@/types/constants';

interface RequestWithTeacher extends CourseRequest {
  teacherEmail?: string;
}

export default function CourseRequestsScreen() {
  const { user, userData } = useAuth();
  const [requests, setRequests] = useState<RequestWithTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RequestWithTeacher | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchRequests = async () => {
    try {
      setError(null);
      const requestsRef = collection(db, COLLECTIONS.COURSE_REQUESTS);
      const requestsQuery = query(
        requestsRef,
        where('status', '==', 'pending')
      );

      const requestsSnap = await getDocs(requestsQuery);
      const requestsList: RequestWithTeacher[] = [];

      for (const docSnap of requestsSnap.docs) {
        const request = { id: docSnap.id, ...docSnap.data() } as RequestWithTeacher;
        
        // Fetch teacher email
        try {
          const teacherDoc = await getDoc(doc(db, COLLECTIONS.USERS, request.teacherId));
          if (teacherDoc.exists()) {
            request.teacherEmail = teacherDoc.data().email;
          }
        } catch (err) {
          console.error('Error fetching teacher:', err);
        }

        requestsList.push(request);
      }

      // Sort by requestedAt (oldest first)
      requestsList.sort((a, b) => {
        return a.requestedAt.toMillis() - b.requestedAt.toMillis();
      });

      setRequests(requestsList);
    } catch (err: any) {
      console.error('Error fetching course requests:', err);
      setError(err.message || 'Failed to fetch course requests');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

  const handleApprove = async (request: RequestWithTeacher) => {
    if (!user) return;

    setProcessing(true);
    try {
      // First, check if a course with this name already exists
      const coursesRef = collection(db, COLLECTIONS.COURSES);
      const existingCourseQuery = query(
        coursesRef,
        where('name', '==', request.courseName),
        where('departmentId', '==', request.departmentId),
        where('semester', '==', request.semester)
      );
      const existingCourseSnap = await getDocs(existingCourseQuery);

      let courseId: string;

      if (!existingCourseSnap.empty) {
        // Use existing course
        courseId = existingCourseSnap.docs[0].id;
      } else {
        // Create a new course
        const courseRef = await addDoc(collection(db, COLLECTIONS.COURSES), {
          courseCode: 'TEMP-' + Date.now(), // Temporary code, admin should update
          name: request.courseName,
          departmentId: request.departmentId,
          semester: request.semester,
          credits: 0, // Should be set by admin
          isElective: false,
          metadata: {
            description: `Course requested by ${request.teacherName}. Please update course code and credits.`,
          },
          createdBy: user.uid,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        courseId = courseRef.id;
      }

      // Create course instance with proper courseId
      const courseInstanceRef = await addDoc(collection(db, COLLECTIONS.COURSE_INSTANCES), {
        courseId: courseId,
        departmentId: request.departmentId,
        semester: request.semester,
        section: request.section,
        teacherIds: [request.teacherId],
        enrollmentType: 'core',
        isActive: true,
        academicYear: new Date().getFullYear().toString(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Update request status
      const requestRef = doc(db, COLLECTIONS.COURSE_REQUESTS, request.id);
      await updateDoc(requestRef, {
        status: 'approved',
        reviewedAt: Timestamp.now(),
        reviewedBy: user.uid,
        createdCourseInstanceId: courseInstanceRef.id,
      });

      // Update teacher's approved course IDs
      const teacherRef = doc(db, COLLECTIONS.USERS, request.teacherId);
      const teacherDoc = await getDoc(teacherRef);
      if (teacherDoc.exists()) {
        const currentApproved = teacherDoc.data().approvedCourseIds || [];
        const currentPending = teacherDoc.data().pendingCourseIds || [];

        await updateDoc(teacherRef, {
          approvedCourseIds: [...currentApproved, courseInstanceRef.id],
          pendingCourseIds: currentPending.filter((id: string) => id !== request.id),
          updatedAt: Timestamp.now(),
        });
      }

      // Remove from list
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      setSelectedRequest(null);
    } catch (err: any) {
      console.error('Error approving request:', err);
      setError(err.message || 'Failed to approve request');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!user || !selectedRequest) return;

    setProcessing(true);
    try {
      // Update request status
      const requestRef = doc(db, COLLECTIONS.COURSE_REQUESTS, selectedRequest.id);
      await updateDoc(requestRef, {
        status: 'rejected',
        reviewedAt: Timestamp.now(),
        reviewedBy: user.uid,
        rejectionReason: rejectionReason || 'Request rejected by admin',
      });

      // Update teacher's pending course IDs
      const teacherRef = doc(db, COLLECTIONS.USERS, selectedRequest.teacherId);
      const teacherDoc = await getDoc(teacherRef);
      if (teacherDoc.exists()) {
        const currentPending = teacherDoc.data().pendingCourseIds || [];
        
        await updateDoc(teacherRef, {
          pendingCourseIds: currentPending.filter((id: string) => id !== selectedRequest.id),
          updatedAt: Timestamp.now(),
        });
      }

      // Remove from list
      setRequests((prev) => prev.filter((r) => r.id !== selectedRequest.id));
      setIsRejectModalOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      setError(err.message || 'Failed to reject request');
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchRequests().then(() => setLoading(false));
  }, []);

  const formatDate = (timestamp: Timestamp): string => {
    return timestamp.toDate().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#1C1C1E]">
      {/* Header */}
      <View className="px-6 pt-4 pb-4">
        <HStack className="justify-between items-center">
          <VStack space="xs">
            <Text className="text-white text-2xl font-bold">Course Requests</Text>
            <Text className="text-[#C5D4CA] text-sm">
              {requests.length} pending request{requests.length !== 1 ? 's' : ''}
            </Text>
          </VStack>
        </HStack>
      </View>

      {/* Requests List */}
      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="pb-8"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#BCF3FF"
            colors={["#BCF3FF"]}
          />
        }
      >
        {error && (
          <View className="bg-[#F96857]/10 border border-[#F96857]/30 rounded-2xl p-4 mb-4">
            <HStack space="sm" className="items-center">
              <Icon as={AlertCircle} size="sm" className="text-[#F96857]" />
              <Text className="text-[#F96857] flex-1">{error}</Text>
            </HStack>
          </View>
        )}

        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#BCF3FF" />
            <Text className="mt-4 text-[#C5D4CA]">Loading requests...</Text>
          </View>
        ) : requests.length === 0 ? (
          <View className="py-16 items-center">
            <View className="w-20 h-20 rounded-full bg-[#2A2A2D] items-center justify-center mb-4">
              <Icon as={CheckCircle} size="xl" className="text-[#3C443F]" />
            </View>
            <Text className="text-white text-lg font-semibold mb-2">
              No pending requests
            </Text>
            <Text className="text-[#6B7280] text-sm text-center">
              All course requests have been reviewed
            </Text>
          </View>
        ) : (
          <VStack space="md">
            {requests.map((request) => (
              <View
                key={request.id}
                className="bg-[#2A2A2D] rounded-2xl p-5"
              >
                <VStack space="md">
                  {/* Header */}
                  <HStack className="justify-between items-start">
                    <VStack className="flex-1" space="xs">
                      <HStack space="sm" className="items-center">
                        <View className="w-10 h-10 rounded-xl bg-[#7477FF]/15 items-center justify-center">
                          <Icon as={BookOpen} size="sm" className="text-[#7477FF]" />
                        </View>
                        <Text className="text-white font-semibold flex-1" numberOfLines={2}>
                          {request.courseName}
                        </Text>
                      </HStack>
                      <Text className="text-sm text-[#6B7280] ml-12">
                        {getDepartmentNameById(request.departmentId)}
                      </Text>
                    </VStack>
                    <View className="bg-[#F9CD61]/15 px-3 py-1 rounded-full">
                      <Text className="text-xs text-[#F9CD61] font-semibold">Pending</Text>
                    </View>
                  </HStack>

                  {/* Details */}
                  <HStack space="sm" className="flex-wrap ml-12">
                    <View className="bg-[#1C1C1E] px-3 py-1.5 rounded-lg">
                      <Text className="text-sm text-[#C5D4CA]">
                        Semester {request.semester}
                      </Text>
                    </View>
                    <View className="bg-[#1C1C1E] px-3 py-1.5 rounded-lg">
                      <Text className="text-sm text-[#C5D4CA]">
                        Section {request.section}
                      </Text>
                    </View>
                  </HStack>

                  {/* Teacher Info */}
                  <HStack space="sm" className="items-center ml-12">
                    <Icon as={User} size="sm" className="text-[#6B7280]" />
                    <Text className="text-sm text-[#C5D4CA]">
                      {request.teacherName}
                    </Text>
                    {request.teacherEmail && (
                      <Text className="text-sm text-[#6B7280]">
                        ({request.teacherEmail})
                      </Text>
                    )}
                  </HStack>

                  {/* Requested Date */}
                  <HStack space="sm" className="items-center ml-12">
                    <Icon as={Clock} size="xs" className="text-[#6B7280]" />
                    <Text className="text-xs text-[#6B7280]">
                      Requested on {formatDate(request.requestedAt)}
                    </Text>
                  </HStack>

                  {/* Action Buttons */}
                  <HStack space="md" className="pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-[#F96857]/50 bg-transparent"
                      onPress={() => {
                        setSelectedRequest(request);
                        setIsRejectModalOpen(true);
                      }}
                      disabled={processing}
                    >
                      <ButtonText className="text-[#F96857]">Reject</ButtonText>
                    </Button>
                    <Button
                      className="flex-1 bg-[#BCF3FF]"
                      onPress={() => handleApprove(request)}
                      disabled={processing}
                    >
                      <ButtonText className="text-[#232323]">Approve</ButtonText>
                    </Button>
                  </HStack>
                </VStack>
              </View>
            ))}
          </VStack>
        )}
      </ScrollView>

      {/* Reject Modal */}
      <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} size="md">
        <ModalBackdrop />
        <ModalContent className="bg-[#2A2A2D]">
          <ModalHeader>
            <Heading size="md" className="text-white">
              Reject Course Request
            </Heading>
          </ModalHeader>
          <ModalBody>
            <Text className="text-[#C5D4CA] mb-4">
              Are you sure you want to reject the course request for "{selectedRequest?.courseName}"?
            </Text>
            <VStack space="xs">
              <Text className="text-sm font-medium text-[#C5D4CA]">
                Reason (optional)
              </Text>
              <Input className="bg-[#1C1C1E] border-[#3C443F] rounded-xl">
                <InputField
                  placeholder="Enter reason for rejection..."
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  multiline
                  numberOfLines={3}
                  className="text-white"
                  placeholderTextColor="#6B7280"
                />
              </Input>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack space="md" className="w-full">
              <Button
                variant="outline"
                className="flex-1 border-[#3C443F]"
                onPress={() => setIsRejectModalOpen(false)}
                disabled={processing}
              >
                <ButtonText className="text-[#C5D4CA]">Cancel</ButtonText>
              </Button>
              <Button
                className="flex-1 bg-[#F96857]"
                onPress={handleReject}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ButtonText className="text-white">Reject</ButtonText>
                )}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </SafeAreaView>
  );
}
