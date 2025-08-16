import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Car, 
  History, 
  Activity, 
  BarChart3,
  Users,
  Home,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  collapsed: boolean;
}

const menuItems = [
  {
    title: 'Vehicle Tracker',
    url: '/vehicle-tracker',
    icon: Car,
    description: 'Start deployment process'
  },
  {
    title: 'Ride History',
    url: '/ride-history',
    icon: History,
    description: 'View past deployments'
  },
  {
    title: 'Live Status',
    url: '/live-status',
    icon: Activity,
    description: 'Current deployments'
  },
  {
    title: 'Reports',
    url: '/deployment-reports',
    icon: BarChart3,
    description: 'Analytics & insights'
  },
  {
    title: 'Alerts',
    url: '/deployment-alerts',
    icon: Users,
    description: 'Notifications & warnings'
  },
  {
    title: 'Damages',
    url: '/vehicle-damages',
    icon: AlertTriangle,
    description: 'Vehicle damage reports'
  },
  {
    title: 'Back to Dashboard',
    url: '/',
    icon: Home,
    description: 'Return to main dashboard'
  }
];

export const VehicleDeploymentSidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (url: string) => {
    navigate(url);
  };

  return (
    <aside className={`bg-gradient-to-b from-slate-50 to-white border-r border-slate-200 shadow-lg transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} flex flex-col h-full backdrop-blur-sm`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-purple-600">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-lg">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Vehicle Deployment</h3>
              <p className="text-xs text-blue-100">Fleet Management System</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Car className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-3">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <li key={item.title}>
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation(item.url)}
                  className={`w-full justify-start gap-3 h-auto p-3 transition-all duration-200 rounded-xl ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-[1.02] border-0' 
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:shadow-md hover:transform hover:scale-[1.01] border border-transparent hover:border-slate-200'
                  } ${collapsed ? 'px-2 justify-center' : ''}`}
                  title={collapsed ? item.title : undefined}
                >
                  <div className={`${collapsed ? 'w-5 h-5' : 'w-5 h-5'} shrink-0 ${isActive ? 'text-white' : ''}`}>
                    <item.icon className="w-full h-full" />
                  </div>
                  {!collapsed && (
                    <div className="text-left flex-1">
                      <div className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-slate-800'}`}>
                        {item.title}
                      </div>
                      <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-slate-500'} mt-0.5`}>
                        {item.description}
                      </div>
                    </div>
                  )}
                  {!collapsed && isActive && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
        {!collapsed && (
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-xs text-slate-600 font-medium">
                System Online
              </p>
            </div>
            <p className="text-xs text-slate-500">
              Vehicle Deployment v2.0
            </p>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </aside>
  );
};
