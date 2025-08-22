import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import adminSettingsService, { 
  type AdminSettingsResponse, 
  type RolePermissions, 
  type ModulePermission 
} from '@/services/adminSettingsService';

interface UseAdminSettingsReturn {
  // State
  permissions: AdminSettingsResponse | null;
  loading: boolean;
  error: string | null;
  saving: boolean;

  // Actions
  fetchAllPermissions: () => Promise<void>;
  fetchRolePermissions: (role: string) => Promise<RolePermissions | null>;
  updateModulePermission: (role: string, moduleName: string, enabled: boolean, permissions?: string[]) => Promise<void>;
  updateRolePermissions: (role: string, modules: Array<{ name: string; enabled: boolean; permissions: string[] }>) => Promise<void>;
  resetRolePermissions: (role: string) => Promise<void>;
  
  // Utilities
  isModuleEnabled: (role: string, moduleName: string) => boolean;
  getModulePermissions: (role: string, moduleName: string) => string[];
  hasPermission: (role: string, moduleName: string, permission: string) => boolean;
}

export const useAdminSettings = (): UseAdminSettingsReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [permissions, setPermissions] = useState<AdminSettingsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has access to admin settings
  const canAccessAdminSettings = user?.role === 'super_admin';

  /**
   * Fetch all role permissions from backend
   */
  const fetchAllPermissions = useCallback(async () => {
    if (!canAccessAdminSettings) {
      setError('Access denied. Super admin privileges required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await adminSettingsService.getAllPermissions();
      setPermissions(data);
      console.log('Admin Settings: Loaded permissions for', Object.keys(data.permissions).length, 'roles');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load permissions';
      setError(errorMessage);
      toast({
        title: 'Error Loading Permissions',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [canAccessAdminSettings, toast]);

  /**
   * Fetch permissions for a specific role
   */
  const fetchRolePermissions = useCallback(async (role: string): Promise<RolePermissions | null> => {
    if (!canAccessAdminSettings) {
      toast({
        title: 'Access Denied',
        description: 'Super admin privileges required.',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const data = await adminSettingsService.getRolePermissions(role);
      
      // Update the permissions state with the new data
      setPermissions(prev => {
        if (!prev) return null;
        return {
          ...prev,
          permissions: {
            ...prev.permissions,
            [role]: data
          }
        };
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to load permissions for ${role}`;
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [canAccessAdminSettings, toast]);

  /**
   * Update a specific module's permission for a role
   */
  const updateModulePermission = useCallback(async (
    role: string, 
    moduleName: string, 
    enabled: boolean, 
    permissionsList?: string[]
  ) => {
    if (!canAccessAdminSettings) {
      toast({
        title: 'Access Denied',
        description: 'Super admin privileges required.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      // Optimistic update
      setPermissions(prev => {
        if (!prev?.permissions[role]) return prev;
        
        return {
          ...prev,
          permissions: {
            ...prev.permissions,
            [role]: {
              ...prev.permissions[role],
              modules: {
                ...prev.permissions[role].modules,
                [moduleName]: {
                  enabled,
                  permissions: permissionsList || prev.permissions[role].modules[moduleName]?.permissions || ['read']
                }
              }
            }
          }
        };
      });

      // Update in backend
      await adminSettingsService.updateModulePermission(role, moduleName, enabled, permissionsList);

      toast({
        title: 'Success',
        description: `${moduleName} permissions updated for ${role}`,
      });

      console.log(`Admin Settings: Updated ${moduleName} for ${role} - enabled: ${enabled}`);

    } catch (err) {
      // Revert optimistic update on error
      await fetchAllPermissions();
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to update permissions';
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [canAccessAdminSettings, fetchAllPermissions, toast]);

  /**
   * Update multiple modules for a role
   */
  const updateRolePermissions = useCallback(async (
    role: string, 
    modules: Array<{ name: string; enabled: boolean; permissions: string[] }>
  ) => {
    if (!canAccessAdminSettings) {
      toast({
        title: 'Access Denied',
        description: 'Super admin privileges required.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      // Optimistic update
      const moduleMap: { [key: string]: ModulePermission } = {};
      modules.forEach(module => {
        moduleMap[module.name] = {
          enabled: module.enabled,
          permissions: module.permissions
        };
      });

      setPermissions(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          permissions: {
            ...prev.permissions,
            [role]: {
              ...prev.permissions[role],
              modules: moduleMap
            }
          }
        };
      });

      // Update in backend
      await adminSettingsService.updateRolePermissions(role, modules);

      toast({
        title: 'Success',
        description: `Permissions updated for ${role} role`,
      });

      console.log(`Admin Settings: Bulk updated ${modules.length} modules for ${role}`);

    } catch (err) {
      // Revert optimistic update on error
      await fetchAllPermissions();
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to update permissions';
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [canAccessAdminSettings, fetchAllPermissions, toast]);

  /**
   * Reset role permissions to default
   */
  const resetRolePermissions = useCallback(async (role: string) => {
    if (!canAccessAdminSettings) {
      toast({
        title: 'Access Denied',
        description: 'Super admin privileges required.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      await adminSettingsService.resetRolePermissions(role);
      
      // Refresh permissions after reset
      await fetchAllPermissions();

      toast({
        title: 'Success',
        description: `Permissions reset to default for ${role} role`,
      });

      console.log(`Admin Settings: Reset permissions for ${role}`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset permissions';
      toast({
        title: 'Reset Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [canAccessAdminSettings, fetchAllPermissions, toast]);

  /**
   * Check if a module is enabled for a role
   */
  const isModuleEnabled = useCallback((role: string, moduleName: string): boolean => {
    return permissions?.permissions[role]?.modules[moduleName]?.enabled ?? false;
  }, [permissions]);

  /**
   * Get permissions for a specific module and role
   */
  const getModulePermissions = useCallback((role: string, moduleName: string): string[] => {
    return permissions?.permissions[role]?.modules[moduleName]?.permissions ?? [];
  }, [permissions]);

  /**
   * Check if a role has a specific permission for a module
   */
  const hasPermission = useCallback((role: string, moduleName: string, permission: string): boolean => {
    const modulePermissions = getModulePermissions(role, moduleName);
    return modulePermissions.includes(permission) && isModuleEnabled(role, moduleName);
  }, [getModulePermissions, isModuleEnabled]);

  // Load permissions on mount if user has access
  useEffect(() => {
    if (canAccessAdminSettings) {
      fetchAllPermissions();
    }
  }, [canAccessAdminSettings, fetchAllPermissions]);

  return {
    // State
    permissions,
    loading,
    error,
    saving,

    // Actions
    fetchAllPermissions,
    fetchRolePermissions,
    updateModulePermission,
    updateRolePermissions,
    resetRolePermissions,

    // Utilities
    isModuleEnabled,
    getModulePermissions,
    hasPermission,
  };
};

export default useAdminSettings;
