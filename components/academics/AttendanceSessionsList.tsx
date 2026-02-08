import React, { useState, useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { ChevronDown, ChevronUp, Calendar, Clock, Users, Lock } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pressable } from '@/components/ui/pressable';
import { AttendanceSession } from '@/types';
import { formatDate, formatTime, groupSessionsByMonth, sortMonthKeys, isSessionEditable } from '@/lib/attendanceUtils';
import { Timestamp } from 'firebase/firestore';

interface AttendanceSessionsListProps {
  sessions: AttendanceSession[];
  onSessionPress?: (session: AttendanceSession) => void;
  role: 'student' | 'teacher' | 'admin';
  studentAttendance?: { [sessionId: string]: boolean };
}

interface SessionWithDate extends AttendanceSession {
  dateObj: Date;
}

export function AttendanceSessionsList({
  sessions,
  onSessionPress,
  role,
  studentAttendance,
}: AttendanceSessionsListProps) {
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  // Convert sessions to include Date objects and group by month
  const groupedSessions = useMemo(() => {
    const sessionsWithDate = sessions.map((session) => ({
      ...session,
      date: session.createdAt instanceof Timestamp 
        ? session.createdAt.toDate() 
        : new Date(session.createdAt),
    }));

    const grouped = groupSessionsByMonth(sessionsWithDate);
    return grouped;
  }, [sessions]);

  const monthKeys = useMemo(() => {
    return sortMonthKeys(Object.keys(groupedSessions));
  }, [groupedSessions]);

  // Auto-expand current month
  React.useEffect(() => {
    if (monthKeys.length > 0 && expandedMonths.size === 0) {
      const currentMonth = monthKeys[0];
      setExpandedMonths(new Set([currentMonth]));
    }
  }, [monthKeys]);

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey);
      } else {
        newSet.add(monthKey);
      }
      return newSet;
    });
  };

  const getSessionStatus = (session: AttendanceSession & { date: Date }) => {
    if (session.isLocked) {
      return { label: 'Locked', color: '#F96857' };
    }
    if (isSessionEditable(session.createdAt)) {
      return { label: 'Editable', color: '#5AA578' };
    }
    return { label: 'Completed', color: '#77867D' };
  };

  return (
    <ScrollView className="flex-1">
      <VStack space="md" className="p-4 pb-20">
        {monthKeys.length === 0 ? (
          <View className="py-12 items-center">
            <Calendar size={48} color="#C5D4CA" />
            <Text className="mt-4 text-gray-500 text-center">
              No attendance sessions recorded yet
            </Text>
          </View>
        ) : (
          monthKeys.map((monthKey) => {
            const monthData = groupedSessions[monthKey];
            const isExpanded = expandedMonths.has(monthKey);

            return (
              <Card key={monthKey} variant="outline" className="overflow-hidden">
                {/* Month Header */}
                <Pressable
                  onPress={() => toggleMonth(monthKey)}
                  className="p-4 bg-gray-50 active:bg-gray-100"
                >
                  <HStack className="justify-between items-center">
                    <HStack space="sm" className="items-center">
                      <Calendar size={20} color="#7477FF" />
                      <Text className="font-semibold text-black">
                        {monthData.month} {monthData.year}
                      </Text>
                    </HStack>
                    <HStack space="sm" className="items-center">
                      <Badge variant="outline" className="bg-white">
                        <Text className="text-xs text-gray-600">
                          {monthData.sessions.length} sessions
                        </Text>
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp size={20} color="#77867D" />
                      ) : (
                        <ChevronDown size={20} color="#77867D" />
                      )}
                    </HStack>
                  </HStack>
                </Pressable>

                {/* Sessions List */}
                {isExpanded && (
                  <VStack className="divide-y divide-gray-100">
                    {monthData.sessions.map((session) => {
                      const status = getSessionStatus(session);
                      const isPresent = studentAttendance?.[session.id];

                      return (
                        <Pressable
                          key={session.id}
                          onPress={() => onSessionPress?.(session)}
                          className="p-4 active:bg-gray-50"
                        >
                          <HStack className="justify-between items-start">
                            <VStack space="xs" className="flex-1">
                              <Text className="font-semibold text-black">
                                {session.title || formatDate(session.createdAt)}
                              </Text>
                              <HStack space="sm" className="items-center">
                                <Clock size={14} color="#77867D" />
                                <Text className="text-sm text-gray-500">
                                  {formatTime(session.createdAt)}
                                </Text>
                              </HStack>
                            </VStack>

                            <VStack space="xs" className="items-end">
                              {role === 'student' && isPresent !== undefined && (
                                <Badge
                                  variant="outline"
                                  className={
                                    isPresent
                                      ? 'bg-green-50 border-green-300'
                                      : 'bg-red-50 border-red-300'
                                  }
                                >
                                  <Text
                                    className={`text-xs ${
                                      isPresent ? 'text-green-700' : 'text-red-700'
                                    }`}
                                  >
                                    {isPresent ? 'Present' : 'Absent'}
                                  </Text>
                                </Badge>
                              )}
                              
                              <HStack space="xs" className="items-center">
                                {session.isLocked && (
                                  <Lock size={14} color="#F96857" />
                                )}
                                <Text
                                  className="text-xs"
                                  style={{ color: status.color }}
                                >
                                  {status.label}
                                </Text>
                              </HStack>
                            </VStack>
                          </HStack>
                        </Pressable>
                      );
                    })}
                  </VStack>
                )}
              </Card>
            );
          })
        )}
      </VStack>
    </ScrollView>
  );
}

export default AttendanceSessionsList;
