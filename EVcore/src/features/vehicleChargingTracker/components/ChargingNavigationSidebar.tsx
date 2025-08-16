
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Battery, 
  History, 
  Activity, 
  BarChart3,
  Zap,
  Home,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  collapsed: boolean;
}

const menuItems = [
  {
    title: 'Charging Tracker',
    url: '/charging-tracker',
    icon: Battery,
    description: 'Start/End charging sessions'
  },
  {
    title: 'Charging History',
    url: '/charging-history',
    icon: History,
    description: 'View all charging sessions'
  },
  {
    title: 'Live Status',
    url: '/charging-status',
    icon: Activity,
    description: 'Current charging activity'
  },
  {
    title: 'Reports',
    url: '/charging-summary',
    icon: BarChart3,
    description: 'Analytics & reports'
  },
  {
    title: 'Energy Monitor',
    url: '/energy-monitor',
    icon: Zap,
    description: 'Power consumption tracking'
  },
  {
    title: 'Back to Dashboard',
    url: '/',
    icon: Home,
    description: 'Return to main dashboard'
  }
];

export const ChargingNavigationSidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (url: string) => {
    navigate(url);
  };

  return (
    <aside className={`bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} flex flex-col h-full`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">Energy Management</h3>
              <p className="text-xs text-gray-500">Charging & Power Systems</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <Zap className="w-6 h-6 text-green-600" />
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <li key={item.title}>
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation(item.url)}
                  className={`w-full justify-start gap-3 h-auto p-3 transition-all ${
                    isActive 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  } ${collapsed ? 'px-2 justify-center' : ''}`}
                  title={collapsed ? item.title : undefined}
                >
                  <item.icon className={`${collapsed ? 'w-5 h-5' : 'w-5 h-5'} shrink-0`} />
                  {!collapsed && (
                    <div className="text-left flex-1">
                      <div className="font-medium text-sm">{item.title}</div>
                      <div className="text-xs opacity-70">{item.description}</div>
                    </div>
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {!collapsed && (
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Energy Management v3.0
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
