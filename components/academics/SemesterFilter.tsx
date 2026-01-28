import React from "react";
import { ScrollView, TouchableOpacity, View, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";

interface SemesterFilterProps {
  currentSemester: number;
  selectedSemester: number | null;
  onSelectSemester: (semester: number | null) => void;
}

export function SemesterFilter({
  currentSemester,
  selectedSemester,
  onSelectSemester,
}: SemesterFilterProps) {
  const semesters = [
    { value: null, label: "All" },
    ...Array.from({ length: 8 }, (_, i) => ({
      value: i + 1,
      label: `Sem ${i + 1}`,
    })),
  ];

  const getSemesterStyle = (semesterValue: number | null) => {
    const isSelected = selectedSemester === semesterValue;
    const isCurrent = semesterValue === currentSemester;
    const isPast = semesterValue !== null && semesterValue < currentSemester;
    const isFuture = semesterValue !== null && semesterValue > currentSemester;

    return {
      container: {
        backgroundColor: isSelected
          ? "#000000"
          : isCurrent
            ? "#F3F4F6"
            : isFuture
              ? "#F9FAFB"
              : "#FFFFFF",
        borderWidth: isSelected ? 0 : isCurrent ? 2 : 1,
        borderColor: isSelected
          ? "transparent"
          : isCurrent
            ? "#000000"
            : "#E5E7EB",
        opacity: isFuture ? 0.5 : 1,
      },
      text: {
        color: isSelected ? "#FFFFFF" : isFuture ? "#9CA3AF" : "#000000",
        fontWeight: (isSelected || isCurrent ? "600" : "500") as "600" | "500",
      },
    };
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <HStack space="sm">
          {semesters.map((semester) => {
            const styles = getSemesterStyle(semester.value);
            return (
              <TouchableOpacity
                key={semester.label}
                onPress={() => onSelectSemester(semester.value)}
                style={[chipStyles.chip, styles.container]}
                activeOpacity={0.7}
              >
                <Text style={[chipStyles.text, styles.text]}>
                  {semester.label}
                </Text>
                {semester.value === currentSemester && (
                  <View style={chipStyles.dot} />
                )}
              </TouchableOpacity>
            );
          })}
        </HStack>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
});

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  text: {
    fontSize: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
});
