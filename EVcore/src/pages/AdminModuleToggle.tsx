import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Save, 
  Eye, 
  EyeOff, 
  Users, 
  Shield, 
  CheckCircle, 
  XCircle,
  Car,
  Database,
  UserPlus,
  Route,
  FileText,
  Zap,
  Clock,
  RefreshCw,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminSettings } from '@/hooks/useAdminSettings';

// Define feature structure with detailed permissions
interface FeaturePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
}

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  permissions: FeaturePermissions;
}

interface RolePermissions {
  enabled: boolean;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
}

const features: Feature[] = [
  {
    id: 'vehicle-deployment',
    name: 'Vehicle Deployment Tracker',
    description: 'Track vehicle IN/OUT operations and fleet management',
    icon: Car,
    category: 'Operations',
    permissions: {
      view: true,
      create: true,
      edit: true,
      delete: false,
      export: true
    }
  },
  {
    id: 'database-management',
    name: 'Database Management',
    description: 'Manage pilots, vehicles, and equipment records',
    icon: Database,
    category: 'Core',
    permissions: {
      view: true,
      create: true,
      edit: true,
      delete: true,
      export: true
    }
  },
  {
    id: 'driver-induction',
    name: 'Driver Induction',
    description: 'Complete driver onboarding and profile management',
    icon: UserPlus,
    category: 'HR',
    permissions: {
      view: true,
      create: true,
      edit: true,
      delete: false,
      export: false
    }
  },
  {
    id: 'trip-details',
    name: 'Trip Details',
    description: 'Trip logging and detailed route management',
    icon: Route,
    category: 'Operations',
    permissions: {
      view: true,
      create: false,
      edit: true,
      delete: false,
      export: true
    }
  },
  {
    id: 'offline-bookings',
    name: 'Offline Bookings',
    description: 'Manual booking creation and management',
    icon: FileText,
    category: 'Bookings',
    permissions: {
      view: true,
      create: true,
      edit: true,
      delete: true,
      export: true
    }
  },
  {
    id: 'charging-tracker',
    name: 'Vehicle Charging Tracker',
    description: 'Battery monitoring and charging station management',
    icon: Zap,
    category: 'Operations',
    permissions: {
      view: true,
      create: false,
      edit: true,
      delete: false,
      export: true
    }
  },
  {
    id: 'attendance',
    name: 'Attendance System',
    description: 'Employee attendance tracking and reporting',
    icon: Clock,
    category: 'HR',
    permissions: {
      view: true,
      create: false,
      edit: true,
      delete: false,
      export: true
    }
  }
];

// Role configuration
const roles = [
  {
    id: 'super-admin',
    name: 'Super Admin',
    description: 'Ultimate platform access with all permissions',
    color: 'bg-purple-100 text-purple-800',
    level: 10
  },
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full platform access with administrative permissions',
    color: 'bg-red-100 text-red-800',
    level: 9
  },
  {
    id: 'leadership',
    name: 'Leadership',
    description: 'Executive level access with strategic oversight',
    color: 'bg-indigo-100 text-indigo-800',
    level: 8
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Departmental management with operational control',
    color: 'bg-orange-100 text-orange-800',
    level: 7
  },
  {
    id: 'supervisor',
    name: 'Supervisor',
    description: 'Team supervision with limited administrative features',
    color: 'bg-blue-100 text-blue-800',
    level: 6
  },
  {
    id: 'lead',
    name: 'Team Lead',
    description: 'Team coordination with operational responsibilities',
    color: 'bg-teal-100 text-teal-800',
    level: 5
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Security focused access with monitoring capabilities',
    color: 'bg-yellow-100 text-yellow-800',
    level: 4
  },
  {
    id: 'hr',
    name: 'Human Resources',
    description: 'HR management with employee data access',
    color: 'bg-pink-100 text-pink-800',
    level: 4
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Financial data access with reporting capabilities',
    color: 'bg-emerald-100 text-emerald-800',
    level: 4
  },
  {
    id: 'pilot',
    name: 'Pilot/Driver',
    description: 'Basic operational access for field users',
    color: 'bg-green-100 text-green-800',
    level: 3
  }
];

