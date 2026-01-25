import { View, ScrollView } from 'react-native';
import { useAuth } from '@/lib/useAuth';
import { Alert } from 'react-native';

/* Gluestack UI components */
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Avatar, AvatarFallbackText } from '@/components/ui/avatar';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Divider } from '@/components/ui/divider';
import { Switch } from '@/components/ui/switch';

/* Gluestack UI Icons */
import {
  SettingsIcon,
  BellIcon,
  ChevronRightIcon,
  MailIcon,
} from '@/components/ui/icon';

/* Lucide React Native Icons */
import {
  User as UserIcon,
  BookOpen as BookOpenIcon,
  Users,
  Clock,
  Calendar,
  Shield,
  HelpCircle,
  LogOutIcon,
  Edit
} from 'lucide-react-native';
import { logout } from '@/lib/useAuth';

export default function ProfileScreen() {
  const { user, userData } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'student': return 'bg-blue-500';
      case 'teacher': return 'bg-green-500';
      case 'parent': return 'bg-purple-500';
      case 'admin': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const renderLinkedStudents = () => {
    // TODO: Fetch actual linked students from Firestore
    const linkedStudents = [
      { name: 'John Doe', email: 'john.student@drait.edu.in', grade: 'Semester 4' },
      { name: 'Jane Smith', email: 'jane.student@drait.edu.in', grade: 'Semester 6' },
    ];

    return (
      <Card className="mb-6 bg-[#2A2A2D] border-0">
        <VStack space="md" className="p-4">
          <HStack className="items-center justify-between">
            <Text className="text-lg font-semibold text-white">Linked Students</Text>
            <Text className="text-sm text-[#C5D4CA]">{linkedStudents.length}/5</Text>
          </HStack>

          <VStack space="sm" className="mt-2">
            {linkedStudents.map((student, index) => (
              <HStack key={index} className="items-center justify-between bg-[#1C1C1E] rounded-lg p-3">
                <HStack space="xl" className="items-center">
                  <Avatar size="md" className="bg-blue-900">
                    <AvatarFallbackText className="text-blue-300">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallbackText>
                  </Avatar>
                  <VStack>
                    <Text className="font-medium text-white">{student.name}</Text>
                    <Text className="text-sm text-[#C5D4CA]">{student.email}</Text>
                  </VStack>
                </HStack>
                <Badge className={getRoleBadgeColor('student')}>
                  <BadgeText className="text-white text-xs">{student.grade}</BadgeText>
                </Badge>
              </HStack>
            ))}
          </VStack>

          <Button variant="outline" className="mt-2 border-[#C5D4CA]">
            <ButtonText className="text-[#C5D4CA]">Link Another Student</ButtonText>
          </Button>
        </VStack>
      </Card>
    );
  };

  const renderNotificationSettings = () => {
    return (
      <Card className="mb-6 bg-[#2A2A2D] border-0">
        <VStack space="md" className="p-4">
          <HStack className="items-center justify-between">
            <Text className="text-lg font-semibold text-white">Notification Settings</Text>
            <Icon as={BellIcon} className="text-[#C5D4CA]" size="lg" />
          </HStack>

          <VStack space="md" className="mt-2">
            <HStack className="items-center justify-between">
              <HStack space="md" className="items-center">
                <Icon as={Clock} className="text-[#C5D4CA]" size="sm" />
                <VStack>
                  <Text className="font-medium text-white">Class Reminders</Text>
                  <Text className="text-sm text-[#C5D4CA]">Get notified before classes start</Text>
                </VStack>
              </HStack>
              <Switch size="md" />
            </HStack>

            <HStack className="items-center justify-between">
              <HStack space="md" className="items-center">
                <Icon as={Calendar} className="text-[#C5D4CA]" size="sm" />
                <VStack>
                  <Text className="font-medium text-white">Assignment Deadlines</Text>
                  <Text className="text-sm text-[#C5D4CA]">Notifications for upcoming deadlines</Text>
                </VStack>
              </HStack>
              <Switch size="md" />
            </HStack>

            <HStack className="items-center justify-between">
              <HStack space="md" className="items-center">
                <Icon as={BellIcon} className="text-[#C5D4CA]" size="sm" />
                <VStack>
                  <Text className="font-medium text-white">News Updates</Text>
                  <Text className="text-sm text-[#C5D4CA]">Important announcements and notices</Text>
                </VStack>
              </HStack>
              <Switch size="md" />
            </HStack>

            <HStack className="items-center justify-between">
              <HStack space="md" className="items-center">
                <Icon as={MailIcon} className="text-[#C5D4CA]" size="sm" />
                <VStack>
                  <Text className="font-medium text-white">Email Notifications</Text>
                  <Text className="text-sm text-[#C5D4CA]">Receive updates via email</Text>
                </VStack>
              </HStack>
              <Switch size="md" />
            </HStack>
          </VStack>
        </VStack>
      </Card>
    );
  };

  if (!userData) {
    return (
      <View className="flex-1 justify-center items-center bg-[#D1E7EF]">
        <Text className="text-lg text-[#1C1C1E]">Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#D1E7EF]">
      <VStack className="p-6" space="lg">
        {/* Profile Header Card */}
        <Card className="mb-6 bg-[#2A2A2D] border-0">
          <VStack space="md" className="p-6">
            <HStack className="items-center justify-between">
              <HStack space="xl" className="items-center">
                <Avatar size="2xl" className="bg-[#C5D4CA]">
                  <AvatarFallbackText className="text-[#1C1C1E] text-2xl font-bold">
                    {userData.name || user?.email?.split('@')[0]?.slice(0, 2)?.toUpperCase() || 'U'}
                  </AvatarFallbackText>
                </Avatar>
                <VStack>
                  <Text className="text-2xl font-bold text-white">
                    {userData.name || user?.email?.split('@')[0]}
                  </Text>
                  <HStack space="md" className="items-center">
                    <Icon as={MailIcon} className="text-[#C5D4CA]" size="sm" />
                    <Text className="text-[#C5D4CA]">{user?.email}</Text>
                  </HStack>
                </VStack>
              </HStack>
              <Badge className={getRoleBadgeColor(userData.role)}>
                <BadgeText className="text-white font-semibold capitalize">
                  {userData.role}
                </BadgeText>
              </Badge>
            </HStack>

            {/* Academic Information for Students */}
            {(userData.role === 'student' || userData.role === 'teacher') && (
              <VStack space="sm" className="mt-4 bg-[#1C1C1E] rounded-lg p-4">
                <Text className="font-semibold text-white mb-2">Academic Information</Text>

                {userData.dept && (
                  <HStack space="md" className="items-center">
                    <Icon as={BookOpenIcon} className="text-[#C5D4CA]" size="sm" />
                    <Text className="text-[#C5D4CA]">Department: {userData.dept}</Text>
                  </HStack>
                )}

                {userData.batch && (
                  <HStack space="md" className="items-center">
                    <Icon as={Users} className="text-[#C5D4CA]" size="sm" />
                    <Text className="text-[#C5D4CA]">Batch: {userData.batch}</Text>
                  </HStack>
                )}

                {userData.usn && (
                  <HStack space="md" className="items-center">
                    <Icon as={UserIcon} className="text-[#C5D4CA]" size="sm" />
                    <Text className="text-[#C5D4CA]">USN: {userData.usn}</Text>
                  </HStack>
                )}
              </VStack>
            )}
          </VStack>
        </Card>

        {/* Parent-specific: Linked Students */}
        {userData.role === 'parent' && renderLinkedStudents()}

        {/* Notification Settings */}
        {renderNotificationSettings()}

        {/* Account Actions */}
        <Card className="mb-6 bg-[#2A2A2D] border-0">
          <VStack space="md" className="p-4">
            <Text className="text-lg font-semibold text-white">Account Actions</Text>

            <VStack space="sm" className="mt-2">
              <Button variant="outline" className="justify-between border-[#C5D4CA]">
                <HStack space="md" className="items-center">
                  <Icon as={Edit} className="text-[#C5D4CA]" size="sm" />
                  <ButtonText className="text-[#C5D4CA] flex-1 text-left">Edit Profile</ButtonText>
                </HStack>
                <Icon as={ChevronRightIcon} className="text-[#C5D4CA]" />
              </Button>

              <Button variant="outline" className="justify-between border-[#C5D4CA]">
                <HStack space="md" className="items-center">
                  <Icon as={Shield} className="text-[#C5D4CA]" size="sm" />
                  <ButtonText className="text-[#C5D4CA] flex-1 text-left">Privacy Settings</ButtonText>
                </HStack>
                <Icon as={ChevronRightIcon} className="text-[#C5D4CA]" />
              </Button>

              <Button variant="outline" className="justify-between border-[#C5D4CA]">
                <HStack space="md" className="items-center">
                  <Icon as={HelpCircle} className="text-[#C5D4CA]" size="sm" />
                  <ButtonText className="text-[#C5D4CA] flex-1 text-left">Help & Support</ButtonText>
                </HStack>
                <Icon as={ChevronRightIcon} className="text-[#C5D4CA]" />
              </Button>

              <Divider className="bg-[#C5D4CA] opacity-30" />

              <Button
                variant="outline"
                className="border-[#F9CD61] bg-[#1C1C1E] justify-between"
                onPress={handleLogout}
              >
                <HStack space="md" className="items-center">
                  <Icon as={LogOutIcon} className="text-[#F9CD61]" size="sm" />
                  <ButtonText className="text-[#F9CD61] font-semibold flex-1 text-left">Logout</ButtonText>
                </HStack>
                <Icon as={ChevronRightIcon} className="text-[#F9CD61]" />
              </Button>
            </VStack>
          </VStack>
        </Card>
      </VStack>
    </ScrollView>
  );
}
