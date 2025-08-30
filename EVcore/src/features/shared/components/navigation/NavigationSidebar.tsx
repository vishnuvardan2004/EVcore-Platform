
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  BarChart, 
  FileText, 
  Settings,
  Globe,
  FileCheck,
  LogOut,
  Car,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Wrench,
  Database,
  Users,
  Package,
  BarChart3,
  Zap
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarHeader,
  SidebarFooter
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

// Core Platform - 6 new modules based on RBAC system
const coreModules = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    description: "EVCORE Home",
    moduleId: "dashboard"
  }
];

// 6 Core Platform Modules
const platformModules = [
  {
    title: "Vehicle Deployment",
    url: "/vehicle-deployment", 
    icon: Car,
    description: "Fleet management & deployment",
    moduleId: "vehicle_deployment"
  },
  {
    title: "Smart Bookings",
    url: "/smart-bookings",
    icon: Calendar,
    description: "Booking management system",
    moduleId: "smart_bookings"
  },
  {
    title: "Data Hub",
    url: "/data-hub",
    icon: Database,
    description: "Centralized data management",
    moduleId: "data_hub"
  },
  {
    title: "Driver Onboarding", 
    url: "/driver-onboarding",
    icon: Users,
    description: "Pilot registration & management",
    moduleId: "driver_onboarding"
  },
  {
    title: "Trip Analytics",
    url: "/trip-analytics", 
    icon: BarChart3,
    description: "Trip insights & analytics",
    moduleId: "trip_analytics"
  },
  {
    title: "Energy Management",
    url: "/energy-management",
    icon: Zap,
    description: "Charging & energy tracking",
    moduleId: "energy_management"
  }
];

// Legacy menu items (for backward compatibility)
const legacyItems = [
  {
    title: "Driver Induction",
    url: "/driver-induction",
    icon: Users,
    description: "Register and manage pilots",
    moduleId: "driver_onboarding" // Maps to new module
  },
  {
    title: "Trip Details",
    url: "/trip-details",
    icon: Calendar,
    description: "Driver trip capture",
    moduleId: "trip_analytics" // Maps to new module
  },
  {
    title: "Smart Widgets",
    url: "/smart-widgets",
    icon: BarChart,
    description: "Real-time metrics",
    moduleId: "dashboard"
  },
  {
    title: "Global Reports",
    url: "/global-reports", 
    icon: FileText,
    description: "Platform reports",
    moduleId: "trip_analytics"
  },
  {
    title: "Database",
    url: "/database",
    icon: Database,
    description: "Asset & personnel management", 
    moduleId: "data_hub" // Maps to new module
  }
];

const vehicleDeploymentItems = [
  {
    title: "Vehicle Tracker",
    url: "/vehicle-tracker",
    icon: Car,
    description: "Deploy & track vehicles",
    moduleId: "vehicle_deployment"
  },
  {
    title: "Live Status",
    url: "/live-status",
    icon: MapPin,
    description: "Real-time deployments",
    moduleId: "vehicle_deployment"
  },
  {
    title: "Ride History",
    url: "/ride-history",
    icon: Calendar,
    description: "Trip records",
    moduleId: "trip_analytics"
  },
  {
    title: "Vehicle Damages",
    url: "/vehicle-damages",
    icon: Wrench,
    description: "Damage tracking",
    moduleId: "vehicle_deployment"
  },
  {
    title: "Alerts",
    url: "/deployment-alerts",
    icon: AlertTriangle,
    description: "System alerts",
    moduleId: "vehicle_deployment"
  },
  {
    title: "Reports",
    url: "/deployment-reports",
    icon: TrendingUp,
    description: "Analytics & insights",
    moduleId: "trip_analytics"
  }
];

const chargingItems = [
  {
    title: 'Charging Tracker', 
    url: '/charging-tracker', 
    icon: MapPin, 
    description: 'Start/End charging',
    moduleId: "energy_management"
  },
  {
    title: 'Charging History', 
    url: '/charging-history', 
    icon: FileText, 
    description: 'Session logs',
    moduleId: "energy_management"
  },
  {
    title: 'Charging Summary', 
    url: '/charging-summary', 
    icon: TrendingUp, 
    description: 'Aggregated metrics',
    moduleId: "energy_management"
  }
];

const systemItems = [
  {
    title: "Language",
    url: "/language",
    icon: Globe,
    description: "Language settings",
    moduleId: "dashboard"
  },
  {
    title: "Audit Logs",
    url: "/audit-logs",
    icon: FileCheck,
    description: "System activity",
    moduleId: "audit_logs"
  },
  {
    title: "Admin Settings",
    url: "/admin-settings",
    icon: Settings,
    description: "Platform configuration",
    moduleId: "admin_settings"
  }
];

