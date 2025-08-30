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
    
    // Super admin can do everything
    if (user.role === 'super_admin') return true;
    
    // Define action permissions by role and feature for the new 6-module system
    const actionPermissions = {
      'admin': {
        // Core 6 Platform Modules
        'vehicle_deployment': ['view', 'create', 'edit', 'delete', 'export'],
        'smart_bookings': ['view', 'create', 'edit', 'delete', 'export'],
        'data_hub': ['view', 'create', 'edit', 'delete', 'export'],
        'driver_onboarding': ['view', 'create', 'edit', 'delete', 'export'],
        'trip_analytics': ['view', 'create', 'edit', 'delete', 'export'],
        'energy_management': ['view', 'create', 'edit', 'delete', 'export'],
        // Administrative modules
        'admin_settings': ['view', 'create', 'edit'],
        // Legacy modules
        'dashboard': ['view'],
        'database_management': ['view', 'create', 'edit', 'export'],
        'global_reports': ['view', 'export']
      },
      'employee': {
        // Core 6 Platform Modules - Employee permissions (5 out of 6)
        'vehicle_deployment': ['view', 'create', 'edit', 'export'],
        'smart_bookings': ['view', 'create', 'edit', 'export'],
        'driver_onboarding': ['view', 'create', 'edit', 'export'],
        'trip_analytics': ['view', 'export'],
        'energy_management': ['view', 'create', 'edit', 'export'],
        // Legacy modules
        'dashboard': ['view'],
        'vehicle-deployment': ['view', 'create', 'edit', 'export'], // backward compatibility
        'driver-induction': ['view', 'create', 'edit', 'export'], // backward compatibility
        'trip-details': ['view', 'create', 'edit', 'export'], // backward compatibility
        'offline-bookings': ['view', 'create', 'edit', 'delete', 'export'], // backward compatibility
        'charging-tracker': ['view', 'create', 'edit', 'export'], // backward compatibility
        'attendance': ['view', 'edit', 'export'], // backward compatibility
        'reports': ['view', 'export'] // backward compatibility
      },
      'pilot': {
        // Core 6 Platform Modules - Pilot permissions (2 out of 6)
        'trip_analytics': ['view', 'export'],
        'energy_management': ['view', 'export'],
        // Legacy modules
        'dashboard': ['view'],
        'vehicle-deployment': ['view'], // backward compatibility
        'trip-details': ['view'], // backward compatibility
        'charging-tracker': ['view'] // backward compatibility
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
