import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Save, Hash, BookOpen, Building2, Award, ToggleRight, ToggleLeft } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Button, ButtonText } from '@/components/ui/button';
import { Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectItem } from '@/components/ui/select';
import { useAuth } from '@/lib/AuthContext';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEPARTMENTS, SEMESTERS, SECTIONS, COLLECTIONS, DepartmentId, ELECTIVE_SLOT_TYPES, ElectiveSlotType } from '@/types/constants';

export default function CreateElectiveSlotScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [slotCode, setSlotCode] = useState('');
  const [name, setName] = useState('');
  const [slotType, setSlotType] = useState<ElectiveSlotType>(ELECTIVE_SLOT_TYPES.PROFESSIONAL);
  const [departmentId, setDepartmentId] = useState<DepartmentId | ''>('');
  const [semester, setSemester] = useState<string>('');
  const [description, setDescription] = useState('');
  const [assignedDepartments, setAssignedDepartments] = useState<DepartmentId[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  const validateForm = async (): Promise<boolean> => {
    const errors: {[key: string]: string} = {};
    
    if (!slotCode.trim()) {
      errors.slotCode = 'Slot code is required';
    } else if (!/^\d{2}[A-Z]{3}\d{3}X?$/.test(slotCode.trim().toUpperCase())) {
      errors.slotCode = 'Invalid format. Use format like 22XXT705X or 22CST7051';
    }
    
    if (!name.trim()) {
      errors.name = 'Slot name is required';
    }
    
    if (!departmentId) {
      errors.departmentId = 'Department is required';
    }
    
    if (!semester) {
      errors.semester = 'Semester is required';
    }

    // Check for duplicate slot code
    if (slotCode.trim()) {
      try {
        const slotsRef = collection(db, COLLECTIONS.ELECTIVE_SLOTS);
        const duplicateQuery = query(
          slotsRef,
          where('slotCode', '==', slotCode.trim().toUpperCase())
        );
        const duplicateSnap = await getDocs(duplicateQuery);
        
        if (!duplicateSnap.empty) {
          errors.slotCode = 'A slot with this code already exists';
        }
      } catch (err) {
        console.error('Error checking for duplicates:', err);
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSlot = async () => {
    const isValid = await validateForm();
    if (!isValid || !user) return;

    setLoading(true);
    setFieldErrors({});
    
    try {
      // 1. Create the elective slot
      const slotData = {
        slotCode: slotCode.trim().toUpperCase(),
        name: name.trim(),
        slotType,
        departmentId,
        semester: parseInt(semester),
        assignedDepartments: slotType === ELECTIVE_SLOT_TYPES.OPEN ? [departmentId, ...assignedDepartments] : [departmentId],
        description: description.trim() || undefined,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.ELECTIVE_SLOTS), slotData);

      // 2. Create slot assignments for each department-section combination
      const assignmentsRef = collection(db, COLLECTIONS.ELECTIVE_SLOT_ASSIGNMENTS);
      const targetDepartments = slotType === ELECTIVE_SLOT_TYPES.OPEN 
        ? [departmentId, ...assignedDepartments]
        : [departmentId];

      for (const dept of targetDepartments) {
        const assignmentData = {
          slotId: docRef.id,
          departmentId: dept,
          semester: parseInt(semester),
          sections: selectedSections.length > 0 ? selectedSections : ['A', 'B', 'C', 'D'], // Default to all sections if none selected
          academicYear: new Date().getFullYear().toString(),
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await addDoc(assignmentsRef, assignmentData);
      }

      Alert.alert(
        'Success',
        'Elective slot created successfully!\n\nWould you like to map courses to this slot now?',
        [
          {
            text: 'Map Courses',
            onPress: () => router.push(`/admin/electives/${docRef.id}` as any),
          },
          {
            text: 'Later',
            style: 'cancel',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating elective slot:', error);
      alert(error.message || 'Failed to create elective slot');
    } finally {
      setLoading(false);
    }
  };

  const toggleDepartment = (deptId: DepartmentId) => {
    setAssignedDepartments(prev => 
      prev.includes(deptId)
        ? prev.filter(id => id !== deptId)
        : [...prev, deptId]
    );
  };

  const toggleSection = (section: string) => {
    setSelectedSections(prev => 
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#232323" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Elective Slot</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <VStack space="lg">
          {/* Slot Code */}
          <VStack space="xs">
            <Text style={styles.label}>Slot Code *</Text>
            <View style={[styles.inputContainer, fieldErrors.slotCode && styles.inputError]}>
              <Hash size={20} color="#7477FF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., 22XXT705X or 22CST7051"
                value={slotCode}
                onChangeText={(text) => {
                  setSlotCode(text);
                  if (fieldErrors.slotCode) {
                    setFieldErrors(prev => ({ ...prev, slotCode: '' }));
                  }
                }}
                autoCapitalize="characters"
              />
            </View>
            {fieldErrors.slotCode ? (
              <Text style={styles.errorText}>{fieldErrors.slotCode}</Text>
            ) : (
              <Text style={styles.hintText}>
                Use X for placeholders (e.g., 22XXT705X for open elective)
              </Text>
            )}
          </VStack>

          {/* Slot Name */}
          <VStack space="xs">
            <Text style={styles.label}>Slot Name *</Text>
            <View style={[styles.inputContainer, fieldErrors.name && styles.inputError]}>
              <BookOpen size={20} color="#7477FF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., Open Elective - Technical Slot 1"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (fieldErrors.name) {
                    setFieldErrors(prev => ({ ...prev, name: '' }));
                  }
                }}
              />
            </View>
            {fieldErrors.name && (
              <Text style={styles.errorText}>{fieldErrors.name}</Text>
            )}
          </VStack>

          {/* Slot Type Toggle */}
          <VStack space="xs">
            <Text style={styles.label}>Slot Type *</Text>
            <View style={styles.typeToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  slotType === ELECTIVE_SLOT_TYPES.PROFESSIONAL && styles.typeOptionSelected
                ]}
                onPress={() => setSlotType(ELECTIVE_SLOT_TYPES.PROFESSIONAL)}
              >
                <ToggleRight 
                  size={24} 
                  color={slotType === ELECTIVE_SLOT_TYPES.PROFESSIONAL ? '#F9CD61' : '#C5D4CA'} 
                />
                <VStack space="xs">
                  <Text style={[
                    styles.typeOptionLabel,
                    slotType === ELECTIVE_SLOT_TYPES.PROFESSIONAL && styles.typeOptionLabelSelected
                  ]}>
                    Professional Elective
                  </Text>
                  <Text style={styles.typeOptionDescription}>
                    Department-specific elective
                  </Text>
                </VStack>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeOption,
                  slotType === ELECTIVE_SLOT_TYPES.OPEN && styles.typeOptionSelected
                ]}
                onPress={() => setSlotType(ELECTIVE_SLOT_TYPES.OPEN)}
              >
                <ToggleRight 
                  size={24} 
                  color={slotType === ELECTIVE_SLOT_TYPES.OPEN ? '#7477FF' : '#C5D4CA'} 
                />
                <VStack space="xs">
                  <Text style={[
                    styles.typeOptionLabel,
                    slotType === ELECTIVE_SLOT_TYPES.OPEN && styles.typeOptionLabelSelected
                  ]}>
                    Open Elective
                  </Text>
                  <Text style={styles.typeOptionDescription}>
                    Cross-department elective
                  </Text>
                </VStack>
              </TouchableOpacity>
            </View>
          </VStack>

          {/* Department */}
          <VStack space="xs">
            <Text style={styles.label}>Primary Department *</Text>
            <Select
              selectedValue={departmentId}
              onValueChange={(value) => setDepartmentId(value as DepartmentId)}
            >
              <SelectTrigger style={styles.selectTrigger}>
                <HStack space="sm" style={styles.selectContent}>
                  <Building2 size={20} color="#7477FF" />
                  <SelectInput placeholder="Select department" style={styles.selectInput} />
                </HStack>
                <SelectIcon />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept.id} label={dept.name} value={dept.id} />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          </VStack>

          {/* Semester */}
          <VStack space="xs">
            <Text style={styles.label}>Semester *</Text>
            <Select
              selectedValue={semester}
              onValueChange={(value) => setSemester(value)}
            >
              <SelectTrigger style={styles.selectTrigger}>
                <HStack space="sm" style={styles.selectContent}>
                  <Award size={20} color="#7477FF" />
                  <SelectInput placeholder="Select semester" style={styles.selectInput} />
                </HStack>
                <SelectIcon />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  {SEMESTERS.map((sem) => (
                    <SelectItem key={sem} label={`Semester ${sem}`} value={sem.toString()} />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          </VStack>

          {/* Sections */}
          <VStack space="xs">
            <Text style={styles.label}>Sections *</Text>
            <Text style={styles.sublabel}>Select which sections this elective slot applies to</Text>
            
            <View style={styles.sectionsContainer}>
              {SECTIONS.map((section) => (
                <TouchableOpacity
                  key={section}
                  style={[
                    styles.sectionChip,
                    selectedSections.includes(section) && styles.sectionChipSelected
                  ]}
                  onPress={() => toggleSection(section)}
                >
                  <Text style={[
                    styles.sectionChipText,
                    selectedSections.includes(section) && styles.sectionChipTextSelected
                  ]}>
                    {section}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </VStack>

          {/* Additional Departments (for Open Electives) */}
          {slotType === ELECTIVE_SLOT_TYPES.OPEN && departmentId && (
            <VStack space="xs">
              <Text style={styles.label}>Additional Departments</Text>
              <Text style={styles.sublabel}>
                Select other departments that can also take this open elective
              </Text>
              
              <View style={styles.departmentsContainer}>
                {DEPARTMENTS.filter(dept => dept.id !== departmentId).map((dept) => (
                  <TouchableOpacity
                    key={dept.id}
                    style={[
                      styles.deptItem,
                      assignedDepartments.includes(dept.id as DepartmentId) && styles.deptItemSelected
                    ]}
                    onPress={() => toggleDepartment(dept.id as DepartmentId)}
                  >
                    <HStack space="sm" style={styles.deptContent}>
                      <Building2 
                        size={16} 
                        color={assignedDepartments.includes(dept.id as DepartmentId) ? "#7477FF" : "#77867D"} 
                      />
                      <Text style={[
                        styles.deptText,
                        assignedDepartments.includes(dept.id as DepartmentId) && styles.deptTextSelected
                      ]}>
                        {dept.code}
                      </Text>
                    </HStack>
                  </TouchableOpacity>
                ))}
              </View>
            </VStack>
          )}

          {/* Description */}
          <VStack space="xs">
            <Text style={styles.label}>Description (Optional)</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <BookOpen size={20} color="#7477FF" style={[styles.inputIcon, styles.textAreaIcon]} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter slot description..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </VStack>
        </VStack>

        {/* Submit Button */}
        <Button
          style={styles.submitButton}
          onPress={handleCreateSlot}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Save size={20} color="#FFFFFF" />
              <ButtonText style={styles.submitButtonText}>Create Elective Slot</ButtonText>
            </>
          )}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9F0EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#232323',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#232323',
    marginBottom: 8,
  },
  sublabel: {
    fontSize: 12,
    color: '#77867D',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9F0EB',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#232323',
  },
  inputError: {
    borderColor: '#F96857',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#F96857',
    marginTop: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#77867D',
    marginTop: 4,
  },
  selectTrigger: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9F0EB',
  },
  selectContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  selectInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  typeToggleContainer: {
    gap: 12,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9F0EB',
    padding: 16,
    gap: 12,
  },
  typeOptionSelected: {
    backgroundColor: '#F0F1FF',
    borderColor: '#7477FF',
  },
  typeOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#232323',
  },
  typeOptionLabelSelected: {
    color: '#7477FF',
  },
  typeOptionDescription: {
    fontSize: 13,
    color: '#77867D',
  },
  departmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deptItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9F0EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deptItemSelected: {
    backgroundColor: '#F0F1FF',
    borderColor: '#7477FF',
  },
  deptContent: {
    alignItems: 'center',
  },
  deptText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#232323',
  },
  deptTextSelected: {
    color: '#7477FF',
    fontWeight: '600',
  },
  sectionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionChip: {
    minWidth: 50,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9F0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionChipSelected: {
    backgroundColor: '#7477FF',
    borderColor: '#7477FF',
  },
  sectionChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#232323',
  },
  sectionChipTextSelected: {
    color: '#FFFFFF',
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textAreaIcon: {
    marginTop: 2,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 32,
    backgroundColor: '#7477FF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