export const NavigationSidebar: React.FC = () => {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();
  const { user, logout, canAccessFeature } = useAuth();

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  const handleLogout = () => {
    logout();
    setOpenMobile(false);
  };

  const isActive = (url: string) => {
    if (url === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(url);
  };

  // Filter items based on module access
  const filterByModuleAccess = (items: any[]) => {
    return items.filter(item => {
      if (!item.moduleId) return true; // No module restriction
      return canAccessFeature(item.moduleId);
    });
  };

  const renderMenuItem = (item: any) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton 
        asChild
        isActive={isActive(item.url)}
        className="mx-2 h-auto p-0"
      >
        <Link 
          to={item.url}
          onClick={handleLinkClick}
          className={`flex items-center gap-4 w-full p-3 rounded-2xl transition-all duration-200 ${
            isActive(item.url) 
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
              : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
          }`}
        >
          <item.icon className="w-5 h-5 shrink-0" />
          <div className="text-left flex-1">
            <div className="font-semibold text-sm">{item.title}</div>
            <div className="text-xs opacity-80">{item.description}</div>
          </div>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  // Get filtered menu items based on user role
  const getVisibleCoreModules = () => filterByModuleAccess(coreModules);
  const getVisiblePlatformModules = () => filterByModuleAccess(platformModules); 
  const getVisibleLegacyItems = () => filterByModuleAccess(legacyItems);
  const getVisibleVehicleItems = () => filterByModuleAccess(vehicleDeploymentItems);
  const getVisibleChargingItems = () => filterByModuleAccess(chargingItems);
  const getVisibleSystemItems = () => filterByModuleAccess(systemItems);

  return (
    <Sidebar className="border-r border-gray-700/50 bg-gradient-to-br from-gray-900 via-gray-800 to-black sidebar-no-scrollbar backdrop-blur-xl">
      <SidebarHeader>
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-xl font-bold text-white">⚡</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-xl font-black bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                EVZIP
              </h2>
              <p className="text-sm text-blue-400 font-medium">
                EVCORE Platform
              </p>
            </div>
          </div>
          {user && (
            <div className="mt-6 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl p-4 border border-gray-600/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {user.role.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {user.role === 'super_admin' ? 'Super Administrator' : 
                     user.role === 'admin' ? 'Administrator' : 
                     user.role === 'employee' ? 'Employee' : 'Pilot'}
                  </p>
                  <p className="text-xs text-blue-400">
                    Access Level: {user.role}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="overflow-y-auto sidebar-no-scrollbar py-6">
        {/* Dashboard */}
        <SidebarGroup>
          <div className="px-4 py-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Dashboard
            </h3>
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {getVisibleCoreModules().map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Core Platform Modules - 6 new modules */}
        {getVisiblePlatformModules().length > 0 && (
          <SidebarGroup className="mt-8">
            <div className="px-4 py-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Core Platform
              </h3>
            </div>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {getVisiblePlatformModules().map(renderMenuItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Legacy Features - Backward compatibility */}
        {getVisibleLegacyItems().length > 0 && (
          <SidebarGroup className="mt-8">
            <div className="px-4 py-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Legacy Features
              </h3>
            </div>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {getVisibleLegacyItems().map(renderMenuItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Charging */}
        {getVisibleChargingItems().length > 0 && (
          <SidebarGroup className="mt-8">
            <div className="px-4 py-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Charging
              </h3>
            </div>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {getVisibleChargingItems().map(renderMenuItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Vehicle Deployment */}
        {getVisibleVehicleItems().length > 0 && (
          <SidebarGroup className="mt-8">
            <div className="px-4 py-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Vehicle Deployment
              </h3>
            </div>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {getVisibleVehicleItems().map(renderMenuItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* System */}
        {getVisibleSystemItems().length > 0 && (
          <SidebarGroup className="mt-8">
            <div className="px-4 py-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                System
              </h3>
            </div>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {getVisibleSystemItems().map(renderMenuItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="p-4 border-t border-gray-700/50">
          <Button 
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start gap-4 text-gray-300 hover:text-red-300 hover:bg-red-900/20 rounded-2xl h-auto p-3 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <div className="text-left flex-1">
              <div className="font-semibold text-sm">Sign Out</div>
              <div className="text-xs opacity-80">Exit platform</div>
            </div>
          </Button>
          <div className="text-center mt-4">
            <p className="text-xs text-gray-500">
              EVCORE Platform v3.0
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
