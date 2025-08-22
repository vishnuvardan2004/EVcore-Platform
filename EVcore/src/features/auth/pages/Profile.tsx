
import React from 'react';
import { PageLayout } from '../../shared/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

const Profile = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return null; // This shouldn't happen due to ProtectedRoute, but just in case
  }

  // Mock additional user data based on the authenticated user
  const userData = {
    name: user.role === 'admin' ? 'John Doe' : 'Jane Smith',
    role: user.role,
    email: user.email,
    hub: 'Main Office',
    employeeId: user.role === 'admin' ? 'EMP001' : 'SUP002',
    permissions: user.role === 'admin' 
      ? ['Vehicle Deployment', 'Report Generation', 'Alert Management', 'User Management', 'System Configuration']
      : ['Vehicle Deployment', 'Report Generation', 'Alert Management']
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <PageLayout 
      title="👤 Profile" 
      subtitle="Manage your account and preferences"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                <p className="text-lg font-semibold">{userData.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Employee ID</Label>
                <p className="text-lg font-semibold">{userData.employeeId}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Email</Label>
                <p className="text-lg font-semibold">{userData.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Hub Location</Label>
                <p className="text-lg font-semibold">{userData.hub}</p>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-600">Role</Label>
              <div className="mt-2">
                <Badge variant="secondary" className="text-sm px-3 py-1 capitalize">
                  {userData.role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>
              Your current system permissions and access levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {userData.permissions.map((permission, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{permission}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Account Settings
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Profile;
