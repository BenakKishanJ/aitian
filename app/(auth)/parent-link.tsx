import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import {
  ArrowLeft,
  User,
  Mail,
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Users,
  AlertCircle,
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import {
  doc,
  setDoc,
  serverTimestamp,
  query,
  collection,
  where,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Alert as RNAlert } from 'react-native';


/* Gluestack UI (local re-exports) */

// Layout
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { Box } from '@/components/ui/box'
import { ScrollView } from '@/components/ui/scroll-view'

// Typography
import { Text } from '@/components/ui/text'
import { Heading } from '@/components/ui/heading'

// Button
import { Button, ButtonText } from '@/components/ui/button'

// Input
import { Input, InputField } from '@/components/ui/input'

// Form Control
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control'

// Alert
import {
  Alert,
  AlertIcon,
  AlertText,
} from '@/components/ui/alert'


export default function ParentLinkScreen() {
  const { userData, role, loading: authLoading } = useAuth();
  const [searchUSN, setSearchUSN] = useState('');
  const [searching, setSearching] = useState(false);
  const [studentFound, setStudentFound] = useState<any>(null);
  const [studentError, setStudentError] = useState('');
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [approvedLinks, setApprovedLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load parent links based on role
  useEffect(() => {
    if (!userData?.uid) return;

    if (role === 'parent') {
      // Load parent's pending requests and approved links
      const parentId = userData.uid;

      // Pending requests (sent by this parent)
      const pendingQuery = query(
        collection(db, 'parentLinks'),
        where('parentId', '==', parentId),
        where('status', '==', 'pending')
      );

      const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPendingRequests(requests);
      });

      // Approved links
      const approvedQuery = query(
        collection(db, 'parentLinks'),
        where('parentId', '==', parentId),
        where('status', '==', 'approved')
      );

      const unsubscribeApproved = onSnapshot(approvedQuery, (snapshot) => {
        const links = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setApprovedLinks(links);
      });

      return () => {
        unsubscribePending();
        unsubscribeApproved();
      };
    } else if (role === 'student') {
      // Load student's pending requests
      const studentId = userData.uid;

      const pendingQuery = query(
        collection(db, 'parentLinks'),
        where('studentId', '==', studentId),
        where('status', '==', 'pending')
      );

      const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPendingRequests(requests);
      });

      // Load approved links
      const approvedQuery = query(
        collection(db, 'parentLinks'),
        where('studentId', '==', studentId),
        where('status', '==', 'approved')
      );

      const unsubscribeApproved = onSnapshot(approvedQuery, (snapshot) => {
        const links = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setApprovedLinks(links);
      });

      return () => {
        unsubscribePending();
        unsubscribeApproved();
      };
    }
  }, [userData?.uid, role]);

  const searchStudent = async () => {
    const usn = searchUSN.trim().toUpperCase();
    if (!usn || usn.length < 3) {
      setStudentFound(null);
      setStudentError('Please enter a valid USN');
      return;
    }

    setSearching(true);
    setStudentError('');

    try {
      // Search for student by USN
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('role', '==', 'student'),
        where('usn', '>=', usn),
        where('usn', '<=', usn + '\uf8ff')
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setStudentFound(null);
        setStudentError('No student found with this USN');
      } else {
        const studentDoc = querySnapshot.docs[0];
        const studentData = studentDoc.data();

        // Check if already linked
        const existingLink = approvedLinks.find(link => link.studentId === studentDoc.id);
        if (existingLink) {
          setStudentError('Already linked to this student');
          setStudentFound(null);
        } else {
          setStudentFound({
            id: studentDoc.id,
            ...studentData,
          });
          setStudentError('');
        }
      }
    } catch (error) {
      console.error('Error searching student:', error);
      setStudentError('Error searching for student');
      setStudentFound(null);
    } finally {
      setSearching(false);
    }
  };

  const sendLinkRequest = async () => {
    if (!studentFound || !userData) return;

    setLoading(true);
    try {
      const linkId = `${userData.uid}_${studentFound.id}`;

      await setDoc(doc(db, 'parentLinks', linkId), {
        parentId: userData.uid,
        parentName: userData.name,
        studentId: studentFound.id,
        studentName: studentFound.name,
        studentUSN: studentFound.usn,
        status: 'pending',
        requestedAt: serverTimestamp(),
        approvedAt: null,
      });

      // Add notification to student
      await setDoc(doc(db, 'notifications', `${studentFound.id}_parent_${Date.now()}`), {
        userId: studentFound.id,
        type: 'parent_link_request',
        title: 'Parent Link Request',
        message: `${userData.name} wants to link with your account`,
        data: {
          parentId: userData.uid,
          parentName: userData.name,
          linkId: linkId,
        },
        isRead: false,
        createdAt: serverTimestamp(),
      });

      RNAlert.alert(
        'Request Sent',
        `Link request sent to ${studentFound.name}. They need to approve it.`
      );

      setStudentFound(null);
      setSearchUSN('');
    } catch (error) {
      RNAlert.alert('Error', 'Failed to send request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (linkId: string, parentName: string) => {
    setLoading(true);
    try {
      // Update link status
      await updateDoc(doc(db, 'parentLinks', linkId), {
        status: 'approved',
        approvedAt: serverTimestamp(),
      });

      // Update parent's linkedStudentIds
      const linkDoc = await getDocs(query(
        collection(db, 'parentLinks'),
        where('__name__', '==', linkId)
      ));

      const linkData = linkDoc.docs[0]?.data();
      if (linkData) {
        const parentRef = doc(db, 'users', linkData.parentId);
        const parentSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', linkData.parentId)));
        const parentData = parentSnap.docs[0]?.data();

        if (parentData) {
          const updatedLinks = [...(parentData.linkedStudentIds || []), userData?.uid];
          await updateDoc(parentRef, {
            linkedStudentIds: updatedLinks,
            pendingStudentIds: (parentData.pendingStudentIds || []).filter((id: string) => id !== userData?.uid),
          });
        }
      }

      RNAlert.alert('Approved', `You are now linked with ${parentName}`);
    } catch (error) {
      RNAlert.alert('Error', 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (linkId: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'parentLinks', linkId));
      RNAlert.alert('Rejected', 'Link request rejected');
    } catch (error) {
      RNAlert.alert('Error', 'Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeLink = async (linkId: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'parentLinks', linkId));

      // Also remove from parent's linkedStudentIds
      const linkDoc = await getDocs(query(
        collection(db, 'parentLinks'),
        where('__name__', '==', linkId)
      ));

      const linkData = linkDoc.docs[0]?.data();
      if (linkData) {
        const parentRef = doc(db, 'users', linkData.parentId);
        const parentSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', linkData.parentId)));
        const parentData = parentSnap.docs[0]?.data();

        if (parentData) {
          const updatedLinks = (parentData.linkedStudentIds || []).filter((id: string) => id !== userData?.uid);
          await updateDoc(parentRef, {
            linkedStudentIds: updatedLinks,
          });
        }
      }

      RNAlert.alert('Revoked', 'Link has been revoked');
    } catch (error) {
      RNAlert.alert('Error', 'Failed to revoke link');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Box className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </Box>
    );
  }

  // Redirect if not parent or student
  if (role !== 'parent' && role !== 'student') {
    router.replace('/(tabs)/home');
    return null;
  }

  const isParent = role === 'parent';
  const isStudent = role === 'student';

  return (
    <Box className="flex-1 bg-white">
      {/* Header */}
      <HStack className="items-center p-6 border-b border-gray-200">
        <Button variant="link" size="sm" onPress={() => router.back()}>
          <ArrowLeft size={20} color="#6B7280" />
        </Button>
        <Heading size="xl" className="flex-1 text-center text-gray-900">
          {isParent ? 'Manage Student Links' : 'Parent Link Requests'}
        </Heading>
        <Box className="w-10" />
      </HStack>

      <ScrollView className="flex-1">
        <VStack className="p-6" space="lg">
          {/* Parent: Search for student */}
          {isParent && (
            <VStack space="md">
              <Heading size="lg" className="text-gray-900">
                Link to New Student
              </Heading>

              <VStack className="bg-blue-50 p-4 rounded-lg" space="sm">
                <HStack className="items-center" space="sm">
                  <Users size={20} color="#3B82F6" />
                  <Text className="font-semibold text-blue-800">
                    You can link to maximum 5 students
                  </Text>
                </HStack>
                <Text className="text-blue-700 text-sm">
                  Current: {approvedLinks.length}/5 linked
                </Text>
              </VStack>

              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText className="text-gray-700">
                    Search Student by USN
                  </FormControlLabelText>
                </FormControlLabel>
                <HStack space="sm">
                  <Input className="flex-1">
                    <Box className="mr-3">
                      <Search size={20} color="#6B7280" />
                    </Box>
                    <InputField
                      placeholder="Enter student USN (e.g., 1DA22CS021)"
                      value={searchUSN}
                      onChangeText={setSearchUSN}
                    />
                  </Input>
                  <Button
                    onPress={searchStudent}
                    isDisabled={searching || approvedLinks.length >= 5}
                    className={`${approvedLinks.length >= 5 ? 'bg-gray-400' : 'bg-blue-500'}`}
                  >
                    <ButtonText className="text-white">
                      {searching ? '...' : 'Search'}
                    </ButtonText>
                  </Button>
                </HStack>
                {studentError && (
                  <HStack className="mt-1 items-center" space="xs">
                    <AlertCircle size={14} color="#EF4444" />
                    <Text className="text-red-500 text-sm">{studentError}</Text>
                  </HStack>
                )}
              </FormControl>

              {/* Student Found Preview */}
              {studentFound && (
                <Alert className="bg-green-50 border border-green-200">
                  <AlertIcon as={CheckCircle} className="text-green-500" />
                  <AlertText className="text-green-800">
                    <Text className="font-semibold">{studentFound.name}</Text>
                    {'\n'}
                    <Text className="text-green-700">
                      {studentFound.usn} • {studentFound.department}
                      {'\n'}
                      Semester {studentFound.semester} • Section {studentFound.section}
                    </Text>
                  </AlertText>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={sendLinkRequest}
                    isDisabled={loading}
                    className="mt-2 border-green-300"
                  >
                    <ButtonText className="text-green-700">
                      {loading ? 'Sending...' : 'Send Link Request'}
                    </ButtonText>
                  </Button>
                </Alert>
              )}
            </VStack>
          )}

          {/* Pending Requests */}
          {(pendingRequests.length > 0) && (
            <VStack space="md">
              <Heading size="lg" className="text-gray-900">
                {isParent ? 'Pending Requests' : 'Parent Requests'}
              </Heading>

              {pendingRequests.map((request) => (
                <Box key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <HStack className="items-start justify-between">
                    <VStack space="xs" className="flex-1">
                      <HStack className="items-center" space="sm">
                        <Clock size={16} color="#F59E0B" />
                        <Text className="font-semibold text-gray-900">
                          {isParent ? request.studentName : request.parentName}
                        </Text>
                      </HStack>
                      <Text className="text-gray-600 text-sm">
                        {isParent ? `USN: ${request.studentUSN}` : `Parent Email: ${request.parentEmail || 'No email'}`}
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        Requested {new Date(request.requestedAt?.toDate()).toLocaleDateString()}
                      </Text>
                    </VStack>

                    {isStudent && (
                      <HStack space="sm">
                        <Button
                          size="sm"
                          onPress={() => handleRejectRequest(request.id)}
                          isDisabled={loading}
                          className="bg-red-100"
                        >
                          <XCircle size={16} color="#EF4444" />
                        </Button>
                        <Button
                          size="sm"
                          onPress={() => handleApproveRequest(request.id, request.parentName)}
                          isDisabled={loading}
                          className="bg-green-100"
                        >
                          <CheckCircle size={16} color="#10B981" />
                        </Button>
                      </HStack>
                    )}
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}

          {/* Approved Links */}
          {(approvedLinks.length > 0) && (
            <VStack space="md">
              <Heading size="lg" className="text-gray-900">
                {isParent ? 'Linked Students' : 'Linked Parents'}
              </Heading>

              {approvedLinks.map((link) => (
                <Box key={link.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <HStack className="items-start justify-between">
                    <VStack space="xs" className="flex-1">
                      <HStack className="items-center" space="sm">
                        <CheckCircle size={16} color="#10B981" />
                        <Text className="font-semibold text-gray-900">
                          {isParent ? link.studentName : link.parentName}
                        </Text>
                      </HStack>
                      <Text className="text-gray-600 text-sm">
                        {isParent ? `USN: ${link.studentUSN}` : `Linked since ${new Date(link.approvedAt?.toDate()).toLocaleDateString()}`}
                      </Text>
                      {isParent && (
                        <Text className="text-gray-500 text-xs">
                          {link.studentDepartment} • Sem {link.studentSemester}
                        </Text>
                      )}
                    </VStack>

                    <Button
                      variant="link"
                      size="sm"
                      onPress={() => handleRevokeLink(link.id)}
                      isDisabled={loading}
                    >
                      <ButtonText className="text-red-500">Revoke</ButtonText>
                    </Button>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}

          {/* Empty States */}
          {pendingRequests.length === 0 && approvedLinks.length === 0 && (
            <VStack className="items-center justify-center py-12" space="md">
              <Box className="p-6 rounded-full bg-gray-100">
                <Users size={48} color="#9CA3AF" />
              </Box>
              <Text className="text-gray-500 text-center">
                {isParent
                  ? 'No linked students yet. Search for a student to link.'
                  : 'No parent link requests yet.'}
              </Text>
            </VStack>
          )}

          {/* Info for Parents */}
          {isParent && (
            <VStack className="bg-gray-50 p-4 rounded-lg" space="sm">
              <Text className="font-semibold text-gray-800">How it works:</Text>
              <VStack space="xs" className="pl-1">
                <Text className="text-gray-700 text-sm">
                  1. Search and send request to student
                </Text>
                <Text className="text-gray-700 text-sm">
                  2. Student receives notification
                </Text>
                <Text className="text-gray-700 text-sm">
                  3. Student approves or rejects request
                </Text>
                <Text className="text-gray-700 text-sm">
                  4. Once approved, you can view their academic progress
                </Text>
              </VStack>
            </VStack>
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
}
