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
    if (user.role === 'super-admin' || user.role === 'admin') return true;
    
    // Define action permissions by role and feature
    const actionPermissions = {
      'leadership': {
        'vehicle-deployment': ['view', 'create', 'edit', 'delete', 'export'],
        'database-management': ['view', 'create', 'edit', 'delete', 'export'],
        'driver-induction': ['view', 'create', 'edit', 'delete', 'export'],
        'trip-details': ['view', 'create', 'edit', 'delete', 'export'],
        'offline-bookings': ['view', 'create', 'edit', 'delete', 'export'],
        'charging-tracker': ['view', 'create', 'edit', 'delete', 'export'],
        'attendance': ['view', 'create', 'edit', 'delete', 'export'],
        'reports': ['view', 'create', 'edit', 'delete', 'export']
      },
      'manager': {
        'vehicle-deployment': ['view', 'create', 'edit', 'export'],
        'database-management': ['view', 'edit', 'export'],
        'driver-induction': ['view', 'create', 'edit', 'export'],
        'trip-details': ['view', 'edit', 'export'],
        'offline-bookings': ['view', 'create', 'edit', 'delete', 'export'],
        'charging-tracker': ['view', 'edit', 'export'],
        'attendance': ['view', 'edit', 'export'],
        'reports': ['view', 'export']
      },
      'supervisor': {
        'vehicle-deployment': ['view', 'create', 'edit', 'export'],
        'database-management': ['view', 'edit', 'export'],
        'driver-induction': ['view', 'create', 'edit'],
        'trip-details': ['view', 'edit', 'export'],
        'offline-bookings': ['view', 'create', 'edit', 'delete', 'export'],
        'charging-tracker': ['view', 'edit', 'export'],
        'attendance': ['view', 'edit', 'export']
      },
      'lead': {
        'vehicle-deployment': ['view', 'create', 'edit'],
        'driver-induction': ['view', 'create', 'edit'],
        'trip-details': ['view', 'edit'],
        'charging-tracker': ['view', 'edit'],
        'attendance': ['view', 'edit']
      },
      'security': {
        'vehicle-deployment': ['view'],
        'driver-induction': ['view', 'create'],
        'attendance': ['view', 'edit'],
        'reports': ['view']
      },
      'hr': {
        'driver-induction': ['view', 'create', 'edit', 'delete'],
        'attendance': ['view', 'edit', 'export'],
        'reports': ['view', 'export']
      },
      'finance': {
        'reports': ['view', 'export'],
        'database-management': ['view', 'export'],
        'trip-details': ['view', 'export']
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
      'super-admin': 10,
      'admin': 9,
      'leadership': 8,
      'manager': 7,
      'supervisor': 6,
      'lead': 5,
      'security': 4,
      'hr': 4,
      'finance': 4,
      'pilot': 3
    };
    return roleLevels[user?.role || 'pilot'] || 0;
  };

  /**
   * Check if user has minimum required role level
   */
  const hasMinimumRole = (requiredRole: string): boolean => {
    const roleLevels = { 
      'super-admin': 10,
      'admin': 9,
      'leadership': 8,
      'manager': 7,
      'supervisor': 6,
      'lead': 5,
      'security': 4,
      'hr': 4,
      'finance': 4,
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
    return hasRole('super-admin');
  };

  /**
   * Check if user is admin level or higher
   */
  const isAdmin = (): boolean => {
    return hasRole('super-admin') || hasRole('admin');
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
