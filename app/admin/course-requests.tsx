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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, ButtonText } from '@/components/ui/button';
import { Modal, ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Input, InputField } from '@/components/ui/input';
import { Pressable } from '@/components/ui/pressable';
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
      // Create course instance
      const courseInstanceRef = await addDoc(collection(db, COLLECTIONS.COURSE_INSTANCES), {
        courseId: '', // Will need to create course first or link to existing
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
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-4">
        <HStack className="justify-between items-center">
          <VStack space="xs">
            <Heading size="lg" className="text-black">
              Course Requests
            </Heading>
            <Text className="text-sm text-gray-600">
              {requests.length} pending request{requests.length !== 1 ? 's' : ''}
            </Text>
          </VStack>
        </HStack>
      </View>

      {/* Requests List */}
      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <Alert action="error" className="mb-4">
            <AlertIcon as={AlertCircle} />
            <AlertText>{error}</AlertText>
          </Alert>
        )}

        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#7477FF" />
            <Text className="mt-4 text-gray-500">Loading requests...</Text>
          </View>
        ) : requests.length === 0 ? (
          <View className="py-12 items-center">
            <CheckCircle size={64} color="#C5D4CA" />
            <Text className="mt-4 text-gray-500 text-lg text-center">
              No pending course requests
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-2">
              All course requests have been reviewed
            </Text>
          </View>
        ) : (
          <VStack space="md" className="pb-8">
            {requests.map((request) => (
              <Card key={request.id} variant="outline" className="p-4">
                <VStack space="md">
                  {/* Header */}
                  <HStack className="justify-between items-start">
                    <VStack className="flex-1" space="xs">
                      <HStack space="sm" className="items-center">
                        <BookOpen size={18} color="#7477FF" />
                        <Text className="font-semibold text-black flex-1" numberOfLines={2}>
                          {request.courseName}
                        </Text>
                      </HStack>
                      <Text className="text-sm text-gray-500">
                        {getDepartmentNameById(request.departmentId)}
                      </Text>
                    </VStack>
                    <Badge variant="outline" className="bg-yellow-50 border-yellow-300">
                      <Text className="text-xs text-yellow-700">Pending</Text>
                    </Badge>
                  </HStack>

                  {/* Details */}
                  <HStack space="md" className="flex-wrap">
                    <View className="bg-gray-100 px-3 py-1 rounded-full">
                      <Text className="text-sm text-gray-700">
                        Semester {request.semester}
                      </Text>
                    </View>
                    <View className="bg-gray-100 px-3 py-1 rounded-full">
                      <Text className="text-sm text-gray-700">
                        Section {request.section}
                      </Text>
                    </View>
                  </HStack>

                  {/* Teacher Info */}
                  <HStack space="sm" className="items-center">
                    <User size={16} color="#77867D" />
                    <Text className="text-sm text-gray-600">
                      {request.teacherName}
                    </Text>
                    {request.teacherEmail && (
                      <Text className="text-sm text-gray-400">
                        ({request.teacherEmail})
                      </Text>
                    )}
                  </HStack>

                  {/* Requested Date */}
                  <HStack space="sm" className="items-center">
                    <Clock size={14} color="#C5D4CA" />
                    <Text className="text-xs text-gray-400">
                      Requested on {formatDate(request.requestedAt)}
                    </Text>
                  </HStack>

                  {/* Action Buttons */}
                  <HStack space="md" className="pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-red-300"
                      onPress={() => {
                        setSelectedRequest(request);
                        setIsRejectModalOpen(true);
                      }}
                      disabled={processing}
                    >
                      <ButtonText className="text-red-600">Reject</ButtonText>
                    </Button>
                    <Button
                      className="flex-1 bg-purple-500"
                      onPress={() => handleApprove(request)}
                      disabled={processing}
                    >
                      <ButtonText className="text-white">Approve</ButtonText>
                    </Button>
                  </HStack>
                </VStack>
              </Card>
            ))}
          </VStack>
        )}
      </ScrollView>

      {/* Reject Modal */}
      <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} size="md">
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Heading size="md" className="text-black">
              Reject Course Request
            </Heading>
          </ModalHeader>
          <ModalBody>
            <Text className="text-gray-600 mb-4">
              Are you sure you want to reject the course request for "{selectedRequest?.courseName}"?
            </Text>
            <VStack space="xs">
              <Text className="text-sm font-medium text-gray-700">
                Reason (optional)
              </Text>
              <Input>
                <InputField
                  placeholder="Enter reason for rejection..."
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  multiline
                  numberOfLines={3}
                />
              </Input>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack space="md" className="w-full">
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => setIsRejectModalOpen(false)}
                disabled={processing}
              >
                <ButtonText>Cancel</ButtonText>
              </Button>
              <Button
                className="flex-1 bg-red-500"
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
