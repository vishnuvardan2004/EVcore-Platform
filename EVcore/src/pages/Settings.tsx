
import React, { useState } from 'react';
import { PageLayout } from '../components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Save, Users, AlertTriangle } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    autoReminders: true,
    emailNotifications: true,
    overdueAlerts: true,
    defaultChecklistTimeout: 30,
    maxDeploymentHours: 8,
    requirePhotos: false
  });

  const handleSettingChange = (key: string, value: boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    console.log('Saving settings:', settings);
    // Settings save logic will be implemented here
  };

  return (
    <PageLayout 
      title="⚙️ Settings" 
      subtitle="Configure system preferences and administrative controls"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              System Configuration
            </CardTitle>
            <CardDescription>
              Manage deployment rules and notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Notification Settings</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-600">Send email alerts for important events</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Overdue Alerts</Label>
                  <p className="text-sm text-gray-600">Alert when vehicles are overdue for return</p>
                </div>
                <Switch
                  checked={settings.overdueAlerts}
                  onCheckedChange={(checked) => handleSettingChange('overdueAlerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto Reminders</Label>
                  <p className="text-sm text-gray-600">Automatically send return reminders</p>
                </div>
                <Switch
                  checked={settings.autoReminders}
                  onCheckedChange={(checked) => handleSettingChange('autoReminders', checked)}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Deployment Rules</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checklist-timeout">Checklist Timeout (minutes)</Label>
                  <Input
                    id="checklist-timeout"
                    type="number"
                    value={settings.defaultChecklistTimeout}
                    onChange={(e) => handleSettingChange('defaultChecklistTimeout', parseInt(e.target.value))}
                    min="1"
                    max="120"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-hours">Max Deployment Hours</Label>
                  <Input
                    id="max-hours"
                    type="number"
                    value={settings.maxDeploymentHours}
                    onChange={(e) => handleSettingChange('maxDeploymentHours', parseInt(e.target.value))}
                    min="1"
                    max="24"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Require Photos</Label>
                  <p className="text-sm text-gray-600">Mandatory photo uploads for all deployments</p>
                </div>
                <Switch
                  checked={settings.requirePhotos}
                  onCheckedChange={(checked) => handleSettingChange('requirePhotos', checked)}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveSettings} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage user roles and permissions (Admin only)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">John Doe</h4>
                  <p className="text-sm text-gray-600">Supervisor • john.doe@company.com</p>
                </div>
                <Button size="sm" variant="outline">Edit</Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">Jane Smith</h4>
                  <p className="text-sm text-gray-600">Admin • jane.smith@company.com</p>
                </div>
                <Button size="sm" variant="outline">Edit</Button>
              </div>
            </div>
            
            <div className="mt-4">
              <Button variant="outline">Add New User</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Database Connection</span>
                <span className="text-green-600 font-medium">✅ Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Backup</span>
                <span className="text-gray-600">Today at 3:00 AM</span>
              </div>
              <div className="flex items-center justify-between">
                <span>System Version</span>
                <span className="text-gray-600">v1.0.0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Settings;
