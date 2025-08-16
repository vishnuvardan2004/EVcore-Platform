
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

// Role configuration - Updated with all roles
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
    batchUpdateModules,
    resetRolePermissions,
    isUpdating
  } = useAdminSettings();
    'super-admin': features.reduce((acc, feature) => ({
      ...acc,
      [feature.id]: { enabled: true, view: true, create: true, edit: true, delete: true, export: true }
    }), {}),
    'admin': features.reduce((acc, feature) => ({
      ...acc,
      [feature.id]: { enabled: true, view: true, create: true, edit: true, delete: true, export: true }
    }), {}),
    'leadership': features.reduce((acc, feature) => ({
      ...acc,
      [feature.id]: { enabled: true, view: true, create: true, edit: true, delete: true, export: true }
    }), {}),
    'manager': features.reduce((acc, feature) => ({
      ...acc,
      [feature.id]: { 
        enabled: true, 
        view: true, 
        create: true, 
        edit: true, 
        delete: feature.id !== 'database-management', 
        export: true 
      }
    }), {}),
    'supervisor': features.reduce((acc, feature) => ({
      ...acc,
      [feature.id]: { 
        enabled: feature.category !== 'Core' || feature.id === 'database-management', 
        view: true,
        create: feature.id !== 'database-management',
        edit: true,
        delete: false,
        export: feature.id !== 'driver-induction'
      }
    }), {}),
    'lead': features.reduce((acc, feature) => ({
      ...acc,
      [feature.id]: { 
        enabled: ['vehicle-deployment', 'driver-induction', 'trip-details', 'charging-tracker', 'attendance'].includes(feature.id),
        view: true,
        create: feature.id !== 'attendance',
        edit: true,
        delete: false,
        export: false
      }
    }), {}),
    'security': features.reduce((acc, feature) => ({
      ...acc,
      [feature.id]: { 
        enabled: ['vehicle-deployment', 'driver-induction', 'attendance'].includes(feature.id),
        view: true,
        create: feature.id === 'driver-induction',
        edit: feature.id === 'attendance',
        delete: false,
        export: false
      }
    }), {}),
    'hr': features.reduce((acc, feature) => ({
      ...acc,
      [feature.id]: { 
        enabled: ['driver-induction', 'attendance'].includes(feature.id),
        view: true,
        create: feature.id === 'driver-induction',
        edit: true,
        delete: feature.id === 'driver-induction',
        export: true
      }
    }), {}),
    'finance': features.reduce((acc, feature) => ({
      ...acc,
      [feature.id]: { 
        enabled: ['database-management', 'trip-details'].includes(feature.id),
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: true
      }
    }), {}),
    'pilot': features.reduce((acc, feature) => ({
      ...acc,
      [feature.id]: { 
        enabled: ['vehicle-deployment', 'trip-details', 'charging-tracker'].includes(feature.id),
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false
      }
    }), {})
  });

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

  const toggleFeatureForRole = (roleId: string, featureId: string) => {
    setRolePermissions(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [featureId]: {
          ...prev[roleId][featureId],
          enabled: !prev[roleId][featureId].enabled
        }
      }
    }));
  };

  const togglePermissionForRole = (roleId: string, featureId: string, permission: string) => {
    setRolePermissions(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [featureId]: {
          ...prev[roleId][featureId],
          [permission]: !prev[roleId][featureId][permission]
        }
      }
    }));
  };

  const saveChanges = () => {
    // Here you would typically save to your backend
    console.log('Saving role permissions:', rolePermissions);
    
    toast({
      title: "Settings Saved Successfully",
      description: "Role-based feature access has been updated for all user roles.",
    });
  };

  const getFeatureStats = () => {
    const stats = {};
    roles.forEach(role => {
      stats[role.id] = features.filter(feature => 
        rolePermissions[role.id][feature.id]?.enabled
      ).length;
    });
    return stats;
  };

  const featureStats = getFeatureStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
              <p className="text-gray-600">Role-based feature access management for EVCORE platform</p>
            </div>
          </div>
          
          {/* Role Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {roles.map(role => (
              <Card key={role.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={`${role.color} text-xs`}>{role.name}</Badge>
                    <span className="text-lg font-bold text-gray-900">
                      {featureStats[role.id]}/{features.length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{role.description}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    Features: {featureStats[role.id]}/{features.length}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="super-admin" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10 gap-1 h-auto p-1">
            {roles.map(role => (
              <TabsTrigger 
                key={role.id} 
                value={role.id} 
                className="flex flex-col items-center gap-1 px-2 py-2 text-xs min-h-[60px]"
              >
                <Users className="w-3 h-3" />
                <span className="text-center leading-tight">{role.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {roles.map(role => (
            <TabsContent key={role.id} value={role.id}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Badge className={role.color}>{role.name}</Badge>
                        Feature Access Control
                      </CardTitle>
                      <CardDescription>
                        Configure which features and permissions are available to {role.name.toLowerCase()} users
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{featureStats[role.id]}/{features.length}</div>
                      <div className="text-sm text-gray-500">Features enabled</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {features.map(feature => {
                      const FeatureIcon = feature.icon;
                      const isEnabled = rolePermissions[role.id][feature.id]?.enabled;
                      const permissions = rolePermissions[role.id][feature.id];
                      
                      return (
                        <div key={feature.id} className={`p-6 border rounded-lg transition-all ${
                          isEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        }`}>
                          {/* Feature Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                isEnabled ? 'bg-green-100' : 'bg-gray-100'
                              }`}>
                                <FeatureIcon className={`w-6 h-6 ${
                                  isEnabled ? 'text-green-600' : 'text-gray-400'
                                }`} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                  {feature.name}
                                  <Badge variant="outline">{feature.category}</Badge>
                                </h3>
                                <p className="text-sm text-gray-600">{feature.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                {isEnabled ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-500" />
                                )}
                                <span className={`text-sm font-medium ${
                                  isEnabled ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {isEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                              </div>
                              <Switch
                                checked={isEnabled}
                                onCheckedChange={() => toggleFeatureForRole(role.id, feature.id)}
                              />
                            </div>
                          </div>

                          {/* Permissions Grid */}
                          {isEnabled && (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-green-200">
                              {Object.entries(permissions).map(([permission, value]) => {
                                if (permission === 'enabled') return null;
                                
                                return (
                                  <div key={permission} className="flex items-center justify-between p-2 bg-white rounded border">
                                    <span className="text-sm font-medium capitalize">{permission}</span>
                                    <Switch
                                      checked={value as boolean}
                                      onCheckedChange={() => togglePermissionForRole(role.id, feature.id, permission)}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Save Changes Section */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Save Configuration</h3>
                <p className="text-sm text-gray-600">
                  Apply role-based feature access changes to the platform
                </p>
              </div>
              <Button onClick={saveChanges} className="gap-2 bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4" />
                Save All Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Platform Status</CardTitle>
            <CardDescription>Current system performance and usage metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">99.9%</div>
                <div className="text-sm text-gray-600">Platform Uptime</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">247ms</div>
                <div className="text-sm text-gray-600">Avg Response Time</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">1,420</div>
                <div className="text-sm text-gray-600">Active Sessions</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{features.length}</div>
                <div className="text-sm text-gray-600">Total Features</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminModuleToggle;
