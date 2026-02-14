import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Plus,
  ChevronLeft,
  Layers,
  Building2,
  GraduationCap,
  MoreVertical,
  Trash2,
  Edit3,
  BookOpen,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  COLLECTIONS,
  ELECTIVE_SLOT_TYPES,
  ElectiveSlotType,
  SEMESTERS,
} from "@/types/constants";
import type { ElectiveSlot, ElectiveSlotMapping } from "@/types";
import {
  getDepartmentNameById,
  getDepartmentCodeById,
} from "@/types/constants";

export default function ElectiveSlotsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [slots, setSlots] = useState<ElectiveSlot[]>([]);
  const [mappings, setMappings] = useState<{
    [slotId: string]: ElectiveSlotMapping;
  }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSlots = async () => {
    try {
      const slotsRef = collection(db, COLLECTIONS.ELECTIVE_SLOTS);
      const slotsQuery = query(slotsRef, where("isActive", "==", true));
      const slotsSnap = await getDocs(slotsQuery);

      const slotsList: ElectiveSlot[] = [];
      slotsSnap.docs.forEach((doc) => {
        slotsList.push({ id: doc.id, ...doc.data() } as ElectiveSlot);
      });

      // Sort by semester and slot code
      slotsList.sort((a, b) => {
        if (a.semester !== b.semester) return a.semester - b.semester;
        return a.slotCode.localeCompare(b.slotCode);
      });

      setSlots(slotsList);

      // Fetch mappings for each slot
      const mappingsMap: { [slotId: string]: ElectiveSlotMapping } = {};
      for (const slot of slotsList) {
        const mappingsRef = collection(db, COLLECTIONS.ELECTIVE_SLOT_MAPPINGS);
        const mappingsQuery = query(
          mappingsRef,
          where("slotId", "==", slot.id),
        );
        const mappingsSnap = await getDocs(mappingsQuery);
        if (!mappingsSnap.empty) {
          mappingsMap[slot.id] = {
            id: mappingsSnap.docs[0].id,
            ...mappingsSnap.docs[0].data(),
          } as ElectiveSlotMapping;
        }
      }
      setMappings(mappingsMap);
    } catch (error) {
      console.error("Error fetching elective slots:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSlots();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchSlots().then(() => setLoading(false));
  }, []);

  const handleDeleteSlot = async (slot: ElectiveSlot) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete ${slot.slotCode}?\n\nThis action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, COLLECTIONS.ELECTIVE_SLOTS, slot.id));
              // Also delete associated mappings
              const mappingsRef = collection(
                db,
                COLLECTIONS.ELECTIVE_SLOT_MAPPINGS,
              );
              const mappingsQuery = query(
                mappingsRef,
                where("slotId", "==", slot.id),
              );
              const mappingsSnap = await getDocs(mappingsQuery);
              mappingsSnap.docs.forEach(async (mappingDoc) => {
                await deleteDoc(
                  doc(db, COLLECTIONS.ELECTIVE_SLOT_MAPPINGS, mappingDoc.id),
                );
              });

              setSlots((prev) => prev.filter((s) => s.id !== slot.id));
              Alert.alert("Success", "Elective slot deleted successfully");
            } catch (error) {
              console.error("Error deleting slot:", error);
              Alert.alert("Error", "Failed to delete slot");
            }
          },
        },
      ],
    );
  };

  const getSlotTypeLabel = (type: ElectiveSlotType) => {
    return type === ELECTIVE_SLOT_TYPES.OPEN
      ? "Open Elective"
      : "Professional Elective";
  };

  const getSlotTypeColor = (type: ElectiveSlotType) => {
    return type === ELECTIVE_SLOT_TYPES.OPEN ? "#7477FF" : "#F9CD61";
  };

  const groupSlotsBySemester = () => {
    const grouped: { [semester: number]: ElectiveSlot[] } = {};
    slots.forEach((slot) => {
      if (!grouped[slot.semester]) grouped[slot.semester] = [];
      grouped[slot.semester].push(slot);
    });
    return grouped;
  };

  const groupedSlots = groupSlotsBySemester();

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#7477FF" />
        <Text style={styles.loadingText}>Loading elective slots...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#232323" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Elective Slots</Text>
        <TouchableOpacity
          onPress={() => router.push("/admin/electives/create")}
          style={styles.addButton}
        >
          <Plus size={24} color="#7477FF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Layers size={20} color="#7477FF" />
          <Text style={styles.infoText}>
            Elective slots are placeholders where students select their elective
            courses. Create slots like "22XXT705X" for open electives or
            "22CST7051" for professional electives.
          </Text>
        </View>

        {/* Empty State */}
        {slots.length === 0 && (
          <View style={styles.emptyState}>
            <Layers size={48} color="#C5D4CA" />
            <Text style={styles.emptyTitle}>No Elective Slots</Text>
            <Text style={styles.emptyText}>
              Create elective slots to allow students to choose their elective
              courses.
            </Text>
            <Button
              style={styles.createButton}
              onPress={() => router.push("/admin/electives/create")}
            >
              <Plus size={20} color="#FFFFFF" />
              <ButtonText>Create First Slot</ButtonText>
            </Button>
          </View>
        )}

        {/* Slots by Semester */}
        {Object.entries(groupedSlots).map(([semester, semesterSlots]) => (
          <VStack key={semester} space="md" style={styles.semesterSection}>
            <Text style={styles.semesterTitle}>Semester {semester}</Text>

            {semesterSlots.map((slot) => {
              const mapping = mappings[slot.id];
              const courseCount = mapping?.availableCourseIds?.length || 0;

              return (
                <TouchableOpacity
                  key={slot.id}
                  style={styles.slotCard}
                  onPress={() => router.push(`/admin/electives/${slot.id}`)}
                >
                  <HStack space="md" style={styles.slotHeader}>
                    <View
                      style={[
                        styles.slotTypeBadge,
                        { backgroundColor: getSlotTypeColor(slot.slotType) },
                      ]}
                    >
                      <Text style={styles.slotTypeText}>
                        {slot.slotType === ELECTIVE_SLOT_TYPES.OPEN
                          ? "OPEN"
                          : "PROF"}
                      </Text>
                    </View>
                    <VStack space="xs" style={styles.slotInfo}>
                      <Text style={styles.slotCode}>{slot.slotCode}</Text>
                      <Text style={styles.slotName}>{slot.name}</Text>
                    </VStack>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteSlot(slot);
                      }}
                      style={styles.deleteButton}
                    >
                      <Trash2 size={18} color="#F96857" />
                    </TouchableOpacity>
                  </HStack>

                  <HStack space="lg" style={styles.slotDetails}>
                    <HStack space="xs" style={styles.detailItem}>
                      <Building2 size={14} color="#77867D" />
                      <Text style={styles.detailText}>
                        {getDepartmentCodeById(slot.departmentId)}
                        {slot.assignedDepartments?.length > 1 &&
                          ` +${slot.assignedDepartments.length - 1}`}
                      </Text>
                    </HStack>

                    <HStack space="xs" style={styles.detailItem}>
                      <GraduationCap size={14} color="#77867D" />
                      <Text style={styles.detailText}>
                        {courseCount} course{courseCount !== 1 ? "s" : ""}{" "}
                        mapped
                      </Text>
                    </HStack>

                    {/* Map Courses Button */}
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/electives/${slot.id}`);
                      }}
                      style={styles.mapCoursesButton}
                    >
                      <HStack space="xs" style={styles.mapCoursesContent}>
                        <BookOpen size={14} color="#FFFFFF" />
                        <Text style={styles.mapCoursesText}>
                          {courseCount > 0 ? "Edit Courses" : "Map Courses"}
                        </Text>
                      </HStack>
                    </TouchableOpacity>
                  </HStack>

                  {slot.assignedDepartments &&
                    slot.assignedDepartments.length > 1 && (
                      <View style={styles.assignedDepts}>
                        <Text style={styles.assignedDeptsLabel}>
                          Also available to:
                        </Text>
                        <HStack space="xs" style={styles.deptChips}>
                          {slot.assignedDepartments
                            .filter((dept) => dept !== slot.departmentId)
                            .map((deptId) => (
                              <View key={deptId} style={styles.deptChip}>
                                <Text style={styles.deptChipText}>
                                  {getDepartmentCodeById(deptId)}
                                </Text>
                              </View>
                            ))}
                        </HStack>
                      </View>
                    )}
                </TouchableOpacity>
              );
            })}
          </VStack>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#77867D",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E9F0EB",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#232323",
  },
  addButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#4338CA",
    lineHeight: 18,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#232323",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#77867D",
    textAlign: "center",
    marginTop: 8,
    marginHorizontal: 32,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: "#7477FF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  semesterSection: {
    marginBottom: 24,
  },
  semesterTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#232323",
    marginBottom: 12,
  },
  slotCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9F0EB",
  },
  slotHeader: {
    alignItems: "flex-start",
  },
  slotTypeBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  slotTypeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  slotInfo: {
    flex: 1,
  },
  slotCode: {
    fontSize: 16,
    fontWeight: "700",
    color: "#232323",
  },
  slotName: {
    fontSize: 13,
    color: "#77867D",
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  slotDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  detailItem: {
    alignItems: "center",
  },
  detailText: {
    fontSize: 12,
    color: "#77867D",
  },
  assignedDepts: {
    marginTop: 12,
  },
  assignedDeptsLabel: {
    fontSize: 11,
    color: "#77867D",
    marginBottom: 6,
  },
  deptChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  deptChip: {
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  deptChipText: {
    fontSize: 11,
    color: "#4B5563",
    fontWeight: "500",
  },
  mapCoursesButton: {
    backgroundColor: "#7477FF",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: "auto",
  },
  mapCoursesContent: {
    alignItems: "center",
  },
  mapCoursesText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
