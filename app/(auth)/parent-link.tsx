import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Alert as RNAlert } from "react-native";
import { router } from "expo-router";
import {
  ArrowLeft,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Users,
  AlertCircle,
} from "lucide-react-native";
import { useAuth } from "@/lib/AuthContext";
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
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/* Gluestack UI components */
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { ScrollView } from "@/components/ui/scroll-view";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Icon } from "@/components/ui/icon";

export default function ParentLinkScreen() {
  const { userData, role, loading: authLoading } = useAuth();
  const [searchUSN, setSearchUSN] = useState("");
  const [searching, setSearching] = useState(false);
  const [studentFound, setStudentFound] = useState<any>(null);
  const [studentError, setStudentError] = useState("");
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [approvedLinks, setApprovedLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userData?.uid) return;

    if (role === "parent") {
      const parentId = userData.uid;
      const pendingQuery = query(
        collection(db, "parentLinks"),
        where("parentId", "==", parentId),
        where("status", "==", "pending"),
      );

      const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
        const requests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPendingRequests(requests);
      });

      const approvedQuery = query(
        collection(db, "parentLinks"),
        where("parentId", "==", parentId),
        where("status", "==", "approved"),
      );

      const unsubscribeApproved = onSnapshot(approvedQuery, (snapshot) => {
        const links = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setApprovedLinks(links);
      });

      return () => {
        unsubscribePending();
        unsubscribeApproved();
      };
    } else if (role === "student") {
      const studentId = userData.uid;
      const pendingQuery = query(
        collection(db, "parentLinks"),
        where("studentId", "==", studentId),
        where("status", "==", "pending"),
      );

      const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
        const requests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPendingRequests(requests);
      });

      const approvedQuery = query(
        collection(db, "parentLinks"),
        where("studentId", "==", studentId),
        where("status", "==", "approved"),
      );

      const unsubscribeApproved = onSnapshot(approvedQuery, (snapshot) => {
        const links = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
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
    if (!searchUSN.trim()) {
      setStudentError("Please enter a student USN");
      return;
    }

    setSearching(true);
    setStudentError("");

    try {
      const usn = searchUSN.toUpperCase();
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("role", "==", "student"),
        where("usn", "==", usn),
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setStudentError("Student not found");
        setStudentFound(null);
        return;
      }

      const studentDoc = querySnapshot.docs[0];
      const studentData = studentDoc.data();

      const existingLink = approvedLinks.find(
        (link) => link.studentId === studentDoc.id,
      );

      if (existingLink) {
        setStudentError("You are already linked with this student");
        setStudentFound(null);
        return;
      }

      setStudentFound({
        id: studentDoc.id,
        ...studentData,
      });
    } catch (error) {
      setStudentError("Error searching for student");
    } finally {
      setSearching(false);
    }
  };

  const sendLinkRequest = async () => {
    if (!studentFound) return;

    setLoading(true);
    try {
      const linkId = doc(collection(db, "parentLinks")).id;

      await setDoc(doc(db, "parentLinks", linkId), {
        parentId: userData?.uid,
        parentName: userData?.name,
        parentEmail: userData?.email,
        studentId: studentFound.id,
        studentName: studentFound.name,
        studentUSN: studentFound.usn,
        studentDepartment: studentFound.department,
        studentSemester: studentFound.semester,
        status: "pending",
        requestedAt: serverTimestamp(),
        approvedAt: null,
      });

      setStudentFound(null);
      setSearchUSN("");
      RNAlert.alert("Success", "Link request sent to student");
    } catch (error) {
      RNAlert.alert("Error", "Failed to send link request");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (linkId: string, parentName: string) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "parentLinks", linkId), {
        status: "approved",
        approvedAt: serverTimestamp(),
      });
      RNAlert.alert("Success", `Approved link request from ${parentName}`);
    } catch (error) {
      RNAlert.alert("Error", "Failed to approve request");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (linkId: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, "parentLinks", linkId));
      RNAlert.alert("Success", "Request rejected");
    } catch (error) {
      RNAlert.alert("Error", "Failed to reject request");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeLink = async (linkId: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, "parentLinks", linkId));
      RNAlert.alert("Success", "Link revoked");
    } catch (error) {
      RNAlert.alert("Error", "Failed to revoke link");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#1C1C1E]">
        <Text className="text-[#C5D4CA]">Loading...</Text>
      </View>
    );
  }

  if (role !== "parent" && role !== "student") {
    router.replace("/(tabs)");
    return null;
  }

  const isParent = role === "parent";
  const isStudent = role === "student";

  return (
    <View className="flex-1 bg-[#D1E7EF]">
      {/* Header */}
      <HStack className="items-center p-6 bg-[#1C1C1E] border-b border-[#2A2A2D]">
        <TouchableOpacity onPress={() => router.back()}>
          <Icon as={ArrowLeft} size="lg" className="text-[#C5D4CA]" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-white text-xl font-bold">
          {isParent ? "Manage Student Links" : "Parent Link Requests"}
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon as={X} size="lg" className="text-[#C5D4CA]" />
        </TouchableOpacity>
      </HStack>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ backgroundColor: "#D1E7EF", flexGrow: 1 }}
      >
        <View className="bg-[#1C1C1E] px-6 pt-8 pb-8">
          <VStack space="lg">
            {/* Parent: Search Section */}
            {isParent && (
              <VStack space="md">
                <Text className="text-white text-2xl font-bold">
                  Link to New Student
                </Text>

                <View
                  className="w-full p-4 rounded-2xl border-l-4"
                  style={{
                    backgroundColor: "#2A2A2D",
                    borderLeftColor: "#F9CD61",
                  }}
                >
                  <VStack space="sm">
                    <HStack className="items-center" space="sm">
                      <Icon as={Users} size="md" className="text-[#F9CD61]" />
                      <Text className="font-semibold text-white">
                        Link Limit
                      </Text>
                    </HStack>
                    <Text className="text-[#C5D4CA] text-sm">
                      You can link to maximum 5 students. Current:{" "}
                      {approvedLinks.length}/5 linked
                    </Text>
                  </VStack>
                </View>

                <FormControl>
                  <FormControlLabel>
                    <FormControlLabelText className="text-[#C5D4CA] font-medium mb-2">
                      Search Student by USN
                    </FormControlLabelText>
                  </FormControlLabel>
                  <HStack space="sm">
                    <Input
                      className="flex-1 bg-[#2A2A2D] rounded-lg border-0"
                      size="lg"
                    >
                      <InputSlot className="pl-3">
                        <Icon
                          as={Search}
                          size="sm"
                          className="text-[#C5D4CA]"
                        />
                      </InputSlot>
                      <InputField
                        placeholder="e.g., 1DA22CS021"
                        value={searchUSN}
                        onChangeText={(val) => {
                          setSearchUSN(val);
                          if (studentError) setStudentError("");
                        }}
                        placeholderTextColor="#6B7280"
                        className="text-white"
                      />
                    </Input>
                    <Button
                      onPress={searchStudent}
                      disabled={searching || approvedLinks.length >= 5}
                      className={`rounded-lg disabled:opacity-60 ${
                        approvedLinks.length >= 5
                          ? "bg-[#6B7280]"
                          : "bg-[#F9CD61]"
                      }`}
                      size="lg"
                    >
                      <ButtonText className="text-black font-semibold">
                        {searching ? "..." : "Search"}
                      </ButtonText>
                    </Button>
                  </HStack>
                  {studentError && (
                    <HStack className="mt-1 items-center" space="xs">
                      <Icon
                        as={AlertCircle}
                        size="sm"
                        className="text-red-500"
                      />
                      <Text className="text-red-500 text-sm">
                        {studentError}
                      </Text>
                    </HStack>
                  )}
                </FormControl>

                {studentFound && (
                  <View
                    className="w-full p-4 rounded-2xl border-l-4"
                    style={{
                      backgroundColor: "#2A2A2D",
                      borderLeftColor: "#10B981",
                    }}
                  >
                    <VStack space="sm">
                      <HStack className="items-center justify-between">
                        <VStack space="xs">
                          <Text className="text-white font-semibold text-base">
                            {studentFound.name}
                          </Text>
                          <Text className="text-[#C5D4CA] text-sm">
                            {studentFound.usn} • {studentFound.department}
                          </Text>
                          <Text className="text-[#C5D4CA] text-xs">
                            Semester {studentFound.semester} • Section{" "}
                            {studentFound.section}
                          </Text>
                        </VStack>
                        <Icon
                          as={CheckCircle}
                          size="md"
                          className="text-[#10B981]"
                        />
                      </HStack>

                      <Button
                        onPress={sendLinkRequest}
                        disabled={loading}
                        className="bg-[#BCF3FF] rounded-lg disabled:opacity-60 mt-2"
                        size="lg"
                      >
                        <ButtonText className="text-black font-semibold">
                          {loading ? "Sending..." : "Send Link Request"}
                        </ButtonText>
                      </Button>
                    </VStack>
                  </View>
                )}
              </VStack>
            )}

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <VStack space="md">
                <Text className="text-sm font-semibold text-[#F9CD61] uppercase tracking-wider">
                  {isParent ? "Pending Requests" : "Parent Requests"}
                </Text>

                <VStack space="md">
                  {pendingRequests.map((request) => (
                    <View
                      key={request.id}
                      className="bg-[#2A2A2D] border-l-4 rounded-2xl p-4"
                      style={{ borderLeftColor: "#F9CD61" }}
                    >
                      <HStack className="items-start justify-between">
                        <VStack space="xs" className="flex-1">
                          <HStack className="items-center" space="sm">
                            <Icon
                              as={Clock}
                              size="sm"
                              className="text-[#F9CD61]"
                            />
                            <Text className="font-semibold text-white">
                              {isParent
                                ? request.studentName
                                : request.parentName}
                            </Text>
                          </HStack>
                          <Text className="text-[#C5D4CA] text-sm">
                            {isParent
                              ? `USN: ${request.studentUSN}`
                              : `Email: ${request.parentEmail || "N/A"}`}
                          </Text>
                          <Text className="text-[#C5D4CA] text-xs">
                            Requested{" "}
                            {new Date(
                              request.requestedAt?.toDate?.() || new Date(),
                            ).toLocaleDateString()}
                          </Text>
                        </VStack>

                        {isStudent && (
                          <HStack space="sm">
                            <TouchableOpacity
                              onPress={() => handleRejectRequest(request.id)}
                              disabled={loading}
                              className="p-2 rounded-lg bg-[#1C1C1E]"
                            >
                              <Icon
                                as={XCircle}
                                size="md"
                                className="text-red-500"
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() =>
                                handleApproveRequest(
                                  request.id,
                                  request.parentName,
                                )
                              }
                              disabled={loading}
                              className="p-2 rounded-lg bg-[#1C1C1E]"
                            >
                              <Icon
                                as={CheckCircle}
                                size="md"
                                className="text-[#10B981]"
                              />
                            </TouchableOpacity>
                          </HStack>
                        )}
                      </HStack>
                    </View>
                  ))}
                </VStack>
              </VStack>
            )}

            {/* Approved Links */}
            {approvedLinks.length > 0 && (
              <VStack space="md">
                <Text className="text-sm font-semibold text-[#BCF3FF] uppercase tracking-wider">
                  {isParent ? "Linked Students" : "Linked Parents"}
                </Text>

                <VStack space="md">
                  {approvedLinks.map((link) => (
                    <View
                      key={link.id}
                      className="bg-[#2A2A2D] border-l-4 rounded-2xl p-4"
                      style={{ borderLeftColor: "#10B981" }}
                    >
                      <HStack className="items-start justify-between">
                        <VStack space="xs" className="flex-1">
                          <HStack className="items-center" space="sm">
                            <Icon
                              as={CheckCircle}
                              size="sm"
                              className="text-[#10B981]"
                            />
                            <Text className="font-semibold text-white">
                              {isParent ? link.studentName : link.parentName}
                            </Text>
                          </HStack>
                          <Text className="text-[#C5D4CA] text-sm">
                            {isParent
                              ? `USN: ${link.studentUSN}`
                              : `Linked since ${new Date(link.approvedAt?.toDate?.() || new Date()).toLocaleDateString()}`}
                          </Text>
                          {isParent && (
                            <Text className="text-[#C5D4CA] text-xs">
                              {link.studentDepartment} • Sem{" "}
                              {link.studentSemester}
                            </Text>
                          )}
                        </VStack>

                        <TouchableOpacity
                          onPress={() => handleRevokeLink(link.id)}
                          disabled={loading}
                        >
                          <Text className="text-red-500 font-semibold text-sm">
                            Revoke
                          </Text>
                        </TouchableOpacity>
                      </HStack>
                    </View>
                  ))}
                </VStack>
              </VStack>
            )}

            {/* Empty State */}
            {pendingRequests.length === 0 && approvedLinks.length === 0 && (
              <VStack className="items-center justify-center py-12" space="md">
                <Box
                  className="p-6 rounded-full"
                  style={{ backgroundColor: "#2A2A2D" }}
                >
                  <Icon as={Users} size="xl" className="text-[#C5D4CA]" />
                </Box>
                <Text className="text-[#C5D4CA] text-center text-base">
                  {isParent
                    ? "No linked students yet. Search for a student to link."
                    : "No parent link requests yet."}
                </Text>
              </VStack>
            )}

            {/* Info Box for Parents */}
            {isParent && (
              <View
                className="w-full p-4 rounded-2xl border-l-4"
                style={{
                  backgroundColor: "#2A2A2D",
                  borderLeftColor: "#BCF3FF",
                }}
              >
                <VStack space="sm">
                  <Text className="text-white font-semibold text-sm">
                    How it works:
                  </Text>
                  <VStack space="xs">
                    <Text className="text-[#C5D4CA] text-xs">
                      1. Search and send request to student
                    </Text>
                    <Text className="text-[#C5D4CA] text-xs">
                      2. Student receives notification
                    </Text>
                    <Text className="text-[#C5D4CA] text-xs">
                      3. Student approves or rejects request
                    </Text>
                    <Text className="text-[#C5D4CA] text-xs">
                      4. Once approved, you can view their academic progress
                    </Text>
                  </VStack>
                </VStack>
              </View>
            )}

            {/* Footer */}
            <View className="mt-4 pb-4">
              <Text className="text-center text-xs text-[#C5D4CA]">
                By continuing, you agree to our Terms and Privacy Policy
              </Text>
            </View>
          </VStack>
        </View>
      </ScrollView>
    </View>
  );
}
