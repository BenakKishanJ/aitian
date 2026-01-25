import React from 'react';
import { Link, router } from 'expo-router';
import { ArrowLeft, GraduationCap, UserCog, Users, Shield } from 'lucide-react-native';

/* Gluestack UI (local re-exports) */

// Layout
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { Box } from '@/components/ui/box'

// Typography
import { Text } from '@/components/ui/text'
import { Heading } from '@/components/ui/heading'

// Button
import { Button, ButtonText } from '@/components/ui/button'


type RoleRoute =
  | '/(auth)/register-student'
  | '/(auth)/register-teacher'
  | '/(auth)/register-parent'
  | '/(auth)/register-admin';

interface RoleCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  textColor: string;
  iconColor: string;
  href: RoleRoute;
}

export default function RegisterScreen() {
  const roles: RoleCard[] = [
    {
      id: 'student',
      title: 'Student',
      description: 'Access timetable, marks, attendance, and course materials',
      icon: GraduationCap,
      color: 'bg-blue-100 border-blue-200',
      textColor: 'text-blue-700',
      iconColor: '#3B82F6',
      href: '/(auth)/register-student',
    },
    {
      id: 'teacher',
      title: 'Teacher',
      description: 'Manage courses, take attendance, upload materials, and grade assignments',
      icon: Shield,
      color: 'bg-green-100 border-green-200',
      textColor: 'text-green-700',
      iconColor: '#10B981',
      href: '/(auth)/register-teacher',
    },
    {
      id: 'parent',
      title: 'Parent',
      description: 'Monitor your child\'s academic progress and receive updates',
      icon: Users,
      color: 'bg-purple-100 border-purple-200',
      textColor: 'text-purple-700',
      iconColor: '#8B5CF6',
      href: '/(auth)/register-parent',
    },
    {
      id: 'admin',
      title: 'Admin',
      description: 'Manage system, users, courses, and academic structure',
      icon: Shield,
      color: 'bg-orange-100 border-orange-200',
      textColor: 'text-orange-700',
      iconColor: '#F97316',
      href: '/(auth)/register-admin',
    },
  ];

  const handleRolePress = (href: RoleRoute) => {
    router.push(href);
  };
  return (
    <Box className="flex-1 px-6">
      <VStack className="flex-1" space="lg">
        {/* Header with Back Button */}
        <HStack className="items-center pt-4">
          <Link href="/(auth)/login" asChild>
            <Button variant="link" size="sm">
              <ArrowLeft size={20} color="#6B7280" />
            </Button>
          </Link>
          <Heading size="xl" className="flex-1 text-center text-gray-900">
            Create Account
          </Heading>
          <Box className="w-10" />
          {/* Spacer for balance */}
        </HStack>

        <Text className="text-center text-gray-600 mb-2">
          Select your role to continue registration
        </Text>

        {/* Role Cards Grid */}
        <VStack space="md" className="flex-1">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Link key={role.id} href={role.href} asChild>
                <Button
                  variant="outline"
                  className={`${role.color} border-2 h-auto py-5 active:opacity-90`}
                >
                  <HStack className="items-center w-full" space="md">
                    <Box className={`p-3 rounded-lg ${role.color.replace('100', '200')}`}>
                      <Icon size={24} color={role.iconColor} />
                    </Box>
                    <VStack className="flex-1 items-start" space="xs">
                      <Text className={`font-bold text-lg ${role.textColor}`}>
                        {role.title}
                      </Text>
                      <Text className="text-gray-600 text-sm text-left">
                        {role.description}
                      </Text>
                    </VStack>
                  </HStack>
                </Button>
              </Link>
            );
          })}
        </VStack>

        {/* Login Link */}
        <HStack className="justify-center py-6">
          <Text className="text-gray-600">Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <Button variant="link" size="sm">
              <ButtonText className="text-blue-500">Sign In</ButtonText>
            </Button>
          </Link>
        </HStack>
      </VStack>
    </Box>
  );
}
