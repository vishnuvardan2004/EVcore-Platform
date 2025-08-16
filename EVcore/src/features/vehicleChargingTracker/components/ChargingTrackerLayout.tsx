
import React, { useState } from 'react';
import { ChargingNavigationSidebar } from './ChargingNavigationSidebar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ChargingTrackerLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const ChargingTrackerLayout: React.FC<ChargingTrackerLayoutProps> = ({ 
  children, 
  title, 
  subtitle 
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-full">
      {/* Energy Management Sidebar */}
      <ChargingNavigationSidebar collapsed={collapsed} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Header with toggle button */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="text-gray-500 hover:text-gray-700"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
            {title && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="text-gray-600 text-sm">{subtitle}</p>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Page Content */}
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
