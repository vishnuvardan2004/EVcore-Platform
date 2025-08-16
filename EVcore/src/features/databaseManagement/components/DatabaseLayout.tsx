import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  Database, 
  Car, 
  Zap, 
  Cpu, 
  Computer, 
  Building2,
  Users,
  UserCheck,
  BarChart3,
  Home,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems = [
  {
    title: 'Dashboard',
    icon: BarChart3,
    href: '/database',
    description: 'Overview and analytics'
  },
  {
    title: 'Asset Management',
    icon: Database,
    items: [
      {
        title: 'Vehicles',
        icon: Car,
        href: '/database/vehicles',
        description: 'Fleet vehicles and specifications'
      },
      {
        title: 'Charging Equipment',
        icon: Zap,
        href: '/database/charging-equipment',
        description: 'EV charging infrastructure'
      },
      {
        title: 'Electrical Equipment',
        icon: Cpu,
        href: '/database/electrical-equipment',
        description: 'Electrical systems and panels'
      },
      {
        title: 'IT Equipment',
        icon: Computer,
        href: '/database/it-equipment',
        description: 'Computing and network assets'
      },
      {
        title: 'Infrastructure & Furniture',
        icon: Building2,
        href: '/database/infra-furniture',
        description: 'Facilities and office equipment'
      }
    ]
  },
  {
    title: 'Resource Management',
    icon: Users,
    items: [
      {
        title: 'Employees',
        icon: Users,
        href: '/database/employees',
        description: 'Staff and employee records'
      },
      {
        title: 'Pilots',
        icon: UserCheck,
        href: '/database/pilots',
        description: 'Certified pilots and licenses'
      }
    ]
  },
  {
    title: 'Back to Dashboard',
    icon: Home,
    href: '/',
    description: 'Return to main dashboard'
  }
];

interface SidebarContentProps {
  currentPath: string;
  onItemClick?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ 
  currentPath, 
  onItemClick, 
  collapsed = false,
  onToggleCollapse 
}) => {
  const [expandedItems, setExpandedItems] = useState<string[]>(['Asset Management', 'Resource Management']);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const renderNavItem = (item: typeof sidebarItems[0]) => {
    const isActive = currentPath === item.href;
    const hasSubItems = 'items' in item && item.items;
    const isExpanded = expandedItems.includes(item.title);

    if (hasSubItems) {
      if (collapsed) {
        // Show collapsed group item with tooltip
        return (
          <div key={item.title} className="mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center cursor-pointer hover:scale-105 transition-all duration-200 shadow-lg mx-auto hover:shadow-xl">
              <item.icon className="w-5 h-5 text-white" />
            </div>
          </div>
        );
      }

      return (
        <div key={item.title} className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start text-left font-medium text-blue-700 hover:bg-blue-100"
            onClick={() => toggleExpanded(item.title)}
          >
            <item.icon className="w-4 h-4 mr-3" />
            {item.title}
          </Button>
          {isExpanded && (
            <div className="ml-7 space-y-1">
              {item.items.map((subItem) => {
                const isSubActive = currentPath === subItem.href;
                return (
                  <Link
                    key={subItem.href}
                    to={subItem.href}
                    onClick={onItemClick}
                    className={cn(
                      "flex items-center w-full px-3 py-2 text-sm rounded-xl transition-all duration-200 hover:scale-[1.02]",
                      isSubActive
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-[1.02]"
                        : "text-blue-600 hover:bg-blue-100 bg-white/50"
                    )}
                  >
                    <subItem.icon className="w-4 h-4 mr-3" />
                    <div>
                      <div className="font-medium">{subItem.title}</div>
                      <div className={cn(
                        "text-xs",
                        isSubActive ? "text-blue-100" : "text-blue-400"
                      )}>{subItem.description}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (collapsed) {
      // Show collapsed single item
      return (
        <Link
          key={item.href}
          to={item.href}
          onClick={onItemClick}
          className="block mb-3"
        >
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer hover:scale-105 transition-all duration-200 shadow-lg mx-auto hover:shadow-xl",
            isActive
              ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl"
              : "bg-gradient-to-br from-blue-400 to-blue-500"
          )}>
            <item.icon className="w-5 h-5 text-white" />
          </div>
        </Link>
      );
    }

    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={onItemClick}
        className={cn(
          "flex items-center w-full px-3 py-2 rounded-xl transition-all duration-200 hover:scale-[1.02]",
          isActive
            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-[1.02]"
            : "text-blue-700 hover:bg-blue-100 bg-white/50"
        )}
      >
        <item.icon className="w-4 h-4 mr-3" />
        <div>
          <div className="font-medium">{item.title}</div>
          <div className={cn(
            "text-xs",
            isActive ? "text-blue-100" : "text-blue-500"
          )}>{item.description}</div>
        </div>
      </Link>
    );
  };

  return (
    <div className="h-full bg-gradient-to-b from-blue-50 to-white border-r border-blue-200 shadow-lg">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 border-b border-blue-300">
        <div className="flex items-center justify-center">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Database className="w-6 h-6" />
              <div>
                <h2 className="text-lg font-bold">Master Database</h2>
                <p className="text-blue-100 text-sm">Asset & Resource Management</p>
              </div>
            </div>
          )}
          {collapsed && (
            <Database className="w-6 h-6" />
          )}
        </div>
      </div>
      
      <div className={cn(
        "p-4",
        collapsed ? "px-2 py-6" : "p-4"
      )}>
        <nav className={cn(
          "space-y-2",
          collapsed ? "space-y-3" : "space-y-2"
        )}>
          {sidebarItems.map(renderNavItem)}
        </nav>
      </div>
    </div>
  );
};

export const DatabaseLayout: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [localSidebarCollapsed, setLocalSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-full">
      {/* Database Sidebar */}
      <div className={cn(
        "bg-white border-r border-gray-200 shadow-sm transition-all duration-300 flex flex-col h-full",
        localSidebarCollapsed ? "w-16" : "w-80"
      )}>
        <SidebarContent 
          currentPath={location.pathname}
          collapsed={localSidebarCollapsed}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 right-4 z-50">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <SidebarContent 
            currentPath={location.pathname} 
            onItemClick={() => setSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Header with toggle button */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocalSidebarCollapsed(!localSidebarCollapsed)}
              className="text-gray-500 hover:text-gray-700"
            >
              {localSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Master Database</h1>
              <p className="text-gray-600 text-sm">Asset & Resource Management</p>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-6 bg-gradient-to-br from-gray-50 to-blue-50/30 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