const AdminModuleToggle = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Use the admin settings hook for backend integration
  const {
    permissions: rolePermissions,
    loading,
    error,
    updateModulePermission,
    resetRolePermissions,
    saving
  } = useAdminSettings();

  // Show loading state while fetching permissions
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <CardTitle>Loading Admin Settings</CardTitle>
            <CardDescription>
              Fetching role permissions from backend...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Error Loading Settings</CardTitle>
            <CardDescription className="text-red-600">
              {error}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Only allow super admin to access this page
  if (user?.role !== 'super-admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>
              This page requires Super Administrator privileges. Only Super Admins can manage role-based feature access.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const toggleFeatureForRole = async (roleId: string, featureId: string) => {
    if (!rolePermissions) return;

    try {
      // Get current enabled state
      const roleData = rolePermissions[roleId];
      if (!roleData) return;

      const moduleData = roleData.modules.find(m => m.name === featureId);
      const currentEnabled = moduleData ? moduleData.enabled : false;

      // Toggle the module
      await updateModulePermission(roleId, featureId, !currentEnabled);

      toast({
        title: "Module Updated",
        description: `${features.find(f => f.id === featureId)?.name} has been ${!currentEnabled ? 'enabled' : 'disabled'} for ${roles.find(r => r.id === roleId)?.name}.`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: `Failed to update module permissions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const togglePermissionForRole = async (roleId: string, featureId: string, permission: string) => {
    if (!rolePermissions) return;

    try {
      const roleData = rolePermissions[roleId];
      if (!roleData) return;

      const moduleData = roleData.modules.find(m => m.name === featureId);
      if (!moduleData) return;

      // Toggle the specific permission
      const currentPermissions = moduleData.permissions || [];
      const newPermissions = currentPermissions.includes(permission)
        ? currentPermissions.filter(p => p !== permission)
        : [...currentPermissions, permission];

      await updateModulePermission(roleId, featureId, moduleData.enabled, newPermissions);

      toast({
        title: "Permission Updated",
        description: `${permission} permission has been ${newPermissions.includes(permission) ? 'granted' : 'revoked'} for ${features.find(f => f.id === featureId)?.name}.`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: `Failed to update permission: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const handleResetRole = async (roleId: string) => {
    try {
      await resetRolePermissions(roleId);
      toast({
        title: "Role Reset",
        description: `Permissions for ${roles.find(r => r.id === roleId)?.name} have been reset to defaults.`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: `Failed to reset role permissions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const getFeatureStatusForRole = (roleId: string, featureId: string) => {
    if (!rolePermissions || !rolePermissions[roleId]) {
      return { enabled: false, permissions: [] };
    }

    const roleData = rolePermissions[roleId];
    const moduleData = roleData.modules.find(m => m.name === featureId);
    
    return {
      enabled: moduleData ? moduleData.enabled : false,
      permissions: moduleData ? moduleData.permissions || [] : []
    };
  };

  const hasPermission = (roleId: string, featureId: string, permission: string) => {
    const status = getFeatureStatusForRole(roleId, featureId);
    return status.permissions.includes(permission);
  };

  const getRoleEnabledFeaturesCount = (roleId: string) => {
    if (!rolePermissions || !rolePermissions[roleId]) return 0;
    
    const roleData = rolePermissions[roleId];
    return roleData.modules.filter(m => m.enabled).length;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Module Toggle</h1>
              <p className="text-gray-600 mt-1">
                Configure role-based access to platform features and modules
              </p>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Roles</p>
                    <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Features</p>
                    <p className="text-2xl font-bold text-gray-900">{features.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-sm text-gray-600">Active Configs</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {rolePermissions ? Object.keys(rolePermissions).length : 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Current User</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">{user?.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="role-view" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="role-view" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Role-Based View
            </TabsTrigger>
            <TabsTrigger value="feature-view" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Feature-Based View
            </TabsTrigger>
          </TabsList>

          {/* Role-Based View */}
          <TabsContent value="role-view">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {roles.map((role) => (
                <Card key={role.id} className="h-fit">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <div>
                          <CardTitle className="text-lg">{role.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {role.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={role.color}>
                        Level {role.level}
                      </Badge>
                    </div>
                    
                    {/* Role Stats */}
                    <div className="flex items-center gap-4 mt-2 pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-600">
                          {getRoleEnabledFeaturesCount(role.id)}/{features.length} enabled
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetRole(role.id)}
                        disabled={saving}
                        className="ml-auto"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Reset
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {features.map((feature) => {
                      const Icon = feature.icon;
                      const status = getFeatureStatusForRole(role.id, feature.id);
                      
                      return (
                        <div key={feature.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-gray-600" />
                              <span className="font-medium text-sm">{feature.name}</span>
                            </div>
                            <Switch
                              checked={status.enabled}
                              onCheckedChange={() => toggleFeatureForRole(role.id, feature.id)}
                              disabled={saving}
                            />
                          </div>
                          
                          {status.enabled && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {(['view', 'create', 'edit', 'delete', 'export'] as const).map((permission) => (
                                <div key={permission} className="flex items-center gap-1">
                                  <Switch
                                    checked={hasPermission(role.id, feature.id, permission)}
                                    onCheckedChange={() => togglePermissionForRole(role.id, feature.id, permission)}
                                    disabled={saving}
                                  />
                                  <span className="text-xs text-gray-600 capitalize">{permission}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Feature-Based View */}
          <TabsContent value="feature-view">
            <div className="space-y-6">
              {features.map((feature) => {
                const Icon = feature.icon;
                
                return (
                  <Card key={feature.id}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Icon className="w-6 h-6 text-blue-600" />
                        <div>
                          <CardTitle className="text-xl">{feature.name}</CardTitle>
                          <CardDescription>{feature.description}</CardDescription>
                        </div>
                        <Badge variant="outline" className="ml-auto">
                          {feature.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {roles.map((role) => {
                          const status = getFeatureStatusForRole(role.id, feature.id);
                          
                          return (
                            <div key={role.id} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{role.name}</span>
                                <Switch
                                  checked={status.enabled}
                                  onCheckedChange={() => toggleFeatureForRole(role.id, feature.id)}
                                  disabled={saving}
                                />
                              </div>
                              
                              {status.enabled && (
                                <div className="grid grid-cols-2 gap-1">
                                  {(['view', 'create', 'edit', 'delete', 'export'] as const).map((permission) => (
                                    <div key={permission} className="flex items-center gap-1">
                                      <Switch
                                        checked={hasPermission(role.id, feature.id, permission)}
                                        onCheckedChange={() => togglePermissionForRole(role.id, feature.id, permission)}
                                        disabled={saving}
                                      />
                                      <span className="text-xs text-gray-600 capitalize">{permission}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Save State Indicator */}
        {saving && (
          <div className="fixed bottom-4 right-4">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">Saving changes...</span>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminModuleToggle;
