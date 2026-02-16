import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import {
  X,
  Calendar,
  Clock,
  BookOpen,
  Repeat,
  Users,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Timestamp } from 'firebase/firestore';
import { EventType } from '@/lib/hooks/useCalendarEvents';
import type { EventFormData, ExpandedEvent } from '@/types/calendar';

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (eventData: EventFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  userRole: 'student' | 'teacher' | 'admin' | 'parent';
  userId: string;
  availableCourses?: { id: string; name: string }[];
  initialDate?: Date;
  editingEvent?: ExpandedEvent | null;
  isEditing?: boolean;
}

export function CreateEventModal({
  visible,
  onClose,
  onSave,
  onDelete,
  userRole,
  userId,
  availableCourses = [],
  initialDate,
  editingEvent,
  isEditing,
}: CreateEventModalProps) {
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('personal');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'weekly' | 'daily'>('weekly');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | null>(null);
  const [hasRecurrenceEnd, setHasRecurrenceEnd] = useState(false);
  const [isAttendanceEnabled, setIsAttendanceEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showRecurrenceEndPicker, setShowRecurrenceEndPicker] = useState(false);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  const weekDays = [
    { code: 'MON', label: 'Mon' },
    { code: 'TUE', label: 'Tue' },
    { code: 'WED', label: 'Wed' },
    { code: 'THU', label: 'Thu' },
    { code: 'FRI', label: 'Fri' },
    { code: 'SAT', label: 'Sat' },
    { code: 'SUN', label: 'Sun' },
  ];

  useEffect(() => {
    if (visible) {
      if (editingEvent) {
        // Load editing event data
        setTitle(editingEvent.title);
        setEventType(editingEvent.type);
        setSelectedCourse(editingEvent.courseInstanceId || null);
        setDescription(editingEvent.description || '');
        setLocation(editingEvent.location || '');
        const start = editingEvent.startTime.toDate();
        const end = editingEvent.endTime.toDate();
        setStartDate(start);
        setStartTime(start);
        setEndDate(end);
        setEndTime(end);
        setIsRecurring(!!editingEvent.recurrenceRule);
        if (editingEvent.recurrenceRule) {
          setRecurrenceFrequency(editingEvent.recurrenceRule.frequency);
          setSelectedDays(editingEvent.recurrenceRule.days || []);
          if (editingEvent.recurrenceRule.until) {
            setHasRecurrenceEnd(true);
            setRecurrenceEndDate(editingEvent.recurrenceRule.until.toDate());
          }
        }
        setIsAttendanceEnabled(editingEvent.isAttendanceEnabled || false);
      } else {
        // Reset for new event
        const now = initialDate || new Date();
        setTitle('');
        setEventType('personal');
        setSelectedCourse(null);
        setDescription('');
        setLocation('');
        setStartDate(now);

        const startTimeDefault = new Date(now);
        startTimeDefault.setMinutes(0);
        setStartTime(startTimeDefault);

        const endDateDefault = new Date(now);
        setEndDate(endDateDefault);

        const endTimeDefault = new Date(startTimeDefault);
        endTimeDefault.setHours(endTimeDefault.getHours() + 1);
        setEndTime(endTimeDefault);

        setIsRecurring(false);
        setRecurrenceFrequency('weekly');
        setSelectedDays([]);
        setRecurrenceEndDate(null);
        setHasRecurrenceEnd(false);
        setIsAttendanceEnabled(false);
      }
    }
  }, [visible, editingEvent, initialDate]);

  const getAvailableEventTypes = (): { value: EventType; label: string }[] => {
    const types: { value: EventType; label: string }[] = [];

    if (userRole === 'admin') {
      types.push(
        { value: 'exam', label: 'Exam' },
        { value: 'class', label: 'Class' },
        { value: 'assignment', label: 'Assignment' },
        { value: 'personal', label: 'Personal' }
      );
    } else if (userRole === 'teacher') {
      types.push(
        { value: 'class', label: 'Class' },
        { value: 'assignment', label: 'Assignment' },
        { value: 'personal', label: 'Personal' }
      );
    } else if (userRole === 'student') {
      types.push({ value: 'personal', label: 'Personal' });
    }

    return types;
  };

  const toggleDay = (dayCode: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayCode)
        ? prev.filter((d) => d !== dayCode)
        : [...prev, dayCode]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    if ((eventType === 'class' || eventType === 'exam' || eventType === 'assignment') && !selectedCourse) {
      alert('Please select a course');
      return;
    }

    if (isRecurring && recurrenceFrequency === 'weekly' && selectedDays.length === 0) {
      alert('Please select at least one day for recurring events');
      return;
    }

    setSaving(true);

    try {
      const eventData: EventFormData = {
        title: title.trim(),
        type: eventType,
        startDate,
        startTime,
        endDate,
        endTime,
        description,
        location,
        isRecurring,
        isAttendanceEnabled: eventType === 'class' ? isAttendanceEnabled : false,
      };

      // Only add courseInstanceId if it's set (Firebase doesn't accept undefined)
      if (selectedCourse) {
        eventData.courseInstanceId = selectedCourse;
      }

      if (isRecurring) {
        eventData.recurrenceFrequency = recurrenceFrequency;
        if (recurrenceFrequency === 'weekly' && selectedDays.length > 0) {
          eventData.recurrenceDays = selectedDays;
        }
        if (hasRecurrenceEnd && recurrenceEndDate) {
          eventData.recurrenceUntil = recurrenceEndDate;
        }
      }

      await onSave(eventData);
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const availableTypes = getAvailableEventTypes();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={saving}>
            <X size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {editingEvent ? 'Edit Event' : 'New Event'}
          </Text>
          <HStack space="sm" className="items-center">
            {isEditing && onDelete && (
              <TouchableOpacity 
                onPress={onDelete} 
                disabled={saving}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.saveButton}>Save</Text>
              )}
            </TouchableOpacity>
          </HStack>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <VStack space="lg" style={styles.form}>
            {/* Title */}
            <View style={styles.field}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={(text) => {
                  console.log('CreateEventModal title changed:', text);
                  setTitle(text);
                }}
                placeholder="Enter event title"
                placeholderTextColor="#9CA3AF"
                editable={true}
                selectTextOnFocus={true}
              />
            </View>

            {/* Event Type */}
            <View style={styles.field}>
              <Text style={styles.label}>Event Type *</Text>
              <View style={styles.typeContainer}>
                {availableTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeButton,
                      eventType === type.value && styles.typeButtonActive,
                    ]}
                    onPress={() => setEventType(type.value)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        eventType === type.value && styles.typeButtonTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Course Selection (for class/exam/assignment events) */}
            {(eventType === 'class' || eventType === 'exam' || eventType === 'assignment') && availableCourses.length > 0 && (
              <View style={styles.field}>
                <HStack space="xs" className="items-center mb-2">
                  <BookOpen size={16} color="#6B7280" />
                  <Text style={styles.label}>Course *</Text>
                </HStack>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <HStack space="sm">
                    {availableCourses.map((course) => (
                      <TouchableOpacity
                        key={course.id}
                        style={[
                          styles.courseButton,
                          selectedCourse === course.id && styles.courseButtonActive,
                        ]}
                        onPress={() => setSelectedCourse(course.id)}
                      >
                        <Text
                          style={[
                            styles.courseButtonText,
                            selectedCourse === course.id && styles.courseButtonTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {course.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </HStack>
                </ScrollView>
              </View>
            )}

            {/* Date */}
            <View style={styles.field}>
              <HStack space="xs" className="items-center mb-2">
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.label}>Date *</Text>
              </HStack>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.inputText}>
                  {startDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (date) setStartDate(date);
                  }}
                />
              )}
            </View>

            {/* Time Range */}
            <View style={styles.field}>
              <HStack space="xs" className="items-center mb-2">
                <Clock size={16} color="#6B7280" />
                <Text style={styles.label}>Time *</Text>
              </HStack>
              <HStack space="md" className="items-center">
                <View style={{ flex: 1 }}>
                  <Text style={styles.subLabel}>Start</Text>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => setShowStartTimePicker(true)}
                  >
                    <Text style={styles.inputText}>
                      {startTime.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                  </TouchableOpacity>
                  {showStartTimePicker && (
                    <DateTimePicker
                      value={startTime}
                      mode="time"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, time) => {
                        setShowStartTimePicker(Platform.OS === 'ios');
                        if (time) setStartTime(time);
                      }}
                    />
                  )}
                </View>
                <Text style={styles.timeSeparator}>→</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subLabel}>End</Text>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <Text style={styles.inputText}>
                      {endTime.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                  </TouchableOpacity>
                  {showEndTimePicker && (
                    <DateTimePicker
                      value={endTime}
                      mode="time"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, time) => {
                        setShowEndTimePicker(Platform.OS === 'ios');
                        if (time) setEndTime(time);
                      }}
                    />
                  )}
                </View>
              </HStack>
            </View>

            {/* Recurring Events */}
            <View style={styles.field}>
              <HStack space="md" className="items-center justify-between">
                <HStack space="xs" className="items-center">
                  <Repeat size={16} color="#6B7280" />
                  <Text style={styles.label}>Recurring Event</Text>
                </HStack>
                <Switch
                  value={isRecurring}
                  onValueChange={setIsRecurring}
                  trackColor={{ false: '#D1D5DB', true: '#000000' }}
                  thumbColor="#FFFFFF"
                />
              </HStack>

              {isRecurring && (
                <VStack space="md" style={styles.recurringOptions}>
                  {/* Frequency */}
                  <View>
                    <Text style={styles.subLabel}>Frequency</Text>
                    <HStack space="sm">
                      <TouchableOpacity
                        style={[
                          styles.frequencyButton,
                          recurrenceFrequency === 'daily' && styles.frequencyButtonActive,
                        ]}
                        onPress={() => setRecurrenceFrequency('daily')}
                      >
                        <Text
                          style={[
                            styles.frequencyButtonText,
                            recurrenceFrequency === 'daily' && styles.frequencyButtonTextActive,
                          ]}
                        >
                          Daily
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.frequencyButton,
                          recurrenceFrequency === 'weekly' && styles.frequencyButtonActive,
                        ]}
                        onPress={() => setRecurrenceFrequency('weekly')}
                      >
                        <Text
                          style={[
                            styles.frequencyButtonText,
                            recurrenceFrequency === 'weekly' && styles.frequencyButtonTextActive,
                          ]}
                        >
                          Weekly
                        </Text>
                      </TouchableOpacity>
                    </HStack>
                  </View>

                  {/* Days (for weekly) */}
                  {recurrenceFrequency === 'weekly' && (
                    <View>
                      <Text style={styles.subLabel}>Repeat On</Text>
                      <View style={styles.daysContainer}>
                        {weekDays.map((day) => (
                          <TouchableOpacity
                            key={day.code}
                            style={[
                              styles.dayButton,
                              selectedDays.includes(day.code) && styles.dayButtonActive,
                            ]}
                            onPress={() => toggleDay(day.code)}
                          >
                            <Text
                              style={[
                                styles.dayButtonText,
                                selectedDays.includes(day.code) && styles.dayButtonTextActive,
                              ]}
                            >
                              {day.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* End Date */}
                  <View>
                    <HStack space="md" className="items-center justify-between mb-2">
                      <Text style={styles.subLabel}>Set End Date</Text>
                      <Switch
                        value={hasRecurrenceEnd}
                        onValueChange={setHasRecurrenceEnd}
                        trackColor={{ false: '#D1D5DB', true: '#000000' }}
                        thumbColor="#FFFFFF"
                      />
                    </HStack>
                    {hasRecurrenceEnd && (
                      <TouchableOpacity
                        style={styles.input}
                        onPress={() => setShowRecurrenceEndPicker(true)}
                      >
                        <Text style={styles.inputText}>
                          {recurrenceEndDate
                            ? recurrenceEndDate.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Select end date'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {showRecurrenceEndPicker && (
                      <DateTimePicker
                        value={recurrenceEndDate || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        minimumDate={startDate}
                        onChange={(event, date) => {
                          setShowRecurrenceEndPicker(Platform.OS === 'ios');
                          if (date) setRecurrenceEndDate(date);
                        }}
                      />
                    )}
                  </View>
                </VStack>
              )}
            </View>

            {/* Attendance (for class events) */}
            {eventType === 'class' && (
              <View style={styles.field}>
                <HStack space="md" className="items-center justify-between">
                  <HStack space="xs" className="items-center">
                    <Users size={16} color="#6B7280" />
                    <Text style={styles.label}>Enable Attendance</Text>
                  </HStack>
                  <Switch
                    value={isAttendanceEnabled}
                    onValueChange={setIsAttendanceEnabled}
                    trackColor={{ false: '#D1D5DB', true: '#000000' }}
                    thumbColor="#FFFFFF"
                  />
                </HStack>
                {isAttendanceEnabled && (
                  <Text style={styles.helpText}>
                    Teachers can mark attendance for this class
                  </Text>
                )}
              </View>
            )}
          </VStack>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF0EE',
    borderRadius: 8,
    marginRight: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F96857',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  inputText: {
    fontSize: 15,
    color: '#111827',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  typeButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  courseButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    maxWidth: 200,
  },
  courseButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  courseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  courseButtonTextActive: {
    color: '#FFFFFF',
  },
  timeSeparator: {
    fontSize: 18,
    color: '#9CA3AF',
    marginTop: 24,
  },
  recurringOptions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  frequencyButtonTextActive: {
    color: '#FFFFFF',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  dayButtonTextActive: {
    color: '#FFFFFF',
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
