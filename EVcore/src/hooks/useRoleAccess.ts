import { useAuth } from '@/contexts/AuthContext';

/**
 * Custom hook for role-based access control
 * Provides utilities for checking user permissions and feature access
 */
export const useRoleAccess = () => {
  const { user, hasRole, hasPermission, canAccessFeature } = useAuth();

  /**
   * Check if current user can perform a specific action on a feature
   */
  const canPerformAction = (featureId: string, action: 'view' | 'create' | 'edit' | 'delete' | 'export'): boolean => {
    if (!user || !canAccessFeature(featureId)) return false;
    
    // Super admin and admin can do everything
    if (user.role === 'super_admin' || user.role === 'admin') return true;
    
    // Define action permissions by role and feature
    const actionPermissions = {
      'employee': {
        'vehicle-deployment': ['view', 'create', 'edit', 'export'],
        'database-management': ['view', 'edit', 'export'],
        'driver-induction': ['view', 'create', 'edit', 'export'],
        'trip-details': ['view', 'create', 'edit', 'export'],
        'offline-bookings': ['view', 'create', 'edit', 'delete', 'export'],
        'charging-tracker': ['view', 'create', 'edit', 'export'],
        'attendance': ['view', 'edit', 'export'],
        'reports': ['view', 'export']
      },
      'pilot': {
        'vehicle-deployment': ['view'],
        'trip-details': ['view'],
        'charging-tracker': ['view']
      }
    };
    
    const userPermissions = actionPermissions[user.role as keyof typeof actionPermissions];
    return userPermissions?.[featureId]?.includes(action) || false;
  };

  /**
   * Get user role hierarchy level for comparison
   */
  const getRoleLevel = (): number => {
    const roleLevels = { 
      'super_admin': 10,
      'admin': 9,
      'employee': 5,
      'pilot': 3
    };
    return roleLevels[user?.role || 'pilot'] || 0;
  };

  /**
   * Check if user has minimum required role level
   */
  const hasMinimumRole = (requiredRole: string): boolean => {
    const roleLevels = { 
      'super_admin': 10,
      'admin': 9,
      'employee': 5,
      'pilot': 3
    };
    const userLevel = getRoleLevel();
    const requiredLevel = roleLevels[requiredRole as keyof typeof roleLevels];
    return userLevel >= requiredLevel;
  };

  /**
   * Get accessible features for current user
   */
  const getAccessibleFeatures = (): string[] => {
    if (!user) return [];
    
    const allFeatures = [
      'vehicle-deployment', 'database-management', 'driver-induction',
      'trip-details', 'offline-bookings', 'charging-tracker', 'attendance', 'reports'
    ];
    
    return allFeatures.filter(feature => canAccessFeature(feature));
  };

  /**
   * Check if user is super admin (can access admin settings)
   */
  const isSuperAdmin = (): boolean => {
    return hasRole('super_admin');
  };

  /**
   * Check if user is admin level or higher
   */
  const isAdmin = (): boolean => {
    return hasRole('super_admin') || hasRole('admin');
  };

  /**
   * Check if current user has access based on role list
   */
  const hasAccess = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return {
    user,
    hasRole,
    hasPermission,
    canAccessFeature,
    canPerformAction,
    getRoleLevel,
    hasMinimumRole,
    getAccessibleFeatures,
    isSuperAdmin,
    isAdmin,
    hasAccess
  };
};
