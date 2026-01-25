import { useAuth } from './AuthContext';
import { ROLE_PERMISSIONS } from './rolePermissions';
import { Permission } from './permissions';

export function usePermissions() {
  const { role } = useAuth();

  const hasPermission = (permission: Permission) => {
    if (!role) return false;
    return ROLE_PERMISSIONS[role]?.includes(permission);
  };

  return { hasPermission };
}
