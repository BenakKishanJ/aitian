import React, { useMemo } from 'react';

import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Button, ButtonText } from '@/components/ui/button';
import { ScrollView } from '@/components/ui/scroll-view';
import { RefreshControl } from '@/components/ui/refresh-control';
import { Spinner } from '@/components/ui/spinner';


import {
  Bell,
  CalendarDays,
  BookOpen,
  AlertTriangle,
  ChevronRight,
  User,
  GraduationCap,
  Clock,
  Home as HomeIcon,
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useHomeData } from '@/hooks/useHomeData';
import { ClassCard } from '@/components/home/ClassCard';
import { AssignmentCard } from '@/components/home/AssignmentCard';
import { NewsCard } from '@/components/home/NewsCard';
import { AlertCard } from '@/components/home/AlertCard';
import { router } from 'expo-router';
import { Timestamp } from 'firebase/firestore';

export default function HomeScreen() {
  const { userData, role } = useAuth();
  const {
    todaysClasses,
    assignmentDeadlines,
    latestNews,
    attendanceAlerts,
    loading,
    error,
    refresh
  } = useHomeData();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'student': return GraduationCap;
      case 'teacher': return User;
      case 'parent': return User;
      case 'admin': return User;
      default: return User;
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case 'student': return 'bg-blue-100 text-blue-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'parent': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const RoleIcon = getRoleIcon();

  // Format data for display
  const formattedClasses = useMemo(() => {
    return todaysClasses.map(event => {
      const startTime = event.startTime?.toDate();
      const endTime = event.endTime?.toDate();

      return {
        id: event.id,
        title: event.title,
        time: startTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '',
        endTime: endTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '',
        type: event.type,
        courseName: 'Database Management Systems', // TODO: Fetch course name
        location: 'Room 301',
        teacher: 'Prof. Smith'
      };
    });
  }, [todaysClasses]);

  const formattedAssignments = useMemo(() => {
    return assignmentDeadlines.map(assignment => {
      const dueDate = assignment.dueDate?.toDate();
      const now = new Date();
      const isOverdue = dueDate && dueDate < now;

      return {
        id: assignment.id,
        title: assignment.title,
        dueDate: dueDate || new Date(),
        courseName: assignment.courseName || 'Unknown Course',
        submitted: assignment.submitted,
        overdue: isOverdue
      };
    });
  }, [assignmentDeadlines]);

  const formattedNews = useMemo(() => {
    return latestNews.map(news => {
      const createdAt = news.createdAt?.toDate();

      return {
        id: news.id,
        title: news.title,
        content: news.content,
        author: news.postedByName || 'Admin',
        time: createdAt ?
          createdAt.toLocaleDateString([], { month: 'short', day: 'numeric' }) :
          'Recently',
        isPinned: news.isPinned,
        hasAttachment: false // TODO: Check for attachments
      };
    });
  }, [latestNews]);

  const handleViewAll = (screen: string) => {
    router.push(`/(tabs)/${screen}`);
  };

  const handleEventPress = (eventId: string) => {
    // Navigate to event details
    console.log('Event pressed:', eventId);
  };

  const handleAssignmentPress = (assignmentId: string) => {
    // Navigate to assignment details
    router.push(`/course/assignment/${assignmentId}`);
  };

  const handleNewsPress = (newsId: string) => {
    // Navigate to news details
    console.log('News pressed:', newsId);
  };

  const handleAlertPress = (alertType: string) => {
    // Navigate to attendance/details
    router.push('/(tabs)/academics');
  };

  if (loading && !todaysClasses.length && !assignmentDeadlines.length) {
    return (
      <Box className="flex-1 items-center justify-center bg-white">
        <VStack className="items-center" space="md">
          <Spinner size="large" />
          <Text className="text-gray-600">Loading your dashboard...</Text>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="flex-1 items-center justify-center bg-white px-6">
        <VStack className="items-center" space="md">
          <AlertTriangle size={48} color="#EF4444" />
          <Text className="text-red-600 text-center">{error}</Text>
          <Button onPress={refresh} className="mt-4">
            <ButtonText>Try Again</ButtonText>
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} />
      }
    >
      <VStack className="flex-1 px-4 pb-20" space="lg">
        {/* Header with Greeting */}
        <VStack className="pt-6" space="sm">
          <HStack className="items-center justify-between">
            <VStack space="xs">
              <Text className="text-2xl font-bold text-gray-900">
                {getGreeting()},
              </Text>
              <Text className="text-2xl font-bold text-blue-600">
                {userData?.name || 'User'}
              </Text>
            </VStack>

            <HStack className="items-center" space="sm">
              <Box className={`px-3 py-1 rounded-full ${getRoleColor()}`}>
                <HStack className="items-center" space="sm">
                  <RoleIcon size={16} />
                  <Text className="font-semibold capitalize">
                    {role}
                  </Text>
                </HStack>
              </Box>

              <Button
                variant="link"
                size="sm"
                onPress={() => router.push('/(tabs)/profile')}
              >
                <User size={24} color="#6B7280" />
              </Button>
            </HStack>
          </HStack>

          {/* Quick Stats */}
          <HStack className="pt-4" space="md">
            <Box className="flex-1 bg-blue-50 p-4 rounded-xl">
              <VStack className="items-center" space="sm">
                <CalendarDays size={24} color="#3B82F6" />
                <Text className="font-bold text-gray-900">
                  {todaysClasses.length}
                </Text>
                <Text className="text-gray-600 text-sm text-center">
                  Classes{'\n'}Today
                </Text>
              </VStack>
            </Box>

            <Box className="flex-1 bg-green-50 p-4 rounded-xl">
              <VStack className="items-center" space="sm">
                <BookOpen size={24} color="#10B981" />
                <Text className="font-bold text-gray-900">
                  {formattedAssignments.filter(a => !a.submitted && !a.overdue).length}
                </Text>
                <Text className="text-gray-600 text-sm text-center">
                  Pending{'\n'}Assignments
                </Text>
              </VStack>
            </Box>

            <Box className="flex-1 bg-purple-50 p-4 rounded-xl">
              <VStack className="items-center" space="sm">
                <Bell size={24} color="#8B5CF6" />
                <Text className="font-bold text-gray-900">
                  {attendanceAlerts.length}
                </Text>
                <Text className="text-gray-600 text-sm text-center">
                  New{'\n'}Alerts
                </Text>
              </VStack>
            </Box>
          </HStack>
        </VStack>

        {/* Attendance Alerts Section */}
        {attendanceAlerts.length > 0 && (
          <VStack space="sm">
            <HStack className="items-center justify-between">
              <Heading size="lg" className="text-gray-900">
                Attendance Alerts
              </Heading>
              <Button
                variant="link"
                size="sm"
                onPress={() => handleAlertPress('attendance')}
              >
                <ButtonText className="text-blue-500">View All</ButtonText>
                <ChevronRight size={16} color="#3B82F6" />
              </Button>
            </HStack>

            {attendanceAlerts.map((alert, index) => (
              <AlertCard
                key={index}
                type={alert.type}
                title={`${alert.percentage}% Attendance`}
                message={alert.message}
                courseName={alert.courseName}
                percentage={alert.percentage}
                onPress={() => handleAlertPress('attendance')}
              />
            ))}
          </VStack>
        )}

        {/* Today's Classes Section */}
        <VStack space="sm">
          <HStack className="items-center justify-between">
            <Heading size="lg" className="text-gray-900">
              Today's Classes
            </Heading>
            <Button
              variant="link"
              size="sm"
              onPress={() => handleViewAll('calendar')}
            >
              <ButtonText className="text-blue-500">View Calendar</ButtonText>
              <ChevronRight size={16} color="#3B82F6" />
            </Button>
          </HStack>

          {formattedClasses.length > 0 ? (
            formattedClasses.map((classItem) => (
              <ClassCard
                key={classItem.id}
                title={classItem.title}
                time={classItem.time}
                endTime={classItem.endTime}
                type={classItem.type}
                courseName={classItem.courseName}
                location={classItem.location}
                teacher={classItem.teacher}
                onPress={() => handleEventPress(classItem.id)}
              />
            ))
          ) : (
            <Box className="bg-gray-50 p-6 rounded-xl items-center">
              <CalendarDays size={32} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2">No classes scheduled for today</Text>
            </Box>
          )}
        </VStack>

        {/* Assignment Deadlines Section */}
        {formattedAssignments.length > 0 && (
          <VStack space="sm">
            <HStack className="items-center justify-between">
              <Heading size="lg" className="text-gray-900">
                Upcoming Assignments
              </Heading>
              <Button
                variant="link"
                size="sm"
                onPress={() => handleViewAll('academics')}
              >
                <ButtonText className="text-blue-500">View All</ButtonText>
                <ChevronRight size={16} color="#3B82F6" />
              </Button>
            </HStack>

            {formattedAssignments
              .filter(a => !a.submitted)
              .slice(0, 3)
              .map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  title={assignment.title}
                  dueDate={assignment.dueDate}
                  courseName={assignment.courseName}
                  submitted={assignment.submitted}
                  overdue={assignment.overdue}
                  onPress={() => handleAssignmentPress(assignment.id)}
                />
              ))}
          </VStack>
        )}

        {/* Latest News Section */}
        {formattedNews.length > 0 && (
          <VStack space="sm">
            <HStack className="items-center justify-between">
              <Heading size="lg" className="text-gray-900">
                Latest Announcements
              </Heading>
              <Button
                variant="link"
                size="sm"
                onPress={() => handleViewAll('news')}
              >
                <ButtonText className="text-blue-500">View All</ButtonText>
                <ChevronRight size={16} color="#3B82F6" />
              </Button>
            </HStack>

            {formattedNews.slice(0, 3).map((news) => (
              <NewsCard
                key={news.id}
                title={news.title}
                content={news.content}
                author={news.author}
                time={news.time}
                isPinned={news.isPinned}
                hasAttachment={news.hasAttachment}
                onPress={() => handleNewsPress(news.id)}
              />
            ))}
          </VStack>
        )}

        {/* Role-specific Widgets */}
        {role === 'student' && (
          <VStack space="sm">
            <Heading size="lg" className="text-gray-900">
              Quick Actions
            </Heading>
            <HStack space="md">
              <Button
                variant="outline"
                className="flex-1 bg-white border-blue-200"
                onPress={() => router.push('/(tabs)/academics')}
              >
                <VStack className="items-center py-4" space="sm">
                  <BookOpen size={24} color="#3B82F6" />
                  <ButtonText className="text-blue-600">Courses</ButtonText>
                </VStack>
              </Button>

              <Button
                variant="outline"
                className="flex-1 bg-white border-green-200"
                onPress={() => router.push('/course/electives')}
              >
                <VStack className="items-center py-4" space="sm">
                  <GraduationCap size={24} color="#10B981" />
                  <ButtonText className="text-green-600">Electives</ButtonText>
                </VStack>
              </Button>

              <Button
                variant="outline"
                className="flex-1 bg-white border-purple-200"
                onPress={() => router.push('/(tabs)/profile')}
              >
                <VStack className="items-center py-4" space="sm">
                  <User size={24} color="#8B5CF6" />
                  <ButtonText className="text-purple-600">Profile</ButtonText>
                </VStack>
              </Button>
            </HStack>
          </VStack>
        )}

        {/* Empty State */}
        {!loading &&
          todaysClasses.length === 0 &&
          formattedAssignments.length === 0 &&
          formattedNews.length === 0 && (
            <Box className="items-center justify-center py-12">
              <HomeIcon size={64} color="#9CA3AF" />
              <Text className="text-gray-500 text-lg mt-4">Welcome to AITIAN!</Text>
              <Text className="text-gray-400 text-center mt-2">
                Your dashboard will show classes,{'\n'}assignments, and announcements here.
              </Text>
            </Box>
          )}
      </VStack>
    </ScrollView>
  );
}
