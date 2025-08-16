import React from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';

interface ProtectedFeatureProps {
  featureId: string;
  requiredRole?: 'admin' | 'supervisor' | 'pilot';
  requiredAction?: 'view' | 'create' | 'edit' | 'delete' | 'export';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wrapper component for role-based feature protection
 * Shows content only if user has required permissions
 */
export const ProtectedFeature: React.FC<ProtectedFeatureProps> = ({
  featureId,
  requiredRole,
  requiredAction = 'view',
  children,
  fallback
}) => {
  const { canAccessFeature, canPerformAction, hasMinimumRole } = useRoleAccess();

  // Check feature access
  if (!canAccessFeature(featureId)) {
    return fallback || (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-red-600 mb-2">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access the {featureId.replace('-', ' ')} feature.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  // Check role requirement
  if (requiredRole && !hasMinimumRole(requiredRole)) {
    return fallback || (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <CardTitle className="text-orange-600 mb-2">Insufficient Role</CardTitle>
          <CardDescription>
            This action requires {requiredRole} role or higher.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  // Check action permission
  if (!canPerformAction(featureId, requiredAction)) {
    return fallback || (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <CardTitle className="text-yellow-600 mb-2">Action Not Permitted</CardTitle>
          <CardDescription>
            You don't have permission to {requiredAction} in this feature.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  // User has all required permissions
  return <>{children}</>;
};

/**
 * Higher-order component for protecting entire pages
 */
export const withRoleProtection = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  featureId: string,
  requiredRole?: 'admin' | 'supervisor' | 'pilot'
) => {
  return (props: P) => (
    <ProtectedFeature 
      featureId={featureId} 
      requiredRole={requiredRole}
      requiredAction="view"
    >
      <WrappedComponent {...props} />
    </ProtectedFeature>
  );
};
