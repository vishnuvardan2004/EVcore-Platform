
import React from 'react';
import { PageLayout } from '../../shared/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Attendance = () => {
  const navigate = useNavigate();

  return (
    <PageLayout 
      title="🕒 Attendance Management" 
      subtitle="Track employee & pilot attendance records"
    >
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">🕒</div>
            <CardTitle className="text-2xl">Attendance Management</CardTitle>
            <CardDescription>
              This module will help you track employee and pilot attendance records
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Features coming soon:
            </p>
            <ul className="text-left text-gray-600 space-y-2 max-w-md mx-auto">
              <li>• Clock-in/Clock-out tracking</li>
              <li>• Shift scheduling</li>
              <li>• Attendance reports</li>
              <li>• Leave management</li>
              <li>• Real-time status monitoring</li>
            </ul>
            <div className="pt-6">
              <Button onClick={() => navigate('/')} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Attendance;
