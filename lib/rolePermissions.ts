import { Role } from './authUtils';
import { Permission } from './permissions';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'admin:access',
    'content:upload',
    'content:edit',
    'user:manage',
  ],

  teacher: [
    'content:upload',
    'content:edit',
    'teacher:assign',
  ],

  student: [
    'student:view',
  ],

  parent: [
    'student:view',
    'parent:link',
  ],
};
